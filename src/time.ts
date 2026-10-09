export function validTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}

export function dateInTimezone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year','month','day'].map(name => parts.find(part => part.type === name)!.value).join('-');
}

/** Resolve a local wall clock using the zone's actual seasonal offset.
 * Gaps and repeated times are rejected instead of silently choosing an instant. */
export function localTimeInstant(value: string, timezone: string): number {
  if (!validTimezone(timezone)) throw new Error('Fuseau horaire invalide.');
  const nominal = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0, 16) !== value) throw new Error('Date et heure invalides.');
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const wall = (instant: number) => {
    const parts = formatter.formatToParts(instant);
    const get = (name: string) => parts.find(p => p.type === name)!.value;
    return `${get('year').padStart(4, '0')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  };
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = nominal + hours * 3_600_000;
    offsets.add(Date.parse(`${wall(sample)}:00Z`) - sample);
  }
  const candidates = [...offsets].map(offset => nominal - offset).filter(instant => wall(instant) === value);
  if (candidates.length !== 1) throw new Error(candidates.length ? 'Cette heure est répétée lors du changement d’heure. Précise un horaire non ambigu.' : 'Cette heure locale n’existe pas lors du changement d’heure. Vérifie ton billet.');
  return candidates[0];
}

export function transferTimeError(departure: string, arrival: string, departureTimezone: string, arrivalTimezone: string): string {
  try {
    if (!validTimezone(departureTimezone) || !validTimezone(arrivalTimezone)) return 'Fuseau horaire invalide.';
    const start = departure ? localTimeInstant(departure, departureTimezone) : undefined;
    const end = arrival ? localTimeInstant(arrival, arrivalTimezone) : undefined;
    return start !== undefined && end !== undefined && end < start ? 'L’arrivée doit avoir lieu après le départ, en tenant compte des fuseaux.' : '';
  } catch (error) { return error instanceof Error ? error.message : 'Horaires invalides.'; }
}
