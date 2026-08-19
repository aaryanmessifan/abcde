import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Lock, Unlock, Trash2, Save, Palette, Bell, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAppLock } from '@/lib/auth/AppLockContext';
import { PageHeader } from '@/components/ui/Feedback';
import { saveAllSettings, fetchSettings } from '@/lib/services/settingsService';
import type { AppSettings } from '@/types';

export function CreatorModePage() {
  const { profile, updateProfile } = useAuth();
  const { hasPin, setupPin, removePin } = useAppLock();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [birthdayMessage, setBirthdayMessage] = useState('');
  const [birthdayDate, setBirthdayDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<'setup' | 'remove'>('setup');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await fetchSettings();
      setBirthdayMessage(settings.birthday_message ?? '');
      setBirthdayDate(settings.birthday_date ?? '');
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAllSettings({ birthday_message: birthdayMessage, birthday_date: birthdayDate } as Partial<AppSettings>);
      if (displayName !== profile?.display_name) {
        await updateProfile(displayName);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handlePinAction = async () => {
    setPinError(null);
    if (pinMode === 'setup') {
      if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
      const { error } = await setupPin(pinInput);
      if (error) setPinError(error);
      else { setPinInput(''); setPinMode('remove'); }
    } else {
      const { error } = await removePin();
      if (error) setPinError(error);
      else { setPinMode('setup'); }
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-ember-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Creator Mode" subtitle="Personalize your system — name, birthday message, and app lock." />

      {/* Profile */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <SettingsIcon size={16} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-display font-semibold text-white">Your Profile</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="What should the AI call you?" className="input-field w-full" />
          </div>
        </div>
      </div>

      {/* App Lock */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Shield size={16} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-display font-semibold text-white">App Lock</h3>
          <span className={`ml-auto text-[11px] flex items-center gap-1 ${hasPin ? 'text-frost-400' : 'text-slate-500'}`}>
            {hasPin ? <><Lock size={11} /> Enabled</> : <><Unlock size={11} /> Disabled</>}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {hasPin
            ? 'App lock is active. The app will auto-lock after 5 minutes of inactivity. Remove your PIN below to disable.'
            : 'Set a PIN to lock the app. It will auto-lock after inactivity, and you can lock manually from Settings. Your PIN is never stored in plain text.'}
        </p>
        {hasPin ? (
          <button onClick={() => { setPinMode('remove'); handlePinAction(); }} className="btn-ghost text-sm flex items-center gap-2 !text-red-400 hover:!bg-red-500/10">
            <Trash2 size={14} /> Remove PIN
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Set PIN (4-8 digits)</label>
              <input type="tel" value={pinInput} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPinInput(val.slice(0, 8)); setPinError(null); }} placeholder="••••" className="input-field w-full" inputMode="numeric" maxLength={8} />
            </div>
            {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            <button onClick={handlePinAction} disabled={pinInput.length < 4} className="btn-primary text-sm flex items-center gap-2">
              <Lock size={14} /> Enable Lock
            </button>
          </div>
        )}
      </div>

      {/* Birthday Protocol Configuration */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Palette size={16} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-display font-semibold text-white">Birthday Protocol</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Birthday Date</label>
            <input type="date" value={birthdayDate} onChange={e => setBirthdayDate(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Custom Message</label>
            <textarea value={birthdayMessage} onChange={e => setBirthdayMessage(e.target.value)} placeholder="Write a heartfelt message that will appear on the birthday page..." rows={5} className="input-field w-full resize-none" />
            <p className="text-xs text-slate-500 mt-1.5">This message will be displayed when the birthday experience is activated.</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving ? 'Saving...' : saved ? 'Saved!' : <><Save size={16} /> Save Changes</>}
      </button>
    </div>
  );
}
