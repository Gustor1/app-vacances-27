# Nettoyage prudent — inspection du 13 octobre 2026

## Résultat

Aucun fichier supprimé ou déplacé. Le gain probable se situe dans un fond cartographique régional d'environ 1 Mo et dans les sorties locales de tests, pas dans les sources historiques ou les migrations. Deux candidats seulement méritent une investigation avant retrait ; aucune suppression produit n'est validée ici.

Inspection commencée sur `codex/vision-studio-voyages`. Quatre documents non suivis existaient déjà : `CHECKLIST_PERSONNELLE_DETOURS_STUDIO.md`, `DOSSIER_VISION_DETOURS_STUDIO.md`, `IMPLEMENTATION_PLAN_IMPORT_PLANNING_IA.md`, `MISSIONS_IA_NUIT_DETOURS_STUDIO.md`. Ils sont conservés. Pendant cette inspection, l'agent principal a créé la branche `codex/interface-prototypes` ; cette inspection n'a changé ni branche ni index.

## Fichiers utilisés : conserver

| Ensemble | Preuve vérifiée | Confiance / décision |
|---|---|---|
| `src/main.tsx`, `src/components/JourneysApp.tsx`, `src/App.tsx` et composants | `index.html` charge main ; main charge JourneysApp. Les trois couches CSS `styles.css`, `theme.css`, `apple-design.css` sont importées dans main:9–11. | Élevée. La superposition CSS appelle éventuellement une consolidation future, pas une suppression globale. |
| `src/components/WorldView.tsx`, `SourceDocument.tsx` | Imports différés dans JourneysApp:29 et App:70. | Élevée. Leur absence dans un import statique ne signifie pas inutilisation. |
| `src/data/legacy-catalog.ts` | Import journeys:4 et utilisation journeys:54 comme catalogue de référence pour la fusion des anciennes données. | Élevée. Ne pas supprimer malgré le nom « legacy ». |
| `public/documents/planning-original.md`, `bonus-original.md` | URL construite dynamiquement dans SourceDocument:12 ; contrôle explicite du cache dans smoke-production:49. | Élevée. Ressources actives et preuves sources. |
| `public/world-geography.json` | `fetch` dans TripMap:72 et WorldView:29 ; contrôle de préparation hors ligne dans offline:28–39. | Élevée. Généré, mais nécessaire à l'exécution. |
| `public/favicon.svg`, `manifest.webmanifest`, paysages SVG | Icône/manifeste dans index.html, icône dans le manifeste ; paysages référencés dans les données de voyage et le smoke de production. | Élevée. Ne pas traiter `public/` comme un dossier temporaire. |
| `src/components/SharedTrip.css` | Import direct SharePanel:13. | Élevée. Nom historique, usage actuel. |
| `scripts/smoke-sharing.mjs` | Alias explicite de smoke-common-sharing ; commande encore documentée dans README:134 et docs/sync/CONFIGURATION:93. | Élevée. Conserver l'alias de compatibilité ou migrer toutes les commandes avant retrait. |
| `supabase/migrations/*.sql` | Lecture du dossier et application dans l'ordre par test-l6-sql-local:13, test-collaboration-sql-local:16 et test-participation-money-sql-local:20. | Élevée. Les migrations ne sont pas des archives jetables. |
| `tests/*.test.mjs`, `tests/e2e/*.spec.ts` | Découverte par glob dans package.json et par testDir dans les configurations Playwright. | Élevée. Pas besoin d'un import individuel pour être exécuté. |
| Scripts de build, validation, fixtures et leurs déclarations | package.json expose les entrées ; verify-local:22–33 compose types, lint, unités, SQL, navigateur et smokes. Imports dynamiques de PGlite par chemin dans les scripts SQL. | Élevée pour les entrées vérifiées ; pas de certification d'absence de code mort dans chaque fonction. |
| `scripts/snapshot-source.mjs` | Protocole documenté dans L0-L1 ; copie les fichiers visibles Git, conserve l'historique et fournit un manifeste SHA-256. | Élevée. Outil de récupération utile avant changements. |
| `playwright.webkit.config.ts` | Configuration autonome pour les tests sous WebKit ; un outil peut être invoqué via CLI sans import applicatif. | Élevée sur sa fonction. Ne prouve pas une recette sur iPhone physique. |

## Archives utiles : conserver et mieux indexer

| Ensemble | Pourquoi le conserver | Action proposée / confiance |
|---|---|---|
| `docs/transition/deployment-*.json` | Manifeste de livraisons datées, hashes et chemins des ressources publiées. | Ajouter un index par date et préciser « preuve historique ». Élevée. Ne pas les réécrire pour refléter le code actuel. |
| `docs/design/screenshots`, `docs/sync/screenshots`, `docs/transition/screenshots` | Captures liées aux manifestes ou à la documentation. Certains scripts produisent les captures dans ces mêmes dossiers. | Distinguer captures de référence conservées et sorties de nouveaux tests. Élevée. Pas de purge fondée sur le nom ou la date. |
| `docs/development/L0-L1.md` à `L8.md`, `docs/transition/TRANSITION.md`, audits et plans racine | Contrats de migration, limites de validation, reprise et décisions. README référence notamment PLAN-ACTION ; AGENTS référence L8. | Index documentaire « actif / historique / proposé », puis déplacement éventuel avec liens corrigés. Élevée sur la valeur documentaire. |
| Les quatre documents non suivis préexistants | Travail utilisateur présent avant la mission. | Hors nettoyage automatique. Leur destination relève d'une décision éditoriale. Élevée. |

## Fichiers générés : ne pas confondre avec fichiers supprimables

| Ensemble | Nature vérifiée | Politique proposée |
|---|---|---|
| `dist/` | Sortie de build ; build-sw parcourt tous les fichiers, produit build-info et le service worker. Ignoré Git. | Régénérable, mais conserver un build de retour arrière si nécessaire. Le gate génère une configuration de test, impropre à publier telle quelle. |
| `test-results/`, `test-results-multi/`, `playwright-report/`, `*.tsbuildinfo` | Motifs ignorés Git ; les deux dossiers test-results et le tsbuildinfo existent localement. | Purge locale envisageable une fois les traces utiles archivées et les processus arrêtés. Confiance élevée sur la nature, pas sur l'absence de preuve utile dans chaque dossier. |
| `node_modules/` | Dépendances ignorées, réinstallables avec package-lock et npm ci. | Ne pas purger durant la mission ; aucun bénéfice durable pour le dépôt Git. |
| `public/*-geography.json` | Générés par generate-geography:6–9, suivis dans Git. | Le caractère généré n'autorise pas leur retrait : world est actif ; asia demande les contrôles ci-dessous. |
| `.env.local`, `.vercel/` | Configuration locale ignorée, pas un simple cache garanti régénérable. | Exclure de toute purge générique, sauvegarde partagée ou commit. Aucune valeur privée lue pour cette inspection. |

## Candidats à suppression — sous conditions

### 1. `supabase/.temp/cli-latest` — 8 octets

Le fichier est **suivi Git** et contient uniquement une version de CLI. Son emplacement `.temp` et son contenu sont compatibles avec un cache d'outillage, sans rôle métier établi. Aucune référence trouvée dans les sources, scripts, tests et documentation inspectés. **Confiance moyenne à élevée sur la classification temporaire ; moyenne sur le retrait**, car la CLI externe n'a pas été exécutée pour observer sa recréation.

Proposition : dans une contribution séparée, vérifier le comportement de la CLI installée dans un environnement isolé, retirer ce seul fichier du suivi et ajouter une règle ciblée `supabase/.temp/`. Ne jamais étendre la règle à `supabase/` ou aux migrations. Vérifier que les commandes documentées fonctionnent et que le fichier local peut être recréé. Gain disque négligeable ; intérêt principal : éviter les changements parasites de version CLI.

### 2. `public/asia-geography.json` — 1 002 221 octets

**Confiance moyenne.** Preuves positives : le générateur produit ce sous-ensemble régional ; les deux cartes applicatives chargent désormais `world-geography.json`. La recherche de `asia-geography` ne retrouve que le générateur et les anciens manifestes de déploiement. Toutefois le fichier reste copié dans le build et **précaché automatiquement** : build-sw énumère récursivement tout dist. Il a donc encore un coût et un comportement de distribution réels.

Avant retrait : confirmer qu'aucune URL conservée, ancienne version supportée ou intégration externe ne dépend du chemin ; dans une copie isolée, enlever à la fois la sortie et sa génération, comparer manifestes avant/après, ouvrir les deux cartes en ligne puis hors ligne, tester l'actualisation depuis un worker précédent et la restauration d'un ancien carnet. Exécuter `npm run verify:local` et les scénarios production correspondants. Gain attendu : environ 1 Mo brut dans le build/cache, pas une mesure de transfert compressé. Conserver les manifestes historiques intacts. **Aucun retrait effectué.**

## Ordre d'exécution proposé

1. Conserver le snapshot récupérable, le manifeste, l'état Git initial et les fichiers utilisateur non suivis.
2. Indexer les preuves historiques sans déplacer les fichiers dans un premier temps. Séparer à l'avenir les sorties de test des captures de référence.
3. Traiter le cache CLI dans une petite contribution autonome après validation de sa recréation.
4. Traiter le fond régional dans une contribution distincte avec build, migration de worker et cartes hors ligne vérifiés.
5. Évaluer ensuite la consolidation CSS par écran ; elle relève d'une refactorisation avec comparaison visuelle, pas d'un nettoyage mécanique.

Critères de fin : aucun lien documentaire cassé ; aucun document source ou mécanisme de récupération retiré ; carte monde et carte voyage fonctionnelles hors ligne ; anciens carnets restaurables ; tests réellement exécutés consignés ; différences limitées aux candidats approuvés. Retour arrière : revenir au commit précédent de la contribution ou recopier les seuls fichiers concernés depuis le snapshot, sans réinitialiser les modifications utilisateur.

## Contrôles exécutés et limites

Exécuté : lecture AGENTS/README/COLLABORATION, git status et liste des fichiers suivis, inspection package/configurations, git check-ignore des sorties locales, recherches de références dans source/scripts/tests/docs, contrôle des imports différés et URLs construites, découverte des migrations/tests, lecture du générateur géographique et du précache, mesure des trois fichiers cités. Une recherche PowerShell utilisant `scripts/test-*` a été corrigée en `rg ... scripts --glob 'test-*.mjs'`.

Non exécuté par cet audit : suppression expérimentale, régénération, build, tests fonctionnels, CLI Supabase, contrôle distant ou API. Les résultats de validation des prototypes sont consignés séparément par l'agent principal. Une recherche sans résultat ne prouve ni l'absence d'usage externe ni l'inutilité ; l'audit n'est pas un graphe exhaustif de toutes les fonctions/exportations. Aucun nettoyage de données réelles, déploiement ou appel payant.
