# Lot 06 bis — Préparer l’évaluation NVIDIA

État du 23 octobre 2026 (Asia/Shanghai) : **socle livré et premier essai NVIDIA réel effectué avec MiniMax M3.1 Flash**, choisi ensuite par l’utilisateur. **12 tentatives, 10 réponses et deux erreurs 429** ; aucun appel encore actif. Aucun prototype utilisateur activé. Les sections initiales décrivent la préparation sans clé ; la mise à jour complète et les résultats actuels sont dans [ESSAI-MINIMAX.md](ESSAI-MINIMAX.md) et [live-analysis.json](live-analysis.json). Ne pas commencer le lot 07.

## Décision de livraison

**Benchmark seulement.** La compatibilité du profil `minimaxai/minimax-m3.1-flash` est désormais confirmée par dix réponses réelles. Les 27 activités attendues dans ces dix cas sont séparées et correctement rattachées dans les sorties brutes. Le contrôle de provenance refuse quatre propositions à cause de descriptions reformulées, et deux autres cas échouent sur 429. Après tous les garde-fous : 6/12 cas et 17/31 activités, aucun gain accepté face aux règles. La médiane observée est de 6,88 s, le maximum de 40,74 s. Les critères d’intégration ne sont pas tous atteints ; aucun bouton, endpoint d’application, clé navigateur ou accès production ajouté.

| Voie | Statut réel | Cas conformes | Bon rattachement | Omissions | Durée chaude |
| --- | --- | ---: | ---: | ---: | --- |
| Règles | Résultats réels du lot 06, code inchangé | 7/12 | 17/31 | 14 | référence locale, pas une API |
| Qwen3-0.6B local q8 | Résultats réels du lot 06 | 0/12 après validation | 0/31 | 31 | médiane 31,10 s, 17 mesures après première génération |
| Hybride local | Repli sur les règles du lot 06 | 7/12 | 17/31 | 14 | durées des appels dans le rapport 06 |
| NVIDIA MiniMax M3.1 Flash | **Réel : 10 réponses, deux 429** | 6/12 après provenance | 17/31 après provenance ; 27/27 brut sur cas reçus | 14 après provenance | médiane 6,88 s ; maximum 40,74 s, 10 réponses |

`comparison.json` contient maintenant les résultats réels. `live-analysis.json` distingue les propositions brutes des sorties acceptées et les 429 des refus de provenance. L’API rapporte **44 969 tokens** pour les dix réponses ; les compteurs des deux 429 restent inconnus. Coût par appel non établi ; aucun paiement entrepris. Le statut `incomplete` signifie que deux cas ont échoué, pas qu’une requête est laissée en cours. Le test adversarial `injection` ayant reçu un 429, la sûreté sur tout le corpus ne peut pas être déclarée validée.

## État initial et périmètre

Lecture des consignes, des rapports 03 bis et 06 et du code effectif. Le lot 06 est désormais terminé : décision négative, règles 7/12 et 17/31 rattachements ; modèle local 0/12 après validation ; hybride identique aux règles. Ses rapports, corpus, prompts et résultats sont conservés sans modification.

Branche initiale `codex/lot-06-modele`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, nombreux changements locaux préexistants. Copie externe `C:/Users/eliot/Documents/detours-lot06bis-recovery-20261023` : 1 232 fichiers, manifeste `a0eda2d630fc14ea0085b397091dfc2f71e066a4d0272b08c37aaae5ba0012b0`, historique Git. Fetch de la base puis branche dédiée `codex/lot-06-bis-api-nvidia` sur les prérequis locaux. Aucun reset, stash ou changement de base destructif.

Skill lean-build utilisé : benchmark Node isolé, sans nouveau framework, paquet, route, bouton ou migration. Le client OpenAI serveur existant (`server/planning-extraction.mjs`) reste fermé/inchangé ; il vise un autre contrat et n’est pas activé par cette mission. La nouvelle voie réutilise `importKit`, `PUBLIC_PLANNING_SCHEMA`, `readStructuredPlanning` et `prepareStructured`, sans schéma divergent.

## Décisions prises avant essais

Modèle réel **non choisi**, à la demande de l’utilisateur. Un seul profil documentaire de référence est préparé : `qwen/qwen3-next-80b-a3b-instruct`, avec API officiellement décrite et sortie maximale 4096 tokens. Ce n’est ni le meilleur modèle retenu ni une disponibilité du compte vérifiée. Les identifiants/paramètres seront revérifiés avant le choix et le premier appel. Aucune recherche de second candidat en cascade.

Corpus et attentes du lot 06 réutilisés sans modification. Contrat de sortie différent : JSON public complet `detours-planning` v1, kit anglais livré et schéma réel inclus. Le local 06 utilisait un format compact et des citations : une différence de taux de refus ne prouvera donc pas à elle seule une supériorité du modèle.

Budget : 100 tentatives cumulées maximum, concurrence 1, 90 s par requête, plafond réduit à 4096 tokens pour le profil documenté (au lieu du plafond générique 8192). Aucun retry automatique ; arrêt du lot d’appels sur erreur HTTP/réseau, respect de Retry-After avant reprise manuelle. Tout échec/tentative incertaine compte. Les compteurs ne sont que locaux au benchmark, pas un quota serveur multi-instance.

Critères pour proposer ensuite une interface : aucun nouveau cas de réservation/coordonnée inventée dans les cas de sûreté, aucune régression des sept cas corrects des règles, gain strict des rattachements et diminution des omissions ; médiane <20 s, aucune sortie acceptée après 90 s. Sans mesure réelle, ces critères ne peuvent pas être déclarés atteints. Aucun bouton activable en production n’est préparé.

## Journal initial

Prochaine action : terminer runner/protocole, fixtures de transport et tests adversariaux ; exécuter les simulations, types/lint et contrôles pertinents ; produire comparaison JSON avec NVIDIA explicitement non mesuré. Aucun processus du lot 06 actif. Aucune clé NVIDIA détectée (présence seulement vérifiée, aucune valeur affichée). Ne pas demander de clé dans le chat et ne pas effectuer d’appel réel dans cette livraison, conformément au choix de l’utilisateur.

Ce paragraphe décrit le démarrage ; les étapes de préparation et les vérifications ci-dessous sont désormais terminées.

## Implémentation et contrats

- `scripts/nvidia-import/client.mjs` : client Node fermé par défaut, endpoint HTTPS et profils documentés fixés dans le code, aucun endpoint/clé/modèle arbitraire accepté depuis le navigateur. `redirect:error`, aucun outil/recherche, texte original dans un seul message de données JSON. Le kit anglais complet et le schéma réellement livré sont réutilisés. Pas de SDK/dépendance ajoutée ni de JSON Schema contraint supposé côté fournisseur.
- Le budget local exclut les doubles appels concurrents. Le timeout couvre fetch, lecture de réponse et vérification avant retour. Bornes : source du contrat actuel, requête JSON totale 100 000 octets, réponse fournisseur 400 000 octets puis limites du validateur public (200 000 octets/50 000 caractères pour le JSON généré). La borne de requête est plus stricte que le format source ; elle ne constitue pas une mesure tokenizer du contexte réellement disponible.
- `inspectGenerated` applique le vrai validateur, puis refuse une proposition comportant ville/date/heure/adresse/référence non retrouvée dans la source ou confirmation sans preuve dans une ligne liée au titre. Les normalisations explicites de date/heure sont admises. Ce contrôle est conservateur et peut refuser une reformulation fidèle ; il ne comprend pas le sens général, le bon rattachement ni toutes les négations. Les métriques métier et l’aperçu humain restent nécessaires. Une alternative mal classée ou une note omise peut être structurellement valide : l’évaluateur la compte séparément.
- La source envoyée et `generatedText` sont deux valeurs distinctes. Le brouillon éventuel a une provenance **external**, jamais user ; `requiresHumanReview` reste vrai. Aucune création de carnet dans le client ou le runner. La voie manuelle existante applique ensuite correction, confirmation, relecture et création idempotente. Le résultat original et la source restent dans le journal du benchmark, uniquement sur les données fictives autorisées par le CLI.
- `scripts/nvidia-import/evaluate.mjs` : JSON valide, conformité, source refusée, propositions brutes, sorties acceptées, activités séparées/rattachées, omissions, champs et réservations/coordonnées indues, alternatives, éléments supplémentaires et notes explicites préservées. Les douze cas restent dans le dénominateur d’un essai réel partiel ; les non exécutés sont identifiés séparément des refus. Ce score par ancres n’est pas une mesure sémantique générale. Le contrat public n’a pas de champ coordonnées ; un tel champ est refusé, sans prétendre détecter toute coordonnée inventée dissimulée dans la prose.
- `scripts/nvidia-import/journal.mjs` : verrou de processus exclusif, journal relu après écriture temporaire puis renommage, réservation persistée avant fetch, 100 tentatives cumulées maximum. Une tentative interrompue passe à `interrupted-unknown` et n’est pas rejouée automatiquement. Rejeu d’un cas déjà tenté interdit. Modèle/prompt/corpus changés après démarrage : empreinte incompatible, aucune remise à zéro silencieuse du budget. Ce mécanisme local ne serait pas un quota global multi-instance ; aucune route web n’est exposée.
- HTTP 401/403/402/429/5xx, refus, outils, troncature et corps invalide restent des erreurs. Le runner arrête la série sur erreur de transport. Retry-After numérique/date est lu ; le journal bloque la reprise pendant le délai applicable (au moins une minute sur 429). Aucun retry ni autre fournisseur caché. Les compteurs tokens réellement retournés sont conservés, y compris sur sortie tronquée ; sans compteur exploitable, valeur indisponible. Un arrêt client ne garantit pas l’arrêt ni la non-comptabilisation côté NVIDIA.

Les erreurs techniques ne contiennent pas le corps d’erreur fournisseur, la clé ou une référence privée. Les artefacts de simulation contiennent volontairement les textes **fictifs** complets. Aucun résultat personnel ou secret n’est envoyé à un autre service. Les assets produit sont inchangés ; aucun nouveau build distribué.

## Protocole et simulation de la préparation (historique)

`protocol.json` garde le choix réel du modèle en attente, le prompt intégral, les critères, versions et SHA-256. Empreinte du corpus inchangé : `fbeaebe6424c3fe505a967135ee6ceec524367be05efee99aeed83265a81180f`. Empreinte du protocole de simulation final : `c09d3cf3342c8fd5c60eb0d64a566cb1a6afb7752adcbba86520db4d97365fa5`. Le protocole réel sera écrit avec le modèle effectivement retenu avant toute requête. Les empreintes des règles utilisées sont comparées à celles du lot 06 avant réutilisation de ses scores.

**Simulation :** douze réponses oracle construites depuis les annotations figées, quatre langues, acceptées par le contrat puis comparées. Ce 12/12 et 31/31 de l’oracle vérifie le transport et l’évaluateur ; il ne mesure absolument pas NVIDIA. Aucun compteur tokens fournisseur simulé n’est inventé : les fixtures ne fournissent pas d’usage, donc `usage:null`. Les durées simulées sont des temps locaux de test et ne figurent pas comme latence NVIDIA dans la comparaison.

`simulated/attempts.json` et `simulated/results.json` portent explicitement `SIMULATION_ORACLE_NOT_MODEL_OUTPUT`. Un second lancement finit toujours avec **12 tentatives**, sans doublon. `simulated-initial/` conserve la première recette avant les dernières corrections de source/runner, et son empreinte différente reste visible ; elle n’est pas la preuve finale. Aucune attente du corpus 06 n’a été modifiée.

## Vérifications initiales avant sélection du modèle (historique)

- **301/301 tests unitaires** par `npm test`, dont **33/33 tests NVIDIA** ciblés : happy path, quatre langues dont chinois, texte hostile traité comme données, JSON invalide/tronqué, version/champ/coordonnées inconnus, ville/date/adresse/réservation inventées, réservation positive explicitement confirmée, rattachements et alternatives perdus, notes manquantes, limites Unicode/bytes, absence de clé, modèle inconnu, modes CLI, 401/403/402/429/5xx, erreurs assainies, compteurs absents/présents, timeout fetch/corps, annulation/résultat tardif, doubles soumissions, journal/verrou/reprise et plafond 100 durable. Conservation/correction/rechargement/confirmation idempotente testés avec le stockage existant.
- `npm run typecheck` et `npm run lint` : réussis. Lint explicite `no-undef`/`no-unused-vars` des nouveaux scripts/tests : réussi. Première invocation de ce lint ciblé : deux erreurs de configuration car le global Node `AbortController` manquait ; déclaration corrigée dans la commande, sans suppression de règle ni modification produit.
- **7/7 parcours Chrome** de `tests/e2e/planning-structured.spec.ts` réussis : import réel JSON, remplacement annulé, correction/rechargement, confirmation/double clic, ancien carnet conservé, erreurs, quota/écriture interrompue et reprise, FR/EN/ZH/ES, clavier et zoom 200 %. Backend/configuration factices ; aucun OAuth réel, compte personnel ou appel NVIDIA. Le serveur de test a été lancé uniquement après constat du port disponible, sans arrêt d’un serveur utilisateur, puis fermé par Playwright.
- Préparation, simulation complète et rejeu sans nouvelle tentative : réussis. Bundle de récupération vérifié ; comparaison de préservation exécutée sur les 1 232 fichiers initiaux. Logs dans ce dossier et `validation.json` pour les statuts.

**Non exécutés :** inférence NVIDIA réelle (choix explicite utilisateur), benchmark de qualité/latence fournisseur, accès/quotas du compte, iPhone physique, vraie session/OAuth, build/déploiement et gate `npm run verify:local`. Ce lot autorise des contrôles propres au benchmark isolé ; aucun fichier produit/serveur ni dépendance produit n’est modifié. Les scénarios d’authentification d’un nouvel endpoint sont sans objet : aucun endpoint créé. Les critères n’étant pas établis, les protections et l’UI d’un prototype serveur de développement conditionnel ne sont pas implémentées prématurément. Le `dist/` antérieur n’a pas été reconstruit et ne doit pas être publié à partir de cette livraison.

## Démonstration et commandes reproductibles

Depuis la racine du dépôt, Node 22.18+ (Node v24.15.0 testé), dépendances habituelles déjà installées :

```powershell
node scripts/benchmark-nvidia-import.mjs --prepare
node scripts/benchmark-nvidia-import.mjs --simulate
node scripts/benchmark-nvidia-import.mjs --simulate
node --test tests/nvidia-import.test.mjs
npm test
npm run typecheck
npm run lint
node scripts/nvidia-import/preservation.mjs ../detours-lot06bis-recovery-20261023
```

Lire `comparison.json` : NVIDIA doit rester NON EXÉCUTÉ. Lire `simulated/results.json` : oracle simulé, 12 tentatives même après rejeu, sources et JSON distincts. Pour observer un aperçu réel sur ce résultat fictif : copier uniquement `results[0].result.generatedText` de `simulated/results.json` dans un fichier UTF-8 `simulation.detours.json`, puis l’ouvrir dans **Créer depuis un planning** ; vérifier/corriger/confirmer manuellement. Le champ `originalSource` du journal reste le texte envoyé, séparé du JSON. Cet aperçu démontre le lecteur existant, pas une connexion NVIDIA.

Ne pas modifier le prompt/contrat puis effacer `attempts.json` pour faire passer une série comme inchangée. En cas de verrou résiduel, lire `run.lock`, vérifier que son PID correspond bien à un ancien processus de cette commande désormais terminé, et retirer uniquement ce verrou précis ; ne pas tuer un processus utilisateur ni effacer le journal. Les sorties réelles ne sont jamais écrasées par un nouveau `--prepare`/`--simulate` : ces modes refusent si des résultats réels existent.

## Instructions de l’essai réel, initialement différé (historique)

1. Choisir ensemble **un seul modèle** présent dans le catalogue/compte ; vérifier identifiant, capacités, licence/conditions, contexte/sortie et quotas affichés. Le profil de référence n’est pas un classement. Si un autre modèle est choisi, ajouter/revoir seulement son profil documenté et ses paramètres avant gel du protocole réel ; garder le budget cumulé.
2. Configurer `NVIDIA_API_KEY` dans `.env.local` ignoré, sans la communiquer au chat, au Git, à Vite ou au navigateur. Ne pas utiliser de nom `VITE_*`. Rien à modifier sur Supabase/Vercel.
3. Commande d’exemple **uniquement après choix confirmé de ce profil et configuration locale** :

```powershell
node --env-file=.env.local scripts/benchmark-nvidia-import.mjs --live --model qwen/qwen3-next-80b-a3b-instruct
```

Cette commande n’a pas été exécutée avec une clé. Elle ne lit que les fixtures synthétiques gelées ; aucun planning personnel en entrée. `live/protocol.json` est enregistré avant tout appel, puis `live/attempts.json` avant chaque tentative. 100 maximum, série initiale de 12 au plus, concurrence 1 ; aucune reprise automatique des cas tentés. Vérifier `comparison.json`, sorties brutes/refusées, usage réellement fourni et conditions avant toute proposition d’UI. Arrêter immédiatement si un paiement est demandé (402 déjà traité).

4. Les essais consentis de vrais plannings, conditions de confidentialité/usage régulier, recette iPhone et publication restent **non autorisés/non exécutés dans cette livraison**. L’usage chez les proches demande un cadre fournisseur compatible ; aucune gratuité durable n’est promise. Ne pas proposer automatiquement un abonnement.

## Préservation, retour arrière et clôture

**1 232/1 232 fichiers initiaux identiques**, aucun manque, changement inattendu ou ajout hors périmètre ; `preservation.json` et `changes.json` décrivent les différences propres à la mission. Ajouts uniquement : scripts de benchmark, tests et dossier de preuves. Aucun changement d’interface, export/restauration, migration, langues, PWA, contrat public ou lecteur/éditeur. Aucun modèle téléchargé ou ajouté au bundle. Le lot 06 et les travaux précédents sont intacts. Aucun processus du benchmark/serveur de test retrouvé à la clôture ; aucun import du client/nom de clé NVIDIA dans les sources produit/serveur existantes. Le contrôle inverse à blanc du patch est **réussi**, sans retrait appliqué.

Retour arrière : vérifier le retrait à blanc de `lot06bis.patch` avec `git apply --reverse --check --ignore-space-change docs/development/lot-06-bis-api-nvidia/lot06bis.patch`, puis retirer uniquement les ajouts du lot si aucune contribution ultérieure ne les utilise. Conserver les preuves/journaux d’appels avant toute suppression ; aucun nettoyage global, effacement de carnets, reset, stash forcé ou migration à annuler. La copie initiale est hors dépôt. La clé fournie plus tard dans le chat est considérée exposée et doit être remplacée ; aucune valeur à reproduire ici.

**Mise à jour de reprise : le choix MiniMax, la configuration locale et l’essai réel demandés sont réalisés.** L’étape de préparation sans appel décrite plus haut est historique. L’utilisateur ayant collé la clé dans la conversation, il doit la révoquer et renseigner sa remplaçante dans `.env.local` pour un usage ultérieur. Aucune valeur de clé dans les rapports, logs ou fichiers partageables ; voir `minimax-secret-scan.json`. Lire ensuite [ESSAI-MINIMAX.md](ESSAI-MINIMAX.md) et `minimax-validation.json` pour l’état courant, les limites et la reprise. Aucune commande d’inférence ou serveur de test laissé actif. Branche `codex/lot-06-bis-api-nvidia`, HEAD inchangé ; aucun déploiement, aucune écriture de carnet ou modification de base distante. **Ne pas commencer le lot 07.**
