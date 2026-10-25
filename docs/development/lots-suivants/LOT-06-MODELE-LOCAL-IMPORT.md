# Lot 06 — Tester un modèle local avant de l'intégrer

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Dépend des évaluateurs du lot 01. Ce lot est une expérience avec décision : un résultat négatif documenté est une livraison valable.

## Question

Un petit modèle améliore-t-il suffisamment la reconnaissance des textes libres pour justifier poids, mémoire, latence et maintenance, notamment sur iPhone ? Ne pas confondre JSON valide et programme fidèle.

## 1. Préparer le benchmark

Lire `IMPORT-RECOGNITION-MODELS.md` et les rapports 01/03 au lieu de refaire la même recherche. Vérifier versions, licences, fichiers exacts, tailles totales et compatibilité du runtime sur les sources officielles :
[Transformers.js](https://huggingface.co/docs/transformers.js/index), [WebGPU](https://huggingface.co/docs/transformers.js/guides/webgpu), [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B).

Choisir un seul petit candidat local pour commencer ; ajouter un second uniquement si une question précise le justifie. Ne pas supposer qu'un identifiant Hub est exécutable directement dans le navigateur. Pas d'API d'inférence payante ni d'entraînement à ce stade.

Le téléchargement local de poids publics nécessaires à cette mission est dans le périmètre, après vérification licence/taille/espace disponible ; annoncer la taille avant de lancer. Les garder hors Git et hors bundle de production. Ne pas télécharger de gros modèles en cascade. Si matériel ou réseau inadéquat, documenter le blocage sans annoncer de résultat d'inférence.

## 2. Comparer vraiment

Figer un nouveau lot inédit avec attentes avant les essais. Comparer règles actuelles seules, modèle seul et modèle appliqué aux passages incertains. Révisions, prompts, paramètres, seeds quand disponibles et matériel consignés. Aucun document personnel envoyé ailleurs.

Mesures : activités séparées, bon rattachement, omissions, champs inventés, réservations fausses, alternatives, temps de correction humaine via une petite grille à réaliser si utilisateur disponible. Mesurer premier chargement, taille totale, durée chaude, mémoire disponible/observée et annulation. Ne pas inventer une mesure de RAM navigateur impossible à relever.

Traiter le texte comme données, pas comme instructions système. Les sorties passent le validateur source existant ; un échec reste visible et conserve le texte original. Ne jamais baptiser une valeur générée « correction utilisateur ».

## 3. Décider

Critères pour proposer une intégration : aucun nouveau cas de réservation/coordonnée inventée dans les tests de sûreté ; aucune régression sur les cas déjà corrects ; gain sur les rattachements du corpus inédit, et latence/poids mesurés acceptables pour la cible. Définir le budget de latence/poids dans le rapport avant comparaison ; le justifier pour le matériel visé.

Un PC performant ne prouve pas la viabilité sur iPhone. Sans recette physique, le mode expérimental éventuel reste désactivé par défaut sur les appareils non validés.

Si le candidat ne convient pas, livrer le benchmark reproductible et la décision sans intégrer un modèle à l'app. Ne pas passer à une API payante pour « réussir ».

## 4. Intégration conditionnelle

Uniquement si les critères sont remplis : mode local expérimental facultatif, téléchargement explicite avec taille, progression et annulation, calcul hors thread UI, repli sur règles. Vérifier compatibilité WASM/WebGPU, stockage évicté, suppression des poids, redémarrage sans réseau avec tous les fichiers nécessaires, arrêt du calcul et résultats tardifs.

L'app reste utilisable sans modèle. Ne pas inclure les poids dans toutes les sauvegardes ou le précache initial.

Rapport `docs/development/lot-06-modele/RAPPORT.md`, scripts/fixtures reproductibles et décision intégrer/ne pas intégrer. Gate commun si le produit est modifié ; sinon contrôles propres au benchmark, avec distinction explicite.

