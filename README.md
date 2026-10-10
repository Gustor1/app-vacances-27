# Détours — Mes voyages

Pour travailler à plusieurs avec Codex ou Claude Code : [guide de collaboration](docs/development/COLLABORATION.md). La base partagée actuelle est `codex/carnets-universels` ; les instructions communes sont dans `AGENTS.md` et chargées par `CLAUDE.md`.

Plusieurs carnets, avec l’expérience de l’application À l’Est d’origine. Un week-end, une ville, un circuit ou plusieurs pays : ouvrir un voyage pour retrouver son planning, sa carte, ses bonus et ses outils. React, TypeScript, Vite et Leaflet. Le mode local fonctionne sans compte ; la bêta Supabase permet Google, synchronisation et carnet commun avec droits par membre.

L’interface est disponible en français, anglais, chinois simplifié et espagnol dans **Préférences**. La langue est mémorisée sur l’appareil, s’applique aux dates et à l’impression, et reste disponible hors ligne. Les notes, noms de lieux, documents et autres contenus personnels conservent leur langue. Le changement de nom conserve les clés de sauvegarde historiques pour retrouver les carnets existants.

## Démarrer

Node.js 22.18+ et npm. Vérifié avec Node 24 sous Windows.

```sh
npm ci
npm run dev
npm run verify:local
npm run test:e2e
npm run build
npm run test:production
node scripts/smoke-ui.mjs
npm run preview -- --port 4173
```

Les tests navigateur utilisent Chrome installé sous Windows, ou `/usr/bin/chromium` sous Linux. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet de préciser un autre exécutable. Le serveur de développement des tests tourne sur le port 5173. Le contrôle de production démarre automatiquement un serveur temporaire à partir de `dist` ; `PRODUCTION_TEST_URL` permet de tester une autre URL avec `DETOURS_ALLOW_NETWORK=1`, sans la simulation locale de mise à jour du worker ; la version ciblée doit exposer le manifeste L3.

## Utiliser les carnets

- **Mes voyages** : créer, ouvrir, modifier le titre, les destinations, la couverture, la devise et le fuseau ; dupliquer ou importer. Le bouton portant le nom du voyage dans la barre latérale ramène à la collection. Sur téléphone, ouvrir le menu.
- **Carnet vierge** : aucun contenu Chine n’est ajouté. Créer une première ville, région ou base de séjour, puis ses journées et activités. Dates et coordonnées sont facultatives.
- **Exemple Chine** : proposé explicitement ; 7 étapes, 17 journées et 130 bonus, les noms chinois, phrases et documents d’origine. Le carnet déjà présent dans le navigateur est migré automatiquement.
- **Expérience préservée** : planning, vue d’ensemble, carte, envies et bonus, transports, carnet pratique, outils sur place ; favoris, visites effectuées, réservations, notes, adresses personnelles, hébergements, budget, valise et copie de texte.
- **Reprise** : les sélections sont rattachées au carnet. Un onglet garde aussi sa position de lecture, sans déplacer celle d’un autre onglet. Aujourd’hui respecte les fuseaux du voyage et de ses étapes.
- **Documents** : joindre un fichier texte ou Markdown de moins de 500 Ko, le lire et le télécharger depuis le carnet pratique. Il est conservé dans la sauvegarde et reste disponible hors ligne. La lecture automatique de PDF, Word ou scans et leur conversion en activités ne sont pas incluses.
- **Interface** : français, anglais, chinois simplifié et espagnol, apparences claire, sombre et automatique, navigation mobile, clavier et mouvement réduit. Les textes personnels restent dans leur langue.

## Bêta du plan d’action

- **Statuts et pays** : idée, préparation, en cours, terminé, annulé ; pays sélectionnés explicitement, dates facultatives et filtres sur l’accueil. La fin d’un voyage peut proposer sa clôture, sans changer son statut automatiquement. Les anciens carnets ne reçoivent aucun pays inventé.
- **Mon monde** : contours locaux sans tuiles externes, liste accessible, recherche, trois palettes, séjours confirmés, anciens séjours avec année/date facultative et pays qui donnent envie. Les visites ont leurs propres identités : copie/import d’un carnet et simple appartenance à un voyage partagé ne créent aucun séjour. Export et restauration des souvenirs sont séparés des exports de carnets.
- **Google Maps** : voir un lieu, y aller à pied/en voiture/en transports et rejoindre la prochaine étape. Le départ actuel est laissé à Google. Le choix Amap des carnets existants et les adresses copiables sont préservés.
- **Repartir ici** : nouvelle préparation à partir des bonnes adresses, sans anciennes dépenses, dates, réservations, hébergements, trajets ni coches de valise.
- **Suppression** : les visites restent intactes ; une copie de récupération est téléchargeable depuis l’accueil. Réimporter crée un nouveau carnet.
- **Comptes et collaboration** : Google/Supabase configurés sur la bêta, copies locales rattachables, caches isolés, file persistante, liens privés expirants et accès lecteur/éditeur. Tous ouvrent la même interface du voyage. Partage complet des notes, documents, réservations et dépenses, options par catégorie et par membre, emails visibles entre membres autorisés. Synchronisation et résolution des différences accessibles depuis le voyage, avec conservation des deux sources. Les anciens partages gardent leur périmètre jusqu’à activation explicite du carnet commun.

Le public initial est une bêta entre amis ; la structure des comptes et les droits ne reposent pas sur une liste d’amis intégrée. Les plafonds par compte et les requêtes par résumés préparent une ouverture ultérieure. Votes, tâches et commentaires restent à réaliser après validation des fonctions partagées. La suppression complète d’un compte et les exigences d’exploitation publique figurent dans le guide, sans être annoncées comme livrées.

Lire [configuration, droits, limites et reprise](docs/sync/CONFIGURATION.md), et [suivi des lots](PLAN-ACTION.md). Pour contrôler les vrais droits, utiliser deux comptes Supabase distincts avec `node scripts/test-supabase.mjs` ; les variables requises sont documentées. Un contrôle PostgreSQL isolé est également disponible via `scripts/test-sql-local.mjs` avec PGlite installé hors dépôt ; il ne valide pas Google ou PostgREST.

## Sauvegarde, migration et import

En mode local, les données restent dans ce navigateur et sur cette adresse du site. Un compte configuré conserve un cache isolé sur cet appareil et synchronise les carnets choisis. Un autre profil, port local ou domaine ne peut pas les lire. Pour tester une nouvelle URL avec les données de production, exporter depuis l’ancien site puis importer le fichier dans la nouvelle version.

Un export **voyage** est une enveloppe JSON `version: 2, scope: "trip"`. Un export **collection** est `version: 2, scope: "collection"`. L’import reconnaît aussi les anciens exports v1. Il ajoute des copies indépendantes, avec les dates, réservations, montants, coches et relations ; il ne remplace pas un carnet existant. Le parcours classique Importer un fichier est limité à 5 Mo ; les exports v2 peuvent dépasser cette taille et le parcours Restaurer mes données accepte jusqu’à 64 Mo. Si une collection ne tient pas dans le stockage, le nombre de carnets déjà ajoutés est signalé.

Depuis **Mes voyages → Télécharger ma sauvegarde complète**, le fichier v3 inclut les carnets téléchargés de l’espace ouvert, leurs documents embarqués, les souvenirs et leurs liens, la langue/apparence et la devise personnelle. Les sources brutes de récupération sont conservées séparément dans le fichier. Les sessions, jetons, droits serveur, files de synchronisation, caches réseau, carnets distants non téléchargés et ressources externes sont exclus. Les exports historiques de carnets et de souvenirs restent disponibles.

**Restaurer mes données** affiche un bilan avant toute écriture. La restauration crée des carnets privés dans l’espace local de cet appareil, avec un mapping des identités de voyage et des souvenirs. Elle conserve les carnets existants, fusionne les souvenirs et garde les préférences déjà présentes. Depuis un compte connecté, se déconnecter ensuite pour retrouver les carnets restaurés; aucun rattachement serveur automatique n’est effectué. Un export v1/v2 ne contient que les carnets annoncés par son format.

Ce parcours de restauration accepte aussi les anciens fichiers v1/v2 dans sa limite de 64 Mo, y compris une ancienne collection exportée au-delà de 5 Mo. Le parcours **Importer un fichier** qui ajoute des copies garde sa limite historique de 5 Mo. Les fichiers anciens n’ont pas les contrôles d’intégrité segmentés du format v3.

Le fichier complet est limité à **64 000 000 octets UTF-8 réellement produits**, 100 carnets et 1 000 sources. Les segments et le manifeste sont contrôlés par SHA-256; un carnet seul ou une collection peuvent dépasser les 5 Mo historiques. Le quota du navigateur reste indépendant : l’espace supplémentaire estimé est indiqué avant application, puis les écritures sont relues. Les opérations ne sont pas atomiques; une interruption peut laisser certains éléments déjà visibles. Le journal compact ne duplique pas les documents. Après fermeture, choisir **Reprendre la restauration** et sélectionner le même fichier original : les identités restent stables et aucun doublon n’est ajouté. Une modification concurrente bloque la reprise pour éviter son écrasement; conserver le fichier et les éléments déjà présents. Une sauvegarde déjà restaurée ici n’est pas appliquée à nouveau.

Conserver le fichier sur un autre appareil ou support. Les sources brutes restaurées sont téléchargeables depuis l’accueil et ne remplacent jamais une clé active. Voir [le contrat, les validations et le retour arrière L0–L1](docs/development/L0-L1.md). Contrôle compilé hors ligne : `node scripts/smoke-backup.mjs` après le build, dans des profils Chrome jetables.

L2 est terminé localement : erreurs Compte lisibles sur mobile, onglets de l’accueil avec panneaux et navigation clavier, dates civiles localisées. Voir [les preuves et limites de L2](docs/development/L2.md), notamment le contrôle de reflow équivalent à 200 % et les sessions simulées.

Une copie précédente est conservée par voyage avant les modifications. En cas d’erreur ou de manque de place, l’état à l’écran reste exportable. Une source illisible reste téléchargeable ; elle n’est pas remplacée par un carnet vide. L’accueil signale les entrées illisibles à côté des carnets valides.

La migration garde les anciennes clés, une copie brute du carnet et de l’ancienne récupération. Ces sources sont téléchargeables depuis Mes voyages. Le carnet Chine migré reçoit une identité stable et n’est pas dupliqué à chaque rechargement. Si un ancien onglet continue à écrire, un avertissement propose de récupérer sa source pour la comparer à la nouvelle version.

Les écritures par carnet utilisent Web Locks lorsque disponible et une fusion à trois voies. Des modifications indépendantes sont conservées ; sur un même champ modifié en concurrence, la dernière action prévaut. Les formulaires gardent leur brouillon et conservent les champs modifiés ailleurs lorsqu’ils n’ont pas été édités localement. Exporter avant une fermeture forcée ou un effacement du navigateur.

Voir [le détail de la transition et du retour arrière](docs/transition/TRANSITION.md). Le code de référence est le commit `9858aaa`. Revenir à cet ancien code ne convertit pas les changements v2 en v1 : conserver les nouveaux exports et ne pas supprimer leurs clés.

## Devises, fuseaux et cartes

Chaque voyage a sa devise de référence. À la création, le pays sélectionné propose une devise modifiable ; plusieurs pays ou une destination ambiguë demandent un choix explicite. Les dépenses gardent leur montant et leur devise d’origine. Un taux indique **1 unité de la devise d’origine = taux × devise de référence**. Chaque conversion conserve sa source et sa date : taux manuel ou proposition [Frankfurter](https://frankfurter.dev/). Les anciens taux sans date sont identifiés comme tels. Actualiser un taux ne recalcule pas les dépenses déjà converties ; enregistrer les réglages convertit uniquement celles qui n’ont pas encore de taux. Sans taux, le total est explicitement partiel. Changer la référence conserve les originaux, le budget dans sa devise et les conversions précédentes. Les conversions manquantes vers la nouvelle référence peuvent être complétées par un taux disponible ou renseignées manuellement ; revenir à une ancienne référence retrouve ses taux figés. Les arrondis suivent les décimales de chaque devise.

Les collaborateurs disposent de **Quitter ce voyage**, avec confirmation. Le départ supprime uniquement leur participation ; le carnet commun et les contributions synchronisées restent disponibles aux autres. Les invitations précédemment acceptées sont invalidées et une nouvelle invitation permet de revenir. Le créateur possède une ligne distincte ; chaque autre membre a son propre choix Lecteur/Éditeur, contrôlé à chaque écriture serveur.

L’onglet Budget contient un **convertisseur connecté** : montant, devises, inversion, derniers taux gratuits de Frankfurter et date de la source. **Mon pays / Ma devise** propose puis mémorise la devise personnelle sur cet appareil, séparément par compte. Le total **Dans ma devise** suit automatiquement les dépenses d’origine et les derniers taux, tandis que le total enregistré du voyage conserve ses conversions historiques. Les nouvelles dépenses sont converties automatiquement ; sans taux, leur montant reste conservé et le total est signalé comme partiel. Les lecteurs peuvent utiliser le convertisseur sans modifier le carnet. Les taux publics conservés restent utilisables hors ligne et les requêtes sont regroupées et mises en cache. `node scripts/smoke-converter-live.mjs` vérifie l’accès à la véritable API depuis Chrome ; les scénarios déterministes sont dans `tests/e2e/live-converter.spec.ts`.

**Bêta mise à jour le 7 octobre 2026 :** la migration `20261007140143_leave_trip_and_money.sql` et la nouvelle interface sont publiées sur [la bêta stable](https://app-vacances-27-beta-eliottle.vercel.app/). Le convertisseur et les dépenses en CNY/EUR ont été vérifiés dans Chrome sur le site publié, avec les vrais taux gratuits datés. Les droits de participation et les conversions ont également été contrôlés dans Supabase, avec toutes les données de test annulées. Voir [les règles et preuves de validation](docs/sync/PARTICIPATION-BUDGET.md).

Les transports ont des heures locales et des fuseaux distincts au départ et à l’arrivée. Les changements d’heure sont pris en compte ; une heure locale inexistante ou répétée est signalée. Les horaires Chine existants restent en `Asia/Shanghai`, avec les mêmes valeurs.

La carte cadre les repères du carnet et se replie sur une vue mondiale si les coordonnées manquent. Une étape choisit Google Maps ou Amap. Les repères sont en WGS84 ; les liens Amap utilisent les noms, adresses ou liens originaux, sans transmettre ces coordonnées comme du GCJ-02.

Les journées explicitement datées peuvent être exportées au calendrier ICS. L’impression conserve le planning complet du voyage actif. Les copies ont des identifiants distincts pour leurs événements.

## Hors ligne et ressources

Ouvrir la version compilée une fois avec Internet et attendre l’installation du service worker. Le carnet pratique permet de vérifier sa préparation. Planning, carnets locaux, documents, polices, visuels intégrés et fond géographique mondial sont disponibles hors ligne. Les rues OpenStreetMap, les couvertures distantes et les liens externes nécessitent Internet.

Le cache de production est versionné par le contenu compilé. Le contrôle `npm run test:production` vérifie une mise à jour depuis un worker précédent, le cache, la lecture et l’édition de plusieurs carnets hors ligne, les documents Chine, les préférences et l’absence de débordement mobile. Les captures sont dans `docs/transition/screenshots/`.

Après compilation, `node scripts/smoke-ui.mjs` vérifie les onglets dès l’arrivée et au rechargement, le menu Compte, les titres longs, les fenêtres et les copies de récupération à 320/390/1440 px. Avec un build Supabase configuré et `.env.local`, il simule aussi une session et un envoi refusé pour vérifier que la déconnexion conserve le cache. Il utilise des profils isolés et intercepte toutes les requêtes de la session simulée : ce contrôle ne valide pas Google ou les droits de deux comptes réels. Captures dans `docs/sync/screenshots/ui-*.png`.

Fond géographique : Natural Earth, domaine public, via `world-atlas` 1:50m. `npm run generate:map` régénère les contours intégrés. Illustrations SVG originales, polices DM Sans et Manrope servies localement via Fontsource (SIL Open Font License). Les informations du modèle Chine proviennent des documents fournis et restent à vérifier avant le voyage.

## Vérification locale et contrôles réseau

Les rappels et récaps sont développés sur `codex/rappels-recaps` : cloche personnelle par voyage, programmes Aujourd'hui/Demain, météo à la demande, checklist et export calendrier horaire. Les envois push/email sont implémentés derrière des services désactivés par défaut ; leur présence dans le code ne prouve aucune activation ou publication. Voir [contrats et exploitation](docs/development/NOTIFICATIONS.md), [preuves des lots](docs/development/NOTIFICATIONS-VALIDATION.md) et [validation calendrier](docs/development/NOTIFICATIONS-CALENDAR.md).

Le gate étendu vérifie également le SQL personnel, le service serveur simulé et les parcours récaps/calendrier. Installer Deno hors dépôt et définir `DETOURS_DENO_PATH` vers son exécutable, en plus de `DETOURS_PGLITE_PATH`. Les dépendances serveur sont verrouillées dans `supabase/functions/notifications/deno.lock`. Les tests serveur remplacent les fournisseurs et ne possèdent pas de permission réseau.

`npm run verify:local` est le gate local obligatoire. Il exécute types produit/tests/configurations, lint de correction React/TypeScript, tests unitaires, build, intégrité du manifeste, parcours navigateur retenus, SQL L6 et neuf smokes compilés (dont les contrôles L4, Maintenant L5, la préparation L6 et les invalidations/modules hors ligne L8). Il s’arrête avec un code non nul au premier échec. Le rapport JSON et les captures sont conservés dans un dossier temporaire `detours-verify-*`, annoncé au lancement. Les sorties existantes du dépôt sont préservées. Le port 5173 doit être libre ; le gate crée son serveur plutôt que réutiliser une session inconnue.

La compilation du gate utilise une URL Supabase et une clé publique **factices**, jamais les paramètres privés du projet. `dist` est donc un build de validation ; pour une publication autorisée, reconstruire avec les paramètres voulus. Le navigateur du gate bloque la résolution DNS externe, garde les serveurs loopback et les routes simulées. Le rapport lie les contrôles à l’empreinte du code/configurations/assets (documentation exclue) et à `dist/build-info.json` (identité SHA-256, fichiers, entrée, révision de base). `npm run test:build-identity` refuse un fichier compilé altéré. Le lint vérifie les règles de correction et l’ordre des Hooks ; il ne revendique pas exhaustive-deps ou les règles du React Compiler. Les tests TypeScript Playwright et les trois configurations sont inclus ; les tests `.mjs` restent vérifiés par leur exécution.

Les contrôles réseau sont séparés : `npm run test:network:supabase` et `npm run test:network:rates`. Ils exigent **DETOURS_ALLOW_NETWORK=1** ; sinon ils sortent avec le code 2, NON EXÉCUTÉ. Le contrôle bêta des taux exige également **DETOURS_EXPECTED_BUILD_ID**, issu du manifeste de la version autorisée. Aucune valeur de bundle historique n’est imposée. Le test Supabase nettoie uniquement son propre `rls-check-<UUID>` dans un `finally`, vérifie la suppression logique, les membres et invitations ; l’historique retenu n’est pas physiquement purgé. Un nettoyage impossible produit un échec avec cet identifiant et conserve l’erreur du scénario. Voir [configuration](docs/sync/CONFIGURATION.md).

Résultats actuels locaux et limites : [L0–L1](docs/development/L0-L1.md), [L2](docs/development/L2.md), [L3](docs/development/L3.md). Les nombres des publications plus anciennes ci-dessous sont historiques.

## Développement et livraison

`src/journeys.ts` gère les enveloppes, migration, import et duplication ; `src/hooks/useTravelState.ts` gère les écritures du carnet actif ; `src/time.ts` gère les heures locales ; `src/practical-utils.ts` les montants ; `src/components/JourneysApp.tsx` l’accueil. `src/cloud/` contient l’intégration Supabase, les capsules de compte, la projection partagée et le moteur de conflits ; `src/world.ts` les souvenirs personnels ; les migrations sont dans `supabase/migrations/`. Le modèle Chine reste dans `src/data/`, sans injection dans les carnets vierges. Les copies et imports ne suivent pas les mises à jour du catalogue Chine.

Les dictionnaires sont dans `src/locales/`, les thèmes dans `src/theme.css`. Les contrôles couvrent migration, récupération, isolation, concurrence, duplication, devises, horaires, documents et parcours conservés.

Vercel est déjà configuré pour Vite, avec `npm run build` et la sortie `dist`. La transition est livrée sur une branche de développement : **elle n’est pas publiée sur le site de production existant**. Les contenus du modèle Chine sont des ressources publiques embarquées ; les nouveaux carnets personnels du mode local ne sont pas envoyés au site. Un compte Supabase configuré envoie uniquement les données rattachées à son espace, selon les droits serveur.


## Historique de publication de la bêta

Le 9 octobre 2026, L4 a été clôturé après les essais PC/iPhone confirmés par l’utilisateur : hors ligne, reprise après coupure, modifications concurrentes, compte/droits et mise à jour de Safari. Publication d’essai consignée : `dpl_3tEEEHsb2JUuy6RMs96gyXHvtJTM`, manifeste `8a667d85c6861e96415baddfdf183e72baf0be43b143f504f3703267f8815816`. Voir [la matrice L4](docs/development/L4-TERRAIN.md) pour les preuves et leurs limites. L5 a été accepté par l’utilisateur après les corrections cartographiques, sur retour qualitatif sans temps avant/après fourni. Cette validation était celle du prototype ; L5 est désormais publié avec L6/L8, comme consigné ci-dessous.

Dans le prototype L5, « Voir Maintenant » ouvre la journée du fuseau de l’étape, ou une journée/date choisie. On y retrouve hébergement, prochaine activité non faite, réservation confirmée et note du jour. « À montrer » affiche le nom local et l’adresse saisis en grands caractères avec copie du texte. Une journée sans date demande une sélection manuelle. [Périmètre et comparaison d’usage L5](docs/development/L5.md).

La bêta publiée propose « Mon compte et mes sauvegardes → Préférences → Application de cartes préférée » : Google Maps par défaut, Amap au choix. Ce réglage personnel s’applique aux liens des lieux, hôtels, bonus, transports, carte et impression du carnet. Il remplace le choix par ville dans l’interface, sans réécrire les anciennes archives ni le carnet partagé. Il est mémorisé par compte et par navigateur sur cet appareil, ou localement sans compte ; il n’est pas synchronisé entre appareils. Un échec de sauvegarde est affiché et le choix reste actif pour la session. Publication autorisée et effectuée le 9 octobre 2026.

Publication historique consignée le **8 octobre 2026** : `dpl_3Vp7ocGasajpahFrGJ5xXkzpkxhP`, état READY dans le rapport, barre compacte et animation GlassSelection. Les preuves datées sont dans `docs/transition/deployment-glass-bubble-20261008.json` et les rapports précédents. [Alias de la bêta](https://app-vacances-27-beta-eliottle.vercel.app/). L0–L3 sont des travaux locaux ultérieurs ; ce texte ne prouve pas leur publication ni l’état actuel du site.

Les comptes Google, les liens privés et les accès lecteur/éditeur sont actifs. Les carnets restent privés avant invitation. **Partager** est disponible dans le voyage et prépare les envois ; les collaborateurs consultent le même carnet selon leurs droits. Voir [le parcours amis](docs/sync/CONFIGURATION.md) et [le carnet commun](docs/sync/SHARED-EXPERIENCE.md).

Validation historique du carnet commun, le 7 octobre 2026 : 55 tests unitaires, compilation, smoke UI et production/hors ligne, carnet commun avec deux profils/session/API simulés, et 27 contrôles historiques plus le scénario commun dans PostgreSQL local et Supabase, sous le rôle authentifié, transactions annulées. Les deux comptes Google réels ont été vérifiés sur la version précédente ; aucune nouvelle connexion OAuth ou vérification physique multi-appareils n’est revendiquée sur cette version. Aucun jeton réel extrait. La couverture physique téléphone/ordinateur reste à compléter avant ouverture générale.

Après compilation, `node scripts/smoke-sharing.mjs` vérifie création et acceptation sans rechargement, liens lisibles sur mobile, affichage des membres, promotion/rétrogradation et révocation dans des profils jetables avec toutes les requêtes Supabase interceptées.

La préparation L6 est disponible dans la bêta publiée : activité principale, durées/trajets saisis, marge et alternatives pluie/fatigue réversibles. [Preuves et essais L6](docs/development/L6.md). La migration SQL a été appliquée avant le frontend le 9 octobre 2026. Pour le contrôle SQL obligatoire du gate, installer @electric-sql/pglite hors dépôt et définir DETOURS_PGLITE_PATH vers son dossier dist avant npm run verify:local.

L8 mesure les petits et grands carnets sur le même PC et conserve cinq répétitions et leur médiane. `npm run measure:local -- dist chemin/rapport.json` utilise des profils jetables, un réseau/CPU ralentis et des couvertures fictives locales ; aucune écriture dans un carnet réel. Les ressources externes sont bloquées et le cache hors ligne est vérifié séparément. [Protocole, résultats et procédure de livraison L8](docs/development/L8.md).

`node scripts/prepare-l8-release.mjs dossier-externe rapport-validation.json` prépare un candidat avec la configuration locale de Vite seulement si le gate complet a réussi et si l’empreinte du code est identique. Il ne publie rien. Le dossier doit être nouveau et extérieur au checkout ; le rapport distingue le build de validation factice du candidat. La migration L6 a précédé cette publication ; un retour arrière du frontend conserve cette migration et ne restaure pas automatiquement les données.

## Bêta publiée le 9 octobre 2026 — L5, L6 et L8

[Ouvrir la bêta stable](https://app-vacances-27-beta-eliottle.vercel.app/). Maintenant, préparation des journées, préférence Google Maps/Amap et optimisations mesurées sont publiés. Version servie, 21 fichiers et worker vérifiés ; parcours hors ligne et conservation des réservations/dépenses réussis sur un carnet fictif. Migration L6 et permissions vérifiées dans Supabase avec transactions annulées. L7 reste reportée. [Identité du build, preuves, limites et retour arrière](docs/development/L8.md).
