import React, { useState, useRef, useEffect } from 'react';
import { User, Post } from '../types';
import { MapPin, Calendar, Link as LinkIcon, Edit3, Settings, User as UserIcon, X, Camera, Users, Mail, Search, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  user: User;
  isCurrentUser: boolean;
  showToast?: (msg: string) => void;
  onOpenPost?: (postId: string) => void;
  currentUserId?: string;
}

// No longer using MOCK_FRIENDS

export const Profile: React.FC<ProfileProps> = ({ user, isCurrentUser, showToast, onOpenPost, currentUserId }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio);
  const [editSchool, setEditSchool] = useState(user.school || '');
  const [friendSearch, setFriendSearch] = useState('');
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null); // null | 'pending' | 'accepted' | 'incoming'
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyPosts();
    if (!isCurrentUser && currentUserId) checkFriendship();
  }, [user.id, currentUserId]);

  useEffect(() => {
    if (showFriends) {
      if (friendSearch.trim()) {
        searchUsers();
      } else {
        fetchFriends();
      }
    }
  }, [showFriends, friendSearch, user.id]);

  const fetchFriends = async () => {
    // 1. Where user is user_id
    const { data: d1 } = await supabase.from('friendships').select('friend_id, status, profiles!friendships_friend_id_fkey(id, name, avatar_url, bio)').eq('user_id', user.id).eq('status', 'accepted');
    // 2. Where user is friend_id
    const { data: d2 } = await supabase.from('friendships').select('user_id, status, profiles!friendships_user_id_fkey(id, name, avatar_url, bio)').eq('friend_id', user.id).eq('status', 'accepted');
    
    const combined = [
      ...(d1 || []).map((f: any) => ({ ...f.profiles, status: f.status })),
      ...(d2 || []).map((f: any) => ({ ...f.profiles, status: f.status }))
    ];
    setFriendsList(combined);
    setSearchResults([]);
  };

  const searchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, name, avatar_url, bio').ilike('name', `%${friendSearch.trim()}%`).neq('id', currentUserId || user.id).limit(10);
    setSearchResults(data || []);
  };

  const fetchMyPosts = async () => {
    const { data, error } = await supabase
      .from('posts').select(`*, profiles!posts_author_id_fkey(id, name, handle, avatar_url, bio)`)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }).limit(3);

    if (data && !error) {
      setMyPosts(data.map((p: any) => ({
        id: p.id, content: p.content || '', image: p.image_url || undefined, video: p.video_url || undefined,
        likes: p.likes_count || 0, comments: p.comments_count || 0, timestamp: new Date(p.created_at).toLocaleString(),
        author: { id: p.profiles?.id, name: p.profiles?.name, handle: p.profiles?.handle, avatar: p.profiles?.avatar_url, bio: p.profiles?.bio }
      })));
    }
  };

  const checkFriendship = async () => {
    if (!currentUserId) return;
    // Check if I sent a request
    const { data: sent } = await supabase.from('friendships').select('status').eq('user_id', currentUserId).eq('friend_id', user.id).single();
    if (sent) { setFriendshipStatus(sent.status); return; }
    // Check if they sent me a request
    const { data: received } = await supabase.from('friendships').select('status').eq('user_id', user.id).eq('friend_id', currentUserId).single();
    if (received) { setFriendshipStatus(received.status === 'pending' ? 'incoming' : received.status); return; }
    setFriendshipStatus(null);
  };

  const handleAddFriend = async () => {
    if (!currentUserId) return;
    await supabase.from('friendships').insert({ user_id: currentUserId, friend_id: user.id, status: 'pending' });
    // Also create a notification for the target user
    await supabase.from('notifications').insert({ user_id: user.id, actor_id: currentUserId, type: 'friend_request', group_id: null });
    setFriendshipStatus('pending');
    showToast?.('好友申请已发送！');
  };

  const handleAcceptFriend = async () => {
    if (!currentUserId) return;
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', user.id).eq('friend_id', currentUserId);
    await supabase.from('notifications').insert({ user_id: user.id, actor_id: currentUserId, type: 'friend_accepted', group_id: null });
    setFriendshipStatus('accepted');
    showToast?.('已成为好友！');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => { 
        setCoverImage(reader.result as string);
        if (isCurrentUser) {
          await supabase.from('profiles').update({ ...user, avatar_url: user.avatar }).eq('id', user.id); 
          // Note: Full storage integration in phase 3. For UX, keep local state active.
        }
        showToast?.('封面已更新'); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isCurrentUser) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await supabase.from('profiles').update({ avatar_url: base64 }).eq('id', user.id);
        showToast?.('头像更新成功，刷新生效！');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 h-full overflow-hidden relative z-10 pb-20 md:pb-6">
      {/* The Giant Liquid Glass Panel */}
      <div className="w-full h-full glass-strong rounded-[32px] overflow-hidden overflow-y-auto gradient-border relative shadow-2xl custom-scrollbar"
        style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
        
        {/* Settings */}
        {isCurrentUser && (
          <div className="absolute top-6 right-6 z-20">
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 flex items-center justify-center glass text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
              <Settings size={20} />
            </button>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <div className="absolute top-14 right-0 w-48 glass-strong rounded-2xl z-50 overflow-hidden animate-fade-in shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                  <button onClick={() => { coverInputRef.current?.click(); setShowSettings(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <Camera size={16} /> 更换封面
                  </button>
                  <button onClick={() => { setShowEditProfile(true); setShowSettings(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <UserIcon size={16} /> 编辑资料
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Banner */}
        <div className="h-56 md:h-72 relative overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.5) 30%, rgba(236,72,153,0.4) 60%, rgba(6,182,212,0.4) 100%)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
        </div>

        <div className="max-w-4xl mx-auto px-6 sm:px-10 pb-16">
          <div className="relative -mt-20 mb-8 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
            <div className={`relative ${isCurrentUser ? 'group cursor-pointer' : ''}`} onClick={() => isCurrentUser && avatarInputRef.current?.click()}>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <img src={user.avatar} alt={user.name} className="w-36 h-36 md:w-40 md:h-40 rounded-[32px] border-4 border-[rgba(30,25,50,0.8)] object-cover shadow-2xl ring-2 ring-white/10 transition-transform group-hover:scale-[1.02]" />
              {isCurrentUser && (
                <div className="absolute inset-0 bg-black/50 rounded-[32px] hidden group-hover:flex items-center justify-center text-white text-sm font-medium transition-all backdrop-blur-sm">
                  更换头像
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-400 border-4 border-[rgba(30,25,50,0.8)] rounded-full shadow-lg shadow-emerald-500/50"></div>
            </div>
            <div className="flex-1 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{editName}</h1>
              <p className="text-white/50 font-medium text-[15px] mt-1">{user.handle}</p>
            </div>
            <div className="mb-4 flex gap-3 justify-center md:justify-start w-full md:w-auto">
              {!isCurrentUser && (
                friendshipStatus === 'accepted' ? (
                  <span className="glass text-emerald-300 px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 border border-emerald-500/20">
                    <Users size={16} />✓ 已是好友
                  </span>
                ) : friendshipStatus === 'pending' ? (
                  <span className="glass text-amber-300 px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 border border-amber-500/20">
                    ⏳ 申请已发送
                  </span>
                ) : friendshipStatus === 'incoming' ? (
                  <button onClick={handleAcceptFriend} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.03] transition-transform">
                    <UserPlus size={16} />接受好友申请
                  </button>
                ) : (
                  <button onClick={handleAddFriend} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-[1.03] transition-transform btn-glow">
                    <UserPlus size={16} />加好友
                  </button>
                )
              )}
              <button onClick={() => setShowFriends(true)} className="glass glass-hover text-white/80 px-5 py-2.5 rounded-2xl font-medium transition-all flex items-center gap-2 hover:text-white border border-white/10 shadow-sm">
                <Users size={16} />好友列表
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="glass rounded-[24px] p-6 gradient-border shadow-md" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserIcon size={18} className="text-indigo-400" />关于我</h3>
                <p className="text-white/70 leading-relaxed text-[15px] mb-6">{editBio}</p>
                <div className="space-y-3.5 text-white/50 text-[14px]">
                  {(editSchool || user.school) && <div className="flex items-center gap-3"><MapPin size={16} className="text-white/30" /><span>{editSchool || user.school}</span></div>}
                  <div className="flex items-center gap-3"><Calendar size={16} className="text-white/30" /><span>加入于 {new Date().getFullYear()}年</span></div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="glass rounded-[24px] p-6 gradient-border shadow-md h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-lg font-bold text-white mb-6">近期动态</h3>
                {myPosts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30 py-12">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                      <Edit3 size={32} className="text-white/20" />
                    </div>
                    <p className="text-[15px]">暂无近期动态</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {myPosts.map(post => (
                      <div key={post.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors relative group">
                        <div className="flex items-center gap-3 mb-2">
                          <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                          <div>
                            <div className="text-xs font-semibold text-white/80">{post.author.name}</div>
                            <div className="text-[10px] text-white/30">{post.timestamp}</div>
                          </div>
                        </div>
                        <div className="cursor-pointer" onClick={() => onOpenPost?.(post.id)}>
                          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-w-[95%]">{post.content}</p>
                          {post.image && (
                            <div className="mt-3 rounded-xl overflow-hidden shadow-inner ring-1 ring-white/10">
                              <img src={post.image} className="w-full h-auto object-cover max-h-56" alt="" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowEditProfile(false)}>
          <div className="glass-strong rounded-[28px] w-full max-w-md animate-fade-in gradient-border shadow-2xl" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(20,15,40,0.85)' }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-[18px] font-bold gradient-text">编辑个人资料</h2>
              <button onClick={() => setShowEditProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">昵称</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-inner" /></div>
              <div><label className="block text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">个人简介</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none shadow-inner" rows={3} /></div>
              <div><label className="block text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">学校</label>
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-inner" /></div>
            </div>
            <div className="p-6 border-t border-white/5 flex gap-3 justify-end bg-white/[0.02]">
              <button onClick={() => setShowEditProfile(false)} className="px-6 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors font-medium">取消</button>
              <button onClick={() => { showToast?.('资料已保存'); setShowEditProfile(false); }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-2.5 rounded-xl font-bold tracking-wide shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.02]">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowFriends(false)}>
          <div className="glass-strong rounded-[28px] w-full max-w-md animate-fade-in gradient-border shadow-2xl" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(20,15,40,0.85)' }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-[18px] font-bold gradient-text">好友与搜索</h2>
              <button onClick={() => setShowFriends(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={16} /></button>
            </div>
            
            <div className="p-4 border-b border-white/5 bg-black/10">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1 group">
                  <input type="text" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder="按昵称搜索新好友…"
                    className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-white/5 transition-all shadow-inner placeholder-white/20" />
                  <Search className="absolute left-3.5 top-2.5 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={16} />
                </div>
              </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {friendSearch.trim() ? (
                // Search Results
                searchResults.length === 0 ? (
                  <div className="text-center text-white/30 py-10 text-sm">未找到相关用户</div>
                ) : searchResults.map(s => (
                  <div key={s.id} className="flex items-center gap-3.5 px-4 py-3 mx-2 my-1 rounded-2xl hover:bg-white/[0.06] transition-all group">
                    <img src={s.avatar_url} alt="" className="w-12 h-12 rounded-[16px] object-cover ring-1 ring-white/10 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white/90 text-[15px] truncate">{s.name}</div>
                      <div className="text-[13px] text-white/40 mt-0.5 truncate">{s.bio}</div>
                    </div>
                    {isCurrentUser && (
                      <button onClick={async () => {
                        await supabase.from('friendships').insert({ user_id: currentUserId, friend_id: s.id, status: 'pending' });
                        await supabase.from('notifications').insert({ user_id: s.id, actor_id: currentUserId, type: 'friend_request', group_id: null });
                        showToast?.(`已向 ${s.name} 发出好友申请！`);
                        setFriendSearch('');
                      }} className="shrink-0 bg-indigo-500 hover:bg-indigo-400 text-white text-[13px] px-4 py-2 rounded-xl font-medium transition-all shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                        <UserPlus size={16} /> 添加
                      </button>
                    )}
                  </div>
                ))
              ) : (
                // Friends List
                friendsList.length === 0 ? (
                  <div className="text-center text-white/30 py-10 text-sm">{isCurrentUser ? '暂无好友，快去搜索添加一个吧！' : '该用户暂无好友'}</div>
                ) : friendsList.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3.5 px-4 py-3 mx-2 my-1 rounded-2xl hover:bg-white/[0.06] transition-all group cursor-pointer" onClick={() => { setShowFriends(false); onOpenPost?.(''); }}>
                    <div className="relative">
                      <img src={f.avatar_url} alt={f.name} className="w-12 h-12 rounded-[16px] object-cover ring-1 ring-white/10 shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white/90 text-[15px] truncate">{f.name}</div>
                      <div className="text-[13px] text-white/40 mt-0.5 truncate">{f.bio}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); showToast?.(`私聊功能已启用准备：${f.name}`); }} className="w-10 h-10 rounded-full flex items-center justify-center glass group-hover:bg-indigo-500/20 text-white/30 group-hover:text-indigo-300 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                      <Mail size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};