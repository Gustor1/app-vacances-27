import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlanning } from '../src/planning-import/parser.ts';
import { assessPlanning } from '../scripts/evaluate-planning-stress.mjs';
import { stressCorpus } from './fixtures/planning/stress-corpus.mjs';
for (const id of ['07','08','12','15','17','19','20','23','33']) test(`lot01 defect ${id}`,()=> {
 const e=stressCorpus.find(e=>e.id===id); const d=parsePlanning(e.source);
 assert.equal(assessPlanning(e,d).passed,true,JSON.stringify(assessPlanning(e,d)));
});
import { reviewPassages } from '../src/planning-import/review.ts';
test('review separates explicit notes from unprocessed material and links incomplete assignments',()=> {
 const source='# Programme\nJour 1\n- Musée\nCorrection finale : changer le jour.\nNote : prendre de l’eau.';
 const d=parsePlanning(source), p=reviewPassages(d,source);
 assert.ok(p.some(p=>p.quote==='Correction finale : changer le jour.'));
 assert.ok(p.some(p=>p.kind==='assignment'));
 assert.ok(!p.some(p=>p.quote==='Note : prendre de l’eau.'));
});
test('lowercase words without a following structural day do not become cities',()=> {
 const d=parsePlanning('préparer le sac\nNote : vérifier les horaires.');assert.equal(d.cities[0].name,'');
});
test('emoji and quoted text retain exact source provenance',()=> {
 const source='## 📍 Arles\n### 📅 Jour 1\n> - 🏛 Musée bleu'; const d=parsePlanning(source);
 assert.equal(d.cities[0].days[0].items[0].title,'Musée bleu');
 assert.equal(d.cities[0].days[0].items[0].evidence.title.quote,'> - 🏛 Musée bleu');
});
test('ASCII arrows do not split hyphenated names or ordinary minus signs',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\n*Saint-Anne -> Port-Saint-Louis\n- Est - Ouest');
 assert.deepEqual(d.cities[0].days[0].items.map(i=>i.title),['Saint-Anne','Port-Saint-Louis','Est - Ouest']);
});
test('quote removal is restricted to line starts',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\n> - Atelier A > B');assert.equal(d.cities[0].days[0].items[0].title,'Atelier A > B');
});
test('weekday inside an activity does not define a new day',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\n- Marché du mardi');assert.equal(d.cities[0].days.length,1);
});
test('abbreviated dates need an explicit year and a literal dot',()=> {
 const d=parsePlanning('Ville: Vannes\n14 juil.\n- Port\n15 juilX 2027\n- Quai');assert.equal(d.cities[0].days[0].date,'');
});
test('table inheritance stops at a new day or conflicting explicit date',()=> {
 const d=parsePlanning('Ville: Vannes\n| Jour | Date | Activité |\n| --- | --- | --- |\n| Jour 1 | 2027-05-01 | Port |\n| Jour 2 | | Quai |');
 assert.deepEqual(d.cities[0].days.map(d=>d.date),['2027-05-01','']);
});
test('PDF footer filtering preserves numbered activities and cautious continuation',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\n1. Tour 2\n- Palais des\n  Ducs\n- Musée\n  fermé le mardi\nPage 1 / 2');
 assert.deepEqual(d.cities[0].days[0].items.map(i=>i.title),['Tour 2','Palais des Ducs','Musée']);
});
test('a named confirmed hotel stays a stay while a budget estimate stays in notes',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\n- Hôtel Bleu réservé\nHôtel : environ 80 EUR, pas encore choisi');
 assert.equal(d.cities[0].days[0].items[0].kind,'stay');assert.equal(d.cities[0].days[0].items.length,1);
});
test('compacted long notes never disappear from the review behind a heading',()=> {
 const source='# Brouillon\n'+Array.from({length:320},(_,i)=>`Phrase inconnue ${i}.`).join('\n');
 const d=parsePlanning(source);assert.ok(reviewPassages(d,source).some(p=>p.kind==='unprocessed'));
});
test('a conditional alternative is never proposed as a confirmed ordinary activity',()=> {
 const source='Ville: Vannes\nJour 1\n- Si pluie : Musée Bleu ; sinon : Parc Vert';const d=parsePlanning(source);
 assert.ok(d.cities[0].days[0].items.every(i=>i.kind==='alternative'&&!i.booked));
 assert.ok(reviewPassages(d,source).some(p=>p.kind==='ambiguous'));
});
test('ambiguous numeric date after a day label leads to a review passage until user correction',()=> {
 const source='Ville: Vannes\nJour 1 — 06/07/2027\n- Musée bleu';const d=parsePlanning(source);
 assert.ok(reviewPassages(d,source).some(p=>p.kind==='ambiguous'));
});
test('new personal notes are not mistaken for unprocessed source quotes',()=> {
 const source='Ville: Vannes\nJour 1\n- Musée bleu';const d=parsePlanning(source);d.notes.push('Mon ajout personnel.');
 assert.ok(!reviewPassages(d,source).some(p=>p.quote==='Mon ajout personnel.'));
});
import { activityFromPassage } from '../src/planning-import/review.ts';
import { validateDraft } from '../src/planning-import/draft.ts';
test('a long promoted passage stays durable without truncating source or inventing a title',()=> {
 const source='Note : '+'x'.repeat(20000);const d=parsePlanning(source);d.cities[0].days.push({title:'Jour 1',date:'',items:[activityFromPassage(source)],evidence:{title:{origin:'user',quote:''}}});
 assert.doesNotThrow(()=>validateDraft(d,source,true,true));
 assert.equal(d.cities[0].days[0].items[0].title,'');
 assert.equal(d.cities[0].days[0].items[0].evidence.description.quote,source);
});
test('a named hotel with only an estimated price remains a proposed stay',()=> {
 const d=parsePlanning('Ville: Vannes\nJour 1\nHôtel : Hôtel Cuivre, environ 90 EUR');
 assert.equal(d.cities[0].days[0].items.length,1);assert.equal(d.cities[0].days[0].items[0].kind,'stay');assert.equal(d.cities[0].days[0].items[0].booked,false);
});
test('unselected hotel estimates stay notes inside bullets and table cells too',()=> {
 for(const source of ['Ville: Vannes\nJour 1\n- Hôtel : environ 90 EUR, pas encore choisi','Ville: Vannes\n| Jour | Activité |\n| --- | --- |\n| Jour 1 | Hôtel : environ 90 EUR, pas encore choisi |']) {
  const d=parsePlanning(source);assert.equal(d.cities.flatMap(c=>c.days.flatMap(d=>d.items)).length,0);
 }
});
