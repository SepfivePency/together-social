import React, { useState } from 'react';
import { User, Post } from '../types';
import { MapPin, Calendar, Link as LinkIcon, Edit3, Settings, User as UserIcon, Palette } from 'lucide-react';

interface ProfileProps {
  user: User;
  posts: Post[];
  showToast?: (msg: string) => void;
  appBgColor?: string;
  setAppBgColor?: (color: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, posts, showToast, appBgColor, setAppBgColor }) => {
  const [showSettings, setShowSettings] = useState(false);
  const colors = ['#0f172a', '#171717', '#1e1b4b', '#052e16', '#4a044e', '#2e1065', '#3f3f46', '#111827'];

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full relative">
      {/* Settings Dropdown */}
      <div className="absolute top-4 right-4 z-10">
         <button 
           onClick={() => setShowSettings(!showSettings)} 
           className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
         >
           <Settings size={20} />
         </button>
         {showSettings && (
           <div className="absolute top-12 right-0 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
             <button 
               onClick={() => { showToast?.('Cover image upload coming soon!'); setShowSettings(false); }} 
               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
             >
               <Edit3 size={16} /> Edit Cover
             </button>
             <button 
               onClick={() => { showToast?.('Profile editing coming soon!'); setShowSettings(false); }} 
               className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
             >
               <UserIcon size={16} /> Edit Profile
             </button>
             <div className="h-px bg-slate-800 my-1" />
             <div className="px-4 py-3">
               <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                 <Palette size={14} /> Theme Color
               </div>
               <div className="flex flex-wrap gap-2">
                 {colors.map(c => (
                   <button
                     key={c}
                     onClick={() => { setAppBgColor?.(c); setShowSettings(false); }}
                     className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${appBgColor === c ? 'border-white' : 'border-slate-600'}`}
                     style={{ backgroundColor: c }}
                   />
                 ))}
               </div>
             </div>
           </div>
         )}
      </div>

      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative">
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative -mt-16 mb-6 flex flex-col md:flex-row items-end md:items-end gap-6">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-950 object-cover shadow-xl"
            />
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-slate-950 rounded-full"></div>
          </div>
          
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-slate-400 font-medium">{user.handle}</p>
          </div>

          <div className="mb-4 flex gap-3">
             <button 
                onClick={() => showToast?.('Friends list coming soon!')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700"
             >
                Friends
             </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-3">About</h3>
                <p className="text-slate-300 mb-4">{user.bio}</p>
                <div className="space-y-3 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>San Francisco, CA</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Joined September 2023</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <LinkIcon size={16} />
                        <a href="#" className="text-indigo-400 hover:underline">alexchen.dev</a>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                 <h3 className="text-lg font-bold text-white mb-3">Badges</h3>
                 <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs border border-yellow-500/20">Early Adopter</span>
                    <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs border border-purple-500/20">Group Leader</span>
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs border border-blue-500/20">Top Contributor</span>
                 </div>
            </div>
          </div>

          {/* Activity Feed (Reusing simple styled posts) */}
          <div className="md:col-span-2 space-y-6">
             <h3 className="text-xl font-bold text-white">Recent Activity</h3>
             {posts.filter(p => p.author.id === user.id).length > 0 ? (
                 posts.filter(p => p.author.id === user.id).map(post => (
                    <div key={post.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full" />
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-white">{post.author.name}</div>
                                <div className="text-xs text-slate-400">{post.timestamp}</div>
                            </div>
                        </div>
                        <p className="text-slate-200">{post.content}</p>
                    </div>
                 ))
             ) : (
                <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 text-center text-slate-500">
                    No recent posts to show.
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};