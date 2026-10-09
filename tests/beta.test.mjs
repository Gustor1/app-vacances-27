import test from 'node:test';
import assert from 'node:assert/strict';
import { blankTrip, chinaTrip, archive, duplicateTrip, returnTrip, parseImport, tripKey, writeTrip, readTrip } from '../src/journeys.ts';
import { validateState } from '../src/lib.ts';
import { confirmVisits, emptyWorld, countrySummary, writeWorld, readWorld, WORLD_KEY } from '../src/world.ts';
import { geographyCountry, countryName, countryCodes } from '../src/countries.ts';
import { directionsLink, placeLink } from '../src/maps.ts';
import { splitContent, joinContent, emptyPrivate } from '../src/cloud/projection.ts';
import { mergeWithConflicts } from '../src/cloud/merge.ts';
import { AccountStorage, localTripStorage } from '../src/cloud/storage.ts';
import { syncRecord, acceptRemote, resolveRecord, recordContent } from '../src/cloud/engine.ts';
import { betaTranslations } from '../src/locales/beta.ts';
import { translate } from '../src/locale-utils.ts';
import { ACCOUNT_HINT_KEY, readAccountHint } from '../src/cloud/session-cache.ts';

test('un accusé de réception arrivé après un départ ne réactive jamais la capsule', async () => {
  const storage=new AccountStorage(new MemoryStorage(),'account');
  const trip=blankTrip({title:'Départ'}),key=tripKey(trip.journey.id);writeTrip(storage,trip);
  const before=storage.record(key);
  await syncRecord(storage,key,{save:async(_key,_record,content)=>{
    storage.put(key,{...storage.record(key),revoked:true,pending:false});
    return {status:'saved',record:{content,revision:1,private_revision:1,role:'editor',deleted:false}};
  }});
  assert.equal(storage.record(key).revoked,true);assert.equal(storage.getItem(key),null);assert.equal(storage.record(key).raw,before.raw);
});

class MemoryStorage {
  values = new Map(); fail = false;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, raw) { if (this.fail) throw new Error('Quota'); this.values.set(key, raw); }
  removeItem(key) { this.values.delete(key); }
}
const completed = () => blankTrip({ title: 'France et Japon', status: 'completed', countries: ['FR', 'JP'] });
test('une capsule distante inchangée ne redéclenche pas la synchronisation',()=>{
  let changes=0;const storage=new AccountStorage(new MemoryStorage(),'owner',()=>changes++);
  const trip=blankTrip({id:'dedup',title:'Sans boucle'}),key=tripKey('dedup');writeTrip(storage,trip);
  const record=storage.record(key);storage.put(key,record);storage.put(key,record);
  assert.equal(changes,1);
});
test('résolution commune : choix complets requis et les deux sources restent récupérables', () => {
  const backing = new MemoryStorage(), storage = new AccountStorage(backing, 'owner');
  const trip = blankTrip({ id:'common', title:'Commun' });
  const base = splitContent(trip), key=tripKey('common');
  acceptRemote(storage,key,{content:base,revision:1,private_revision:1,role:'owner',deleted:false,fullSharing:true,allowedFields:['notes']});
  trip.notes.general='Local';writeTrip(storage,trip);
  const remote=structuredClone(base);remote.private.notes.general='Distant';
  acceptRemote(storage,key,{content:remote,revision:1,private_revision:2,role:'owner',deleted:false,fullSharing:true,allowedFields:['notes']});
  const conflict=storage.record(key).conflict;
  assert.ok(conflict);assert.throws(()=>resolveRecord(storage,key,{}));
  resolveRecord(storage,key,Object.fromEntries(conflict.fields.map(f=>[f.path,'remote'])));
  assert.equal(readTrip(storage,'common').notes.general,'Distant');
  const backups=[...backing.values].filter(([k])=>k.includes('~conflict-')).map(([,raw])=>JSON.parse(raw).raw);
  assert.equal(backups.length,2);assert.ok(backups.some(s=>s.includes('Local')));assert.ok(backups.some(s=>s.includes('Distant')));
});
test('un changement de périmètre conserve le travail en attente sans réexposer une catégorie masquée', () => {
  const backing=new MemoryStorage(),storage=new AccountStorage(backing,'member'),trip=blankTrip({id:'mask',title:'Masquage'}),key=tripKey('mask');
  trip.documents=[{id:'d',title:'Document',content:'Visible auparavant'}];
  acceptRemote(storage,key,{content:splitContent(trip),revision:1,private_revision:1,role:'editor',deleted:false,fullSharing:true,allowedFields:['notes','documents']});
  trip.notes.general='Brouillon non envoyé';writeTrip(storage,trip);
  const remote=splitContent(trip);delete remote.private.documents;remote.private.notes.general='Commun';
  acceptRemote(storage,key,{content:remote,revision:2,private_revision:1,role:'editor',deleted:false,fullSharing:true,allowedFields:['notes']});
  assert.equal(readTrip(storage,'mask').documents,undefined);assert.equal(storage.record(key).accessChanged,true);
  const backup=[...backing.values].find(([k])=>k.includes('~access-'));
  assert.ok(JSON.parse(backup[1]).raw.includes('Brouillon non envoyé'));
  assert.equal(storage.record(key).pending,false);
});
test('session expirée : identité de cache conservée sans jeton ; déconnexion enlève seulement l’indice, jamais les carnets', () => {
  const backing = new MemoryStorage(), id = '10000000-0000-4000-8000-000000000001';
  const storage = new AccountStorage(backing, id), trip = completed(); writeTrip(storage, trip);
  backing.setItem(ACCOUNT_HINT_KEY, JSON.stringify({ version: 1, id, email: 'beta@example.test' }));
  assert.equal(readAccountHint(backing).id, id); assert.equal(readAccountHint(backing).access_token, undefined);
  backing.removeItem(ACCOUNT_HINT_KEY); assert.equal(readAccountHint(backing), null); assert.ok(storage.getItem(tripKey(trip.journey.id)));
  backing.setItem(ACCOUNT_HINT_KEY, '{broken'); assert.equal(readAccountHint(backing), null);
});
test('toutes les traductions bêta gardent les variables et les quatre langues', () => {
  for (const [source, translations] of Object.entries(betaTranslations)) for (const [i, language] of ['en', 'zh-CN', 'es'].entries()) {
    assert.ok(translations[i]?.trim(), source + ': ' + language);
    const variables = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(variables(source), variables(translations[i]), source);
    assert.equal(translate(source, language), translations[i]);
  }
});
test('pays stables, statuts validés, anciens exports restent lisibles sans pays inventés', () => {
  assert.equal(geographyCountry.get('250'), 'FR'); assert.equal(geographyCountry.get('156'), 'CN');
  assert.equal(countryCodes.size, 250); assert.equal(countryName('FR', 'en'), 'France');
  const legacy = chinaTrip(); assert.equal(legacy.journey.countries, undefined); assert.equal(legacy.journey.status, undefined);
  assert.ok(validateState(legacy));
  for (const settings of [{ status: 'published' }, { countries: ['ZZ'] }, { countries: ['FR', 'FR'] }, { endDate: '2027-02-30' }]) assert.equal(validateState(blankTrip({ title: 'x', ...settings })), false);
});
test('visites multi-pays idempotentes, annulation, import et duplication ne comptent pas des carnets', () => {
  const trip = completed();
  let world = confirmVisits(emptyWorld(), trip, ['FR', 'FR', 'JP']);
  assert.equal(world.visits.length, 2);
  const beforeIds = world.visits.map(v => v.id);
  world = confirmVisits(world, trip, ['FR', 'JP']); assert.deepEqual(world.visits.map(v => v.id), beforeIds);
  const copy = duplicateTrip(trip), imported = parseImport(JSON.stringify(archive(trip)))[0];
  assert.equal(copy.journey.status, 'planning'); assert.equal(imported.journey.status, 'planning');
  assert.equal(countrySummary('FR', world, [trip, copy, imported]).count, 1);
  assert.equal(countrySummary('FR', world, [copy]).upcoming.length, 1);
  const cancelled = { ...trip, journey: { ...trip.journey, status: 'cancelled' } };
  assert.equal(countrySummary('FR', world, [cancelled]).upcoming.length, 0);
  assert.throws(() => confirmVisits(world, cancelled, ['FR']));
  world = confirmVisits(world, trip, ['FR']); assert.equal(world.visits.length, 1);
  // Membership alone adds neither visits nor preparation to a personal world.
  assert.equal(countrySummary('FR', emptyWorld(), []).count, 0);
});
test('ancien séjour, suppression de carnet et restauration préservent les identités', () => {
  const backing = new MemoryStorage(), trip = completed(); writeTrip(backing, trip);
  const world = confirmVisits(emptyWorld(), trip, ['FR']);
  world.visits.push({ id: 'old', stayId: 'historic', country: 'JP', year: 1998, label: 'Souvenir' });
  writeWorld(backing, world); backing.removeItem(tripKey(trip.journey.id));
  assert.deepEqual(readWorld(backing), world);
  const account = new AccountStorage(backing, 'account'); writeWorld(account, world);
  assert.equal(readWorld(account).visits.length, 2); assert.deepEqual(readWorld(backing).visits.map(v => v.id), readWorld(account).visits.map(v => v.id));
});
test('repartir garde les adresses, enlève dates, réservations, références et dépenses', () => {
  const original = chinaTrip(); original.done = ['sz-1-arrival']; original.bookings = ['sz-1-arrival']; original.departureDate = '2027-01-01'; original.packing = [{ id: 'p', label: 'Passeport', packed: true }]; original.expenses = [{ id: 'e', cityId: '', label: 'Taxe', amount: 10, currency: 'EUR', category: 'other' }];
  const copy = returnTrip(original, 'Retour');
  assert.ok(copy.cities.length); assert.deepEqual(copy.bookings, []); assert.deepEqual(copy.done, []); assert.deepEqual(copy.expenses, []); assert.equal(copy.departureDate, ''); assert.equal(copy.packing[0].packed, false); assert.ok(validateState(copy)); assert.equal(original.packing[0].packed, true);
});
test('Google Maps encode accents, chinois, coordonnées validées, départ actuel et étape suivante ; Amap garde ses requêtes', () => {
  const city = { name: 'Paris', chineseName: '', mapProvider: 'google' };
  const place = { title: 'Musée d’Orsay', address: '1 rue de la Légion d’honneur' };
  const url = new URL(directionsLink(city, place));
  assert.equal(url.searchParams.get('api'), '1'); assert.equal(url.searchParams.get('origin'), null); assert.equal(url.searchParams.get('travelmode'), 'walking'); assert.match(url.searchParams.get('destination'), /Musée d’Orsay.*Paris.*honneur/);
  const next = new URL(directionsLink(city, { title: '故宫', coordinates: [39.9, 116.4] }, 'transit', place)); assert.equal(next.searchParams.get('destination'), '39.9,116.4'); assert.match(next.searchParams.get('origin'), /Musée/);
  assert.match(new URL(placeLink(city, { title: '京都', coordinates: [999, 10] })).searchParams.get('query'), /京都/);
  const amap = new URL(directionsLink({ ...city, name: '北京', mapProvider: 'amap' }, { title: '故宫', coordinates: [39.9, 116.4] })); assert.equal(amap.hostname, 'uri.amap.com'); assert.match(amap.searchParams.get('keyword'), /北京.*故宫/); assert.equal(amap.toString().includes('39.9'), false);
});
test('projection partagée retire notes, références, documents, argent et champs futurs ; copie lecteur sans privés', () => {
  const original = chinaTrip(); original.notes.general = 'SECRET'; original.cities[0].notes = ['SECRET']; original.documents = [{ id: 'd', title: 'Passeport', content: 'SECRET' }]; original.futureSecret = 'SECRET'; original.transfers = [{ id: 't', fromCityId: 'shenzhen', toCityId: 'guangzhou', label: 'Train', mode: 'train', departure: '', arrival: '', fromStation: '', toStation: '', reference: 'SECRET', notes: 'SECRET', booked: true }];
  const content = splitContent(original);
  assert.equal(JSON.stringify(content.shared).includes('SECRET'), false);
  assert.equal(joinContent(content).notes.general, 'SECRET'); assert.equal(joinContent(content).transfers[0].reference, 'SECRET');
  const reader = joinContent({ shared: content.shared, private: emptyPrivate() }); assert.equal(JSON.stringify(reader).includes('SECRET'), false); assert.ok(validateState(reader));
});
test('fusion distante : champs indépendants, champ identique, suppression/modification et ordre concurrent', () => {
  const base = { title: 'x', note: 'n', rows: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }, { id: 'c', text: 'c' }] };
  const local = { ...base, title: 'local' }, remote = { ...base, note: 'remote' };
  const merged = mergeWithConflicts(base, local, remote); assert.deepEqual(merged.conflicts, []); assert.equal(merged.value.title, 'local'); assert.equal(merged.value.note, 'remote');
  const conflict = mergeWithConflicts(base, local, { ...base, title: 'remote' }); assert.equal(conflict.conflicts[0].path, 'title'); assert.equal(mergeWithConflicts(base, local, { ...base, title: 'remote' }, { title: 'remote' }).value.title, 'remote');
  const deleted = mergeWithConflicts(base, { ...base, rows: base.rows.slice(1) }, { ...base, rows: [{ id: 'a', text: 'changed' }, ...base.rows.slice(1)] }); assert.equal(deleted.conflicts[0].kind, 'deletion');
  assert.ok(mergeWithConflicts(base, { ...base, rows: [base.rows[1], base.rows[0], base.rows[2]] }, { ...base, rows: [base.rows[0], base.rows[2], base.rows[1]] }).conflicts.some(c => c.kind === 'order'));
});
test('cache par compte et file atomique survivent au rechargement ; quota ne dissocie pas données et file', () => {
  const backing = new MemoryStorage(), local = localTripStorage(backing), a = new AccountStorage(backing, 'a'), b = new AccountStorage(backing, 'b'), trip = completed(); const key = tripKey(trip.journey.id);
  writeTrip(local, trip); writeTrip(a, trip); assert.equal(b.getItem(key), null);
  const reloaded = new AccountStorage(backing, 'a'); assert.equal(reloaded.record(key).pending, true); assert.equal(readTrip(reloaded, trip.journey.id).journey.title, trip.journey.title);
  const before = a.record(key); backing.fail = true; assert.throws(() => writeTrip(a, { ...trip, notes: { general: 'unsaved' } })); assert.deepEqual(a.record(key), before); backing.fail = false;
  assert.equal(local.getItem(key), JSON.stringify(archive(trip))); assert.equal(b.length, 0);
});
test('coupure pendant l’envoi et nouvelle édition : requête idempotente, nouvelle édition reste en attente', async () => {
  const storage = new AccountStorage(new MemoryStorage(), 'a'), trip = completed(), key = tripKey(trip.journey.id); writeTrip(storage, trip);
  const operation = storage.record(key).operation;
  await assert.rejects(syncRecord(storage, key, { save: async () => { throw new Error('Offline'); } })); assert.equal(storage.record(key).operation, operation); assert.equal(storage.record(key).pending, true);
  await syncRecord(storage, key, { save: async (_k, sent, content) => { assert.equal(sent.operation, operation); writeTrip(storage, { ...trip, notes: { general: 'During upload' } }); return { status: 'saved', record: { content, revision: 1, private_revision: 1, role: 'owner', deleted: false } }; } });
  assert.equal(storage.record(key).pending, true); assert.equal(readTrip(storage, trip.journey.id).notes.general, 'During upload'); assert.equal(storage.record(key).revision, 1);
  await syncRecord(storage, key, { save: async (_k, _r, content) => ({ status: 'saved', record: { content, revision: 1, private_revision: 2, role: 'owner', deleted: false } }) }); assert.equal(storage.record(key).pending, false);
});
test('conflit conserve les versions, aucune réécriture silencieuse ; tombstone ne ressuscite jamais', async () => {
  const storage = new AccountStorage(new MemoryStorage(), 'a'), trip = completed(), key = tripKey(trip.journey.id), content = splitContent(trip);
  acceptRemote(storage, key, { content, revision: 1, private_revision: 1, role: 'owner', deleted: false });
  writeTrip(storage, { ...trip, journey: { ...trip.journey, title: 'Local' } });
  const remote = { content: splitContent({ ...trip, journey: { ...trip.journey, title: 'Remote' } }), revision: 2, private_revision: 1, role: 'owner', deleted: false };
  await syncRecord(storage, key, { save: async () => ({ status: 'conflict', record: remote }) }); assert.ok(storage.record(key).conflict); assert.equal(readTrip(storage, trip.journey.id).journey.title, 'Local');
  resolveRecord(storage, key, { 'shared.journey.title': 'remote' }); assert.equal(readTrip(storage, trip.journey.id).journey.title, 'Remote'); assert.equal(storage.record(key).pending, true);
  acceptRemote(storage, key, { ...remote, revision: 3, deleted: true }); assert.ok(storage.record(key).conflict.remoteDeleted); resolveRecord(storage, key, {}); assert.equal(storage.getItem(key), null); assert.equal(storage.record(key).deleted, true); assert.equal(storage.record(key).pending, false); assert.match(storage.record(key).raw, /Remote/); assert.throws(() => writeTrip(storage, trip));
});
test('droits retirés conservent un export isolé mais ne permettent aucun renvoi', async () => {
  const backing = new MemoryStorage(), storage = new AccountStorage(backing, 'a'), trip = completed(), key = tripKey(trip.journey.id); writeTrip(storage, trip);
  await syncRecord(storage, key, { save: async () => ({ status: 'revoked' }) }); assert.equal(storage.getItem(key), null); assert.ok(storage.record(key).revoked); assert.ok(recordContent(key, storage.record(key).raw)); assert.equal(new AccountStorage(backing, 'b').getItem(key), null);
});
test('réinvitation réouvre le planning serveur, sauvegarde le travail refusé et un lecteur reste protégé localement', async () => {
  const storage = new AccountStorage(new MemoryStorage(), 'a'), trip = completed(), key = tripKey(trip.journey.id); writeTrip(storage, trip);
  await syncRecord(storage, key, { save: async () => ({ status: 'revoked' }) });
  const remote = { content: { shared: splitContent(trip).shared, private: emptyPrivate() }, revision: 2, private_revision: 0, deleted: false, role: 'reader' };
  acceptRemote(storage, key, remote); assert.equal(storage.record(key).revoked, false); assert.equal(storage.record(key).role, 'reader'); assert.ok(storage.getItem(key));
  assert.throws(() => writeTrip(storage, { ...trip, notes: { general: 'Reader attempt' } }), /Lecture seule/);
  assert.equal(storage.record(key).pending, false);
});
test('confirmations sur deux appareils ont les mêmes identités ; participer ne crée aucune visite', () => {
  const trip = completed(), a = confirmVisits(emptyWorld(), trip, ['FR']), b = confirmVisits(emptyWorld(), trip, ['FR']);
  assert.equal(a.visits[0].id, b.visits[0].id);
  assert.equal(mergeWithConflicts(emptyWorld(), a, b).value.visits.length, 1);
  const participating = { ...emptyWorld(), participation: [trip.journey.id] }; assert.equal(participating.visits.length, 0); assert.equal(countrySummary('FR', participating, [trip]).count, 0);
});

