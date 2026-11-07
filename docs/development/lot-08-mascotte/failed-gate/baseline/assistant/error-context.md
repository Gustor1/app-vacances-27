# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assistant.spec.ts >> revision arriving during pending lock is preserved and refreshed for a new preview
- Location: tests\e2e\assistant.spec.ts:78:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('dialog').getByRole('alert')
Expected substring: "droits ont changé"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" getByRole('dialog').getByRole('alert') with timeout 5000ms
  - waiting for getByRole('dialog').getByRole('alert')

```

```yaml
- link "Aller au contenu":
  - /url: "#main"
- complementary:
  - link "détours. LES BEAUX DÉTOURS":
    - /url: "#"
  - button "Mes voyages":
    - img
    - strong: Assistant fictif
    - text: Mes voyages
    - img
  - paragraph: MON VOYAGE
  - navigation "Navigation principale":
    - button "Maintenant":
      - img
      - text: Maintenant
    - button "Mon planning":
      - img
      - text: Mon planning
    - button "Vue d’ensemble":
      - img
      - text: Vue d’ensemble
    - button "La carte du voyage":
      - img
      - text: La carte du voyage
    - button "Mes envies & bonus 1":
      - img
      - text: Mes envies & bonus 1
    - button "Mes transports":
      - img
      - text: Mes transports
    - button "Mon carnet pratique":
      - img
      - text: Mon carnet pratique
    - button "Mes outils sur place":
      - img
      - text: Mes outils sur place
  - text: LE FIL DU VOYAGE 1 étapes
  - button "Ville test 2 j Dernière étape"
  - button "Ajouter une ville":
    - img
    - text: Ajouter une ville
  - img
  - paragraph: Prendre le temps. Garder l’envie de découvrir.
  - img
  - text: Carnet sauvegardé sur cet appareil
- banner:
  - text: Mon carnet de voyage
  - img
  - strong: Assistant fictif
  - img
  - textbox "Rechercher dans le carnet":
    - /placeholder: Retrouver un lieu, une envie…
  - text: ⌕
  - button "Informations pratiques":
    - img
  - button "Préférences":
    - img
  - button "Connexion"
- main:
  - region "Partage et synchronisation":
    - img
    - text: Mon voyage · Propriétaire
    - button "Partager":
      - img
      - text: Partager
    - status:
      - img
      - text: Enregistré sur cet appareil
    - button "Voir la synchronisation"
    - paragraph: Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.
  - button "Assistant du carnet"
  - button "Voir Maintenant"
  - text: LE VOYAGE COMMENCE ICI
  - heading "Un grand voyage, de beaux détours." [level=1]
  - paragraph: Tout ton itinéraire au même endroit. Il ne reste qu’à en profiter.
  - button "Reprendre":
    - img
    - text: Reprendre
  - button "Exporter le carnet":
    - img
    - text: Exporter le carnet
  - text: MON PROCHAIN DÉTOUR
  - heading "Assistant fictif" [level=2]
  - paragraph: Un voyage à imaginer, à ton rythme.
  - img
  - text: 1 villes & étapes
  - img
  - text: 2 journées préparées
  - img
  - text: UN VOYAGE À MON RYTHME Les beaux détours commencent ici.
  - heading "Les étapes du voyage" [level=2]
  - text: Un itinéraire qui grandit avec tes envies
  - button "01 Ville test 2 jours · excursion" [pressed]:
    - text: "01"
    - strong: Ville test
    - text: 2 jours · excursion
  - button "Ajouter une ville":
    - img
  - text: ÉTAPE 01
  - heading "Ville test 测试城 Modifier Ville test" [level=2]:
    - text: Ville test 测试城
    - button "Modifier Ville test":
      - img
  - paragraph
  - img
  - text: 0 / 5 étapes vécues
  - button "Jour 1" [pressed]:
    - img
    - text: Jour 1
  - button "Jour 2":
    - img
    - text: Jour 2
  - button "Ajouter un jour":
    - img
    - text: Ajouter un jour
  - paragraph: JOUR 01 · 3 étapes
  - heading "Jour test" [level=3]
  - paragraph: lundi 10 mai 2027
  - button "Modifier le titre de la journée":
    - img
  - button "Supprimer cette journée":
    - img
  - group: Préparer cette journée Plan initial
  - article:
    - 'button "Marquer comme visité : Musée"': "1"
    - img
    - text: Visite
    - img
    - text: À réserver
    - heading "Musée" [level=4]
    - paragraph
    - button "Compléter ce lieu"
    - group: Musée
    - button "Copier l’adresse"
    - status
    - button "Monter Musée" [disabled]:
      - img
    - button "Descendre Musée":
      - img
    - button "Modifier Musée":
      - img
    - button "Supprimer Musée":
      - img
  - article:
    - 'button "Marquer comme visité : Pause libre"': "2"
    - img
    - text: Visite 10:00
    - heading "Pause libre" [level=4]
    - paragraph
    - button "Compléter ce lieu"
    - group: Pause libre
    - button "Copier l’adresse"
    - status
    - button "Monter Pause libre":
      - img
    - button "Descendre Pause libre":
      - img
    - button "Modifier Pause libre":
      - img
    - button "Supprimer Pause libre":
      - img
  - article:
    - 'button "Marquer comme visité : Jardin"': "3"
    - img
    - text: Visite
    - heading "Jardin" [level=4]
    - paragraph
    - button "Compléter ce lieu"
    - group: Jardin
    - button "Copier l’adresse"
    - status
    - button "Monter Jardin":
      - img
    - button "Descendre Jardin" [disabled]:
      - img
    - button "Modifier Jardin":
      - img
    - button "Supprimer Jardin":
      - img
  - button "Ajouter une étape à cette journée":
    - img
    - text: Ajouter une étape à cette journée
  - text: Pas d’horaires imposés. Profite à ton rythme.
  - button "Jour précédent" [disabled]:
    - img
  - button "Jour suivant":
    - img
  - complementary:
    - heading "Les repères du jour" [level=3]:
      - img
      - text: Les repères du jour
    - button "Agrandir":
      - text: Agrandir
      - img
    - region "Carte des étapes à Ville test":
      - img
      - button "Zoomer sur la carte"
      - button "Dézoomer sur la carte"
      - link "Leaflet":
        - /url: https://leafletjs.com
      - text: ©
      - link "OpenStreetMap":
        - /url: https://www.openstreetmap.org/copyright
      - text: ","
      - link "Natural Earth":
        - /url: https://www.naturalearthdata.com/
      - text: · domaine public
      - status: Vue de Ville test · Ces étapes n’ont pas encore de repère précis.
      - text: Repères indicatifs · itinéraires par liens externes 0 / 3 étapes repérées · autres adresses dans le planning
      - status:
        - paragraph: Fond détaillé indisponible · repères indicatifs, sans rues.
        - link "Musée ↗":
          - /url: https://www.google.com/maps/search/?api=1&query=Mus%C3%A9e+%E6%B5%8B%E8%AF%95%E5%9F%8E
        - link "Pause libre ↗":
          - /url: https://www.google.com/maps/search/?api=1&query=Pause+libre+%E6%B5%8B%E8%AF%95%E5%9F%8E
        - link "Jardin ↗":
          - /url: https://www.google.com/maps/search/?api=1&query=Jardin+%E6%B5%8B%E8%AF%95%E5%9F%8E
        - link "Carte de Ville test ↗":
          - /url: https://www.google.com/maps/search/?api=1&query=%E6%B5%8B%E8%AF%95%E5%9F%8E
    - img
    - heading "Le petit pense-bête" [level=3]
    - paragraph: Les détails de cette étape restent à préciser. Garde tes idées dans la note ci-dessous.
    - text: Ma note pour Ville test
    - textbox "Ma note pour Ville test":
      - /placeholder: Une idée, une adresse, un rappel…
    - img
    - text: Note personnelle · sauvegarde locale
    - img
    - heading "Et s’il reste un peu de temps ?" [level=3]
    - paragraph: 1 idées de restaurants, balades et jolis détours t’attendent à Ville test.
    - button "Explorer les bonus":
      - text: Explorer les bonus
      - img
  - text: Le monde, au gré des envies. Ton voyage évolue. Ton carnet aussi.
  - img
- dialog "Assistant du carnet":
  - heading "Assistant du carnet" [level=2]
  - button "Fermer":
    - img
  - paragraph: Choix guidés, sans compréhension de phrase libre. Tout reste dans ce carnet ; aucun envoi à une IA.
  - paragraph: La recherche et les aperçus sont effacés à la fermeture. Les changements acceptés suivent les règles de partage et de sauvegarde du carnet.
  - paragraph:
    - strong: Assistant fictif
  - text: Rechercher dans ce carnet
  - searchbox "Rechercher dans ce carnet"
  - text: Action guidée
  - combobox "Action guidée":
    - option "Ajouter une note à une activité" [selected]
    - option "Modifier un champ d’activité"
    - option "Déplacer une activité"
    - option "Alléger une journée"
  - group:
    - text: Activité concernée
    - combobox "Activité concernée":
      - option "À choisir"
      - option "Ville test · Jour test · Musée"
      - option "Ville test · Jour test · Pause libre"
      - option "Ville test · Jour test · Jardin" [selected]
      - option "Ville test · Réserve · Petite exposition"
      - option "Ville test · Réserve · Longue visite"
    - text: Texte à ajouter
    - textbox "Texte à ajouter"
    - paragraph: Cette note suit les réglages privés habituels du carnet.
    - button "Prévisualiser cette action"
  - status:
    - paragraph: Action enregistrée. L’annulation reste possible tant que le carnet ne change pas.
    - button "Prévisualiser l’annulation"
  - button "Effacer la session de l’assistant"
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import { mkdir, readFile } from 'node:fs/promises';
  3  | import { fixture } from '../../scripts/assistant-fixture.mjs';
  4  | import { archive, parseTrip, tripKey } from '../../src/journeys';
  5  | import { translate, type Language } from '../../src/locale-utils';
  6  | import { ACCOUNT_HINT_KEY } from '../../src/cloud/session-cache';
  7  | const trip=fixture(),key=tripKey(trip.journey!.id);
  8  | async function seed(page:Page,language:Language='fr') {
  9  |  await page.goto('/');await page.evaluate(({key,raw,language})=>{localStorage.setItem(key,raw);localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:language==='en'?'dark':'light'}));},{key,raw:JSON.stringify(archive(trip)),language});await page.reload();
  10 |  await page.getByRole('button',{name:translate('Ouvrir {title}',language,{title:trip.journey!.title}),exact:true}).click();
  11 |  await page.getByRole('button',{name:translate('Assistant du carnet',language),exact:true}).click();
  12 | }
  13 | async function proposeNote(page:Page,text='Note ajoutée') {
  14 |  const dialog=page.getByRole('dialog');await dialog.getByLabel('Activité concernée',{exact:true}).selectOption('b');await dialog.getByLabel('Texte à ajouter',{exact:true}).fill(text);await dialog.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();
  15 | }
  16 | for(const language of ['fr','en','zh-CN','es'] as Language[])test('assistant '+language+' search, safe sources, preview, actual note, undo, keyboard and mobile',async({page})=>{
  17 |  const t=(v:string)=>translate(v,language);await page.emulateMedia({reducedMotion:'reduce'});await seed(page,language);const dialog=page.getByRole('dialog');
  18 |  await dialog.getByLabel(t('Rechercher dans ce carnet'),{exact:true}).fill('delete all');await expect(dialog.locator('.assistant-results')).toContainText('<script>');expect(await page.evaluate(()=>Object.hasOwn(window,'injected'))).toBe(false);
  19 |  await dialog.getByLabel(t('Activité concernée'),{exact:true}).selectOption('b');await dialog.getByLabel(t('Texte à ajouter'),{exact:true}).fill('Note '+language);const preview=dialog.getByRole('button',{name:t('Prévisualiser cette action'),exact:true});await preview.focus();await page.keyboard.press('Enter');await expect(dialog.locator('.assistant-preview')).toContainText('Note '+language);
  20 |  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b||'',key)).toBe('');
  21 |  await dialog.getByRole('button',{name:t('Annuler'),exact:true}).click();await preview.click();await dialog.getByRole('button',{name:t('Confirmer cette action'),exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});await expect(dialog).toContainText(t('Action enregistrée. L’annulation reste possible tant que le carnet ne change pas.'));
  22 |  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b,key)).toBe('Note '+language);
  23 |  await dialog.getByRole('button',{name:t('Prévisualiser l’annulation'),exact:true}).click();await expect(dialog.locator('.assistant-preview')).toContainText(t('Annuler cette action'));await dialog.getByRole('button',{name:t('Confirmer cette action'),exact:true}).click();
  24 |  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b||'',key)).toBe('');
  25 |  for(const width of [320,390,1440]) {await page.setViewportSize({width,height:1000});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  26 |  await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.evaluate(()=>document.documentElement.style.zoom='1');
  27 |  await mkdir('docs/development/lot-07-assistant/screenshots',{recursive:true});await page.screenshot({path:`docs/development/lot-07-assistant/screenshots/${language}.png`});
  28 |  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:t('Assistant du carnet'),exact:true})).toBeFocused();await page.getByRole('button',{name:t('Assistant du carnet'),exact:true}).click();await expect(dialog.getByLabel(t('Rechercher dans ce carnet'),{exact:true})).toHaveValue('');
  29 | });
  30 | test('actual field, move and coherent lightened day retain original history and export',async({page})=>{
  31 |  await seed(page);const d=page.getByRole('dialog'),action=d.getByLabel('Action guidée',{exact:true});
  32 |  await action.selectOption('field');await d.getByLabel('Activité concernée',{exact:true}).selectOption('b');await d.getByLabel('Champ à modifier',{exact:true}).selectOption('address');await d.getByLabel('Nouvelle valeur',{exact:true}).fill('Adresse explicite');await d.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toContainText('Adresse explicite');await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);
  33 |  await action.selectOption('move');await d.getByLabel('Activité concernée',{exact:true}).selectOption('a');await d.getByLabel('Journée de destination',{exact:true}).selectOption('spare');await d.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();await expect(d.getByRole('alert')).toContainText('réservée');
  34 |  await d.getByLabel('Activité concernée',{exact:true}).selectOption('short');await d.getByLabel('Journée de destination',{exact:true}).selectOption('d');await d.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);
  35 |  await action.selectOption('lighten');await d.getByLabel('Journée à alléger',{exact:true}).selectOption('d');await d.getByLabel('Nom de l’alternative',{exact:true}).fill('Repos choisi');await expect(d.getByRole('checkbox',{name:'Musée · À conserver',exact:true})).toBeDisabled();await d.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);
  36 |  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,key);expect(saved.cities[0].days[0].steps.at(-1).id).toBe('short');expect(saved.cities[0].days[1].steps).toHaveLength(1);expect(saved.cities[0].days[0].steps[2].address).toBe('Adresse explicite');expect(saved.cities[0].days[0].preparation.alternatives).toHaveLength(2);expect(saved.notes.a).toBe('PRIVATE_REF');
  37 |  await page.keyboard.press('Escape');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter le carnet',exact:true}).click();const exported=parseTrip(await readFile((await (await download).path())!,'utf8'));expect(exported.state.cities).toEqual(saved.cities);
  38 |  await page.reload();await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await expect(d.getByRole('button',{name:'Prévisualiser l’annulation',exact:true})).toHaveCount(0);
  39 | });
  40 | test('concurrent revision blocks application and undo, preserving the other tab',async({page,context})=>{
  41 |  await seed(page);await proposeNote(page);const d=page.getByRole('dialog'),other=await context.newPage();await other.goto('/');
  42 |  const change=async(text:string)=>{await other.evaluate(({key,text})=>{const s=JSON.parse(localStorage.getItem(key)!);s.state.notes.a=text;localStorage.setItem(key,JSON.stringify(s));},{key,text});};
  43 |  await change('Other tab 1');await expect(d.getByRole('button',{name:'Confirmer cette action',exact:true})).toBeDisabled();await d.getByRole('button',{name:'Annuler',exact:true}).click();await proposeNote(page);await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);
  44 |  await change('Other tab 2');await d.getByRole('button',{name:'Prévisualiser l’annulation',exact:true}).click();await expect(d.getByRole('button',{name:'Confirmer cette action',exact:true})).toBeDisabled();expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.a,key)).toBe('Other tab 2');await other.close();
  45 | });
  46 | for(const stage of ['before','after'] as const)test('storage '+stage+' failure keeps explicit retry idempotent',async({page})=>{
  47 |  await seed(page);await proposeNote(page,'Une seule note');await page.evaluate(({key,stage})=>{const original=Storage.prototype.setItem;let once=true;Storage.prototype.setItem=function(k,v){if(k===key&&once){once=false;if(stage==='after')original.call(this,k,v);throw new DOMException('fixture quota','QuotaExceededError');}original.call(this,k,v);};},{key,stage});
  48 |  const d=page.getByRole('dialog');await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.getByRole('alert')).toContainText('Écriture non confirmée');await expect(d.locator('.assistant-preview')).toBeVisible();await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b,key)).toBe('Une seule note');
  49 | });
  50 | for(const role of ['reader','editor'] as const)test('shared '+role+' controls, revoked rights are rechecked at commit',async({page,context})=>{
  51 |  await context.route('https://*.supabase.co/**',r=>r.fulfill({status:401,json:{message:'fixture'}}));await page.goto('/');const id='00000000-0000-4000-8000-000000000077',physical=`detours-account-v1:${id}:${key}`;
  52 |  await page.evaluate(({id,key,raw,hint,role})=>{localStorage.setItem(hint,JSON.stringify({version:1,id}));localStorage.setItem(`detours-account-v1:${id}:${key}`,JSON.stringify({version:1,raw,base:null,revision:1,privateRevision:0,pending:false,operation:'fixture',role,fullSharing:true,allowedFields:['preparation']}));},{id,key,raw:JSON.stringify(archive(trip)),hint:ACCOUNT_HINT_KEY,role});await page.reload();await page.getByRole('button',{name:'Ouvrir '+trip.journey!.title,exact:true}).click();await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await proposeNote(page);
  53 |  const d=page.getByRole('dialog');await expect(d.getByRole('button',{name:'Confirmer cette action',exact:true})).toBeDisabled();await d.getByRole('button',{name:'Annuler',exact:true}).click();
  54 |  await d.getByLabel('Action guidée',{exact:true}).selectOption('field');await d.getByLabel('Activité concernée',{exact:true}).selectOption('b');await d.getByLabel('Nouvelle valeur',{exact:true}).fill('Change');await d.getByRole('button',{name:'Prévisualiser cette action',exact:true}).click();
  55 |  if(role==='reader')await expect(d.getByRole('button',{name:'Confirmer cette action',exact:true})).toBeDisabled();
  56 |  else {await page.evaluate(physical=>{const r=JSON.parse(localStorage.getItem(physical)!);r.role='reader';localStorage.setItem(physical,JSON.stringify(r));},physical);await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.getByRole('alert')).toContainText('droits ont changé');}
  57 |  expect(await page.evaluate(physical=>JSON.parse(JSON.parse(localStorage.getItem(physical)!).raw).state.cities[0].days[0].steps[2].description,physical)).toBe('');
  58 | });
  59 | test('closing a pending action cancels its late lock callback without writing',async({page,context})=>{
  60 |  await seed(page);await proposeNote(page);const other=await context.newPage();await other.goto('/');
  61 |  await other.evaluate(key=>new Promise<void>(acquired=>{void navigator.locks.request(key,()=>{acquired();return new Promise<void>(resolve=>{(window as unknown as {release:()=>void}).release=resolve;});});}),key);
  62 |  await page.getByRole('dialog').getByRole('button',{name:'Confirmer cette action',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  63 |  await other.evaluate(()=>(window as unknown as {release:()=>void}).release());await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await proposeNote(page,'After cancellation');await page.getByRole('dialog').getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(page.getByRole('dialog').locator('.assistant-preview')).toHaveCount(0);
  64 |  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b,key)).toBe('After cancellation');await other.close();
  65 | });
  66 | test('ambiguous tomorrow near midnight requires an explicit dated destination',async({page})=>{
  67 |  await page.clock.setFixedTime(new Date('2027-05-10T15:59:59Z'));await seed(page);await page.evaluate(key=>{const a=JSON.parse(localStorage.getItem(key)!);a.state.cities[0].days[0].date='2027-05-11';localStorage.setItem(key,JSON.stringify(a));window.dispatchEvent(new StorageEvent('storage',{key,newValue:JSON.stringify(a)}));},key);
  68 |  const d=page.getByRole('dialog');await d.getByLabel('Action guidée',{exact:true}).selectOption('move');await d.getByRole('button',{name:'Voir les journées de demain',exact:true}).click();const destination=d.getByLabel('Journée de destination',{exact:true});await expect(destination.locator('option')).toHaveCount(3);await expect(destination).toHaveValue('');await expect(destination).toContainText('Asia/Shanghai');
  69 |  await page.clock.setFixedTime(new Date('2027-05-10T16:00:00Z'));await d.getByRole('button',{name:'Voir les journées de demain',exact:true}).click();await expect(destination.locator('option')).toHaveCount(1);await expect(d).toContainText('Aucune journée datée ne correspond.');
  70 | });
  71 | test('account switch while waiting for lock clears session and rejects late action',async({page,context})=>{
  72 |  await context.route('https://*.supabase.co/**',r=>r.fulfill({status:401,json:{message:'fixture'}}));await seed(page);await proposeNote(page,'Never write');const other=await context.newPage();await other.goto('/');
  73 |  await other.evaluate(key=>new Promise<void>(acquired=>{void navigator.locks.request(key,()=>{acquired();return new Promise<void>(resolve=>{(window as unknown as {release:()=>void}).release=resolve;});});}),key);
  74 |  await page.getByRole('dialog').getByRole('button',{name:'Confirmer cette action',exact:true}).click();const id='00000000-0000-4000-8000-000000000078';await other.evaluate(({hint,id,key,raw})=>{localStorage.setItem(`detours-account-v1:${id}:${key}`,JSON.stringify({version:1,raw,base:null,revision:1,privateRevision:0,pending:false,operation:'fixture',role:'owner'}));localStorage.setItem(hint,JSON.stringify({version:1,id}));},{hint:ACCOUNT_HINT_KEY,id,key,raw:JSON.stringify(archive(trip))});
  75 |  await expect(page.getByRole('dialog')).toHaveCount(0);await other.evaluate(()=>(window as unknown as {release:()=>void}).release());await page.getByRole('button',{name:'Ouvrir '+trip.journey!.title,exact:true}).click();await page.getByRole('button',{name:'Assistant du carnet',exact:true}).click();await expect(page.getByRole('dialog').getByLabel('Texte à ajouter',{exact:true})).toHaveValue('');
  76 |  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state.notes.b||'',key)).toBe('');expect(await page.evaluate(({id,key})=>JSON.parse(JSON.parse(localStorage.getItem(`detours-account-v1:${id}:${key}`)!).raw).state.notes.b||'',{id,key})).toBe('');await other.close();
  77 | });
  78 | test('revision arriving during pending lock is preserved and refreshed for a new preview',async({page,context})=>{
  79 |  await seed(page);await proposeNote(page,'Retried after conflict');const other=await context.newPage();await other.goto('/');
  80 |  await other.evaluate(key=>new Promise<void>(acquired=>{void navigator.locks.request(key,()=>{acquired();return new Promise<void>(resolve=>{(window as unknown as {release:()=>void}).release=resolve;});});}),key);
  81 |  const d=page.getByRole('dialog');await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await other.evaluate(key=>{const a=JSON.parse(localStorage.getItem(key)!);a.state.notes.a='Written while waiting';localStorage.setItem(key,JSON.stringify(a));(window as unknown as {release:()=>void}).release();},key);
> 82 |  await expect(d.getByRole('alert')).toContainText('droits ont changé');await d.getByRole('button',{name:'Annuler',exact:true}).click();await proposeNote(page,'Retried after conflict');await d.getByRole('button',{name:'Confirmer cette action',exact:true}).click();await expect(d.locator('.assistant-preview')).toHaveCount(0);const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).state,key);expect(saved.notes.a).toBe('Written while waiting');expect(saved.notes.b).toBe('Retried after conflict');await other.close();
     |                                     ^ Error: expect(locator).toContainText(expected) failed
  83 | });
  84 | 
```