# Compteur de voyage — livraison locale du 3 novembre 2026

## Comportement livré

Sur Mes voyages, une carte compacte reprend le thème existant : compte à rebours, jour du séjour avec progression calendaire et oiseau statique, puis invitation aux souvenirs. Chaque carnet conserve un badge et un rappel discret ouvre le parcours adapté dans le carnet. Les actions ouvrent Mon planning, Maintenant ou Vue d’ensemble (qui contient les souvenirs). Aucun programme local n’est inventé : Maintenant résout les journées et fuseaux des étapes.

Le choix automatique respecte les filtres et privilégie un séjour en cours (départ le plus récent), puis le prochain départ, puis la fin prévue la plus récente. Les égalités sont résolues par identifiant. Les carnets partagés exigent une participation confirmée. Le choix manuel est limité à la mémoire React de l’accueil, réinitialisé au changement de compte, de filtres ou de liste éligible ; rien n’est synchronisé ou ajouté aux exports. Plusieurs voyages terminés sans date restent sélectionnables manuellement sans ordre temporel inventé.

## Dates et statuts

- Dates civiles validées, fuseau général du voyage, repli UTC explicite ; aucune différence entre minuits locaux.
- Durée inclusive : du 15 au 17 = trois jours ; le retour appartient encore au séjour. Le lendemain est à J+1 de la fin prévue.
- Retour absent : Jour X sans total ni ligne de progression. Départ absent : Dates à préciser. Dates incorrectes : Dates à vérifier.
- Annulé : aucun décompte actif ni mise en avant. Terminé : statut explicite prioritaire, même avec des dates futures ou absentes.
- Dates passées : fin *prévue*, sans affirmation de retour réel. Aucun statut n’est modifié.
- Horloge par surface, contrôle à la minute quand visible, actualisation au focus et au retour de visibilité, nettoyage au démontage. Pas d’intervalle par carte.
- FR, EN, ZH-CN et ES ; dates localisées, singuliers, texte accessible complet, aucun aria-live répétitif. Aucun mouvement ajouté.

## Fichiers du lot

Nouveaux : `src/trip-timing.ts`, `src/hooks/useTripClock.ts`, `src/components/TripTiming.tsx`, `src/components/TripTiming.css`, `src/locales/trip-timing.ts`, `tests/trip-timing.test.mjs`, `tests/e2e/trip-timing.spec.ts`, ce dossier.

Intégrations dans des fichiers déjà modifiés avant ce lot : `src/components/JourneysApp.tsx`, `src/App.tsx`, `src/locale-utils.ts`. Leur diff Git comprend aussi le travail antérieur : ne pas les restaurer ou les commiter en bloc sans revue. Le contrôle de fin passée existant utilise désormais aussi UTC si le fuseau est invalide.

Branche : `codex/compteur-voyage`, créée depuis l’état courant avec ses corrections locales préservées. Base récupérée : `origin/codex/carnets-universels` à `9fa03b1`, déjà ancêtre du HEAD initial `480c0f8` (19 commits d’avance, aucun retard). Aucun commit, push, PR, déploiement ou changement distant réalisé.

## Vérification

- `node --test tests/trip-timing.test.mjs` : 5 tests réussis (frontières, séjour d’un jour, bissextile, année, DST, fuseaux près de minuit, données manquantes/invalides, statuts, sélection et participation, traductions).
- `npm run typecheck` : réussi.
- `npm run lint` : réussi.
- `DETOURS_TEST_PORT=5181 npx playwright test tests/e2e/trip-timing.spec.ts` : 3 scénarios réussis. Trois phases et navigation, choix manuel, invalidation par filtres, modification des dates et visibilité, quatre langues à 320 px en sombre sans débordement horizontal, clavier du sélecteur, ouverture hors ligne d’un carnet chargé dans la même session.
- Impeccable : contexte chargé, références new-work/init/craft-floor consultées, identité existante conservée (extension d’une surface Operate). Détecteur sur les nouveaux composants/styles : aucune alerte (`[]`). Revue des rendus desktop/mobile ; espacement mobile resserré pour limiter la hauteur avant la grille.
- `git diff --check` : réussi, seuls avertissements de conversion LF/CRLF sur deux fichiers préexistants.

Les premiers essais navigateur ont révélé un problème d’encodage introduit pendant l’édition et deux problèmes du scénario de test (ciblage exact du label ; rechargement Vite avant ouverture hors ligne d’un module chargé à la demande). Encodage corrigé, filtre ciblé directement et retour à l’accueil sans rechargement pour éprouver le carnet déjà chargé ; nouvelle exécution réussie.

## Captures

Données fictives, horloge contrôlée, Chrome local émulé. Captures rejouables par le test ciblé.

| Phase | Bureau 1280 px | Mobile 390 px |
|---|---|---|
| Avant | [Capture](captures/avant-desktop.png) | [Capture](captures/avant-mobile.png) |
| Pendant | [Capture](captures/pendant-desktop.png) | [Capture](captures/pendant-mobile.png) |
| Après | [Capture](captures/apres-desktop.png) | [Capture](captures/apres-mobile.png) |

Sombre 320 px : [FR](captures/sombre-320-fr.png), [EN](captures/sombre-320-en.png), [ZH-CN](captures/sombre-320-zh-CN.png), [ES](captures/sombre-320-es.png).

## Limites et retour arrière

Aucun test sur téléphone physique, OAuth, compte distant, révocation serveur ou changement de compte réel. L’éligibilité partagée est couverte par la logique locale ; l’invalidation du choix s’appuie sur le scope et la collection déjà filtrée par les contrats existants. Les quatre langues sont contrôlées à 320 px ; aucune matrice exhaustive de toutes les palettes, tailles et titres arbitrairement longs. Les images distantes restent soumises au comportement existant. L’actualisation au passage de minuit arrive au plus tard au contrôle suivant, dans la minute quand visible.

Pas de gate global, tests SQL, sauvegardes, synchronisation ou suites PWA complètes : ce lot ne modifie aucun contrat correspondant. Le test hors ligne ciblé ne prouve pas une installation PWA ou un rechargement hors ligne d’une version publiée. Aucun build de publication préparé.

Pour annuler : retirer uniquement les imports et intégrations TripTiming/useTripClock dans les trois fichiers partagés, retirer les nouveaux modules/tests/styles/traductions. Conserver les corrections préexistantes, le plan et les autres rapports. Aucune donnée à migrer ou restaurer.

## Publication demandée le 3 novembre 2026

À la demande explicite de publier sur la version live sans relancer les longues suites, livraison sur la bêta habituelle : https://app-vacances-27-beta-eliottle.vercel.app/.

- Déploiement Vercel : `dpl_8NJY36kLyvDStPkvzEDkVVtotSW7`, état **READY** ; URL de version : https://app-vacances-27-ntueig5tx-eliottle.vercel.app.
- Réassignation de l’alias bêta confirmée par lecture Vercel ; accès public spécifique de l’alias conservé. Les autres adresses restent inchangées.
- Build : `1d8c1bdb209b867759b33e59f687c96418e3fbef6761b81b4b96f1cbffbe9c30`. Compilation Vite réussie, service worker généré, intégrité des 115 ressources du manifeste contrôlée localement. Avertissements de taille de chunk et import statique/dynamique des sprites déjà présents, sans échec de compilation.
- Configuration : les trois paramètres publics Vite locaux correspondent exactement aux variables preview du projet. Aucune variable distante modifiée. Seuls les fichiers compilés et leur configuration statique sont envoyés, sans fichier d’environnement ou source privée.
- Les tests ciblés, types et lint de la livraison locale précédente sont réutilisés. Aucune nouvelle exécution du gate, des suites globales ou de tests authentifiés ; contrôle distant limité à l’état READY et à l’affectation de l’alias, sans nouveau test navigateur public.
- Copie récupérable du code, patch, build candidat et référence de retour arrière : `C:/Users/eliot/Documents/detours-release-20261103-compteur-1793651988724/`.
- Retour arrière : réassigner uniquement l’alias bêta à `dpl_nyPjrPj8ShMczGVCjggSKNAZt4qw` (`app-vacances-27-873i684rj-eliottle.vercel.app`). Aucune restauration de données nécessaire.
- Aucun commit, push GitHub, fusion ou changement de base distante effectué. Le déploiement inclut le compteur sur l’état local avec les corrections antérieures conservées.

Si une ancienne fenêtre garde l’ancienne interface, fermer toutes les fenêtres/onglets Détours puis rouvrir la bêta, sans effacer les données du navigateur.
