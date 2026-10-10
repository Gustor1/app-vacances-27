import { notificationWorker } from './handler.ts';

const names = ['NOTIFICATION_WORKER_SECRET', 'NOTIFICATIONS_ENABLED', 'NOTIFICATION_APP_ORIGIN', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'] as const;
let loading: Promise<Record<string,string>> | undefined;
/** Configured environment deployments remain supported. Connector deployments
 * load only the notification-specific configuration from encrypted Vault.
 * The privileged key is supplied by Supabase, never returned to clients. */
export async function loadWorkerConfiguration() {
  if (Deno.env.get('NOTIFICATION_WORKER_SECRET')) return {};
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
  if (!url || !key) throw Error('Worker configuration unavailable');
  const response = await fetch(`${url}/rest/v1/rpc/detours_notification_worker_configuration`, {
    method: 'POST', headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json' },
    body: '{}', signal: AbortSignal.timeout(10000), redirect: 'error',
  });
  if (!response.ok) throw Error('Worker configuration unavailable');
  const configuration = await response.json();
  if (!configuration || typeof configuration.NOTIFICATION_WORKER_SECRET !== 'string' || !configuration.NOTIFICATION_WORKER_SECRET) throw Error('Worker configuration unavailable');
  return Object.fromEntries(names.filter(name => typeof configuration[name] === 'string').map(name => [name, configuration[name]]));
}
export async function configuredNotificationWorker(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    loading ||= loadWorkerConfiguration();
    return await notificationWorker(request, await loading);
  } catch {
    loading = undefined;
    return new Response('Worker configuration unavailable', { status: 503 });
  }
}
