import { useState, type FormEvent } from 'react';
import { Lock, Mail, User as UserIcon, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
      const { error } = await signUp(email, password, displayName || undefined);
      if (error) setError(error);
      else setInfo('Account created. You can now sign in.');
      setMode('signin');
    } else if (mode === 'reset') {
      const { error } = await resetPassword(email);
      if (error) setError(error);
      else setInfo('Password reset link sent to your email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.4] pointer-events-none" />
      <div className="fixed inset-0 bg-radial-ember opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ember-500 to-ember-700 flex items-center justify-center mx-auto mb-4 shadow-ember">
            <span className="font-display font-bold text-white text-xl">BP</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">Bade Papa OS</h1>
          <p className="text-sm text-slate-500 mt-1">Your personal AI command center</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-1 bg-ink-800/50 rounded-xl p-1 mb-5">
            <button onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signin' ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
            <button onClick={() => { setMode('signup'); setError(null); setInfo(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="input-field w-full pl-10" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field w-full pl-10" required />
              </div>
            </div>
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field w-full pl-10" required />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-frost-400">{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} <ArrowRight size={16} /></>}
            </button>
          </form>

          {mode === 'signin' && (
            <button onClick={() => { setMode('reset'); setError(null); setInfo(null); }} className="text-xs text-slate-500 hover:text-ember-400 mt-4 w-full text-center transition-colors">
              Forgot password?
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className="text-xs text-slate-500 hover:text-ember-400 mt-4 w-full text-center transition-colors">
              Back to sign in
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          <Sparkles size={10} className="inline mr-1" />
          Your data is private and encrypted · v2.0
        </p>
      </div>
    </div>
  );
}
