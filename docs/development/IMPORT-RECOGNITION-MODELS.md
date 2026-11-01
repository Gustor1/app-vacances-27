# Reconnaissance des plannings : règles locales et modèles

Recherche vérifiée le **15 octobre 2026**. Sources primaires uniquement ; skill `mattpocock-skills:research`. Cette note compare des options techniques. **Aucun modèle téléchargé, aucune inférence réelle, aucun entraînement, aucun appel payant et aucun déploiement** pendant cette recherche. Les résultats du parseur local et des tests applicatifs sont rapportés séparément dans la contribution.

## Décision

Livrer d'abord une reconnaissance locale du texte/Markdown avec aperçu corrigible, conservation de la source et tests de fidélité. Garder l'IA comme amélioration optionnelle pour les formulations qui échappent aux règles. Ne pas imposer un téléchargement de plusieurs centaines de Mo à chaque utilisateur avant de pouvoir importer son programme. Ne pas entraîner de modèle sans corpus annoté ni évaluation comparative.

Cette décision est une conclusion d'ingénierie fondée sur le code et les contraintes observés, **pas une mesure de supériorité des règles sur un modèle**. Hugging Face propose des candidats crédibles ; leur précision pour rattacher les activités à la bonne journée Détours reste à mesurer.

## Ce que le code permettait au début de cet audit

- `src/planning-import/extraction.ts` appelle `/api/planning-extraction`, exige une activation publique et un jeton, puis valide la réponse. Sans configuration, ce parcours ne produit aucune extraction.
- `server/planning-extraction.mjs` fournit un handler OpenAI Responses avec schéma strict, authentification et réservation de quota obligatoires. Il ne constitue pas à lui seul une route serveur hébergée. Changer le nom du modèle pour un identifiant Hugging Face ne raccorde pas un nouveau fournisseur.
- `src/planning-import/draft.ts` valide les types, les dates, les heures et les citations. Une citation présente dans le document ne prouve cependant pas que l'activité appartient à la bonne journée : il faut tester les relations, les oublis et les doublons.
- Le validateur initial demandait aussi que la date/heure normalisée figure littéralement dans sa citation. Cela bloque une conversion pourtant exacte de `15 mai 2027` vers `2027-05-15`, ou de `9h30` vers `09:30`. Une normalisation déterministe, conservatrice et testée doit traiter ce contrat avant toute comparaison de modèles.
- L'import de fichiers et la compréhension du contenu sont deux étapes. Un modèle de texte ne lit pas automatiquement un fichier PDF ou DOCX. Une éventuelle extraction de texte ou un OCR doit préserver ordre, pages/tableaux et source avant la reconnaissance des journées. Les scans nécessitent un parcours distinct, avec limites visibles.

Ces constats décrivent l'entrée de l'audit ; les modifications locales réalisées ensuite peuvent corriger les points concernés. Ils ne doivent pas être relus comme un état permanent du produit.

## Comparaison utile à Détours

| Option | Ce qu'elle apporte | Limites et coût opérationnel | Décision proposée |
| --- | --- | --- | --- |
| Règles locales | Segmentation explicite `Jour 1`, `Day 2`, `第3天`, dates, listes, tableaux ; citations exactes ; fonctionnement sans compte | Vocabulaire et formats bornés ; une prose ambiguë doit rester à vérifier | Socle disponible immédiatement, avec tests adversariaux |
| Modèle dans le navigateur | Calcul local ; possibilité d'interpréter une prose variée sans envoyer le planning | Poids, mémoire, durée du premier chargement, stockage évictable, compatibilité GPU et annulation ; fiabilité à mesurer | Essai séparé après mesure du bénéfice, téléchargement explicite |
| Modèle dans un processus local | Essais privés reproductibles sur le PC ; aucun coût par appel | Runtime à installer, mémoire et latence ; ce processus n'existe pas sur le téléphone du voyageur | Premier terrain d'évaluation des modèles |
| API serveur avec sorties structurées | Modèles plus grands et runtime centralisé ; schéma JSON fourni au moteur | Compte, coût, connectivité, transport du texte, fournisseur et quota durable ; ce n'est pas hors ligne | Option de service après comparaison réelle et raccordement complet |

Transformers.js utilise ONNX Runtime. Le navigateur peut utiliser WASM sur CPU ou WebGPU ; les quantifications disponibles dépendent du dépôt de modèle. Un identifiant du Hub ne garantit donc ni un export ONNX compatible, ni le même comportement entre CPU et GPU. [Documentation Transformers.js](https://huggingface.co/docs/transformers.js/index), [quantification](https://huggingface.co/docs/transformers.js/guides/dtypes), [WebGPU](https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu).

Pour un mode réellement hors ligne, conserver aussi tokenizer, configuration et runtime, puis désactiver les téléchargements distants et vérifier le lancement sans réseau. Transformers.js expose notamment `allowRemoteModels`, `localModelPath` et les réglages de cache. La présence d'un modèle en cache n'est pas une preuve de disponibilité durable après éviction du stockage. [Usage de modèles locaux](https://huggingface.co/docs/transformers.js/v3.8.1/custom_usage), [paramètres d'environnement](https://huggingface.co/docs/transformers.js/api/env).

## Candidats vérifiés

| Candidat | Faits documentés | Intérêt et réserve pour Détours |
| --- | --- | --- |
| `Qwen/Qwen3-0.6B` | 0,6 milliard de paramètres, contexte annoncé de 32 768 tokens, plus de 100 langues/dialectes, Apache 2.0 ; raisonnement désactivable par `enable_thinking: false` | Premier candidat d'essai texte limité ; aucune précision Détours mesurée. [Fiche officielle](https://huggingface.co/Qwen/Qwen3-0.6B) |
| `Qwen/Qwen3.5-0.8B` | Modèle multimodal Apache 2.0 ; mode sans raisonnement par défaut ; export ONNX communautaire disponible | Candidat plus récent, mais davantage de modules/runtime à vérifier. Le support visuel ne prouve pas la lecture fidèle d'un PDF multipage. [Fiche officielle](https://huggingface.co/Qwen/Qwen3.5-0.8B), [export ONNX](https://huggingface.co/onnx-community/Qwen3.5-0.8B-ONNX) |
| `HuggingFaceTB/SmolLM3-3B` | 3 milliards de paramètres, Apache 2.0 ; six langues natives annoncées, dont français/anglais/espagnol, sans chinois dans cette liste | Point de comparaison éventuel pour ces langues, moins adapté comme premier candidat unique pour les quatre langues de Détours. [Fiche officielle](https://huggingface.co/HuggingFaceTB/SmolLM3-3B) |

Les fiches et leurs scores généraux ne constituent pas un classement d'import de voyages. La capacité à générer du JSON ne démontre ni la bonne date, ni la bonne ville, ni le respect d'une alternative ou d'une négation.

### Poids réellement observés, sans téléchargement

Lecture des métadonnées publiques du Hub le 15 octobre 2026. Tailles décimales ; ce ne sont **pas** des mesures de mémoire RAM. Pour `onnx-community/Qwen3-0.6B-ONNX`, révision `58ca03a5e7b354b480b1a82b34bde8dc7b854cc0` :

| Fichier | Octets | Taille arrondie |
| --- | ---: | ---: |
| `onnx/model_quantized.onnx` | 617 687 575 | 618 Mo |
| `onnx/model_q4.onnx` | 919 096 585 | 919 Mo |
| `onnx/model_q4f16.onnx` | 569 789 750 | 570 Mo |

Le fichier `q4` est ici plus gros que le fichier `q8` : ne pas estimer un téléchargement avec le seul nombre de bits. Ajouter les fichiers du tokenizer, les configurations et le runtime ; mesurer aussi la mémoire des activations et du cache de génération. [Arborescence des poids](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/tree/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0/onnx).

Pour Qwen3.5-0.8B, le poids officiel Safetensors observé représente 1 746 942 600 octets, avant runtime ; révision `2fc06364715b967f1860aea9cf38778875588b17`. L'export ONNX sépare décodeur, embeddings et encodeur visuel : annoncer la taille d'un seul de ces fichiers comme téléchargement total serait trompeur. [Fichiers officiels](https://huggingface.co/Qwen/Qwen3.5-0.8B/tree/2fc06364715b967f1860aea9cf38778875588b17), [fichiers ONNX](https://huggingface.co/onnx-community/Qwen3.5-0.8B-ONNX/tree/8fe9dbe3fb39fe902e18df9be84b6a0ac77ae0f6/onnx).

Attention au décalage de documentation : le registre npm consulté annonce `@huggingface/transformers` **4.3.1** comme `latest`, alors que le bandeau de la documentation `main` renvoie encore à **3.8.1** comme stable. Figer la version et la révision du modèle dans l'essai ; ne pas traiter un extrait de documentation d'une autre version comme une compatibilité démontrée. [Métadonnées npm](https://registry.npmjs.org/@huggingface%2ftransformers), [documentation consultée](https://huggingface.co/docs/transformers.js/index).

## Machine et configuration observées

Contrôles locaux en lecture seule : Node **24.15.0**, Python **3.14.4**, RAM physique **15,7 Gio**, contrôleur graphique **Intel Iris Xe Graphics**. Le champ Windows `AdapterRAM` affiche 1 Gio ; ce champ ne permet pas de conclure sur toute la mémoire GPU partagée réellement utilisable. Aucun `ollama`, `nvidia-smi` ou `uv` trouvé sur le `PATH` interrogé. Aucune déduction de vitesse d'inférence à partir de ces seules informations.

La recherche de **noms uniquement** de variables `HF_*`, `HUGGING*`, `OPENAI*`, `VITE_PLANNING*` dans l'environnement du processus et les fichiers `.env*` n'a trouvé aucune configuration correspondante. Aucune valeur secrète n'a été affichée. Cela ne démontre pas l'absence de clés dans un coffre externe ou un hébergement distant.

Un essai CPU borné de Qwen3-0.6B semble envisageable sur cette machine ; c'est une hypothèse de faisabilité, pas un test exécuté. L'intégrer au navigateur mobile sans mesures serait prématuré.

## API Hugging Face : conditions concrètes

Inference Providers documente `response_format` avec `json_schema` et recommande de choisir explicitement le couple fournisseur/modèle pour éviter les incompatibilités. Conserver derrière l'adaptateur les validations Détours, bornes, annulation, authentification et quota durable existants. Le schéma contraint la forme ; la fidélité doit rester vérifiée par des citations et un corpus métier. [Sorties structurées](https://huggingface.co/docs/inference-providers/guides/structured-output).

La page de tarification consultée indique **aucun crédit mensuel inclus pour un compte gratuit** ; l'achat de crédits est nécessaire. PRO annonce 2 USD mensuels, partagés avec d'autres services de calcul. Ne pas annoncer un essai API gratuit sur la base d'anciens montants. Aucun compte ni solde de l'utilisateur n'a été inspecté, aucun achat effectué. [Tarification officielle](https://huggingface.co/docs/inference-providers/pricing).

## Prochain essai utile, avant toute intégration

1. Geler un corpus synthétique FR/EN/ES/ZH avec annotations attendues : journées, activités, rattachement, ordre, dates, heures, suggestions, négations de réservation et texte conservé. Ajouter tableaux, titres répétés, données manquantes, prose et conflits. Garder un lot de contrôle inédit lors des réglages.
2. Faire tourner les règles locales sur ce corpus. Mesurer les journées et activités correctement retrouvées, le rattachement à la bonne journée, la conservation des extraits non interprétés et les faux faits créés. Ne pas réduire le bilan au nombre de tests qui passent.
3. Dans un dossier externe au dépôt, tester Qwen3-0.6B ONNX q8, runtime et révision figés, sans outils ni réseau après téléchargement, sur une petite sélection synthétique. Commencer par de courts blocs ; fixer limites de génération et arrêt par durée. Ne pas envoyer de documents personnels pour cette comparaison.
4. Faire proposer au modèle des extraits ou positions de source pour chaque journée/activité ; reconstruire les citations avec le code. Valider ensuite avec le même contrat que l'import local. Ne jamais transformer les réponses automatiques en provenance `user` pour contourner le validateur.
5. Rapporter les erreurs exactes, sorties invalides, omissions, associations incorrectes, durée à froid/à chaud, mémoire maximale, taille téléchargée et comportement hors ligne. Répéter les cas ambigus pour observer la variabilité. Un petit jeu d'essai ne permet pas d'annoncer un taux de précision général.
6. Retenir le modèle uniquement si ce bénéfice mesuré justifie son coût sur le matériel cible. Préserver le parcours local et la revue ; un résultat non validable reste un échec récupérable. Un entraînement spécialisé n'est à envisager qu'après constitution d'exemples corrigés, consentis, versionnés et d'un lot de contrôle séparé.

L'utilisateur a autorisé l'exploration Hugging Face. Le choix de ne pas télécharger de poids aujourd'hui tient au bénéfice non démontré et à la priorité de réparer l'import disponible ; il ne constitue pas une attente d'autorisation supplémentaire.
