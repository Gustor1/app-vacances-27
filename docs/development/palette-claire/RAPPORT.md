# DÃ©tours â€” Palette claire lin/vert et identitÃ© oiseau

19 octobre 2026, heure de Shanghai. **TERMINÃ‰ LOCALEMENT â€” gate complet rÃ©ussi, 24/24 Ã©tapes.**

## RÃ©sultat et pÃ©rimÃ¨tre

Le mode clair reprend le fond lin, les surfaces crÃ¨me et les accents verts/sauge de lâ€™oiseau retenu. Les boutons, onglets, sÃ©lections, champs, barres translucides, panneaux, navigation et vues du carnet utilisent ces couleurs sans changement de disposition ou de parcours.

Pendant lâ€™implÃ©mentation, lâ€™utilisateur a ajoutÃ© deux consignes qui complÃ¨tent le brief : rapprocher le blanc des champs/menus du fond lin, et intÃ©grer le nouveau logo. Les champs et options utilisent donc `#F2EBDF`, et les menus du compte/recherche une surface lin opaque. Le dessin oiseau sur fond lin est intÃ©grÃ© aux deux en-tÃªtes et pieds de page, favicon, icÃ´nes 180/192/512 et maskable. Cela remplace lâ€™ancienne montagne dans lâ€™UI. Lâ€™autorisation utilisateur sur le logo remplace lâ€™exclusion initiale des icÃ´nes dans le brief.

Le mode sombre conserve ses couleurs noir/anthracite et bleu. **Seul le dessin de marque change aussi en sombre**, conformÃ©ment Ã  la nouvelle demande. Aucun changement des donnÃ©es, des clÃ©s de stockage, de la synchronisation, des droits serveur ou de la stratÃ©gie du service worker.

RÃ©fÃ©rence graphique utilisÃ©e : [oiseau vert profond sur lin](../../design/palette-claire-detours/oiseau-lin-vert-profond.png). Les rendus plus clairs restent des propositions conservÃ©es dans le dossier design ; aucun nouveau dessin nâ€™a Ã©tÃ© gÃ©nÃ©rÃ© pendant lâ€™intÃ©gration.

## Palette finale

| RÃ´le | Valeur |
| --- | --- |
| Fond gÃ©nÃ©ral lin | `#E8DFD0` |
| Surface crÃ¨me | `#F7F2E9` |
| Champs, options et menus | `#F2EBDF` |
| Surface secondaire ponctuelle | `#EEE6D9` |
| Texte principal | `#253B32` |
| Texte secondaire | `#596459` |
| Action / lien | `#3C6E59` |
| Action pressÃ©e / survol | `#305945` |
| Texte sur action | `#FAF6EE` |
| SÃ©lection sauge | `#DCE6D8` |
| SÃ©parateur dÃ©coratif | `#D3CBBB` |
| Bordure fonctionnelle | `#71806F` |

Les deux derniÃ¨res nuances fonctionnelles de texte et bordure ont Ã©tÃ© assombries aprÃ¨s mesure : les valeurs de dÃ©part du brief donnaient respectivement 4,41:1 et 2,86:1 sur le fond lin. Les couleurs dâ€™erreur/avertissement et les couleurs propres aux cartes, photos et marques externes ont conservÃ© leur rÃ´le.

Les tokens dâ€™action remplie sont sÃ©parÃ©s des liens : les valeurs bleues originales des boutons sombres sont conservÃ©es, au lieu de leur faire hÃ©riter du nouveau vert clair. Les ombres et transparences claires reprennent la teinte lin. Le repli opaque de contraste renforcÃ© reste disponible.

## Modifications et prÃ©servation

Branche dÃ©diÃ©e : `codex/palette-claire-lin`, crÃ©Ã©e aprÃ¨s rÃ©cupÃ©ration de `origin/codex/carnets-universels`, sur le HEAD courant pour prÃ©server les travaux locaux. HEAD initial : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`.

Snapshot complet initial : `C:/Users/eliot/Documents/detours-palette-claire-recovery-20261019` ; 561 fichiers, empreinte `b34d1a0b5bac0195fce5cb886cae94f22382c0a3d876616033e23a814d238c19`. Son contenu source correspond Ã  la sauvegarde utilisateur du 18/10 Ã  18:52. Les deux sauvegardes sont conservÃ©es.

14 fichiers initiaux modifiÃ©s dans cette mission :

- `src/apple-design.css` : palette, tokens dâ€™action, bordures, champs/options/menus et prÃ©sentation du logo.
- `src/i18n.tsx`, `index.html` : couleur de dÃ©marrage claire et favicons ; logique du thÃ¨me conservÃ©e.
- `src/App.tsx`, `src/components/JourneysApp.tsx` : dessin de marque remplacÃ© par le composant dâ€™image partagÃ©.
- `public/manifest.webmanifest`, `public/favicon.svg` et les quatre PNG dâ€™installation existants : nouvelle identitÃ© et couleur de lancement claire.
- `scripts/generate-pwa-icons.mjs` : redimensionnement reproductible du PNG approuvÃ© ; le SVG historique embarque le mÃªme PNG pour les anciens signets.
- `scripts/smoke-pwa-mobile.mjs`, `scripts/verify-local.mjs` : contrÃ´le du nouveau logo/favicon en cache et inclusion des tests de palette dans le gate.

Ajouts de code/ressources : `src/components/BrandMark.tsx`, trois PNG (`brand-128`, `favicon-32`, `favicon-48`), `scripts/smoke-palette-claire.mjs` et `tests/e2e/palette-claire.spec.ts`.

Les 547 autres fichiers initiaux sont identiques au snapshot ; aucun fichier initial supprimÃ©. Les changements antÃ©rieurs des lots 01/02 restent prÃ©sents. Voir [changes.json](changes.json) pour les SHA-256 avant/aprÃ¨s et le diff de contribution pour distinguer ce travail du diff Git prÃ©existant. Aucun commit, push, PR, dÃ©ploiement, changement Supabase distant ou lot suivant effectuÃ©.

## VÃ©rifications dÃ©jÃ  obtenues

### Visuel et sombre

88 captures de rÃ©fÃ©rence et 88 captures aprÃ¨s, Chromium aux largeurs 320/390/430/1440 et WebKit Ã  390/1440, en clair et sombre. Accueil, prÃ©fÃ©rences, formulaire, planning, carnet pratique ; bonus, vue dâ€™ensemble, carte, outils, Maintenant, transports et Mon monde Ã  1440. Les profils sont jetables, le carnet de dÃ©monstration est une fixture et les appels HTTPS externes sont bloquÃ©s.

- Avant remplacement du logo : les styles calculÃ©s des 44 Ã©crans sombres Ã©taient identiques Ã  la rÃ©fÃ©rence ([preuve](dark-comparison-before-logo.json)). 39 images Ã©taient Ã©galement identiques ; cinq variations de capture, notamment de cartes asynchrones, empÃªchent de parler dâ€™identitÃ© pixel par pixel universelle.
- AprÃ¨s lâ€™autorisation logo : 44/44 comparaisons rÃ©ussies, 2 902 groupes de classes HTML communs avec les mÃªmes couleurs/effets, hors dessin de marque, SVG et DOM interne Leaflet asynchrone ([preuve](dark-comparison.json)). Le logo ayant changÃ©, les images finales sombres ne sont pas annoncÃ©es identiques pixel par pixel.
- Absence dâ€™erreurs runtime dans les 88 captures aprÃ¨s ; absence de dÃ©bordement du document dans les vues capturÃ©es.
- Menus natifs et menu du compte ouverts : [sÃ©lection Chrome](select-open-chromium-390.png), [menu du compte](account-menu-chromium-390.png).

Exemples : [accueil mobile](after/chromium-light-390-home.png), [planning bureau](after/chromium-light-1440-planning.png), [prÃ©fÃ©rences mobiles](after/chromium-light-390-preferences.png), [mode sombre](after/chromium-dark-390-home.png).

### Contrastes rÃ©els

Mesures obtenues sur les styles rendus, avec composition des fonds translucides et repli opaque. Seuil 4,5:1 pour le texte courant ; 3:1 pour bordure/focus.

| Paire | Ratio mesurÃ© |
| --- | --- |
| Texte principal / lin | 9,08:1 |
| Texte secondaire / lin | 4,69:1 |
| Texte crÃ¨me / bouton vert | 5,46:1 |
| Marque / barre translucide | 9,08:1 |
| Titre / surface crÃ¨me | 10,76:1 |
| Texte / champ lin | 10,13:1 |
| Placeholder / champ lin | 5,23:1 |
| Bordure de champ / surface | 3,75:1 |
| Texte sÃ©lectionnÃ© / sauge | 4,58:1 |
| Focus clavier / lin | 4,46:1 |

DÃ©tails : [Chromium](contrasts-chromium.json), [WebKit](contrasts-webkit.json). Cela couvre les paires testÃ©es, pas un audit exhaustif de chaque combinaison photographique ou Ã©tat mÃ©tier possible.

### ScÃ©narios ciblÃ©s

- Types produit/tests et lint : rÃ©ussis aprÃ¨s intÃ©gration du logo.
- Chromium final : les 22 scÃ©narios prÃ©fÃ©rences/Apple/gestes/palette ont rÃ©ussi, dont les huit nouveaux scÃ©narios, avec le logo et la surface des menus dÃ©finitifs.
- WebKit iPhone : **19/22 rÃ©ussis**, dont les huit scÃ©narios de palette/logo/menus, synchronisation de thÃ¨me entre onglets, conservation des donnÃ©es, quatre langues, paysages/hauteur rÃ©duite, contrastes et prÃ©fÃ©rences Ã  200 %.
- Trois Ã©checs historiques WebKit ont Ã©tÃ© rejouÃ©s sur **la copie complÃ¨te originale** du snapshot, dans un runtime temporaire sur 5174 : mÃªmes trois Ã©checs avant changement ([log baseline](webkit-baseline.log)). Deux attentes de focus aprÃ¨s ouverture Ã  la souris (`apple-design.spec.ts`, lignes 3 et 15) ; un scÃ©nario de navigation de bureau qui ne dÃ©plie pas la sidebar du profil iPhone (`preferences.spec.ts`, ligne 47). Les tests historiques et le runtime des modales nâ€™ont pas Ã©tÃ© modifiÃ©s pour les faire passer.

Rectifications de recettes pendant la vÃ©rification : prendre en compte le paramÃ¨tre Vite dans lâ€™URL du module React pour le contrÃ´le avant dÃ©marrage ; tenir compte du compteur dans le nom accessible Bonus ; attendre les donnÃ©es gÃ©ographiques avant la comparaison ciblÃ©e de carte. Ces ajustements concernent les nouvelles recettes de test, pas les parcours produit.

### Gate final

`npm run verify:local` : **24/24 Ã©tapes, exit 0, `notRun: []`, `sourceUnchanged: true`**. Types, lint, unitÃ©s, build/intÃ©gritÃ©, SQL isolÃ©, 115 scÃ©narios navigateur (62 + 22 + 3 + 28) et 12 smokes compilÃ©s ont rÃ©ussi. La recette PWA a contrÃ´lÃ© 40 dispositions, les nouveaux PNG servis et prÃ©sents en cache, les critÃ¨res dâ€™installabilitÃ© Chrome, quatre langues et lâ€™Ã©dition/reprise hors ligne. La recette de mise Ã  jour conserve les carnets et le cache dans Chrome et WebKit.

- [validation.json](validation.json), [journal complet](gate.log), [rÃ©sultats PWA compilÃ©e](pwa-validation.json).
- Empreinte source finale : `7338324340c992d0edb8d8ecbc157a7ee34091bd9cad6ed1eaa447b0cbae9d62` (code/configuration/tests/assets visibles par Git, hors documents Markdown et fichiers ignorÃ©s).
- Build testÃ© : `abbb44e337c88388e0684098ea13a43300bf869c0c816de488a5db6dc53ead04`.
- Sorties originales : `C:/Users/eliot/AppData/Local/Temp/detours-verify-005Dk3`.
- PGlite utilisÃ© : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`, hors dÃ©pÃ´t.

Le gate Chromium rÃ©ussi ne supprime pas les trois Ã©checs historiques constatÃ©s sÃ©parÃ©ment dans le profil WebKit iPhone : leur reproduction avant/aprÃ¨s est conservÃ©e ci-dessus. Aucune validation physique dâ€™iPhone ou de service distant nâ€™est dÃ©duite de ce rÃ©sultat.

## Limites et actions humaines

- Les popups de sÃ©lection sont des contrÃ´les natifs. Leur fond et leurs options prennent la surface lin dans Chrome testÃ© ; la ligne active peut conserver la couleur systÃ¨me, bleue sur Windows. Lâ€™aspect du sÃ©lecteur systÃ¨me iOS/Android reste Ã  contrÃ´ler physiquement.
- Le test de zoom CSS=2 sur `html` Ã  640Ã—1000 rÃ©vÃ¨le un dÃ©calage du grand formulaire dâ€™import hors viewport. Le problÃ¨me a aussi Ã©tÃ© reproduit avec la feuille originale sauvegardÃ©e ([preuve](preexisting-css-zoom.json)). Les prÃ©fÃ©rences passent Ã  200 % ; les formulaires passent aux six dimensions sans ce zoom. Aucun zoom utilisateur nâ€™a Ã©tÃ© dÃ©sactivÃ© ; cette mission ne prÃ©tend pas corriger ou valider tous les formulaires Ã  200 %.
- Le manifeste PWA est statique : son fond de lancement est dÃ©sormais lin, mÃªme si le thÃ¨me sombre est prÃ©fÃ©rÃ© dans lâ€™application. Les couleurs dynamiques HTML/React restent correctes. Une icÃ´ne dÃ©jÃ  Ã©pinglÃ©e sur un appareil peut rester mise en cache jusquâ€™Ã  actualisation par le systÃ¨me ou rÃ©installation ; ne pas supprimer une PWA contenant des donnÃ©es sans sauvegarder les carnets.
- Pas de preuve sur appareil physique, OAuth rÃ©el ou services distants. La recette PWA compilÃ©e contrÃ´le les PNG, ressources et cache hors ligne ; lâ€™installation effective par lâ€™OS demeure une action humaine.

## Retour arriÃ¨re sÃ©lectif et reprise

Utiliser le snapshot initial comme rÃ©fÃ©rence et `changes.json` / le diff de contribution pour identifier les 14 modifications et six ajouts. Avant toute restauration dans le dÃ©pÃ´t principal, refaire une copie de son Ã©tat courant et comparer les Ã©ventuelles modifications ultÃ©rieures. Ne pas recopier tout le snapshot ni faire un reset global pour annuler seulement la palette.

Le contrÃ´le `git apply --reverse --check --ignore-space-change docs/development/palette-claire/contribution.patch` a rÃ©ussi sans mutation. [Diff binaire de cette contribution](contribution.patch). Les icÃ´nes historiques et la montagne restent rÃ©cupÃ©rables dans le snapshot. Restaurer Ã©galement `index.html`, `i18n.tsx` et le manifeste si lâ€™on revient Ã  lâ€™ancienne palette, pour que le dÃ©marrage reste cohÃ©rent.

Le fichier [REPRISE.md](REPRISE.md) donne lâ€™Ã©tat final, les limites et la commande de reprise. Le build du gate utilise une configuration factice : **ne pas publier son `dist/`**.
