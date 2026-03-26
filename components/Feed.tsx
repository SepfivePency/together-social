import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Sparkles, Image as ImageIcon, Send, Link as LinkIcon } from 'lucide-react';
import { Post, User } from '../types';
import { generatePostEnhancement } from '../services/geminiService';

interface FeedProps {
  currentUser: User;
  posts: Post[];
  showToast?: (msg: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, posts, showToast }) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  // Simple state to show "posted" items for demo (in real app, this would be lifted up)
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const allPosts = [...localPosts, ...posts]; // local posts are newer, so put them first for reverse chrono

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleEnhance = async () => {
    if (!newPostContent.trim()) return;
    setIsEnhancing(true);
    const enhanced = await generatePostEnhancement(newPostContent);
    setNewPostContent(enhanced);
    setIsEnhancing(false);
  };

  const handlePost = () => {
      if (!newPostContent.trim()) return;
      const newPost: Post = {
          id: Date.now().toString(),
          author: currentUser,
          content: newPostContent,
          likes: 0,
          comments: 0,
          timestamp: 'Just now'
      };
      setLocalPosts([newPost, ...localPosts]);
      setNewPostContent('');
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Create Post */}
        <div className="bg-slate-900 rounded-xl p-4 shadow-lg border border-slate-800">
          <div className="flex gap-4">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={`What's happening, ${currentUser.name.split(' ')[0]}?`}
                className="w-full bg-slate-800 text-white rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-slate-500"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm" onClick={() => showToast?.('Photo upload coming soon!')}>
                    <ImageIcon size={18} />
                    <span className="hidden sm:inline">Photo</span>
                  </button>
                  <button className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm" onClick={() => showToast?.('Link attachment coming soon!')}>
                    <LinkIcon size={18} />
                    <span className="hidden sm:inline">Link</span>
                  </button>
                  <button 
                    onClick={handleEnhance}
                    disabled={isEnhancing || !newPostContent}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                  >
                    <Sparkles size={18} />
                    <span className="hidden sm:inline">{isEnhancing ? '...' : 'AI Enhance'}</span>
                  </button>
                </div>
                <button 
                    onClick={handlePost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newPostContent.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {allPosts.map(post => (
            <div key={post.id} className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold text-white">{post.author.name}</h3>
                    <p className="text-xs text-slate-400">{post.timestamp}</p>
                  </div>
                </div>
                <p className="text-slate-200 mb-3 whitespace-pre-line">{post.content}</p>
                {post.image && (
                  <div className="rounded-lg overflow-hidden mb-3">
                    <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                  </div>
                )}
                
                <div className="flex items-center gap-6 pt-3 border-t border-slate-800">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${likedPosts.has(post.id) ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                  >
                    <Heart size={20} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                    <span className="text-sm">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </button>
                  <button 
                    onClick={() => showToast?.('Comments feature coming soon!')}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle size={20} />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                   <button 
                    onClick={() => showToast?.('Link copied to clipboard!')}
                    className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors"
                  >
                    <Share2 size={20} />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};