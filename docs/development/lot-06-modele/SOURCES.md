# Sources primaires — candidat local du lot 06

Vérification du 23 octobre 2026. Consultation de métadonnées et de sources texte uniquement pour cette note ; aucun poids ni runtime téléchargé par son auteur. Les mesures d'inférence appartiennent au rapport du benchmark.

## Candidat et fichiers figés

Un seul candidat : Qwen3-0.6B, export Transformers.js `onnx-community/Qwen3-0.6B-ONNX`, variante `q8`. Le dépôt ONNX annonce explicitement sa compatibilité Transformers.js ; l'identifiant du modèle source en Safetensors ne suffit donc pas à décrire l'artefact exécuté. [Carte de l'export](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/blob/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0/README.md).

- Source Qwen : révision `c1899de289a04d12100db370d81485cdf75e47ca`, modèle causal de 0,6 milliard de paramètres, 28 couches ; contexte annoncé de 32 768 tokens. [Carte source](https://huggingface.co/Qwen/Qwen3-0.6B/blob/c1899de289a04d12100db370d81485cdf75e47ca/README.md), [API source](https://huggingface.co/api/models/Qwen/Qwen3-0.6B?blobs=true).
- Export ONNX : révision `58ca03a5e7b354b480b1a82b34bde8dc7b854cc0`, dernière modification annoncée le 13 octobre 2026. Les tailles ci-dessous viennent de l'[API Hub avec métadonnées de blobs](https://huggingface.co/api/models/onnx-community/Qwen3-0.6B-ONNX?blobs=true), et non d'un téléchargement de poids.
- `q8` sélectionne le suffixe `_quantized` ; ce choix est distinct de `q4f16` présenté dans l'exemple de la carte. [Table des dtypes, code 4.3.1](https://github.com/huggingface/transformers.js/blob/4.3.1/packages/transformers/src/utils/dtypes.js).

| Fichier de l'export | Octets |
| --- | ---: |
| `onnx/model_quantized.onnx` | 617 687 575 |
| `tokenizer.json` | 9 117 040 |
| `tokenizer_config.json` | 10 369 |
| `config.json` | 912 |
| `generation_config.json` | 219 |
| `chat_template.jinja` | 4 116 |
| `added_tokens.json` | 707 |
| `special_tokens_map.json` | 613 |
| `merges.txt` | 1 671 853 |
| `vocab.json` | 2 776 833 |
| `README.md` | 1 539 |
| **Total conservateur de cet ensemble** | **631 271 776** |

Ce total est de **631,27 Mo décimaux, environ 602,03 Mio**, sans runtime ni cache temporaire. Il inclut tous les fichiers racine utiles/documentaires, même si le runtime ne les ouvre pas tous ; il exclut les autres variantes ONNX et les sous-répertoires ONNX Runtime GenAI. Il ne mesure ni transfert compressé, ni RAM. Le blob q8 porte le SHA-256 LFS `ccf8734e59fdf7475b2dc0c117005e267a3a08342c1d951e0a79f0bce57bf62a`. [Arbre figé de l'export](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/tree/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0).

## Licences et runtime

Le modèle source fournit Apache-2.0 : usage et redistribution sous ses conditions, notamment copie de licence, conservation des mentions applicables et indication des modifications distribuées. L'export indique sa filiation Qwen, mais ne fournit **ni champ `license` dans sa carte ni fichier `LICENSE` propre à sa racine** à la révision consultée. Ne pas présenter cela comme une licence explicite indépendante de l'export : la licence du modèle source est la preuve disponible ; conserver sa copie et la provenance avant redistribution. [Licence Qwen figée](https://huggingface.co/Qwen/Qwen3-0.6B/blob/c1899de289a04d12100db370d81485cdf75e47ca/LICENSE), [carte et arbre de l'export](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/tree/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0).

Version npm vérifiée et retenue pour la préparation : **`@huggingface/transformers@4.3.1`**, Apache-2.0. Ses dépendances directes incluent `onnxruntime-node@1.30.0`, `onnxruntime-web@1.31.0-dev.20260914-8d85527a0`, ainsi que des plages pour `jinja`, `tokenizers` et `sharp` : un lockfile du runtime isolé reste nécessaire pour figer les dépendances transitives. Le registre annonce 9 962 435 octets décompressés pour le paquet Transformers.js seul ; ce chiffre n'inclut pas ses dépendances. [Métadonnées npm versionnées](https://registry.npmjs.org/@huggingface/transformers/4.3.1), [package.json au tag](https://github.com/huggingface/transformers.js/blob/4.3.1/packages/transformers/package.json), [release 4.3.1](https://github.com/huggingface/transformers.js/releases/tag/4.3.1).

Les pages de documentation `main` consultées affichent encore un bandeau « stable v3.8.1 ». Le registre npm et les releases officielles attestent pourtant 4.3.1 : ne pas confondre ce bandeau avec la version npm actuelle. [Documentation WebGPU](https://huggingface.co/docs/transformers.js/guides/webgpu), [releases officielles](https://github.com/huggingface/transformers.js/releases).

## API utile au benchmark

La carte de l'export montre `pipeline('text-generation', id, options)` puis un tableau de messages système/utilisateur. Pour une expérience CPU Node, sélectionner explicitement `device: 'cpu', dtype: 'q8'`, la révision figée et le répertoire de cache externe. Cette sélection CPU n'est pas une preuve WASM navigateur. [Exemple de l'export](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/blob/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0/README.md), [release et appareils](https://github.com/huggingface/transformers.js/releases/tag/4.3.1).

Dans l'API 4.3.1, passer `tokenizer_encode_kwargs: { enable_thinking: false }` au pipeline chat transmet ce paramètre au template ; ce template ferme alors la section `<think>` avant la génération. Figer aussi `do_sample: false`, `max_new_tokens` et le prompt dans le protocole. Aucun seed effectif n'est revendiqué lorsque l'échantillonnage est désactivé. [Pipeline 4.3.1](https://github.com/huggingface/transformers.js/blob/4.3.1/packages/transformers/src/pipelines/text-generation.js), [template exporté](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/blob/58ca03a5e7b354b480b1a82b34bde8dc7b854cc0/chat_template.jinja).

`InterruptableStoppingCriteria` marque l'arrêt pour la prochaine vérification entre étapes de génération ; cela ne promet pas de préempter un appel natif bloqué. Une borne stricte doit pouvoir terminer le worker/processus et rejeter tout résultat tardif. Le chargement local strict dispose de `local_files_only` et `env.allowRemoteModels = false` ; il faut contrôler leur configuration et tous les fichiers nécessaires. [Critères d'arrêt 4.3.1](https://github.com/huggingface/transformers.js/blob/4.3.1/packages/transformers/src/generation/stopping_criteria.js), [chargement Hub 4.3.1](https://github.com/huggingface/transformers.js/blob/4.3.1/packages/transformers/src/utils/hub.js).

## WASM, WebGPU et iPhone : portée réelle

ONNX Runtime distingue `onnxruntime-node` du paquet navigateur. Dans le navigateur, WASM exécute sur CPU ; WebGPU est une autre cible, dont la couverture d'opérateurs est plus restreinte. Le succès CPU Node ne démontre ni performance ni compatibilité du même graphe sur ces cibles. [Guide ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/).

Pour WASM, le multithread exige le support WebAssembly correspondant et `crossOriginIsolated` ; `numThreads: 1` permet une exécution sans cette condition. Le proxy WASM peut déplacer le calcul dans un worker, mais n'est pas compatible avec le backend WebGPU. Les binaires WASM et le JavaScript doivent provenir du même build. [Configuration ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html).

WebKit annonce WebGPU livré avec Safari 26 sur iOS/iPadOS/macOS ; Transformers.js 4.3.0 a activé ce chemin pour Safari 26+. Cela établit une disponibilité d'API, **pas une recette de Qwen q8 sur un iPhone réel**. Modèle d'iPhone, version d'iOS, mémoire, premier chargement, chauffe, annulation, cache évincé, suppression et redémarrage hors réseau restent à mesurer physiquement. [Annonce WebKit Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [release Transformers.js 4.3.0](https://github.com/huggingface/transformers.js/releases/tag/4.3.0).

Les budgets et la décision d'intégration relèvent du protocole et du rapport locaux. Ces sources n'établissent aucun gain sur la reconnaissance des carnets, aucune fidélité des réservations/coordonnées et aucun résultat de RAM navigateur.
