import React, { useState, useEffect, useRef } from 'react';
import { Hash, Volume2, Users, Search, Bell, Settings, Send, Bot, LogOut, BellOff, Link as LinkIcon, Menu, X } from 'lucide-react';
import { Group, Channel, Message, User } from '../types';
import { generateGroupAssistantResponse } from '../services/geminiService';

interface GroupViewProps {
  group: Group;
  currentUser: User;
  showToast?: (msg: string) => void;
  onLeaveGroup?: (groupId: string) => void;
}

export const GroupView: React.FC<GroupViewProps> = ({ group, currentUser, showToast, onLeaveGroup }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>(group.channels[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMobileChannels, setShowMobileChannels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CHANNEL_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  const USER_COLORS = ['bg-slate-700', 'bg-zinc-700', 'bg-stone-700', 'bg-neutral-700', 'bg-gray-700'];

  const getMessageColor = (msg: Message) => {
    if (msg.senderId === currentUser.id) return 'bg-[#000080]'; // Navy blue
    if (msg.senderId === 'ai_bot') return 'bg-indigo-900/50 border border-indigo-500/30';
    
    const uniqueSenders = Array.from(new Set(messages.filter(m => m.senderId !== currentUser.id && m.senderId !== 'ai_bot').map(m => m.senderId)));
    const senderIdx = uniqueSenders.indexOf(msg.senderId);
    return USER_COLORS[Math.max(0, senderIdx) % USER_COLORS.length];
  };

  // Initialize messages when channel changes
  useEffect(() => {
    setMessages([
      {
        id: 'm1',
        senderId: 'u2',
        senderName: 'Sarah Jenkins',
        senderAvatar: 'https://picsum.photos/id/65/200/200',
        content: `Welcome to #${activeChannel.name}!`,
        timestamp: 'Today at 9:00 AM'
      }
    ]);
  }, [activeChannel]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: inputText,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, newUserMsg]);
    const prompt = inputText;
    setInputText('');

    // Check if user is asking the bot
    if (prompt.toLowerCase().startsWith('@ai') || prompt.toLowerCase().includes('help')) {
        setIsAiProcessing(true);
        // Simulate delay slightly for realism
        setTimeout(async () => {
             const aiResponse = await generateGroupAssistantResponse(
                prompt, 
                `Group: ${group.name}, Channel: ${activeChannel.name}`
            );
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                senderId: 'ai_bot',
                senderName: 'Together Bot',
                senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=together',
                content: aiResponse,
                timestamp: 'Just now',
                isAi: true
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsAiProcessing(false);
        }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  }

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-800 relative">
      {/* Mobile Channels Overlay */}
      {showMobileChannels && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileChannels(false)}
        />
      )}

      {/* Channels Sidebar */}
      <div className={`${showMobileChannels ? 'flex' : 'hidden'} md:flex absolute md:relative z-50 h-full w-64 bg-slate-900 flex-col shrink-0 border-r border-slate-950 transition-transform`}>
        <div className="h-12 flex items-center justify-between px-4 shadow-sm border-b border-slate-950 font-bold text-slate-100">
          <span className="truncate">{group.name}</span>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setShowMobileChannels(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {group.channels.map((channel, idx) => {
            const colorClass = CHANNEL_COLORS[idx % CHANNEL_COLORS.length];
            return (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel);
                  setShowMobileChannels(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors group
                ${activeChannel.id === channel.id ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                {channel.type === 'text' ? <Hash size={16} className="text-slate-500" /> : <Volume2 size={16} className="text-slate-500" />}
                <span className="truncate">{channel.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-800">
        {/* Top Header */}
        <div className="h-12 border-b border-slate-900/50 flex items-center justify-between px-4 shrink-0 bg-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-bold">
            <button 
              className="md:hidden text-slate-400 hover:text-white mr-2"
              onClick={() => setShowMobileChannels(true)}
            >
              <Menu size={20} />
            </button>
            <Hash size={20} className="text-slate-400 hidden sm:block" />
            <span className="truncate max-w-[150px] sm:max-w-xs">{activeChannel.name}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 relative">
            <div className="relative hidden sm:block" onMouseLeave={() => setShowSearchOptions(false)}>
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchOptions(true)}
                    className="bg-slate-900 text-sm rounded px-2 py-1 w-36 focus:w-48 transition-all text-slate-200 focus:outline-none placeholder:text-slate-500" 
                />
                <Search size={14} className="absolute right-2 top-2 text-slate-500" />
                
                {/* Search Options Dropdown */}
                {showSearchOptions && (
                  <div className="absolute top-8 right-0 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                        Search Options
                    </div>
                    <button 
                      onClick={() => { showToast?.('Search by date coming soon!'); setShowSearchOptions(false); }} 
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        By Date (按日期)
                    </button>
                    <button 
                      onClick={() => { showToast?.('Search by type coming soon!'); setShowSearchOptions(false); }} 
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        By Type (按类型)
                    </button>
                  </div>
                )}
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-700"
            >
              <Settings size={20} />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute top-10 right-0 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-800">
                  <h3 className="font-bold text-white truncate">{group.name}</h3>
                  <p className="text-xs text-slate-400">Community Settings</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      showToast?.(isMuted ? 'Notifications enabled' : 'Notifications muted');
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                  >
                    {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                    {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                  </button>
                  <button 
                    onClick={() => {
                      showToast?.('Invite link copied to clipboard!');
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                  >
                    <LinkIcon size={16} />
                    Copy Invite Link
                  </button>
                  <div className="h-px bg-slate-800 my-1 mx-2" />
                  <button 
                    onClick={() => {
                      setShowSettings(false);
                      onLeaveGroup?.(group.id);
                      showToast?.(`You left ${group.name}`);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Exit Community
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {filteredMessages.length === 0 && searchQuery && (
            <div className="text-center text-slate-500 mt-10">
              No messages found for "{searchQuery}"
            </div>
          )}
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const isSequential = idx > 0 && filteredMessages[idx - 1].senderId === msg.senderId;
            const msgBgColor = getMessageColor(msg);

            return (
              <div key={msg.id} className={`flex gap-4 group ${isSequential ? 'mt-0.5' : 'mt-4'} ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isSequential ? (
                  <img 
                    src={msg.senderAvatar} 
                    alt={msg.senderName} 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 mt-1"
                  />
                ) : (
                  <div className="w-10" /> 
                )}
                <div className={`flex flex-col min-w-0 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isSequential && (
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className={`font-medium cursor-pointer hover:underline ${msg.isAi ? 'text-indigo-400' : 'text-slate-100'}`}>
                        {msg.senderName}
                        {msg.isAi && <span className="ml-1 text-[10px] bg-indigo-500 text-white px-1 rounded uppercase">Bot</span>}
                      </span>
                      <span className="text-xs text-slate-400">{msg.timestamp}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl ${msgBgColor} ${isMe ? 'rounded-tr-none text-white' : 'rounded-tl-none text-slate-200'}`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {isAiProcessing && (
              <div className="flex gap-4 mt-4 opacity-50 animate-pulse">
                   <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                   <div className="flex-1 space-y-2">
                       <div className="h-4 bg-slate-600 rounded w-1/4"></div>
                       <div className="h-4 bg-slate-600 rounded w-1/2"></div>
                   </div>
              </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800 shrink-0">
          <div className="bg-slate-700/50 rounded-lg p-3">
             {inputText.startsWith('@ai') && (
                <div className="text-xs text-indigo-300 mb-2 flex items-center gap-1 font-medium">
                    <Bot size={12} />
                    AI Assistant Active
                </div>
            )}
            <div className="flex items-end gap-3">
              <button 
                onClick={() => showToast?.('Attachment feature coming soon!')}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                 <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-lg leading-none pb-1">+</span>
                 </div>
              </button>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeChannel.name} (Type @ai to ask Gemini)`}
                className="flex-1 bg-transparent text-slate-100 max-h-40 min-h-[24px] focus:outline-none resize-none placeholder-slate-500 scrollbar-none"
                rows={1}
                style={{height: 'auto'}}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`p-2 rounded hover:bg-slate-600 transition-colors ${inputText.trim() ? 'text-indigo-400' : 'text-slate-500 cursor-not-allowed'}`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-center text-slate-500 mt-1">
              Together App • Type <strong>@ai</strong> to invite the Assistant
          </div>
        </div>
      </div>
    </div>
  );
};