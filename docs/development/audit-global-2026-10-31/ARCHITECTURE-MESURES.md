# Architecture et mesures du 31 octobre 2026

Référence : `6e319457ec9f20fe5720979640e950b7a4c0dccc`. Inspection source et mesures de fichiers sous Windows. Aucun changement produit, aucun benchmark réseau ou charge distante. Les tailles sont des octets sur disque, pas des transferts HTTP compressés ni une mesure de latence. Le build de référence et les contrôles sont consignés par le coordinateur dans `VALIDATION.md`.

## Responsabilités observées

| Module / interface | Implémentation et dépendances | Appréciation source |
|---|---|---|
| Composition de l’application | `src/main.tsx:3–15` compose Locale, Cloud, Install, MapPreferences et MascotPreferences ; `scope` remonte les préférences lors d’une bascule de compte | Localité explicite des préférences ; conserver cette remise à zéro |
| Collection et navigation | `src/components/JourneysApp.tsx:35–55` lit collection et récupérations ; `:99–175` orchestre création, import, partage, identité et édition | Interface de stockage déjà présente (`TripStorage`). Ne pas ajouter un second adaptateur générique sans besoin |
| Écriture d’un carnet | `src/hooks/useTravelState.ts:34–156` lit le stockage de Cloud, fusionne les changements, verrouille et délègue à `travel-write` ; stockage et sérialisation restent hors des composants de formulaire | Ce module masque un contrat substantiel. Toute extraction doit conserver l’ordre validation / fusion / récupération / écriture / relecture |
| Écrans et données | `src/App.tsx:1–33` importe directement carte, souvenirs, assistant et outils ; seule SourceDocument est différée (`:76`) | Plusieurs fonctionnalités pèsent dans le graphe initial même avant ouverture du carnet. Il faut mesurer le gain de découpage, pas découper à la ligne de code |
| Cartographie | `src/components/TripMap.tsx:4,51–74` dépend de Leaflet et de `world-geography.json` ; empreinte géographique pour éviter de reconstruire la carte quand une note change | Optimisation ciblée existante ; pas de recommandation de réécriture |
| Extraction et planning | `JourneysApp.tsx:31–32` diffère WorldView et PlanningImport ; `vite.config.ts:18` préoptimise PDF/DOCX en développement | Préserver la stabilité du dialogue d’import pendant l’optimisation Vite |
| Mascottes | `FloatingMascot.tsx:101` diffère le lecteur ; `src/mascots/sprites.js:25–56` charge seulement l’atlas choisi ; `:80` limite à quatre les variantes colorées par atlas | Ne pas présenter tous les atlas comme des requêtes initiales automatiques. Le précache les télécharge ensuite pour le hors-ligne |
| Livraison | `scripts/build-sw.mjs:4–13,25–29` inventorie tout `dist`, précache tout, attend la fermeture des anciens clients ; `vite.config.ts:20–31` sépare React, traductions, Cloud, carte et Markdown | Chunk distinct ne signifie pas chargement différé : une dépendance statique est chargée avec l’entrée. Le coût du précache reste distinct du premier rendu |

Les effets examinés dans `FloatingMascot.tsx:94–120`, `Preferences.tsx:17–27` et `useTravelState.ts:131–156` ont des nettoyages de listeners/observers correspondants. Cette lecture ciblée ne certifie pas tous les effets du dépôt. Le cache coloré des atlas est borné ; aucune fuite mémoire confirmée n’est déduite des seules dimensions des PNG.

## Mesures de référence sur le checkout initial

Inventaire reproductible : `git ls-files -z`, `git ls-files -z --others --exclude-standard`, puis variante `--ignored`, tailles par `stat`. Échantillon capturé avant création des rapports. Aucun contenu de `.env.local` lu pour cet inventaire.

| Catégorie | Fichiers | Octets | Sens |
|---|---:|---:|---|
| Ensemble suivi | 1 614 | 140 797 327 | Arbre courant, hors historique Git |
| `docs/` suivi | 1 201 | 119 562 305 | Preuves, captures, rapports et documentation |
| `src/` suivi | 157 | 7 518 898 | Inclut 6 132 731 octets de PNG mascottes |
| `public/` suivi | 33 | 5 867 458 | Copié vers le build ; géographies principales |
| `prototypes/` suivi | 16 | 6 227 738 | Atelier séparé, hors build Vite standard |
| `scripts/` suivi | 81 | 379 961 | Génération, livraison, benchmarks et contrôles |
| `tests/` suivi | 93 | 702 420 | Fixtures et scénarios |
| `supabase/` suivi | 8 | 81 379 | Migrations historiques à conserver |
| Tous les Markdown suivis | 102 | 1 408 237 | Sous-ensemble des catégories précédentes |
| Deux plans non suivis initiaux | 2 | 57 840 | Préservés, hors référence code |
| Ensemble ignoré initial | Non totalisé | 304 511 470 | Inclut builds, dépendances, traces et configuration locale ; compter sans diffuser les contenus |
| `node_modules/` ignoré | 12 368 | 259 744 646 | Outil local, pas poids téléchargé par les utilisateurs |
| `dist/` ignoré initial | 105 | 17 613 521 | Ancien build, exclu des conclusions sur la version auditée |

Le total de fichiers ignorés est recompté dans le journal du coordinateur si des fichiers de test apparaissent pendant l’audit ; les octets ci-dessus sont le relevé initial. `git count-objects -v` relève 139 008 Kio d’objets libres, 567 Kio de pack et 11 537 Kio de huit objets temporaires signalés garbage. Ces valeurs ne donnent pas la taille complète de `.git`, et ne justifient aucune purge automatique. L’historique se mesure séparément de l’arbre courant.

Les trois atlas de production font chacun 1536 × 1024 pixels. Une surface RGBA correspond à 6 291 456 octets par atlas ; ce calcul ne mesure pas la mémoire totale effective du navigateur. Les variantes, images décodées, tableaux pixels et surfaces canvas ont des durées de vie distinctes. Une mesure mémoire sur téléphone reste nécessaire avant de proposer un atlas plus petit.

## Constats et propositions bornées

**ARCH-01, coût inutile confirmé par le graphe source ; priorité P2 pour l’optimisation hors-ligne.** `public/asia-geography.json` pèse 1 002 221 octets et n’a aucun consommateur trouvé dans `src/`, tests, configurations et scripts, sauf sa génération à `scripts/generate-geography.mjs:9`. Les deux cartes lisent `world-geography.json`. Vite copie les fichiers publics et `build-sw.mjs` précache tous les fichiers. Ce fichier ajoute donc environ 0,96 Mio bruts au build standard et à sa préparation hors-ligne. La compression HTTP et les requêtes effectives restent à mesurer. Proposition : après vérification du manifeste de build, retirer seulement cette sortie et son écriture de génération ; préserver `world-geography.json`. Critère de sortie : nouvelle identité de build, baisse d’exactement ces octets bruts, ouverture hors-ligne des deux cartes et du premier écran Mon monde conservée. Aucun retrait effectué.

**ARCH-02, différence de packaging confirmée ; décision, pas bug de production présumé.** Le README lie `/mascotte/`, mais `npm run build` et `vercel.json` ne recopient pas l’atelier. `docs/development/demo-progression-20261025/RAPPORT.md:28–33` décrit une préparation distante additionnelle avec copie de `prototypes/mascot-lab/` vers `public/mascotte/`. Le build local standard ne peut pas servir cette route. Ne pas conclure que le site actuellement publié a perdu cette route. Proposition : choisir explicitement si la prochaine livraison inclut encore l’atelier, puis rendre sa préparation reproductible et documenter la différence. Conserver le prototype d’ici cet arbitrage.

**ARCH-03, hypothèse de performance à mesurer.** Le graphe d’import statique depuis JourneysApp vers App charge de nombreux écrans avant usage. Mesurer une collection vide, un carnet riche et l’ouverture carte sur build de production ; capturer les requêtes et temps avec même appareil/profil. Seulement ensuite décider si différer App ou TripMap réduit le coût initial sans casser les modules hors-ligne ni l’ouverture sur carnet mémorisé. Aucun défaut de latence n’est affirmé sans ces mesures.

**DOC-01, documentation de prototype vieillie.** `prototypes/mascot-lab/README.md:39–51` décrit encore une intégration future, tandis que les imports et `FloatingMascot` prouvent son intégration dans les carnets. Proposition P3 : dater ce texte comme historique et pointer vers `docs/development/mascottes-integrees/RAPPORT.md`, conserver le mode d’emploi de l’atelier. Ne pas supprimer le raisonnement historique.

## Mesures qui restent à exécuter

Aucune latence démarrage/navigation, trace CPU, gros carnet, import volumineux, rendu carte, FPS mascotte ou coût de synchronisation n’a été mesurée dans cette lecture. Aucune charge du backend partagé n’a été lancée. Les versions réellement verrouillées et vulnérabilités sont du volet sécurité du coordinateur ; aucune dépendance n’est déclarée inutile sur la seule absence d’import direct.

Le protocole recommandé compare même SHA, build fictif local, profils jetables et fixtures publiées : accueil vide, exemple Chine, collection de 100 carnets dans les bornes, import maximal accepté, souvenir réencodé et trois mascottes séparées. Consigner CPU, mémoire, viewport, réseau/throttling et cinq répétitions avant toute médiane. Une mesure Node de parsing n’est pas une mesure du temps de correction humain.

## Skills lus et application

| Skill | Règle appliquée | Preuve / limite |
|---|---|---|
| vercel-react-best-practices + règles bundle-conditional/client-event-listeners | Distinguer import statique, import différé et abonnement nettoyé | Source ci-dessus ; aucune recette Next.js/RSC appliquée à Vite |
| codebase-design | Évaluer profondeur/localité de l’interface plutôt que taille du fichier | Contrat TripStorage / travel-write conservé ; pas d’extraction prescrite sans besoin |
| safe-refactor | Définir comportement et mêmes preuves avant/après | Ligne de nettoyage avec critères de préservation ; aucun refactoring exécuté |
| writing-guidelines | Règles officielles récupérées au 31/10 ; exactitude, hiérarchie, limites | [Source officielle](https://raw.githubusercontent.com/vercel-labs/writing-guidelines/main/command.md) ; revue ciblée du README prototype, pas revue exhaustive des 102 Markdown |
| writing-for-agents | Source canonique et critères de sortie vérifiables | Propositions bornées, index documentaire proposé dans NETTOYAGE-PROPOSE |


## Build actuel mesuré après le gate

Le coordinateur a terminé le build et son contrôle d’intégrité dans `C:/Users/eliot/detours-audit-20261031/checkout/dist`. Lecture seule de ce dossier pendant cette étape ; le build fictif n’est pas une version à publier.

| Mesure | Valeur |
|---|---|
| `baseRevision` du manifeste | `6e319457ec9f20fe5720979640e950b7a4c0dccc` |
| Identité du build | `ee91233738a522d1062fe667865b2a7b97578324e9c810c7256ebfd12d29c035` |
| Assets listés dans `build-info.json` | 103 fichiers, 17 590 561 octets |
| Total `dist`, manifeste de build et worker compris | 17 612 817 octets |
| JavaScript d’entrée `/assets/index-DfleedOQ.js` | 632 021 octets bruts, 191 135 octets gzip calculés localement |
| Huit assets `/assets/` référencés par le HTML initial | 1 608 567 octets bruts, 468 795 octets gzip calculés localement |
| Géographie mondiale | 3 938 398 octets |
| Atlas mascottes réunis | 6 132 731 octets |
| Worker PDF | 1 264 342 octets |
| Module PDF | 573 788 octets |
| Géographie Asie inutilisée | 1 002 221 octets ; présence confirmée dans manifeste ET `sw.js` |

Ces sommes gzip ne sont pas des mesures de transfert : le serveur peut choisir Brotli, gzip, aucun encodage ou une autre compression. Les huit assets HTML ne couvrent ni imports transitifs, ni images demandées, ni préparation du service worker ; ce n’est pas le poids total de l’accueil. Le HTML précharge notamment le chunk carte, cohérent avec son import statique. La préparation hors-ligne est une autre phase : le worker précache les 103 fichiers, dont les trois atlas, les deux géographies et les modules PDF différés.

Le build ne contient aucun chemin `/mascotte/`. Le manifeste publié consulté en lecture par le coordinateur conserve cette route et un SHA différent (`578e1b1`) ; les deux versions doivent rester distinctes. Le constat ARCH-02 porte sur la reproductibilité du packaging local standard, pas sur une panne du site publié. ARCH-01 est confirmé par le build actuel : retrait ciblé de la géographie Asie donnerait 1 002 221 octets bruts de moins dans les ressources précachées, hors variations mineures du manifeste et du worker.
