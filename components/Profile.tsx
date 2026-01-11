import React from 'react';
import { User, Post } from '../types';
import { MapPin, Calendar, Link as LinkIcon, Edit3 } from 'lucide-react';

interface ProfileProps {
  user: User;
  posts: Post[];
}

export const Profile: React.FC<ProfileProps> = ({ user, posts }) => {
  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative">
        <button className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm transition-colors flex items-center gap-2">
            <Edit3 size={14} /> Edit Cover
        </button>
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
             <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                Edit Profile
             </button>
             <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700">
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