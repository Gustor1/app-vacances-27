import { validPushEndpoint } from './notification-endpoints.ts';
export { validPushEndpoint } from './notification-endpoints.ts';
type PushClient={rpc:(name:string,args:Record<string,unknown>)=>PromiseLike<{error:unknown}>};
export function pushSupport(): boolean { return typeof window!=='undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
export async function registerPush(client: PushClient, vapidPublicKey: string, deviceId: string, isCurrent=()=>true) {
  if(!pushSupport())throw Error('Push unsupported');
  if(await Notification.requestPermission()!=='granted')throw Error('Push permission denied');
  if(!isCurrent())throw Error('Enrollment cancelled');
  const bytes=Uint8Array.from(atob(vapidPublicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const sw=await navigator.serviceWorker.getRegistration();
  if(!sw?.active)throw Error('Install or reload the application before enabling push');
  const subscription=await sw.pushManager.getSubscription() || await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  const value=subscription.toJSON();
  if(!isCurrent())throw Error('Enrollment cancelled');
  if(!value.endpoint || !validPushEndpoint(value.endpoint) || !value.keys?.p256dh || !value.keys.auth)throw Error('Invalid subscription');
  const {error}=await client.rpc('detours_register_push',{p_device:deviceId,p_endpoint:value.endpoint,p_p256dh:value.keys.p256dh,p_auth:value.keys.auth});
  if(error){await subscription.unsubscribe();throw error;}
}
export async function disablePush(client: PushClient, deviceId?: string, isCurrent=()=>true) {
  const {error}=await client.rpc('detours_disable_push',{p_device:deviceId||null});if(error)throw error;
  if(pushSupport() && isCurrent()){const sw=await navigator.serviceWorker.getRegistration();await (await sw?.pushManager.getSubscription())?.unsubscribe();}
}
