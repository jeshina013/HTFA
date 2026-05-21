import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      setErrorMsg('Database is not configured. Please set your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      // Record a secure sign-in history audit log in the database (silent fallback if table doesn't exist yet)
      try {
        await supabase.from('login_history').insert({
          user_id: data.user.id,
          email: data.user.email
        });
      } catch (logErr) {
        console.warn("Audit sign-in history table offline or not created yet:", logErr.message);
      }

      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4 font-sans selection:bg-primary selection:text-white">
      
      {/* Premium Background Graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-slate-900 to-slate-950 pointer-events-none z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/70 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <span className="font-extrabold text-white text-xl tracking-tighter">HT</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Hi-Tech Fuel Automate Ltd
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            TECHNICAL INTERVENTION PORTAL
          </p>
        </div>

        {/* Errors & Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium leading-relaxed text-left font-mono">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="border-b border-slate-800 pb-3 mb-2 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Admin Sign In
            </span>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Admin Email</label>
            <input 
              type="email" 
              required 
              placeholder="admin@hitech.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/80 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/80 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-10 mt-2 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-600/90 text-white rounded-lg text-xs font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-900 text-center">
          <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
            SECURE ACCESS ONLY • BRN: C26234033
          </span>
        </div>

      </div>
    </div>
  );
}
