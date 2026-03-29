import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Search, Pin, PinOff, X, Trash2, BellOff, Bell, Flag, MessageCircle, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { Message, User } from '../types';
import { supabase } from '../lib/supabase';

interface DirectMessagesProps {
  currentUser: User;
  friends: User[];
  chatWithUser: User | null;
  setChatWithUser: (user: User | null) => void;
  showToast?: (msg: string) => void;
}

const EMOJI_LIST = ['😀','😂','🥰','😎','🥺','😭','😡','👍','🎉','❤️','✨','🔥','🤔','👀','🙏','💪'];

export const DirectMessages: React.FC<DirectMessagesProps> = ({ currentUser, friends, chatWithUser, setChatWithUser, showToast }) => {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const getDMChannelId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_');
  };

  useEffect(() => {
    if (!chatWithUser) {
      setMessages([]);
      return;
    }
    
    const channelId = getDMChannelId(currentUser.id, chatWithUser.id);
    
    // 1. Fetch existing
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(id, name, handle, avatar_url, bio)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id, senderId: m.profiles?.id || m.sender_id, senderName: m.profiles?.name || '未知',
          senderAvatar: m.profiles?.avatar_url, content: m.content, timestamp: new Date(m.created_at).toLocaleString()
        })));
      } else {
        setMessages([]);
      }
    };
    fetchMessages();

    // 2. Realtime Subscription
    const subscription = supabase
      .channel(`dm:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profile } = await supabase.from('profiles').select('id, name, avatar_url').eq('id', newMsg.sender_id).single();
        
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          const msgObj = {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            senderName: profile?.name || '未知',
            senderAvatar: profile?.avatar_url,
            content: newMsg.content,
            timestamp: new Date(newMsg.created_at).toLocaleString()
          };
          
          const newArray = [...prev, msgObj];
          return newArray.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatWithUser, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatWithUser]);

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

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage && !selectedVideo) return;
    if (!chatWithUser) return;
    
    const channelId = getDMChannelId(currentUser.id, chatWithUser.id);
    let contents = [];
    if (inputText.trim()) contents.push(inputText.trim());
    if (selectedImage) contents.push(`__IMG__${selectedImage}`);
    if (selectedVideo) contents.push(`__VID__${selectedVideo}`);
    
    setInputText('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setShowEmojiPicker(false);
    
    for (const content of contents) {
      const { data } = await supabase.from('messages').insert({
        channel_id: channelId, sender_id: currentUser.id, content
      }).select('*, profiles(id, name, handle, avatar_url, bio)').single();
      
      if (data) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          const msgObj = {
            id: data.id, senderId: data.profiles?.id || data.sender_id, senderName: data.profiles?.name || '我',
            senderAvatar: data.profiles?.avatar_url, content: data.content, timestamp: new Date(data.created_at).toLocaleString()
          };
          return [...prev, msgObj].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    }
  };

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = friends.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedUsers = filtered.filter(u => pinnedIds.includes(u.id));
  const unpinnedUsers = filtered.filter(u => !pinnedIds.includes(u.id));

  const renderSection = (users: User[], title: string) => {
    if (!users.length) return null;
    return (
      <div className="mb-4">
        <div className="px-5 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">{title}</div>
        <div className="space-y-1">
          {users.map(user => {
            const isPinned = pinnedIds.includes(user.id);
            return (
              <button key={user.id} onClick={() => setChatWithUser(user)}
                className={`w-[calc(100%-16px)] mx-2 p-3 flex items-center gap-3 transition-all group rounded-2xl
                ${chatWithUser?.id === user.id ? 'bg-white/[0.08] shadow-sm' : 'hover:bg-white/[0.04]'}`}>
                <div className="relative shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-[18px] object-cover ring-1 ring-white/10 shadow-md" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="font-semibold text-white/90 truncate text-sm flex items-center gap-1.5">
                    {user.name}
                    {mutedIds.has(user.id) && <BellOff size={12} className="text-white/30" />}
                  </div>
                  <div className="text-[13px] text-white/40 truncate mt-0.5">{user.bio}</div>
                </div>
                <div onClick={e => togglePin(e, user.id)}
                  className={`p-1.5 rounded-xl transition-colors ${isPinned ? 'text-indigo-400' : 'text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/60 hover:bg-white/10'}`}>
                  {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden relative z-10 p-4 md:p-6 pb-20 md:pb-6">
      {/* The Giant Liquid Glass Panel */}
      <div className="w-full h-full glass-strong rounded-[32px] overflow-hidden flex gradient-border shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
        
        {/* Sidebar */}
        <div className={`${chatWithUser ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] flex-col shrink-0 relative`}
          style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)' }}>
          <div className="p-6 pb-4">
            <h2 className="font-bold text-white text-2xl mb-4 gradient-text">消息</h2>
            <div className="relative mt-2">
              <input type="text" placeholder="搜索对话…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40 placeholder-white/20 border border-white/5 transition-all shadow-inner" />
              <Search className="absolute left-3.5 top-3.5 text-white/30" size={16} />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-white/30 hover:text-white"><X size={14} /></button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
            {renderSection(pinnedUsers, '已置顶')}
            {renderSection(unpinnedUsers, '最近对话')}
            {!filtered.length && <div className="text-center text-white/30 text-sm py-12">无搜索结果</div>}
          </div>
        </div>

        {/* Chat Area */}
        {chatWithUser ? (
          <div className="flex-1 flex flex-col relative bg-gradient-to-br from-transparent to-black/10">
            {/* Header */}
            <div className="h-[76px] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-4">
                <button className="md:hidden w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all" onClick={() => setChatWithUser(null)}>←</button>
                <img src={chatWithUser.avatar} className="w-10 h-10 rounded-[14px] ring-1 ring-white/20 object-cover shadow-sm" alt="" />
                <div>
                  <div className="font-bold text-white/90 text-[15px]">{chatWithUser.name}</div>
                  <div className="text-[12px] text-white/40 flex items-center gap-1.5 mt-0.5">
                    {chatWithUser.bio}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="w-10 h-10 text-white/40 hover:text-white flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
                  <MoreVertical size={20} />
                </button>
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute top-[52px] right-0 w-56 glass-strong rounded-2xl z-50 overflow-hidden animate-fade-in shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                      <div className="p-1">
                        <button onClick={() => { setMutedIds(p => { const s = new Set(p); s.has(chatWithUser.id) ? s.delete(chatWithUser.id) : s.add(chatWithUser.id); return s; }); showToast?.(mutedIds.has(chatWithUser.id) ? '已取消静音' : '已静音'); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                          {mutedIds.has(chatWithUser.id) ? <Bell size={16} /> : <BellOff size={16} />}
                          {mutedIds.has(chatWithUser.id) ? '取消静音' : '静音对话'}
                        </button>
                        <button onClick={() => { showToast?.('已提交举报'); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-orange-400/80 hover:bg-orange-500/10 hover:text-orange-300 rounded-xl transition-colors">
                          <Flag size={16} /> 举报
                        </button>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        <button onClick={() => { showToast?.('对话已删除'); setShowMoreMenu(false); setChatWithUser(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors">
                          <Trash2 size={16} /> 删除对话
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar" ref={scrollRef}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const isSeq = idx > 0 && messages[idx - 1].senderId === msg.senderId;
                const isImage = msg.content.startsWith('__IMG__');
                const isVideo = msg.content.startsWith('__VID__');
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSeq ? 'mt-1' : 'mt-6'}`}>
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isSeq && !isMe && <span className="text-[12px] text-white/30 mb-1.5 ml-1 font-medium">{msg.senderName}</span>}
                      {isImage ? (
                        <div className="rounded-[20px] overflow-hidden max-w-[320px] ring-1 ring-white/15 shadow-lg">
                          <img src={msg.content.replace('__IMG__', '')} alt="" className="w-full h-auto object-cover" />
                        </div>
                      ) : isVideo ? (
                        <div className="rounded-[20px] overflow-hidden max-w-[320px] ring-1 ring-white/15 shadow-lg bg-black/50">
                          <video src={msg.content.replace('__VID__', '')} controls className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                      ) : (
                        <div className={`px-5 py-2.5 text-[14px] leading-relaxed break-words shadow-sm
                          ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[20px] rounded-br-[4px]' 
                                 : 'bg-white/10 text-white/90 rounded-[20px] rounded-bl-[4px] border border-white/5 backdrop-blur-md'}`}>
                          {msg.content}
                        </div>
                      )}
                      {!isSeq && <span className="text-[10px] text-white/20 mt-1 mx-2">{msg.timestamp}</span>}
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

            {/* Input */}
            <div className="p-6 pt-2 shrink-0 z-10 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-6 bg-[rgba(20,15,40,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-wrap gap-2 w-64 z-50 animate-fade-in">
                  {EMOJI_LIST.map(e => (
                    <button key={e} onClick={() => setInputText(prev => prev + e)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-xl transition-colors">{e}</button>
                  ))}
                </div>
              )}
              <div className="bg-black/20 rounded-[28px] p-2 pr-4 flex items-end gap-3 shadow-inner border border-white/5 transition-all focus-within:bg-black/30 focus-within:border-white/10" style={{ minHeight: '60px' }}>
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
                
                <textarea value={inputText} onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`发送消息给 ${chatWithUser.name}…`}
                  className="flex-1 bg-transparent text-white/90 py-3 max-h-40 min-h-[44px] focus:outline-none resize-none placeholder-white/30 text-[15px] leading-relaxed custom-scrollbar" />
                  
                <button onClick={handleSend} disabled={!inputText.trim() && !selectedImage && !selectedVideo}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 mb-0.5
                  ${(inputText.trim() || selectedImage || selectedVideo) ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:scale-105' : 'bg-white/5 text-white/20'}`}>
                  <Send size={18} className={(inputText.trim() || selectedImage || selectedVideo) ? 'ml-0.5' : ''} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-white/30 p-10 bg-gradient-to-br from-transparent to-black/10">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-2xl border border-white/5">
              <MessageCircle size={40} className="text-white/20" />
            </div>
            <h3 className="text-xl font-bold text-white/50 mb-2">你的消息</h3>
            <p className="text-sm">给好友发送私信，或使用群组频道聊天。</p>
          </div>
        )}
      </div>
    </div>
  );
};