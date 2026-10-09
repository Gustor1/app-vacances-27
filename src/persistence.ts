import type { City, StoredState } from './types';
import { cleanReferences, isObj } from './lib.ts';

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
type Identified = { id?: string; cityId?: string };
const rowId = (row: Identified) => row.id || row.cityId!;
const identified = (values: unknown[]): values is Identified[] => values.every(x => isObj(x) && (typeof x.id === 'string' || typeof x.cityId === 'string'));
/** Three-way merge: keep changes on each side; the latest action wins only on the same field. */
export function mergeChanges<T>(base: T, local: T, remote: T): T {
  if (equal(base, local)) return remote;
  if (equal(base, remote) || equal(local, remote)) return local;
  if (base === undefined && Array.isArray(local) && Array.isArray(remote)) return mergeChanges([] as T, local, remote);
  if (base === undefined && isObj(local) && isObj(remote)) return mergeChanges({} as T, local, remote);
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    if (identified(base) && identified(local) && identified(remote)) {
      const baseMap = new Map(base.map(x => [rowId(x), x]));
      const localMap = new Map(local.map(x => [rowId(x), x]));
      const remoteMap = new Map(remote.map(x => [rowId(x), x]));
      const localOrderChanged = !equal(base.filter(x=>localMap.has(rowId(x))).map(x=>rowId(x)), local.filter(x=>baseMap.has(rowId(x))).map(x=>rowId(x)));
      const preferred = localOrderChanged ? local : remote;
      const ids = [...new Set([...preferred.map(x=>rowId(x)), ...local.map(x=>rowId(x)), ...remote.map(x=>rowId(x))])];
      const result = ids.flatMap(id => {
        const before = baseMap.get(id), ours = localMap.get(id), theirs = remoteMap.get(id);
        if (before && !ours) return []; // Explicit deletion in this action.
        if (before && !theirs && equal(ours, before)) return []; // Preserve deletion elsewhere.
        if (!ours) return theirs ? [theirs] : [];
        if (!theirs) return [ours];
        return [mergeChanges(before || {} as typeof ours, ours, theirs)];
      });
      return result as T;
    }
    if ([...base,...local,...remote].every(x=>typeof x==='string')) {
      const removed = new Set(base.filter(x=>!local.includes(x)));
      return [...new Set([...remote.filter(x=>!removed.has(x)),...local.filter(x=>!base.includes(x))])] as T;
    }
    return local;
  }
  if (isObj(base) && isObj(local) && isObj(remote)) {
    const result: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])) {
      if (Object.hasOwn(base,key) && !Object.hasOwn(local,key)) continue;
      const merged = mergeChanges(base[key], local[key], remote[key]);
      if (merged !== undefined) Object.defineProperty(result,key,{value:merged,enumerable:true,configurable:true,writable:true});
    }
    return result as T;
  }
  return local;
}
export function mergeCatalog(state: StoredState, catalog: City[]): StoredState {
  // Backups without a baseline are preserved; the caller provides the legacy baseline when known.
  let cities = state.catalogBase
    ? mergeChanges(state.catalogBase, state.cities, catalog)
    : state.cities;
  const used = new Set([...(state.stays||[]).map(x=>x.cityId),...(state.expenses||[]).map(x=>x.cityId),...(state.customBonus||[]).map(x=>x.cityId),...(state.transfers||[]).flatMap(x=>[x.fromCityId,x.toCityId]), ...(state.bonusCatalog||[]).filter(b=>state.favorites.includes(b.id)||state.bookings.includes(b.id)||state.notes[b.id]).map(b=>b.cityId)]);
  for (const city of state.cities) if ((used.has(city.id) || state.notes[city.id]) && !cities.some(c=>c.id===city.id)) cities=[...cities,city];
  return cleanReferences({ ...state, cities, ...(state.bonusCatalog ? {bonusCatalog:state.bonusCatalog.filter(b=>cities.some(c=>c.id===b.cityId))} : {}), catalogBase: catalog });
}
