# Détours — Du planning texte au carnet prêt à emporter

12 octobre 2026 — Plan autonome d’implémentation, à transmettre à une IA de développement.

## 1. Prompt de lancement

> Lis ce document et les instructions actuelles du dépôt. Implémente les lots P0 à P6 jusqu’à obtenir un parcours intégré et vérifié : coller un programme, reconnaître sa structure, corriger un aperçu, créer un nouveau carnet et l’ouvrir dans Détours. Tu peux utiliser des sous-agents pour des tâches indépendantes, avec ownership des fichiers. Avance sans me demander de valider chaque détail réversible. Préserve le produit et les données existants. Les compétences et outils disponibles sont indiqués en section 8 : lis leurs instructions lorsque leur usage devient pertinent. Si une clé, une autorisation externe ou un service manque, termine les parties indépendantes et documente le blocage ; une simulation ne vaut pas une extraction IA réelle. Ne déploie rien et ne modifie pas la base distante sans autorisation spécifique. Termine par le rapport défini en section 9.

Ce plan remplace, pour cette contribution, la cible agences et les missions exploratoires des anciens dossiers Studio. La cible est désormais le voyageur disposant déjà d’un programme. Les anciennes recherches restent des références facultatives, pas des exigences à implémenter.

## 2. Résultat attendu et limites

Promesse : **« Tu as préparé ton voyage dans ChatGPT, Word ou tes notes ? Transforme-le en carnet Détours prêt à emporter. »**

Parcours principal : accueil → créer depuis un planning → coller du texte → lancer l’analyse → vérifier/corriger → créer un nouveau carnet → consulter planning et carte existante.

Cette contribution autorise le développement local, les tests et la préparation d’une PR selon les règles du dépôt. Elle n’autorise pas de dépenses, d’inscription fournisseur, d’envoi à des prospects, de déploiement, d’activation d’un service distant ni de migration distante.

### Inclus

- Texte collé depuis ChatGPT, Word ou des notes, y compris listes et Markdown simple.
- Extraction structurée assistée par IA, validation indépendante et aperçu éditable.
- Destinations/étapes, journées, activités, hébergements, transports, adresses et notes quand présents dans la source.
- Traitement explicite des données manquantes, suggestions et contradictions.
- Création d’un nouveau voyage via les mécanismes existants, avec sécurité de reprise et export.
- Conservation de Leaflet et de l’expérience mobile/hors ligne actuelle.
- Interface en français, anglais, chinois simplifié et espagnol ; contenu personnel conservé dans sa langue.

### Différé

Upload Word/PDF, OCR, lecture de liens de conversations privées, génération complète depuis un brief, réservation, paiement, abonnement, limites commerciales d’étapes, avis/photos Google, remplacement de carte, actualisation automatique des horaires et recherche touristique exhaustive.

Le prototype répond à « reprendre fidèlement mon programme », pas à « inventer un meilleur voyage ». Une proposition d’enrichissement ne devient pas implicitement une nouvelle exigence.

## 3. Règles produit à appliquer sans nouvelle validation générale

### Saisie et source

Proposer un champ de texte, un exemple fictif chargeable explicitement et un bouton « Analyser mon programme ». Valeur initiale : limite de 50 000 caractères, contrôlée côté client et serveur avant appel ; documenter tout ajustement justifié. Ne jamais tronquer silencieusement. Une langue de texte différente de l’interface est autorisée.

Le lancement explique si le texte sera envoyé à un fournisseur externe. Aucun appel pendant la frappe. Permettre annulation/reprise, conserver le texte lors d’une erreur et rendre les états de chargement compréhensibles. Un voyage doit toujours pouvoir être créé manuellement sans IA.

### Reconnaissance et incertitudes

Créer un schéma intermédiaire de brouillon indépendant de `StoredState`, versionné et validé à l’exécution. Il doit distinguer source, valeur extraite, information manquante, conflit, suggestion et correction de l’utilisateur. Associer les informations importantes à un extrait ou emplacement du texte pour faciliter leur vérification. Un score donné par le modèle n’est pas une preuve de fiabilité.

- « Matin » reste une période, pas 09:00 inventé.
- « Jour 1 » sans date reste une journée non datée. Proposer une date de départ facultative et n’appliquer le décalage qu’après choix explicite.
- Une réservation n’est confirmée que si la source ou l’utilisateur le dit.
- Un prix estimé n’est pas une dépense effectivement engagée.
- Une liste de bonnes adresses reste une liste de suggestions ; ne pas la transformer en visites obligatoires.
- Une alternative reste distincte du programme principal.
- Une arrivée le lendemain doit conserver le changement de date. Aucune déduction silencieuse de fuseau ou d’année ambiguë.
- Un lieu homonyme ou une adresse absente reste à préciser ; aucun point géographique inventé.
- Préserver les informations non mappables dans une section de notes relisible, en indiquant ce qui n’a pas pu être structuré.

Éviter d’afficher comme « mentionné dans le texte » une valeur ajoutée par le modèle. Tester la fidélité avec un corpus annoté ; le schéma seul ne détecte pas les hallucinations.

### Aperçu corrigible

Afficher les étapes et journées, avec cartes d’activités, suggestions et éléments à vérifier. Permettre au minimum de corriger titre, date, période/heure, catégorie, adresse et statut facultatif ; déplacer une activité, l’exclure, et corriger l’affectation à une journée/ville. Les éléments hôtel/transport ont un rendu adapté.

Afficher le texte source à la demande. L’utilisateur doit comprendre les corrections sans voir du JSON. Les absences facultatives n’empêchent pas de créer un carnet ; les erreurs structurelles ou valeurs invalides doivent être corrigées ou explicitement écartées.

Afficher un bilan avant confirmation : journées/activités importées, suggestions, éléments non structurés et informations absentes. Une nouvelle analyse ne doit pas écraser les corrections sans action explicite. Ignorer une réponse tardive correspondant à une ancienne version du texte.

### Création et reprise

Créer uniquement un nouveau voyage ; ne pas modifier ni fusionner automatiquement un carnet existant. Générer les identités côté application, pas à partir des IDs proposés par le modèle. Le carnet source éventuel et les archives existantes restent intacts.

Validation avant écriture, relecture après écriture, récupération en cas de quota ou interruption. Une double soumission ou reprise du même brouillon ne crée pas plusieurs carnets. Deux imports volontairement distincts peuvent créer deux voyages ; ne pas dédupliquer arbitrairement tous les textes identiques.

Préserver un brouillon récupérable dans l’espace personnel approprié avec une action pour l’effacer, selon les conventions du dépôt. Le texte original doit être récupérable après échec ; son stockage durable dans le carnet après succès est un choix visible de l’utilisateur. Aucun brouillon d’un compte ne doit réapparaître dans un autre compte.

Un import local ne devient pas automatiquement partagé ou synchronisé. Suivre les parcours de rattachement existants. Le carnet final doit rester utilisable, exportable et restaurable après désactivation de l’IA.

## 4. Intégration technique à vérifier dans le code

Repères inspectés pendant la rédaction, à revalider sur la branche d’implémentation :

| Zone | Vérification / réutilisation attendue |
|---|---|
| `src/components/JourneysApp.tsx` | Parcours de création/import et état de l’espace ouvert |
| `src/journeys.ts` | `blankTrip`, `parseImport`, `writeTrip`, création des identités et validation ; vérifier les signatures actuelles |
| `src/types.ts` | `StoredState`, `Step`, `Day`, `Stay`, `Transfer`, `Bonus` ; schéma intermédiaire séparé |
| `src/lib.ts`, `src/day-preparation.ts` | Validation et heures/périodes ; `Step.period` n’est pas un horaire structuré |
| `src/persistence.ts`, `src/hooks/useTravelState.ts`, `src/backup.ts` | Isolation, écriture, récupération, export/restauration |
| `src/cloud/` | Droits, espace personnel, consentement au rattachement ; aucune extension serveur implicite |
| `src/locales/`, composants de formulaires/carte | Traductions, accessibilité et rendu existant |

Limiter les extensions du modèle persistant. Une donnée importée qui ne rentre pas dans les structures courantes doit être représentée honnêtement ou conservée comme note, pas injectée dans un champ sans rapport. Si une extension est réellement indispensable : compatibilité des anciennes archives, validateurs, sauvegardes et projections à traiter ensemble. Ne pas imposer une migration distante pour le simple brouillon d’import.

### Service d’extraction IA

Inspecter d’abord les capacités serveur et fournisseurs déjà réellement configurés, sans afficher les secrets. Choisir un seul fournisseur initial via un adaptateur remplaçable ; justifier ce choix dans le rapport. Vérifier sa documentation actuelle avant intégration. Les instructions du modèle doivent demander l’extraction fidèle et une sortie structurée conforme au schéma.

Les clés privées restent côté serveur ; aucun secret `VITE_*`, stockage navigateur ou clé utilisateur demandée dans un champ. Endpoint protégé, limites d’entrée/sortie, timeout, quota et protection contre les abus. Ne pas publier un proxy LLM anonyme sans contrôle. Pour une première version, réserver l’analyse distante aux comptes authentifiés si c’est la solution la plus simple adaptée ; le reste de Détours conserve son mode local.

Traiter le programme comme donnée non fiable : il ne peut modifier les instructions, déclencher des outils, lire des secrets ou envoyer des données ailleurs. L’extraction ne nécessite pas d’agent naviguant librement sur les URL du texte. Échapper les sorties et valider les liens avec les protections existantes.

Ne pas journaliser le programme complet ou des références de réservation. Documenter traitement et conservation par le fournisseur. L’extraction échouée ne crée aucun voyage partiel. Les retries doivent être bornés et ne pas multiplier aveuglément les appels facturés.

Sans clé/service autorisé : livrer l’adaptateur, un environnement simulé clairement réservé aux tests et tout le parcours d’aperçu/import ; désactiver honnêtement l’analyse distante dans l’interface avec une explication. Le rapport marque alors **extraction réelle bloquée**, et non « fonctionnalité complète livrée ». Les appels réels doivent utiliser uniquement des textes synthétiques et une configuration d’essai autorisée.

### Carte et identification des lieux

Conserver la carte actuelle. Réutiliser les coordonnées explicites et vérifiées de la source ; l’adresse textuelle suffit pour créer une activité. Si les essais montrent qu’une recherche de lieux est nécessaire, réutiliser un service existant ou préparer un adaptateur borné, déclenché par l’utilisateur : liste de candidats puis confirmation.

L’absence d’une API géographique ne bloque pas P1 à P5. Ne pas attribuer un centre-ville comme position précise d’une activité. Wikidata est une piste d’identification culturelle à évaluer, pas un résolveur universel imposé. Tout ajout de fournisseur doit examiner coût, couverture, attribution, cache, export et hors ligne. Avis et photos restent différés.

## 5. Lots et critères de fin

| Lot | Travail | Terminé lorsque |
|---|---|---|
| P0 — Inspection et comparaison bornée | Lire le dépôt, vérifier état/branche, observer Wanderlog et un second outil sur import/correction/lieux ; préparer contrats et fixtures | Repères réels, cinq observations sourcées maximum et contrat du brouillon consignés ; aucun blocage prolongé sur accès concurrent |
| P1 — Brouillon et conversion | Schéma validé, provenance, règles d’incertitude, mapping vers le modèle Détours | Trois programmes synthétiques passent les tests ; champs absents non inventés et pertes rendues visibles |
| P2 — Extraction | Adaptateur IA, endpoint protégé si nécessaire, validation de réponse, annulation, limites et erreurs | Tests fournisseur simulé réussis ; appel réel synthétique si autorisé, sinon activation explicitement bloquée |
| P3 — Interface de revue | Saisie, progression, aperçu, corrections, bilan et gestion des réponses tardives | Parcours utilisable sur mobile et clavier dans les quatre langues ; corrections préservées |
| P4 — Création durable | Nouveau carnet, isolation, confirmation, relecture, reprise et export/restauration | Import réouvert identique ; double clic/reprise sans doublon ; panne sans perte de la source |
| P5 — Carte et parcours final | Vérifier noms/adresses, coordonnées fiables, liens et navigation ; recherche de candidats seulement si justifiée | Les lieux inconnus restent signalés ; carnet consultable sur la carte existante et hors ligne après chargement |
| P6 — Revue et livraison | Non-régression, sécurité, tests complets, documentation, rapport et PR | Contrôles exécutés et statut exact de chaque lot fourni ; prêt à review, sans déploiement implicite |

P1 précède P2/P3, qui peuvent avancer parallèlement avec interfaces fixées. P4 dépend du contrat P1 et de la revue P3. P5 et P6 intègrent le parcours complet. L’étude concurrentielle informe le développement ; elle ne doit pas absorber toute la mission. Si les concurrents exigent des accès absents, consigner la limite et continuer l’implémentation.

## 6. Vérification obligatoire

Créer des fixtures synthétiques : séjour urbain simple ; circuit multiétapes avec transport de nuit ; notes ambiguës avec suggestions, dates absentes et contradictions. Ajouter entrées malveillantes et sorties de modèle invalides. Conserver source et résultat attendu séparément.

- Fidélité : aucun statut réservé, date ou prix inventé ; pas d’options transformées en activités obligatoires.
- Schéma : JSON incorrect, champ inattendu, valeur trop longue, date impossible, coordonnées invalides, IDs/références incohérents et contenu HTML malveillant.
- Asynchronisme : timeout, annulation, retries, nouveau texte pendant analyse, réponse ancienne, double confirmation.
- Persistance : quota dépassé, interruption entre écritures, reprise, rechargement, suppression du brouillon, isolation entre deux comptes et espace local.
- Compatibilité : carnet existant inchangé ; anciennes archives acceptées ; nouveau carnet exporté/restauré avec données équivalentes.
- Usage : texte français/anglais/chinois/espagnol, mobile 320 et 390 px, clavier/focus, zoom préservé, absence de débordement masqué.
- Parcours : coller → analyser → corriger → créer → ouvrir → carte → recharger → hors ligne → exporter/restaurer, dans un environnement jetable.

Exécuter tests ciblés, typecheck/lint et `npm run verify:local` avant livraison de code, conformément au guide : PGlite hors dépôt, `DETOURS_PGLITE_PATH` configuré, port 5173 libre. Distinguer tests simulés, extraction distante réelle et essai physique téléphone. Un contrôle absent n’est pas un contrôle réussi.

Le gate remplace `dist/` par un build factice : toute publication ultérieure autorisée suit `docs/development/L8.md` avec build cible, sauvegarde et retour arrière. La publication n’est pas incluse dans cette mission.

## 7. Autonomie et reprise

Utiliser une branche dédiée basée sur `codex/carnets-universels` actualisée, après préservation de l’état local. Un checkout occupé par un autre travail justifie une isolation ; ne pas déplacer ou effacer les documents non suivis. Les trois anciens dossiers Studio présents pendant la rédaction sont à préserver.

Choix autonomes autorisés : découpage en modules, composants existants, petites dépendances justifiées, libellés, représentations du brouillon et stratégie de tests. Consigner les choix structurants sans attendre une revue de chaque détail.

À différer sans bloquer les travaux indépendants : dépenses, nouveaux comptes, accès externe absent, déploiement, migration distante, changement de cible produit, collecte de données réelles ou extension majeure du périmètre. Une absence de réponse de l’utilisateur ne vaut pas autorisation.

Si des sous-agents sont utilisés, le pilote garde le contrat de données et la création persistante ; déléguer étude, extraction ou UI avec fichiers clairement séparés. Une seule intégration finale et une revue croisée. Tenir un état de reprise : lot, fichiers, tests, blocage précis et prochaine action. Ne pas s’arrêter à une maquette si les moyens d’intégrer le parcours sont disponibles.

## 8. Skills, dépôts et outils disponibles

Inventaire ciblé constaté sur ce poste le 12 octobre 2026 : fichiers de skills lus ou chemins vérifiés et outils annoncés dans la session. **Installé ne signifie pas exécuté, authentifié ni compatible avec chaque cible.** Rechercher les noms dans le catalogue de l’agent exécutant ; les chemins Windows sont des repères locaux, pas une dépendance obligatoire pour une autre machine.

| Ressource | Quand l’utiliser | Repère installé |
|---|---|---|
| `lean-build` | Guide principal de l’implémentation : parcours complet mais limité, réutilisation de l’existant | `C:/Users/eliot/.codex/skills/lean-build/SKILL.md` |
| `mattpocock-skills:domain-modeling` | Clarifier brouillon, suggestion, réservation, provenance et import confirmé si ces concepts nécessitent des décisions | `C:/Users/eliot/.codex/plugins/cache/mattpocock/mattpocock-skills/1.3.1/skills/engineering/domain-modeling/SKILL.md` |
| `test-driven-development` ou `mattpocock-skills:tdd` | Tests comportementaux de mapping, reprise et invariants ; choisir un seul guide TDD | Le premier : `C:/Users/eliot/.codex/skills/test-driven-development/SKILL.md` ; le second sous le bundle Matt Pocock, `engineering/tdd/SKILL.md` |
| `mattpocock-skills:research` | Recherche courte de documentation officielle ou comparaison, délégable pendant le développement | Bundle Matt Pocock, `engineering/research/SKILL.md` |
| `mattpocock-skills:prototype` | Seulement pour résoudre une incertitude UX/logique ; prototype jetable, puis intégration réelle | Bundle Matt Pocock, `engineering/prototype/SKILL.md` |
| `mattpocock-skills:writing-for-agents` | Rendre le contrat et le rapport de reprise exploitables | Bundle Matt Pocock, `productivity/writing-for-agents/SKILL.md` ; utilisé pour rédiger ce plan |
| `reverse-engineer-anything` / REA | Seulement si P0 a une question précise sur un comportement navigateur accessible, pas pour analyser le code source de Détours | `C:/Users/eliot/.agents/skills/reverse-engineer-anything/SKILL.md` ; référence amont indiquée dans le skill : https://github.com/morluto/rea |
| `public-apis-catalog` | Si l’identification des lieux exige une nouvelle source ; confirmer ensuite les conditions chez le fournisseur | `C:/Users/eliot/.codex/skills/public-apis-catalog/SKILL.md` |
| `systematic-debugging`, `lint-and-validate`, `verify-and-stop` | Respectivement échec inexpliqué, contrôles configurés et validation finale sans élargir le périmètre | Skills locaux `C:/Users/eliot/.codex/skills/<nom>/SKILL.md` |
| `mattpocock-skills:code-review` et `mattpocock-skills:pr` | Revue finale sur un point de comparaison fixe puis description de PR | Bundle Matt Pocock, `engineering/code-review/SKILL.md` et `engineering/pr/SKILL.md` |

Skills Supabase et Vercel : à lire seulement si l’implémentation touche leurs services, permissions, fonctions ou SDK. Leur disponibilité ne justifie pas d’introduire une migration ou un nouveau service. Vérifier les documentations actuelles avant toute intégration de fournisseur IA.

Outils REA annoncés : `list_browser_targets`, `capture_browser_scenario`, `inspect_web_network_capture`, `analyze_javascript_application`, entre autres. Lire le schéma réel avant appel. Aucun moteur ni navigateur REA n’a été testé dans la rédaction de ce plan. Utiliser un contexte de test autorisé sans secrets ; si la cible n’est pas disponible, continuer avec documentation et parcours publics. Aucun besoin de décompiler un binaire pour cette première version.

Le bundle installé `mattpocock/mattpocock-skills` et les skills Caveman sont de l’outillage de développement, pas du code produit à copier. La présence d’autres dossiers dans le bundle ne garantit pas leur exposition comme skills dans une session : utiliser d’abord ceux annoncés dans le catalogue. Ne rien réinstaller ni mettre à jour par défaut.

Le dépôt courant a pour remote vérifié `https://github.com/Gustor1/app-vacances-27.git`. Des outils GitHub de lecture/comparaison/PR sont annoncés ; leur authentification n’a pas été testée ici. Utiliser le workflow Git existant, préserver les secrets et joindre à la PR les validations et limites. Aucun autre dépôt applicatif open source n’a été audité ou retenu comme dépendance : toute réutilisation future exige une revue du code, de la licence et de la maintenance.

## 9. Livraison et définition de terminé

Fournir un rapport `docs/development/IMPORT-PLANNING-IA.md` avec :

1. Résultat visible et commande/parcours pour essayer la fonctionnalité.
2. Statut P0–P6 et fichiers modifiés.
3. Choix du modèle/adaptateur, données transmises, protection de l’endpoint et configuration nécessaire, sans secrets.
4. Tests exécutés et résultats, avec distinction mock/réel/appareil physique.
5. Résultats sur les trois fixtures, erreurs restantes et informations conservées en notes.
6. Capacités externes manquantes et étapes d’activation, sans réclamer une validation générale déjà donnée.
7. Retour arrière du code et conservation des carnets créés.
8. PR vers la base partagée, ou raison précise empêchant sa création ; aucune fusion automatique.

**Terminé fonctionnellement** : extraction réelle autorisée sur données synthétiques, aperçu corrigible, création durable d’un nouveau carnet, carte existante, exports/restaurations et validations réussis. Si l’extraction réelle est indisponible, livrer les composants testés mais qualifier l’ensemble de **partiel, activation IA restante**. Un import manuel ou une simulation ne suffit pas à démontrer la reconnaissance d’un programme libre.

Les cinq essais avec des voyageurs et la disposition à payer sont une étape produit ultérieure menée avec l’utilisateur. Préparer une courte fiche d’essai ; ne pas contacter de testeurs ni prétendre à une validation commerciale pendant l’implémentation.
