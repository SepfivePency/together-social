import React from 'react';
import { Home, User, Plus, Compass, MessageCircle } from 'lucide-react';
import { Group, ViewState } from '../types';

interface SidebarProps {
  groups: Group[];
  activeGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  onSelectView: (view: ViewState) => void;
  currentView: ViewState;
  showToast?: (msg: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onSelectView,
  currentView,
  showToast,
}) => {

  return (
    <div className="hidden md:flex w-[72px] bg-slate-900/80 backdrop-blur-md flex-col items-center py-4 gap-4 border-r border-slate-800 h-screen overflow-y-auto shrink-0 z-50">
      {/* Home Feed */}
      <button
        onClick={() => onSelectView(ViewState.HOME)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:bg-indigo-500 hover:text-white group relative
        ${currentView === ViewState.HOME ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'}`}
      >
        <Home size={24} />
        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
          Home Feed
        </span>
      </button>

      {/* Discovery */}
      <button
        onClick={() => onSelectView(ViewState.DISCOVERY)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:bg-green-500 hover:text-white group relative
        ${currentView === ViewState.DISCOVERY ? 'bg-green-500 text-white' : 'bg-slate-800 text-green-400'}`}
      >
        <Compass size={24} />
        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
          Discovery
        </span>
      </button>

      {/* Chat */}
      <button
        onClick={() => onSelectView(ViewState.CHAT)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:bg-pink-500 hover:text-white group relative
        ${currentView === ViewState.CHAT ? 'bg-pink-500 text-white' : 'bg-slate-800 text-pink-400'}`}
      >
        <MessageCircle size={24} />
        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
          Messages
        </span>
      </button>

      <div className="w-8 h-[2px] bg-slate-800 rounded-full" />

      {/* Group List */}
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelectGroup(group)}
          className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-200 hover:rounded-2xl border-2 group relative
          ${
            currentView === ViewState.GROUP && activeGroup?.id === group.id
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 rounded-2xl'
              : 'border-transparent hover:border-indigo-400'
          }`}
        >
          <img
            src={group.icon}
            alt={group.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
            {group.name}
          </span>
        </button>
      ))}

      {/* Add Group */}
      <button 
        onClick={() => showToast?.('Create Group feature coming soon!')}
        className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all duration-200 group relative"
      >
        <Plus size={24} />
        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
          Create Group
        </span>
      </button>
      
      <div className="flex-1" />

      {/* Profile */}
      <button 
        onClick={() => onSelectView(ViewState.PROFILE)}
        className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center transition-all duration-200 hover:bg-slate-700 group relative
         ${currentView === ViewState.PROFILE ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
      >
        <User size={24} />
        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
          My Profile
        </span>
      </button>
    </div>
  );
};