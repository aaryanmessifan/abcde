import { useEffect, useState } from 'react';
import { Cake, Heart, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchSettings } from '@/lib/services/settingsService';
import { PageHeader } from '@/components/ui/Feedback';

export function BirthdayPage() {
  const { profile } = useAuth();
  const [activated, setActivated] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('Bade Papa');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await fetchSettings();
      setMessage(settings.birthday_message || 'Happy Birthday. Thank you for being the foundation of our family. Your wisdom, patience, and love guide us every day. Today, we celebrate you — not just for the years you have lived, but for the lives you have touched. With all our love.');
      if (settings.user_name) setName(settings.user_name);
      else if (profile?.display_name) setName(profile.display_name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-ember-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!activated) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
        <PageHeader title="Birthday Protocol" subtitle="A special feature within your system." />

        <div className="card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-ember opacity-30 pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-ember-500/15 to-frost-500/5 flex items-center justify-center mx-auto mb-6 animate-glow">
              <Cake size={32} className="text-ember-400/50" />
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-ember-400/50 font-mono mb-4">
              <Lock size={11} />
              PROTOCOL READY
            </div>

            <h3 className="text-xl font-display font-semibold text-slate-300 mb-3">
              The birthday experience is ready.
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              When activated, this will reveal a heartfelt surprise — a personal message crafted with love. Activate it when the time is right.
            </p>

            <button
              onClick={() => setActivated(true)}
              className="btn-primary flex items-center gap-2 mx-auto animate-glow"
            >
              <Sparkles size={16} /> Activate Protocol
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Activated — cinematic experience
  return (
    <div className="fixed inset-0 z-50 bg-ink-950 flex items-center justify-center px-4 overflow-y-auto">
      <div className="fixed inset-0 bg-radial-ember opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.3] pointer-events-none" />

      <div className="relative max-w-lg w-full text-center py-10">
        {/* Floating sparkles */}
        <div className="relative mb-8 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-ember-500/20 to-frost-500/10 flex items-center justify-center mx-auto animate-glow">
            <Cake size={40} className="text-ember-400" />
          </div>
          <Sparkles size={16} className="absolute top-0 right-[30%] text-ember-400/60 animate-pulse-soft" />
          <Sparkles size={12} className="absolute top-4 left-[25%] text-frost-400/60 animate-pulse-soft" style={{ animationDelay: '500ms' }} />
          <Sparkles size={14} className="absolute bottom-0 right-[20%] text-ember-300/60 animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <p className="text-xs text-ember-400/80 font-mono tracking-widest mb-4">A MESSAGE FROM THE HEART</p>

          <h1 className="text-3xl md:text-4xl font-display font-semibold text-gradient-ember mb-6">
            Happy Birthday
          </h1>

          <p className="text-2xl font-display text-white mb-6">
            {name}
          </p>

          <div className="glass-strong rounded-2xl p-6 md:p-8 text-left">
            <p className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-ember-400/60">
            <Heart size={16} fill="currentColor" />
            <span className="text-sm font-mono">With love, always</span>
            <Heart size={16} fill="currentColor" />
          </div>

          <button
            onClick={() => setActivated(false)}
            className="mt-8 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
