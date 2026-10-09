import { isObj } from '../lib.ts';

export type FieldConflict = { path: string; base: unknown; local: unknown; remote: unknown; kind: 'field' | 'deletion' | 'order' };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const identity = (v: Record<string, unknown>) => String(v.id ?? v.cityId);
const rows = (a: unknown[]): a is Record<string, unknown>[] => a.every(v => isObj(v) && (typeof v.id === 'string' || typeof v.cityId === 'string'));
/** Server clocks never arbitrate: independent edits merge; overlapping edits need a choice. */
export function mergeWithConflicts<T>(base: T, local: T, remote: T, choices: Record<string, 'local' | 'remote'> = {}) {
  const conflicts: FieldConflict[] = [];
  function conflict(path: string, before: unknown, ours: unknown, theirs: unknown, kind: FieldConflict['kind']) {
    conflicts.push({ path, base: before, local: ours, remote: theirs, kind });
    return choices[path] === 'remote' ? theirs : ours;
  }
  function merge(before: unknown, ours: unknown, theirs: unknown, path: string): unknown {
    if (equal(before, ours)) return theirs;
    if (equal(before, theirs) || equal(ours, theirs)) return ours;
    if (ours === undefined || theirs === undefined) return conflict(path, before, ours, theirs, 'deletion');
    if (before === undefined && isObj(ours) && isObj(theirs)) before = {};
    if (before === undefined && Array.isArray(ours) && Array.isArray(theirs)) before = [];
    if (Array.isArray(before) && Array.isArray(ours) && Array.isArray(theirs)) {
      if ([...before, ...ours, ...theirs].every(v => typeof v === 'string')) {
        const removed = new Set(before.filter(v => !ours.includes(v) || !theirs.includes(v)));
        return [...new Set([...theirs, ...ours])].filter(v => !removed.has(v));
      }
      if (rows(before) && rows(ours) && rows(theirs)) {
        const b = new Map(before.map(v => [identity(v), v])), l = new Map(ours.map(v => [identity(v), v])), r = new Map(theirs.map(v => [identity(v), v]));
        const common = before.map(identity).filter(id => l.has(id) && r.has(id));
        const order = (values: Record<string, unknown>[]) => values.map(identity).filter(id => common.includes(id));
        const bo = order(before), lo = order(ours), ro = order(theirs);
        const lc = !equal(bo, lo), rc = !equal(bo, ro);
        let preferred = lc ? ours : theirs;
        if (lc && rc && !equal(lo, ro)) preferred = conflict(`${path}.$order`, bo, ours, theirs, 'order') as Record<string, unknown>[];
        const ids = [...new Set([...preferred.map(identity), ...ours.map(identity), ...theirs.map(identity)])];
        return ids.map(id => merge(b.get(id), l.get(id), r.get(id), `${path}[${id}]`)).filter(v => v !== undefined);
      }
      return conflict(path, before, ours, theirs, 'field');
    }
    if (isObj(before) && isObj(ours) && isObj(theirs)) {
      const result: Record<string, unknown> = {};
      for (const key of new Set([...Object.keys(before), ...Object.keys(ours), ...Object.keys(theirs)])) {
        const value = merge(before[key], ours[key], theirs[key], path ? `${path}.${key}` : key);
        if (value !== undefined) Object.defineProperty(result, key, { value, enumerable: true, writable: true, configurable: true });
      }
      return result;
    }
    return conflict(path, before, ours, theirs, 'field');
  }
  return { value: merge(base, local, remote, '') as T, conflicts };
}
