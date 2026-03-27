import React, { useState, useEffect } from 'react';
import { Search, Users, PlusCircle, X, Lock } from 'lucide-react';
import { Group } from '../types';
import { supabase } from '../lib/supabase';

interface DiscoveryProps {
  showToast?: (msg: string) => void;
  onJoinGroup?: (group: Group) => void;
  currentUserId: string;
}

export const Discovery: React.FC<DiscoveryProps> = ({ showToast, onJoinGroup, currentUserId }) => {
  const [search, setSearch] = useState('');
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllGroups(); }, []);

  const fetchAllGroups = async () => {
    setLoading(true);

    // 1. Fetch all groups
    const { data: groups } = await supabase.from('groups').select('*, channels(*)').order('created_at', { ascending: false });

    // 2. Fetch groups I'm already in
    const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('user_id', currentUserId);
    const myGroupIds = new Set((myMemberships || []).map(m => m.group_id));
    setJoined(myGroupIds);

    // 3. Fetch my pending applications
    const { data: myApps } = await supabase.from('notifications').select('group_id').eq('actor_id', currentUserId).eq('type', 'apply_join').eq('status', 'pending');
    setRequested(new Set((myApps || []).map(a => a.group_id)));

    // 4. Count members per group
    if (groups) {
      const enriched = await Promise.all(groups.map(async g => {
        const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id);
        return { ...g, member_count: count || 0 };
      }));
      setAllGroups(enriched);
    }
    setLoading(false);
  };

  const handleJoin = async (g: any) => {
    if (g.is_private) {
      // Send application notification to group owner
      await supabase.from('notifications').insert({
        user_id: g.created_by,
        actor_id: currentUserId,
        group_id: g.id,
        type: 'apply_join'
      });
      setRequested(p => new Set(p).add(g.id));
      showToast?.('加入申请已发送，请等待审核！');
    } else {
      // Direct join
      await supabase.from('group_members').insert({ group_id: g.id, user_id: currentUserId, role: 'member' });
      setJoined(p => new Set(p).add(g.id));
      onJoinGroup?.({
        id: g.id, name: g.name, icon: g.icon, description: g.description || '', members: (g.member_count || 0) + 1,
        channels: g.channels || [], is_private: g.is_private, created_by: g.created_by,
      });
      showToast?.('成功加入群组！');
    }
  };

  const filtered = allGroups.filter(g =>
    !search || g.name?.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8 relative z-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8 space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold gradient-text">发现你的社区</h1>
          <p className="text-white/40 max-w-lg mx-auto">探索校园社团、社群和兴趣组织，与志同道合的人建立连接。</p>
          <div className="relative max-w-xl mx-auto mt-6 transition-transform duration-300 hover:scale-[1.02] focus-within:scale-[1.04]">
            <input type="text" placeholder="搜索群组…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full glass border border-white/8 text-white rounded-2xl py-3.5 px-12 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-white/20 shadow-xl" />
            <Search className="absolute left-4 top-4 text-white/20" size={18} />
            {search && <button onClick={() => setSearch('')} className="absolute right-4 top-4 text-white/20 hover:text-white"><X size={16} /></button>}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(g => {
              const isMember = joined.has(g.id);
              const isPending = requested.has(g.id);
              const isOwner = g.created_by === currentUserId;
              return (
                <div key={g.id} className="glass rounded-2xl overflow-hidden gradient-border group hover:bg-white/[0.07] transition-all">
                  <div className="h-36 overflow-hidden relative">
                    <img src={g.icon || 'https://picsum.photos/id/1/400/200'} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    <div className={`absolute top-2.5 right-2.5 glass text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${g.is_private ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {g.is_private ? <><Lock size={10} /> 私密</> : '🌐 公开'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-white mb-1 truncate">{g.name}</h3>
                    <p className="text-white/40 text-sm mb-4 line-clamp-2">{g.description || '暂无简介'}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-white/30 text-sm"><Users size={14} />{g.member_count} 人</div>
                      {isOwner ? (
                        <span className="text-xs text-indigo-300 font-medium glass px-3 py-1.5 rounded-xl">我创建的</span>
                      ) : (
                        <button onClick={() => handleJoin(g)}
                          disabled={isMember || isPending}
                          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed btn-glow
                          ${g.is_private ? 'glass glass-hover text-white/60 hover:text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'}`}>
                          {isMember ? '✓ 已加入' : isPending ? '⏳ 已申请' : g.is_private ? '申请加入' : <><PlusCircle size={14} /> 加入</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="text-center py-16 text-white/20">
            <Users className="mx-auto mb-3 opacity-20" size={40} />
            <p>未找到匹配群组</p>
          </div>
        )}
      </div>
    </div>
  );
};