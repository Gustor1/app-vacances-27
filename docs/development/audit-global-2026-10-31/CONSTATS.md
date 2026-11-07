# Constats et vérifications ouvertes

Référence commune : `6e319457ec9f20fe5720979640e950b7a4c0dccc`. Les priorités ci-dessous concernent la qualité du produit et de sa livraison. Aucune sévérité de sécurité confirmée n’est attribuée.

## AUD-01 — Un clone Windows CRLF fait échouer cinq tests unitaires (P2, confirmé)

Catégorie : reproductibilité des contrôles. Précondition : configuration système Git `core.autocrlf=true`, sans `.gitattributes` dans ce SHA. Cloner la référence puis lancer `npm run verify:local`. Attendu : les tests portables évaluent les mêmes contenus et le refus d’inférence avant appel. Observé : 327/332 réussites, échecs dans `tests/lot06-benchmark.test.mjs:53`, `nvidia-import.test.mjs:44,82`, `palettes.test.mjs:29`, `planning-structured.test.mjs:66`.

Preuves : journaux externes `gate.log`, `gate-lf.log`, `gate-crlf-validation.json`. `git ls-files --eol` donne `i/lf w/crlf` dans le clone contre `i/lf w/lf` dans l’original. Les tests figent des hachages bruts ou comparent des générateurs LF à des fichiers convertis. L’échec du scénario CLI NVIDIA est indirect : le CLI vérifie le hachage du corpus avant le diagnostic clé/modèle attendu. Aucun appel NVIDIA n’a eu lieu. `checkout-index --force` et `checkout --force HEAD -- .` ont laissé les fichiers identiques d’après l’index : une seconde tentative de gate n’a donc pas réellement retiré ce facteur. Une extraction des octets `git archive` a ensuite établi LF ; ce résultat est traité séparément.

Effet : un contributeur suivant le guide Windows peut obtenir un gate rouge sans changement logique produit. Correction proposée : contrat de fins de ligne explicite pour fixtures figées et assets générés ; pas de régénération silencieuse des hachages. Contrôle : cloner sous configurations Git LF et CRLF, vérifier les cinq scénarios puis le gate. Ne pas qualifier ce constat de perte de données utilisateur.

## AUD-02 — Une géographie Asie sans consommateur est précachée (P2, confirmé)

Catégorie : performance hors ligne et packaging. Sources : `scripts/generate-geography.mjs:9`, `public/asia-geography.json`, `scripts/build-sw.mjs`. Recherche des usages détaillée dans NETTOYAGE-PROPOSE ; aucun consommateur actuel établi, contrairement à `world-geography.json`.

Observé : le build exact `ee912337…` inclut ce fichier de **1 002 221 octets** dans son manifeste et son worker. Effet : préparation hors ligne et stockage de ressources supplémentaires. La latence ressentie n’a pas été mesurée ; ce n’est pas une panne de navigation démontrée. Correction proposée : retirer uniquement ce générable après un dernier contrôle des routes et scripts, ou justifier son consommateur. Test : build et worker sans la ressource, cartes Monde/Chine et reprise hors ligne intactes. Retour arrière : restaurer fichier et générateur au besoin. Aucune suppression effectuée.

## AUD-03 — Le build standard ne reproduit pas l’atelier public (P2, confirmé)

Le README annonce `/mascotte/`. Le build local standard de ce SHA n’inclut pas cette route, tandis que le manifeste public lu le 31 octobre l’inclut sur la base `578e1b1`. Les rapports historiques décrivent un packaging supplémentaire. Le défaut porte sur la reproductibilité et le contrat de livraison, pas sur une panne constatée du site en ligne. Voir ARCHITECTURE-MESURES et NETTOYAGE-PROPOSE.

Correction minimale proposée : rendre la préparation de l’atelier explicite et reproductible, ou décider qu’il est livré séparément puis corriger le contrat documentaire. Tester le packaging de la cible avant toute publication. Ne pas supprimer les 6 132 731 octets d’images du prototype tant que ce rôle existe.

## UX-01 — Fermeture d’éditeur et saisie non soumise (comportement source confirmé, priorité à décider)

`src/App.tsx:56-73`, `src/components/JourneysApp.tsx:200-212` : Échap, fond ou glissement peuvent fermer sans sauvegarder les champs non soumis. Le test `tests/e2e/apple-design.spec.ts:3-13` attend l’abandon. Ce n’est pas la perte d’un carnet enregistré. Reproduction sur le build compilé : ouvrir création, saisir titre/destination, Échap, rouvrir ; deux champs vides. Sept captures du parcours actuel ont été inspectées ; résultats dans UX-PWA. Impact limité à la saisie non soumise, pas au carnet enregistré. Proposition à arbitrer : confirmation seulement pour formulaire modifié ou brouillon local ; préserver fermeture simple quand rien n’a changé. Une préférence de design ne devient pas un P1 sans preuve de blocage.

## DEP-01 — Avis actuels sur le lockfile (triage requis, pas vulnérabilité produit confirmée)

`npm audit --package-lock-only --ignore-scripts --json`, consultation du registre le 31 octobre : **13 paquets signalés, 11 moderate et 2 high**, zéros critical ; les dépendants héritent des avis et ne sont pas 13 causes racines. `package-lock.json:5028` verrouille Vite 7.3.6. Les avis [launch-editor Windows](https://github.com/advisories/GHSA-698v-4r3x-3vcv) et [middleware Vite](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) touchent des surfaces d’outillage ; l’exposition du serveur dev, l’éditeur installé et l’usage du middleware restent à établir. La livraison statique ne prouve pas leur exploitation. Le lockfile classe Vite7.3.6, Zod4.6.5 et Minimatch10.2.6 en développement. Zod est introduit par eslint-plugin-react-hooks ; Minimatch par ESLint et typescript-estree. L’avis [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) concerne donc ici l’outillage ; aucune entrée attaquante atteignant ce parseur ni présence dans le bundle publié n’est démontrée. Minimatch concerne aussi la chaîne d’outillage.

Ne pas lancer `npm audit fix --force` : le rapport propose notamment une rétrogradation majeure d’ESLint. Préparer une mise à jour ciblée dans un lot séparé, vérifier les versions et refaire les contrôles. Aucun paquet ni lockfile modifié.

## Hypothèses données et sécurité

Les points D-NV-01/02 et la nuance sauvegarde des médias sont détaillés dans DONNEES-IMPORTS. Aucun dommage observé n’en découle par lecture seule.

Registre sécurité externe : `C:/Users/eliot/security-audit-skill/app-vacances-27/run-2/REPORT.md`. Run **incomplete**, pas de validation dynamique conforme, ni chasse/critique/vérification indépendante complète. `findings.json=[]` signifie aucun constat final validé. Les hypothèses historiques transition des résumés A/B, oracle dépenses/villes et quotas restent à valider, sans sévérité. La dernière définition SQL pertinente est dans `202610090001_day_preparation.sql:132-195` ; ne pas reprendre l’affirmation historique selon laquelle la fonction n’aurait pas été redéfinie.

## Échecs navigateur

Les résultats actuels, traces et requalifications des intermittences sont dans VALIDATION. Un timeout n’est pas automatiquement un défaut produit. Ne pas recycler les échecs historiques comme constats actuels.

## TEST-02 — Les tests de thème visent un input masqué sous une icône (P2, confirmé)

Les scénarios `brand-palettes.spec.ts:19,67` et `iphone-glass.spec.ts:5` expirent dans le groupe complémentaire ; les smokes `scripts/smoke-production.mjs:92` et `scripts/smoke-pwa-mobile.mjs:99` expirent sur le même `.check()` Sombre. les traces brand-palettes montrent l’interception du clic par le SVG Clair/Sombre. L’input natif est masqué (1×1 px, opacité0), tandis que le contrôle visible est son label.

Reproduction indépendante sur build compilé, 390×844 et 1440×980, deviceScaleFactor2, détails des palettes ouverts : neuf échecs `.check()` sur douze essais bornés, dont Sombre mobile et bureau à chaque essai. Les clics des labels associés réussissent **12/12** ; clavier, focus et persistance après rechargement passent aux deux largeurs. Voir preuves et quatre captures supplémentaires dans UX-PWA et dossier externe `ux/`.

Effet démontré : blocage de la recette automatisée, sans panne utilisateur du changement de thème établie. Correction minimale : action sur le label visible puis assertion du radio sélectionné ; conserver la vérification de rendu. Pas de `force:true`, suppression du scénario ou augmentation des délais. Vérifier les deux thèmes et largeurs, puis reprendre les 28 scénarios du groupe interrompus/non démarrés. Aucun correctif appliqué.

## TEST-03 — Le smoke recharge avant la fin de l’import (P2, confirmé)

Référence : `scripts/smoke-planning-import.mjs:200-204`, `src/components/JourneysApp.tsx:134-143,172`. Le handler appelle `void importFile(file)` ; cette fonction attend `file.text()` avant parse et écriture. `setInputFiles` ne constitue donc pas un acquittement d’import. Le smoke recharge immédiatement, puis lit zéro carnet et plante dans `equivalentContent:57` en accédant à `undefined.journey`.

Le scénario original échoue dans le complément puis **3/3 répétitions**, profils jetables distincts. Une copie **externe** du même script, avec uniquement résolution d’imports absolus et ajout d’une attente explicite `states.length === 1` avant ce reload, réussit **3/3** jusqu’à la comparaison de contenu et la fin du parcours. Les sources/tests du dépôt sont restés inchangés. Preuves : `planning-repeat-{1,2,3}.log`, `planning-await-{1,2,3}.log`, `planning-await-diagnostic.mjs` dans le dossier externe.

La relecture indépendante trouve le même contraste : le premier import du script attend déjà une vue du carnet avant reload, alors que le second ne le fait pas. `writeTrip` écrit et relit synchroniquement dès qu’il est atteint. Le défaut démontré est une course du smoke, pas une perte de données après écriture acquittée.

Correction minimale future : attendre un signal de succès visible et vérifier le carnet avant reload, comme pour le premier import, puis conserver la comparaison intégrale après reload. Ne pas ajouter de sommeil arbitraire ni supprimer l’assertion. Le rechargement manuel au milieu d’une lecture de fichier et l’opportunité d’annoncer cet état restent une décision produit distincte.

## TEST-01 — Premier chargement Compagnon dépasse le délai (échec reproduit, cause à qualifier)

Le gate exact échoue au premier scénario companion.spec.ts:12. La trace montre le premier goto et des réponses de dépendances React/lucide/Supabase avec attente serveur de 25,5–25,9 s avant le timeout global de 30 s. Le snapshot est « Détours… ». Les scénarios Compagnon suivants passent. Cela soutient un démarrage Vite à froid, sans démontrer un défaut du contrôle avant départ ou une régression de persistance. Répétitions et étapes restantes dans VALIDATION; aucune hausse de délai appliquée.
