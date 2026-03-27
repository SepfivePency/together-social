import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Loader2, Feather } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!username.trim()) throw new Error('昵称不能为空');
        
        // Check if nickname is already taken
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('name', username.trim()).single();
        if (existingUser) throw new Error('该昵称已被使用，请换一个');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: username,
              avatar_url: `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(username)}`
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          // Auto login success
        } else {
          setSuccessMsg('注册成功！为了验证您的账号，我们极可能向您发送了一封验证邮件，请检查邮箱。如果你的 Supabase 禁用了邮箱强制验证，请直接登录。');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('邮箱或密码错误');
      } else if (err.message.includes('User already registered')) {
        setErrorMsg('该邮箱已被注册');
      } else {
        setErrorMsg(err.message || '认证失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-50 overflow-hidden">
      {/* Background elements matched to existing index.css are handled global, but we can add an extra glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] glass-strong rounded-[36px] p-8 md:p-10 shadow-2xl animate-slide-up relative z-10"
           style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(20,20,35,0.4)', backdropFilter: 'blur(60px) saturate(1.8)' }}>
        
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
            <Feather size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
            {isLogin ? '欢迎回来' : '加入 Together'}
          </h1>
          <p className="text-white/40 text-[14px]">
            {isLogin ? '输入您的凭据以继续' : '创建一个新账号开启全新的社交体验'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200/90 text-[13px] text-center animate-fade-in shadow-inner">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200/90 text-[13px] text-center animate-fade-in shadow-inner">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="relative group">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required={!isLogin} placeholder=" "
                className="w-full bg-black/20 text-white rounded-2xl px-12 py-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-indigo-500/40 border border-white/5 transition-all shadow-inner peer" />
              <label className="absolute left-12 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-all duration-300 peer-placeholder-shown:top-1/2 peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50">
                你的昵称
              </label>
              <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
            </div>
          )}
          
          <div className="relative group">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder=" "
              className="w-full bg-black/20 text-white rounded-2xl px-12 py-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-indigo-500/40 border border-white/5 transition-all shadow-inner peer" />
            <label className="absolute left-12 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-all duration-300 peer-placeholder-shown:top-1/2 peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50">
              邮箱地址
            </label>
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
          </div>

          <div className="relative group">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder=" "
              className="w-full bg-black/20 text-white rounded-2xl px-12 py-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-indigo-500/40 border border-white/5 transition-all shadow-inner peer" />
            <label className="absolute left-12 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-all duration-300 peer-placeholder-shown:top-1/2 peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-white/50">
              密码
            </label>
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white transition-all duration-300 relative overflow-hidden group
                bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-[100%_auto] shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? <Loader2 size={24} className="animate-spin text-white/80" /> : isLogin ? '立 即 登 录' : '注 册 账 号'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} type="button"
            className="text-white/40 hover:text-white text-[14px] transition-colors font-medium decoration-white/30 hover:underline underline-offset-4">
            {isLogin ? '还没有账号？点击注册' : '已有账号？返回登录'}
          </button>
        </div>
        
      </div>
      
      <div className="absolute bottom-6 w-full flex justify-center pointer-events-none z-10">
        <span className="text-[18px] tracking-widest text-transparent bg-clip-text font-bold"
              style={{ fontFamily: "'Pacifico', cursive", backgroundImage: 'linear-gradient(135deg, #a78bfa, #f472b6, #38bdf8)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          Together
        </span>
      </div>
    </div>
  );
};
