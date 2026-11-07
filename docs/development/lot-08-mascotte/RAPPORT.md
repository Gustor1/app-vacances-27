# Lot 08 — Mascotte discrète

État du 23 octobre 2026 (Asia/Shanghai) : **lot 08 implémenté, recette ciblée réussie ; gate global en échec sur un défaut intermittent du lot 07 reproduit avant mission**. Toutes les étapes demandées ont finalement été exécutées. Branche `codex/lot-08-mascotte`. **Ne pas commencer le lot 09.**

## Préservation et périmètre

Départ sur `codex/lot-07-assistant`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, nombreux travaux locaux des lots précédents. Lecture d’AGENTS, README, collaboration, consignes communes, lot 08 et rapport 07 ; vérification du code des trois états existants. Fetch de la base partagée, sans changement de base qui perdrait les prérequis locaux. Aucun reset, purge ou stash.

Snapshot externe avant toute édition : `C:/Users/eliot/Documents/detours-lot08-recovery-20261023`, **1 328 fichiers**, `source/`, manifeste SHA-256 et bundle Git vérifié. Empreinte du manifeste : `54637f836f27ac6353ae3c07d7e0d467429d070aa2dd213418b82181cfe18d11`. Les secrets/fichiers ignorés sont exclus.

Les changements de cette mission doivent être comparés au snapshot, et non à HEAD qui précède plusieurs lots. Fichiers existants intentionnellement modifiés : `README.md`, `src/main.tsx`, `src/locale-utils.ts`, `src/components/Preferences.tsx`, `src/components/JourneysApp.tsx`, `src/components/PlanningImport.tsx`, `src/components/OfflineStatus.tsx`, `scripts/verify-local.mjs`. Nouveaux fichiers : modèle/préférence/composant/CSS/traductions, trois SVG, licence, tests et smoke de la mascotte, preuves de ce dossier. Aucun backend, migration ou format de carnet modifié.

Contrôle final `preservation.json` : **1 320 des 1 328 fichiers initiaux strictement identiques**, huit modifications prévues, aucun fichier manquant ni changement/ajout inattendu. Sept PNG historiques régénérés par le gate sont archivés dans `regenerated/` puis restaurés exactement depuis le snapshot ; empreintes dans `restored-evidence.json`. `changes.json` recense la contribution. `lot08.patch` a passé le contrôle inverse à blanc (`patch-check.json`). Commande de préservation : `node scripts/mascot-preservation.mjs ../detours-lot08-recovery-20261023 --restore-evidence` ; une première invocation sans chemin explicite a échoué avant écriture, puis cette commande a réussi.

## Comportement

- Bienvenue : collection réellement vide, sans problème de lecture, divergence ni récupération. Le premier affichage est mémorisé dans l’espace personnel ; pas de nouvel accueil à chaque ouverture. Le conseil reste affiché pendant son premier montage. Une création/importation/déconnexion remonte les composants selon le comportement existant.
- Attention douce : uniquement lorsque `reviewPassages` signale au moins un passage dans l’aperçu d’import. Le conseil disparaît une fois les passages traités ; il ne modifie ni source ni proposition.
- Prêt : uniquement lorsque le contrôle `OfflineStatus` existant confirme la copie persistée correspondant à l’état affiché, sans sauvegarde/erreur en cours, et les ressources du cache correspondant à la version ouverte. Modification du carnet ou contrôle négatif retire l’état. Aucun nouveau certificat de voyage ou de réservation.
- Préférence `detours-mascot-v1` validée, versionnée, relue après écriture, isolée via `TripStorage.physicalKey` par compte/local. Hors carnets, file de synchronisation et exports/sauvegarde. Changement immédiat, événements entre onglets, fournisseur remonté avec `key=scope`. En cas de stockage indisponible, choix conservé pour la session et message visible dans Préférences ; le prochain chargement ne peut garantir sa conservation.
- Trois images décoratives (`alt=""`, `aria-hidden`), texte adjacent FR/EN/ZH/ES ; aucun contrôle porté par le dessin. Pas de bulle flottante, son, animation, notification ou sollicitation. Le mouvement réduit ne demande aucune variante animée.

## Assets et poids

Petite hirondelle originale avec sacoche, ailes courbes, trois poses. Sources SVG éditables `src/assets/mascot/`. Provenance et licence MIT : `public/licenses/mascot.md`. Aucune image récupérée, dépendance ou service de génération. Nom de travail « Détour », disponibilité de marque non vérifiée. Les icônes et `BrandMark` restent identiques.

Les SVG sont intégrés au bundle par `?inline`, API vérifiée dans les types de Vite installé et la [documentation officielle Vite](https://vite.dev/guide/assets.html#explicit-inline-handling). Aucun fetch d’image nécessaire ni nouveau fichier image conditionnant l’installation du worker. Un échec de décodage retire l’image et conserve tout le texte. L’architecture de cache existante est conservée.

Mesure `size.json` : **2 534 octets pour les trois SVG** (812 + 851 + 871). Somme des fichiers du manifeste de build, mêmes versions/configuration factice : 11 402 943 octets avant, 11 414 105 après, soit **11 162 octets ajoutés** (environ 11,2 Ko décimaux). Cette différence inclut code, CSS, traductions, images incorporées et licence ; objectif de moins de 150 000 octets atteint. `sw.js` et le manifeste lui-même sont exclus des deux sommes de façon identique.

Captures comparables **avant** prises sur le `dist/` du lot 07 avant reconstruction : `before/`, manifeste et poids conservés. Captures **après** avec les mêmes données fictives, viewport 390 × 950 et thèmes clair/sombre : `compiled/`, puis preuves finales `gate/mascot-compiled/`. Les dates de contrôle diffèrent nécessairement entre les deux exécutions. Les captures supplémentaires `*-320.png`, `*-390.png`, `*-1440.png` montrent chaque état à ces largeurs. `screenshots/` conserve aussi l’aperçu dans les quatre langues et les deux thèmes. Inspection visuelle de l’accueil sombre/clair, de la relecture FR claire/ZH sombre et du panneau hors ligne sombre : texte lisible, mascotte intégrée au flux et actions ordinaires conservées.

## Vérifications exécutées

Contrôles ciblés : `node --test tests/mascot.test.mjs` **3/3** ; `npm run typecheck` et `npm run lint` réussis ; `npx playwright test tests/e2e/mascot.spec.ts` **7/7**, rejoués sur le code final dans la continuation ci-dessous. Build et smoke compilé réussis. Lint explicite des nouveaux `.mjs` avec `no-undef`/`no-unused-vars` réussi. Baseline compilée et six captures avant réussies. Aucun contrôle physique, service réel ou publication.

Contrôles ciblés après `?inline` : types réussis, 7/7 scénarios navigateur, build réussi, smoke compilé réussi après correction d’un débordement à 200 % de l’accueil (rangée flex sans repli à très faible largeur disponible). Le texte du conseil est aussi isolé des marges héritées de l’état vide. Le smoke couvre les trois états aux trois largeurs, les deux thèmes, zoom 200 %, décodage réel des data URLs, reload hors ligne, préférence persistante, carnet intact au changement de préférence, retrait de « prêt » sur révision/cache incomplet. Revue Web Interface Guidelines : images décoratives, dimensions fixes, textes accessibles, checkbox native/clavier, choix immédiat, pas d’animation ni position flottante. Contrôles d’arbre d’accessibilité, pas de lecteur d’écran physique/externe lancé.

Incidents d’outillage corrigés : l’assertion Playwright `toMatchAriaSnapshot` exige le runner de test ; dans le smoke autonome elle est remplacée par `ariaSnapshot` + comparaison. Le premier générateur de patch réécrivait aussi ses propres chaînes de préfixes ; seules les lignes d’en-tête du diff sont maintenant normalisées. Contrôle inverse réussi sans application.

Premier gate **en échec**, sorties `C:/Users/eliot/AppData/Local/Temp/detours-verify-LxCXez`, journal `failed-gate/verify-local.log`, rapport `failed-gate/validation.json`, trace/captures `failed-gate/assistant/`. Types, lint, 325 tests unitaires, build/intégrité, SQL, séries navigateur 93 + 34 + 3 + 28 et premiers smokes compilés réussis. Assistant : 13/14 ; le scénario `revision arriving during pending lock` observe une action acceptée au lieu du message de révision attendu. Sept dernières étapes non exécutées. Aucun succès global revendiqué pour cette exécution.

Diagnostic : la reprise ciblée du scénario sans changement de source donne **2 succès et 1 échec** (`assistant-diagnostic.log`). Sur la **source sauvegardée avant toute modification du lot 08**, les cinq premiers essais passent, puis une série de quinze essais donne **14 succès et le même échec** (`assistant-baseline-diagnostic.log`, `assistant-baseline-extended.log`, trace/captures dans `failed-gate/baseline/`). Cela établit l’existence du défaut avant la mission, sans prétendre en avoir corrigé la cause interne. Les SHA-256 du hook, du contrat d’écriture, du moteur, du composant et du test du lot 07 sont identiques avant/après (`assistant-preexisting.json`). Une jonction `node_modules` ignorée a été ajoutée dans la copie externe pour réutiliser les mêmes dépendances ; les octets des fichiers sauvegardés restent conservés. Aucun test supprimé, attente augmentée ou code du lot 07 modifié.

Les **sept étapes omises par cet arrêt ont ensuite toutes réussi**, avec les mêmes scripts/configuration factice, profils jetables, build et empreinte de sources : assistant compilé, mascotte navigateur (7/7), mascotte compilée, lieux compilés, PWA mobile (40 mises en page), mise à jour Chrome/WebKit et import compilé avec export/restauration. `remaining-validation.json` et `remaining-checks.log` gardent cette continuation ; elle **n’efface pas l’échec du gate**. Le contrôle WebKit de mise à jour exclut son émulation hors ligne, limite Playwright déjà documentée.

Bilan `validation-summary.json` : **31 étapes réussies sur 32, une étape en échec préexistant, aucune étape restant non exécutée après continuation**. **325/325 tests unitaires**, **178/179 scénarios navigateur** (l’échec du lot 07 ci-dessus), **18/18 contrôles compilés**. Recette du lot 08 : 3 tests unitaires + 7 scénarios navigateur + smoke compilé réussis. Tous les tests ont utilisé des données fictives et des services simulés ; l’avertissement Vite sur les gros chunks reste informatif.

- Gate initial : 23 octobre, **20:21–20:36 Asia/Shanghai**, code 1, `gate/validation.json`.
- Continuation : **20:44–20:47**, code 0, `remaining-validation.json`.
- **`sourceUnchanged=true`** pour les deux exécutions ; empreinte `bb019c9bff0c8c2f254896c34822ffb710e10d4391d841d7c85020558b6d2ed8`.
- Build `887128f78468f88214e958f6251a558518fa6e2b67ad41a1b5c97c7d88724338`, `gate/build-info.json`. Sources Git visibles hors docs/Markdown/ignorés pour l’empreinte ; tous les assets compilés dans l’identité de build.
- Node v24.15.0, Vite 7.3.6, Windows, Chrome installé/Playwright, WebKit pour les contrôles existants. PGlite externe `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.

Aucune régression propre à la mascotte connue après ces contrôles. Le gate complet **n’est pas déclaré réussi**. Le défaut de concurrence préexistant reste non corrigé dans ce lot, conformément au périmètre demandé.

## Démonstration et retour arrière ciblé

1. Dans un profil de navigateur jetable, ouvrir la collection vide : conseil du premier carnet visible. Recharger : pas de répétition de cet accueil. Les boutons ordinaires restent présents.
2. **Créer depuis un planning** : coller `# Escale`, puis `Ville: Albi`, `Jour 1`, `- Musée rouge` et `Un passage encore incompris.` sur des lignes distinctes ; choisir **Reconnaître mon programme**. La relecture porte le conseil attention. Déplier le passage, puis **Conserver comme note** : le conseil disparaît quand il ne reste plus de passage.
3. Dans **Préférences → Afficher la mascotte**, désactiver au clavier/espace : disparition immédiate, conservée après recharge. Réactiver rend les conseils contextuels disponibles ; ne réinitialise pas l’accueil déjà vu. Un autre compte utilise son propre réglage.
4. Avec un carnet fictif sauvegardé dans le build compilé, **Menu → Mon carnet pratique → Vérifier** : « prêt » apparaît seulement après contrôle réussi. Recharger hors ligne après préparation du cache. Les liens externes/cartes de rues restent annoncés comme nécessitant Internet.

Retrait : exporter ses carnets par précaution et vérifier d’abord `git apply --reverse --check --ignore-space-change docs/development/lot-08-mascotte/lot08.patch`. Ce patch compare les seuls fichiers de la mission au snapshot pré-mission et inclut les nouveaux fichiers de code/assets/licence ; il ne retire pas les preuves du rapport. Appliquer à l’envers seulement si le contrôle réussit et que les fichiers n’ont pas évolué depuis ; sinon retirer manuellement la contribution en utilisant `changes.json` et le snapshot. Aucun reset global. La clé de préférence personnelle peut rester : l’ancien code l’ignore, aucune migration inverse nécessaire, aucun carnet modifié par la mascotte.

## Limites et actions humaines restantes

Validation locale avec données fictives et services simulés. Aucun modèle IA ajouté, aucune recette OAuth/compte réel, aucun appareil physique ou lecteur NVDA/VoiceOver effectivement utilisé, aucune publication. L’arbre d’accessibilité et les interactions clavier sont contrôlés par Chrome ; une recette humaine avec lecteur d’écran et sur téléphone physique reste utile avant publication. Pour cette recette : parcourir les trois états, vérifier que le lecteur lit le conseil une fois sans nom d’image supplémentaire, tabuler jusqu’aux actions ordinaires et modifier la checkbox ; recharger pour vérifier le choix.

Le build du gate est factice. Une éventuelle publication doit être demandée séparément, reconstruite avec la configuration cible et suivre L8. Les prérequis locaux des lots antérieurs ne sont pas tous committés : ne pas publier une branche partielle qui les omet. **Ne pas commencer le lot 09.**

## État final et prochaine action pour une autre IA

| État | Résultat |
| --- | --- |
| Implémenté | Oui : trois états, préférence personnelle, assets originaux, quatre langues. |
| Testé localement | Recette du lot 08 réussie ; gate global en échec sur le défaut préexistant décrit ci-dessus, sept étapes restantes réussies séparément. |
| Testé avec service réel | Non ; aucun service ajouté ou nécessaire à la mascotte. |
| Testé sur appareil physique | Non ; clavier/arbre d’accessibilité et viewports simulés seulement. |
| Publié | Non ; aucun commit/push/fusion/déploiement/migration distante/achat. |

Tous les processus de vérification sont terminés ; aucun serveur de la mission ne reste sur 5173. Les changements restent locaux sur la branche dédiée, avec snapshot externe, patch inverse vérifié et preuves conservées.

Pour reprendre : commencer par `git status` et lire `validation-summary.json`, `assistant-preexisting.json`, `preservation.json`, `patch-check.json` et ce rapport. **Ne pas refaire l’implémentation de la mascotte ni lancer le lot 09.** Aucune action de code supplémentaire requise identifiée pour le lot 08. Avant une livraison exigeant un gate entièrement vert, traiter séparément la course du lot 07 : reproduire `npx playwright test tests/e2e/assistant.spec.ts --grep 'revision arriving' --repeat-each 15` avec la configuration de test factice, étudier la lecture de révision après libération du Web Lock entre onglets, puis rejouer le gate complet après correction autorisée. Les traces des deux versions permettent ce diagnostic sans carnet personnel. La cause interne précise n’est pas établie par cette mission ; ne pas transformer le constat d’intermittence en succès ni en garantie de conservation de toute révision concurrente.
