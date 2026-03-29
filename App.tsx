import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';
import { GroupView } from './components/GroupView';
import { Profile } from './components/Profile';
import { Discovery } from './components/Discovery';
import { DirectMessages } from './components/DirectMessages';
import { BottomNav } from './components/BottomNav';
import { GroupsMobile } from './components/GroupsMobile';
import { Notifications } from './components/Notifications';
import { MOCK_GROUPS, MOCK_POSTS } from './constants';
import { Group, ViewState, User, Post } from './types';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.CHAT);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>(MOCK_GROUPS);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [chatWithUser, setChatWithUser] = useState<User | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchGroups(session.user.id);
        fetchGroups(session.user.id);
        fetchFeed(session.user.id);
        fetchFriends(session.user.id);
        fetchNotifications(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchGroups(session.user.id);
        fetchGroups(session.user.id);
        fetchFeed(session.user.id);
        fetchFriends(session.user.id);
        fetchNotifications(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
    return () => subscription.unsubscribe();
  }, []);

  const fetchFriends = async (userId: string) => {
    const { data: d1 } = await supabase.from('friendships').select('friend_id, status, profiles!friendships_friend_id_fkey(id, name, avatar_url, bio, handle)').eq('user_id', userId).eq('status', 'accepted');
    const { data: d2 } = await supabase.from('friendships').select('user_id, status, profiles!friendships_user_id_fkey(id, name, avatar_url, bio, handle)').eq('friend_id', userId).eq('status', 'accepted');
    
    const combined = [
      ...(d1 || []).map((f: any) => ({ id: f.profiles?.id, name: f.profiles?.name, handle: f.profiles?.handle, avatar: f.profiles?.avatar_url, bio: f.profiles?.bio })),
      ...(d2 || []).map((f: any) => ({ id: f.profiles?.id, name: f.profiles?.name, handle: f.profiles?.handle, avatar: f.profiles?.avatar_url, bio: f.profiles?.bio }))
    ].filter(u => u.id); // remove nulls
    
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    setFriends(unique);
  };

  const fetchNotifications = async (userId: string) => {
    // Only fetch unread count for the dock icon badge or animation
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending');
    setUnreadNotifications(count || 0);
  };

  const fetchFeed = async (userId: string) => {
    // 1. Get users who share at least one group with me
    const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
    const myGroupIds = (myMemberships || []).map(m => m.group_id);
    
    let visibleUserIds = new Set<string>([userId]); // Always see own posts
    
    if (myGroupIds.length > 0) {
      const { data: groupPeers } = await supabase.from('group_members').select('user_id').in('group_id', myGroupIds);
      (groupPeers || []).forEach(p => visibleUserIds.add(p.user_id));
    }

    // 2. Get accepted friends
    const { data: friends1 } = await supabase.from('friendships').select('friend_id').eq('user_id', userId).eq('status', 'accepted');
    const { data: friends2 } = await supabase.from('friendships').select('user_id').eq('friend_id', userId).eq('status', 'accepted');
    (friends1 || []).forEach(f => visibleUserIds.add(f.friend_id));
    (friends2 || []).forEach(f => visibleUserIds.add(f.user_id));

    const ids = Array.from(visibleUserIds);
    
    // 3. Fetch posts only from visible users
    const { data, error } = await supabase
      .from('posts').select(`*, profiles!posts_author_id_fkey(id, name, handle, avatar_url, bio)`)
      .in('author_id', ids)
      .order('created_at', { ascending: false }).limit(50);
      
    if (data && !error) {
      setFeedPosts(data.map((p: any) => ({
        id: p.id, content: p.content || '', image: p.image_url || undefined, video: p.video_url || undefined,
        likes: p.likes_count || 0, comments: p.comments_count || 0, timestamp: new Date(p.created_at).toLocaleString(),
        author: { id: p.profiles?.id, name: p.profiles?.name, handle: p.profiles?.handle, avatar: p.profiles?.avatar_url, bio: p.profiles?.bio }
      })));
    }
  };

  const fetchGroups = async (userId: string) => {
    const { data: members, error: memErr } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
    if (memErr || !members) return;
    
    const groupIds = members.map(m => m.group_id);
    if (groupIds.length === 0) { setMyGroups([]); return; }

    const { data: groups, error: grpErr } = await supabase.from('groups').select(`*, channels(*)`).in('id', groupIds);
    if (groups) {
      // Get member counts to fix "1 member" bug
      const { data: allMembers } = await supabase.from('group_members').select('group_id').in('group_id', groupIds);
      const memberCounts = (allMembers || []).reduce((acc: any, curr) => {
        acc[curr.group_id] = (acc[curr.group_id] || 0) + 1;
        return acc;
      }, {});
      
      const mappedGroups: Group[] = groups.map(g => ({
        id: g.id, name: g.name, icon: g.icon, description: g.description || '', members: memberCounts[g.id] || 1, channels: g.channels || [], created_by: g.created_by, is_private: g.is_private
      }));
      setMyGroups(mappedGroups);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleJoinGroup = (group: Group) => {
    if (!myGroups.find(g => g.id === group.id)) {
      setMyGroups(prev => [...prev, group]);
    }
  };

  const handleCreateGroup = async (payload: { name: string; description: string; icon: string; channels: string[]; is_private: boolean }) => {
    if (!session) return;
    
    // 1. Insert Group
    const { data: newGroup, error: grpErr } = await supabase.from('groups')
      .insert({ name: payload.name, icon: payload.icon, description: payload.description, created_by: session.user.id, is_private: payload.is_private || false })
      .select().single();

    if (grpErr || !newGroup) {
      showToast(grpErr?.message || '创建群组失败');
      return;
    }

    // 2. Insert Channels
    const channelInserts = payload.channels.map(c => ({ group_id: newGroup.id, name: c, type: 'text' }));
    const { data: newChannels } = await supabase.from('channels').insert(channelInserts).select();

    // 3. Insert Member
    await supabase.from('group_members').insert({ group_id: newGroup.id, user_id: session.user.id, role: 'owner' });

    const completeGroup: Group = {
      id: newGroup.id, name: newGroup.name, icon: newGroup.icon || '', description: newGroup.description || '',
      members: 1, channels: newChannels || [], is_private: newGroup.is_private, created_by: newGroup.created_by
    };

    setMyGroups(prev => [...prev, completeGroup]);
    setActiveGroup(completeGroup);
    setCurrentView(ViewState.GROUP);
    showToast(`群组「${completeGroup.name}」创建成功并已存入数据库！`);
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (session) {
      await supabase.from('group_members').delete().match({ group_id: groupId, user_id: session.user.id });
    }
    setMyGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
      setCurrentView(ViewState.HOME);
    }
  };

  const handleDisbandGroup = (groupId: string) => {
    setMyGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroup?.id === groupId) {
      setActiveGroup(null);
      setCurrentView(ViewState.HOME);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setActiveGroup(group);
    setCurrentView(ViewState.GROUP);
  };

  const handleViewSelect = (view: ViewState) => {
    setCurrentView(view);
    if (view !== ViewState.GROUP) {
      setActiveGroup(null);
    }
    if (view !== ViewState.PROFILE) {
      setViewingUser(null);
    }
    if (view !== ViewState.HOME) {
      setFocusedPostId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0c0a1a]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const currentUser: User = {
    id: session.user.id,
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
    handle: '@' + (session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, ''),
    avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${session.user.id}`,
    bio: session.user.user_metadata?.bio || '分享生活的新手',
    location: session.user.user_metadata?.location || '未知'
  };

  return (
    <div className="flex h-screen text-slate-100 font-sans overflow-hidden relative" style={{ background: 'transparent' }}>
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar
        groups={myGroups}
        friends={friends}
        activeGroup={activeGroup}
        onSelectGroup={handleGroupSelect}
        onSelectFriend={friend => { setChatWithUser(friend); setCurrentView(ViewState.CHAT); }}
        onSelectView={handleViewSelect}
        currentView={currentView}
        showToast={showToast}
        onCreateGroup={handleCreateGroup}
        unreadCount={unreadNotifications}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative w-full">
        {currentView === ViewState.HOME && (
          <Feed currentUser={currentUser} posts={feedPosts} showToast={showToast} groups={myGroups} 
                focusedPostId={focusedPostId} onClearFocusedPost={() => setFocusedPostId(null)}
                onAddPost={p => setFeedPosts([p, ...feedPosts])} 
                onUpdatePost={p => setFeedPosts(prev => prev.map(old => old.id === p.id ? p : old))}
                onDeletePost={id => setFeedPosts(prev => prev.filter(p => p.id !== id))}
                onUserClick={u => { setViewingUser(u); setCurrentView(ViewState.PROFILE); }} />
        )}

        {currentView === ViewState.GROUP && activeGroup && (
          <GroupView group={activeGroup} currentUser={currentUser} showToast={showToast} onLeaveGroup={handleLeaveGroup} onDisbandGroup={handleDisbandGroup} />
        )}

        {currentView === ViewState.PROFILE && (
          <Profile user={viewingUser || currentUser} isCurrentUser={!viewingUser || viewingUser.id === currentUser.id} showToast={showToast} onOpenPost={id => { setFocusedPostId(id); setCurrentView(ViewState.HOME); }} currentUserId={currentUser.id} onUserClick={u => { setViewingUser(u); setCurrentView(ViewState.PROFILE); }} />
        )}

        {currentView === ViewState.DISCOVERY && (
          <Discovery showToast={showToast} onJoinGroup={handleJoinGroup} currentUserId={currentUser.id} />
        )}

        {currentView === ViewState.CHAT && (
          <DirectMessages currentUser={currentUser} chatWithUser={chatWithUser} setChatWithUser={setChatWithUser} friends={friends} showToast={showToast} />
        )}

        {currentView === ViewState.NOTIFICATIONS && (
          <Notifications currentUserId={currentUser.id} showToast={showToast} 
            onRefreshGroups={() => session && fetchGroups(session.user.id)}
            onNotificationsRead={() => setUnreadNotifications(0)} 
          />
        )}

        {currentView === ViewState.GROUPS_MOBILE && (
          <GroupsMobile groups={myGroups} onSelectGroup={handleGroupSelect} />
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav currentView={currentView} onSelectView={handleViewSelect} />

      {/* Global Toast — compact glass pill */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-[100] animate-slide-up"
          style={{
            background: 'rgba(20,15,40,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '999px',
            padding: '6px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shrink-0" />
          <span className="text-white/80 text-xs font-medium whitespace-nowrap">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;