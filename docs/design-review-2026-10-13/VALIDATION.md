# Validation finale — 13 octobre 2026

`npm run verify:local` **RÉUSSI : 19/19 étapes**, code de sortie 0, sources stables (`sourceUnchanged: true`). 104 tests unitaires et 57 tests navigateur retenus (37 + 20), types, lint, SQL PGlite isolé, build, intégrité, worker et neuf smokes compilés réussis. Aucun contrôle du gate omis. Preuve structurée : [validation.json](validation.json).

Chrome : `C:/Program Files/Google/Chrome/Application/chrome.exe`, via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. PGlite externe : `../detours-test-tools/node_modules/@electric-sql/pglite/dist`, via `DETOURS_PGLITE_PATH`. Backend simulé, pas de service distant validé.

Première exécution : les 19 étapes avaient réussi mais l'empreinte source avait changé à cause de la création simultanée des prototypes ; résultat global déclaré en échec, puis gate intégral relancé sur fichiers stabilisés. La seconde exécution ci-dessus est la preuve finale.

Prototypes contrôlés séparément dans le navigateur intégré : six vues à 320, 390 et 640 px, douze captures ordinateur/mobile inspectées, filtrage, navigation, cases, détails, Escape/retour du focus, ajout simulé/réinitialisation et focus Tab visible. Aucune erreur ou alerte console relevée sur la page prototype. Syntaxe `app.js` et `server.mjs` vérifiée avec `node --check`. Serveur : fichiers attendus 200, `.env.local`, `server.mjs` et chemin parent 404 ; CSP interdisant connexions et scripts externes.

Le lint du dépôt n'applique pas ses règles produit aux fichiers JS des prototypes : son succès ne remplace pas les contrôles navigateur et de syntaxe séparés ci-dessus. Le gate ne teste pas ces prototypes comme s'ils étaient déjà intégrés au produit.

Préservation : 297 fichiers initiaux identiques par SHA-256, bundle Git valide et complet. [preservation-check.json](preservation-check.json). Les 15 images référencées par la galerie existent ; 20 captures au total, environ 3 Mo. Aucun fichier suivi modifié ; seuls les deux nouveaux dossiers de cette mission s'ajoutent aux quatre documents non suivis préexistants.

Limites : reflow 640 px équivaut à la largeur disponible d'une fenêtre 1280 px à 200 %, sans test de zoom physique ; aucun iPhone/Safari réel ni lecteur d'écran. La palette a été calculée sur six paires principales, pas auditée exhaustivement. Les prototypes sont français, sans données persistées ni véritable import. Les tests locaux ne prouvent ni OAuth ni des permissions serveur réelles. `dist/` est un build factice du gate et ne doit pas être publié.
