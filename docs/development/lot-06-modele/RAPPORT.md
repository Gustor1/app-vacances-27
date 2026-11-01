# Lot 06 — Benchmark d’un modèle local

État du 23 octobre 2026 (Asia/Shanghai) : **lot 06 terminé, décision NE PAS INTÉGRER ce candidat**. Expérience réelle CPU locale, application inchangée. Ne pas commencer le lot 07.

## Résultat final

Comparaison complète sur 12 sources inédites et 31 activités attendues ; 12 générations modèle seul et 6 sur passages incertains. Les six autres cas hybrides conservent directement les règles. Les résultats faisant foi sont dans [analysis.json](analysis.json), avec sources, attentes, propositions et rejets consultables.

| Méthode | Cas conformes | Activités séparées | Bon rattachement | Omissions | Propositions modèle refusées |
| --- | ---: | ---: | ---: | ---: | ---: |
| Règles seules | 7/12 | 17/31 | 17/31 | 14 | sans objet |
| Modèle seul après validation | 0/12 | 0/31 | 0/31 | 31 | 12/12 |
| Hybride après validation et repli | 7/12 | 17/31 | 17/31 | 14 | 6/6 appels |

Le modèle dégrade les sept cas déjà corrects ; l’hybride ne régresse pas grâce au repli, mais n’améliore aucun rattachement. Exemples de défauts visibles : citation littérale du schéma « exact source substring supporting this activity », date « 09:00 », ville « Ville: Nantes », réponse dans un bloc Markdown ou structure inattendue. Aucun de ces défauts n’a été maquillé en correction humaine.

Les propositions brutes JSON projetables donnent 10 activités séparées sur 28 attendues dans 11 cas modèle seul, **zéro bon rattachement**, sept erreurs de champs et onze journées avec date indue. Le douzième cas n’est pas projetable et reste un échec ; le dénominateur complet est bien 31 après validation. Pour l’hybride, cinq propositions projetables donnent 6/13 activités séparées, zéro bon rattachement, six erreurs de champs et sept journées avec date indue ; une sixième proposition n’est pas projetable. Les projections servent au diagnostic et ne sont jamais acceptées comme brouillons. Les éléments supplémentaires/fusionnés sont listés dans `unexpected` par cas ; les alternatives perdues peuvent être des omissions, et ne deviennent pas artificiellement des succès parce que `alternativeErrors` vaut zéro.

Aucune réservation ou coordonnée fausse n’est présente dans les sorties acceptées ; les propositions projetables n’en déclarent pas non plus. **Les 18 propositions sont toutes refusées** : ce résultat ne démontre pas qu’un modèle utilisable serait sûr. La protection vient ici des refus et du repli.

| Mesure PC réelle | Valeur |
| --- | ---: |
| Fichiers modèle/tokenizer/configurations | 631 270 237 octets (631,27 Mo) |
| Téléchargement et vérification des dix fichiers | 78,62 s |
| Installation du runtime et dépendances sur disque | 485 682 566 octets (485,68 Mo) |
| Installation complète observée | 1 116 952 803 octets (1,12 Go) |
| Chargement modèle dans premier processus neuf | 1,94 s |
| Nouvelle ouverture locale stricte, sans fetch autorisé | 1,85 s |
| Première génération | 41,19 s |
| Générations suivantes, 17 mesures | 19,71–86,05 s ; médiane 31,10 s |
| RSS maximale observée après requête | 2 417 446 912 octets (2,25 Gio) |
| Maximum RSS de vie du processus, compteur Node | 2 477 072 Kio (2,36 Gio) |
| Arrêt du processus après demande d’annulation | 78,59 ms ; zéro message tardif |

Le test d’arrêt est lancé 100 ms après l’envoi d’une requête ; l’étape native exacte n’est pas instrumentée. Un deuxième arrêt du même processus réussit aussi. Les mesures mémoire concernent le processus natif entier ; aucun chiffre de RAM navigateur ou iPhone n’est extrapolé. L’installation npm comprend des fichiers non nécessaires au seul texte/à une cible web ; sa taille n’est pas annoncée comme bundle navigateur. Le téléchargement mesuré représente les octets des fichiers reçus, pas une capture du trafic réseau total.

**Décision : ne pas intégrer.** Aucun gain, régressions du modèle seul, poids supérieur au budget initial de 150 Mo, et toutes les durées chaudes supérieures au budget de 10 s sur ce PC. L’absence de recette physique interdit de conclure à une viabilité iPhone. Aucun second candidat, API payante ou entraînement lancé. Le benchmark reste une expérience négative limitée à ce candidat, cette quantification, ce prompt et ce corpus.

## Périmètre et état initial

Lecture des consignes communes, lot 06, AGENTS, README, COLLABORATION, étude IMPORT-RECOGNITION-MODELS et rapports 01/03/05. Branche initiale `codex/lot-05-compagnon`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, travaux précédents sales et non suivis. Fetch de la base effectué ; branche `codex/lot-06-modele` sur les prérequis locaux conservés. Aucun changement de base, reset, stash ou nettoyage.

Copie externe `C:/Users/eliot/Documents/detours-lot06-recovery-20261023` : 1 191 fichiers, bundle Git vérifié, manifeste SHA-256 `3fc448e02c013d3256fa061ec42059d1a9a314dcbcfe56967b9ecf8412da238c`. Secrets et fichiers ignorés exclus.

## Protocole fixé avant comparaison

Un seul candidat : Qwen3-0.6B, export ONNX q8 `58ca03a5e7b354b480b1a82b34bde8dc7b854cc0`, Transformers.js 4.3.1, CPU natif Node sur i7-1260P, 15,7 Gio physiques, environ 5 Gio libres au départ. Poids et runtime hors dépôt. Aucun document personnel, appel d’inférence distant ou entraînement.

Budget proposé pour une intégration mobile facultative : **150 Mo** de téléchargement modèle + tokenizer + runtime utile, **10 s** par court texte à chaud, **30 s** de chargement local à froid, annulation **2 s**, pas de réservation ou coordonnée inventée, aucune régression des cas corrects du corpus, gain strict de rattachement. Ces plafonds visent une interaction ponctuelle sur téléphone et un réseau de voyage ; ce sont des choix produit pour cette expérience, pas des capacités iPhone mesurées. Le q8 dépasse déjà le budget de poids ; l’essai PC sert à mesurer si sa qualité justifierait une recherche future, sans changer le budget après résultat.

Corpus synthétique inédit FR/EN/ES/ZH, attentes et budgets gelés par SHA-256 avant exécution. Comparaison règles seules, modèle seul et modèle sur passages incertains avec contexte complet. Le mode hybride conserve les règles si aucun passage incertain ou si sortie refusée. Si incertain, la proposition remplace le brouillon complet après validation : pas de fusion heuristique cachée. Mesurer séparément propositions brutes et sorties acceptées, erreurs, omissions, rattachements, faux champs et alternatives.

Génération gloutonne `do_sample:false`, sans seed applicable, raisonnement désactivé, 768 tokens maximum, délai dur 90 s par requête et 120 s au chargement. Aucun réglage après observation du corpus. Texte dans un message de données JSON ; aucune instruction du document n’est autorisée à modifier le protocole. La résistance réelle reste mesurée par les cas d’injection.

## Journal d’exécution (historique)

État intermédiaire : corpus/prompt/paramètres gelés dans `freeze.json`, protocole initial copié dans `protocol-initial.md`. Runtime externe installé ; téléchargement des dix fichiers sélectionnés terminé en 78,62 s, 631 270 237 octets, tailles et SHA-256 vérifiés (hash Git blob pour petits fichiers non-LFS). Les 1 539 octets du README documentaire de l’inventaire SOURCES.md ne font pas partie du téléchargement d’exécution.

Benchmark en cours : commande `node scripts/benchmark-lot06.mjs`, log `benchmark.log`, session exec 38756. Résultats persistés après chaque génération dans `results.json` ; aucune écriture dans les carnets. Le wrapper Transformers.js renvoie un tableau chat malgré `return_full_text:false`. Le premier score de transport refuse ce tableau. `scripts/lot06-analyze.mjs` extrait ensuite exclusivement le dernier message assistant et rejoue la validation/source/score sur les mêmes sorties : **analysis.json sera la comparaison faisant foi**. Aucun prompt, budget, poids, paramètre ou texte généré modifié après gel. Tests dédiés du transport et de l’analyse ajoutés ; les rejets bruts restent auditables.

Prochaine action : attendre la fin des 12 cas et des requêtes hybrides, puis `node scripts/lot06-analyze.mjs`, vérifier les métriques et la préservation, finaliser décision et reproduction. Typecheck/lint réussis ; première suite ciblée 89/89 réussie avant ajout du test transport. Le temps de correction humaine reste non mesuré à la demande explicite de l’utilisateur. Aucun serveur utilisateur arrêté. Produit inchangé ; gate applicatif complet requis seulement si cette décision change, conformément à l’exception explicite du lot 06.

En cas d’interruption de la conversation : inspecter `benchmark.log` et le champ `status` de `results.json`. Le parent `scripts/benchmark-lot06.mjs` et son enfant `scripts/lot06-worker.mjs` sont les seuls processus de cette expérience ; ne pas arrêter les autres processus Node. Si le parent est encore actif, attendre sa fin. Sinon conserver/renommer les résultats et logs partiels avant de relancer le même benchmark gelé (le script rejoue l’ensemble, il ne reprend pas au dernier cas). Ne pas relancer `--freeze`, ne pas changer le prompt sur ce corpus. Puis exécuter analyse, tests et audit de préservation. Aucun serveur applicatif n’est lancé par la mission.

## Reproduction préparée

Depuis la racine du dépôt, avec Node 22.18+ et les dépendances normales du projet présentes :

```powershell
# Runtime uniquement dans le dossier frère, jamais npm install dans le produit.
npm ci --prefix ../detours-lot06-tools
node scripts/lot06-download.mjs ../detours-lot06-tools/model
node scripts/benchmark-lot06.mjs
node scripts/lot06-analyze.mjs
node --test tests/lot06-benchmark.test.mjs tests/planning-stress-evaluator.test.mjs tests/planning-lot01.test.mjs tests/planning-parser.test.mjs tests/planning-documents.test.mjs
node scripts/lot06-preservation.mjs ../detours-lot06-recovery-20261023
```

Pour une autre machine, créer d’abord le dossier frère `detours-lot06-tools` et y copier `runtime-package-lock.json` sous le nom `package-lock.json`, ainsi qu’un `package.json` contenant `{"dependencies":{"@huggingface/transformers":"4.3.1"}}`. Le lockfile fige les transitives ; l’installation de packages natifs dépend du système. `DETOURS_LOT06_TOOLS` permet de désigner un autre dossier externe absolu pour le runtime et son sous-dossier `model`. Le téléchargement et le préfixe npm doivent viser ce même dossier. Aucun accès au compte Hugging Face ni clé nécessaire pour ces fichiers publics. Conserver les sorties précédentes avant réexécution : le runner réécrit `results.json`.

`--rules-only` existe pour rejouer uniquement la référence locale, mais réécrit aussi `results.json` : archiver d’abord le résultat complet. Le fichier `freeze.json` existant protège corpus, prompt, runner et worker ; ne pas en créer un nouveau pour reproduire cette expérience.

Deux corrections d’outillage après gel sont explicitement tracées dans `execution-fixes.json` : extraction du dernier message assistant du transport chat et arrêt idempotent d’un processus déjà terminé par signal. Le runner initial exact est conservé dans `runner-initial.mjs.txt`, son empreinte correspond au gel ; l’empreinte du runner corrigé est vérifiée séparément. Corpus, prompt, worker, poids et paramètres sont inchangés. Le runner corrigé et le post-traitement utilisent la même extraction de message. Les résultats initiaux ne sont pas effacés.

## Contrôles et limites intermédiaires

90/90 tests ciblés réussis après ajout du cas de transport. Typecheck et lint globaux réussis ; vérification explicite `no-undef`/`no-unused-vars` des nouveaux scripts/tests réussie après déclaration des globals Node, dont AbortSignal. La première invocation de ce lint ciblé omettait ce global et signalait deux erreurs de configuration, sans changement de code pour les faire disparaître.

Les règles actuelles reproduisent également les corpus historiques : stress 27/36, 83/114 activités correctement rattachées ; validation 24/24, 64/64. Ces contrôles ne mesurent pas la précision générale. Le benchmark compare un seul prompt fixé, sans recherche de meilleur prompt, répétitions de seeds ou second candidat. Une conclusion négative ne démontre pas que tous les modèles locaux échouent.

Le corpus inédit comporte des textes courts à ville unique et des cas de sûreté négatifs : il ne valide ni longs circuits à plusieurs villes, ni réservations positives, ni toutes les ambiguïtés, ni la lecture directe d’un PDF/DOCX. Les tests des documents existants sont rejoués séparément. Les sorties refusées comptent comme omissions dans le bras modèle ; le bras hybride conserve alors le brouillon des règles et sa source, sans améliorer artificiellement le score.

Le CPU natif Node n’est ni WASM ni WebGPU navigateur. RSS observée du processus et maximum Windows sont enregistrés ; aucune RAM navigateur/iPhone inventée. La première ouverture locale bénéficie éventuellement du cache disque OS après téléchargement ; elle n’est pas une mesure disque froid. Les durées sont celles d’un PC de développement en usage, sans contrôle thermique ni isolation de toute activité système. Le poids suffit déjà à échouer au budget ; les latences observées restent descriptives de cette machine.

## Question sur une API en ligne

L’utilisateur a demandé pendant l’expérience si une API NVIDIA permettrait d’éviter le calcul sur chaque plateforme. Oui, une application avec backend peut appeler un endpoint HTTPS depuis ses clients connectés ; cela change les contrats de réseau, de confidentialité et de gestion de clé. Aucune intégration ni activation de compte n’a été entreprise dans ce lot.

NVIDIA présente ses endpoints gratuits pour **prototypage/développement**, et distingue cette offre de la production. Il ne faut donc pas en déduire une offre gratuite durable destinée aux vrais utilisateurs. Aucun quota propre au compte de l’utilisateur n’a été consulté. Sources officielles vérifiées le 23 octobre 2026 : [catalogue NVIDIA](https://build.nvidia.com/), [NIM pour développeurs](https://developer.nvidia.com/nim), [FAQ et distinction production](https://docs.api.nvidia.com/nim/docs/product). Cette réponse ne change ni le protocole local ni la limite « uniquement lot 06 ».

## Préservation et retour arrière

Le produit, son manifeste de dépendances, son lockfile, ses assets, migrations, exports, précache et interface sont inchangés. Les fichiers du lot sont exclusivement des scripts de benchmark, tests, corpus fictif et preuves dans ce dossier. `preservation.json` compare les fichiers initiaux au manifeste hors dépôt ; `changes.json` énumère seulement les ajouts avec empreintes. Aucun ajout de poids dans Git, le bundle ou les sauvegardes.

Retour arrière ciblé : conserver le rapport et les résultats, puis retirer seulement les fichiers propres au lot listés dans `changes.json`, après vérification de leurs empreintes et de l’absence de contributions ultérieures. Ne jamais nettoyer globalement le checkout. Le runtime et le modèle externes peuvent être archivés ou supprimés séparément dans `C:/Users/eliot/Documents/detours-lot06-tools` une fois les processus du benchmark terminés ; vérifier le chemin absolu avant toute suppression. Aucune suppression n’a été exécutée. Aucun stockage de carnet ni secret à modifier.

## Clôture et état de reprise final

**Terminé le 23 octobre 2026 à 13:06 (Asia/Shanghai).** Les 18 générations ont été conservées ; le premier processus a quitté avec code 1 lors de la clôture, après enregistrement de toutes les réponses. Le compteur `exitCode` reste nul après SIGTERM : attendre une seconde sortie provoquait un await sans événement futur. La condition inclut désormais `signalCode`. `benchmark-first-attempt.log` et `results-first-attempt.json` gardent l’échec initial. `recovery.json` et `recovery.log` prouvent une nouvelle ouverture locale stricte, l’arrêt de la requête et l’arrêt répété du même processus. `results.json` est finalisé avec cette provenance ; `analysis.json` applique le vrai validateur sur le contenu assistant des sorties originales.

Contrôles finaux : **91/91 tests ciblés réussis**, typecheck réussi, lint global réussi, lint explicite des scripts/tests du lot réussi, replay de la voie règles du runner corrigé réussi (les résultats complets ont ensuite été rétablis à l’identique). Corpus/prompt/worker et protocole initial contrôlés par empreintes ; correction du runner tracée séparément. Les corpus historiques règles sont reproduits. Les preuves et statuts sont regroupés dans `validation.json`, les empreintes des entrées dans `analysis.json`/`freeze.json`, celles des ajouts dans `changes.json`.

Non exécutés : **gate applicatif `npm run verify:local`**, nouveaux parcours navigateur et build. Motif : aucun fichier produit ou dépendance produit n’est modifié, et le lot 06 précise « Gate commun si le produit est modifié ; sinon contrôles propres au benchmark, avec distinction explicite ». Le gate du lot 05 n’est pas présenté comme une validation de ce lot. Le runner corrigé n’a pas refait les 18 inférences : la récupération réutilise leurs sorties exactes, et les branches corrigées sont vérifiées par tests dédiés, replay règles et vraie annulation. Aucun test d’API d’inférence distante, OAuth, WASM/WebGPU navigateur, suppression/éviction de cache navigateur ou appareil physique. Les conditions d’intégration mobile ne sont pas implémentées puisque le candidat est rejeté. Temps de correction humaine non mesuré au choix de l’utilisateur.

Premier audit de préservation : **1 191/1 191 fichiers initiaux identiques**, aucun manque ou ajout hors périmètre. Le dernier audit détecte un travail documentaire apparu pendant la mission : **1 190 fichiers identiques**, modification de `docs/development/lots-suivants/00-LIRE-AVANT-LES-LOTS.md` et ajout de `docs/development/lots-suivants/LOT-06-BIS-API-NVIDIA.md`, horodatés à 12:56:44. Aucun fichier initial manquant. La différence ajoute seulement la mission 06 bis aux consignes communes ; aucune commande de cette mission n’a écrit ces deux fichiers. Ils sont conservés tels quels, exclus du patch et de l’inventaire des ajouts propres au lot 06. `preservation.json` garde donc **passed:false** pour signaler honnêtement ces écarts globaux, sans les masquer ni les annuler ; `concurrent-observed.json` enregistre leurs empreintes. Tous les fichiers produit initiaux sont identiques. Ne pas confondre ce document concurrent avec une exécution du lot 06 bis : ce dernier n’est pas commencé ici.

Le patch `lot06.patch` est isolé des travaux précédents et de ces deux documents ; contrôle de retrait à blanc `git apply --reverse --check --ignore-space-change docs/development/lot-06-modele/lot06.patch` **réussi**, sans appliquer le retrait. Les fichiers d’inventaire et le patch lui-même sont exclus de l’empreinte récursive du patch. Sur un autre checkout sans ce travail documentaire, l’audit pourra avoir un résultat global différent ; lire la liste des écarts, ne jamais restaurer automatiquement la copie initiale.

Branche finale `codex/lot-06-modele`, HEAD inchangé `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. Contribution locale non commitée/non poussée, séparée des travaux précédents non commités ; aucune PR regroupant ces travaux n’a été créée. Aucun déploiement, publication, modification de base distante ou stockage de carnet. Les poids publics et runtime restent uniquement dans le dossier externe. La licence Apache-2.0 du modèle source est vérifiée ; l’export ONNX n’a pas de déclaration propre explicite, comme détaillé dans SOURCES.md. Aucune redistribution de poids n’est effectuée.

**Prochaine action requise : aucune pour le lot 06.** Pour examiner les preuves, ouvrir `analysis.json` et ce rapport. Pour reproduire, archiver les résultats et suivre les commandes ci-dessus ; le modèle reste hors de l’app. Aucun processus du benchmark ni serveur lancé par cette mission ne reste actif après clôture. Aucune action humaine obligatoire, aucune mesure de correction à réaliser. Toute expérimentation d’un autre candidat/API devra avoir son propre corpus inédit et une instruction distincte. **Ne pas commencer le lot 07.**
