import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, MoreVertical, Search, Pin, PinOff } from 'lucide-react';
import { Message, User } from '../types';

interface DirectMessagesProps {
  currentUser: User;
  showToast?: (msg: string) => void;
}

// Mock DM data
const INITIAL_DM_USERS = [
  { id: 'u2', name: 'Sarah Jenkins', avatar: 'https://picsum.photos/id/65/200/200', status: 'online', lastMsg: 'See you in class!', school: 'Stanford University' },
  { id: 'u3', name: 'Mike Ross', avatar: 'https://picsum.photos/id/91/200/200', status: 'offline', lastMsg: 'Thanks for the notes.', company: 'Google' },
  { id: 'u4', name: 'Emily Chen', avatar: 'https://picsum.photos/id/120/200/200', status: 'online', lastMsg: 'Are we still on for lunch?', school: 'MIT' },
  { id: 'u5', name: 'David Kim', avatar: 'https://picsum.photos/id/150/200/200', status: 'idle', lastMsg: 'Check this link out', company: 'Apple' },
];

export const DirectMessages: React.FC<DirectMessagesProps> = ({ currentUser, showToast }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>('u2');
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>(['u2']);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'dm1',
      senderId: 'u2',
      senderName: 'Sarah Jenkins',
      senderAvatar: 'https://picsum.photos/id/65/200/200',
      content: 'Hey! Did you finish the assignment?',
      timestamp: '10:30 AM'
    },
    {
      id: 'dm2',
      senderId: 'u1',
      senderName: 'Alex Chen',
      senderAvatar: currentUser.avatar,
      content: 'Yeah, just submitted it. It was tougher than I thought.',
      timestamp: '10:32 AM'
    },
    {
      id: 'dm3',
      senderId: 'u2',
      senderName: 'Sarah Jenkins',
      senderAvatar: 'https://picsum.photos/id/65/200/200',
      content: 'Tell me about it! I spent 2 hours on the last problem.',
      timestamp: '10:33 AM'
    },
    {
      id: 'dm4',
      senderId: 'u2',
      senderName: 'Sarah Jenkins',
      senderAvatar: 'https://picsum.photos/id/65/200/200',
      content: 'See you in class!',
      timestamp: '10:35 AM'
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUser]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content: inputText,
        timestamp: 'Just now'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const togglePin = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setPinnedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getCategory = (user: any) => {
    const isCommunity = (user.school && user.school === currentUser.school) || 
                        (user.company && user.company === currentUser.company);
    return isCommunity ? 'Community Friends' : 'Lucky Friends';
  };

  const pinnedUsers = INITIAL_DM_USERS.filter(u => pinnedUserIds.includes(u.id));
  const unpinnedUsers = INITIAL_DM_USERS.filter(u => !pinnedUserIds.includes(u.id));
  
  const communityFriends = unpinnedUsers.filter(u => getCategory(u) === 'Community Friends');
  const luckyFriends = unpinnedUsers.filter(u => getCategory(u) === 'Lucky Friends');

  const activeChatUser = INITIAL_DM_USERS.find(u => u.id === selectedUser);

  const renderUserList = (users: typeof INITIAL_DM_USERS, title: string) => {
    if (users.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">{title}</h3>
        {users.map(user => {
          const isPinned = pinnedUserIds.includes(user.id);
          return (
            <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50 group
                ${selectedUser === user.id ? 'bg-slate-800' : ''}`}
            >
                <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 
                        ${user.status === 'online' ? 'bg-green-500' : user.status === 'idle' ? 'bg-yellow-500' : 'bg-slate-500'}`}>
                    </div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                    <div className="text-sm text-slate-400 truncate">{user.lastMsg}</div>
                </div>
                <div 
                  onClick={(e) => togglePin(e, user.id)}
                  className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${isPinned ? 'text-indigo-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}
                >
                  {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-900">
      {/* Sidebar List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-950 bg-slate-900`}>
        <div className="p-4 border-b border-slate-950">
           <h2 className="font-bold text-white text-xl mb-4">Messages</h2>
           <div className="relative">
             <input 
                type="text" 
                placeholder="Search conversations" 
                className="w-full bg-slate-800 text-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
             />
             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
            {renderUserList(pinnedUsers, 'Pinned')}
            {renderUserList(communityFriends, 'Community Friends')}
            {renderUserList(luckyFriends, 'Lucky Friends')}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser && activeChatUser ? (
          <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-800`}>
             {/* Header */}
             <div className="h-16 border-b border-slate-900/50 flex items-center justify-between px-6 bg-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <button className="md:hidden text-slate-400 mr-2" onClick={() => setSelectedUser(null)}>
                        ←
                    </button>
                    <img src={activeChatUser.avatar} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-bold text-white">{activeChatUser.name}</span>
                    {activeChatUser.status === 'online' && <span className="w-2 h-2 bg-green-500 rounded-full ml-1"></span>}
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                    <Phone size={20} className="hover:text-white cursor-pointer" onClick={() => showToast?.('Voice call coming soon!')} />
                    <Video size={20} className="hover:text-white cursor-pointer" onClick={() => showToast?.('Video call coming soon!')} />
                    <MoreVertical size={20} className="hover:text-white cursor-pointer" onClick={() => showToast?.('More options coming soon!')} />
                </div>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isSequential = idx > 0 && messages[idx - 1].senderId === msg.senderId;
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSequential ? 'mt-1' : 'mt-4'}`}>
                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isSequential && !isMe && (
                                    <span className="text-xs text-slate-400 mb-1 ml-1">{msg.senderName}</span>
                                )}
                                <div className={`px-4 py-2 rounded-2xl break-words
                                    ${isMe 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}
                                >
                                    {msg.content}
                                </div>
                                {!isSequential && (
                                     <span className="text-[10px] text-slate-500 mt-1 mx-1">{msg.timestamp}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
             </div>

             {/* Input */}
             <div className="p-4 bg-slate-800 shrink-0">
                <div className="bg-slate-900 rounded-full p-2 flex items-center gap-2 border border-slate-700">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${activeChatUser.name}...`}
                        className="flex-1 bg-transparent text-slate-200 px-4 py-2 focus:outline-none"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className={`p-2 rounded-full transition-colors ${inputText.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-slate-600'}`}
                    >
                        <Send size={18} />
                    </button>
                </div>
             </div>
          </div>
      ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-slate-500 bg-slate-800">
              Select a conversation to start chatting
          </div>
      )}
    </div>
  );
};