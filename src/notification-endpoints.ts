/** Fixed providers prevent the delivery service becoming an arbitrary HTTP proxy. */
export function validPushEndpoint(endpoint: string): boolean {
  try { const u=new URL(endpoint); return u.protocol==='https:' && !u.username && !u.password && (!u.port || u.port==='443') && ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname) && u.pathname.length>1 && !u.hash; } catch { return false; }
}
