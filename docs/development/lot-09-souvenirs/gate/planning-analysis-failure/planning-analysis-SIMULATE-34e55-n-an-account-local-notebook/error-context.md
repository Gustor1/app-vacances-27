# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-analysis.spec.ts >> SIMULATED provider: paste, analyze, correct, create and open an account-local notebook
- Location: tests\e2e\planning-analysis.spec.ts:26:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('dialog').getByRole('textbox', { name: 'Ton programme', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Aller au contenu" [ref=e4] [cursor=pointer]:
      - /url: "#journeys-main"
    - banner [ref=e5]:
      - link "détours. LES BEAUX DÉTOURS" [ref=e6] [cursor=pointer]:
        - /url: "#journeys-main"
        - generic [ref=e9]:
          - text: détours.
          - generic [ref=e10]: LES BEAUX DÉTOURS
      - generic [ref=e11]:
        - button "Préférences" [ref=e12] [cursor=pointer]
        - button "Mon compte" [ref=e15] [cursor=pointer]
    - main [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - paragraph [ref=e25]: UN CARNET POUR CHAQUE ÉCHAPPÉE
          - heading "Mes voyages" [level=1] [ref=e26]
          - paragraph [ref=e27]: Un week-end, une ville, un grand détour. Retrouve chaque voyage à son rythme.
        - generic [ref=e28]:
          - button "Créer depuis un planning" [ref=e29] [cursor=pointer]
          - button "Créer un voyage" [ref=e33] [cursor=pointer]
      - tablist "Accueil" [ref=e36]:
        - tab "Mes voyages" [selected] [ref=e37] [cursor=pointer]
        - tab "Mon monde" [ref=e40] [cursor=pointer]
      - region "Synchronisation" [ref=e46]:
        - generic [ref=e47]:
          - strong [ref=e48]: Synchronisé
          - paragraph [ref=e49]: Les changements sont envoyés automatiquement. Tu peux suivre chaque carnet et comparer les différences ici.
        - button "Synchroniser maintenant" [ref=e50] [cursor=pointer]
      - tabpanel "Mes voyages" [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]:
            - text: Statut
            - combobox "Statut" [ref=e59]:
              - option "Tous les statuts" [selected]
              - option "Idée"
              - option "En préparation"
              - option "En cours"
              - option "Terminé"
              - option "Annulé"
          - generic [ref=e60]:
            - text: Pays
            - combobox "Pays" [ref=e61]:
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
          - generic [ref=e62]:
            - text: Accès
            - combobox "Accès" [ref=e63]:
              - option "Tous les carnets" [selected]
              - option "Mes voyages"
              - option "Partagés avec moi"
        - generic [ref=e64]:
          - paragraph [ref=e67]: Un premier détour ? Crée ton carnet ou pars d’un planning à vérifier.
          - heading "Ton prochain voyage commence ici." [level=2] [ref=e70]
          - paragraph [ref=e71]: Crée ton carnet, puis ajoute tes étapes, journées et bonnes adresses. Tu peux aussi importer une sauvegarde existante.
          - button "Créer mon premier carnet" [ref=e72] [cursor=pointer]
        - generic [ref=e74]:
          - generic [ref=e75]:
            - paragraph [ref=e76]: À GARDER, À RETROUVER
            - heading "Tes carnets voyagent avec toi." [level=2] [ref=e77]
            - paragraph [ref=e78]: Importe un ancien carnet ou une collection JSON. Chaque import ajoute une copie indépendante.
            - paragraph [ref=e79]: Pour un PDF texte ou Word (.docx), utilise « Créer depuis un planning ».
          - generic [ref=e80]:
            - button "Importer un fichier" [ref=e81] [cursor=pointer]
            - button "Ajouter l’exemple Chine" [ref=e85] [cursor=pointer]
      - region [ref=e88]:
        - generic [ref=e89]:
          - heading "Sauvegarder et restaurer mes données" [level=2] [ref=e90]
          - paragraph [ref=e91]: Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier vérifié (64 Mo maximum).
          - paragraph [ref=e92]: Seuls les carnets téléchargés de l’espace ouvert sont sauvegardés. Comptes, droits, ressources externes et caches réseau sont exclus.
          - paragraph [ref=e93]: Les photos et légendes quotidiennes sont exclues de cette sauvegarde. Dans chaque carnet, utilise Souvenir personnel → Télécharger le paquet souvenirs, puis restaure ce paquet après le carnet.
        - generic [ref=e94]:
          - button "Télécharger ma sauvegarde complète" [ref=e95] [cursor=pointer]
          - button "Restaurer mes données" [ref=e99] [cursor=pointer]
      - generic [ref=e103]:
        - generic [ref=e104]: Le monde, au gré des envies.
        - generic [ref=e106]: Carnets privés par défaut
  - dialog [ref=e108]:
    - generic [ref=e109]:
      - heading "Créer depuis un planning" [level=2] [ref=e110]
      - button "Fermer" [ref=e111] [cursor=pointer]
    - generic [ref=e116]:
      - generic [ref=e117]:
        - text: Ton programme
        - textbox "Ton programme" [active] [ref=e118]
      - paragraph [ref=e119]: 0 / 50,000 caractères
      - generic [ref=e120]:
        - text: Ouvrir un fichier texte ou Markdown · PDF / DOCX
        - button "Ouvrir un fichier texte ou Markdown" [ref=e121]
      - paragraph [ref=e122]: "TXT/Markdown UTF-8 : 200 Ko. PDF texte/DOCX : 10 Mo, 50 pages PDF, 50 000 caractères. Aucun OCR. Extraction locale, sans envoi du document."
      - paragraph [ref=e123]: "Hors ligne : ouvre Détours en ligne et attends sa préparation complète avant de partir. Les modules de lecture sont ensuite disponibles sans réseau."
      - paragraph [ref=e124]: La reconnaissance des journées et activités fonctionne sur cet appareil, sans compte ni envoi du texte. Vérifie ensuite l’aperçu avant de créer le carnet.
      - generic [ref=e125]:
        - button "Reconnaître mon programme" [disabled] [ref=e126]
        - button "Saisir mon aperçu manuellement" [ref=e130] [cursor=pointer]
      - group [ref=e132]:
        - generic "Préparer mon planning avec mon IA" [ref=e133]
      - region "Analyse IA distante (facultative)" [ref=e134]:
        - strong [ref=e135]: Analyse IA distante (facultative)
        - paragraph [ref=e136]: En lançant l’analyse, tu envoies ce texte au fournisseur OpenAI. Aucun envoi pendant la saisie.
        - button "Analyser mon programme" [disabled] [ref=e138]
      - generic [ref=e141]:
        - generic [ref=e142]: Exemples fictifs de démonstration, sans analyse IA
        - button "Charger l’exemple 1" [ref=e143] [cursor=pointer]
        - button "Charger l’exemple 2" [ref=e144] [cursor=pointer]
        - button "Charger l’exemple 3" [ref=e145] [cursor=pointer]
      - generic [ref=e146]:
        - button "Télécharger le texte source" [ref=e147] [cursor=pointer]
        - button "Effacer le brouillon" [ref=e151] [cursor=pointer]
      - paragraph [ref=e155]: Le texte reste dans le brouillon récupérable sur cet appareil jusqu’à son effacement explicite.
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { SYNTHETIC_EXAMPLES } from '../../src/planning-import/fixtures';
  3   | 
  4   | const account = '00000000-0000-4000-8000-000000000071';
  5   | const authKey = 'sb-planning-fake-auth-token';
  6   | const draftKey = `detours-account-v1:${account}:detours-planning-draft-v1`;
  7   | const endpoint = '**/api/planning-extraction';
  8   | 
  9   | async function fakeAccount(page: Page) {
  10  |   await page.route('https://planning-fake.supabase.co/**', route => route.fulfill({ status: 200, json: [] }));
  11  |   await page.routeWebSocket('wss://planning-fake.supabase.co/**', socket => socket.close());
  12  |   await page.addInitScript(({ account, authKey }) => {
  13  |     const expires = Math.floor(Date.now() / 1000) + 3600;
  14  |     const encoded = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  15  |     const access_token = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: account, exp: expires, role: 'authenticated' })}.synthetic-signature`;
  16  |     localStorage.setItem(authKey, JSON.stringify({ access_token, refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expires,
  17  |       user: { id: account, aud: 'authenticated', role: 'authenticated', email: 'planning@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-12T00:00:00Z' } }));
  18  |   }, { account, authKey });
  19  | }
  20  | async function openImport(page: Page) {
  21  |   await page.goto('/', { waitUntil: 'domcontentloaded' });
  22  |   await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  23  |   return page.getByRole('dialog');
  24  | }
  25  | 
  26  | test('SIMULATED provider: paste, analyze, correct, create and open an account-local notebook', async ({ page }) => {
  27  |   await fakeAccount(page);
  28  |   let calls = 0;
  29  |   await page.route(endpoint, async route => {
  30  |     calls++;
  31  |     expect(route.request().postDataJSON()).toEqual({ source: SYNTHETIC_EXAMPLES[0].source });
  32  |     expect(route.request().headers().authorization).toMatch(/^Bearer /);
  33  |     await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft });
  34  |   });
  35  |   const dialog = await openImport(page);
> 36  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
      |                                                                             ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  37  |   expect(calls).toBe(0);
  38  |   await expect(dialog.getByRole('button', { name: 'Analyser mon programme', exact: true })).toBeEnabled();
  39  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  40  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Paris');
  41  |   const extracted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  42  |   expect(extracted.draft.cities[0].days[0].items[0].coordinates).toEqual([48.8606, 2.3376]);
  43  |   expect(calls).toBe(1);
  44  |   await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Paris corrigé après analyse');
  45  |   await dialog.getByLabel('Lieu ou activité', { exact: true }).first().fill('Louvre corrigé');
  46  |   await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  47  |   await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  48  |   await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  49  |   await expect(dialog).not.toBeVisible();
  50  |   await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
  51  |   const records = await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).map(key => JSON.parse(localStorage.getItem(key)!)), account);
  52  |   expect(records).toHaveLength(1);
  53  |   expect(records[0]).toMatchObject({ localOnly: true, pending: false });
  54  |   const saved = JSON.parse(records[0].raw).state;
  55  |   expect(saved.cities[0].days[0].steps[0].title).toBe('Louvre corrigé');
  56  |   expect(saved.cities[0].days[0].steps[0].coordinates).toBeUndefined();
  57  |   await page.reload();
  58  |   await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
  59  | });
  60  | 
  61  | test('SIMULATED slow provider: cancellation and new source suppress late results even if transport ignores abort', async ({ page }) => {
  62  |   await fakeAccount(page);
  63  |   await page.addInitScript(() => {
  64  |     const original = window.fetch.bind(window);
  65  |     window.fetch = (input, init) => String(input).includes('/api/planning-extraction') ? original(input, { ...init, signal: undefined }) : original(input, init);
  66  |   });
  67  |   let releaseOld = () => {};
  68  |   const oldGate = new Promise<void>(resolve => { releaseOld = resolve; });
  69  |   let oldComplete = () => {};
  70  |   const delivered = new Promise<void>(resolve => { oldComplete = resolve; });
  71  |   let calls = 0;
  72  |   await page.route(endpoint, async route => {
  73  |     const index = calls++;
  74  |     if (index === 0) { await oldGate; await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft }); oldComplete(); }
  75  |     else await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[1].draft });
  76  |   });
  77  |   const dialog = await openImport(page);
  78  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  79  |   const firstRequest = page.waitForRequest(request => request.url().endsWith('/api/planning-extraction'));
  80  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click(); await firstRequest;
  81  |   await dialog.getByRole('button', { name: 'Annuler l’analyse', exact: true }).click();
  82  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[1].source);
  83  |   expect(calls).toBe(1);
  84  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  85  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  86  |   releaseOld(); await delivered;
  87  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  88  |   const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  89  |   expect(session.source).toBe(SYNTHETIC_EXAMPLES[1].source); expect(session.draft.title).toBe('Shanghai → Pékin');
  90  |   expect(calls).toBe(2);
  91  | });
  92  | 
  93  | test('SIMULATED provider failures retain source through reload and never create a partial notebook', async ({ page }) => {
  94  |   await fakeAccount(page);
  95  |   let calls = 0;
  96  |   await page.route(endpoint, async route => {
  97  |     calls++; await route.fulfill({ status: calls === 1 ? 429 : 200, json: calls === 1 ? { error: 'quota' } : { version: 1, cities: [] } });
  98  |   });
  99  |   let dialog = await openImport(page);
  100 |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  101 |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  102 |   await expect(dialog.getByRole('alert')).toContainText('Limite d’analyse atteinte');
  103 |   await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  104 |   await page.reload();
  105 |   await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click(); dialog = page.getByRole('dialog');
  106 |   await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  107 |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  108 |   await expect(dialog.getByRole('alert')).toContainText('Réponse IA invalide');
  109 |   expect(await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).length, account)).toBe(0);
  110 | });
  111 | 
```