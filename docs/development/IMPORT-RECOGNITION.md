# Reconnaissance locale des plannings

> Audit de robustesse ultérieur, sur la même reconnaissance : [36 nouveaux plannings propres et brouillons](planning-stress-2026-10-16/RAPPORT.md). **18/36 conformes**, dont 6/6 structurés mais 0/6 très brouillons. Les 42 cas de régression réussis ci-dessous ne constituent pas une preuve de compréhension générale des programmes libres.

Contribution du **16 octobre 2026**, branche `codex/import-recognition`, à partir de `bbe9e25` (parcours d'import précédent, lui-même basé sur la base partagée `9fa03b1`). La base distante `codex/carnets-universels` a été récupérée avant le travail. Les documents et prototypes non suivis déjà présents sont conservés.

## Résultat

Le parcours **Mes voyages → Créer depuis un planning → Reconnaître mon programme** fonctionne localement, sans compte ni service d'IA. Il prépare un aperçu corrigible depuis un texte collé ou un fichier `.txt`, `.md`, `.markdown` en UTF-8. La source est conservée dans le brouillon récupérable ; la copie intégrale dans le carnet reste un choix explicite. Les extraits non structurés restent consultables.

Au début du travail, ce checkout ne contenait pas le parcours développé sur la branche d'import séparée. Ce parcours a été repris avant les corrections. Ses tests existants validaient surtout des brouillons déjà structurés ou des réponses IA simulées ; ils ne démontraient pas une compréhension réelle des textes saisis. Le nouveau parseur est effectivement exécuté sur les sources des tests.

## Formats et fidélité

- Titres de villes et journées, `Jour 1`, `J1`, `Day 1`, `Día 1`, `第1天`, Markdown, listes et activités reliées par `→`.
- Dates ISO et dates écrites avec une année explicite en français, anglais, espagnol et chinois. Une année absente ou une date numérique ambiguë reste à compléter.
- Heures explicites et périodes textuelles distinctes : `9h30` peut devenir `09:30`, mais `matin` ne crée pas d'heure.
- Tableaux Markdown dont les colonnes identifient activités, jours, dates, villes, heures, adresses et notes.
- Suggestions et alternatives séparées du programme principal, réservations seulement lorsqu'elles sont explicitement confirmées. Aucun prix ne devient une dépense et aucune coordonnée n'est inventée.
- Dates et heures normalisées restent vérifiées à partir de leur extrait source exact. Les sorties d'un éventuel fournisseur IA passent le même contrôle ; elles ne reçoivent pas une fausse provenance de correction personnelle.

Les fichiers sont bornés avant lecture puis après décodage : **200 000 octets et 50 000 caractères**. Fichier vide, trop grand, binaire renommé ou UTF-8 invalide : erreur explicite et texte courant conservé. Remplacer une source déjà saisie demande un choix dans l'interface après aperçu du nouveau texte. Il n'y a pas de troncature silencieuse.

La reconnaissance est un ensemble de règles explicites, pas un modèle entraîné ni une garantie sur toute formulation libre. L'aperçu reste nécessaire : titre, ville, dates, activités et rattachements sont modifiables avant création. Le lot 03 ajoute une extraction locale des PDF texte et DOCX, suivie de la relecture du texte et du même aperçu ; les scans ne sont pas décodés. [Rapport, fixtures binaires, limites et recette hors ligne](lot-03-documents/RAPPORT.md). L'OCR n'est pas inclus. Les trajets complexes, changements de fuseau et détails d'hébergement non structurés restent dans le texte à relire.

## Corrections de reprise

Deux régressions ont été reproduites par des tests en échec avant réparation : une confirmation depuis un ancien onglet pouvait écraser des corrections sauvegardées plus récentes ; la reprise d'une création préparée pouvait enregistrer l'ancien aperçu dans son reçu. La confirmation refuse maintenant une revue périmée, et la reprise conserve le candidat et l'aperçu persistés.

L'identité du carnet reste stable pendant une reprise. La création valide avant écriture et relit ensuite. Les carnets existants, les espaces de compte et le mode local restent séparés. Aucun schéma de données serveur ni aucune permission distante n'est changé.

## Évaluation reproductible

```powershell
node --test tests/planning-parser.test.mjs tests/planning-files.test.mjs tests/planning-import.test.mjs tests/planning-extraction.test.mjs
node scripts/evaluate-planning.mjs
npx playwright test tests/e2e/planning-local.spec.ts tests/e2e/planning-import.spec.ts
$env:DETOURS_PGLITE_PATH = 'C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist'
npm run verify:local
```

Le corpus synthétique est dans `tests/fixtures/planning/corpus.mjs`. Le script d'évaluation compare les villes, nombres de journées/activités, dates, heures, types, réservations et notes attendus. Il vérifie aussi la structure du document Chine déjà suivi dans `public/documents/planning-original.md`. Les résultats de ce corpus ne sont pas un taux de précision sur tous les documents de voyageurs.

Évaluation exécutée : **42/42 cas et 219 assertions comparatives réussis**. [Résultat détaillé](import-recognition-evaluation.json). Le document Chine produit six destinations, 17 journées et 92 éléments d'activité ; ce décompte structurel ne constitue pas une annotation indépendante de la qualité de chaque activité.

La revue supplémentaire a corrigé les périodes en sous-titres, les journées précédées d'un numéro de liste, les changements de ville en texte simple, les dates mentionnées au milieu d'une activité et les heures AM/PM en majuscules. Une réservation future, annulée, interrogative ou un accès « réservé aux riverains » ne devient plus une réservation confirmée. Ce dernier contrôle est partagé entre parseur local et validation d'une réponse fournisseur.

Les tests navigateur ajoutés utilisent de vrais fichiers et le presse-papiers, sans réponse d'extraction simulée. Le smoke compilé vérifie aussi une reconnaissance depuis un fichier Markdown **après coupure du réseau**, la création et le rechargement du carnet, en complément des parcours existants de carte, sauvegarde et restauration.

Vérifications exécutées sur cette version : **178/178 tests unitaires**, typage produit/tests, lint, build/intégrité, SQL en mémoire et **76/76 tests navigateur** (53 + 3 + 20), dont six nouveaux scénarios d'import local. Les trois scénarios du service IA restent explicitement simulés ; ils ne sont pas une preuve d'inférence réelle.

Échecs intermédiaires : les sélecteurs de trois tests de textarea ont été corrigés pour viser son rôle accessible ; un premier essai de téléchargement a dépassé le délai, puis le parcours a réussi dans le gate avec le délai normal. Le premier gate s'est arrêté au lint : les noms `useCity`/`useDay` faisaient analyser les fonctions du parseur comme des hooks React et le filtre binaire utilisait une expression régulière de caractères de contrôle interdite. Les fonctions ont été renommées, le filtre utilise les codes des caractères ; aucun contrôle n'a été désactivé. Les 53 tests ciblés fichiers/parseur et leur lint ont ensuite réussi.

**Gate final `npm run verify:local` réussi : 21/21 étapes, code 0, aucune étape omise, `sourceUnchanged: true`.** [Preuve complète](import-recognition-validation.json). Les dix smokes compilés passent, dont reconnaissance réelle d'un fichier Markdown après coupure réseau, dates/heures/suggestion conservées, création puis rechargement, carte sans coordonnées inventées et export réel restauré dans un autre profil. Aucun échec restant dans le gate exécuté.

Build testé : `2727d07f622b8e03863680b919ade3819889d26383565dc6d845e33661ec4a35`. Node 24.15.0, Chrome installé, profils jetables, DNS externe bloqué, backend et sessions simulés. Les captures de revue mobile et de reconnaissance hors ligne ont été inspectées ; aucun débordement horizontal observé. Captures temporaires : `C:/Users/eliot/AppData/Local/Temp/detours-planning-import-RktcCI`. L'appareil physique, Safari, OAuth réel et l'inférence IA distante restent non testés.

## Choix concernant les modèles

[Recherche Hugging Face et protocole de comparaison](IMPORT-RECOGNITION-MODELS.md). Aucun modèle n'a été téléchargé, entraîné ou exécuté ; aucun appel payant n'a été effectué. La reconnaissance locale débloque le parcours immédiatement. L'intérêt d'un modèle pour la prose difficile devra se mesurer sur les mêmes sources et sur un lot inédit, en comptant aussi les pertes, inventions et erreurs d'affectation.

## Essai et retour arrière

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

Ouvrir l'accueil, importer un planning, relire les journées et lieux, renseigner devise/fuseau puis créer le carnet. Les exemples fictifs précédents restent clairement identifiés comme démonstrations : charger un exemple ne prouve pas la reconnaissance de son texte.

Une instance de développement a été démarrée à `http://127.0.0.1:5174/` à la fin de la validation, avec services distants désactivés. Cette adresse n'est disponible que tant que le serveur local tourne ; ce n'est pas une publication de la bêta distante.

Fichier prêt à ouvrir dans le parcours : [planning-import-demo.md](../examples/planning-import-demo.md). Il contient deux journées fictives, des sous-titres Matin/Après-midi, des heures, une suggestion et un tableau Markdown.

Le code est local à cette branche. Aucun déploiement, modification de base distante, achat, entraînement ou fusion dans la base partagée n'est effectué. Le build du gate utilise une configuration factice et n'est pas un build à publier. Les contrôles locaux ne prouvent ni OAuth réel, ni un service IA réel, ni un appareil physique.

Pour revenir au code précédent, conserver une sauvegarde exportée des carnets et utiliser le commit `bbe9e25` dans un checkout distinct. Les carnets créés restent des archives Détours ordinaires ; aucun format serveur n'a été migré et les données du navigateur ne doivent pas être effacées.


## Lot 01 — amélioration locale du 18 octobre 2026

Titres décorés et cités, minuscules en contexte de journées, flèches ASCII, jours de semaine, mois abrégés explicites, continuité de tableau et texte déjà extrait d’un PDF sont mieux reconnus. Un hôtel non choisi estimé reste en notes. L’aperçu affiche les passages à vérifier, leur source et les opérations de correction ou de conservation comme note, avec reprise des décisions. Les alternatives conditionnelles restent facultatives et à vérifier.

Corpus difficile historique inchangé : **18/36 → 27/36 plannings conformes**, **75/114 → 85/114 activités séparées**, **66/114 → 83/114 bien rattachées** ; aucune régression des 18 cas initialement conformes. Lot inédit figé : **11/24 → 24/24 structures conformes** sur six motifs répétés dans quatre langues ; cela ne prouve pas la compréhension générale. Les chiffres et validations des sections précédentes restent historiques. [Rapport, résultats séparés, limites et retour arrière](import-fiable-lot-01/RAPPORT.md).


## Import structuré avec son IA — lot 03 bis

Le kit autonome FR/EN/ZH/ES et l’import `.detours.json` prolongent le panneau de préparation. [Guide utilisateur et contrat public](IMPORT-IA-STRUCTURE.md), [rapport et preuves](lot-03-bis-kit-import/RAPPORT.md). Cette voie valide le schéma puis adapte directement les objets vers l’aperçu : elle ne passe pas dans le parseur heuristique décrit ci-dessus et ne mesure pas la qualité d’une IA externe. Sa provenance désigne le fichier reformatté, jamais le planning personnel original non fourni. Les protections de citations des autres voies sont maintenues. Aucun service supplémentaire ; le lot 06 reste prévu ultérieurement.
