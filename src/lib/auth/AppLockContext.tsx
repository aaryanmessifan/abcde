import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'app_lock_active';

interface AppLockContextValue {
  hasPin: boolean;
  locked: boolean;
  loading: boolean;
  setupPin: (pin: string) => Promise<{ error: string | null }>;
  verifyPin: (pin: string) => Promise<{ error: string | null }>;
  removePin: () => Promise<{ error: string | null }>;
  lockNow: () => void;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'bade-papa-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPinExists = useCallback(async () => {
    if (!user) { setHasPin(false); setLoading(false); return; }
    try {
      const { data } = await supabase.from('app_lock').select('id').eq('user_id', user.id).maybeSingle();
      setHasPin(!!data);
      if (data && sessionStorage.getItem(STORAGE_KEY) !== 'false') {
        setLocked(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkPinExists();
  }, [checkPinExists]);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!hasPin || !user) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setLocked(true);
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [hasPin, user]);

  const setupPin = async (pin: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    if (pin.length < 4) return { error: 'PIN must be at least 4 digits' };
    const pinHash = await hashPin(pin);
    const { error } = await supabase.from('app_lock').upsert({ user_id: user.id, pin_hash: pinHash, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) return { error: error.message };
    setHasPin(true);
    setLocked(false);
    sessionStorage.setItem(STORAGE_KEY, 'false');
    return { error: null };
  };

  const verifyPin = async (pin: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    const pinHash = await hashPin(pin);
    const { data, error } = await supabase.from('app_lock').select('pin_hash').eq('user_id', user.id).maybeSingle();
    if (error || !data) return { error: 'No lock configured' };
    if (data.pin_hash !== pinHash) return { error: 'Incorrect PIN' };
    setLocked(false);
    sessionStorage.setItem(STORAGE_KEY, 'false');
    return { error: null };
  };

  const removePin = async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('app_lock').delete().eq('user_id', user.id);
    if (error) return { error: error.message };
    setHasPin(false);
    setLocked(false);
    return { error: null };
  };

  const lockNow = () => {
    setLocked(true);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <AppLockContext.Provider value={{ hasPin, locked, loading, setupPin, verifyPin, removePin, lockNow }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}
