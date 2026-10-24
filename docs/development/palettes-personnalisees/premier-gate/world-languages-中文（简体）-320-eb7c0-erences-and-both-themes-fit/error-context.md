# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: world-languages.spec.ts >> 中文（简体）: 320px navigation, preferences and both themes fit
- Location: tests\e2e\world-languages.spec.ts:80:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.check: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('dialog').getByRole('radio', { name: '中文（简体）', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Aller au contenu" [ref=e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e5]:
    - banner [ref=e6]:
      - generic [ref=e7]:
        - button "Ouvrir le menu" [ref=e8] [cursor=pointer]
        - strong [ref=e10]: Chine 2027
      - generic [ref=e11]:
        - textbox "Rechercher dans le carnet" [ref=e16]:
          - /placeholder: Retrouver un lieu, une envie…
        - button "Préférences" [ref=e17] [cursor=pointer]
        - dialog [ref=e19]:
          - banner [ref=e20]:
            - generic [ref=e21]:
              - paragraph [ref=e22]: Personnalise ton carnet
              - heading "Préférences" [level=2] [ref=e23]
            - button "Fermer" [active] [ref=e24] [cursor=pointer]
          - group "Apparence" [ref=e28]:
            - generic [ref=e30]:
              - generic [ref=e31] [cursor=pointer]:
                - radio "Clair" [ref=e32]
                - generic [ref=e39]: Clair
              - generic [ref=e40] [cursor=pointer]:
                - radio "Sombre" [ref=e41]
                - generic [ref=e44]: Sombre
              - generic [ref=e45] [cursor=pointer]:
                - radio "Automatique" [checked] [ref=e46]
                - generic [ref=e49]: Automatique
            - paragraph [ref=e52]: Suit les réglages de ton appareil.
          - group "Couleurs" [ref=e53]:
            - paragraph [ref=e61]: Chaque apparence garde sa palette sur cet appareil.
            - group [ref=e62]:
              - generic "Plus de palettes Signature Détours" [ref=e63] [cursor=pointer]:
                - generic [ref=e64]: Plus de palettes
                - strong [ref=e65]: Signature Détours
          - group "Langue de l’interface" [ref=e66]:
            - generic [ref=e72]:
              - generic [ref=e73] [cursor=pointer]:
                - radio "Français" [checked] [ref=e74]
                - generic [ref=e75]: Français
              - generic [ref=e78] [cursor=pointer]:
                - radio "English" [ref=e79]
                - generic [ref=e80]: English
              - generic [ref=e81] [cursor=pointer]:
                - radio "ä¸æ–‡ï¼ˆç®€ä½“ï¼‰" [ref=e82]
                - generic [ref=e83]: ä¸æ–‡ï¼ˆç®€ä½“ï¼‰
              - generic [ref=e84] [cursor=pointer]:
                - radio "Español" [ref=e85]
                - generic [ref=e86]: Español
            - paragraph [ref=e87]: Les documents d’origine et tes notes gardent leur langue.
          - group "Installer Détours" [ref=e88]:
            - generic [ref=e90]:
              - status [ref=e91]: Ajoute Détours à ton écran d’accueil depuis le menu de ton navigateur.
              - group [ref=e92]:
                - generic "Installer sur iPhone ou iPad" [ref=e93] [cursor=pointer]
              - paragraph [ref=e94]: Garde une sauvegarde avant de changer de navigateur ou de mode d’ouverture. Installer l’app ne transfère pas automatiquement tes carnets.
          - status [ref=e95]: Ces réglages sont mémorisés sur cet appareil.
        - button "Connexion" [ref=e97] [cursor=pointer]
    - main [ref=e101]:
      - region "Partage et synchronisation" [ref=e102]:
        - generic [ref=e103]:
          - generic [ref=e104]: Mon voyage · Propriétaire
          - button "Partager" [ref=e112] [cursor=pointer]
        - generic [ref=e118]:
          - status [ref=e119]: Enregistré sur cet appareil
          - button "Voir la synchronisation" [ref=e123] [cursor=pointer]
        - paragraph [ref=e124]: Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.
      - button "Voir Maintenant" [ref=e125] [cursor=pointer]
      - generic [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]: LE VOYAGE COMMENCE ICI
          - heading "Un grand voyage, de beaux détours." [level=1] [ref=e130]
          - paragraph [ref=e131]: Tout ton itinéraire au même endroit. Il ne reste qu’à en profiter.
        - generic [ref=e132]:
          - button "Reprendre" [ref=e133] [cursor=pointer]
          - button "Exporter le carnet" [ref=e136] [cursor=pointer]
      - generic [ref=e142]:
        - generic [ref=e143]: MON ÉCHAPPÉE EN ASIE
        - heading "Cap sur la Chine 中国之旅" [level=2] [ref=e145]:
          - text: Cap sur la Chine
          - generic [ref=e146]: 中国之旅
        - paragraph [ref=e147]: Des villes qui ne dorment jamais aux paysages qui invitent à ralentir.
        - generic [ref=e148]:
          - generic [ref=e149]: 7 villes & étapes
          - generic [ref=e154]: 17 journées préparées
          - generic [ref=e158]: "2027"
      - generic [ref=e159]:
        - generic [ref=e160]:
          - heading "Les étapes du voyage" [level=2] [ref=e161]
          - generic [ref=e162]: Un itinéraire qui grandit avec tes envies
        - generic "Choisir une ville" [ref=e163]:
          - button "01 Shenzhen 3 jours · 2 nuits" [pressed] [ref=e164] [cursor=pointer]:
            - generic [ref=e165]: "01"
            - generic [ref=e166]:
              - strong [ref=e167]: Shenzhen
              - generic [ref=e168]: 3 jours · 2 nuits
          - button "02 Guangzhou 3 jours · 2 nuits" [ref=e170] [cursor=pointer]:
            - generic [ref=e171]: "02"
            - generic [ref=e172]:
              - strong [ref=e173]: Guangzhou
              - generic [ref=e174]: 3 jours · 2 nuits
          - button "03 Yangshuo 3 jours · 2 nuits" [ref=e175] [cursor=pointer]:
            - generic [ref=e176]: "03"
            - generic [ref=e177]:
              - strong [ref=e178]: Yangshuo
              - generic [ref=e179]: 3 jours · 2 nuits
          - button "04 Chongqing & Wulong 4 jours · 3 nuits" [ref=e180] [cursor=pointer]:
            - generic [ref=e181]: "04"
            - generic [ref=e182]:
              - strong [ref=e183]: Chongqing & Wulong
              - generic [ref=e184]: 4 jours · 3 nuits
          - button "05 Chengdu 3 jours · 2 nuits" [ref=e185] [cursor=pointer]:
            - generic [ref=e186]: "05"
            - generic [ref=e187]:
              - strong [ref=e188]: Chengdu
              - generic [ref=e189]: 3 jours · 2 nuits
          - button "06 Shanghai À compléter" [ref=e190] [cursor=pointer]:
            - generic [ref=e191]: "06"
            - generic [ref=e192]:
              - strong [ref=e193]: Shanghai
              - generic [ref=e194]: À compléter
          - button "07 Suzhou 1 jour · excursion" [ref=e195] [cursor=pointer]:
            - generic [ref=e196]: "07"
            - generic [ref=e197]:
              - strong [ref=e198]: Suzhou
              - generic [ref=e199]: 1 jour · excursion
          - button "Ajouter une ville" [ref=e200] [cursor=pointer]
      - generic [ref=e202]:
        - generic [ref=e203]:
          - generic [ref=e204]:
            - generic [ref=e205]: ÉTAPE 01
            - heading "Shenzhen 深圳 Modifier Shenzhen" [level=2] [ref=e207]:
              - text: Shenzhen
              - generic [ref=e208]: 深圳
              - button "Modifier Shenzhen" [ref=e209] [cursor=pointer]
            - paragraph [ref=e213]: Premiers pas entre gratte-ciel et bord de mer
          - generic [ref=e214]: 0 / 15 étapes vécues
        - generic [ref=e218]:
          - generic [ref=e219]:
            - generic "Choisir une journée" [ref=e220]:
              - button "Jour 1" [pressed] [ref=e221] [cursor=pointer]
              - button "Jour 2" [ref=e224] [cursor=pointer]
              - button "Jour 3" [ref=e227] [cursor=pointer]
              - button "Ajouter un jour" [ref=e230] [cursor=pointer]
            - generic [ref=e232]:
              - generic [ref=e233]:
                - generic [ref=e234]:
                  - paragraph [ref=e235]:
                    - text: JOUR 01
                    - generic [ref=e236]: · 3 étapes
                  - heading "Arrivée" [level=3] [ref=e237]
                - generic [ref=e238]:
                  - button "Modifier le titre de la journée" [ref=e239] [cursor=pointer]
                  - button "Supprimer cette journée" [ref=e243] [cursor=pointer]
              - group [ref=e247]:
                - generic "Préparer cette journée Plan initial" [ref=e248] [cursor=pointer]:
                  - text: Préparer cette journée
                  - generic [ref=e249]: Plan initial
              - generic [ref=e250]:
                - article [ref=e251]:
                  - 'button "Marquer comme visité : Arrivée à Shenzhen" [ref=e253] [cursor=pointer]': "1"
                  - generic [ref=e255]:
                    - generic [ref=e256]: Transport
                    - heading "Arrivée à Shenzhen" [level=4] [ref=e265]
                    - paragraph [ref=e266]: Rejoindre Shenzhen ; horaire et point d’arrivée à compléter.
                    - button "Adresse à compléter" [ref=e267] [cursor=pointer]
                    - generic [ref=e269]:
                      - button "Monter Arrivée à Shenzhen" [disabled] [ref=e270]
                      - button "Descendre Arrivée à Shenzhen" [ref=e273] [cursor=pointer]
                      - button "Modifier Arrivée à Shenzhen" [ref=e276] [cursor=pointer]
                      - button "Supprimer Arrivée à Shenzhen" [ref=e280] [cursor=pointer]
                - article [ref=e284]:
                  - 'button "Marquer comme visité : Installation à Futian" [ref=e286] [cursor=pointer]': "2"
                  - generic [ref=e288]:
                    - generic [ref=e289]: Hébergement
                    - heading "Installation à Futian" [level=4] [ref=e294]
                    - paragraph [ref=e295]:
                      - text: 福田区
                      - button "Copier 福田区" [ref=e296] [cursor=pointer]
                    - paragraph [ref=e300]: Rejoindre l’hôtel dans le quartier de Futian. Établissement à préciser.
                    - generic [ref=e301]:
                      - group [ref=e302]:
                        - generic "Actions pour 福田区" [ref=e303] [cursor=pointer]: 福田区
                      - button "Copier l’adresse" [ref=e310] [cursor=pointer]
                      - status [ref=e314]
                    - generic [ref=e316]:
                      - button "Monter Installation à Futian" [ref=e317] [cursor=pointer]
                      - button "Descendre Installation à Futian" [ref=e320] [cursor=pointer]
                      - button "Modifier Installation à Futian" [ref=e323] [cursor=pointer]
                      - button "Supprimer Installation à Futian" [ref=e327] [cursor=pointer]
                - article [ref=e331]:
                  - 'button "Marquer comme visité : Dîner dans le quartier" [ref=e333] [cursor=pointer]': "3"
                  - generic [ref=e335]:
                    - generic [ref=e336]:
                      - generic [ref=e337]: À table
                      - generic [ref=e341]: Soir
                    - heading "Dîner dans le quartier" [level=4] [ref=e342]
                    - paragraph [ref=e343]: Première soirée et dîner près de l’hôtel, à Futian.
                    - button "Adresse à compléter" [ref=e344] [cursor=pointer]
                    - generic [ref=e346]:
                      - button "Monter Dîner dans le quartier" [ref=e347] [cursor=pointer]
                      - button "Descendre Dîner dans le quartier" [disabled] [ref=e350]
                      - button "Modifier Dîner dans le quartier" [ref=e353] [cursor=pointer]
                      - button "Supprimer Dîner dans le quartier" [ref=e357] [cursor=pointer]
              - button "Ajouter une étape à cette journée" [ref=e361] [cursor=pointer]
              - generic [ref=e363]:
                - generic [ref=e364]: Pas d’horaires imposés. Profite à ton rythme.
                - generic [ref=e365]:
                  - button "Jour précédent" [disabled] [ref=e366]
                  - button "Jour suivant" [ref=e369] [cursor=pointer]
          - complementary [ref=e372]:
            - generic [ref=e373]:
              - generic [ref=e374]:
                - heading "Les repères du jour" [level=3] [ref=e375]
                - button "Agrandir" [ref=e379] [cursor=pointer]
              - region "Carte des étapes à Shenzhen" [ref=e384]:
                - generic [ref=e385]:
                  - generic [ref=e386]:
                    - generic:
                      - button "·" [ref=e387] [cursor=pointer]
                      - generic:
                        - tooltip "Shenzhen · centre indicatif"
                    - generic:
                      - generic:
                        - generic [ref=e389]:
                          - button "Zoomer sur la carte" [ref=e390] [cursor=pointer]: +
                          - button "Dézoomer sur la carte" [ref=e391] [cursor=pointer]: −
                        - generic [ref=e392]:
                          - link "Leaflet" [ref=e393] [cursor=pointer]:
                            - /url: https://leafletjs.com
                          - text: "| ©"
                          - link "OpenStreetMap" [ref=e398] [cursor=pointer]:
                            - /url: https://www.openstreetmap.org/copyright
                          - text: ","
                          - link "Natural Earth" [ref=e399] [cursor=pointer]:
                            - /url: https://www.naturalearthdata.com/
                          - text: · domaine public
                  - status: Vue de Shenzhen · Ces étapes n’ont pas encore de repère précis.
                - generic [ref=e400]:
                  - generic [ref=e402]: Repères indicatifs · itinéraires par liens externes
                  - generic [ref=e403]: 0 / 3 étapes repérées · autres adresses dans le planning
                - status [ref=e404]:
                  - paragraph [ref=e405]: Fond détaillé indisponible · repères indicatifs, sans rues.
                  - generic [ref=e406]:
                    - link "Arrivée à Shenzhen ↗" [ref=e407] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=Arriv%C3%A9e+%C3%A0+Shenzhen+%E6%B7%B1%E5%9C%B3
                    - link "Installation à Futian ↗" [ref=e408] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=%E7%A6%8F%E7%94%B0%E5%8C%BA+%E6%B7%B1%E5%9C%B3
                    - link "Dîner dans le quartier ↗" [ref=e409] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=D%C3%AEner+dans+le+quartier+%E6%B7%B1%E5%9C%B3
                    - link "Carte de Shenzhen ↗" [ref=e410] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=%E6%B7%B1%E5%9C%B3
            - generic [ref=e411]:
              - heading "Le petit pense-bête" [level=3] [ref=e416]
              - paragraph [ref=e417]: "Séjour prévu : 3 jours et 2 nuits. Dates et hôtel à compléter."
              - paragraph [ref=e418]: "À réserver : entrée du musée et train pour Guangzhou. Aucune réservation confirmée dans le document."
              - paragraph [ref=e419]: "Le musée d’histoire naturelle est indiqué à Pingshan dans le planning : vérifier le nom exact, l’adresse, l’ouverture et la billetterie avant de fixer le trajet."
              - paragraph [ref=e420]: Si Huaqiangbei prend plus de temps que prévu, supprimer Qianhai Stone Park.
              - generic [ref=e421]: Ma note pour Shenzhen
              - textbox "Ma note pour Shenzhen" [ref=e422]:
                - /placeholder: Une idée, une adresse, un rappel…
              - generic [ref=e423]: Note personnelle · sauvegarde locale
            - generic [ref=e426]:
              - heading "Et s’il reste un peu de temps ?" [level=3] [ref=e430]
              - paragraph [ref=e431]: 25 idées de restaurants, balades et jolis détours t’attendent à Shenzhen.
              - button "Explorer les bonus" [ref=e432] [cursor=pointer]
      - generic [ref=e435]:
        - generic [ref=e436]: Le monde, au gré des envies.
        - generic [ref=e438]: Ton voyage évolue. Ton carnet aussi.
  - navigation "Navigation rapide" [ref=e441]:
    - button "Planning" [ref=e442] [cursor=pointer]
    - button "Carte" [ref=e446] [cursor=pointer]
    - button "Bonus" [ref=e450] [cursor=pointer]
    - button "Outils" [ref=e454] [cursor=pointer]
    - button "Menu" [ref=e459] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from './fixtures';
  2   | import { translate, localeFor } from '../../src/locale-utils';
  3   | 
  4   | for (const [language, nativeLabel, title] of [
  5   |   ['zh-CN', '中文（简体）', '我的旅行'],
  6   |   ['es', 'Español', 'Mis viajes'],
  7   | ] as const) {
  8   |   test(`${nativeLabel}: library, all views, dates, forms and saved notes`, async ({ page }) => {
  9   |     const t = (source: string) => translate(source, language);
  10  |     await page.goto('/');
  11  |     await expect(page).toHaveTitle(/^Détours —/);
  12  |     await expect(page.locator('.brand')).toContainText('détours');
  13  |     const note = 'Mi nota personnelle 中文 · 14 h';
  14  |     await page.getByLabel('Ma note pour Shenzhen', { exact: true }).fill(note);
  15  |     await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:china-legacy')!).state.notes.shenzhen)).toBe(note);
  16  |     const before = await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'));
  17  |     await page.getByRole('button', { name: 'Préférences', exact: true }).click();
  18  |     await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
  19  |     await expect(page.getByRole('dialog').getByText(t('Langue de l’interface'), { exact: true })).toBeVisible();
  20  |     await page.keyboard.press('Escape');
  21  |     await expect(page.locator('html')).toHaveAttribute('lang', language);
  22  |     await expect(page.getByLabel(translate('Ma note pour {city}', language, { city: 'Shenzhen' }), { exact: true })).toHaveValue(note);
  23  |     await expect(page.getByRole('heading', { name: 'Arrivée à Shenzhen', exact: true })).toBeVisible();
  24  |     expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'))).toBe(before);
  25  |     await page.getByRole('button', { name: t('Ajouter une étape à cette journée'), exact: true }).click();
  26  |     await expect(page.getByRole('dialog').getByLabel(t('Lieu ou activité'), { exact: true })).toBeVisible();
  27  |     await page.keyboard.press('Escape');
  28  |     const nav = page.getByRole('navigation', { name: t('Navigation principale'), exact: true });
  29  |     await nav.getByRole('button', { name: t('Vue d’ensemble'), exact: true }).click();
  30  |     await page.locator('input[type="date"]').first().fill('2027-03-12');
  31  |     // Capture the actual print document while avoiding the system print dialog.
  32  |     await page.evaluate(() => {
  33  |       const append = Element.prototype.append;
  34  |       Element.prototype.append = function (...nodes) {
  35  |         append.apply(this, nodes);
  36  |         for (const node of nodes) if (node instanceof HTMLIFrameElement && node.contentWindow) {
  37  |           node.contentWindow.print = () => {
  38  |             document.body.dataset.printLang = node.contentDocument!.documentElement.lang;
  39  |             document.body.dataset.printText = node.contentDocument!.body.textContent || '';
  40  |           };
  41  |         }
  42  |       };
  43  |     });
  44  |     await page.getByRole('button', { name: t('Imprimer tout le voyage'), exact: true }).click();
  45  |     await expect(page.locator('body')).toHaveAttribute('data-print-lang', language);
  46  |     const printed = await page.locator('body').getAttribute('data-print-text');
  47  |     expect(printed).toContain(note);
  48  |     expect(printed).toContain(new Date('2027-03-12T12:00:00Z').toLocaleDateString(localeFor(language), { dateStyle: 'medium', timeZone: 'UTC' }));
  49  |     await nav.getByRole('button', { name: t('Mon planning'), exact: true }).click();
  50  |     const date = new Date('2027-03-12T12:00:00Z').toLocaleDateString(localeFor(language), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  51  |     await expect(page.locator('.day-date')).toHaveText(date);
  52  |     await nav.getByRole('button', { name: t('La carte du voyage'), exact: true }).click();
  53  |     await expect(page.locator('.leaflet-container').first()).toBeVisible();
  54  |     await nav.getByRole('button', { name: t('Mes envies & bonus') }).click();
  55  |     await page.getByRole('button', { name: t('Ajouter une adresse'), exact: true }).click();
  56  |     await expect(page.getByRole('dialog').getByLabel(t('Nom de l’adresse'), { exact: true })).toBeVisible();
  57  |     await page.keyboard.press('Escape');
  58  |     await nav.getByRole('button', { name: t('Mes transports'), exact: true }).click();
  59  |     await page.getByRole('button', { name: t('Ajouter un trajet'), exact: true }).click();
  60  |     await expect(page.getByLabel(t('Nom du trajet (facultatif)'), { exact: true })).toBeVisible();
  61  |     await nav.getByRole('button', { name: t('Mes outils sur place'), exact: true }).click();
  62  |     for (const tab of ['Hébergements', 'Budget', 'Dans ma valise', 'Phrases utiles']) {
  63  |       await page.getByRole('tab', { name: t(tab), exact: true }).click();
  64  |       if (tab === 'Budget') await expect(page.getByLabel(t('Montant'), { exact: true })).toBeVisible();
  65  |     }
  66  |     await nav.getByRole('button', { name: t('Mon carnet pratique'), exact: true }).click();
  67  |     await expect(page.getByRole('button', { name: t('Exporter ma sauvegarde'), exact: true })).toBeVisible();
  68  |     await page.getByRole('button', { name: title, exact: true }).click();
  69  |     await expect(page).toHaveTitle(`Détours — ${title}`);
  70  |     await page.getByRole('button', { name: t('Créer un voyage'), exact: true }).click();
  71  |     await expect(page.getByRole('dialog').getByLabel(t('Titre du voyage'), { exact: true })).toBeVisible();
  72  |     await page.keyboard.press('Escape');
  73  |     await page.reload();
  74  |     await expect(page.locator('html')).toHaveAttribute('lang', language);
  75  |     await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: 'Chine 2027' }), exact: true }).click();
  76  |     await nav.getByRole('button', { name: t('Mon planning'), exact: true }).click();
  77  |     await expect(page.getByLabel(translate('Ma note pour {city}', language, { city: 'Shenzhen' }), { exact: true })).toHaveValue(note);
  78  |   });
  79  | 
  80  |   test(`${nativeLabel}: 320px navigation, preferences and both themes fit`, async ({ page }) => {
  81  |     await page.setViewportSize({ width: 320, height: 844 });
  82  |     await page.goto('/');
  83  |     const t = (source: string) => translate(source, language);
  84  |     for (const theme of ['light', 'dark']) {
  85  |       await page.getByRole('button', { name: /^(Préférences|偏好设置|Preferencias)$/ }).click();
> 86  |       await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
      |                                                                                             ^ Error: locator.check: Test timeout of 30000ms exceeded.
  87  |       await page.getByRole('dialog').locator(`input[value="${theme}"]`).check();
  88  |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  89  |       await page.screenshot({ path: `test-results/locales-${language}-${theme}-preferences.png` });
  90  |       await page.keyboard.press('Escape');
  91  |       const bottom = page.locator('.mobile-bottom-nav');
  92  |       for (const key of ['Planning', 'Carte', 'Bonus', 'Outils']) {
  93  |         await bottom.getByRole('button', { name: t(key), exact: true }).click();
  94  |         expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${language} ${theme} ${key}`).toBe(true);
  95  |       }
  96  |       await bottom.getByRole('button', { name: t('Menu'), exact: true }).click();
  97  |       await expect(page.locator('.sidebar')).toHaveClass(/open/);
  98  |       await page.keyboard.press('Escape');
  99  |       await bottom.getByRole('button', { name: t('Planning'), exact: true }).click();
  100 |       await page.screenshot({ path: `test-results/locales-${language}-${theme}-planning.png`, fullPage: true });
  101 |     }
  102 |   });
  103 | }
  104 | 
```