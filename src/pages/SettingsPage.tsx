import { PageHeader } from '@/components/ui/Feedback';
import { isAIConfigured } from '@/lib/ai/engine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAppLock } from '@/lib/auth/AppLockContext';
import { CheckCircle2, XCircle, Bot, Palette, Bell, Lock, Cake, LogOut, Shield, Lock as LockIcon, Unlock } from 'lucide-react';
import type { PageId } from '@/config/navigation';

interface SettingsPageProps {
  onNavigate: (page: PageId) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const aiConfigured = isAIConfigured();
  const { user, profile, signOut } = useAuth();
  const { hasPin, lockNow } = useAppLock();

  const settingsGroups: {
    title: string;
    icon: typeof Bot;
    items: { label: string; value: string; status: 'connected' | 'local' | 'fixed' | 'secure' }[];
  }[] = [
    {
      title: 'AI Configuration',
      icon: Bot,
      items: [
        { label: 'AI Provider', value: import.meta.env.VITE_AI_PROVIDER || 'Local (built-in)', status: aiConfigured ? 'connected' : 'local' },
        { label: 'API Status', value: aiConfigured ? 'Connected' : 'Using local intelligence', status: aiConfigured ? 'connected' : 'local' },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Theme', value: 'Dark (Primary)', status: 'fixed' as const },
        { label: 'Accent', value: 'Electric Orange', status: 'fixed' as const },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [{ label: 'Task Reminders', value: 'In-app (browser)', status: 'fixed' as const }],
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'API Keys', value: 'Server-side only', status: 'secure' as const },
        { label: 'Data Storage', value: 'Supabase (encrypted)', status: 'secure' as const },
        { label: 'Row Level Security', value: 'Per-user isolation', status: 'secure' as const },
        { label: 'App Lock', value: hasPin ? 'Enabled' : 'Disabled', status: hasPin ? 'secure' : 'local' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Settings" subtitle="Configure your personal AI command center." />

      {/* Account */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Shield size={16} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-display font-semibold text-white">Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Email</span>
            <span className="text-sm text-slate-200">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Display Name</span>
            <span className="text-sm text-slate-200">{profile?.display_name ?? 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">User ID</span>
            <span className="text-xs text-slate-500 font-mono">{user?.id.slice(0, 8)}...</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {hasPin && (
            <button onClick={lockNow} className="btn-ghost text-sm flex items-center gap-2">
              <LockIcon size={14} /> Lock Now
            </button>
          )}
          <button onClick={signOut} className="btn-ghost text-sm flex items-center gap-2 !text-red-400 hover:!bg-red-500/10">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Settings groups */}
      <div className="space-y-5">
        {settingsGroups.map((group) => (
          <div key={group.title} className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <group.icon size={16} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-display font-semibold text-white">{group.title}</h3>
            </div>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200">{item.value}</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Creator Mode */}
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <Palette size={16} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-display font-semibold text-white">Creator Mode</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            Personalize your system — set your name, configure the birthday message, and manage app lock.
          </p>
          <button onClick={() => onNavigate('creator')} className="text-sm text-ember-400 hover:text-ember-300 transition-colors">
            Open Creator Mode →
          </button>
        </div>

        {/* Birthday Protocol */}
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <Cake size={16} className="text-slate-500" />
            </div>
            <h3 className="text-sm font-display font-semibold text-white">Birthday Protocol</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            A special feature within your system. Activate it when the time is right.
          </p>
          <button onClick={() => onNavigate('birthday')} className="text-sm text-slate-600 hover:text-ember-400/70 transition-colors">
            Open Birthday Protocol →
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-600 font-mono">BADE PAPA OS · v2.0 · Secured with Supabase Auth + RLS</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'connected' | 'local' | 'fixed' | 'secure' }) {
  if (status === 'connected') {
    return <span className="flex items-center gap-1 text-[11px] text-frost-400"><CheckCircle2 size={12} /> Active</span>;
  }
  if (status === 'secure') {
    return <span className="flex items-center gap-1 text-[11px] text-frost-400"><Lock size={11} /> Secured</span>;
  }
  if (status === 'local') {
    return <span className="flex items-center gap-1 text-[11px] text-amber-400/70"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" /> Local</span>;
  }
  return null;
}
