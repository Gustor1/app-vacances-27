# Périmètre et preuves — audit du 2 novembre 2026

Audit de l’état local, pas de la bêta distante. Les états rendus ont été examinés par deux évaluations indépendantes et revus lors de la synthèse. Les tests automatiques utilisent des profils jetables et des données fictives. Aucune connexion utilisateur réelle.

## Interface réellement vue

| Surface | États observés | Preuves principales | Limite |
|---|---|---|---|
| Accueil | vierge, exemple Chine, collection, filtres, titre long | assessment-a/01,02,22 (PNG) | pas de collection personnelle |
| Création | carnet vierge, ville, journée, activité | assessment-a/22–26 | données fictives uniquement |
| Planning | Chine et carnet vierge, 1440/390/320 | assessment-a/04,19,23,28 | toutes les journées non relues une par une |
| Maintenant | voyage sans dates | assessment-a/16 | cas datés couverts par tests dédiés |
| Vue d’ensemble | étapes et entrée souvenirs | assessment-a/06 | médias et impression couverts automatiquement |
| Carte | contours locaux, indisponibilité des tuiles, noms des marqueurs | assessment-a/07, assessment-b/NOTES.md | disponibilité des fournisseurs distants non auditée |
| Envies et bonus | contenu public du modèle Chine | assessment-a/17 | catalogue personnel absent |
| Transports | état vide | assessment-a/18 | parcours saisis couverts par tests existants |
| Carnet pratique | documents/réservations vides, contrôle hors ligne en dev | assessment-a/08,10 | le dev ne prouve pas le cache PWA |
| Outils | hébergements vides, budget, taux indisponibles | assessment-a/11–15 | taux réels non sollicités |
| Préférences | FR/EN/ES/ZH, clair/sombre ; clavier et fermeture | assessment-a/09–12, assessment-b/NOTES.md | pas toutes les combinaisons palette/écran manuellement |
| Import | entrée texte, aperçu ambigu, source et anomalies | assessment-a/03,21 | PDF/DOCX/JSON et pannes testés automatiquement |
| Assistant | dialogue, limites, recherche/action proposées | assessment-a/27 | pas d’action manuelle confirmée ; tests dédiés pour écritures |
| Mon monde | vide, 320px, terminologie export | assessment-a/29, ASSESSMENT-A.md | pays et visites fictifs dans tests |
| Sauvegardes | promesse et exclusions dans l’interface, code de restauration | assessment-a/01, assessment-b/NOTES.md | exports/restaurations exécutés automatiquement |
| Mascotte | recouvrement, focus et déplacement clavier | assessment-a/02,23,28,29, assessment-b/NOTES.md | pas de téléphone physique ni glissement tactile synthétique dans les observations |

Les numéros renvoient aux fichiers de `preuves/assessment-a/`. Chaque nom complet est conservé dans ce dossier. Les captures B ont été vues via le navigateur natif mais ne sont pas des PNG archivés ; leurs mesures et conditions sont consignées dans `preuves/assessment-b/NOTES.md`.

Complément après corpus : le cas compact Toulouse (cas 10) a été réellement rejoué dans un nouvel onglet IAB sur le serveur factice 52983, jusqu’à l’aperçu et au renseignement d’un titre fictif, sans confirmer la création. Le compteur zéro passage, le titre de première journée absorbant les trois lieux et l’unique activité du second jour ont été observés. Capture `preuves/import-compact-observe.png`, arbre `preuves/import-compact-ax.txt`. Onglet fermé ensuite. Le cas 16 et le cas 28 ont en plus fait l’objet d’une comparaison directe parser/review consignée dans `stress-review-check.json`.

## Contrôles disponibles et stratégie

Le gate est défini par `scripts/verify-local.mjs`, et son arrêt au premier échec par `scripts/verify-runner.mjs`. Son rapport original est conservé dans `preuves/gate-validation.json`. Il contient 35 étapes ; il ne représente pas toute la suite Playwright.

| Famille | Contrôle existant | Couverture / portée |
|---|---|---|
| Types | deux projets tsc | produit, tests et configurations |
| Lint | ESLint, avertissements interdits | règles de correction et Hooks configurées ; pas preuve de qualité UX |
| Unitaire | 34 fichiers `tests/*.test.mjs`, 336 tests | voyages/migrations, persistance/concurrence, archives, souvenirs, monnaies, langues, imports, préparation, assistant, isolation cloud simulée, qualité des gates |
| Build | Vite, build-sw, check-build | compilation et identité SHA-256 des ressources, pas validation distante |
| SQL gate | test-l6-sql-local | migration additive et répétable, archives, droits sous identités simulées |
| SQL supplémentaire | test-sql-local, test-collaboration-sql-local, test-participation-money-sql-local | PostgreSQL/WASM, pgcrypto, droits propriétaire/éditeur/lecteur, partage, révocation, contributions, taux ; bases en mémoire |
| Navigateur standard | 249 scénarios, 38 fichiers dans la configuration principale (39 avec la configuration d’analyse séparée) | gate + budget/devises, vieux parcours, navigation/raccourcis, animation et visibilité des carnets, autres régressions non retenues dans gate |
| Analyse simulée | configuration planning, 3 scénarios | fournisseur simulé : succès, annulation, retard et erreurs avec source conservée |
| Compilé | smokes production/backup/ui/common-sharing/L4/L5/L6/L8, imports, compagnon, souvenirs, assistant, mascotte, lieux, PWA/mises à jour/manifest/planning | vrais bundles, caches/SW et profils jetables ; API simulées |
| Suppléments compilés | smoke-notebook, smoke-palette-claire | parcours carnet/pratique et palette ; smoke-sharing est un alias du smoke-common-sharing et n’est pas répété |
| Performance | measure-l8 | 5 répétitions petits/grands carnets, CPU ×4/réseau simulé, HTTP cache et SW désactivés, ressources externes bloquées |
| Qualité reconnaissance | evaluate-planning, evaluate-planning-stress | corpus fictifs existants ; précision structurelle bornée, pas fidélité sémantique universelle |
| Impeccable | detect --json src | scan statique exécuté une fois, zéro signal ; contrastes et noms accessibles nécessitent observation séparée |

Le nombre exact de fichiers Playwright est à lire dans l’inventaire final ; les nombres de scénarios proviennent de la sortie des commandes, pas des rapports antérieurs.

## Exclusions intentionnelles

- `test:network:supabase` modifie ses propres fixtures dans le service distant : non exécuté, hors autorisation.
- `test:network:rates`, `test-wikimedia-live`, `test-wikimedia-browser`, `smoke-converter-live` : réseau et version distante non demandés. Leur disponibilité actuelle n’est pas prouvée.
- Scripts de génération (cartes, palettes, kit, icônes), publication et préparation de release : ne sont pas des contrôles supplémentaires à lancer pour cet audit et écriraient des artefacts hors périmètre.
- Benchmarks de modèles locaux/NVIDIA : outils expérimentaux distincts de l’interface livrée, téléchargement de modèles ou appels API non autorisés ; leurs tests unitaires existants sont dans les 336 tests.
- `evaluate-import-lot01.mjs` réécrit `docs/development/import-fiable-lot-01/comparison.json` et mélange des mesures historiques before/after : non lancé pour préserver ce rapport. Les corpus/parser/review sont couverts par les tests, les évaluations directes et les parcours d’import.
- Aucun OAuth réel, lecteur d’écran NVDA/VoiceOver, appareil physique, transaction réelle, service Supabase distant ni déploiement testé.

## Interprétation

Une largeur émulée n’est pas un essai tactile. Le zoom CSS utilisé par certains tests existants n’est pas un zoom navigateur réel à 200 %. Un cache compilé testé n’atteste pas les cartes de rues externes. Une réussite SQL locale n’atteste pas la configuration Supabase distante. Les scores UX et techniques sont des jugements de cet audit, pas une certification WCAG.
