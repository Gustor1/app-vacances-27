import type { PublicItem, PublicPlanning } from './public-contract.ts';
const item = (type: PublicItem['type'], title: string, extra: Partial<PublicItem> = {}): PublicItem => ({ type, title, category: 'visit', description: null, address: null,
  time: null, period: null, checkIn: null, checkOut: null, from: null, to: null, mode: null, departure: null, arrival: null, reservation: { status: 'unknown', reference: null }, ...extra });
export const MINIMAL_PUBLIC_EXAMPLE: PublicPlanning = { format: 'detours-planning', version: 1, title: 'Escale fictive sans date', currency: null, timezone: null,
  cities: [{ name: 'Albi', days: [{ title: 'Jour 1', date: null, items: [] }] }], notes: [], ambiguities: [], unmapped: [] };
export const COMPLETE_PUBLIC_EXAMPLE: PublicPlanning = { format: 'detours-planning', version: 1, title: 'Voyage fictif — 上海 et 苏州', currency: 'CNY', timezone: 'Asia/Shanghai', cities: [
  { name: '上海', days: [{ title: 'Jour 1 — arrivée', date: '2027-05-03', items: [
    item('stay', 'Hôtel fictif Alpha', { category: 'hotel', address: 'Adresse fictive fournie', checkIn: '2027-05-03', checkOut: '2027-05-04', reservation: { status: 'confirmed', reference: 'FICTIF-001' } }),
    item('activity', 'Musée fictif', { description: 'Visite proposée par le planning fourni, sans billet confirmé.', time: '14:00', address: '虚构地址一号' }),
    item('transfer', 'Train fictif vers 苏州', { category: 'transport', from: '上海', to: '苏州', mode: 'train', departure: '2027-05-04T09:00', arrival: '2027-05-04T10:00', reservation: { status: 'unknown', reference: null } }),
  ] }] },
  { name: '苏州', days: [{ title: 'Jour 2 — jardin', date: null, items: [item('suggestion', 'Jardin fictif', { period: 'Matin' }), item('alternative', 'Café fictif si pluie', { category: 'food', description: 'Alternative non réservée.' })] }] },
], notes: ['English note: confirm opening hours.', '备注：保留原文。'], ambiguities: ['La date du jardin reste inconnue.'], unmapped: ['Estimation fournie : 80 CNY, non payée ; aucune dépense créée.'] };
