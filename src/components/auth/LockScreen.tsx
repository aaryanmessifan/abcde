import { useState, useEffect, useRef } from 'react';
import { Lock, Delete, Loader2, Shield } from 'lucide-react';
import { useAppLock } from '@/lib/auth/AppLockContext';

export function LockScreen() {
  const { verifyPin } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true); setError(null);
    const { error } = await verifyPin(pin);
    if (error) { setError(error); setPin(''); }
    setLoading(false);
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 8) return;
    setPin(prev => prev + digit);
    setError(null);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.4] pointer-events-none" />
      <div className="fixed inset-0 bg-radial-ember opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-ember-500/15 flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-ember-400" />
        </div>

        <h1 className="text-xl font-display font-semibold text-white mb-2">App Locked</h1>
        <p className="text-sm text-slate-500 mb-8">Enter your PIN to unlock</p>

        {/* PIN dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {Array.from({ length: Math.max(pin.length, 4) }).slice(0, 8).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-ember-400 scale-110' : 'bg-ink-600'}`} />
          ))}
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* Hidden input for mobile keyboards */}
        <form onSubmit={handleSubmit}>
          <input ref={inputRef} type="tel" value={pin} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPin(val); setError(null); }} className="sr-only" inputMode="numeric" maxLength={8} />
        </form>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button key={d} onClick={() => handleDigit(d)} className="aspect-square rounded-2xl glass card-hover flex items-center justify-center text-xl font-display font-medium text-slate-100 active:scale-90 transition-all">
              {d}
            </button>
          ))}
          <div className="aspect-square flex items-center justify-center">
            {loading ? <Loader2 size={24} className="animate-spin text-ember-400" /> : <Shield size={20} className="text-slate-600" />}
          </div>
          <button onClick={() => handleDigit('0')} className="aspect-square rounded-2xl glass card-hover flex items-center justify-center text-xl font-display font-medium text-slate-100 active:scale-90 transition-all">0</button>
          <button onClick={handleBackspace} className="aspect-square rounded-2xl flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all">
            <Delete size={22} />
          </button>
        </div>

        {pin.length >= 4 && !loading && (
          <button onClick={handleSubmit} className="btn-primary mt-6 w-full max-w-[280px] mx-auto">
            Unlock
          </button>
        )}
      </div>
    </div>
  );
}
