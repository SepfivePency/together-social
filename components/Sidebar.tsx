import React, { useState } from 'react';
import { Home, User, Plus, Compass, MessageCircle, Bell, LogOut } from 'lucide-react';
import { Group, ViewState, User as UserType } from '../types';
import { CreateGroupModal } from './CreateGroupModal';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  groups: Group[];
  friends?: UserType[];
  activeGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  onSelectFriend?: (friend: UserType) => void;
  onSelectView: (view: ViewState) => void;
  currentView: ViewState;
  showToast?: (msg: string) => void;
  onCreateGroup?: (group: Group) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups, friends = [], activeGroup, onSelectGroup, onSelectFriend, onSelectView, currentView, showToast, onCreateGroup, unreadCount = 0,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const isMuted = localStorage.getItem('notifications_muted') === 'true';
  const shouldAnimateBell = unreadCount > 0 && !isMuted;

  const navItems = [
    { id: 'home', view: ViewState.HOME, icon: Home, label: '首页', color: 'from-indigo-400 to-purple-500' },
    { id: 'discovery', view: ViewState.DISCOVERY, icon: Compass, label: '发现', color: 'from-emerald-400 to-cyan-400' },
    { id: 'chat', view: ViewState.CHAT, icon: MessageCircle, label: '消息', color: 'from-pink-400 to-rose-400' },
    { id: 'notifications', view: ViewState.NOTIFICATIONS, icon: Bell, label: '通知', color: 'from-amber-400 to-orange-400' },
  ];

  const isActive = (id: string, view?: ViewState, groupId?: string) => {
    if (groupId) return currentView === ViewState.GROUP && activeGroup?.id === groupId;
    return currentView === view;
  };

  return (
    <>
      {/* Expanded macOS-style Dock */}
      <div className="hidden md:flex w-[100px] h-screen flex-col items-center py-6 shrink-0 z-50 relative">
        {/* The dock container - full height floating glass pill */}
        <div className="w-[72px] h-full flex flex-col items-center py-6 px-1.5 rounded-[36px] relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(40px) saturate(2)',
            WebkitBackdropFilter: 'blur(40px) saturate(2)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>

          <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto pt-4 pb-20"
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
               
            <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>

            {/* Nav buttons */}
            {navItems.map(({ id, view, icon: Icon, label, color }) => {
              const active = isActive(id, view);
              const hovered = hoveredId === id;
              return (
                <button key={id}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectView(view)}
                  className="relative flex flex-col items-center group"
                  style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative
                    ${active ? `bg-gradient-to-br ${color} shadow-lg ring-1 ring-white/20` : 'hover:bg-white/10 bg-white/5'}`}
                    style={active ? { boxShadow: `0 4px 20px rgba(99,102,241,0.4)` } : {}}>
                    <Icon size={20} className={`${active ? 'text-white' : 'text-white/50'} ${(id === 'notifications' && shouldAnimateBell) ? 'animate-pulse text-amber-300 scale-110' : ''}`} />
                    {id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        {!isMuted && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-[rgba(20,15,40,0.8)]"></span>
                      </span>
                    )}
                  </div>
                  {active && <div className="mt-1.5 w-1 h-1 rounded-full bg-white/60" />}
                  {/* Tooltip */}
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-6 h-px my-2" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* Groups */}
            {groups.map(g => {
              const active = isActive('', undefined, g.id);
              const hovered = hoveredId === g.id;
              return (
                <button key={g.id}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectGroup(g)}
                  className="relative flex flex-col items-center group"
                  style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
                  <div className={`w-11 h-11 rounded-2xl overflow-hidden transition-all duration-200
                    ${active ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-transparent shadow-lg' : 'ring-1 ring-white/15 hover:ring-white/30'}`}>
                    <img src={g.icon} alt={g.name} className="w-full h-full object-cover" />
                  </div>
                  {active && <div className="mt-1.5 w-1 h-1 rounded-full bg-white/60" />}
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    {g.name}
                  </span>
                </button>
              );
            })}

            {/* Add group */}
            <button
              onMouseEnter={() => setHoveredId('add')}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setShowCreateModal(true)}
              className="relative flex flex-col items-center group my-1"
              style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hoveredId === 'add' ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/12 border border-dashed border-white/25 hover:border-white/50 transition-all">
                <Plus size={18} className="text-white/40 group-hover:text-white/80" />
              </div>
              <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                创建群组
              </span>
            </button>

            {/* Divider */}
            {friends.length > 0 && <div className="w-6 h-px my-2" style={{ background: 'rgba(255,255,255,0.15)' }} />}

            {/* Friends */}
            {friends.map(f => {
              const hovered = hoveredId === `f-${f.id}`;
              const active = currentView === ViewState.CHAT;
              return (
                <button key={`f-${f.id}`}
                  onMouseEnter={() => setHoveredId(`f-${f.id}`)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectFriend?.(f)}
                  className="relative flex flex-col items-center group mb-2"
                  style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
                  <div className={`w-11 h-11 rounded-full overflow-hidden transition-all duration-200
                    ${active ? 'ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-transparent shadow-lg' : 'ring-1 ring-white/15 hover:ring-white/30'}`}>
                    <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    {f.name}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-6 h-px my-2" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* Profile */}
            <button
              onMouseEnter={() => setHoveredId('profile')}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectView(ViewState.PROFILE)}
              className="relative flex flex-col items-center group"
              style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hoveredId === 'profile' ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all
                ${currentView === ViewState.PROFILE ? 'bg-white/20 ring-2 ring-white/40 shadow-lg' : 'bg-white/5 hover:bg-white/12 ring-1 ring-white/10'}`}>
                <User size={19} className={currentView === ViewState.PROFILE ? 'text-white' : 'text-white/50'} />
              </div>
              {currentView === ViewState.PROFILE && <div className="mt-1.5 w-1 h-1 rounded-full bg-white/60" />}
              <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                我的
              </span>
            </button>

            {/* Logout */}
            <button
              onMouseEnter={() => setHoveredId('logout')}
              onMouseLeave={() => setHoveredId(null)}
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="relative flex flex-col items-center group"
              style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: hoveredId === 'logout' ? 'scale(1.2) translateY(-3px)' : 'scale(1)' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-red-500/15 ring-1 ring-white/10 hover:ring-red-500/30 transition-all">
                <LogOut size={19} className="text-white/40 group-hover:text-red-400" />
              </div>
              <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 glass-strong text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                退出登录
              </span>
            </button>
          </div>

          {/* Together Logo at bottom */}
          <div className="absolute bottom-6 w-full flex flex-col items-center justify-center pointer-events-none z-10">
            <span className="text-[15px] tracking-wide text-transparent bg-clip-text font-bold"
                  style={{ 
                    fontFamily: "'Pacifico', cursive",
                    backgroundImage: 'linear-gradient(135deg, #a78bfa, #f472b6, #38bdf8)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                  }}>
              Together
            </span>
          </div>
        </div>

        {/* Dock reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.05), transparent)' }} />
      </div>

      <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={g => onCreateGroup?.(g)} showToast={showToast} />
    </>
  );
};