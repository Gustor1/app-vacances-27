import { blankItem } from './draft.ts';
import type { DraftItem, PlanningDraft, Provenance } from './types.ts';

function proofs(values: Record<string, string>): Provenance {
  return Object.fromEntries(Object.entries(values).map(([key, quote]) => [key, { origin:'source', quote }]));
}
function item(title: string, fields: Partial<DraftItem> = {}): DraftItem {
  return { ...blankItem(title), ...fields, evidence: { ...proofs({ title }), ...fields.evidence } };
}
const urban: PlanningDraft = {
  version:1, title:'Paris', evidence:proofs({ title:'Paris' }), notes:['Budget estimé : 80 EUR'],
  cities:[{ name:'Paris', evidence:proofs({ name:'Paris' }), days:[{ title:'Jour 1', date:'2027-05-01', evidence:proofs({ title:'Jour 1', date:'2027-05-01' }), items:[
    item('Musée du Louvre', { address:'Rue de Rivoli', period:'Matin', coordinates:[48.8606,2.3376], evidence:proofs({ address:'Rue de Rivoli', period:'Matin', coordinates:'48.8606, 2.3376' }) }),
    item('Hôtel Exemple', { category:'hotel', kind:'stay', checkIn:'2027-05-01', checkOut:'2027-05-02', booked:true, evidence:proofs({ checkIn:'2027-05-01', checkOut:'2027-05-02', booked:'Hôtel Exemple réservé' }) }),
  ] }] }],
};
const circuit: PlanningDraft = {
  version:1, title:'Shanghai → Pékin', evidence:proofs({ title:'Shanghai → Pékin' }), notes:[],
  cities:[
    { name:'Shanghai', evidence:proofs({ name:'Shanghai' }), days:[{ title:'Day 1', date:'2027-05-02', evidence:proofs({ title:'Day 1',date:'2027-05-02' }), items:[
      item('Night train', { category:'transport', kind:'transfer', toCity:'Pékin', mode:'train', departure:'2027-05-02T21:00', arrival:'2027-05-03T08:00', evidence:proofs({ toCity:'Pékin', departure:'2027-05-02T21:00', arrival:'2027-05-03T08:00' }) }),
    ] }] },
    { name:'Pékin', evidence:proofs({ name:'Pékin' }), days:[{ title:'Day 2', date:'2027-05-03', evidence:proofs({ title:'Day 2', date:'2027-05-03' }), items:[item('故宫', { address:'北京市东城区景山前街4号', evidence:proofs({ address:'北京市东城区景山前街4号' }) })] }] },
  ],
};
const ambiguous: PlanningDraft = {
  version:1, title:'Madrid', evidence:proofs({ title:'Madrid' }), notes:['Hôtel Alpha ou Hôtel Bêta ?','Arrivée le 3 ou le 4 ?'],
  cities:[{ name:'Madrid', evidence:proofs({ name:'Madrid' }), days:[{ title:'Día 1', date:'', evidence:proofs({ title:'Día 1' }), items:[
    item('Retiro', { period:'Tarde', evidence:proofs({ period:'Tarde' }) }),
    item('Casa Ejemplo', { kind:'suggestion', category:'food', evidence:{ title:{ origin:'suggestion', quote:'Casa Ejemplo' } } }),
    item('Museo alternativo', { kind:'alternative', optional:true }),
    item('Hôtel Alpha', { kind:'stay', category:'hotel', evidence:{ title:{ origin:'conflict', quote:'Hôtel Alpha ou Hôtel Bêta ?' } } }),
  ] }] }],
};
export const SYNTHETIC_EXAMPLES = [
  { source:'Paris\nJour 1 — 2027-05-01\nMatin : Musée du Louvre, Rue de Rivoli (48.8606, 2.3376)\nHôtel Exemple réservé, 2027-05-01 au 2027-05-02\nBudget estimé : 80 EUR', draft:urban },
  { source:'Shanghai → Pékin\nShanghai\nDay 1 — 2027-05-02\nNight train to Pékin, 2027-05-02T21:00 → 2027-05-03T08:00\nDay 2 — 2027-05-03\n故宫, 北京市东城区景山前街4号', draft:circuit },
  { source:'Madrid\nDía 1\nTarde : Retiro\nSuggestions : Casa Ejemplo\nAlternative : Museo alternativo\nHôtel Alpha ou Hôtel Bêta ?\nArrivée le 3 ou le 4 ?', draft:ambiguous },
];
