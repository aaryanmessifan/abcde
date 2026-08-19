import { supabase } from '../supabase';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  user_name: 'Bade Papa',
  birthday_message: 'Happy Birthday, Bade Papa. Thank you for everything. For the wisdom you share, the patience you show, and the love you give without condition. You are our foundation, our guiding light. Today, we celebrate you — not just for the years you have lived, but for the lives you have touched. From Aaryan, with all my heart.',
  birthday_date: '',
  ai_personality: 'warm',
  custom_categories: [],
  creator_mode_enabled: false,
  family_members_seed: '',
  photos: [],
  memories_seed: '',
};

export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw error;

  const settings = { ...DEFAULT_SETTINGS };
  if (data) {
    for (const row of data) {
      try {
        (settings as Record<string, unknown>)[row.key] = row.value;
      } catch {
        // skip invalid keys
      }
    }
  }
  return settings;
}

export async function saveSetting(key: keyof AppSettings, value: string | string[] | boolean): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key: key as string,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function saveAllSettings(settings: Partial<AppSettings>): Promise<void> {
  const promises = Object.entries(settings).map(([key, value]) =>
    supabase.from('app_settings').upsert({
      key,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
  );
  await Promise.all(promises);
}
