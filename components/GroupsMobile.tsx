import React from 'react';
import { Group } from '../types';

interface GroupsMobileProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export const GroupsMobile: React.FC<GroupsMobileProps> = ({ groups, onSelectGroup }) => {
  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full p-4 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">My Groups</h2>
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            You haven't joined any groups yet. Go to Discover to find some!
          </div>
        ) : (
          groups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors text-left"
            >
              <img src={group.icon} alt={group.name} className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-white text-lg truncate">{group.name}</h3>
                <p className="text-slate-400 text-sm truncate">{group.description}</p>
                <div className="text-xs text-slate-500 mt-2">{group.members} members</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
