import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
function validConfig() {
  if (!url || !key) return false;
  try {
    const parsed = new URL(url);
    if (!(parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) return false;
    if (key.startsWith('sb_secret_')) return false;
    if (key.split('.').length === 3) { const claims = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (claims.role !== 'anon') return false; }
    return true;
  } catch { return false; }
}
export const supabase = validConfig() ? createClient(url!, key!, { auth: { flowType: 'pkce', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }) : null;
export const cloudConfigError = (url || key) && !supabase ? 'La configuration de synchronisation est invalide.' : '';
