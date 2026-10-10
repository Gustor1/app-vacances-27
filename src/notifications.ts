import { activeSteps, clockMinutes } from './day-preparation.ts';
import { dateInTimezone, validTimezone } from './time.ts';
import type { Category, StoredState } from './types.ts';

export type ReminderOverride = { mode: 'default' | 'off' | 'custom'; offsets?: number[] };
export type NotificationPreferences = { version: 1; timezone: string; recapTime: string; offsets: number[]; categories: Category[]; activityPush: boolean; recapPush: boolean; email: boolean; followed: boolean; overrides: Record<string, ReminderOverride> };
export type ProgramItem = { id: string; kind: 'step' | 'transfer'; cityId: string; dayId?: string; date: string; title: string; category: Category; location: string; timezone: string; time?: string; instant?: number; durationMinutes?: number; booked: boolean; done: boolean; coordinates?: [number, number] };
export type Weather = { date: string; place: string; fetchedAt: string; source: string; targetKey?: string; rainProbability?: number; uv?: number; min?: number; max?: number };
export type Recap = { id: string; tripId: string; tripTitle: string; date: string; timezone: string; items: ProgramItem[]; revision: string; checklist: string[]; weather: Weather[] };
export type Occurrence = { key: string; tripId: string; objectId: string; type: 'activity' | 'recap'; channel: 'push' | 'email'; due: number; expires: number; revision: string; deviceId?: string; recipient: string };
export const notificationKey = (tripId: string) => `detours-notifications-v1:${tripId}`;
export function defaultNotificationPreferences(timezone = ''): NotificationPreferences {
  return { version: 1, timezone: validTimezone(timezone) ? timezone : '', recapTime: '20:00', offsets: [30], categories: ['visit', 'transport'], activityPush: false, recapPush: false, email: false, followed: true, overrides: {} };
}
export function normalizeOffsets(value: unknown): number[] {
  if (!Array.isArray(value) || !value.length || value.some(n => !Number.isInteger(n) || n < 1 || n > 10080)) throw new Error('Invalid reminder offsets');
  const offsets=[...new Set<number>(value)].sort((a,b) => a-b);
  if(offsets.length>5)throw new Error('Invalid reminder offsets');return offsets;
}
export function parseNotificationPreferences(raw: string | null, timezone = ''): NotificationPreferences {
  if (!raw) return defaultNotificationPreferences(timezone);
  const p = JSON.parse(raw) as NotificationPreferences;
  if (!p || p.version !== 1 || (p.timezone !== '' && !validTimezone(p.timezone)) || clockMinutes(p.recapTime) === undefined || !Array.isArray(p.categories) || p.categories.some(c => !['visit','food','transport','hotel','walk','shopping'].includes(c)) || ['activityPush','recapPush','email','followed'].some(k => typeof p[k as keyof NotificationPreferences] !== 'boolean') || !p.overrides || typeof p.overrides !== 'object' || Array.isArray(p.overrides) || Object.keys(p.overrides).length > 10000) throw new Error('Invalid notification preferences');
  const offsets = normalizeOffsets(p.offsets);
  const overrides: Record<string, ReminderOverride> = {};
  for (const [id, v] of Object.entries(p.overrides)) {
    if (!v || !['default','off','custom'].includes(v.mode)) throw new Error('Invalid reminder override');
    overrides[id] = v.mode === 'custom' ? { mode: 'custom', offsets: normalizeOffsets(v.offsets) } : { mode: v.mode };
  }
  return { version: 1, timezone: p.timezone, recapTime: p.recapTime, offsets, categories: [...new Set(p.categories)], activityPush: p.activityPush, recapPush: p.recapPush, email: p.email, followed: p.followed, overrides };
}
/** Notification policy: first repeated instant; move nonexistent wall time to
 * the next valid minute. Does not alter stricter ticket validation in time.ts. */
export function notificationInstant(value: string, zone: string): number {
  if (!validTimezone(zone) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || clockMinutes(value.slice(11)) === undefined) throw new Error('Invalid notification time');
  const nominal = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0,16) !== value) throw new Error('Invalid notification date');
  const formatter = new Intl.DateTimeFormat('en-CA', {timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const wall = (ms: number) => { const p=formatter.formatToParts(ms); const get=(k:string)=>p.find(x=>x.type===k)!.value; return `${get('year').padStart(4,'0')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`; };
  const offsets = new Set<number>();
  for(let h=-36;h<=36;h+=6) {const ms=nominal+h*3600000; offsets.add(Date.parse(`${wall(ms)}:00Z`)-ms);}
  for(let minute=0;minute<=180;minute++) {
    const desired=new Date(nominal+minute*60000).toISOString().slice(0,16);
    const matches=[...offsets].map(o=>nominal+minute*60000-o).filter(ms=>wall(ms)===desired).sort((a,b)=>a-b);
    if(matches.length) return matches[0];
  }
  throw new Error('Unresolvable notification time');
}
export function shiftDate(date: string, days: number): string { const d=new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); }
function civilDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && value.slice(0,4) !== '0000' && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value; }
export function projectProgram(state: StoredState): ProgramItem[] {
  const result: ProgramItem[]=[];
  const instants=new Map<string,number>();
  const resolve=(value:string,zone:string)=>{const key=JSON.stringify([value,zone]);const previous=instants.get(key);if(previous!==undefined)return previous;const instant=notificationInstant(value,zone);instants.set(key,instant);return instant;};
  for(const city of state.cities) for(const day of city.days) {
    if(!day.date || !civilDate(day.date)) continue;
    for(const step of activeSteps(day)) {
      const timing=day.preparation?.timings?.[step.id], timezone=city.timezone || state.journey?.timezone || '';
      let instant: number|undefined;
      if(timing?.startTime && validTimezone(timezone)) {try {instant=resolve(`${day.date}T${timing.startTime}`,timezone);} catch { /* Keep untimed item in recap. */ }}
      result.push({id:step.id,kind:'step',cityId:city.id,dayId:day.id,date:day.date,title:step.title,category:step.category,location:step.address || city.name,timezone,time:timing?.startTime,instant,durationMinutes:timing?.durationMinutes,booked:state.bookings.includes(step.id),done:state.done.includes(step.id),coordinates:step.coordinates || city.coordinates});
    }
  }
  for(const transfer of state.transfers || []) {
    if(!transfer.departure) continue;
    const city=state.cities.find(c=>c.id===transfer.fromCityId);
    const timezone=transfer.departureTimezone || city?.timezone || state.journey?.timezone || '';
    let instant:number|undefined;try {instant=resolve(transfer.departure,timezone);} catch { /* Invalid time cannot trigger delivery. */ }
    if(!/^\d{4}-\d{2}-\d{2}T/.test(transfer.departure) || !civilDate(transfer.departure.slice(0,10))) continue;
    result.push({id:transfer.id,kind:'transfer',cityId:transfer.fromCityId,date:transfer.departure.slice(0,10),title:transfer.label,category:'transport',location:transfer.fromStation,timezone,time:transfer.departure.slice(11,16),instant,booked:transfer.booked,done:false,coordinates:city?.coordinates});
  }
  return result;
}
export function reminderItem(state: StoredState,kind: ProgramItem['kind'],id: string): ProgramItem | undefined {
  const projected=projectProgram(state).find(item=>item.kind===kind && item.id===id);if(projected)return projected;
  if(kind==='step')for(const city of state.cities)for(const day of city.days){const step=activeSteps(day).find(s=>s.id===id);if(step)return {id,kind,cityId:city.id,dayId:day.id,date:day.date||'',title:step.title,category:step.category,location:step.address||city.name,timezone:city.timezone||state.journey?.timezone||'',time:day.preparation?.timings?.[id]?.startTime,booked:state.bookings.includes(id),done:state.done.includes(id)};}
  if(kind==='transfer'){const transfer=state.transfers?.find(item=>item.id===id);if(transfer)return {id,kind,cityId:transfer.fromCityId,date:transfer.departure.slice(0,10),title:transfer.label,category:'transport',location:transfer.fromStation,timezone:transfer.departureTimezone||state.journey?.timezone||'',booked:transfer.booked,done:false};}
  return undefined;
}
export function checklistFor(items: ProgramItem[], weather: Weather[]): string[] {
  const list:string[]=[];
  if(weather.some(w=>(w.rainProbability??0)>=50)) list.push('Protection contre la pluie');
  if(items.some(i=>i.category==='walk') && weather.some(w=>(w.uv??0)>=3)) list.push('Protection solaire');
  if(items.some(i=>i.category==='walk')) list.push('Chaussures adaptées à la marche');
  return list;
}
export function buildRecap(state: StoredState, date: string, timezone: string, weather: Weather[]=[], program=projectProgram(state)): Recap | null {
  const items=program.filter(i=>i.date===date);if(!items.length)return null;
  const tripId=state.journey?.id || 'legacy';
  // Exact canonical projection, rather than a collision-prone short hash.
  const revision=JSON.stringify(items);
  const forecasts=weather.filter(w=>w.date===date && (!w.targetKey || items.some(i=>JSON.stringify([i.date,i.coordinates,i.timezone])===w.targetKey)));
  return {id:JSON.stringify([tripId,date]),tripId,tripTitle:state.journey?.title||'',date,timezone,items,revision,weather:forecasts,checklist:checklistFor(items,forecasts)};
}
export function reminderOffsets(item: ProgramItem,p: NotificationPreferences): number[] {
  const override=p.overrides[`${item.kind}:${item.id}`];
  if(override?.mode==='off')return [];
  return override?.mode==='custom' ? normalizeOffsets(override.offsets) : p.categories.includes(item.category)?p.offsets:[];
}
export function planOccurrences(state: StoredState,p: NotificationPreferences,recipient: string,devices: string[],now: number): Occurrence[] {
  if(!p.followed || !validTimezone(p.timezone) || ['completed','cancelled'].includes(state.journey?.status||''))return [];
  const items=projectProgram(state),tripId=state.journey?.id||'legacy',result:Occurrence[]=[];
  devices=[...new Set(devices)];
  const add=(objectId:string,type:Occurrence['type'],channel:Occurrence['channel'],due:number,expires:number,revision:string,offset:number,deviceId?:string)=>{
    if(due<now)return; // Activation never catches up old occurrences.
    result.push({key:JSON.stringify([recipient,tripId,objectId,type,offset,channel,deviceId||'']),recipient,tripId,objectId,type,channel,due,expires,revision,deviceId});
  };
  if(p.activityPush) for(const item of items) if(!item.done && item.instant!==undefined) for(const offset of reminderOffsets(item,p)) for(const device of devices) add(`${item.kind}:${item.id}`,'activity','push',item.instant-offset*60000,Math.min(item.instant,item.instant-offset*60000+300000),JSON.stringify(item),offset,device);
  for(const date of new Set(items.map(i=>i.date))) {
    const recap=buildRecap(state,date,p.timezone,[],items)!;
    const due=notificationInstant(`${shiftDate(date,-1)}T${p.recapTime}`,p.timezone),expires=Math.min(due+7200000,notificationInstant(`${date}T00:00`,p.timezone));
    if(p.email)add(date,'recap','email',due,expires,recap.revision,0);
    if(p.recapPush)for(const device of devices)add(date,'recap','push',due,expires,recap.revision,0,device);
  }
  return result;
}
export function recapDates(p: NotificationPreferences,now=new Date()) { const today=dateInTimezone(p.timezone,now);return {today,tomorrow:shiftDate(today,1)}; }
