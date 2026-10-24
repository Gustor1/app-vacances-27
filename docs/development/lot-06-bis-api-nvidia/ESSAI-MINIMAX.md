# Premier essai réel — MiniMax M3.1 Flash

23 octobre 2026 : **modèle configuré et essai réel exécuté**, comparaison partielle en raison de deux erreurs 429. L’utilisateur a choisi `minimaxai/minimax-m3.1-flash` et fourni une clé pour la configurer localement et essayer le modèle. La clé est enregistrée seulement dans `.env.local`, ignoré par Git ; aucune valeur dans ce document. Comme elle a été collée dans la conversation par l’utilisateur, sa rotation est nécessaire après l’essai. Ne pas copier la conversation dans des fichiers, captures ou rapports.

Copie récupérable avant modification : `C:/Users/eliot/Documents/detours-minimax-recovery-20261023`, 1265 fichiers non ignorés, manifeste `4d1024bc41534f74b97d3d5b4405b11bb609736a9baa9622b47aec09400c8f03`. `.env.local` et les secrets restent exclus. Branche `codex/lot-06-bis-api-nvidia`, HEAD inchangé ; continuation du même lot, aucun travail du lot 07.

Protocole avant premier appel : corpus et attentes inchangés du lot 06, prompt/validateur publics existants, température 1, top_p 0,95, seed 0, stream false, 8192 tokens maximum, 90 secondes par requête, concurrence 1, plafond global 100 tentatives. L’exemple utilisateur à image n’est pas envoyé : seuls les douze textes fictifs du corpus sont autorisés. Aucun carnet personnel, autre voyage ou sauvegarde. Le modèle et les paramètres seront figés dans `live/protocol.json` avant fetch, chaque tentative persistée avant l’appel.

Commande exécutée : `node --env-file=.env.local scripts/benchmark-nvidia-import.mjs --live --model minimaxai/minimax-m3.1-flash`. Trois lancements explicites ont poursuivi uniquement les cas non tentés après les pauses de cadence ; aucun cas refusé par le service n’a été rejoué. Le journal compte **12 tentatives au total**, pas 12 à chaque lancement. Deux réponses HTTP 429 sans Retry-After ; les pauses d’au moins une minute ont été respectées avant reprise. Aucun paiement, changement de modèle ou deuxième fournisseur. Les premiers états sont conservés dans `minimax-first-batch/`, `minimax-second-batch/` et les trois logs `minimax-live*.log`. `live/protocol.json` et le corpus n’ont pas été modifiés pendant les appels.

## Mesures observées

| Mesure | Résultat |
| --- | --- |
| Tentatives d’inférence | 12 |
| Réponses HTTP réussies, JSON et contrat valides | 10 |
| Erreurs de cadence 429 | 2 : es-prose et injection |
| Cas non tentés après dernière reprise | 0 |
| Fidélité métier brute sur réponses reçues | 10/10 cas ; 27/27 activités séparées et correctement rattachées |
| Couverture du corpus complet | 27 activités retrouvées sur 31 attendues ; les deux cas 429 restent des échecs |
| Sorties acceptées après garde-fou de provenance | 6/12 cas, 17/31 activités, 14 omissions |
| Réponses refusées par provenance | 4 : fr-prose, en-prose, booking-negation, late-change |
| Champs refusés | 7 descriptions non littérales ; pas une preuve automatique de sept faits faux |
| Latence des 10 réponses | minimum 5,45 s, médiane 6,88 s, maximum 40,74 s |
| Tokens rapportés par l’API pour les 10 réponses | 34 330 en entrée, 10 639 en sortie, 44 969 au total |
| Tokens des deux 429 | inconnus ; non remplacés par zéro |
| Coût monétaire | non fourni par la réponse, non calculé à partir des tarifs MiniMax directs |

Les sorties brutes respectent les ancres et champs attendus dans les dix cas reçus. Cela ne vérifie pas le sens de chaque description, toutes les notes ni l’ensemble des formulations possibles. Les refus viennent de la règle conservatrice imposant des descriptions présentes littéralement dans la source : plusieurs sont des reformulations compatibles avec la source, mais aucune règle n’a été relâchée pour améliorer le score après observation. Le cas de réservation négative reste bien non confirmé dans la proposition brute ; son refus est dû à sa description, pas à une fausse réservation.

Les réponses reçues ne produisent pas de nouvelle réservation confirmée ou coordonnée dans les champs mesurés. Le cas adversarial `injection` n’a toutefois reçu aucune réponse à cause du 429 : **la sûreté complète du corpus n’est pas validée**. Il n’est pas possible de prétendre « zéro hallucination » pour tous les cas. Le profil de modèle, la cadence, les conditions et le backend NVIDIA ne sont pas figés par un seed ; l’usage régulier n’est pas établi.

## Comparaison et décision

Règles : 7/12 cas, 17/31 activités bien rattachées. Modèle local 06 : 0/12 après validation. MiniMax brut : 10 réponses fidèles aux attentes métier sur 10 reçues, 27/31 activités à l’échelle complète. MiniMax après tous les garde-fous : 6/12 et 17/31, donc aucun gain accepté à ce stade. Une régression acceptée sur une réponse reçue (`booking-negation`, à cause de la description), et une sur le parcours de bout en bout due au transport (`injection`, 429). La médiane respecte le budget de 20 s, mais les critères de qualité/sûreté/régression ne sont pas tous atteints.

**Décision : garder le benchmark et le profil MiniMax, sans bouton ni endpoint d’application.** L’API réelle fonctionne avec ce profil et cette clé à la date de l’essai. Ce n’est pas une garantie de disponibilité continue, de gratuité de production ou de performance iPhone. Aucun carnet n’a été créé ou modifié par les appels.

Preuves : `live/attempts.json`, `live/results.json`, `live/protocol.json`, `comparison.json`, `live-analysis.json`. L’analyse supplémentaire sépare explicitement erreurs de transport, refus de provenance, fidélité brute, latence et compteurs manquants. Le statut technique `incomplete` conservé par le runner signifie que deux cas ont échoué ; il ne signifie pas qu’une requête reste active. Les douze cas ont chacun été tentés une seule fois.

## Vérification et reprise

Profil MiniMax testé avec 34 tests ciblés réussis ; suite finale **304/304 tests unitaires réussis**, incluant deux nouveaux tests d’analyse. Ceux-ci vérifient notamment qu’un 429 n’est pas confondu avec une erreur de raisonnement, qu’un cas de sûreté absent n’est pas validé par défaut et qu’un compteur fournisseur manquant reste inconnu. Les contrôles finaux sont dans `minimax-validation.json`. Types, lint produit et lint explicite des scripts/tests réussis ; aucun fichier produit/serveur modifié. Pas de nouveau gate applicatif, navigateur/iPhone ou build : le lot autorise la vérification du benchmark isolé et les sept parcours navigateur de la livraison initiale restent une preuve séparée, non rejouée ici.

Pour relire sans aucun appel : `node scripts/nvidia-import/analyze-live.mjs`. Pour réexécuter les tests simulés sans utiliser la clé : `node --test tests/nvidia-import.test.mjs tests/nvidia-live-analysis.test.mjs` ou `npm test`. Le CLI ne charge `.env.local` que via l’option Node explicite du lancement réel ; les tests d’absence de clé neutralisent leur environnement. Ne pas effacer `live/attempts.json` pour forcer un retry. Un nouvel essai devra préserver ces résultats et compter ses tentatives dans le budget cumulé.

**Prochaine action humaine : révoquer la clé exposée dans le chat, puis renseigner sa remplaçante dans `.env.local` si le service doit encore être utilisé.** Aucun endpoint produit à désactiver. Une amélioration éventuelle du traitement des descriptions ou un nouveau test du cas adversarial demanderait un protocole distinct ; elle n’a pas été commencée. Ne pas commencer le lot 07.

Préservation : les 1232 fichiers initiaux du lot 06 bis restent identiques. Les différences avec la copie de continuation de 1265 fichiers sont limitées aux fichiers de ce lot (profil, runner, tests, rapport, sources et preuves) ; aucune perte de fichier. La variable secrète ignorée est exclue de tous les inventaires/patchs et son contenu n’est pas copié dans la récupération. En cas de retrait du modèle, annuler seulement les changements du lot et retirer uniquement la ligne NVIDIA_API_KEY de `.env.local` si elle n’est plus utilisée ; conserver les autres réglages. Le patch cumulatif `lot06bis.patch` garde les travaux antérieurs et ses contrôles de retrait sont à blanc, sans annulation appliquée.
