# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: world-languages.spec.ts >> 中文（简体）: library, all views, dates, forms and saved notes
- Location: tests\e2e\world-languages.spec.ts:8:3

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
  - complementary [ref=e5]:
    - link "détours. LES BEAUX DÉTOURS" [ref=e6] [cursor=pointer]:
      - /url: "#"
      - generic [ref=e9]:
        - text: détours.
        - generic [ref=e10]: LES BEAUX DÉTOURS
    - button "Mes voyages" [ref=e11] [cursor=pointer]:
      - generic [ref=e12]: 中
      - generic [ref=e13]:
        - strong [ref=e14]: Chine 2027
        - generic [ref=e15]: Mes voyages
    - paragraph [ref=e18]: MON VOYAGE
    - navigation "Navigation principale" [ref=e19]:
      - button "Maintenant" [ref=e20] [cursor=pointer]
      - button "Mon planning" [ref=e25] [cursor=pointer]
      - button "Vue d’ensemble" [ref=e30] [cursor=pointer]
      - button "La carte du voyage" [ref=e35] [cursor=pointer]
      - button "Mes envies & bonus ♡" [ref=e39] [cursor=pointer]:
        - generic [ref=e42]: Mes envies & bonus
        - generic [ref=e43]: ♡
      - button "Mes transports" [ref=e44] [cursor=pointer]
      - button "Mon carnet pratique" [ref=e53] [cursor=pointer]
      - button "Mes outils sur place" [ref=e57] [cursor=pointer]
    - generic [ref=e62]:
      - generic [ref=e63]:
        - generic [ref=e64]: LE FIL DU VOYAGE
        - generic [ref=e65]: 7 étapes
      - button "Shenzhen 3 j" [ref=e66] [cursor=pointer]:
        - generic [ref=e68]: Shenzhen
        - generic [ref=e69]: 3 j
      - button "Guangzhou 3 j" [ref=e70] [cursor=pointer]:
        - generic [ref=e72]: Guangzhou
        - generic [ref=e73]: 3 j
      - button "Yangshuo 3 j" [ref=e74] [cursor=pointer]:
        - generic [ref=e76]: Yangshuo
        - generic [ref=e77]: 3 j
      - button "Chongqing & Wulong 4 j" [ref=e78] [cursor=pointer]:
        - generic [ref=e80]: Chongqing & Wulong
        - generic [ref=e81]: 4 j
      - button "Chengdu 3 j" [ref=e82] [cursor=pointer]:
        - generic [ref=e84]: Chengdu
        - generic [ref=e85]: 3 j
      - button "Shanghai à venir" [ref=e86] [cursor=pointer]:
        - generic [ref=e88]: Shanghai
        - generic [ref=e89]: à venir
      - button "Suzhou 1 j Dernière étape" [ref=e90] [cursor=pointer]:
        - generic [ref=e92]: Suzhou
        - generic [ref=e93]: 1 j
        - generic [ref=e94]: Dernière étape
      - button "Ajouter une ville" [ref=e95] [cursor=pointer]
    - generic [ref=e97]:
      - generic [ref=e98]:
        - text: 慢慢来
        - paragraph [ref=e99]: Prendre le temps.Garder l’envie de découvrir.
      - generic [ref=e102]: Carnet sauvegardé sur cet appareil
  - generic [ref=e104]:
    - banner [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]: Mon carnet de voyage
        - strong [ref=e110]: Chine 2027
      - generic [ref=e111]:
        - generic [ref=e112]:
          - textbox "Rechercher dans le carnet" [ref=e116]:
            - /placeholder: Retrouver un lieu, une envie…
          - generic [ref=e117]: ⌕
        - button "Informations pratiques" [ref=e118] [cursor=pointer]
        - button "Préférences" [ref=e122] [cursor=pointer]
        - dialog [ref=e124]:
          - banner [ref=e125]:
            - generic [ref=e126]:
              - paragraph [ref=e127]: Personnalise ton carnet
              - heading "Préférences" [level=2] [ref=e128]
            - button "Fermer" [active] [ref=e129] [cursor=pointer]
          - group "Apparence" [ref=e133]:
            - generic [ref=e135]:
              - generic [ref=e136] [cursor=pointer]:
                - radio "Clair" [ref=e137]
                - generic [ref=e144]: Clair
              - generic [ref=e145] [cursor=pointer]:
                - radio "Sombre" [ref=e146]
                - generic [ref=e149]: Sombre
              - generic [ref=e150] [cursor=pointer]:
                - radio "Automatique" [checked] [ref=e151]
                - generic [ref=e154]: Automatique
            - paragraph [ref=e157]: Suit les réglages de ton appareil.
          - group "Couleurs" [ref=e158]:
            - paragraph [ref=e166]: Chaque apparence garde sa palette sur cet appareil.
            - group [ref=e167]:
              - generic "Plus de palettes Signature Détours" [ref=e168] [cursor=pointer]:
                - generic [ref=e169]: Plus de palettes
                - strong [ref=e170]: Signature Détours
          - group "Langue de l’interface" [ref=e171]:
            - generic [ref=e177]:
              - generic [ref=e178] [cursor=pointer]:
                - radio "Français" [checked] [ref=e179]
                - generic [ref=e180]: Français
              - generic [ref=e183] [cursor=pointer]:
                - radio "English" [ref=e184]
                - generic [ref=e185]: English
              - generic [ref=e186] [cursor=pointer]:
                - radio "ä¸æ–‡ï¼ˆç®€ä½“ï¼‰" [ref=e187]
                - generic [ref=e188]: ä¸æ–‡ï¼ˆç®€ä½“ï¼‰
              - generic [ref=e189] [cursor=pointer]:
                - radio "Español" [ref=e190]
                - generic [ref=e191]: Español
            - paragraph [ref=e192]: Les documents d’origine et tes notes gardent leur langue.
          - group "Installer Détours" [ref=e193]:
            - generic [ref=e195]:
              - status [ref=e196]: Ajoute Détours à ton écran d’accueil depuis le menu de ton navigateur.
              - group [ref=e197]:
                - generic "Installer sur iPhone ou iPad" [ref=e198] [cursor=pointer]
              - paragraph [ref=e199]: Garde une sauvegarde avant de changer de navigateur ou de mode d’ouverture. Installer l’app ne transfère pas automatiquement tes carnets.
          - status [ref=e200]: Ces réglages sont mémorisés sur cet appareil.
        - button "Connexion" [ref=e202] [cursor=pointer]
    - main [ref=e209]:
      - region "Partage et synchronisation" [ref=e210]:
        - generic [ref=e211]:
          - generic [ref=e212]: Mon voyage · Propriétaire
          - button "Partager" [ref=e220] [cursor=pointer]
        - generic [ref=e226]:
          - status [ref=e227]: Enregistré sur cet appareil
          - button "Voir la synchronisation" [ref=e231] [cursor=pointer]
        - paragraph [ref=e232]: Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.
      - button "Voir Maintenant" [ref=e233] [cursor=pointer]
      - generic [ref=e234]:
        - generic [ref=e235]:
          - generic [ref=e236]: LE VOYAGE COMMENCE ICI
          - heading "Un grand voyage, de beaux détours." [level=1] [ref=e238]
          - paragraph [ref=e239]: Tout ton itinéraire au même endroit. Il ne reste qu’à en profiter.
        - generic [ref=e240]:
          - button "Reprendre" [ref=e241] [cursor=pointer]
          - button "Exporter le carnet" [ref=e244] [cursor=pointer]
      - generic [ref=e248]:
        - generic [ref=e250]:
          - generic [ref=e251]: MON ÉCHAPPÉE EN ASIE
          - heading "Cap sur la Chine中国之旅" [level=2] [ref=e253]
          - paragraph [ref=e254]: Des villes qui ne dorment jamais aux paysages qui invitent à ralentir.
          - generic [ref=e255]:
            - generic [ref=e256]: 7 villes & étapes
            - generic [ref=e261]: 17 journées préparées
            - generic [ref=e265]: "2027"
        - generic [ref=e266]: UN VOYAGEÀ MON RYTHME
        - generic [ref=e272]: L’esprit des paysages de Guilin · illustration
      - generic [ref=e273]:
        - generic [ref=e274]:
          - heading "Les étapes du voyage" [level=2] [ref=e275]
          - generic [ref=e276]: Un itinéraire qui grandit avec tes envies
        - generic "Choisir une ville" [ref=e277]:
          - button "01 Shenzhen 3 jours · 2 nuits" [pressed] [ref=e278] [cursor=pointer]:
            - generic [ref=e279]: "01"
            - generic [ref=e280]:
              - strong [ref=e281]: Shenzhen
              - generic [ref=e282]: 3 jours · 2 nuits
          - button "02 Guangzhou 3 jours · 2 nuits" [ref=e284] [cursor=pointer]:
            - generic [ref=e285]: "02"
            - generic [ref=e286]:
              - strong [ref=e287]: Guangzhou
              - generic [ref=e288]: 3 jours · 2 nuits
          - button "03 Yangshuo 3 jours · 2 nuits" [ref=e289] [cursor=pointer]:
            - generic [ref=e290]: "03"
            - generic [ref=e291]:
              - strong [ref=e292]: Yangshuo
              - generic [ref=e293]: 3 jours · 2 nuits
          - button "04 Chongqing & Wulong 4 jours · 3 nuits" [ref=e294] [cursor=pointer]:
            - generic [ref=e295]: "04"
            - generic [ref=e296]:
              - strong [ref=e297]: Chongqing & Wulong
              - generic [ref=e298]: 4 jours · 3 nuits
          - button "05 Chengdu 3 jours · 2 nuits" [ref=e299] [cursor=pointer]:
            - generic [ref=e300]: "05"
            - generic [ref=e301]:
              - strong [ref=e302]: Chengdu
              - generic [ref=e303]: 3 jours · 2 nuits
          - button "06 Shanghai À compléter" [ref=e304] [cursor=pointer]:
            - generic [ref=e305]: "06"
            - generic [ref=e306]:
              - strong [ref=e307]: Shanghai
              - generic [ref=e308]: À compléter
          - button "07 Suzhou 1 jour · excursion" [ref=e309] [cursor=pointer]:
            - generic [ref=e310]: "07"
            - generic [ref=e311]:
              - strong [ref=e312]: Suzhou
              - generic [ref=e313]: 1 jour · excursion
          - button "Ajouter une ville" [ref=e314] [cursor=pointer]
      - generic [ref=e316]:
        - generic [ref=e317]:
          - generic [ref=e318]:
            - generic [ref=e319]: ÉTAPE 01
            - heading "Shenzhen 深圳 Modifier Shenzhen" [level=2] [ref=e321]:
              - text: Shenzhen
              - generic [ref=e322]: 深圳
              - button "Modifier Shenzhen" [ref=e323] [cursor=pointer]
            - paragraph [ref=e327]: Premiers pas entre gratte-ciel et bord de mer
          - generic [ref=e328]: 0 / 15 étapes vécues
        - generic [ref=e332]:
          - generic [ref=e333]:
            - generic "Choisir une journée" [ref=e334]:
              - button "Jour 1" [pressed] [ref=e335] [cursor=pointer]
              - button "Jour 2" [ref=e338] [cursor=pointer]
              - button "Jour 3" [ref=e341] [cursor=pointer]
              - button "Ajouter un jour" [ref=e344] [cursor=pointer]
            - generic [ref=e347]:
              - generic [ref=e348]:
                - generic [ref=e349]:
                  - paragraph [ref=e350]:
                    - text: JOUR 01
                    - generic [ref=e351]: · 3 étapes
                  - heading "Arrivée" [level=3] [ref=e352]
                - generic [ref=e353]:
                  - button "Modifier le titre de la journée" [ref=e354] [cursor=pointer]
                  - button "Supprimer cette journée" [ref=e358] [cursor=pointer]
              - group [ref=e362]:
                - generic "Préparer cette journée Plan initial" [ref=e363] [cursor=pointer]:
                  - text: Préparer cette journée
                  - generic [ref=e364]: Plan initial
              - generic [ref=e365]:
                - article [ref=e366]:
                  - 'button "Marquer comme visité : Arrivée à Shenzhen" [ref=e368] [cursor=pointer]': "1"
                  - generic [ref=e370]:
                    - generic [ref=e371]: Transport
                    - heading "Arrivée à Shenzhen" [level=4] [ref=e380]
                    - paragraph [ref=e381]: Rejoindre Shenzhen ; horaire et point d’arrivée à compléter.
                    - button "Adresse à compléter" [ref=e382] [cursor=pointer]
                    - generic [ref=e384]:
                      - button "Monter Arrivée à Shenzhen" [disabled] [ref=e385]
                      - button "Descendre Arrivée à Shenzhen" [ref=e388] [cursor=pointer]
                      - button "Modifier Arrivée à Shenzhen" [ref=e391] [cursor=pointer]
                      - button "Supprimer Arrivée à Shenzhen" [ref=e395] [cursor=pointer]
                - article [ref=e399]:
                  - 'button "Marquer comme visité : Installation à Futian" [ref=e401] [cursor=pointer]': "2"
                  - generic [ref=e403]:
                    - generic [ref=e404]: Hébergement
                    - heading "Installation à Futian" [level=4] [ref=e409]
                    - paragraph [ref=e410]:
                      - text: 福田区
                      - button "Copier 福田区" [ref=e411] [cursor=pointer]
                    - paragraph [ref=e415]: Rejoindre l’hôtel dans le quartier de Futian. Établissement à préciser.
                    - generic [ref=e416]:
                      - group [ref=e417]:
                        - generic "Actions pour 福田区" [ref=e418] [cursor=pointer]: 福田区
                      - button "Copier l’adresse" [ref=e425] [cursor=pointer]
                      - status [ref=e429]
                    - generic [ref=e431]:
                      - button "Monter Installation à Futian" [ref=e432] [cursor=pointer]
                      - button "Descendre Installation à Futian" [ref=e435] [cursor=pointer]
                      - button "Modifier Installation à Futian" [ref=e438] [cursor=pointer]
                      - button "Supprimer Installation à Futian" [ref=e442] [cursor=pointer]
                - article [ref=e446]:
                  - 'button "Marquer comme visité : Dîner dans le quartier" [ref=e448] [cursor=pointer]': "3"
                  - generic [ref=e450]:
                    - generic [ref=e451]:
                      - generic [ref=e452]: À table
                      - generic [ref=e456]: Soir
                    - heading "Dîner dans le quartier" [level=4] [ref=e457]
                    - paragraph [ref=e458]: Première soirée et dîner près de l’hôtel, à Futian.
                    - button "Adresse à compléter" [ref=e459] [cursor=pointer]
                    - generic [ref=e461]:
                      - button "Monter Dîner dans le quartier" [ref=e462] [cursor=pointer]
                      - button "Descendre Dîner dans le quartier" [disabled] [ref=e465]
                      - button "Modifier Dîner dans le quartier" [ref=e468] [cursor=pointer]
                      - button "Supprimer Dîner dans le quartier" [ref=e472] [cursor=pointer]
              - button "Ajouter une étape à cette journée" [ref=e476] [cursor=pointer]
              - generic [ref=e478]:
                - generic [ref=e479]: Pas d’horaires imposés. Profite à ton rythme.
                - generic [ref=e480]:
                  - button "Jour précédent" [disabled] [ref=e481]
                  - button "Jour suivant" [ref=e484] [cursor=pointer]
          - complementary [ref=e487]:
            - generic [ref=e488]:
              - generic [ref=e489]:
                - heading "Les repères du jour" [level=3] [ref=e490]
                - button "Agrandir" [ref=e494] [cursor=pointer]
              - region "Carte des étapes à Shenzhen" [ref=e499]:
                - generic [ref=e500]:
                  - generic [ref=e501]:
                    - generic:
                      - button "·" [ref=e502] [cursor=pointer]
                      - generic:
                        - tooltip "Shenzhen · centre indicatif"
                    - generic:
                      - generic:
                        - generic [ref=e504]:
                          - button "Zoomer sur la carte" [ref=e505] [cursor=pointer]: +
                          - button "Dézoomer sur la carte" [ref=e506] [cursor=pointer]: −
                        - generic [ref=e507]:
                          - link "Leaflet" [ref=e508] [cursor=pointer]:
                            - /url: https://leafletjs.com
                          - text: "| ©"
                          - link "OpenStreetMap" [ref=e513] [cursor=pointer]:
                            - /url: https://www.openstreetmap.org/copyright
                          - text: ","
                          - link "Natural Earth" [ref=e514] [cursor=pointer]:
                            - /url: https://www.naturalearthdata.com/
                          - text: · domaine public
                  - status: Vue de Shenzhen · Ces étapes n’ont pas encore de repère précis.
                - generic [ref=e515]:
                  - generic [ref=e517]: Repères indicatifs · itinéraires par liens externes
                  - generic [ref=e518]: 0 / 3 étapes repérées · autres adresses dans le planning
                - status [ref=e519]:
                  - paragraph [ref=e520]: Fond détaillé indisponible · repères indicatifs, sans rues.
                  - generic [ref=e521]:
                    - link "Arrivée à Shenzhen ↗" [ref=e522] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=Arriv%C3%A9e+%C3%A0+Shenzhen+%E6%B7%B1%E5%9C%B3
                    - link "Installation à Futian ↗" [ref=e523] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=%E7%A6%8F%E7%94%B0%E5%8C%BA+%E6%B7%B1%E5%9C%B3
                    - link "Dîner dans le quartier ↗" [ref=e524] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=D%C3%AEner+dans+le+quartier+%E6%B7%B1%E5%9C%B3
                    - link "Carte de Shenzhen ↗" [ref=e525] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=%E6%B7%B1%E5%9C%B3
            - generic [ref=e526]:
              - heading "Le petit pense-bête" [level=3] [ref=e531]
              - paragraph [ref=e532]: "Séjour prévu : 3 jours et 2 nuits. Dates et hôtel à compléter."
              - paragraph [ref=e533]: "À réserver : entrée du musée et train pour Guangzhou. Aucune réservation confirmée dans le document."
              - paragraph [ref=e534]: "Le musée d’histoire naturelle est indiqué à Pingshan dans le planning : vérifier le nom exact, l’adresse, l’ouverture et la billetterie avant de fixer le trajet."
              - paragraph [ref=e535]: Si Huaqiangbei prend plus de temps que prévu, supprimer Qianhai Stone Park.
              - generic [ref=e536]: Ma note pour Shenzhen
              - textbox "Ma note pour Shenzhen" [ref=e537]:
                - /placeholder: Une idée, une adresse, un rappel…
                - text: Mi nota personnelle 中文 · 14 h
              - generic [ref=e538]: Note personnelle · sauvegarde locale
            - generic [ref=e541]:
              - heading "Et s’il reste un peu de temps ?" [level=3] [ref=e545]
              - paragraph [ref=e546]: 25 idées de restaurants, balades et jolis détours t’attendent à Shenzhen.
              - button "Explorer les bonus" [ref=e547] [cursor=pointer]
      - generic [ref=e550]:
        - generic [ref=e551]: Le monde, au gré des envies.
        - generic [ref=e553]: Ton voyage évolue. Ton carnet aussi.
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
> 18  |     await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
      |                                                                                           ^ Error: locator.check: Test timeout of 30000ms exceeded.
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
  86  |       await page.getByRole('dialog').getByRole('radio', { name: nativeLabel, exact: true }).check();
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