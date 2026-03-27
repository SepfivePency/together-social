import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Send, Link as LinkIcon, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Post, User, Group } from '../types';
import { supabase } from '../lib/supabase';

interface FeedProps {
  currentUser: User;
  posts: Post[];
  showToast?: (msg: string) => void;
  groups?: Group[];
  onAddPost?: (post: Post) => void;
  onUpdatePost?: (post: Post) => void;
  onUserClick?: (user: User) => void;
  focusedPostId?: string | null;
  onClearFocusedPost?: () => void;
  onDeletePost?: (postId: string) => void;
}

interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, showToast, groups = [], posts, onAddPost, onUpdatePost, onUserClick, focusedPostId, onClearFocusedPost, onDeletePost }) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [committedLink, setCommittedLink] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [shareMenuPostId, setShareMenuPostId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUser.id);
      if (data) setLikedPosts(new Set(data.map(d => d.post_id)));
    };
    fetchLikes();
  }, [currentUser.id]);

  useEffect(() => {
    if (focusedPostId && posts.length > 0) {
      const post = posts.find(p => p.id === focusedPostId);
      if (post && openPost?.id !== post.id) {
        handleOpenPost(post);
        onClearFocusedPost?.();
      }
    }
  }, [focusedPostId, posts]);

  const handleLike = async (post: Post) => {
    const isLiked = likedPosts.has(post.id);
    setLikedPosts(prev => { const s = new Set(prev); isLiked ? s.delete(post.id) : s.add(post.id); return s; });
    onUpdatePost?.({ ...post, likes: Math.max(0, isLiked ? post.likes - 1 : post.likes + 1) });

    if (isLiked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUser.id });
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast?.('图片大小不能超过 10MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { showToast?.('视频大小不能超过 50MB'); return; }
    const url = URL.createObjectURL(file);
    setSelectedVideo(url);
  };

  const handleAddLink = () => {
    const raw = linkUrl.trim();
    if (!raw) return;
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    setCommittedLink(url);
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handlePost = async () => {
    if (!newPostContent.trim() && !selectedImage && !selectedVideo) return;
    
    const finalContent = newPostContent + (committedLink ? `\n\n🔗 ${committedLink}` : '');
    
    // Note: selectedImage/Video are base64/blob locally rn. Real Storage upload in Phase 3.
    const { data, error } = await supabase.from('posts').insert({
      author_id: currentUser.id, content: finalContent, image_url: selectedImage || null, video_url: selectedVideo || null,
    }).select('*, profiles!posts_author_id_fkey(id, name, handle, avatar_url, bio)').single();

    if (error || !data) { showToast?.('发布失败: ' + error?.message); return; }

    const newPost: Post = {
        id: data.id, content: data.content || '', image: data.image_url || undefined, video: data.video_url || undefined,
        likes: data.likes_count || 0, comments: data.comments_count || 0, timestamp: new Date(data.created_at).toLocaleString(),
        author: { id: data.profiles?.id, name: data.profiles?.name, handle: data.profiles?.handle, avatar: data.profiles?.avatar_url, bio: data.profiles?.bio }
    };

    onAddPost?.(newPost);
    setNewPostContent(''); setSelectedImage(null); setSelectedVideo(null); setCommittedLink(null);
    showToast?.('发布成功！');
  };

  const toggleComments = async (postId: string) => {
    setExpandedComments(prev => { const s = new Set(prev); s.has(postId) ? s.delete(postId) : s.add(postId); return s; });
    
    if (!expandedComments.has(postId) && !comments[postId]) {
      const { data } = await supabase.from('post_comments')
        .select(`*, profiles!post_comments_author_id_fkey(id, name, handle, avatar_url, bio)`)
        .eq('post_id', postId).order('created_at', { ascending: false });
      if (data) {
        setComments(prev => ({
          ...prev,
          [postId]: data.map((c: any) => ({
            id: c.id, content: c.content, timestamp: new Date(c.created_at).toLocaleString(),
            author: { id: c.profiles?.id, name: c.profiles?.name, handle: c.profiles?.handle, avatar: c.profiles?.avatar_url, bio: c.profiles?.bio }
          }))
        }));
      }
    }
  };

  const handleAddComment = async (post: Post) => {
    const content = commentInputs[post.id]?.trim();
    if (!content) return;
    
    const { data, error } = await supabase.from('post_comments').insert({
      post_id: post.id, author_id: currentUser.id, content
    }).select('*, profiles!post_comments_author_id_fkey(id, name, handle, avatar_url, bio)').single();
    
    if (error) { showToast?.('评论失败'); return; }

    const newComment = {
      id: data.id,
      author: { id: data.profiles?.id, name: data.profiles?.name, handle: data.profiles?.handle, avatar: data.profiles?.avatar_url, bio: data.profiles?.bio },
      content: data.content,
      timestamp: '刚刚'
    };

    setComments(prev => ({ ...prev, [post.id]: [newComment, ...(prev[post.id] || [])] }));
    setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
    onUpdatePost?.({ ...post, comments: post.comments + 1 });
    if (openPost?.id === post.id) setOpenPost({ ...openPost, comments: openPost.comments + 1 });
  };

  const handleOpenPost = async (post: Post) => {
    setOpenPost(post);
    if (!comments[post.id]) {
      const { data } = await supabase.from('post_comments').select(`*, profiles(id, name, handle, avatar_url, bio)`).eq('post_id', post.id).order('created_at', { ascending: false });
      if (data) {
        setComments(prev => ({
          ...prev,
          [post.id]: data.map((c: any) => ({
            id: c.id, content: c.content, timestamp: new Date(c.created_at).toLocaleString(),
            author: { id: c.profiles?.id, name: c.profiles?.name, handle: c.profiles?.handle, avatar: c.profiles?.avatar_url, bio: c.profiles?.bio }
          }))
        }));
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('确定要删除这条动态吗？')) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (!error) {
        onDeletePost?.(postId);
        if (openPost?.id === postId) setOpenPost(null);
        showToast?.('动态已删除');
      } else {
        showToast?.('删除失败: ' + error.message);
      }
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (confirm('确定要删除这条评论吗？')) {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (!error) {
        setComments(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c.id !== commentId) }));
        const postToUpdate = posts.find(p => p.id === postId);
        if (postToUpdate) onUpdatePost?.({ ...postToUpdate, comments: Math.max(0, postToUpdate.comments - 1) });
        if (openPost?.id === postId) setOpenPost({ ...openPost, comments: Math.max(0, openPost.comments - 1) });
        showToast?.('评论已删除');
      } else {
        showToast?.('删除失败: ' + error.message);
      }
    }
  };

  const handleOpenShare = async (postId: string) => {
    setShareMenuPostId(postId);
    if (contacts.length === 0) {
      const { data } = await supabase.from('profiles').select('*').neq('id', currentUser.id).limit(15);
      if (data) {
         setContacts(data.map(p => ({
           id: p.id, name: p.name, handle: p.handle, avatar: p.avatar_url, bio: p.bio, location: ''
         })));
      }
    }
  };

  const handleShare = (post: Post, contact: User) => {
    setShareMenuPostId(null);
    showToast?.(`已成功分享给 ${contact.name}`);
  };

  return (
    <div className="flex-1 overflow-y-auto h-full p-4 md:p-8 pb-20 md:pb-8 relative z-10">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Create Post Card */}
        <div className="glass-strong rounded-2xl p-5 gradient-border">
          <div className="flex gap-3 mb-3">
            <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
            <textarea
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              placeholder={`有什么想分享的, ${currentUser.name.split(' ')[0]}?`}
              className="flex-1 bg-white/5 border border-white/5 text-white/90 rounded-xl p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none placeholder-white/25 text-sm transition-all" />
          </div>

          {/* Image preview */}
          {selectedImage && (
            <div className="relative mb-3 rounded-xl overflow-hidden ring-1 ring-white/10">
              <img src={selectedImage} alt="预览" className="w-full max-h-[280px] object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 glass text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={13} /></button>
            </div>
          )}

          {/* Video preview */}
          {selectedVideo && (
            <div className="relative mb-3 rounded-xl overflow-hidden ring-1 ring-white/10">
              <video src={selectedVideo} controls className="w-full max-h-[280px] object-cover" />
              <button onClick={() => setSelectedVideo(null)} className="absolute top-2 right-2 glass text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={13} /></button>
            </div>
          )}

          {/* Link preview card */}
          {committedLink && (
            <div className="mb-3 glass rounded-xl p-3 flex items-start gap-3 animate-fade-in" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                <LinkIcon size={14} className="text-indigo-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/40 mb-0.5">链接附件</div>
                <a href={committedLink} target="_blank" rel="noreferrer" className="text-indigo-300 text-sm truncate block hover:text-indigo-200 hover:underline">
                  {committedLink}
                </a>
              </div>
              <button onClick={() => setCommittedLink(null)} className="text-white/20 hover:text-white/60 shrink-0"><X size={14} /></button>
            </div>
          )}

          {/* Link input bar */}
          {showLinkInput && (
            <div className="flex gap-2 mb-3 animate-fade-in">
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                placeholder="粘贴链接地址…" autoFocus
                className="flex-1 bg-white/5 border border-white/8 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/40 placeholder-white/20" />
              <button onClick={handleAddLink} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-xl text-sm">添加</button>
              <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} className="text-white/30 hover:text-white px-1"><X size={15} /></button>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex gap-0.5">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />

              <button onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 text-white/35 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all text-xs font-medium">
                <ImageIcon size={15} /><span>图片</span>
              </button>
              <button onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 text-white/35 hover:text-pink-300 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all text-xs font-medium">
                <Video size={15} /><span>视频</span>
              </button>
              <button onClick={() => setShowLinkInput(!showLinkInput)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all text-xs font-medium ${showLinkInput || committedLink ? 'text-cyan-300' : 'text-white/35 hover:text-cyan-300'}`}>
                <LinkIcon size={15} /><span>链接</span>
              </button>
            </div>
            <button onClick={handlePost} disabled={!newPostContent.trim() && !selectedImage && !selectedVideo}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-5 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 btn-glow">
              发布
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 text-white/30">这里空空如也，发布第一条动态吧！</div>
        ) : posts.map(post => {
          const postComments = comments[post.id] || [];
          const isExpanded = expandedComments.has(post.id);
          const totalComments = post.comments;
          const showShare = shareMenuPostId === post.id;

          return (
            <div key={post.id} className="glass rounded-2xl overflow-hidden gradient-border hover:bg-white/[0.06] transition-all">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3 w-full">
                  <div className="flex items-center gap-3 cursor-pointer w-max" onClick={() => onUserClick?.(post.author)}>
                    <img src={post.author.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 hover:opacity-80 transition-opacity" />
                    <div className="hover:underline">
                      <div className="font-semibold text-white/90 text-sm">{post.author.name}</div>
                      <div className="text-xs text-white/30">{post.timestamp}</div>
                    </div>
                  </div>
                  {post.author.id === currentUser.id && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-white/20 hover:text-red-400 p-2 rounded-full hover:bg-white/5 transition-all"><Trash2 size={16} /></button>
                  )}
                </div>
                
                <div className="cursor-pointer" onClick={() => handleOpenPost(post)}>
                  <p className="text-white/75 mb-3 whitespace-pre-line leading-relaxed text-sm">{post.content}</p>
                  {post.image && (
                    <div className="rounded-xl overflow-hidden mb-3 ring-1 ring-white/8">
                      <img src={post.image} alt="" className="w-full h-auto object-cover max-h-[360px]" />
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                  <button onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-sm transition-all ${likedPosts.has(post.id) ? 'text-pink-400' : 'text-white/25 hover:text-pink-400'}`}>
                    <Heart size={16} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                    <span>{post.likes}</span>
                  </button>
                  <button onClick={() => handleOpenPost(post)}
                    className="flex items-center gap-1.5 text-sm transition-all text-white/25 hover:text-cyan-400">
                    <MessageCircle size={16} />
                    <span>{totalComments}</span>
                  </button>

                  {/* Share to contact */}
                  <div className="relative">
                    <button onClick={() => showShare ? setShareMenuPostId(null) : handleOpenShare(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-all ${showShare ? 'text-emerald-400' : 'text-white/25 hover:text-emerald-400'}`}>
                      <Share2 size={16} /><span>分享</span>
                    </button>
                    {showShare && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShareMenuPostId(null)} />
                        <div className="absolute bottom-full left-0 mb-2 w-52 glass-strong rounded-xl z-50 overflow-hidden animate-fade-in"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5">分享给联系人</div>
                          {!contacts.length ? (
                            <div className="px-3 py-4 flex justify-center">
                              <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></span>
                            </div>
                          ) : contacts.map(c => (
                            <button key={c.id} onClick={() => handleShare(post, c)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors">
                              <img src={c.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                              <span className="truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in">
                    {!postComments.length && <p className="text-white/20 text-xs text-center py-1">暂无评论，来第一个！</p>}
                    {postComments.map(c => (
                      <div key={c.id} className="flex gap-2.5 group relative">
                        <img src={c.author.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        <div className="flex-1 glass rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white/75">{c.author.name}</span>
                            <span className="text-[10px] text-white/20">{c.timestamp}</span>
                          </div>
                          <p className="text-xs text-white/55">{c.content}</p>
                        </div>
                        {c.author.id === currentUser.id && (
                          <button onClick={() => handleDeleteComment(post.id, c.id)} className="shrink-0 text-white/20 hover:text-red-400 p-1.5 rounded-full hover:bg-white/5 transition-all self-center"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 items-center">
                      <img src={currentUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <input type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post)}
                        placeholder="写一条评论…"
                        className="flex-1 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/40 placeholder-white/20" />
                      <button onClick={() => handleAddComment(post)} disabled={!commentInputs[post.id]?.trim()}
                        className="text-indigo-400 hover:text-indigo-300 disabled:text-white/10 p-1 transition-colors">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Details Modal overlay */}
      {openPost && (
        <div className="absolute inset-0 z-50 flex flex-col md:p-8 bg-[#0c0a1a]/95 backdrop-blur-xl overflow-hidden animate-fade-in">
           <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
             <div className="flex items-center gap-4">
               <button onClick={() => setOpenPost(null)} className="w-10 h-10 rounded-full glass hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"><X size={20} /></button>
               <h2 className="text-xl font-bold text-white">动态详情</h2>
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar flex justify-center">
              <div className="w-full max-w-3xl glass-strong rounded-[32px] p-6 md:p-10 gradient-border shadow-2xl h-max">
                 <div className="flex items-center justify-between mb-6 w-full">
                   <div className="flex items-center gap-4 cursor-pointer w-max" onClick={() => onUserClick?.(openPost.author)}>
                     <img src={openPost.author.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 shadow-lg hover:opacity-80 transition-opacity" />
                     <div className="hover:underline">
                       <div className="font-bold text-white text-lg">{openPost.author.name}</div>
                       <div className="text-sm text-white/40">{openPost.timestamp}</div>
                     </div>
                   </div>
                   {openPost.author.id === currentUser.id && (
                     <button onClick={() => handleDeletePost(openPost.id)} className="text-white/20 hover:text-red-400 p-3 rounded-full hover:bg-white/5 transition-all"><Trash2 size={20} /></button>
                   )}
                 </div>
                 
                 <p className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap mb-6">{openPost.content}</p>
                 
                 {openPost.image && (
                   <div className="rounded-2xl overflow-hidden mb-6 ring-1 ring-white/10 shadow-lg">
                     <img src={openPost.image} alt="" className="w-full h-auto object-cover max-h-[600px] hover:scale-[1.02] transition-transform duration-500" />
                   </div>
                 )}
                 
                 <div className="flex items-center gap-6 pt-4 pb-6 border-b border-white/10">
                   <button onClick={() => handleLike(openPost)} className={`flex items-center gap-2 transition-all text-lg ${likedPosts.has(openPost.id) ? 'text-pink-400' : 'text-white/40 hover:text-pink-400'}`}>
                     <Heart size={24} className={likedPosts.has(openPost.id) ? 'fill-current' : ''} /><span>{openPost.likes}</span>
                   </button>
                   <div className="flex items-center gap-2 text-lg text-cyan-400">
                     <MessageCircle size={24} /><span>{openPost.comments}</span>
                   </div>
                 </div>
                 
                 <div className="mt-8 space-y-6">
                   <h4 className="text-lg font-bold text-white/80 border-l-4 border-indigo-500 pl-3">全部评论</h4>
                   <div className="flex gap-3 items-center sticky top-0 bg-[#16122d]/80 backdrop-blur-md p-3 -mx-3 rounded-2xl z-10 border border-white/5">
                      <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <input type="text" value={commentInputs[openPost.id] || ''}
                        onChange={e => setCommentInputs(p => ({ ...p, [openPost.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(openPost)}
                        placeholder="留下你的评论..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-inner" />
                      <button onClick={() => handleAddComment(openPost)} disabled={!commentInputs[openPost.id]?.trim()}
                        className="w-10 h-10 bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-30 disabled:hover:bg-indigo-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 transition-all">
                        <Send size={16} />
                      </button>
                   </div>
                   
                   <div className="space-y-4 pt-4">
                     {comments[openPost.id]?.length > 0 ? comments[openPost.id].map(c => (
                       <div key={c.id} className="flex gap-4 group relative">
                         <img src={c.author.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onUserClick?.(c.author)} />
                         <div className="flex-1 glass rounded-2xl p-4 border border-white/5">
                           <div className="flex items-center gap-3 mb-1 cursor-pointer w-max" onClick={() => onUserClick?.(c.author)}>
                             <span className="font-bold text-white/90 text-sm hover:underline">{c.author.name}</span>
                             <span className="text-xs text-white/30">{c.timestamp}</span>
                           </div>
                           <p className="text-white/70 text-sm leading-relaxed">{c.content}</p>
                         </div>
                         {c.author.id === currentUser.id && (
                           <button onClick={() => handleDeleteComment(openPost.id, c.id)} className="shrink-0 text-white/20 hover:text-red-400 p-2 rounded-full hover:bg-white/5 transition-all self-center"><Trash2 size={16} /></button>
                         )}
                       </div>
                     )) : (
                       <div className="text-center py-10 text-white/20">暂无评论</div>
                     )}
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};