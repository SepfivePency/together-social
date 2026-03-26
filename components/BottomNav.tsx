import React from 'react';
import { Home, Compass, MessageCircle, User, Users } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onSelectView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onSelectView }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center z-50">
      <button
        onClick={() => onSelectView(ViewState.HOME)}
        className={`flex flex-col items-center gap-1 ${currentView === ViewState.HOME ? 'text-indigo-400' : 'text-slate-500'}`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button
        onClick={() => onSelectView(ViewState.DISCOVERY)}
        className={`flex flex-col items-center gap-1 ${currentView === ViewState.DISCOVERY ? 'text-green-400' : 'text-slate-500'}`}
      >
        <Compass size={24} />
        <span className="text-[10px] font-medium">Discover</span>
      </button>

      <button
        onClick={() => onSelectView(ViewState.GROUPS_MOBILE)}
        className={`flex flex-col items-center gap-1 ${currentView === ViewState.GROUPS_MOBILE || currentView === ViewState.GROUP ? 'text-blue-400' : 'text-slate-500'}`}
      >
        <Users size={24} />
        <span className="text-[10px] font-medium">Groups</span>
      </button>

      <button
        onClick={() => onSelectView(ViewState.CHAT)}
        className={`flex flex-col items-center gap-1 ${currentView === ViewState.CHAT ? 'text-pink-400' : 'text-slate-500'}`}
      >
        <MessageCircle size={24} />
        <span className="text-[10px] font-medium">Chat</span>
      </button>

      <button
        onClick={() => onSelectView(ViewState.PROFILE)}
        className={`flex flex-col items-center gap-1 ${currentView === ViewState.PROFILE ? 'text-slate-200' : 'text-slate-500'}`}
      >
        <User size={24} />
        <span className="text-[10px] font-medium">Me</span>
      </button>
    </div>
  );
};