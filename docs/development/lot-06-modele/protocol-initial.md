# Lot 06 — Benchmark d’un modèle local

État du 23 octobre 2026 (Asia/Shanghai) : **en cours**. Ne pas commencer le lot 07.

## Périmètre et état initial

Lecture des consignes communes, lot 06, AGENTS, README, COLLABORATION, étude IMPORT-RECOGNITION-MODELS et rapports 01/03/05. Branche initiale `codex/lot-05-compagnon`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, travaux précédents sales et non suivis. Fetch de la base effectué ; branche `codex/lot-06-modele` sur les prérequis locaux conservés. Aucun changement de base, reset, stash ou nettoyage.

Copie externe `C:/Users/eliot/Documents/detours-lot06-recovery-20261023` : 1 191 fichiers, bundle Git vérifié, manifeste SHA-256 `3fc448e02c013d3256fa061ec42059d1a9a314dcbcfe56967b9ecf8412da238c`. Secrets et fichiers ignorés exclus.

## Protocole fixé avant comparaison

Un seul candidat : Qwen3-0.6B, export ONNX q8 `58ca03a5e7b354b480b1a82b34bde8dc7b854cc0`, Transformers.js 4.3.1, CPU natif Node sur i7-1260P, 15,7 Gio physiques, environ 5 Gio libres au départ. Poids et runtime hors dépôt. Aucun document personnel, appel d’inférence distant ou entraînement.

Budget proposé pour une intégration mobile facultative : **150 Mo** de téléchargement modèle + tokenizer + runtime utile, **10 s** par court texte à chaud, **30 s** de chargement local à froid, annulation **2 s**, pas de réservation ou coordonnée inventée, aucune régression des cas corrects du corpus, gain strict de rattachement. Ces plafonds visent une interaction ponctuelle sur téléphone et un réseau de voyage ; ce sont des choix produit pour cette expérience, pas des capacités iPhone mesurées. Le q8 dépasse déjà le budget de poids ; l’essai PC sert à mesurer si sa qualité justifierait une recherche future, sans changer le budget après résultat.

Corpus synthétique inédit FR/EN/ES/ZH, attentes et budgets gelés par SHA-256 avant exécution. Comparaison règles seules, modèle seul et modèle sur passages incertains avec contexte complet. Le mode hybride conserve les règles si aucun passage incertain ou si sortie refusée. Si incertain, la proposition remplace le brouillon complet après validation : pas de fusion heuristique cachée. Mesurer séparément propositions brutes et sorties acceptées, erreurs, omissions, rattachements, faux champs et alternatives.

Génération gloutonne `do_sample:false`, sans seed applicable, raisonnement désactivé, 768 tokens maximum, délai dur 90 s par requête et 120 s au chargement. Aucun réglage après observation du corpus. Texte dans un message de données JSON ; aucune instruction du document n’est autorisée à modifier le protocole. La résistance réelle reste mesurée par les cas d’injection.

## Reprise pendant exécution

Prochaine action : terminer scripts/fixtures, geler corpus/prompt, télécharger les seuls fichiers sélectionnés avec empreintes, lancer les trois bras. Installation externe du runtime lancée. Aucun serveur utilisateur arrêté. Produit inchangé ; gate applicatif complet requis seulement si cette décision change, conformément à l’exception explicite du lot 06.
