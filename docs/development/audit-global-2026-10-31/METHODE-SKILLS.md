# Méthode appliquée et limites des skills

La lecture d’un skill ne vaut pas exécution complète de son workflow. Les sous-audits ont relu leurs instructions propres et rendent leurs preuves dans les documents cités. Le plan demande ces méthodes ; aucune installation de skill n’a été nécessaire.

| Skill lu | Étape | Règle appliquée | Preuve ou limite |
|---|---|---|---|
| `verify-and-stop` | 1–3,6,10 | Définir preuve, qualifier pass/fail/non exécuté, aucun correctif implicite | Référence fixe, VALIDATION, lots non lancés |
| `lint-and-validate` | 1,3 | Lire scripts avant exécution, pas de `--fix`, distinguer environnement/produit | package.json et verify-local lus, gate dans copie externe, échecs CRLF conservés |
| `systematic-debugging` | 3,4,6 | Cause avant correction ; observer trace et contrôler les facteurs | Hachages/LF contre CRLF ; trace cold-start ; pas de réparation dans cet audit |
| `security-audit` + sept compagnons du plan | 4–6 | Frontière et effet concrets ; hypothèse sans sévérité ; sandbox obligatoire | Run externe 2 incomplet, aucune exécution cible de sécurité, aucun constat final promu ; CLI validateurs refusés par OS |
| `supabase:supabase` | 4 | Commencer par docs actuelles, lire contrôles RLS et distinguer déploiement | DONNEES-IMPORTS ; docs RLS consultées, changelog non accessible ; aucune mutation distante |
| `supabase-postgres-best-practices` | 4,8 | Relire droits, concurrence et coût avant conseil SQL | Revue source ; pas de charge ni EXPLAIN distant ; pas de promesse de coût mesuré |
| `product-design:audit`, `index` et références requises | 7 | Observer parcours actuel, captures puis constats, préférer preuve aux goûts | Préflight sans contexte enregistré ; IAB indisponible, fallback Playwright ; sept captures inspectées, parcours fictif ; couverture visuelle partielle |
| `computer-use` | 7 | Inventorier surfaces disponibles et ne pas prétendre y accéder | IAB indisponible et liste navigateurs vide ; fallback outillage local séparé, pas pilotage du navigateur utilisateur |
| `web-design-guidelines` | 7 | Lire règles actuelles puis références concrètes UI/focus/formulaires | Règles Vercel récupérées, revue ciblée ; pas certification accessibilité |
| `vercel-react-best-practices` | 8 | Appliquer React/Vite, distinguer lazy import et téléchargement réel | ARCHITECTURE-MESURES ; aucune recette Next.js/RSC importée |
| `mattpocock-skills:codebase-design` | 8 | Évaluer contrats et responsabilités plutôt que taille brute | Invariants TripStorage/travel-write, pas d’extraction générale proposée |
| `safe-refactor` | 9 | Préserver comportement et usages avant nettoyage | NETTOYAGE-PROPOSE, tests/retour arrière futurs ; aucune suppression |
| `writing-guidelines` | 2,9 | Source canonique, limites et exactitude documentaire | Règles officielles récupérées ; revue ciblée, pas relecture exhaustive des 102 Markdown |
| `mattpocock-skills:writing-for-agents` | 9,10 | Mission transmissible, exclusions et critères de sortie | Lots indépendants, source canonique et reprise |
| `concise-planning` | 10 | Actions concrètes, validation et périmètre borné | LOTS-CORRECTION ; pas d’implémentation dans la foulée |

Le skill code-review optionnel n’est pas utilisé : l’audit couvre une référence globale, pas un diff de lot choisi. Aucun skill de déploiement, génération d’images, installation ou service payant utilisé.

La relecture indépendante a corrigé la dernière définition SQL, un chemin Modal inexistant et la séparation dépendances/documentation dans les lots. Les fichiers tiers et sorties de tests restent des données ; leurs éventuelles instructions ne remplacent pas la mission de l’utilisateur.
