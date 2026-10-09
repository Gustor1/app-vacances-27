import type { StoredState, DayPreparation } from '../types.ts';
export function publicPreparation(p?: DayPreparation): DayPreparation | undefined { return p ? {anchorStepId:p.anchorStepId,startTime:p.startTime,endTime:p.endTime,marginMinutes:p.marginMinutes,activeAlternativeId:p.activeAlternativeId,timings:p.timings?Object.fromEntries(Object.entries(p.timings).map(([id,t])=>[id,{durationMinutes:t.durationMinutes,transferMinutes:t.transferMinutes,fromStepId:t.fromStepId,startTime:t.startTime,source:t.source,checkedAt:t.checkedAt}])):undefined,alternatives:p.alternatives?.map(a=>({id:a.id,label:a.label,reason:a.reason,stepIds:a.stepIds}))} : undefined; }

export type PrivateState = Pick<StoredState, 'notes' | 'favorites' | 'done' | 'bookings' | 'expenses' | 'budget' | 'budgetCurrency' | 'exchangeRates' | 'rateQuotes' | 'budgetConversions' | 'packing' | 'phrases' | 'documents' | 'resume'> & {
  cityNotes: Record<string, string[]>;
  stayNotes: Record<string, string>;
  transferPrivate: Record<string, { reference: string; notes: string; booked: boolean }>;
  bonusPrivate: Record<string, { tip?: string; sourceUrl?: string }>;
};
export type TripContent = { shared: StoredState; private: PrivateState };
const bonusPublic = (b: NonNullable<StoredState['customBonus']>[number]) => ({ id: b.id, cityId: b.cityId, title: b.title, chineseName: b.chineseName, category: b.category, description: b.description, address: b.address, budget: b.budget, amapUrl: b.amapUrl });
/** Explicit whitelist: adding a future field does not silently make it public. */
export function splitContent(state: StoredState): TripContent {
  const j = state.journey!;
  const shared: StoredState = {
    version: 1,
    journey: { id: j.id, title: j.title, destinations: j.destinations, description: j.description, cover: j.cover, currency: j.currency, timezone: j.timezone, source: j.source, followsCatalog: false, status: j.status, countries: j.countries, endDate: j.endDate, highlights: j.highlights },
    departureDate: state.departureDate,
    cities: state.cities.map(c => ({ id: c.id, name: c.name, chineseName: c.chineseName, subtitle: c.subtitle, color: c.color, coordinates: c.coordinates, image: c.image, nights: c.nights, mapProvider: c.mapProvider, timezone: c.timezone, notes: [], days: c.days.map(d => ({ id: d.id, title: d.title, date: d.date, preparation: publicPreparation(d.preparation), steps: d.steps.map(s => ({ id: s.id, title: s.title, chineseName: s.chineseName, description: s.description, address: s.address, category: s.category, period: s.period, optional: s.optional, booking: s.booking, coordinates: s.coordinates, amapUrl: s.amapUrl })) })) })),
    notes: {}, favorites: [], done: [], bookings: [],
    stays: state.stays?.map(s => ({ cityId: s.cityId, name: s.name, chineseName: s.chineseName, address: s.address, checkIn: s.checkIn, checkOut: s.checkOut, notes: '' })),
    transfers: state.transfers?.map(s => ({ id: s.id, fromCityId: s.fromCityId, toCityId: s.toCityId, label: s.label, mode: s.mode, departure: s.departure, arrival: s.arrival, departureTimezone: s.departureTimezone, arrivalTimezone: s.arrivalTimezone, fromStation: s.fromStation, toStation: s.toStation, notes: '', reference: '', booked: false })),
    bonusCatalog: state.bonusCatalog?.map(bonusPublic), customBonus: state.customBonus?.map(bonusPublic),
  };
  const privateState: PrivateState = { notes: state.notes, favorites: state.favorites, done: state.done, bookings: state.bookings, expenses: state.expenses, budget: state.budget ?? state.budgetCny, budgetCurrency: state.budgetCurrency ?? j.currency, exchangeRates: state.exchangeRates ?? (state.cnyPerEuro ? { EUR: state.cnyPerEuro } : {}), rateQuotes: state.rateQuotes, budgetConversions: state.budgetConversions, packing: state.packing, phrases: state.phrases, documents: state.documents, resume: state.resume,
    cityNotes: Object.fromEntries(state.cities.map(c => [c.id, c.notes])), stayNotes: Object.fromEntries((state.stays || []).map(s => [s.cityId, s.notes])), transferPrivate: Object.fromEntries((state.transfers || []).map(s => [s.id, { reference: s.reference, notes: s.notes, booked: s.booked }])), bonusPrivate: Object.fromEntries([...(state.bonusCatalog || []), ...(state.customBonus || [])].map(b => [b.id, { tip: b.tip, sourceUrl: b.sourceUrl }])) };
  return JSON.parse(JSON.stringify({ shared, private: privateState })) as TripContent;
}
export function joinContent(content: TripContent): StoredState {
  const { shared, private: p } = content;
  const { cityNotes, stayNotes, transferPrivate, bonusPrivate, ...fields } = p;
  const cities = shared.cities.map(c => ({ ...c, notes: cityNotes?.[c.id] || [] }));
  const cityIds = new Set(cities.map(c => c.id));
  return { ...shared, ...fields, cities, expenses: p.expenses?.map(e => ({ ...e, cityId: cityIds.has(e.cityId) ? e.cityId : '' })), stays: shared.stays?.map(s => ({ ...s, notes: stayNotes?.[s.cityId] || '' })), transfers: shared.transfers?.map(s => ({ ...s, ...(transferPrivate?.[s.id] || {}) })), customBonus: shared.customBonus?.map(b => ({ ...b, ...(bonusPrivate?.[b.id] || {}) })), bonusCatalog: shared.bonusCatalog?.map(b => ({ ...b, ...(bonusPrivate?.[b.id] || {}) })) };
}
export function emptyPrivate(): PrivateState { return { notes: {}, favorites: [], done: [], bookings: [], cityNotes: {}, stayNotes: {}, transferPrivate: {}, bonusPrivate: {} }; }
