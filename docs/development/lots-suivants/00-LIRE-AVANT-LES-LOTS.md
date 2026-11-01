# Détours — Consignes communes et ordre des lots

Pack de missions du 18 octobre 2026. À lire avec le fichier du lot demandé, quel que soit l'outil : Codex, ChatGPT, Claude Code, OpenCode ou autre.

**Mise à jour du 21 octobre 2026 :** après le lot 03, exécuter le [lot 03 bis — kit universel d'import IA](LOT-03-BIS-KIT-IMPORT-IA.md) avant le lot 04. L'utilisateur indique avoir terminé le lot 03 ; son rapport et le code restent à vérifier lors de toute reprise. Le lot 06 est maintenu comme expérimentation ultérieure. L'archive historique `DETOURS-LOTS-02-A-09.zip` ne contient pas ce nouveau lot : transmettre aussi son fichier Markdown. Les indications « maintenant » et la branche mentionnées plus bas décrivent l'état historique du 18 octobre.

## Direction acceptée

Transformer un programme préparé ailleurs en carnet fiable, pratique sur place, utilisable hors ligne. Conserver l'interface actuelle. Aucun abonnement ou service payant obligatoire ; pas de frais Apple Developer. Les suggestions externes restent distinctes des données personnelles et des réservations.

Le lot 01 est livré localement : son rapport est dans `../import-fiable-lot-01/RAPPORT.md`. Revue indépendante : 106 tests ciblés passés, résultats reproduits à 27/36 sur le corpus difficile et 24/24 sur le lot de validation limité. La compréhension générale des textes libres n'est pas démontrée. Ne pas réimplémenter ce lot.

## Ordre et dépendances

Ajout du 23 octobre 2026 : [lot 06 bis — évaluation API NVIDIA](LOT-06-BIS-API-NVIDIA.md), à exécuter après le benchmark local 06. Il conserve le lot 06 et le kit externe, et ne vaut pas autorisation de publication ni de dépense. L'archive ZIP historique ne contient pas ce fichier : transmettre le Markdown séparément.

| Ordre | Mission | Dépendance |
|---|---|---|
| 02 | PWA et mobile | Socle existant, lot 01 |
| 03 | PDF texte, Word et pont ChatGPT | Lot 01 ; conserver le travail PWA |
| 03 bis | Kit téléchargeable pour son IA et import JSON structuré — [rapport](../lot-03-bis-kit-import/RAPPORT.md) | Lot 03 ; aperçu, validation et reprise existants |
| 04 | Wikidata et photos Commons | Modèle des lieux existant ; lot 03 non indispensable |
| 05 | Compagnon sur place | Carnets existants ; enrichissement 04 facultatif |
| 06 | Benchmark d'un modèle local | Évaluateurs 01 ; formats 03 utiles |
| 06 bis | Benchmark API NVIDIA et prototype facultatif désactivé | Résultats 06 ; contrat public 03 bis ; conditions fournisseur vérifiées |
| 07 | Assistant à actions contrôlées | Contrats de données ; commandes possibles même si 06 ne conclut pas |
| 08 | Mascotte discrète | États produit réellement disponibles |
| 09 | Souvenirs personnels et export | Sauvegardes ; lot 02 pour recette mobile |

Lancer **02 maintenant**, puis un lot à la fois. N'exécuter que le lot explicitement confié. Les huit fichiers forment une feuille de route, pas une obligation d'ajouter toutes les fonctions dans la même session. Lot 09 : extension secondaire à lancer après les priorités ; 06 peut légitimement conclure qu'aucun modèle testé ne convient.

## Démarrage obligatoire

1. Lire `AGENTS.md`, `README.md` et `docs/development/COLLABORATION.md` du checkout réel.
2. Vérifier Git, la branche, les instructions imbriquées et les changements présents.
3. Lire le rapport du lot précédent et inspecter le code concerné. Les plans ne prouvent pas qu'une fonction existe.
4. Créer une contribution dédiée selon le guide, sur une base contenant les travaux nécessaires. Préserver tout travail sale/non suivi : pas de reset, purge, stash forcé ou changement de base perdant les lots précédents.
5. Établir une copie récupérable ou un état Git traçable avant modification. Distinguer les changements propres à la mission de ceux déjà présents.

À la rédaction, la branche est `codex/import-fiable-lot-01` avec plusieurs contributions locales non commitées. Ne pas supposer que la branche distante partagée contient déjà ces travaux. Si un prérequis manque, retrouver la contribution locale plutôt que recréer une version concurrente. Ne pas toucher aux secrets ni aux exports personnels.

## Exécution commune

Implémenter, tester et documenter le résultat concret. Faire les choix réversibles usuels sans solliciter une validation à chaque étape. Utiliser les bibliothèques déjà présentes quand elles suffisent. Conserver les quatre langues, le clavier, le zoom et le mouvement réduit. Pas de refonte visuelle.

Pour toute donnée ajoutée : validation, compatibilité avec anciens carnets, migration idempotente si nécessaire, isolation voyages/comptes, droits lecteur/éditeur, export/restauration, reprise d'écriture et annulation. Une fonctionnalité locale ne doit pas exposer silencieusement des données dans un carnet partagé.

Pour un service externe : vérifier la documentation officielle actuelle, licence, usage commercial, quota, CORS, cache et attribution. Envoyer uniquement les données nécessaires. Sans configuration autorisée, terminer le socle local et signaler précisément la fonctionnalité désactivée. Aucun contournement de quota, scraping interdit ou réutilisation de sessions personnelles comme backend.

Avant tout choix technique dépendant d'une version, vérifier son API et sa licence actuelles. Les liens des lots sont des points de départ, pas une garantie perpétuelle.

## Validation et livraison

Exécuter les tests ciblés, puis `npm run verify:local` pour une livraison de code, avec PGlite externe et `DETOURS_PGLITE_PATH` selon le guide. Ne pas tuer un serveur utilisateur pour libérer le port. Corriger les régressions de la mission ; distinguer un échec préexistant sans le masquer.

Le gate utilise des services simulés et remplace `dist` par un build de test. Recompiler avec la configuration cible avant toute publication autorisée. Un test Chrome mobile n'est pas un test physique iPhone ; un mock API n'est pas une intégration réelle.

Rapport unique par lot : `docs/development/lot-NN-<sujet>/RAPPORT.md`, preuves JSON/captures à côté si utiles. Inclure :
- état initial, changements propres au lot, version/empreinte vérifiée ;
- critères atteints et limites restantes ;
- contrôles réellement exécutés, échecs corrigés/non corrigés, contrôles non exécutés ;
- parcours de démonstration et retour arrière ciblé ;
- actions humaines restantes, avec les étapes exactes.

Le rapport distingue **implémenté**, **testé localement**, **testé avec service réel**, **testé sur appareil**, **publié**. Aucun déploiement, migration distante, achat, activation payante, fusion dans main ou contact externe sans autorisation couvrant l'action.

## Passer d'une IA à une autre

Le dépôt et les rapports sont la source de vérité, pas la mémoire d'une conversation. Aucun nom de modèle, endpoint ou quota n'est imposé par ce pack. Utiliser le modèle effectivement proposé par l'outil et le fournisseur configurés ; ce document ne certifie pas la disponibilité des noms commerciaux.

À chaque étape significative, tenir à jour le rapport avec la prochaine action et les fichiers concernés. Avant interruption :
- conserver les changements ;
- indiquer le test en cours, son résultat connu et les processus encore actifs ;
- noter ce qui reste, les hypothèses et les décisions ;
- ne pas présenter un travail incomplet comme terminé.

Si quota épuisé : transmettre le même dossier, ce fichier, le lot et son rapport à la prochaine IA. Elle inspecte l'état avant de reprendre. Éviter deux agents écrivant simultanément dans le même checkout. Ne pas copier de clés ou sessions entre outils. Vérifier les paramètres de confidentialité de l'outil avant de lui fournir des carnets personnels ; les tests utilisent des données fictives.

## Skills et outils

Les skills sont facultatifs pour la portabilité. S'ils existent et correspondent au besoin, lire leur SKILL.md : `migration` (données), `investigate-first` (diagnostic), `test-driven-development` (comportements), `web-design-guidelines` (UI), `public-apis-catalog` (recherche), `supabase:supabase` si modification effective du backend. Un chemin de skill personnel absent dans OpenCode n'est pas un blocage : suivre les exigences de ce pack et les documents du dépôt.

Utiliser les outils réellement accessibles. Décrire une limitation au lieu d'inventer un résultat navigateur, un appel réseau ou une validation physique.

