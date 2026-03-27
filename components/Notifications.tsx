import React, { useState, useEffect } from 'react';
import { Bell, Check, X, UserMinus, Users, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  group_id: string;
  type: string; // 'apply_join' | 'approved' | 'rejected' | 'kicked' | 'disbanded'
  status: string;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
  group_name?: string;
}

interface NotificationsProps {
  currentUserId: string;
  showToast?: (msg: string) => void;
  onRefreshGroups?: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ currentUserId, showToast, onRefreshGroups }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (data) {
      // Enrich with actor and group names
      const enriched = await Promise.all(data.map(async (n: any) => {
        const [actorRes, groupRes] = await Promise.all([
          supabase.from('profiles').select('name, avatar_url').eq('id', n.actor_id).single(),
          n.group_id ? supabase.from('groups').select('name').eq('id', n.group_id).single() : Promise.resolve({ data: null }),
        ]);
        return {
          ...n,
          actor_name: actorRes.data?.name || '未知用户',
          actor_avatar: actorRes.data?.avatar_url,
          group_name: groupRes.data?.name || '未知群组',
        };
      }));
      setNotifications(enriched);
    }
    setLoading(false);
  };

  const handleApprove = async (n: Notification) => {
    if (n.type === 'friend_request') {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', n.actor_id).eq('friend_id', currentUserId);
      await supabase.from('notifications').update({ status: 'actioned' }).eq('id', n.id);
      await supabase.from('notifications').insert({ user_id: n.actor_id, actor_id: currentUserId, type: 'friend_accepted' });
      showToast?.(`已添加 ${n.actor_name} 为好友`);
    } else {
      // Add user to group_members
      await supabase.from('group_members').insert({ group_id: n.group_id, user_id: n.actor_id, role: 'member' });
      // Update notification status
      await supabase.from('notifications').update({ status: 'actioned' }).eq('id', n.id);
      // Send approved notification to the applicant
      await supabase.from('notifications').insert({ user_id: n.actor_id, actor_id: currentUserId, group_id: n.group_id, type: 'approved' });
      showToast?.(`已批准 ${n.actor_name} 加入群组`);
      onRefreshGroups?.();
    }
    fetchNotifications();
  };

  const handleReject = async (n: Notification) => {
    if (n.type === 'friend_request') {
      await supabase.from('friendships').update({ status: 'rejected' }).eq('user_id', n.actor_id).eq('friend_id', currentUserId);
      await supabase.from('notifications').update({ status: 'actioned' }).eq('id', n.id);
      showToast?.(`已拒绝 ${n.actor_name} 的好友申请`);
    } else {
      await supabase.from('notifications').update({ status: 'actioned' }).eq('id', n.id);
      await supabase.from('notifications').insert({ user_id: n.actor_id, actor_id: currentUserId, group_id: n.group_id, type: 'rejected' });
      showToast?.(`已拒绝 ${n.actor_name} 的申请`);
    }
    fetchNotifications();
  };

  const handleDismiss = async (id: string) => {
    await supabase.from('notifications').update({ status: 'read' }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'apply_join': return <Users size={20} className="text-indigo-400" />;
      case 'approved': return <Check size={20} className="text-emerald-400" />;
      case 'rejected': return <X size={20} className="text-red-400" />;
      case 'kicked': return <UserMinus size={20} className="text-orange-400" />;
      case 'disbanded': return <Trash2 size={20} className="text-red-400" />;
      case 'friend_request': return <Users size={20} className="text-cyan-400" />;
      case 'friend_accepted': return <Check size={20} className="text-emerald-400" />;
      default: return <Bell size={20} className="text-white/40" />;
    }
  };

  const renderMessage = (n: Notification) => {
    switch (n.type) {
      case 'apply_join': return <><strong className="text-white/90">{n.actor_name}</strong> 申请加入 <strong className="text-indigo-300">{n.group_name}</strong></>;
      case 'approved': return <>你已被批准加入 <strong className="text-emerald-300">{n.group_name}</strong></>;
      case 'rejected': return <>你加入 <strong className="text-red-300">{n.group_name}</strong> 的申请已被拒绝</>;
      case 'kicked': return <>你已被移出群组 <strong className="text-orange-300">{n.group_name}</strong></>;
      case 'disbanded': return <>群组 <strong className="text-red-300">{n.group_name}</strong> 已被创始人解散</>;
      case 'friend_request': return <><strong className="text-white/90">{n.actor_name}</strong> 请求添加你为好友</>;
      case 'friend_accepted': return <><strong className="text-white/90">{n.actor_name}</strong> 接受了你的好友请求</>;
      default: return <>未知通知</>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8 relative z-10">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center py-6 space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold gradient-text">通知 · 审核中心</h1>
          <p className="text-white/35 text-sm">管理群组申请、查看系统通知</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>暂无新通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className={`glass rounded-2xl p-5 gradient-border transition-all hover:bg-white/[0.04] ${n.status === 'pending' && n.type === 'apply_join' ? 'ring-1 ring-indigo-500/30' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center shrink-0">
                    {renderIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white/70 leading-relaxed">{renderMessage(n)}</p>
                      {n.status !== 'pending' && (
                        <button onClick={() => handleDismiss(n.id)} className="text-white/15 hover:text-white/40 p-1 transition-colors shrink-0"><X size={14} /></button>
                      )}
                    </div>
                    <p className="text-[11px] text-white/25 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>

                    {(n.type === 'apply_join' || n.type === 'friend_request') && n.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleApprove(n)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:scale-[1.03] transition-transform">
                          <Check size={14} /> 批准
                        </button>
                        <button onClick={() => handleReject(n)}
                          className="flex items-center gap-1.5 glass text-white/50 hover:text-red-400 hover:bg-red-500/10 text-xs px-4 py-2 rounded-xl font-medium transition-all">
                          <X size={14} /> 拒绝
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
