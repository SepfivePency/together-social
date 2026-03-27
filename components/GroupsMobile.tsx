import React from 'react';
import { Group } from '../types';
import { Users } from 'lucide-react';

interface GroupsMobileProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export const GroupsMobile: React.FC<GroupsMobileProps> = ({ groups, onSelectGroup }) => {
  return (
    <div className="flex-1 overflow-y-auto h-full p-4 pb-24 relative z-10">
      <h2 className="text-2xl font-bold gradient-text mb-6">我的群组</h2>
      {!groups.length ? (
        <div className="glass rounded-2xl p-10 text-center text-white/20">
          <Users className="mx-auto mb-3 opacity-20" size={36} />
          <p>暂无群组，去发现页面加入吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <button key={g.id} onClick={() => onSelectGroup(g)}
              className="w-full glass glass-hover rounded-2xl p-4 flex items-center gap-4 transition-all gradient-border text-left">
              <img src={g.icon} alt={g.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-1 ring-white/10" />
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-white truncate">{g.name}</h3>
                <p className="text-white/40 text-sm truncate">{g.description}</p>
                <div className="text-xs text-white/20 mt-1">{g.members} 位成员</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
