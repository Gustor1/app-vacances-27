# Lot 07 — Assistant du carnet à actions contrôlées

État du 23 octobre 2026 (Asia/Shanghai) : **lot 07 terminé et validé localement**. Branche `codex/lot-07-assistant`. Ne pas commencer le lot 08.

## État initial et préservation

HEAD initial `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, branche initiale `codex/lot-06-bis-api-nvidia`, nombreux travaux modifiés/non suivis des lots précédents. Lecture de `AGENTS.md`, README, collaboration, consignes communes, lot 07 et rapports 06/06 bis ; inspection du code, des formulaires, projections, permissions et sauvegardes. Les consignes historiques « ne pas commencer 07 » des rapports précédents ne remettent pas en cause la mission explicite actuelle.

Fetch de `codex/carnets-universels`, puis branche dédiée sur les prérequis locaux conservés. Aucun changement de base perdant les travaux locaux, reset, stash forcé ou purge.

Copie récupérable externe avant édition : `C:/Users/eliot/Documents/detours-lot07-recovery-20261023`, avec `source/`, `history.bundle`, `manifest.json` et **1 289 fichiers**. Empreinte du manifeste : `ebc9e3a1e5fe62b807d96018db573e11c91c7e8d295728b5eb736e30af344ffd`. Bundle vérifié : historique complet valide. Fichiers ignorés et secrets exclus.

Les seuls fichiers préexistants intentionnellement modifiés sont `README.md`, `src/App.tsx`, `src/hooks/useTravelState.ts`, `src/locale-utils.ts` et `scripts/verify-local.mjs`. Leurs différences se mesurent contre cette copie initiale, et non contre HEAD qui précède plusieurs lots. Le contrôle inverse du patch a réussi à blanc, sans retrait appliqué (`patch-check.json`). Les nouveaux fichiers de la mission sont recensés dans `changes.json`. Contrôle final : **1 284/1 289 fichiers initiaux strictement identiques**, cinq modifications prévues, aucun fichier manquant ni changement/ajout inattendu. Sept PNG historiques régénérés par les tests ont été archivés dans `regenerated/` puis remis exactement aux octets initiaux ; `restored-evidence.json` documente leurs empreintes.

## Capacités exactes

**Assistant guidé local, sans modèle.** Les résultats 06/06 bis ne valident pas de moteur de compréhension à intégrer. Aucun appel NVIDIA, endpoint, téléchargement, dépendance, migration ou configuration de fournisseur ajouté. Skills lean-build et systematic-debugging utilisés pour le périmètre et la recette.

| Capacité | Comportement livré |
| --- | --- |
| Rechercher | Recherche littérale, insensible à la casse/aux accents, dans le seul carnet courant : destinations/description/souvenir du voyage, note générale, villes/journées/activités et leurs notes, hébergements, transports/références, bonus, documents, dépenses, valise et phrases. Requête 200 caractères, 40 résultats maximum, extraits de 500 caractères. Origine affichée ; ouverture de la journée quand elle est connue. Aucune recherche Web. |
| Ajouter une note | Ajout à la note existante d’une activité explicitement choisie, sans remplacement. 4 000 caractères ajoutés, note totale 10 000 maximum. |
| Modifier un champ | Un seul parmi titre (100), description (5 000), adresse (500), nom local (200), moment (200). Valeur explicite ; titre non vide. Une association personnelle qui masque le titre/nom local doit être retirée avant leur modification. Aucun autre champ accepté par ce parcours. |
| Déplacer | Activité explicitement choisie, vers la fin d’une autre journée sélectionnée du même voyage. Identité, notes, favoris et exigences conservés. Réservée ou à réserver : refus. Refus aussi si activité liée à une durée/horaire, un trajet, une ancre ou une alternative, ou si source/destination utilise une alternative active. Ces cas restent à traiter dans les formulaires classiques, sans suppression silencieuse des preuves de préparation. |
| Alléger une journée | L’utilisateur choisit une journée et une partie de ses activités à garder, avec nom explicite. Les activités réservées/à réserver et l’ancre restent obligatoires. Création puis adoption d’une alternative fatigue existant dans le contrat de préparation, en une écriture. Aucun gain de temps ou fatigue déduit. Plan initial, horaires, billets, dépenses et alternatives précédentes conservés. 8 alternatives maximum, retour au plan initial requis avant une nouvelle proposition. |
| Demain | Bouton de filtrage recalculé à la demande dans le fuseau de chaque étape, avec repli sur celui du voyage. Addition d’un jour civil, sans ajouter 24 h à un instant local. Date/fuseau affichés, aucune destination choisie automatiquement même avec un seul résultat ; absence de date ou ambiguïté conservées. |
| Annuler | Aperçu inverse puis confirmation du dernier reçu de la session. Refus si **n’importe quelle donnée du carnet** a changé depuis, même sans rapport avec l’action. Protection volontairement conservatrice du travail tiers. Copie de secours habituelle disponible après fermeture/rechargement. |

## Contrats et limites de pouvoir

`src/assistant.ts` sépare la préparation déterministe des mutations. Vocabulaire fermé, clés/types/longueurs validés, puis validation complète par le même `validateState` que les archives/formulaires. Les textes des sources et documents restent des données React échappées : aucun HTML, instruction source, code ou outil arbitraire exécuté. Suppression, paiement, réservation, permissions, partage externe, commandes système et messages absents du vocabulaire.

Le dialogue montre le voyage, la ville/journée et les valeurs avant/après avant toute écriture. Une note d’un carnet intégralement partagé est explicitement annoncée comme visible aux autres. En partage classique, la note suit la projection privée habituelle. Les modifications du programme suivent les règles partagées existantes. Les lecteurs peuvent chercher et prévisualiser ; ils ne peuvent pas confirmer. Les catégories `notes` et `preparation` restent soumises aux champs autorisés.

`src/travel-write.ts` mutualise avec les formulaires la copie précédente, sa validation/relecture, puis `writeTrip` et la relecture de l’archive. L’assistant utilise `useTravelState.applyAssistant` : même verrou Web Locks que les formulaires, vérification immédiate du carnet ouvert, de la portée du compte, du montage du composant, de l’annulation de la session, des droits et de la révision complète. Les droits du cache AccountStorage sont relus au moment d’écrire ; lecteur, accès révoqué/supprimé, changement d’accès ou conflit en attente sont refusés. Le backend/RLS existant reste la protection distante réelle, sans modification ni contournement. Ce contrôle local ne rend pas atomique une synchronisation entre appareils.

Chaque action produit **une seule archive cohérente**, et, pour un compte, le contenu et son opération en attente sont conservés par l’écriture atomique AccountStorage existante. Pas de patch partiellement appliqué aux journées. La copie précédente est écrite et relue avant cette archive ; un quota sur la copie empêche l’écriture du carnet. Pas de nouvel état optimiste à l’écran avant confirmation locale.

Double clic bloqué dans l’interface et dans le hook. Une réponse de verrou tardive après fermeture/changement de compte ne peut pas appliquer l’action. Si l’archive visée est déjà présente après une interruption d’acquittement, un retry du **même aperçu** reconnaît le résultat et n’ajoute aucune note/alternative en double. En cas de conflit reçu pendant l’attente d’un verrou, la révision manquée est relue pour que l’utilisateur puisse fermer puis reconstruire son aperçu. Les formulaires conservent leur fusion habituelle ; l’assistant refuse les propositions périmées.

Web Locks est exigé pour confirmer depuis l’assistant ; sans cette API, message explicite et formulaires classiques disponibles. La recherche fonctionne toujours. Aucun historique de conversation ou journal d’actions ajouté au stockage : requête, champs, proposition et dernier reçu restent en mémoire, effaçables, effacés à la fermeture ou au changement de compte/carnet. Après un rechargement, aucune action n’est rejouée automatiquement. L’état réellement sauvegardé et la copie précédente sont la source de reprise ; l’aperçu non confirmé doit être reconstruit. La copie précédente reste un seul niveau, remplacé par les écritures suivantes.

Pas de modification du format d’archive ou des migrations : anciens carnets acceptés, mêmes identités et exports/restaurations/duplications ; seuls leurs champs existants changent. Aucun rattachement silencieux d’un carnet local à un compte.

## Vérifications

Les tests exécutent les **vraies mutations et écritures** avec relecture, et les parcours passent par l’interface puis inspectent/exportent le carnet. Aucun résultat de modèle n’est simulé pour annoncer une compréhension.

- `node --test tests/assistant.test.mjs` : **18/18 réussis**. Quatre actions, valeurs/commandes interdites ou inconnues, notes bornées, identités, préparations/réservations protégées, source hostile, noms ambigus, demain autour de minuit/DST, droits/compte/réponse tardive, conflit, double application, annulation après tiers, quota avant copie/avant carnet, écriture faite mais acquittement interrompu, retry, ancien format et projections/sauvegardes.
- Parcours ciblés `tests/e2e/assistant.spec.ts` : **14 scénarios réussis en groupes** avant le gate. FR/EN/ZH/ES, clavier et retour du focus, 320/390/1440 px, zoom 200 %, mouvement réduit, source malveillante affichée comme texte, aperçu/annulation/application/double clic, véritables champs/déplacement/alternative, export/rechargement, conflit entre onglets, quotas avant/après écriture, lecteur et droits révoqués, fermeture avant réponse, demain ambigu autour de minuit, compte changé pendant attente, révision reçue pendant attente puis nouveau choix.
- `npm run typecheck` et `npm run lint` : réussis lors des contrôles ciblés. Lint explicite des nouveaux scripts/tests `.mjs`, règles `no-undef` et `no-unused-vars` : réussi après déclaration des globals Node/navigateur nécessaires dans la commande.
- `npm run build`, puis `node scripts/smoke-assistant.mjs` : réussis avant la dernière correction de rafraîchissement des conflits ; le gate a reconstruit et rejoué la preuve finale. Reload réel hors ligne, note appliquée une seule fois, session non persistée, export JSON lu puis import d’une copie par l’interface. `compiled/validation.json` conserve les preuves ciblées ; les preuves finales du gate sont conservées dans `gate/`.
- Captures FR/ZH inspectées visuellement, FR/EN/ZH/ES conservées dans `screenshots/`. Contrôle complémentaire réel dans un profil Chrome jetable : Entrée sur l’aperçu puis Tab reste sur « Annuler » dans le dialogue ; Entrée sur l’effacement puis Tab reste dans le dialogue ; aperçu à 390 px/zoom 200 % sans débordement. Résultat `keyboard-additional.json`.

### Incidents corrigés et exécutions interrompues

Premier test de dictionnaire : compte de lignes attendu incorrect (52 contre 53), remplacé par le contrôle de présence des mêmes clés dans chaque langue. Les listes déroulantes puis le textarea rempli incluaient leur contenu dans la recherche du libellé exact Playwright ; noms accessibles explicites ajoutés et les mêmes parcours repassés. Le diagnostic du textarea a utilisé une trace temporaire, retirée des sources.

Premier smoke : l’import d’une copie ouvre le planning classique et ses tuiles OpenStreetMap. Les requêtes de ce shell sont désormais enregistrées séparément ; l’absence de requête de l’assistant est contrôlée avant/après ce retour, sans filtrer silencieusement les appels OSM. Réseau externe bloqué pendant tous ces tests. Le lint explicite a d’abord omis le global `structuredClone` ; commande corrigée, aucune règle désactivée.

Deux gates ont été **interrompus volontairement**, sans succès global revendiqué : `detours-verify-MXcl75` pour compléter la recherche, puis `detours-verify-SKLClf` pour ajouter la reprise après révision reçue pendant attente. Types, lint, 322 tests unitaires, build/identité et SQL passaient à ces étapes ; les parcours navigateur restaient incomplets. Journaux `verify-local-interrupted.log` et `verify-local-second-interrupted.log` conservés.

### Gate final — réussi

**30/30 étapes réussies**, code de sortie 0, aucune étape omise ; **322 tests unitaires, 172 parcours navigateur (93 + 34 + 3 + 28 + 14), 17 contrôles compilés**. Types produit/tests/configurations, lint, build/manifeste/identité, SQL PGlite isolé et tous les parcours retenus réussis. Les 14 scénarios de l’assistant ont été rejoués dans une seule exécution sur le code final. Source inchangée pendant le gate : **`sourceUnchanged=true`**.

- Preuve canonique : [gate/validation.json](gate/validation.json), journal `verify-local.log`.
- Empreinte des sources vérifiées : `a451ac8f1f60c314a97eddbe8b089c02a0934b138c43ff6c6dfba3c0931df0dc` (code/config/tests/assets visibles par Git ; documentation et fichiers ignorés exclus).
- Identité du build : `280948357783039c5737267ac94c60e260f67f17be7f1725e4c78ee8e55cb957` ; manifeste [gate/build-info.json](gate/build-info.json).
- Version de base : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64` ; travaux de cette mission locaux non committés, empreinte ci-dessus faisant foi pour leur contenu.
- Runtime : Node v24.15.0, Windows, Chrome installé/Playwright ; WebKit pour les contrôles de mise à jour existants. Pas d’appareil physique.
- Commande : `npm run verify:local`, `DETOURS_PGLITE_PATH=C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.
- Exécution finale : 23 octobre 2026, **19:36–20:00 Asia/Shanghai**. Dossier temporaire conservé : `C:/Users/eliot/AppData/Local/Temp/detours-verify-eHBKP6`. Processus terminé, code 0.

La preuve compilée finale propre à l’assistant est [gate/assistant-compiled/validation.json](gate/assistant-compiled/validation.json) avec capture `offline.png` à côté : recherche, écriture réelle, double clic, rechargement hors ligne, effacement de session, export et réimport d’une copie, aucune erreur d’exécution et **zéro requête externe pendant l’usage de l’assistant**. Les tentatives OSM du planning classique lors des ouvertures/imports sont consignées séparément. Le build utilise les paramètres Supabase **factices** du gate.

Aucun échec de mission restant connu dans ce périmètre local. L’avertissement Vite sur les chunks de plus de 500 kB reste informatif ; aucune refonte de bundle hors périmètre entreprise. Non exécutés : modèle de compréhension (absent), service distant réel, OAuth, droits d’utilisateurs réels, appareil physique, publication. Les contrôles navigateur et backend simulé ne prouvent pas ces états.

## Démonstration

1. Ouvrir un carnet fictif puis **Assistant du carnet**. Chercher une activité ou une note ; vérifier sa provenance. **Effacer la session de l’assistant** vide les champs et résultats.
2. Choisir **Ajouter une note à une activité**, une activité, un texte ; prévisualiser, annuler une première fois, puis confirmer. La note précédente est montrée et conservée. Prévisualiser puis confirmer l’annulation avant toute autre modification.
3. Choisir **Modifier un champ d’activité** : adresse explicite, aperçu avant/après, confirmation. Vérifier le champ dans le planning classique.
4. Choisir **Déplacer une activité** libre de préparation/réservation, puis sa journée de destination. Vérifier l’identité unique et la conservation de ses notes. Une activité réservée doit être refusée sans écriture.
5. Choisir **Alléger une journée**, son nom et les activités gardées. Les activités protégées sont cochées et bloquées. L’aperçu liste le programme initial et celui adopté ; le planning classique conserve l’original et permet aussi d’y revenir.
6. Ouvrir le même carnet dans un autre onglet, changer une note après préparation d’un aperçu : sa confirmation ou son annulation est refusée. Refaire l’aperçu sur la révision à jour. En lecteur, recherche et aperçu restent disponibles, confirmation désactivée.
7. Après installation du cache, couper le réseau, recharger, chercher et ajouter une note. Exporter avant toute suppression des données navigateur. Une nouvelle session de l’assistant est vide, la note acceptée reste dans le carnet.

## Retour arrière ciblé et actions humaines

Le patch `lot07.patch` est généré contre la copie **pré-mission**, pour retirer uniquement cette contribution et conserver les lots précédents. Avant un retrait, conserver un export puis vérifier `git apply --reverse --check --ignore-space-change docs/development/lot-07-assistant/lot07.patch`. Appliquer seulement si les mêmes fichiers n’ont pas changé depuis ; sinon retrait manuel ciblé à partir du snapshot et de `changes.json`. Aucun reset global. Les données sauvegardées n’exigent aucune migration inverse : l’alternative et les champs restent compatibles avec le code précédent.

Aucune action humaine nécessaire pour la voie locale guidée. La recette sur appareil physique et les droits de comptes/services réels restent à effectuer séparément avant toute publication souhaitée. Aucun modèle à choisir/configurer pour utiliser ce lot. Aucun commit, push, fusion, déploiement, migration distante ou achat effectué dans cette mission. Le `dist/` du gate utilise des paramètres factices : ne pas le publier ; reconstruire avec la configuration cible seulement si une publication est demandée.

## État et prochaine action pour une autre IA

| État | Résultat |
| --- | --- |
| Implémenté | Oui, capacités guidées exactes décrites ci-dessus. |
| Testé localement | Oui : gate complet 30/30, 322 tests unitaires, 172 parcours navigateur, 17 contrôles compilés. |
| Testé avec service réel | Non. Aucun appel d’inférence ni test distant ajouté. |
| Testé sur appareil physique | Non. Chrome mobile simulé et WebKit restent des contrôles locaux. |
| Publié | Non. Ni commit/push, ni déploiement/migration distante/fusion/achat. |

**Aucune implémentation ou vérification locale requise ne reste à faire pour ce lot.** Le gate et ses serveurs sont terminés ; aucun serveur sur 5173 à la clôture. Rapport, preuves finales, patch inverse vérifié, snapshot externe et contrôle de préservation sont disponibles.

Pour une reprise ultérieure, commencer par `git status` et vérifier branche/empreinte avant toute modification, car le checkout contient toujours les contributions préexistantes non committées. Lire `changes.json`, `preservation.json`, `patch-check.json` et `gate/validation.json` ; ne pas reprendre les paragraphes historiques des deux exécutions interrompues comme état courant. Prochaine action possible seulement sur demande explicite : recette physique/service réel ou préparation d’une livraison à partir des prérequis consolidés ; reconstruire `dist/` avec la configuration cible avant publication autorisée. **Ne pas commencer le lot 08.**
