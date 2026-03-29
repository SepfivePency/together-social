import React, { useState, useEffect, useRef } from 'react';
import { Hash, Volume2, Users, Search, Settings, Send, LogOut, BellOff, Bell, Link as LinkIcon, Menu, X, Image as ImageIcon, Plus, Tag, Video as VideoIcon, Trash2, UserMinus } from 'lucide-react';
import { Group, Channel, Message, User } from '../types';
import { supabase } from '../lib/supabase';

const EMOJI_LIST = ['😀','😂','🥰','😎','🥺','😭','😡','👍','🎉','❤️','✨','🔥','🤔','👀','🙏','💪'];

interface GroupViewProps {
  group: Group;
  currentUser: User;
  showToast?: (msg: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onDisbandGroup?: (groupId: string) => void;
}

export const GroupView: React.FC<GroupViewProps> = ({ group, currentUser, showToast, onLeaveGroup, onDisbandGroup }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>(group.channels[0]);
  const [channels, setChannels] = useState<Channel[]>(group.channels);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMobileChannels, setShowMobileChannels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [memberList, setMemberList] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const CHANNEL_COLORS = ['from-red-500 to-orange-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-yellow-500 to-amber-500', 'from-purple-500 to-violet-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-500', 'from-teal-500 to-cyan-500'];

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(id, name, handle, avatar_url, bio)')
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id, senderId: m.profiles?.id, senderName: m.profiles?.name,
          senderAvatar: m.profiles?.avatar_url, content: m.content, timestamp: new Date(m.created_at).toLocaleString()
        })));
      } else {
        setMessages([]);
      }
    };
    fetchMessages();

    // 2. Subscribe to Realtime inserts
    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${activeChannel.id}`
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Don't duplicate if we already added it locally
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          // Fetch the sender profile
          return prev; // temporary, will be replaced below
        });
        // Fetch sender profile for the new message
        const { data: profile } = await supabase.from('profiles').select('id, name, avatar_url').eq('id', newMsg.sender_id).single();
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          const newArray = [...prev, {
            id: newMsg.id,
            senderId: profile?.id || newMsg.sender_id,
            senderName: profile?.name || '用户',
            senderAvatar: profile?.avatar_url,
            content: newMsg.content,
            timestamp: new Date(newMsg.created_at).toLocaleString()
          }];
          return newArray.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      })
      .subscribe();

    // 3. Cleanup on channel switch or unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showToast?.('图片大小不能超过 5MB'); return; }
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { showToast?.('视频大小不能超过 50MB'); return; }
      const reader = new FileReader();
      reader.onload = () => setSelectedVideo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage && !selectedVideo) return;
    
    let contents = [];
    if (inputText.trim()) contents.push(inputText.trim());
    if (selectedImage) contents.push(`__IMG__${selectedImage}`);
    if (selectedVideo) contents.push(`__VID__${selectedVideo}`);
    
    setInputText(''); setSelectedImage(null); setSelectedVideo(null); setShowEmojiPicker(false);
    
    for (const content of contents) {
      const { data } = await supabase.from('messages').insert({
        channel_id: activeChannel.id, sender_id: currentUser.id, content
      }).select('*, profiles(id, name, handle, avatar_url, bio)').single();
      
      if (data) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          const newArray = [...prev, {
            id: data.id, senderId: data.profiles?.id, senderName: data.profiles?.name,
            senderAvatar: data.profiles?.avatar_url, content: data.content, timestamp: new Date(data.created_at).toLocaleString()
          }];
          return newArray.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleCreateTopic = () => {
    const name = newTopicName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    if (channels.find(c => c.name === name)) { showToast?.('该话题已存在'); return; }
    const newChannel: Channel = { id: `topic-${Date.now()}`, name, type: 'text' };
    setChannels(prev => [...prev, newChannel]);
    setNewTopicName('');
    setShowCreateTopic(false);
    showToast?.(`话题 #${name} 创建成功`);
  };

  const filteredMessages = messages.filter(msg =>
    !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden relative z-10 p-4 md:p-6 pb-20 md:pb-6">
      <div className="w-full h-full glass-strong rounded-[32px] overflow-hidden flex flex-col md:flex-row gradient-border shadow-2xl relative"
        style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
        
        {showMobileChannels && <div className="md:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowMobileChannels(false)} />}

        {/* Channels Sidebar */}
        <div className={`${showMobileChannels ? 'flex bg-black/60 backdrop-blur-3xl' : 'hidden'} md:flex absolute md:relative z-50 h-full w-72 flex-col shrink-0 transition-transform`}
          style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)' }}>
          <div className="h-20 flex items-center justify-between px-6 font-bold text-white border-b border-white/5">
            <span className="truncate gradient-text text-xl">{group.name}</span>
            <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white" onClick={() => setShowMobileChannels(false)}><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">频道列表</div>
            {channels.map((channel, idx) => (
              <button key={channel.id}
                onClick={() => { setActiveChannel(channel); setShowMobileChannels(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group
                ${activeChannel.id === channel.id ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${CHANNEL_COLORS[idx % CHANNEL_COLORS.length]}`} />
                {channel.type === 'text' ? <Hash size={16} className={activeChannel.id === channel.id ? 'text-white/60' : 'text-white/30'} /> : <Volume2 size={16} className={activeChannel.id === channel.id ? 'text-white/60' : 'text-white/30'} />}
                <span className="truncate text-[15px] font-medium">{channel.name}</span>
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-white/5">
              {showCreateTopic ? (
                <div className="p-3 bg-black/20 rounded-2xl animate-fade-in space-y-3 border border-white/5">
                  <input type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTopic()}
                    placeholder="例如: react-help" autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 placeholder-white/20" />
                  <div className="flex gap-2">
                    <button onClick={handleCreateTopic} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[13px] py-2 rounded-xl font-medium shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-transform">创建</button>
                    <button onClick={() => { setShowCreateTopic(false); setNewTopicName(''); }} className="text-white/40 hover:text-white text-[13px] px-3 transition-colors">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCreateTopic(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-white/40 hover:text-indigo-300 hover:bg-white/5 transition-all text-[14px] font-medium border border-dashed border-white/10 hover:border-indigo-500/30">
                  <Plus size={16} /><span>创建新话题</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-white/5 flex items-center gap-3 text-[13px] text-white/40">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Users size={14} className="text-white/50" />
            </div>
            <span><strong className="text-white/80">{group.members}</strong> 位成员</span>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-transparent to-black/10">
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 text-white font-bold text-lg">
              <button className="md:hidden text-white/50 hover:text-white mr-2 bg-white/5 w-10 h-10 rounded-full flex items-center justify-center" onClick={() => setShowMobileChannels(true)}>
                <Menu size={18} />
              </button>
              <div className="w-10 h-10 rounded-[14px] bg-white/5 flex items-center justify-center border border-white/10">
                <Hash size={20} className="text-white/60" />
              </div>
              <span className="truncate max-w-[150px] sm:max-w-md">{activeChannel.name}</span>
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="relative hidden sm:block">
                <input type="text" placeholder="搜索消息…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="bg-black/20 text-sm rounded-xl pl-10 pr-3 py-2 w-48 focus:w-64 transition-all text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 placeholder:text-white/30 border border-white/5 shadow-inner" />
                <Search size={14} className="absolute left-3.5 top-2.5 text-white/30" />
              </div>
              <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <Settings size={20} />
              </button>

              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                  <div className="absolute top-[52px] right-0 w-60 glass-strong rounded-2xl z-50 overflow-hidden animate-fade-in shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <h3 className="font-bold text-white text-[15px] truncate">{group.name}</h3>
                      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wider">社区管理</p>
                    </div>
                    <div className="p-1.5">
                      <button onClick={() => { setIsMuted(!isMuted); showToast?.(isMuted ? '已开启通知' : '已静音'); setShowSettings(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                        {isMuted ? <Bell size={16} /> : <BellOff size={16} />}{isMuted ? '开启通知' : '静音通知'}
                      </button>
                      <button onClick={() => { navigator.clipboard?.writeText(`https://together.app/invite/${group.id}`); showToast?.('邀请链接已复制'); setShowSettings(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                        <LinkIcon size={16} />复制邀请链接
                      </button>
                      <div className="h-px bg-white/10 my-1 mx-2" />
                      <button onClick={() => { setShowSettings(false); onLeaveGroup?.(group.id); showToast?.(`已退出`); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors">
                        <LogOut size={16} />退出群组
                      </button>

                      {group.created_by === currentUser.id && (
                        <>
                          <div className="h-px bg-white/10 my-1 mx-2" />
                          <button onClick={async () => {
                            setShowSettings(false);
                            const { data } = await supabase.from('group_members')
                              .select('user_id, role, profiles(id, name, avatar_url)')
                              .eq('group_id', group.id);
                            setMemberList((data || []).filter((m: any) => m.user_id !== currentUser.id));
                            setShowMembers(true);
                          }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300 rounded-xl transition-colors">
                            <Users size={16} />成员管理
                          </button>
                          <button onClick={async () => {
                            if (!confirm('确定要解散这个群组吗？所有成员将收到通知。')) return;
                            setShowSettings(false);
                            // Notify all members
                            const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', group.id);
                            if (members) {
                              const notifs = members.filter(m => m.user_id !== currentUser.id).map(m => ({
                                user_id: m.user_id, actor_id: currentUser.id, group_id: group.id, type: 'disbanded'
                              }));
                              if (notifs.length) await supabase.from('notifications').insert(notifs);
                            }
                            await supabase.from('groups').delete().eq('id', group.id);
                            onDisbandGroup?.(group.id);
                            showToast?.('群组已解散');
                          }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500/80 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors">
                            <Trash2 size={16} />解散群组
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar" ref={scrollRef}>
            {filteredMessages.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                <Search size={48} className="text-white/10" />
                <p>未找到匹配消息</p>
              </div>
            )}
            {filteredMessages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const isSequential = idx > 0 && filteredMessages[idx - 1].senderId === msg.senderId;
              const isImage = msg.content.startsWith('__IMG__');
              const isVideo = msg.content.startsWith('__VID__');
              return (
                <div key={msg.id} className={`flex gap-3.5 ${isSequential ? 'mt-1' : 'mt-6'} ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isSequential ? (
                    <img src={msg.senderAvatar} alt="" className="w-10 h-10 rounded-[14px] object-cover ring-1 ring-white/20 shadow-sm shrink-0" />
                  ) : <div className="w-10 shrink-0" />}
                  <div className={`flex flex-col min-w-0 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isSequential && (
                      <div className={`flex items-baseline gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="font-semibold text-[15px] text-white/90">{msg.senderName}</span>
                        <span className="text-[11px] text-white/30 font-medium">{msg.timestamp}</span>
                      </div>
                    )}
                    {isImage ? (
                      <div className="rounded-[20px] overflow-hidden max-w-[320px] ring-1 ring-white/15 shadow-lg">
                        <img src={msg.content.replace('__IMG__', '')} alt="" className="w-full h-auto object-cover" />
                      </div>
                    ) : isVideo ? (
                      <div className="rounded-[20px] overflow-hidden max-w-[320px] ring-1 ring-white/15 shadow-lg bg-black/50">
                        <video src={msg.content.replace('__VID__', '')} controls className="w-full h-auto object-cover max-h-[400px]" />
                      </div>
                    ) : (
                      <div className={`px-5 py-2.5 text-[15px] leading-relaxed break-words shadow-sm
                        ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] rounded-tr-[6px] text-white' 
                               : 'bg-white/10 text-white/90 rounded-[20px] rounded-tl-[6px] border border-white/5 backdrop-blur-md'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Media Preview */}
          {(selectedImage || selectedVideo) && (
            <div className="px-6 pb-2 z-10 flex gap-3">
              {selectedImage && (
                <div className="relative inline-block animate-fade-in shadow-lg">
                  <img src={selectedImage} alt="预览" className="h-24 rounded-2xl object-cover ring-2 ring-indigo-500/50" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-500/90 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg backdrop-blur-md transition-all scale-100 hover:scale-110"><X size={14} /></button>
                </div>
              )}
              {selectedVideo && (
                <div className="relative inline-block animate-fade-in shadow-lg">
                  <video src={selectedVideo} className="h-24 rounded-2xl object-cover ring-2 ring-indigo-500/50 bg-black/50" />
                  <button onClick={() => setSelectedVideo(null)} className="absolute -top-3 -right-3 bg-red-500/90 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg backdrop-blur-md transition-all scale-100 hover:scale-110"><X size={14} /></button>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 pt-2 shrink-0 z-10 relative">
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-6 bg-[rgba(20,15,40,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-wrap gap-2 w-64 z-50 animate-fade-in">
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => setInputText(prev => prev + e)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-xl transition-colors">{e}</button>
                ))}
              </div>
            )}
            <div className="bg-black/20 rounded-[28px] p-2 pr-4 flex items-end gap-3 shadow-inner border border-white/5 transition-all focus-within:bg-black/30 focus-within:border-white/10"
                 style={{ minHeight: '60px' }}>
              
              <div className="flex flex-col gap-1 mb-0.5 shrink-0 pl-1">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${showEmojiPicker ? 'text-indigo-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                  😀
                </button>
                
                <button onClick={() => videoInputRef.current?.click()} title="上传视频" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <VideoIcon size={20} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} title="上传图片" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <ImageIcon size={20} />
                </button>
              </div>
              
              <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={`在 #${activeChannel.name} 发送消息…`}
                className="flex-1 bg-transparent text-white max-h-40 min-h-[44px] py-3 focus:outline-none resize-none placeholder-white/30 text-[15px] leading-relaxed custom-scrollbar" />
                
              <button onClick={handleSendMessage} disabled={!inputText.trim() && !selectedImage && !selectedVideo}
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 mb-0.5
                ${(inputText.trim() || selectedImage || selectedVideo) ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:scale-105' : 'bg-white/5 text-white/20'}`}>
                <Send size={18} className={(inputText.trim() || selectedImage || selectedVideo) ? 'ml-0.5' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Management Overlay */}
      {showMembers && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowMembers(false)}>
          <div className="glass-strong rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col animate-fade-in gradient-border"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
              <h2 className="text-lg font-bold gradient-text">成员管理</h2>
              <button onClick={() => setShowMembers(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {memberList.length === 0 ? (
                <div className="text-center py-10 text-white/25">暂无其他成员</div>
              ) : memberList.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/[0.04] transition-all">
                  <img src={m.profiles?.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${m.user_id}`} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate">{m.profiles?.name || '未知用户'}</div>
                    <div className="text-[11px] text-white/30">{m.role}</div>
                  </div>
                  <button onClick={async () => {
                    if (!confirm(`确定要移除 ${m.profiles?.name || '该成员'} 吗？`)) return;
                    await supabase.from('group_members').delete().match({ group_id: group.id, user_id: m.user_id });
                    await supabase.from('notifications').insert({
                      user_id: m.user_id, actor_id: currentUser.id, group_id: group.id, type: 'kicked'
                    });
                    setMemberList(prev => prev.filter(x => x.user_id !== m.user_id));
                    showToast?.(`已移除 ${m.profiles?.name || '成员'}`);
                  }} className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all shrink-0">
                    <UserMinus size={14} /> 移除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};