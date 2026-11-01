# Lot 01 — import local fiable

Contribution du 18 octobre 2026 (Asia/Shanghai), branche `codex/import-fiable-lot-01`.

## Résultat et périmètre

Reconnaissance locale améliorée dans le parcours existant : titres décorés, villes en minuscules dans un contexte de journées, courriels cités, listes `*` sans espace, flèches ASCII, jours de semaine, mois abrégés explicites, continuité de tableaux, pieds de page PDF déjà extraits, continuation prudente après un mot de liaison. Les citations restent des extraits exacts ; la normalisation des espaces est vérifiée par le validateur. Un hôtel estimé et non choisi reste en notes, y compris dans une puce ou une cellule de tableau ; un hôtel nommé avec un prix seulement estimatif reste un hébergement proposé, sans réservation confirmée. Une alternative conditionnelle reste facultative et à vérifier, sans confirmation inventée.

L’aperçu affiche journées, propositions et passages à vérifier, sans pourcentage de confiance ni estimation du total de la source. Un passage est un bloc non traité, un conflit, un rattachement incomplet ou un champ ambigu. Les notes explicites et les champs facultatifs absents ne sont pas comptés comme échecs. Une date numérique ambiguë après « Jour 1 » renvoie au champ date ; une note ajoutée personnellement n’est pas présentée comme un bloc source non reconnu. Un long passage converti en activité demande un titre personnel ; son extrait intégral reste dans la provenance et les notes, sans tronquer la source pour satisfaire la limite du champ description. Chaque avertissement contient sa source ; les avertissements liés à une proposition permettent de rejoindre le champ concerné. Un passage non traité peut devenir une activité dans la journée choisie ou rester une note. Déplacement, exclusion, correction des champs et provenance existants sont réutilisés.

Les décisions de revue sont conservées dans `reviewedQuotes`, champ facultatif de la session v1. Les anciennes sessions restent lisibles sans écriture de migration ; les citations nouvelles sont contrôlées contre la source. Les brouillons, carnets et formats d’archives existants sont conservés. Le texte intégral dans le carnet reste un choix explicite. Aucun service distant n’est activé.

## Mesures réelles

| Corpus difficile figé | Avant | Après |
|---|---:|---:|
| Plannings entièrement conformes | 18/36 | 27/36 |
| Activités retrouvées séparément | 75/114 | 85/114 |
| Bon rattachement ville/journée | 66/114 | 83/114 |
| Attentes sans activité séparée (omission ou fusion) | 39 | 29 |
| Éléments supplémentaires ou fusionnés | 9 | 2 |
| Erreurs sur les champs explicitement attendus | 0 | 0 |

Les neuf défauts prioritaires (07, 08, 12, 15, 17, 19, 20, 23, 33) passent. Aucune régression des 18 cas initialement conformes. Les attentes et le corpus historique n’ont pas été modifiés. Les notes ne sont jamais comptées comme activités par l’évaluateur ; deux noms fusionnés ne comptent pas comme deux extractions.

Lot inédit : 24 documents, six variantes structurelles répétées dans quatre langues, figés avant modification du parseur (`holdout-freeze.json`). Résultats avant enregistrés sans être affichés ; résultats inspectés seulement après les réglages ciblés. **11/24 → 24/24 structures conformes**, **36/64 → 64/64 activités séparées**, **33/64 → 64/64 bien rattachées** ; éléments supplémentaires 4 → 0. Ce petit corpus à motifs répétés ne mesure pas la compréhension générale.

Avertissements du lot inédit : 4/8 attentes figées signalées. Les quatre corrections finales sont signalées ; les quatre objets de courriel ne le sont pas, car ils sont traités comme métadonnées explicites. Le désaccord d’annotation est conservé sans modifier les attentes ni le dénominateur. Les avertissements ne sont pas ajoutés au score d’extraction. Aucune règle n’a été réglée à partir d’un échec du lot inédit. Les protections finales des dates ambiguës, des notes personnelles et des longs passages proviennent de tests indépendants ; le lot inédit a été réexécuté sans changement de résultat. La dernière protection des alternatives vient d’un test d’invariant indépendant ; le lot inédit a été réexécuté sans changement de résultat.

Le contrôle automatique des champs concerne les attentes `time`, `period`, `kind`, `booked` lorsqu’elles existent, les villes, les dates et la structure. Le validateur vérifie également les preuves source : 60 brouillons réels relus, sans coordonnée ajoutée (`fidelity-audit.json`). Les cas 16 et 32 restent des échecs d’extraction avec avertissement ; les deux dates ambiguës du cas 22 sont signalées sans inventer de date. Cela ne prouve pas l’absence de toute erreur sémantique dans des champs non spécifiés. Dans les sorties inspectées, aucune coordonnée, dépense, année manquante ou réservation confirmée supplémentaire n’a été ajoutée.

## Sources longues et conditions

Node 24.15.0 sous Windows, Intel i7-1260P, environ 16 Go de RAM ; cinq répétitions sans ralentissement CPU, autres processus de développement possibles. Deux sources à 50 000 caractères (note longue et suite malformée d’astérisques), et 999 phrases non structurées (20 868 caractères). Les cinq durées et médianes avant/après sont conservées dans `comparison.json`. L’avant mesure le parseur initial ; l’après ajoute le calcul des passages de revue. Ce sont des mesures Node, pas un benchmark du rendu de milliers de contrôles dans le navigateur. Les limites restent 200 000 octets et 50 000 unités JavaScript ; les dépassements sont refusés explicitement. Aucun worker ajouté sur la base de ces mesures.

Contrôle navigateur supplémentaire sur le **build compilé final** (`browser-long-inputs.json`, avec identité du build) : fichier UTF-8 de 50 000 caractères (149 986 octets), puis source malformée de 50 000 caractères. Reconnaissance jusqu’à aperçu visible : **1 497 et 298 ms** ; modification et persistance du titre : **64 et 58 ms**. Source relue identique après chaque opération. Chrome installé, profil jetable, réseau externe bloqué, aucun ralentissement CPU. Ces observations uniques incluent les attentes d’automatisation et le rendu, et ne couvrent pas tous les documents produisant des milliers de contrôles. La première ouverture longue reste sensiblement plus lente ; aucun blocage durable ni perte de source observé. Les mesures Node isolant parseur et revue restent distinctes.

## Vérifications

- Neuf tests reproduisant les défauts ont été exécutés et ont échoué avant correction. Les contre-exemples ont ensuite été ajoutés en vérification ; leur ordre n’est pas présenté comme du TDD strict.
- Tests ciblés de parseur, fichiers, validation, sessions, extraction et évaluateur : exécutés avec succès avant le gate. Les cas de blocs compactés et d’alternatives conditionnelles ont aussi échoué avant leur correction.
- Navigateurs : les 16 parcours existants `planning-local` / `planning-import` passent ; après correction du nom accessible du sélecteur, les trois nouveaux parcours `planning-lot01` passent, dont la conversion d’un passage dépassant la limite du champ description. Les trois tests de fournisseur simulé passent, dont annulation/réponse tardive et récupération après erreur.
- Mobile : clavier et absence de débordement à 320 et 390 px dans les quatre langues ; captures jointes (`screenshots/warnings-{fr,en,es,zh-CN}-{320,390}.png` et aperçu corrigé `review-320.png` / `review-390.png`). Les avertissements réels ont également été relus dans ces huit configurations. Zoom conservé. Vérification dans Chrome de bureau avec tailles mobiles ; aucun essai physique iPhone/Safari revendiqué.
- Le smoke compilé est enrichi pour la recette réelle fichier → reconnaissance → passage incertain → déplacement → rechargement → création → hors ligne → export téléchargé → restauration dans un profil vierge, avec contrôle d’un carnet préexistant inchangé.
- **Gate complet réussi : 21/21 étapes, code 0, aucune étape omise, `sourceUnchanged: true`. 213 tests unitaires et 87 parcours navigateur sélectionnés passent ; les dix smokes compilés passent.** Preuve : [validation.json](validation.json). Des démarrages ont été volontairement interrompus pour terminer les protections et le texte de l’évaluateur ; ils ne comptent pas comme gates réussis. Seule la dernière exécution complète constitue la validation finale.

Build de validation : `b1f8ffaba7333517c2e67af1384e0b46845e317d724ba5199e427462c5bd0c1d`. Services et comptes simulés ; PGlite en mémoire installé hors dépôt. Aucun contrôle de service distant réel. La recette compilée obligatoire a passé toutes les assertions : passage incertain conservé comme note, activité déplacée vers la deuxième journée, rechargement avant création, carnet antérieur byte pour byte inchangé, création hors ligne, export effectivement téléchargé et restauration équivalente dans un nouveau profil. Aucune erreur JavaScript observée. Les captures compilées sont préfixées `compiled-`.

La suite exhaustive `npm run test:e2e` et les tests réseau contre des services réels ne sont pas exécutés ; la sélection du gate et les tests expressément demandés sont exécutés. Les échecs des tests de régression avant correction et l’échec initial du nouveau test de sélecteur sont corrigés ; aucun échec ne reste dans le gate final.

## Reproduire

```powershell
node scripts/evaluate-planning-stress.mjs docs/development/import-fiable-lot-01/after
node scripts/evaluate-import-lot01.mjs
node --test tests/planning-lot01.test.mjs tests/planning-parser.test.mjs tests/planning-import.test.mjs tests/planning-files.test.mjs tests/planning-extraction.test.mjs tests/planning-stress-evaluator.test.mjs
npx playwright test tests/e2e/planning-local.spec.ts tests/e2e/planning-import.spec.ts tests/e2e/planning-lot01.spec.ts
npx playwright test --config playwright.planning.config.ts
$env:DETOURS_PGLITE_PATH = (Resolve-Path ../detours-test-tools/node_modules/@electric-sql/pglite/dist).Path
npm run verify:local
```

Pour mesurer à nouveau le parseur initial, `DETOURS_BASELINE_PARSER` peut désigner la copie récupérable hors dépôt `../detours-lot01-recovery-20261018/baseline/src/planning-import/parser.ts`. Sans ce paramètre, les mesures avant sont `null` lors d’une nouvelle exécution ; les preuves livrées enregistrent les deux versions.

## Limites restantes

Les cas historiques 09, 10, 11, 13, 14, 16, 28, 30 et 32 ne sont pas entièrement conformes : fautes de marqueurs, messages très compacts, prose, corrections tardives, allemand et alternatives fusionnées. Le cas 16 conserve les affectations initiales et expose la correction comme passage ambigu ; le cas 32 conserve une proposition alternative conditionnelle à corriger, sans la transformer en deux activités certaines. Aucun de ces avertissements n’est compté comme extraction réussie. Une revue humaine reste nécessaire ; les avertissements sont heuristiques et ne détectent pas toutes les contradictions.

Pas de lecture binaire PDF/DOCX, OCR, modèle, recherche de lieux, chatbot, nouvelle carte ni lot suivant. Aucun test OAuth réel, IA distante réelle ou appareil physique. Le gate produit un `dist` factice, impropre à publier tel quel.

## Préservation, fichiers et retour arrière

Base partagée récupérée par `git fetch`. HEAD initial `c1dd8a6` contient déjà les commits de reconnaissance absents de la base partagée : la branche dédiée est créée sur ce HEAD sans écraser le checkout sale. Copie récupérable des modifications suivies et des fichiers non suivis : `../detours-lot01-recovery-20261018/initial-work.zip`, patch initial et état Git. Les secrets et fichiers ignorés n’y sont pas copiés. `preservation.json` détaille la provenance. Les fichiers cartes/PWA préexistants restent identiques à leur copie initiale. L’évaluateur non suivi existant est prolongé ; la documentation de reconnaissance reçoit uniquement une section additive.

Fichiers du lot : `src/planning-import/{parser,normalizations,review,persistence,types}.ts`, `src/components/PlanningImport.{tsx,css}`, `src/locales/planning-import.ts`, `tests/planning-lot01.test.mjs`, ajout ciblé à `tests/planning-import.test.mjs`, `tests/e2e/planning-lot01.spec.ts`, `scripts/{evaluate-planning-stress,evaluate-import-lot01,smoke-planning-import,verify-local}.mjs`, documentation et preuves de ce dossier. Le corpus difficile préexistant est une dépendance conservée, pas un corpus réécrit.

Contribution laissée locale, sans commit mélangeant les travaux antérieurs, sans push ni pull request. Le périmètre local de la mission est conservé. Le patch `lot01-code.patch` et `changes.json` isolent les 16 fichiers de code/documentation de cette contribution de leur état initial ; une copie exacte des fichiers est également disponible hors dépôt dans `lot01-code-files.zip`. Le contrôle `git apply --reverse --check --ignore-space-change docs/development/import-fiable-lot-01/lot01-code.patch` réussit.

Retour arrière : vérifier puis appliquer uniquement l’inverse de ce patch ; conserver tous les carnets, sources et brouillons navigateur. L’ancienne session ignore le champ facultatif `reviewedQuotes`. Pour l’évaluateur et la documentation déjà modifiés avant ce lot, utiliser leur copie initiale ; aucun reset global, nettoyage du dossier ou effacement du stockage utilisateur.
