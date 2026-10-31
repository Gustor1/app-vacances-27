# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-documents.spec.ts >> protected, scanned, corrupt, false-extension and excessive binaries preserve the previous source
- Location: tests\e2e\planning-documents.spec.ts:33:1

# Error details

```
Error: scan.pdf

expect(locator).toContainText(expected) failed

Locator: getByRole('dialog').getByRole('alert')
Expected substring: "Aucun texte extractible"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - scan.pdf getByRole('dialog').getByRole('alert') with timeout 5000ms
  - waiting for getByRole('dialog').getByRole('alert')

```

```yaml
- link "Aller au contenu":
  - /url: "#journeys-main"
- banner:
  - link "détours. LES BEAUX DÉTOURS":
    - /url: "#journeys-main"
  - button "Préférences":
    - img
  - button "Connexion"
- main:
  - button "Mettre le relief en pause" [pressed]:
    - img
  - heading "Mes voyages" [level=1]
  - paragraph: Un week-end, une ville, un grand détour. Retrouve chaque voyage à son rythme.
  - button "Créer depuis un planning":
    - img
    - text: Créer depuis un planning
  - button "Créer un voyage":
    - img
    - text: Créer un voyage
  - tablist "Accueil":
    - tab "Mes voyages" [selected]:
      - img
      - text: Mes voyages
    - tab "Mon monde":
      - img
      - text: Mon monde
  - region "Synchronisation":
    - strong: Enregistré sur cet appareil
    - paragraph: Tes carnets sont enregistrés sur cet appareil. Connecte-toi pour les retrouver sur tes autres appareils.
  - tabpanel "Mes voyages":
    - text: Statut
    - combobox "Statut":
      - option "Tous les statuts" [selected]
      - option "Idée"
      - option "En préparation"
      - option "En cours"
      - option "Terminé"
      - option "Annulé"
    - text: Pays
    - combobox "Pays":
      - option "Tous les pays" [selected]
      - option "Afghanistan"
      - option "Afrique du Sud"
      - option "Albanie"
      - option "Algérie"
      - option "Allemagne"
      - option "Andorre"
      - option "Angola"
      - option "Anguilla"
      - option "Antarctique"
      - option "Antigua-et-Barbuda"
      - option "Arabie saoudite"
      - option "Argentine"
      - option "Arménie"
      - option "Aruba"
      - option "Australie"
      - option "Autriche"
      - option "Azerbaïdjan"
      - option "Bahamas"
      - option "Bahreïn"
      - option "Bangladesh"
      - option "Barbade"
      - option "Belgique"
      - option "Belize"
      - option "Bénin"
      - option "Bermudes"
      - option "Bhoutan"
      - option "Biélorussie"
      - option "Bolivie"
      - option "Bosnie-Herzégovine"
      - option "Botswana"
      - option "Brésil"
      - option "Brunei"
      - option "Bulgarie"
      - option "Burkina Faso"
      - option "Burundi"
      - option "Cambodge"
      - option "Cameroun"
      - option "Canada"
      - option "Cap-Vert"
      - option "Chili"
      - option "Chine"
      - option "Chypre"
      - option "Colombie"
      - option "Comores"
      - option "Congo-Brazzaville"
      - option "Congo-Kinshasa"
      - option "Corée du Nord"
      - option "Corée du Sud"
      - option "Costa Rica"
      - option "Côte d’Ivoire"
      - option "Croatie"
      - option "Cuba"
      - option "Curaçao"
      - option "Danemark"
      - option "Djibouti"
      - option "Dominique"
      - option "Égypte"
      - option "Émirats arabes unis"
      - option "Équateur"
      - option "Érythrée"
      - option "Espagne"
      - option "Estonie"
      - option "Eswatini"
      - option "État de la Cité du Vatican"
      - option "États-Unis"
      - option "Éthiopie"
      - option "Fidji"
      - option "Finlande"
      - option "France"
      - option "Gabon"
      - option "Gambie"
      - option "Géorgie"
      - option "Géorgie du Sud-et-les Îles Sandwich du Sud"
      - option "Ghana"
      - option "Gibraltar"
      - option "Grèce"
      - option "Grenade"
      - option "Groenland"
      - option "Guadeloupe"
      - option "Guam"
      - option "Guatemala"
      - option "Guernesey"
      - option "Guinée"
      - option "Guinée équatoriale"
      - option "Guinée-Bissau"
      - option "Guyana"
      - option "Guyane française"
      - option "Haïti"
      - option "Honduras"
      - option "Hong Kong"
      - option "Hongrie"
      - option "Île Bouvet"
      - option "Île Christmas"
      - option "Île de Man"
      - option "Île Norfolk"
      - option "Îles Åland"
      - option "Îles Caïmans"
      - option "Îles Cocos"
      - option "Îles Cook"
      - option "Îles Féroé"
      - option "Îles Heard-et-MacDonald"
      - option "Îles Malouines (Îles Falkland)"
      - option "Îles Mariannes du Nord"
      - option "Îles Marshall"
      - option "Îles mineures éloignées des États-Unis"
      - option "Îles Pitcairn"
      - option "Îles Salomon"
      - option "Îles Turques-et-Caïques"
      - option "Îles Vierges britanniques"
      - option "Îles Vierges des États-Unis"
      - option "Inde"
      - option "Indonésie"
      - option "Irak"
      - option "Iran"
      - option "Irlande"
      - option "Islande"
      - option "Israël"
      - option "Italie"
      - option "Jamaïque"
      - option "Japon"
      - option "Jersey"
      - option "Jordanie"
      - option "Kazakhstan"
      - option "Kenya"
      - option "Kirghizstan"
      - option "Kiribati"
      - option "Kosovo"
      - option "Koweït"
      - option "La Réunion"
      - option "Laos"
      - option "Lesotho"
      - option "Lettonie"
      - option "Liban"
      - option "Liberia"
      - option "Libye"
      - option "Liechtenstein"
      - option "Lituanie"
      - option "Luxembourg"
      - option "Macao"
      - option "Macédoine du Nord"
      - option "Madagascar"
      - option "Malaisie"
      - option "Malawi"
      - option "Maldives"
      - option "Mali"
      - option "Malte"
      - option "Maroc"
      - option "Martinique"
      - option "Maurice"
      - option "Mauritanie"
      - option "Mayotte"
      - option "Mexique"
      - option "Micronésie"
      - option "Moldavie"
      - option "Monaco"
      - option "Mongolie"
      - option "Monténégro"
      - option "Montserrat"
      - option "Mozambique"
      - option "Myanmar (Birmanie)"
      - option "Namibie"
      - option "Nauru"
      - option "Népal"
      - option "Nicaragua"
      - option "Niger"
      - option "Nigeria"
      - option "Niue"
      - option "Norvège"
      - option "Nouvelle-Calédonie"
      - option "Nouvelle-Zélande"
      - option "Oman"
      - option "Ouganda"
      - option "Ouzbékistan"
      - option "Pakistan"
      - option "Palaos"
      - option "Palestine"
      - option "Panama"
      - option "Papouasie-Nouvelle-Guinée"
      - option "Paraguay"
      - option "Pays-Bas"
      - option "Pays-Bas caribéens"
      - option "Pérou"
      - option "Philippines"
      - option "Pologne"
      - option "Polynésie française"
      - option "Porto Rico"
      - option "Portugal"
      - option "Qatar"
      - option "République centrafricaine"
      - option "République dominicaine"
      - option "Roumanie"
      - option "Royaume-Uni"
      - option "Russie"
      - option "Rwanda"
      - option "Sahara occidental"
      - option "Saint-Barthélemy"
      - option "Saint-Christophe-et-Niévès"
      - option "Saint-Marin"
      - option "Saint-Martin"
      - option "Saint-Martin (partie néerlandaise)"
      - option "Saint-Pierre-et-Miquelon"
      - option "Saint-Vincent-et-les Grenadines"
      - option "Sainte-Hélène"
      - option "Sainte-Lucie"
      - option "Salvador"
      - option "Samoa"
      - option "Samoa américaines"
      - option "Sao Tomé-et-Principe"
      - option "Sénégal"
      - option "Serbie"
      - option "Seychelles"
      - option "Sierra Leone"
      - option "Singapour"
      - option "Slovaquie"
      - option "Slovénie"
      - option "Somalie"
      - option "Soudan"
      - option "Soudan du Sud"
      - option "Sri Lanka"
      - option "Suède"
      - option "Suisse"
      - option "Suriname"
      - option "Svalbard et Jan Mayen"
      - option "Syrie"
      - option "Tadjikistan"
      - option "Taïwan"
      - option "Tanzanie"
      - option "Tchad"
      - option "Tchéquie"
      - option "Terres australes françaises"
      - option "Territoire britannique de l’océan Indien"
      - option "Thaïlande"
      - option "Timor oriental"
      - option "Togo"
      - option "Tokelau"
      - option "Tonga"
      - option "Trinité-et-Tobago"
      - option "Tunisie"
      - option "Turkménistan"
      - option "Turquie"
      - option "Tuvalu"
      - option "Ukraine"
      - option "Uruguay"
      - option "Vanuatu"
      - option "Venezuela"
      - option "Viêt Nam"
      - option "Wallis-et-Futuna"
      - option "Yémen"
      - option "Zambie"
      - option "Zimbabwe"
    - paragraph: Un premier détour ? Crée ton carnet ou pars d’un planning à vérifier.
    - img
    - heading "Ton prochain voyage commence ici." [level=2]
    - paragraph: Crée ton carnet, puis ajoute tes étapes, journées et bonnes adresses. Tu peux aussi importer une sauvegarde existante.
    - button "Créer mon premier carnet":
      - img
      - text: Créer mon premier carnet
    - paragraph: À GARDER, À RETROUVER
    - heading "Tes carnets voyagent avec toi." [level=2]
    - paragraph: Importe un ancien carnet ou une collection JSON. Chaque import ajoute une copie indépendante.
    - paragraph: Pour un PDF texte ou Word (.docx), utilise « Créer depuis un planning ».
    - button "Importer un fichier":
      - img
      - text: Importer un fichier
    - button "Ajouter l’exemple Chine":
      - text: Ajouter l’exemple Chine
      - img
  - region "Sauvegarder et restaurer mes données":
    - heading "Sauvegarder et restaurer mes données" [level=2]
    - paragraph: Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier vérifié (64 Mo maximum).
    - paragraph: Seuls les carnets téléchargés de l’espace ouvert sont sauvegardés. Comptes, droits, ressources externes et caches réseau sont exclus.
    - paragraph: Les photos et légendes quotidiennes sont exclues de cette sauvegarde. Dans chaque carnet, utilise Souvenir personnel → Télécharger le paquet souvenirs, puis restaure ce paquet après le carnet.
    - button "Télécharger ma sauvegarde complète":
      - img
      - text: Télécharger ma sauvegarde complète
    - button "Restaurer mes données":
      - img
      - text: Restaurer mes données
  - text: Le monde, au gré des envies. Carnets sauvegardés sur cet appareil
- button "Ouvrir les raccourcis de la mascotte"
- dialog "Créer depuis un planning":
  - heading "Créer depuis un planning" [level=2]
  - button "Fermer":
    - img
  - list "Étapes de création du carnet":
    - listitem:
      - text: "1"
      - strong: Ton programme
    - listitem:
      - text: "2"
      - strong: Vérifier le programme
    - listitem:
      - text: "3"
      - strong: Créer le carnet
  - text: Ton programme
  - textbox "Ton programme": Texte précédent
  - paragraph: 15 / 50,000 caractères
  - text: Ouvrir un fichier texte ou Markdown · PDF / DOCX
  - button "Ouvrir un fichier texte ou Markdown"
  - paragraph: "TXT/Markdown UTF-8 : 200 Ko. PDF texte/DOCX : 10 Mo, 50 pages PDF, 50 000 caractères. Aucun OCR. Extraction locale, sans envoi du document."
  - paragraph: "Hors ligne : ouvre Détours en ligne et attends sa préparation complète avant de partir. Les modules de lecture sont ensuite disponibles sans réseau."
  - status:
    - text: Lecture du fichier…
    - button "Annuler"
  - paragraph: La reconnaissance des journées et activités fonctionne sur cet appareil, sans compte ni envoi du texte. Vérifie ensuite l’aperçu avant de créer le carnet.
  - button "Reconnaître mon programme" [disabled]:
    - img
    - text: Reconnaître mon programme
  - button "Saisir mon aperçu manuellement" [disabled]:
    - img
    - text: Saisir mon aperçu manuellement
  - group: Préparer mon planning avec mon IA
  - region "Analyse IA distante (facultative)":
    - strong: Analyse IA distante (facultative)
    - paragraph: "Analyse IA distante indisponible : service non activé ou compte non connecté. La reconnaissance locale reste disponible."
    - button "Analyser mon programme" [disabled]:
      - img
      - text: Analyser mon programme
  - text: Exemples fictifs de démonstration, sans analyse IA
  - button "Charger l’exemple 1" [disabled]
  - button "Charger l’exemple 2" [disabled]
  - button "Charger l’exemple 3" [disabled]
  - button "Télécharger le texte source":
    - img
    - text: Télécharger le texte source
  - button "Effacer le brouillon":
    - img
    - text: Effacer le brouillon
  - paragraph: Le texte reste dans le brouillon récupérable sur cet appareil jusqu’à son effacement explicite.
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import path from 'node:path';
  3  | const fixture = (name: string) => path.resolve('tests/fixtures/planning/documents', name);
  4  | const key = 'detours-planning-draft-v1';
  5  | async function open(page: Page) {
  6  |   await page.goto('/'); await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  7  |   return page.getByRole('dialog');
  8  | }
  9  | test('PDF and DOCX binaries are reviewed locally; corrections and original extraction survive reload', async ({ page }) => {
  10 |   test.setTimeout(90_000);
  11 |   const requests: string[] = [];
  12 |   page.on('request', r => { if (r.method() !== 'GET' || !/^(127\.0\.0\.1|localhost)$/.test(new URL(r.url()).hostname)) requests.push(r.method() + ' ' + r.url()); });
  13 |   let dialog = await open(page);
  14 |   const source = dialog.getByRole('textbox', { name: 'Ton programme', exact: true });
  15 |   await source.fill('PRIVATE SOURCE TO PRESERVE');
  16 |   for (const name of ['simple.pdf', 'columns.pdf', 'table.pdf', 'lists-table.docx']) {
  17 |     await dialog.locator('input[type=file]').setInputFiles(fixture(name));
  18 |     await expect(dialog.locator('.notice pre')).toContainText(name.endsWith('.docx') ? 'Musée rouge' : name === 'columns.pdf' ? 'Musee gauche' : 'Musee rouge', { timeout: 30_000 });
  19 |     await expect(source).toHaveValue('PRIVATE SOURCE TO PRESERVE');
  20 |     await dialog.getByRole('button', { name: 'Annuler', exact: true }).click();
  21 |   }
  22 |   await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  23 |   await dialog.getByRole('button', { name: 'Remplacer le texte', exact: true }).click();
  24 |   const original = await source.inputValue(); await source.fill(original + '\nCorrection personnelle');
  25 |   await page.reload(); await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click(); dialog = page.getByRole('dialog');
  26 |   await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(original + '\nCorrection personnelle');
  27 |   await dialog.locator('.planning-origin summary').click(); await expect(dialog.locator('.planning-origin pre')).toHaveText(original);
  28 |   const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  29 |   expect(saved.sourceOrigin).toEqual({ kind: 'docx', name: 'lists-table.docx', originalText: original });
  30 |   await dialog.getByRole('button', { name: 'Reconnaître mon programme', exact: true }).click();
  31 |   await expect(dialog.getByLabel('Ville, région ou lieu de séjour', { exact: true })).toHaveValue('Albi'); expect(requests).toEqual([]);
  32 | });
  33 | test('protected, scanned, corrupt, false-extension and excessive binaries preserve the previous source', async ({ page }) => {
  34 |   const dialog = await open(page); const source = dialog.getByRole('textbox', { name: 'Ton programme', exact: true }); await source.fill('Texte précédent');
  35 |   for (const [name, message] of [['scan.pdf', 'Aucun texte extractible'], ['protected.pdf', 'mot de passe'], ['corrupt.pdf', 'corrompu'], ['fake.docx', 'extension incorrecte'], ['pages-51.pdf', '50 pages'], ['long.pdf', '50 000'], ['long.docx', '50 000'], ['zip-bomb.docx', 'Archive Word excessive'], ['entries.docx', 'Archive Word excessive'], ['forged-size.docx', 'Archive Word excessive'], ['active.docx', 'sans macros'], ['entity.docx', 'corrompu']]) {
  36 |     await dialog.locator('input[type=file]').setInputFiles(fixture(name));
> 37 |     await expect(dialog.getByRole('alert'), name).toContainText(message); await expect(source).toHaveValue('Texte précédent');
     |                                                   ^ Error: scan.pdf
  38 |   }
  39 |   for (const name of ['old.doc','macro.docm','renamed.pdf']) {
  40 |     await dialog.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from('text only') });
  41 |     await expect(dialog.getByRole('alert')).toContainText('extension incorrecte');
  42 |   }
  43 |   await dialog.locator('input[type=file]').setInputFiles({ name:'big.pdf', mimeType:'application/pdf', buffer:Buffer.alloc(10*1024*1024+1) });
  44 |   await expect(dialog.getByRole('alert')).toContainText('10 Mo'); await expect(source).toHaveValue('Texte précédent');
  45 |   await dialog.locator('input[type=file]').setInputFiles(fixture('simple.pdf')); await dialog.getByRole('button', { name:'Remplacer le texte', exact:true }).click(); await expect(source).toHaveValue(/Musee rouge/);
  46 | });
  47 | test('cancellation, timeout and a later file cannot overwrite a newer source', async ({ page }) => {
  48 |   const dialog = await open(page); const source = dialog.getByRole('textbox', { name:'Ton programme', exact:true }); await source.fill('Ancien brouillon');
  49 |   let release!: () => void; const hold = new Promise<void>(resolve => { release=resolve; });
  50 |   await page.route('**/document-pdf.ts*', async route => { await hold; await route.continue(); });
  51 |   await dialog.locator('input[type=file]').setInputFiles(fixture('simple.pdf')); await expect(dialog.getByRole('status')).toContainText('Lecture');
  52 |   await dialog.getByRole('button', { name:'Annuler', exact:true }).click(); await source.fill('Nouvelle saisie'); release(); await page.unrouteAll({behavior:'wait'});
  53 |   await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  54 |   await dialog.getByRole('button', { name:'Remplacer le texte', exact:true }).click(); await expect(source).toHaveValue(/Musée rouge/);
  55 |   await page.reload(); await page.getByRole('button', {name:'Créer depuis un planning',exact:true}).click();
  56 |   let releaseWorker!: () => void; const heldWorker=new Promise<void>(resolve=>{releaseWorker=resolve;});
  57 |   await page.route('**/docx.worker.ts*', async route=>{await heldWorker;await route.continue();});
  58 |   await page.clock.install(); await page.getByRole('dialog').locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  59 |   await expect(page.getByRole('status')).toContainText('Lecture'); await page.clock.fastForward(20_001);
  60 |   await expect(page.getByRole('alert')).toContainText('20 secondes');releaseWorker();await page.unrouteAll({behavior:'wait'});
  61 |   await expect(page.getByRole('textbox',{name:'Ton programme',exact:true})).toHaveValue(/Musée rouge/);
  62 | });
  63 | for (const [language, trigger, promptLabel, copy, copied, original] of [
  64 |   ['fr','Créer depuis un planning','Préparer mon planning avec mon IA','Copier les consignes','Modèle copié.','Texte extrait original'],
  65 |   ['en','Create from an itinerary','Prepare my itinerary with my AI','Copy instructions','Template copied.','Original extracted text'],
  66 |   ['zh-CN','从行程创建','用我的 AI 整理行程','复制说明','模板已复制。','原始提取文本'],
  67 |   ['es','Crear desde un itinerario','Preparar mi itinerario con mi IA','Copiar instrucciones','Plantilla copiada.','Texto extraído original'],
  68 | ]) test(`localized document review and static clipboard at 320px: ${language}`, async ({ page, context }, info) => {
  69 |   await page.setViewportSize({width:320,height:844}); await context.grantPermissions(['clipboard-read','clipboard-write']);
  70 |   await page.addInitScript(language=>localStorage.setItem('a-l-est-preferences-v1',JSON.stringify({language,theme:'light'})),language);
  71 |   await page.goto('/');await page.getByRole('button',{name:trigger,exact:true}).click();const dialog=page.getByRole('dialog');
  72 |   await dialog.locator('textarea').fill('PRIVATE NOTE NEVER TO COPY');
  73 |   await dialog.locator('summary').filter({hasText:promptLabel}).click(); await dialog.getByRole('button',{name:copy,exact:true}).click();
  74 |   await expect(dialog.getByRole('status')).toHaveText(copied); const clipboard=await page.evaluate(()=>navigator.clipboard.readText());expect(clipboard).not.toContain('PRIVATE NOTE');expect(clipboard).toContain('# ');
  75 |   await dialog.locator('input[type=file]').setInputFiles(fixture('lists-table.docx'));
  76 |   const replace=['Remplacer le texte','Replace the text','替换文本','Reemplazar el texto'][['fr','en','zh-CN','es'].indexOf(language)];
  77 |   await dialog.getByRole('button',{name:replace,exact:true}).click(); await dialog.locator('summary').filter({hasText:original}).click();
  78 |   expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true); await page.keyboard.press('Tab');expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);
  79 |   await page.screenshot({path:info.outputPath(`documents-${language}.png`)});
  80 | });
  81 | 
```