import React, { useState } from 'react';
import { X, Hash, Trash2 } from 'lucide-react';
import { Group } from '../types';

const PRESET_ICONS = [
  'https://picsum.photos/id/1/200/200', 'https://picsum.photos/id/20/200/200',
  'https://picsum.photos/id/40/200/200', 'https://picsum.photos/id/60/200/200',
  'https://picsum.photos/id/80/200/200', 'https://picsum.photos/id/100/200/200',
  'https://picsum.photos/id/110/200/200', 'https://picsum.photos/id/130/200/200',
];

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; description: string; icon: string; channels: string[]; is_private: boolean }) => void;
  showToast?: (msg: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate, showToast }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
  const [channels, setChannels] = useState(['general', 'announcements']);
  const [newChannel, setNewChannel] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const addChannel = () => {
    const ch = newChannel.trim().toLowerCase().replace(/\s+/g, '-');
    if (!ch || channels.includes(ch)) return;
    setChannels(prev => [...prev, ch]);
    setNewChannel('');
  };

  const handleCreate = () => {
    if (!name.trim()) { showToast?.('群组名称不能为空'); return; }
    
    onCreate({
      name: name.trim(),
      description: description.trim() || '新创建的群组',
      icon: selectedIcon,
      channels: channels,
      is_private: isPrivate
    });
    
    onClose();
    setName(''); setDescription(''); setChannels(['general', 'announcements']); setSelectedIcon(PRESET_ICONS[0]); setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in gradient-border"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-bold gradient-text">创建新群组</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Icon Picker */}
          <div>
            <label className="block text-xs text-white/30 mb-3 uppercase tracking-wider">选择图标</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(icon => (
                <button key={icon} onClick={() => setSelectedIcon(icon)}
                  className={`w-14 h-14 rounded-xl overflow-hidden ring-2 transition-all ${selectedIcon === icon ? 'ring-indigo-400 scale-105 shadow-lg shadow-indigo-500/30' : 'ring-white/10 hover:ring-white/20'}`}>
                  <img src={icon} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/30 mb-1.5 uppercase tracking-wider">群组名称 <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="输入群组名称"
              className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-white/20" />
          </div>

          <div>
            <label className="block text-xs text-white/30 mb-1.5 uppercase tracking-wider">群组简介</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="描述一下这个群组…"
              className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder-white/20" rows={3} />
          </div>

          <div>
            <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">群组类型</label>
            <div className="flex gap-3">
              <button onClick={() => setIsPrivate(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!isPrivate ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'glass text-white/50 hover:text-white'}`}>
                🌐 公开群组
              </button>
              <button onClick={() => setIsPrivate(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isPrivate ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'glass text-white/50 hover:text-white'}`}>
                🔒 私密群组
              </button>
            </div>
            <p className="text-[11px] text-white/25 mt-1.5">{isPrivate ? '需要审批才能加入' : '任何人都可以直接加入'}</p>
          </div>

          <div>
            <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">频道列表</label>
            <div className="space-y-2">
              {channels.map(ch => (
                <div key={ch} className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                  <Hash size={14} className="text-white/30" />
                  <span className="flex-1 text-sm text-white/70">{ch}</span>
                  {channels.length > 1 && (
                    <button onClick={() => setChannels(p => p.filter(c => c !== ch))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={newChannel} onChange={e => setNewChannel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChannel()}
                  placeholder="添加新频道" className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 placeholder-white/20" />
                <button onClick={addChannel} className="glass glass-hover text-white/50 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">+ 添加</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/5 flex gap-3 justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">取消</button>
          <button onClick={handleCreate} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-indigo-500/20 btn-glow">
            创建群组
          </button>
        </div>
      </div>
    </div>
  );
};
