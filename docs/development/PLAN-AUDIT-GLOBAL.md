# Détours — Plan du prochain audit global

Préparé le **28 octobre 2026**. Ce document est une mission à donner à une IA lors du lancement de l’audit. **Sa rédaction ne constitue pas un audit : aucun test, scan de sécurité, nettoyage ou changement produit n’a été exécuté pour le préparer.**

## Mission à transmettre à l’IA

> Lis ce document, `AGENTS.md`, `README.md` et `docs/development/COLLABORATION.md`. Réalise l’audit global décrit ci-dessous sur la version contenant les implémentations récentes de Détours. Utilise les skills indiqués à chaque étape après avoir lu leurs instructions. Travaille de façon autonome sur l’inventaire, l’examen du code, les contrôles locaux autorisés et les rapports. Distingue les défauts reproduits, les hypothèses, les limites de validation et les propositions produit. Livre un bilan compréhensible et des lots de correction prêts à déléguer. **Arrête-toi avant de corriger le produit, supprimer des fichiers ou fonctionnalités, publier, fusionner ou modifier un service distant.**

## Objectif et périmètre

Vérifier ce qui fonctionne réellement après les différentes implémentations, comprendre les échecs restants et décider où simplifier. Le résultat attendu est une liste de décisions et de travaux justifiés, pas une nouvelle accumulation de fonctionnalités ou un simple rapport de lint.

Le cap produit est un **carnet de voyage utilisable sur place**, d’abord pour Eliot, ses proches et ses amis : transformer un planning existant en carnet éditable, retrouver facilement ses informations, voyager sur mobile et hors ligne, conserver ses données. Une éventuelle ouverture plus large est un scénario à évaluer séparément. Le SaaS pour agences et une refonte graphique générale ne sont pas des objectifs acquis.

Dans le périmètre : exigences des lots, bugs et tests intermittents, données et restauration, sécurité, import/IA, partage, PWA, UX/accessibilité, quatre langues, cartes et services externes, mascottes, souvenirs, performances, architecture, dépendances, fichiers et documentation. Les ajouts/retraits de fonctionnalités sont des **recommandations motivées**.

Hors exécution pendant l’audit : corrections produit, migrations distantes, suppression de données/fichiers, réécriture de l’historique Git, déploiement ou réaffectation Vercel, appels d’inférence payants, nouveaux abonnements et installation de skills non demandés. Les preuves locales peuvent employer des fichiers de test dans un espace jetable. Les écritures durables se limitent aux livrables de l’audit.

## 1. Établir la version de référence et protéger le travail

**Skills :** `verify-and-stop` ; `lint-and-validate` pour préparer les contrôles.

- [ ] Lire les instructions du dépôt ; relever branche, SHA, changements suivis/non suivis et état des services locaux sans afficher de secrets.
- [ ] Récupérer les références Git et comparer la base partagée `codex/carnets-universels`, la branche contenant les derniers lots et la version publiée si elle est accessible en lecture. Définir précisément le SHA audité ; ne pas mélanger les résultats de plusieurs versions.
- [ ] Préparer une branche `codex/audit-global` ou équivalente et une copie de travail récupérable. Préserver les modifications existantes, fichiers non suivis utiles et preuves historiques. Utiliser un bundle/patch et un inventaire des copies si nécessaire ; vérifier leur lisibilité. Garder les secrets hors des rapports et des copies partagées.
- [ ] Inventorier les outils disponibles : version Node/npm, navigateur, dépendances déjà présentes, PGlite externe, captures, sous-agents et capacité d’isolation sécurité. Consigner ce qui manque et continuer les étapes indépendantes.
- [ ] Créer un dossier externe de travail et de preuves ; y conserver les sorties volumineuses. Prévoir un rapport synthétique versionnable dans `docs/development/audit-global-AAAA-MM-JJ/`.

**Repère documentaire, à rafraîchir au démarrage :** ce plan a été préparé depuis `6e319457ec9f20fe5720979640e950b7a4c0dccc`, sur `codex/installation-manifeste-cache`, puis sur `codex/plan-audit-global`. Après récupération, la base partagée `9fa03b15c6dfeba7129b11df538edba1ea9d0a94` était un ancêtre, 12 commits derrière. Repartir aveuglément de cette ancienne base ferait manquer des implémentations. Vérifier la situation courante et conserver les commits récents ; aucune fusion automatique n’est demandée.

**Sortie :** `ETAT-INITIAL.md` avec SHA, branche, périmètre, sauvegarde/récupération, environnement, accès disponibles et restrictions. La version locale et la version en ligne ont des lignes distinctes.

## 2. Reconstituer les lots et leurs preuves

**Skills :** `writing-guidelines` pour la documentation ; `verify-and-stop` pour qualifier les preuves. `mattpocock-skills:code-review` seulement pour une comparaison de lot dont le point de départ et la spécification sont identifiés.

- [ ] Construire une table **intention → fichiers produit → interface accessible → tests → rapport → version publiée → état actuel** pour chaque lot et chaque évolution ultérieure.
- [ ] Lire d’abord les rapports de fin et leurs conclusions ; ouvrir les journaux détaillés pour résoudre une contradiction, un échec ou une étape manquante. Un statut « terminé » dans un plan n’est pas une preuve d’intégration.
- [ ] Distinguer les deux séries : les anciens **L0–L8** et les nouveaux **lots 01–09**, avec 03 bis, 06 bis et évolutions des mascottes. Leurs numéros ne décrivent pas les mêmes travaux.
- [ ] Classer chaque exigence : livrée et vérifiée sur ce SHA / présente mais non vérifiée / partielle / absente / expérimentation volontairement non intégrée / obsolète ou remplacée. Ajouter la preuve et la raison.
- [ ] Relever les promesses README/interface qui dépassent la preuve disponible : gratuité, hors ligne, synchronisation, sauvegarde « complète », reconnaissance IA, installation mobile, confidentialité.

### Documents d’entrée

Chemins relatifs à la racine du dépôt ; les vérifier avant de les suivre. Dans le tableau, les chemins abrégés après une première entrée `docs/development/` reprennent ce préfixe (par exemple `lot-03-documents/RAPPORT.md` signifie `docs/development/lot-03-documents/RAPPORT.md`).

| Ensemble | Documents à consulter | Question à résoudre |
|---|---|---|
| Socle historique | `ORCHESTRATION-DEVELOPPEMENT.md`, `PLAN-ACTION.md`, `docs/development/L0-L1.md`, `L2.md` à `L6.md`, `L8.md`, `docs/sync/CONFIGURATION.md`, `docs/sync/SHARED-EXPERIENCE.md` | Quels contrats ont été conservés après les nouveaux lots ? Retrouver les preuves de L7 sans inventer un fichier absent. |
| Import initial et lot 01 | `docs/development/IMPORT-PLANNING-IA.md`, `IMPORT-RECOGNITION.md`, `LOT-01-IMPORT-FIABLE.md`, `import-fiable-lot-01/RAPPORT.md`, `planning-stress-2026-10-16/RAPPORT.md` | Fidélité des imports et corrections possibles par l’utilisateur. |
| Plans des nouveaux lots | `docs/development/lots-suivants/00-LIRE-AVANT-LES-LOTS.md` et `LOT-*.md` | Exigences et critères de sortie exacts, y compris exclusions volontaires. |
| PWA, documents, kit IA | `docs/development/lot-02-pwa/RAPPORT.md`, `lot-03-documents/RAPPORT.md`, `lot-03-bis-kit-import/RAPPORT.md`, `IMPORT-IA-STRUCTURE.md` | Parcours complets depuis le fichier jusqu’au carnet et à son usage hors ligne. |
| Lieux et compagnon | `docs/development/lot-04-lieux/RAPPORT.md`, `lot-05-compagnon/RAPPORT.md` | Utilité des informations, provenance et données réellement disponibles. |
| Modèles IA | `docs/development/lot-06-modele/RAPPORT.md`, `lot-06-bis-api-nvidia/RAPPORT.md`, `lot-06-bis-api-nvidia/ESSAI-MINIMAX.md`, `lot-06-bis-api-nvidia/live-analysis.json` | Benchmarks, décisions d’intégration et coût/qualité réellement établis ; lire les mises à jour finales avant les états intermédiaires. |
| Assistant et souvenirs | `docs/development/lot-07-assistant/RAPPORT.md`, `lot-09-souvenirs/RAPPORT.md` | Droits d’écriture, annulation, vie privée, sauvegarde et récupération. |
| Mascottes | `docs/development/lot-08-mascotte/RAPPORT.md`, `lot-08-bis-prototype/RAPPORT.md`, `mascottes-integrees/RAPPORT.md`, `mascotte-limites-ecran/RAPPORT.md` | Distinguer ancien dessin, prototype et personnages réellement intégrés. |
| Dernières évolutions | `docs/development/preferences-20261026/RAPPORT.md`, `installation-manifeste-cache/RAPPORT.md`, rapports palettes/logos et `demo-progression-20261025/RAPPORT.md` | Régressions, version servie, anciennes installations et limites de publication. |
| Anciennes analyses | `docs/development/AUDIT-PRODUIT-2026-10-18.md`, autres audits retrouvés, anciens registres sécurité accessibles | Revalider les problèmes ouverts ; ne pas recopier leurs conclusions comme actuelles. |

**Lecture déjà faite pour préparer ce plan :** les rapports 06 et 06 bis décrivent des benchmarks non intégrés. Le candidat local est rejeté ; l’essai NVIDIA n’atteint pas tous les critères. Leur absence dans l’application n’est donc pas, à elle seule, une implémentation ratée. Vérifier les éventuelles évolutions depuis ces rapports.

**Sortie :** `MATRICE-LOTS.md`, exhaustive sur les lots et fonctionnalités repérés, avec liens de preuve et écarts explicites.

## 3. Établir la fiabilité des contrôles et diagnostiquer les échecs

**Skills :** `lint-and-validate`, `systematic-debugging`, `verify-and-stop`.

- [ ] Lire `package.json`, les configurations navigateur et `scripts/verify-local.mjs` avant exécution. Identifier les scripts réseau, écritures de captures et services démarrés. Employer des profils jetables et des données fictives.
- [ ] Exécuter les contrôles fonctionnels dans un environnement dédié selon `AGENTS.md`. Le guide donne Node >= 22.18 et PGlite hors dépôt via `DETOURS_PGLITE_PATH`. Préparer les dépendances selon le guide ; ne pas modifier le lockfile pour contourner un échec. Si 5173 est occupé, identifier le processus et organiser un créneau sans arrêter un service utilisateur à l’aveugle.
- [ ] Lancer `npm run verify:local` une fois sur la référence fixée lorsque les prérequis sont réunis. Il inclut les contrôles de types, lint, unitaires, build, SQL et navigateurs : éviter de les relancer tous séparément sans raison.
- [ ] À l’échec, conserver les sorties, version, étape, entrée et trace. Classer la cause : produit / test ou orchestration / environnement / inconnue. Reproduire avec un scénario minimal ; pour une intermittence, commencer par trois essais documentés avec conditions identiques, pas une boucle jusqu’au vert.
- [ ] Exécuter séparément les étapes non atteintes lorsque leurs prérequis le permettent, en les identifiant comme telles. Préserver les preuves historiques que les scripts peuvent régénérer ; archiver les nouvelles sorties avant toute restauration ciblée des anciens fichiers.
- [ ] Mesurer aussi la qualité des tests : assertions utilisateur, isolation des données/ports, horloges et fuseaux, attentes liées à un événement réel, exclusions WebKit, trous de couverture et faux positifs. Proposer un correctif de test sans l’appliquer dans cette mission.

### Échecs historiques à requalifier, pas bugs actuels présumés

| Référence historique | Question pour le nouvel audit |
|---|---|
| `lot-08-mascotte/RAPPORT.md` et `mascotte-limites-ecran/RAPPORT.md` : `tests/e2e/assistant.spec.ts:78`, révision pendant attente de verrou | Course produit, attente du test ou problème d’orchestration ? Inspecter prévisualisation, verrou et relecture de révision. |
| `mascottes-integrees/RAPPORT.md` : `scripts/smoke-planning-import.mjs:204`, carnet absent après import/rechargement | Défaut de persistance/restauration ou hypothèse incorrecte du smoke ? La cause n’était pas établie. |
| `lot-09-souvenirs/RAPPORT.md` : `planning-analysis.spec.ts:36`, fenêtre/champ absent | Comprendre le scénario ; les répétitions réussies ne suffisent pas à expliquer l’échec initial. |
| `preferences-20261026/RAPPORT.md` : gate **34/34 réussi** | Conserver cette preuve datée, sans l’étendre aux commits suivants. |
| `installation-manifeste-cache/RAPPORT.md` : gate **8 étapes réussies, 1 échouée, 26 non exécutées**, `companion.spec.ts:15` sur `page.reload` | Établir pourquoi une validation ultérieure échoue malgré les contrôles ciblés réussis. |

Les lignes peuvent avoir bougé : retrouver le nom du scénario. Aucun de ces cas n’a été rejoué pour écrire ce plan. Un cumul de réussites séparées, un retry ou un ancien gate vert ne rend pas vert le gate d’une autre version. Le build de `verify:local` utilise une configuration factice et **ne doit pas être publié**.

**Sortie :** `VALIDATION.md` avec commande, SHA, environnement, durée, résultat, preuve, cause connue/inconnue et étapes non exécutées. L’audit peut se conclure avec des tests rouges ; il doit les expliquer ou les laisser explicitement ouverts.

## 4. Examiner les données, les droits et la récupération

**Skills :** `systematic-debugging`, `supabase:supabase`, `supabase:supabase-postgres-best-practices`, volet données de `security-audit`.

Repères : `src/journeys.ts`, `src/persistence.ts`, `src/backup.ts`, `src/hooks/useTravelState.ts`, `src/travel-write.ts`, `src/cloud/`, `supabase/migrations/`. Retrouver ensuite les stockages propres aux documents, brouillons, préférences et souvenirs.

- [ ] Cartographier les données par voyage, compte, appareil et stockage. Expliquer ce qui est local, synchronisé, partagé, exporté ou exclu ; distinguer « Mon monde » et les photos/légendes quotidiennes du lot 09.
- [ ] Vérifier validation avant écriture, relecture, interruption/reprise idempotente, concurrence entre onglets, bascule de compte, déconnexion, quota, sources corrompues et récupération sans écrasement.
- [ ] Tester la chaîne complète sur données fictives : ancien format → import → modification → export → navigateur vide → restauration → comparaison du contenu et des relations. Inclure collections volumineuses, doublons, carnets partagés et changement d’identifiants.
- [ ] Vérifier séparément le paquet souvenirs : restauration du carnet puis des médias, jours absents/supprimés, données existantes conservées, quota et photo illisible. Une sauvegarde historique « complète » ne prouve pas la sauvegarde des médias du lot 09.
- [ ] Examiner les permissions propriétaire/éditeur/lecteur, droits par catégorie, invitation expirée ou révoquée, conflit, utilisateur retiré et écriture préparée avant perte de droits. Valider les refus côté serveur, pas seulement les boutons désactivés.
- [ ] Distinguer SQL/PGlite simulé et Supabase réel. Consigner les vérifications distantes nécessaires dans la recette humaine sans modifier le projet distant dans cet audit.

**Sortie :** schéma simple des flux et matrice données × stockage × droits × export/restauration ; constats référencés et scénarios de non-régression proposés.

## 5. Réaliser l’audit de sécurité défensif

**Skills :** `security-audit` comme pilote ; skills Supabase pour les particularités de la stack. Lire le workflow complet au lancement, puis les compagnons utiles : `CLIENT-SIDE.md`, `WEB-PROTOCOL-AND-AUTH.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`, `AI-AND-LLM.md`, `SUPPLY-CHAIN-AND-RELEASE.md`, `CLOUD-AND-DEPLOYMENT.md`, `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`.

Choisir le profil `standard` pour l’ensemble du dépôt ; renforcer les frontières données/import/auth avec vérification indépendante. Tenir le registre de couverture exigé par le skill. Un périmètre non inspecté reste visible comme non couvert.

- [ ] Établir les acteurs, entrées non fiables, ressources et frontières de confiance : mode local, autre membre du carnet, compte différent, document importé, fournisseur externe, contenu rendu, assistant.
- [ ] Examiner Auth/OAuth, RLS/RPC et isolation des comptes ; opérations préparées avec anciens droits ; invitation, déconnexion, caches et exports. Un identifiant connu ne doit pas donner accès à un autre carnet.
- [ ] Examiner Markdown/HTML/liens, URL externes, contenus d’import, PDF/DOCX/ZIP/images et leurs limites de taille, complexité, temps et mémoire. Vérifier les travailleurs d’extraction et annulations sans charger des fichiers hostiles sur un service réel.
- [ ] Examiner clés et configuration : secrets serveur hors frontend, logs/rapports sans jetons ni réservations personnelles, séparation paramètres publics/secrets, environnement du build, provenance des dépendances et ressources. Rapporter les chemins et types d’exposition en masquant les valeurs.
- [ ] Examiner données transmises aux API, consentement, URLs, cache, erreurs, 429, reprises et limites. Pour l’IA, couvrir provenance, instructions dans le planning, sortie invalide, outils éventuels et séparation aperçu/application. Tester seulement les intégrations effectivement présentes.
- [ ] Évaluer les avis de vulnérabilité pertinents pour les versions verrouillées : dépendance production ou développement, chemin exploitable et conditions réelles. Une alerte de scanner seule reste à trier ; aucune mise à jour automatique globale.
- [ ] Soumettre chaque candidat aux étapes de validation et revue indépendante du skill ; séparer vulnérabilité confirmée, hypothèse à valider et amélioration de durcissement.

### Conditions d’exécution propres au skill sécurité

Le skill exige une isolation imposée par le système : réseau externe coupé, environnement factice explicitement autorisé, cible/outils en lecture seule, écritures dans un `scratch/` dédié et limites CPU/mémoire/processus/disque/durée. **Un worktree, PGlite ou un profil navigateur jetable ne satisfont pas à eux seuls ces exigences.** Les preuves dynamiques de sécurité suivent ces règles, y compris la promotion contrôlée des artefacts décrite dans le skill ; les tests fonctionnels ordinaires ne sont pas rebaptisés preuves de sécurité.

Si ces contrôles sont indisponibles, continuer l’inspection source et documenter exactement les validations dynamiques bloquées. Ne pas contourner la restriction via un autre outil ou déclarer la sécurité totalement validée. Le workflow de sécurité n’installe pas de dépendances et ne sonde pas la bêta, les comptes réels, l’administration distante ou les API payantes.

Utiliser un dossier externe neuf, par exemple `C:/Users/eliot/security-audit-skill/app-vacances-27/run-<prochain-numero-libre>`. Le coordinateur seul écrit les fichiers partagés ; chaque agent dispose de son espace isolé. Produire les fichiers du skill : `run-metadata.json`, `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md` et les valider avec ses outils documentés. Le rapport général pointe vers ces livrables sans recopier de données sensibles.

**Sortie :** couverture réelle et constats vérifiés avec frontière franchie, effet, preuve, préconditions et correction minimale proposée. Seuls les constats `confirmed` reçoivent une sévérité sécurité ; les hypothèses `needs_validation` gardent le fait manquant et le protocole de vérification.

## 6. Auditer les imports, l’assistant et les informations de voyage

**Skills :** `systematic-debugging`, `verify-and-stop` ; `security-audit` pour les entrées et sorties non fiables.

Repères : `src/planning-import/`, `src/components/PlanningImport.tsx`, `public/import-kit/`, `src/assistant.ts`, `src/places/`, `src/components/MapActions.tsx`, `src/companion.ts`, `server/planning-extraction.mjs`, scripts des benchmarks 06/06 bis. Examiner séparément l’exposition/configuration du contrat serveur existant ; sa présence ne prouve ni son activation ni une intégration NVIDIA.

- [ ] Parcourir texte, Markdown, PDF texte, DOCX, JSON structuré et anciens exports dans leurs parcours respectifs. Vérifier les distinctions entre préparer un planning, importer un carnet et restaurer ses données.
- [ ] Utiliser un corpus fictif documenté : planning propre, bruité, multilingue, sans dates, plusieurs villes, alternatives, réservations ambiguës, import interrompu, document scanné et fichier trop gros. Mesurer les erreurs de rattachement, omissions, inventions et effort de correction, pas uniquement le JSON valide.
- [ ] Vérifier aperçu modifiable, texte source récupérable, annulation, brouillon, reprise et création sans écraser un carnet. Contrôler que les consignes IA téléchargeables, exemples, schéma et validateur décrivent le même format dans les quatre langues.
- [ ] Vérifier les limites honnêtes du kit IA : la structure peut être valide sans être fidèle au document original. L’utilisateur doit pouvoir relire les informations sensibles ou ambiguës.
- [ ] Pour l’assistant intégré, examiner le périmètre réel des actions, l’aperçu, la confirmation, les conflits, droits, double application et annulation. Distinguer recherche locale déterministe et véritable appel à un modèle ; ne pas annoncer un chatbot général absent.
- [ ] Pour Wikidata/Wikimedia, cartes et liens Google/Amap : vérifier choix du bon lieu, attribution/licence, adresse active, origine des images, absence de coordonnées inventées, erreurs réseau, limitations et recours hors ligne. Les notes/avis Google ne sont pas réputés disponibles parce qu’un lien Google Maps existe.
- [ ] Relire les décisions des benchmarks et proposer garder / archiver / retester sur un critère mesurable. Ne pas relancer des téléchargements de modèles ou des appels NVIDIA pour « voir » pendant cet audit.

**Sortie :** matrice format × cas × résultat, limites d’usage explicites et recommandations classées selon leur valeur réelle pour le carnet.

## 7. Parcourir l’expérience mobile, PWA et accessibilité

**Skills :** `product-design:audit`, `web-design-guidelines` ; charger le routeur et les références demandés par ces skills. Capturer les parcours du nouvel audit avec un outil navigateur disponible ; un screenshot historique n’est pas une preuve du comportement actuel.

- [ ] Tester comme un nouvel utilisateur : ouvrir l’accueil vide → comprendre l’app → créer/importer → corriger → ouvrir une journée → trouver une adresse → préparer le hors-ligne → exporter/restaurer.
- [ ] Tester comme utilisateur en voyage : ouvrir « Maintenant », retrouver hébergement et réservations, modifier le programme, choisir un bonus, utiliser la carte, se repérer sans réseau et reprendre une édition interrompue.
- [ ] Vérifier mobile 320/390/430 px, bureau, paysage bas, zoom/reflow 200 %, clavier et longues traductions. Pour chaque famille d’écran, couvrir les quatre langues ; tester clair/sombre/automatique et les palettes là où les contrastes ou illustrations varient.
- [ ] Vérifier clavier, focus visible, retours de focus des fenêtres, noms accessibles, états d’erreur, cibles tactiles, contraste et mouvement réduit. Les captures seules ne certifient pas l’accessibilité ; consigner séparément ce qui exige lecteur d’écran ou téléphone physique.
- [ ] Vérifier Pico/Mochi/Bivouac : transparence et hitbox, déplacement souris/tactile/clavier, quatre coins, barres fixes, menu dans l’écran, redimensionnement, préférence masquée/animée, changement de compte, rechargement et hors-ligne.
- [ ] Tester une mise à jour depuis un ancien service worker avec carnet et formulaire ouverts. Contrôler le manifeste réellement consommé par le navigateur, son identité et sa disponibilité hors ligne ; un GET réseau correct ne suffit pas. Conserver les caches/données utilisateur.
- [ ] Examiner si les menus, options, boutons et libellés créent une surcharge. Proposer des simplifications respectant l’identité actuelle ; illustrer les problèmes avant de proposer une refonte.

Employer des captures numérotées et vérifiées, reliées à chaque constat. La recette iPhone physique/Safari installé, clavier iOS, zone sûre et changement réseau reste distincte de l’émulation Chromium/WebKit. Pas de faux résultat « testé sur iPhone ».

**Sortie :** parcours illustrés avec étapes, état, frictions, défauts et limites ; liste courte des améliorations les plus utiles.

## 8. Mesurer performances, architecture et maintenance

**Skills :** `vercel-react-best-practices`, `mattpocock-skills:codebase-design`, `supabase:supabase-postgres-best-practices` selon les modules.

- [ ] Cartographier les responsabilités et le sens des dépendances. Chercher les invariants dispersés ou dupliqués, couplages UI/persistance, code difficile à tester et effets/listeners sans nettoyage. La taille d’un fichier seule ne justifie pas son découpage.
- [ ] Mesurer démarrage et navigation, imports volumineux, gros carnet, rendu carte, photos/souvenirs et animation des mascottes. Décrire appareil, volume des fixtures et conditions avant de comparer.
- [ ] Mesurer bundle initial, chargements différés, médias, service worker/précache et stockage local séparément. Identifier ce que l’utilisateur télécharge réellement ; le poids du dossier de développement n’est pas le poids du site.
- [ ] Examiner requêtes/index/RLS et charges de synchronisation sur environnement autorisé. Distinguer coût observé et hypothèse ; ne pas lancer de charge sur les services partagés.
- [ ] Relever versions figées, dépendances inutilisées démontrées et raisons de les conserver. Appliquer les recommandations React/Vite pertinentes, sans importer des recettes Next.js/RSC absentes du projet.
- [ ] Proposer uniquement des refactorings ou optimisations associés à un problème mesuré, avec effet attendu, coût et test de préservation.

**Sortie :** tableau avant correction des mesures et propositions ciblées. Aucun changement de stack ou réécriture générale par défaut.

## 9. Préparer le nettoyage des fichiers et des `.md`

**Skills :** `safe-refactor` pour la méthode future ; `writing-guidelines` et `mattpocock-skills:writing-for-agents` pour l’organisation des documents.

- [ ] Mesurer séparément les fichiers suivis, non suivis, ignorés, l’historique `.git`, dépendances, builds et outils/modèles externes. Produire tailles et nombres par catégorie, sans déduire « inutile » de « volumineux ».
- [ ] Classer chaque candidat : conserver / document canonique / fusionner / archiver / générable / suppression proposée / décision nécessaire. Donner le chemin exact, taille, rôle, dernière référence pertinente et propriétaire fonctionnel.
- [ ] Rechercher les usages dans imports statiques et dynamiques, scripts, tests/fixtures, CSS, `public/`, génération du worker, liens Markdown, configurations de build et routes de démo. L’absence d’un import TypeScript ne prouve pas qu’un fichier est inutilisé.
- [ ] Pour les `.md`, distinguer documentation utilisateur, consignes IA téléchargeables, contrats, plans actifs, anciennes décisions, rapports et preuves. Proposer un index et une source canonique ; garder le contexte des décisions et la traçabilité des échecs.
- [ ] Examiner particulièrement anciens prototypes, dessins de mascotte, doublons d’assets, captures/traces, ZIP de plans et scripts de benchmark. Les qualifier comme candidats seulement après recherche des usages. Vérifier la route publique `/mascotte/` et son packaging avant de proposer de retirer le prototype.
- [ ] Pour chaque suppression proposée, fournir preuve d’inutilisation, impact, taille gagnée locale/Git/site, dépendants à modifier, validation et moyen de restauration. Conserver migrations historiques, tests encore utiles, licences/attributions et compatibilité des anciens formats.

L’audit **n’exécute aucune suppression**. Archiver dans un sous-dossier ne réduit pas à lui seul le poids du dépôt, et supprimer un fichier du dernier commit ne retire pas son historique. Aucune réécriture Git ni suppression massive de `.md` n’est incluse. Les caches, snapshots externes et données personnelles restent en dehors du nettoyage proposé du produit.

**Sortie :** `NETTOYAGE-PROPOSE.md` avec une ligne par fichier ou ensemble précisément énuméré ; pas de recommandation vague du type « supprimer tous les vieux rapports ».

## 10. Arbitrer le produit et livrer les prochains travaux

**Skills :** `verify-and-stop`, `concise-planning`, `mattpocock-skills:writing-for-agents`.

- [ ] Pour chaque fonctionnalité, choisir une recommandation : **garder / simplifier / corriger / masquer ou retirer / reporter / ajouter**. Expliquer le besoin utilisateur, la preuve, le coût d’entretien et les effets sur les données et parcours existants.
- [ ] Regrouper les doublons de constats par cause racine tout en gardant leurs preuves. Distinguer défaut fonctionnel, dette technique, risque sécurité et préférence de design.
- [ ] Hiérarchiser les travaux : données et accès, blocages des parcours, fiabilité, simplicité, performances mesurées, nettoyage puis nouveautés. Ne pas confondre effort faible et priorité haute.
- [ ] Proposer au maximum cinq ajouts à forte valeur, rattachés à une friction observée. Pour chacun : alternative plus simple, fonctionnement sans API payante, mode hors ligne, données nécessaires et critère mesurable d’intérêt. Ajouter une section « à ne pas construire maintenant ».
- [ ] Préparer des lots de correction indépendants et ordonnés, avec fichiers concernés, dépendances, objectif utilisateur, exclusions, tests avant/après, risque, retour arrière et critères de sortie. Séparer corrections, nettoyage et changements produit ; ne pas les implémenter dans la foulée.
- [ ] Faire relire les conclusions et leur niveau de preuve par un regard indépendant si disponible. Vérifier que chaque domaine et chaque ancien échec a un statut, même si ce statut reste « non vérifié ».

### Priorités et fiches de constat

- **P0** : dommage critique démontré, données perdues sans récupération ou accès non autorisé grave ; traiter avant élargissement de l’usage.
- **P1** : parcours essentiel cassé, récupération incertaine ou régression bloquante.
- **P2** : gêne fréquente, complexité, performance dégradée ou maintenance coûteuse démontrée.
- **P3** : amélioration de confort ou expérimentation à faible urgence.

Chaque fiche contient : identifiant, catégorie, titre concret, SHA/version, fichiers et lignes actuelles, préconditions, étapes/entrée, attendu/observé, preuve, impact, statut de certitude, proposition minimale, contrôle de correction et limites. Les hypothèses ne reçoivent pas une priorité de bug confirmée : leur vérification peut avoir un ordre de traitement distinct. La sévérité sécurité conserve les règles de son propre registre.

### Livrables et définition de fin

Dans `docs/development/audit-global-AAAA-MM-JJ/` :

| Fichier | Contenu attendu |
|---|---|
| `RAPPORT.md` | Résumé compréhensible, ce qui fonctionne, défauts majeurs, limites, verdict pour usage personnel/proches et conditions éventuelles d’ouverture publique. |
| `ETAT-INITIAL.md` | Référence auditable, environnement, récupération, périmètre et accès. |
| `MATRICE-LOTS.md` | Couverture des intentions, implémentations, interfaces, contrôles et publication. |
| `CONSTATS.md` | Fiches démontrées et hypothèses séparées ; lien vers le rapport sécurité externe. |
| `VALIDATION.md` | Résultats exacts, étapes non exécutées, mesures, scénarios et chemins des preuves. |
| `NETTOYAGE-PROPOSE.md` | Liste vérifiable des candidats et de leurs conséquences. |
| `DECISIONS-PRODUIT.md` | Garder/simplifier/corriger/retirer/reporter/ajouter, avec choix à valider par Eliot. |
| `LOTS-CORRECTION.md` | Missions prêtes à déléguer, ordonnées et bornées, sans lancement automatique. |
| `RECETTE-HUMAINE.md` | Seulement les essais exigeant appareil physique, vrais comptes ou jugement utilisateur ; étapes et résultat attendu. |
| `REPRISE.md` | Avancement, sources inchangées ou différences expliquées, commandes terminées/en cours, prochaine étape et blocages. |

Les captures et journaux bruts restent dans le dossier externe avec un index. Ne versionner que les preuves utiles et nettoyées ; ne pas grossir le dépôt avec tous les fichiers temporaires. Le volet sécurité conserve en plus son format obligatoire décrit à l’étape 5.

L’audit est terminé lorsque chaque étape a une couverture documentée, chaque constat a une preuve ou une limite explicite, les priorités sont cohérentes et les prochaines missions sont exécutables. **Audit terminé ne signifie ni zéro bug, ni gate vert, ni validation réelle des appareils/services.** Le rapport final indique aussi l’absence de corrections et de publication pendant cette mission.

## Skills installés à charger au bon moment

Chemins contrôlés lors de la préparation du plan. Les versions de cache peuvent évoluer : rechercher le nom dans les skills disponibles si le chemin n’existe plus. Sur une autre IA/machine, signaler ce qui est disponible ; ne jamais prétendre avoir utilisé un skill inaccessible. Continuer les pans indépendants et expliquer les limites de méthode.

| Skill / chemin exact du `SKILL.md` | Étapes et usage |
|---|---|
| [security-audit](C:/Users/eliot/.codex/skills/security-audit/SKILL.md) | 4–6 : audit sécurité principal, workflow, couverture et vérification des constats. |
| [systematic-debugging](C:/Users/eliot/.codex/skills/systematic-debugging/SKILL.md) | 3, 4, 6 : causes des échecs, reproduction et intermittences. |
| [lint-and-validate](C:/Users/eliot/.codex/skills/lint-and-validate/SKILL.md) | 1, 3 : contrôles configurés, résultats et effets des scripts ; pas de `--fix` implicite. |
| [verify-and-stop](C:/Users/eliot/.codex/skills/verify-and-stop/SKILL.md) | 1–3, 6, 10 : preuve minimale suffisante, limites et arrêt avant corrections. |
| [supabase:supabase](C:/Users/eliot/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase/SKILL.md) | 4–5 : Auth, RLS, RPC et configuration ; les outils disponibles n’autorisent pas les mutations distantes. |
| [supabase:supabase-postgres-best-practices](C:/Users/eliot/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase-postgres-best-practices/SKILL.md) | 4, 8 : droits, requêtes, concurrence et performances SQL. |
| [product-design:audit](C:/Users/eliot/.codex/plugins/cache/openai-curated-remote/product-design/0.1.56/skills/audit/SKILL.md) | 7 : parcours réels, captures actuelles, frictions et accessibilité ; suivre ses références préalables. |
| [web-design-guidelines](C:/Users/eliot/.codex/skills/web-design-guidelines/SKILL.md) | 7 : UI, clavier, focus et formulaires ; consulter ses règles officielles à l’exécution. |
| [vercel-react-best-practices](C:/Users/eliot/.codex/skills/react-best-practices/SKILL.md) | 8 : React/Vite, rendu et chargement ; filtrer les règles propres à Next.js. |
| [mattpocock-skills:codebase-design](C:/Users/eliot/.codex/plugins/cache/mattpocock/mattpocock-skills/1.3.1/skills/engineering/codebase-design/SKILL.md) | 8 : responsabilités, interfaces et testabilité ; propositions sans réécriture immédiate. |
| [safe-refactor](C:/Users/eliot/.codex/skills/safe-refactor/SKILL.md) | 9 : définir un nettoyage futur avec preuves de préservation avant/après. |
| [writing-guidelines](C:/Users/eliot/.codex/skills/writing-guidelines/SKILL.md) | 2, 9 : README, aides, cohérence et docs ; consulter ses règles officielles à l’exécution. |
| [mattpocock-skills:writing-for-agents](C:/Users/eliot/.codex/plugins/cache/mattpocock/mattpocock-skills/1.3.1/skills/productivity/writing-for-agents/SKILL.md) | 9–10 : consignes IA claires, critères de fin et missions transmissibles. |
| [concise-planning](C:/Users/eliot/.codex/skills/concise-planning/SKILL.md) | 10 : transformer les constats en lots exécutables. |
| [mattpocock-skills:code-review](C:/Users/eliot/.codex/plugins/cache/mattpocock/mattpocock-skills/1.3.1/skills/engineering/code-review/SKILL.md) | Option étape 2 : revue d’un diff précis avec base et spécification identifiées ; pas un remplacement de la couverture globale. |

**Doublon identifié :** `C:/Users/eliot/.codex/skills/cloudflare-security-audit/SKILL.md` est également installé ; son contenu est identique au skill `security-audit` ci-dessus à la date du plan. Le nom du dossier ne signifie pas qu’il cible seulement Cloudflare. Utiliser une seule copie canonique.

Les skills `audit-skills` et `mcp-skill-auditing` servent à examiner des skills/extensions proposés, pas à auditer directement Détours : les mobiliser uniquement si un nouvel outil tiers entre dans le périmètre. Aucun skill de déploiement, installation ou génération de mascotte n’est requis pour cet audit.

Tenir dans le rapport une table **skill lu → étape → règle appliquée → preuve ou limite**. Citer un skill sans suivre sa méthode ne compte pas comme utilisation. La lecture des skills lors de la préparation de ce plan sert uniquement à définir la mission future.

## Organisation autonome et reprise après quota

Le coordinateur fixe la référence et les interfaces de travail, puis peut déléguer en parallèle : sécurité ; données/imports ; parcours UX/PWA ; architecture/nettoyage. Adapter le nombre d’agents aux ressources disponibles. À défaut de sous-agents, exécuter la même couverture séquentiellement et signaler l’absence de revue indépendante lorsque la méthode l’exige.

Les sous-agents lisent le même SHA et rendent leurs preuves dans des dossiers distincts. Un seul coordinateur tient les fichiers partagés. Les tests utilisant les mêmes ports, `dist/`, profils ou captures s’exécutent séquentiellement ; les règles d’isolation du volet sécurité priment pour ses exécutions.

Mettre à jour `REPRISE.md` après chaque étape : accompli, restant, SHA, fichiers de preuve, processus éventuels et prochaine action. À la reprise, vérifier l’état Git et les processus avant de continuer ; réutiliser les preuves compatibles, requalifier celles invalidées par un changement de source. Si un accès manque, avancer sur les domaines indépendants plutôt que solliciter l’utilisateur pour chaque détail.

**Dernière action : remettre le rapport et les lots proposés à Eliot, puis attendre le choix des corrections.**
