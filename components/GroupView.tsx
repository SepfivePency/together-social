import React, { useState, useEffect, useRef } from 'react';
import { Hash, Volume2, Users, Search, Bell, Settings, Send, Bot } from 'lucide-react';
import { Group, Channel, Message, User } from '../types';
import { generateGroupAssistantResponse } from '../services/geminiService';

interface GroupViewProps {
  group: Group;
  currentUser: User;
}

export const GroupView: React.FC<GroupViewProps> = ({ group, currentUser }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>(group.channels[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-800">
      {/* Channels Sidebar */}
      <div className="w-60 bg-slate-900 flex flex-col shrink-0 border-r border-slate-950">
        <div className="h-12 flex items-center px-4 shadow-sm border-b border-slate-950 font-bold text-slate-100 truncate">
          {group.name}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {group.channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors group
              ${activeChannel.id === channel.id ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              {channel.type === 'text' ? <Hash size={18} className="text-slate-500" /> : <Volume2 size={18} className="text-slate-500" />}
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
        <div className="p-3 bg-slate-950/50 flex items-center gap-2 border-t border-slate-950">
            <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="Me" />
            <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.handle}</div>
            </div>
            <Settings size={16} className="text-slate-400 hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-800">
        {/* Top Header */}
        <div className="h-12 border-b border-slate-900/50 flex items-center justify-between px-4 shrink-0 bg-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-bold">
            <Hash size={20} className="text-slate-400" />
            {activeChannel.name}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Bell size={20} className="hover:text-slate-200 cursor-pointer" />
            <Users size={20} className="hover:text-slate-200 cursor-pointer" />
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search" 
                    className="bg-slate-900 text-sm rounded px-2 py-1 w-36 focus:w-48 transition-all text-slate-200 focus:outline-none" 
                />
                <Search size={14} className="absolute right-2 top-2 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg, idx) => {
            const isSequential = idx > 0 && messages[idx - 1].senderId === msg.senderId;
            return (
              <div key={msg.id} className={`flex gap-4 group ${isSequential ? 'mt-0.5' : 'mt-4'}`}>
                {!isSequential ? (
                  <img 
                    src={msg.senderAvatar} 
                    alt={msg.senderName} 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 mt-1"
                  />
                ) : (
                  <div className="w-10" /> 
                )}
                <div className="flex-1 min-w-0">
                  {!isSequential && (
                    <div className="flex items-center gap-2">
                      <span className={`font-medium cursor-pointer hover:underline ${msg.isAi ? 'text-indigo-400' : 'text-slate-100'}`}>
                        {msg.senderName}
                        {msg.isAi && <span className="ml-1 text-[10px] bg-indigo-500 text-white px-1 rounded uppercase">Bot</span>}
                      </span>
                      <span className="text-xs text-slate-400">{msg.timestamp}</span>
                    </div>
                  )}
                  <p className={`text-slate-300 whitespace-pre-wrap break-words ${isSequential ? '' : 'mt-1'}`}>{msg.content}</p>
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
              <button className="text-slate-400 hover:text-slate-200 p-1">
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
      
      {/* Right Sidebar (Members) - Hidden on smaller screens */}
      <div className="hidden lg:block w-60 bg-slate-900 border-l border-slate-950 p-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Online — 3</h3>
        <div className="space-y-2">
           <div className="flex items-center gap-3 opacity-100 hover:bg-slate-800 p-2 rounded cursor-pointer">
             <div className="relative">
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
             </div>
             <div>
                <div className="text-sm font-medium text-slate-200">{currentUser.name}</div>
             </div>
           </div>
           <div className="flex items-center gap-3 opacity-100 hover:bg-slate-800 p-2 rounded cursor-pointer">
             <div className="relative">
                <img src="https://picsum.photos/id/65/200/200" className="w-8 h-8 rounded-full" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
             </div>
             <div>
                <div className="text-sm font-medium text-slate-200">Sarah Jenkins</div>
             </div>
           </div>
           <div className="flex items-center gap-3 opacity-100 hover:bg-slate-800 p-2 rounded cursor-pointer">
             <div className="relative">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=together" className="w-8 h-8 rounded-full bg-indigo-500" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
             </div>
             <div>
                <div className="text-sm font-medium text-indigo-400">Together Bot</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Bot</div>
             </div>
           </div>
        </div>
        
         <h3 className="text-xs font-bold text-slate-500 uppercase mt-6 mb-4">Offline — 14</h3>
         {/* Mock offline members */}
         {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 opacity-50 hover:opacity-100 hover:bg-slate-800 p-2 rounded cursor-pointer">
                <img src={`https://picsum.photos/seed/${i + 100}/200/200`} className="w-8 h-8 rounded-full grayscale" alt="" />
                <div className="text-sm font-medium text-slate-400">Student {i}</div>
            </div>
         ))}
      </div>
    </div>
  );
};