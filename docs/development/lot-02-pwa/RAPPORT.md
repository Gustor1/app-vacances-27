# Lot 02 — PWA et mobile

18 octobre 2026, Asia/Shanghai. Branche `codex/lot-02-pwa-mobile`.

**État : TERMINÉ LOCALEMENT.** Aucun lot suivant commencé.

## Résultat

L’aide existante est accessible depuis **Accueil → Préférences → Installer Détours**, et reste disponible dans le carnet pratique, dans les quatre langues. Le bouton natif apparaît seulement lorsqu’un événement d’installation est reçu ; refus/échec conservent les instructions manuelles. L’état installé repose sur standalone, le drapeau Safari ou appinstalled ; un onglet ordinaire ne sait pas universellement si une autre fenêtre est déjà installée.

Les PNG 180/192/512 et maskable 512 reprennent le SVG montagne existant. Fond opaque ; dessin maskable réduit à 65 % pour rester dans la zone sûre. Apple touch icon référencée dans index.html ; PNG du manifest et SVG conservés dans le build/cache. Générateur local via Playwright déjà installé, sans nouvelle dépendance.

Le manifest garde start_url `/` et display standalone. L’identité implicite d’origine était l’URL de départ résolue à la racine ; id `/` la rend explicite, avec le même scope racine. Aucun domaine, chemin de départ ou identifiant de données changé.

La découverte d’une mise à jour ne recharge pas automatiquement. Le bouton refuse maintenant le rechargement tant qu’un formulaire/dialogue est présent, ou qu’une écriture locale est en cours/en erreur. Enregistrer/annuler volontairement puis fermer le formulaire ; l’accueil permet aussi de mettre à jour. Les formulaires toujours affichés peuvent imposer de revenir à l’accueil : garde volontairement prudente. Le worker attend la fermeture des fenêtres contrôlées par l’ancienne version avant activation et nettoyage de l’ancien cache. Une installation partielle échouée conserve le worker actif et son cache. Un rechargement manuel en ligne peut montrer la nouvelle interface avant cette activation ; fermer toutes les fenêtres Détours puis rouvrir termine la transition.

**Carnet pratique → Protéger le stockage sur cet appareil** demande la persistance uniquement sur action, vérifie d’abord persisted(), et traite refus, exception et API absente sans blocage. Aucun accord promis ; une sauvegarde reste nécessaire. Cela concerne l’origine du navigateur, pas un compte serveur.

Le bandeau de mise à jour revient à la ligne sur petit écran. Aucun masquage horizontal global, nouvelle architecture, thème, notification ou service ajouté. Safe-area et viewport-fit existants conservés. Aucun format de carnet ou droit serveur modifié.

## État initial et préservation

HEAD initial `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, branche `codex/import-fiable-lot-01`. Nombreux changements suivis/non suivis présents, dont lot 01 et cartes/PWA. README, AGENTS, guide de collaboration, consignes communes et rapport 01 lus ; aucun AGENTS imbriqué trouvé. Base partagée récupérée par fetch ; branche dédiée sur le HEAD local contenant les prérequis, sans remplacement par la base distante plus ancienne.

Copie récupérable hors dépôt : `../detours-lot02-recovery-20261018/`, avec source/, manifest.json (état Git et SHA-256), history.bundle. **532 fichiers initiaux**, empreinte `77fc888d8308268059b6b8f17f408734d52e9b4d98c90a0004b41040784ada09`. Ignorés, secrets, dist, node_modules, sessions et exports personnels exclus. Aucun reset/stash/purge ni carnet réel modifié.

[lot02-code.patch](lot02-code.patch) isole ce lot, PNG binaires compris. [changes.json](changes.json) distingue les 15 fichiers préexistants modifiés et les 10 fichiers ajoutés ; aucun fichier initial supprimé, aucun document préexistant modifié au dernier contrôle. Parseurs, corpus, formulaires et preuves du lot 01, ainsi que les fichiers cartes, identiques à la copie initiale. Les retouches partagées App/OfflineStatus/locales/verify sont isolées dans le patch.

Contribution locale sans commit mêlant les travaux antérieurs, sans push/PR, déploiement, migration distante ou fusion. Copie et patch permettent une contribution ultérieure après intégration des prérequis locaux.

## Audit et vérifications

Défauts initiaux constatés dans le code : SVG seul, absence d’icône Apple dédiée, aide enfouie dans le carnet, mise à jour sans garde, suppression immédiate de l’ancien cache après skipWaiting. Le contrôle des empreintes de ressources, les notes persistantes, les sauvegardes et les textes iPhone traduits existaient ; ils sont réutilisés.

Contrôles ciblés réellement exécutés :

- `npm run typecheck`, `npm run lint` : réussis avant gate ; six tests offline unitaires réussis.
- Chromium : iphone-glass, preferences, l2-accessibility et cinq premiers tests PWA. 19/20 au premier passage : unique échec ENOENT des traces partagées de deux lanceurs simultanés. Les quatre scénarios L2 ont ensuite repassé dans une sortie distincte. Les autres avaient passé. Le gate reprend les six tests PWA finaux, dont retour de fenêtre cartes simulée.
- WebKit simulé : header/touch, quatre langues L2, préférences mobiles 320/390, cinq scénarios PWA et retour Google/Amap. **14 scénarios distincts passent** au total des passages corrigés. Dernier passage stable : 320 px + état installé + retour cartes, **3/3**. Les variantes refus/accord/exception/API absente passent sans mutation du carnet.
- Build compilé, Chrome disque jetable : **40 configurations** de préférences/import en quatre langues ; 320/390/430 px, paysage 844×390, hauteur 390×360 avec champ focalisé, zoom CSS 200 % des préférences. Aucun débordement détecté. Les tests existants couvrent aussi vues, menus, formulaires, cartes et reflow. Ces simulations ne reproduisent pas le clavier natif ou les encoches matérielles.
- Manifest Chrome sans erreur ; critères d’installation sans erreur dans le profil disque jetable. Cela prouve l’éligibilité locale, **pas une installation système effective**. Bouton et événement installé testés avec événements synthétiques.
- PNG relus (signature/dimensions), servis et cachés ; cadrage maskable et captures d’aide inspectés visuellement. Zoom non interdit par le viewport.
- Hors ligne : note modifiée, sauvegarde confirmée, fenêtre fermée, nouveau lancement depuis l’accueil, carnet rouvert, note relue puis reconnexion sans perte. Les smokes L4 contrôlent aussi cache incomplet/corrompu et fermeture complète du processus Chrome sur profil disque.
- Mise à jour compilée Chrome **et** WebKit : formulaire ville non enregistré maintenu après découverte et tentative de rechargement ; installation partielle 503 synthétique, ancien cache conservé ; reprise réussie, activation après fermeture, données inchangées. Offline de bout en bout sous Chrome ; WebKit vérifie son cache mais exclut sa navigation offline simulée (exclusion existante du smoke ; cette session ne reproduit pas ce défaut de moteur).
- Google/Amap : fenêtre externe interceptée localement puis refermée, retour sans mutation. Aucun contrôle des résultats réels ni du retour depuis leurs apps natives.

Échecs de recette traités : profil privé in-incognito → profil disque jetable ; label du textarea incluant son texte → rôle accessible textbox ; nouvelle fenêtre revenant à l’accueil → ouverture explicite du carnet ; scénarios desktop sous viewport iPhone → sélection mobile adaptée ; serveur partagé arrêté et traces en collision → exécutions séparées. Un libellé changé pendant un passage invalidait son attente ; relance stable réussie. Le timeout mobile 320 WebKit sur élément détaché ne se reproduit pas après stabilisation des sources ; aucun composant de navigation modifié. Une capture WebKit prise pendant l’apparition de la modale semblait translucide : la capture finale attend la fin de l’animation.

### Gate final — RÉUSSI

**23/23 étapes, code 0, aucune étape omise, sourceUnchanged true.** [validation.json](validation.json), journal complet [gate.log](gate.log). **213 tests unitaires, 93 parcours navigateur sélectionnés, 12 smokes compilés réussis.** Le gate couvre types produit/tests, lint, SQL PGlite isolé, intégrité du build, sauvegarde/restauration, lot 01, vues/cartes, persistance et mises à jour PWA.

Exécution finale du 18 octobre 2026, 17:22–17:30 Asia/Shanghai. Windows, Node v24.15.0, Vite 7.3.6, Chrome installé et WebKit Playwright pour le smoke de mise à jour. PGlite hors dépôt : `../detours-test-tools/node_modules/@electric-sql/pglite/dist`.

- Build : `998126f1a4eb3d3773ce4714b5c128df5e9ce6c4baab69113bf093c3fd9118b1`.
- Empreinte code/configuration/tests/assets : `62a0a0728a59e5a1ec316bbbb312192f04ff72bce19d376414d24ad4a81c4078` (documents et fichiers ignorés exclus).
- Preuve mobile finale : [mobile-validation.json](mobile-validation.json), même build, 40 configurations, manifest/éligibilité sans erreur et quatre PNG servis/cachés. [Captures](screenshots/) issues de ce gate.
- Toutes les sauvegardes/restaurations ciblées passent ; aucune régression observée dans ce périmètre. Les données/corpus du lot 01 n’ont pas été réécrits.

Le premier gate s’était arrêté au smoke-production après les 93 parcours navigateur réussis. Sa recette recréait trop vite une fenêtre cliente de l’ancien worker, empêchant la tâche d’activation. Correction du test : attendre l’état du cache depuis le worker sans fenêtre, puis rouvrir explicitement le carnet depuis l’accueil. Le smoke ciblé a passé, puis ce second gate complet a passé. Le code produit n’a pas été modifié pour masquer cet échec. Historique conservé : [validation-first-attempt.json](validation-first-attempt.json), [gate-first-attempt.log](gate-first-attempt.log). Aucun échec restant dans le gate final.

| État | Résultat |
|---|---|
| Implémenté | Oui, lot 02 uniquement |
| Testé localement | Oui, gate complet et contrôles ciblés décrits |
| Testé avec service réel | Non ; comptes, API et cartes externes simulés |
| Testé sur appareil physique | NON EXÉCUTÉ |
| Installation système effective | NON EXÉCUTÉE ; éligibilité et événements testés localement |
| Publié | Non, aucun déploiement/push/migration distante |

La suite exhaustive test:e2e n’est pas exécutée ; les sélections décrites et le gate requis le sont. Aucun contrôle OAuth réel. Le dist final du gate utilise une configuration factice : **ne pas le publier**. Une publication future exige une configuration cible et une autorisation distinctes.

## Démonstration et recette physique

Démo : build → Préférences → Installer Détours, aide iPhone, changement de langue, Escape. Préparer un carnet fictif → Carnet pratique → Vérifier → éventuellement protéger le stockage. Télécharger une sauvegarde complète, passer hors ligne, modifier une note, attendre la confirmation, fermer/rouvrir et ouvrir le carnet. En présence d’une mise à jour, un formulaire non enregistré reste ouvert et le rechargement est différé.

**iPhone/Safari physique : NON EXÉCUTÉ.** Aucun appareil accessible. Recette humaine restante sur une cible HTTPS autorisée contenant ce code (publier est une opération distincte) :

1. Safari : exporter la sauvegarde complète vers Fichiers et garder une copie sur un autre support.
2. Menu de la page → Partager → Sur l’écran d’accueil → activer Ouvrir comme app web si proposé → Ajouter.
3. Ouvrir depuis l’icône, contrôler nom/cadrage et affichage application. Si le carnet manque, restaurer la sauvegarde ; l’installation ne promet pas de transfert automatique.
4. Carnet pratique → Vérifier ; seules les ressources locales doivent être annoncées disponibles.
5. Mode avion : modifier une note, attendre l’enregistrement, fermer complètement, rouvrir depuis l’icône et retrouver la note.
6. Exporter/réimporter un carnet fictif ; vérifier sa copie et ses notes sans remplacer la source.
7. Portrait/paysage, zoom 200 %, clavier ouvert, encoche et barre basse ; faire défiler préférences/modales jusqu’à leur dernière action.
8. Reconnecter, ouvrir Google puis Amap, revenir et retrouver le carnet.
9. Mise à jour pendant un formulaire : saisie intacte. Enregistrer/annuler, fermer, mettre à jour ; fermer les autres fenêtres puis rouvrir pour finir la transition du worker.

## Reproduire et retour arrière

`node scripts/generate-pwa-icons.mjs` régénère les quatre PNG à partir du SVG. Puis :

```powershell
npm run typecheck
node --test tests/offline.test.mjs
npx playwright test tests/e2e/pwa-lot02.spec.ts tests/e2e/iphone-glass.spec.ts tests/e2e/preferences.spec.ts tests/e2e/l2-accessibility.spec.ts
npx playwright test --config playwright.webkit.config.ts tests/e2e/pwa-lot02.spec.ts tests/e2e/iphone-glass.spec.ts tests/e2e/l2-accessibility.spec.ts tests/e2e/preferences.spec.ts --grep 'storage persistence|installation offer|maps external|mobile navigation|header fills|real touch|accueil'
$env:DETOURS_PGLITE_PATH = (Resolve-Path ../detours-test-tools/node_modules/@electric-sql/pglite/dist).Path
npm run verify:local
```

Commandes navigateur séquentielles ; le gate gère son propre serveur 5173. Smokes compilés rejouables après build : smoke-pwa-mobile, smoke-app-update, smoke-l4-offline, smoke-l4-persistence, smoke-backup. Profils/sorties jetables pour préserver les preuves.

Retour arrière ciblé : vérifier l’état local puis `git apply --reverse --check --ignore-space-change docs/development/lot-02-pwa/lot02-code.patch` (réussi), puis appliquer l’inverse uniquement si aucune contribution ultérieure n’a modifié ces lignes. Cela retire le code/assets du lot ; garder rapport, sauvegardes et données navigateur. Aucun reset global/effacement de stockage. La copie initiale permet la comparaison si le patch ne s’applique plus.

## Sources vérifiées

Consultées pendant la session ; aucun service externe ou bibliothèque ajouté :

- [Apple — transformer un site en app Safari](https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios) : libellés et ordre Sur l’écran d’accueil → Ouvrir comme app web → Ajouter.
- [WebKit — stockage](https://webkit.org/blog/14403/updates-to-storage-policy/) : persisted()/persist(), heuristiques du navigateur et absence de garantie de sauvegarde.
- [WebKit — applications écran d’accueil](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) : manifest standalone et identité ; aucun push implémenté.
- [W3C — manifest](https://www.w3.org/TR/appmanifest/#id-member) : identité implicite issue du start_url et id préservant cette identité.

## État final et reprise

Le lot 02 est terminé localement. Aucun processus de gate, navigateur de test ou serveur de développement lancé par cette mission n’est laissé actif ; aucun serveur utilisateur n’a été arrêté. Les preuves finales sont copiées depuis `C:/Users/eliot/AppData/Local/Temp/detours-verify-X6ff8m`. Les profils temporaires contiennent uniquement des données fictives.

Le code reste non commité sur `codex/lot-02-pwa-mobile`, avec les travaux préexistants conservés. Avant toute reprise, lire ce rapport, `changes.json` et l’état Git ; ne pas confondre ce lot avec le lot 01 déjà présent sans commit. Le patch inverse est vérifié et la copie initiale reste disponible hors dépôt.

**Prochaine action humaine : recette physique iPhone/Safari ci-dessus, sur une cible autorisée contenant ce code.** Aucune action d’implémentation du lot 02 ne reste. Ne pas commencer le lot 03 sans nouvelle instruction. Si un échec physique est observé, noter appareil/version/étapes précises puis corriger uniquement ce défaut, avec vérifications adaptées.
