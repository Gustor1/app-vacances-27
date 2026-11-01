import { blankItem, validateDraft } from './draft.ts';
import { readStructuredPlanning, type PublicPlanning } from './public-contract.ts';
import type { PlanningDraft, Provenance } from './types.ts';

export type StructuredSource = { format: 'detours-planning'; version: 1; name: string };
/** A path proves only what the reformatted file says. Never a citation of the
 * user's original itinerary, nor an automatic user confirmation. */
const proof = (field: string, path: string, value: unknown): Provenance => ({ [field]: { origin: 'external', path, quote: JSON.stringify(value) } });
export function structuredToDraft(planning: PublicPlanning, source: string): PlanningDraft {
  const notes = [...planning.notes, ...planning.ambiguities.map(n => `[ambiguities] ${n}`), ...planning.unmapped.map(n => `[unmapped] ${n}`)];
  const draft: PlanningDraft = { version: 1, title: planning.title, notes, evidence: proof('title', '$.title', planning.title), cities: planning.cities.map((city, ci) => ({
    name: city.name, evidence: proof('name', `$.cities[${ci}].name`, city.name), days: city.days.map((day, di) => {
      const dayPath = `$.cities[${ci}].days[${di}]`;
      return { title: day.title, date: day.date || '', evidence: { ...proof('title', `${dayPath}.title`, day.title), ...(day.date ? proof('date', `${dayPath}.date`, day.date) : {}) }, items: day.items.map((entry, ii) => {
        const path = `${dayPath}.items[${ii}]`, item = blankItem();
        item.kind = entry.type; item.category = entry.category; item.optional = ['suggestion', 'alternative'].includes(entry.type);
        const fields = ['title','description','address','time','period','checkIn','checkOut','departure','arrival'] as const;
        for (const field of fields) { item[field] = entry[field] || ''; if (entry[field]) Object.assign(item.evidence, proof(field, `${path}.${field}`, entry[field])); }
        item.toCity = entry.to || ''; item.mode = entry.mode || 'other'; item.reference = entry.reservation.reference || '';
        if (entry.to) Object.assign(item.evidence, proof('toCity', `${path}.to`, entry.to));
        if (entry.reservation.reference) Object.assign(item.evidence, proof('reference', `${path}.reservation.reference`, entry.reservation.reference));
        item.booked = entry.reservation.status === 'confirmed';
        if (item.booked) Object.assign(item.evidence, proof('booked', `${path}.reservation.status`, 'confirmed'));
        // Without both supplied endpoints, a real transfer would invent an origin
        // or lose its destination. Keep a transport activity and explicit notes.
        if (entry.type === 'transfer' && (!entry.from || !entry.to || planning.cities.filter(c => c.name === entry.to).length !== 1)) {
          item.kind = 'activity'; item.category = 'transport';
          notes.push(`${path} [unmapped transfer]: ${JSON.stringify(entry)}`);
        }
        return item;
      }) };
    }) })),
  };
  // Public notes and fallback details can exceed the internal 300-note collection
  // while still fitting the 50k source contract. Join intact, never truncate.
  if (notes.length > 300) draft.notes = [notes.join('\n\n')];
  return validateDraft(draft, source, false, true, true);
}
export function prepareStructured(source: string, name = 'mon-voyage.detours.json') {
  const planning = readStructuredPlanning(source);
  return { source, draft: structuredToDraft(planning, source), sourceOrigin: undefined,
    structuredSource: { format: 'detours-planning', version: 1, name } as StructuredSource, currency: planning.currency, timezone: planning.timezone };
}
