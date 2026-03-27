import React from 'react';
import { Home, Compass, MessageCircle, User, Users } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onSelectView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onSelectView }) => {
  const items = [
    { view: ViewState.HOME, icon: Home, label: '首页', color: 'from-indigo-500 to-purple-500' },
    { view: ViewState.DISCOVERY, icon: Compass, label: '发现', color: 'from-emerald-500 to-cyan-500' },
    { view: ViewState.GROUPS_MOBILE, icon: Users, label: '群组', color: 'from-blue-500 to-indigo-500', activeAlso: ViewState.GROUP },
    { view: ViewState.CHAT, icon: MessageCircle, label: '消息', color: 'from-pink-500 to-rose-500' },
    { view: ViewState.PROFILE, icon: User, label: '我的', color: 'from-slate-400 to-slate-500' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-strong px-4 py-2 flex justify-between items-center z-50"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {items.map(({ view, icon: Icon, label, color, activeAlso }) => {
        const isActive = currentView === view || (activeAlso && currentView === activeAlso);
        return (
          <button key={view} onClick={() => onSelectView(view)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-300">
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? `bg-gradient-to-br ${color} shadow-lg` : ''}`}>
              <Icon size={20} className={isActive ? 'text-white' : 'text-white/40'} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};