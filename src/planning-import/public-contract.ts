import { isValidDate, isValidDateTime, validCurrency } from '../lib.ts';
import { validTimezone } from '../time.ts';
import { MAX_SOURCE_LENGTH } from './types.ts';

export const STRUCTURED_LIMITS = { bytes: MAX_SOURCE_LENGTH * 4, characters: MAX_SOURCE_LENGTH, depth: 12, days: 100, items: 200 } as const;
export const structuredMessages = {
  syntax: 'JSON illisible. Fournis du JSON seul, sans bloc de code ni texte autour.',
  size: 'Le fichier structuré dépasse 200 000 octets ou 50 000 caractères. Rien n’a été tronqué.',
  format: 'Ce fichier n’est pas un planning structuré Détours.',
  backup: 'Ceci est une sauvegarde. Utilise Importer un fichier ou Restaurer mes données depuis Mes voyages.',
  version: 'Version du planning non prise en charge. Demande une sortie detours-planning version 1.',
  field: 'Champ inconnu ou obligatoire manquant.',
  value: 'Valeur invalide pour ce champ. Consulte le contrat du kit.',
  limit: 'Profondeur ou nombre d’éléments excessif.',
  read: 'Lecture du résultat impossible. Le brouillon précédent est conservé.',
} as const;
export class StructuredPlanningError extends Error {
  readonly code: keyof typeof structuredMessages;
  readonly path: string;
  constructor(code: keyof typeof structuredMessages, path = '$') { super(structuredMessages[code]); this.name = 'StructuredPlanningError'; this.code = code; this.path = path; }
}
type Schema = { type?: string | readonly string[]; const?: unknown; enum?: readonly unknown[]; properties?: Record<string, Schema>; required?: readonly string[]; additionalProperties?: false; items?: Schema; minItems?: number; maxItems?: number; minLength?: number; maxLength?: number; pattern?: string; format?: string; $ref?: string; $defs?: Record<string, Schema>; $schema?: string; title?: string };
const string = (maxLength: number, nullable = false, format?: string): Schema => ({ type: nullable ? ['string', 'null'] : 'string', maxLength, minLength: 1, pattern: '\\S', ...(format ? { format } : {}) });
const enumeration = (values: string[], nullable = false): Schema => ({ enum: nullable ? [...values, null] : values });
const object = (properties: Record<string, Schema>): Schema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const array = (items: Schema, maxItems: number, minItems = 0): Schema => ({ type: 'array', items, minItems, maxItems });
const categories = ['visit', 'food', 'transport', 'hotel', 'walk', 'shopping'];
const types = ['activity', 'stay', 'transfer', 'suggestion', 'alternative'];
export const PUBLIC_PLANNING_SCHEMA: Schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema', title: 'Détours structured planning v1',
  ...object({ format: { const: 'detours-planning' }, version: { const: 1 }, title: string(140), currency: string(3, true, 'currency'), timezone: string(100, true, 'timezone'),
    cities: array({ $ref: '#/$defs/city' }, 10, 1), notes: array(string(4000), 100), ambiguities: array(string(4000), 100), unmapped: array(string(4000), 100) }),
  $defs: {
    city: object({ name: string(100), days: array({ $ref: '#/$defs/day' }, 100, 1) }),
    day: object({ title: string(200), date: string(10, true, 'date'), items: array({ $ref: '#/$defs/item' }, 100) }),
    item: object({ type: enumeration(types), title: string(300), category: enumeration(categories), description: string(4000, true), address: string(1000, true),
      time: string(5, true, 'time'), period: string(200, true), checkIn: string(10, true, 'date'), checkOut: string(10, true, 'date'),
      from: string(100, true), to: string(100, true), mode: enumeration(['train', 'plane', 'bus', 'car', 'other'], true), departure: string(16, true, 'local-date-time'), arrival: string(16, true, 'local-date-time'),
      reservation: object({ status: enumeration(['unknown', 'confirmed']), reference: string(500, true) }) }),
  },
};
export type PublicItem = { type: 'activity' | 'stay' | 'transfer' | 'suggestion' | 'alternative'; title: string; category: import('../types.ts').Category;
  description: string | null; address: string | null; time: string | null; period: string | null; checkIn: string | null; checkOut: string | null; from: string | null; to: string | null;
  mode: 'train' | 'plane' | 'bus' | 'car' | 'other' | null; departure: string | null; arrival: string | null; reservation: { status: 'unknown' | 'confirmed'; reference: string | null } };
export type PublicPlanning = { format: 'detours-planning'; version: 1; title: string; currency: string | null; timezone: string | null;
  cities: { name: string; days: { title: string; date: string | null; items: PublicItem[] }[] }[]; notes: string[]; ambiguities: string[]; unmapped: string[] };
function fail(code: keyof typeof structuredMessages, path: string): never { throw new StructuredPlanningError(code, path); }
function validate(value: unknown, schema: Schema, path: string): void {
  if (schema.$ref) return validate(value, PUBLIC_PLANNING_SCHEMA.$defs![schema.$ref.split('/').at(-1)!], path);
  if ('const' in schema && value !== schema.const) fail('value', path);
  if (schema.enum && !schema.enum.includes(value)) fail('value', path);
  if (schema.type) {
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    if (!(Array.isArray(schema.type) ? schema.type : [schema.type]).includes(type)) fail('value', path);
  }
  if (value === null) return;
  if (typeof value === 'string') {
    if (value.length > (schema.maxLength ?? Infinity) || (schema.minLength && !value.trim()) || !value.trim()) fail('value', path);
    const formats: Record<string, (v: string) => boolean> = { date: isValidDate, 'local-date-time': v => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) && isValidDateTime(v), time: v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v), currency: validCurrency, timezone: validTimezone };
    if (schema.format && !formats[schema.format](value)) fail('value', path);
    // Values are data only. Refuse dangerous executable URL schemes even inside prose.
    if (/(?:javascript|vbscript|data)\s*:/iu.test(value)) fail('value', path);
  }
  if (Array.isArray(value)) {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) fail('limit', path);
    value.forEach((v, i) => validate(v, schema.items!, `${path}[${i}]`));
  } else if (schema.properties && typeof value === 'object') {
    for (const key of Object.keys(value)) if (!Object.hasOwn(schema.properties, key)) fail('field', `${path}.${/^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(key) ? key : '[?]'}`);
    for (const key of schema.required!) if (!Object.hasOwn(value, key)) fail('field', `${path}.${key}`);
    for (const [key, child] of Object.entries(schema.properties)) validate((value as Record<string, unknown>)[key], child, `${path}.${key}`);
  }
}
/** Check depth/duplicate keys before JSON.parse; no silent repair or code-fence removal. */
function boundedJson(source: string): unknown {
  const stack: (Set<string> | null)[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      const start = i++;
      for (; i < source.length; i++) { if (source[i] === '\\') i++; else if (source[i] === '"') break; }
      let next = i + 1; while (/\s/.test(source[next] || '') && next < source.length) next++;
      if (source[next] === ':' && stack.at(-1)) {
        const key = JSON.parse(source.slice(start, i + 1)) as string, keys = stack.at(-1)!;
        if (keys.has(key)) fail('syntax', '$'); keys.add(key);
      }
    } else if (c === '{' || c === '[') {
      stack.push(c === '{' ? new Set() : null); if (stack.length > STRUCTURED_LIMITS.depth) fail('limit', '$');
    } else if (c === '}' || c === ']') stack.pop();
  }
  return JSON.parse(source);
}
export function readStructuredPlanning(source: string): PublicPlanning {
  if (source.length > STRUCTURED_LIMITS.characters || new TextEncoder().encode(source).length > STRUCTURED_LIMITS.bytes) fail('size', '$');
  let value: unknown;
  try { value = boundedJson(source); } catch (error) { if (error instanceof StructuredPlanningError) throw error; fail('syntax', '$'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('format', '$');
  const root = value as Record<string, unknown>;
  if (root.format !== 'detours-planning') { if ('scope' in root || 'state' in root || 'trips' in root) fail('backup', '$'); fail('format', '$.format'); }
  if (root.version !== 1) fail('version', '$.version');
  validate(value, PUBLIC_PLANNING_SCHEMA, '$');
  const planning = value as PublicPlanning;
  let days = 0, items = 0;
  planning.cities.forEach((city, ci) => city.days.forEach((day, di) => {
    const base = `$.cities[${ci}].days[${di}]`;
    if (++days > STRUCTURED_LIMITS.days) fail('limit', '$.cities');
    day.items.forEach((item, ii) => {
      const p = `${base}.items[${ii}]`;
      if (++items > STRUCTURED_LIMITS.items) fail('limit', '$.cities');
      if (item.checkIn && item.checkOut && item.checkOut < item.checkIn) fail('value', `${p}.checkOut`);
      if (['suggestion', 'alternative'].includes(item.type) && item.reservation.status === 'confirmed') fail('value', `${p}.reservation.status`);
      if (item.type !== 'stay' && (item.checkIn || item.checkOut)) fail('value', `${p}.checkIn`);
      if (item.type !== 'transfer' && [item.from,item.to,item.mode,item.departure,item.arrival].some(v => v !== null)) fail('value', `${p}.from`);
      if (item.from && item.from !== city.name) fail('value', `${p}.from`);
    });
  }));
  return planning;
}
export function publicValueAt(root: PublicPlanning, path: string): unknown {
  if (!/^\$(?:\.[A-Za-z]+|\[\d+\])+$/.test(path)) throw new Error('Invalid external provenance path');
  let value: unknown = root;
  for (const key of path.slice(1).match(/[A-Za-z]+|\d+/g) || []) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) throw new Error('Missing external provenance');
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
export async function readStructuredFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>): Promise<{ source: string; name: string }> {
  if (!/\.json$/i.test(file.name)) fail('format', '$');
  if (file.size > STRUCTURED_LIMITS.bytes) fail('size', '$');
  let buffer: ArrayBuffer;
  try { buffer = await file.arrayBuffer(); } catch { fail('read', '$'); }
  if (buffer.byteLength > STRUCTURED_LIMITS.bytes) fail('size', '$');
  let source: string; try { source = new TextDecoder('utf-8', { fatal: true }).decode(buffer); } catch { fail('syntax', '$'); }
  readStructuredPlanning(source); return { source, name: file.name.slice(0, 255) };
}
