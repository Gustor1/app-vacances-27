# Validation locale — 2 novembre 2026

Cette page distingue les exécutions originales, les reprises justifiées et la portée des résultats. Aucun test ni assertion du dépôt n’a été corrigé. Seuls des lanceurs d’audit sous ce nouveau dossier ont été créés pour les ports, les sorties et l’ordonnancement.

## Environnement et sécurité des données

- Windows, Node `v24.15.0`, dépendances déjà installées ; pas de `npm ci` inutile ni de modification du lockfile.
- PGlite trouvé hors dépôt : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.
- Chrome installé dans `C:/Program Files/Google/Chrome/Application/chrome.exe`. Le channel Chrome implicite de Playwright cherche un autre chemin : l’exécutable explicite a été utilisé pour les reprises. WebKit existe pour les smokes qui le sélectionnent.
- Backend factice : `https://detourstest.supabase.co`, clé publique de fixture. Profils neufs, données fictives. DNS externe bloqué par les options de lancement existantes (`DETOURS_LOCAL_VERIFY=1`), routes API simulées lorsqu’elles sont nécessaires.
- Pas de compte réel, clé privée, migration distante, connexion OAuth, déploiement ou écriture de données personnelles.
- `dist/` est le **build de validation factice du gate**, identité `4907752d02f39f89d33753841f5dbec16ed9d2faa101ec26325b90f72ae0425d` ; ce n’est pas un candidat à publier.

## Gate demandé

Commande exécutée : `npm run verify:local`, avec `DETOURS_PGLITE_PATH` défini. Log complet : [gate.log](preuves/gate.log), rapport original : [gate-validation.json](preuves/gate-validation.json).

| Étape | Résultat original |
|---|---|
| Types produit | réussi |
| Types tests/configurations | réussi |
| Lint | réussi |
| Tests unitaires | **336 réussis, 0 échoué, 0 ignoré** |
| Build Vite | réussi, avertissement de taille de chunks conservé |
| Service worker/manifeste | réussi, 113 fichiers préparés |
| Intégrité du build | réussi, 111 assets vérifiés |
| Compatibilité SQL L6 | réussi, base en mémoire |
| Tests navigateur retenus | **bloqué par environnement**, code brut 1 : port 5173 occupé |
| 26 étapes suivantes | **non exécutées par cette invocation** |

Le gate comporte **35 étapes : 8 réussies, 1 arrêt d’environnement et 26 non exécutées**. Il n’est pas présenté comme vert. Le serveur existant n’a pas été arrêté. Les étapes indépendantes ont ensuite été lancées séparément ; types/lint/unitaires/build/SQL L6 réussis n’ont pas été répétés.

L’empreinte du gate est `67464bc48eb439867fa0a5c0266c1fd985a78011953b91bde4bc0fe59fedae1f`, documentation exclue. `sourceUnchanged=true` dans son rapport.

## Reprise des tests navigateur

Inventaire : **249 scénarios dans 38 fichiers** de la configuration principale, plus **3 scénarios** d’analyse simulée dans un 39e fichier/configuration séparée.

1. La première reprise sur 5181 a rencontré un autre serveur existant (`detours-design`) et n’a lancé aucun test. Preuves : `e2e-all.log`, `e2e.json`. Pas de serveur tiers réutilisé ou arrêté.
2. La reprise sur 52981 a exposé un problème du lanceur d’audit : ses traces HTML étaient stockées sous `docs/`, donc surveillées par Vite. Le serveur d’observation affichait explicitement des `page reload .../traces/resources/...html`. Plusieurs tests ont subi un rechargement en cours de parcours. Cette invocation a été interrompue ; **12 réussites** sont conservées dans `e2e-first-passed.json`, les échecs/interruptions originaux dans `e2e-all-retry.log` et `e2e-results/`.
3. Le lanceur a placé les traces dans le dossier temporaire externe `detours-audit-e2e-20261102` et utilisé le port 52982. Les **237 autres scénarios**, comprenant les échecs contaminés et les non-exécutés, ont été lancés sans répéter les 12 réussites. Les six scénarios qui avaient échoué avant la première interruption ont ensuite réussi sans modification du produit. L’exécution a été interrompue avec disparition de ses processus après **98 résultats terminés : 94 réussis, 4 échoués** ; elle n’a pas produit son JSON final. Son log et ses traces restent des preuves des scénarios réellement terminés, pas de toute la sélection de 237.
4. Les **139 scénarios encore sans résultat terminé** ont été repris sur 52983, avec sorties externes distinctes. Les 110 résultats déjà terminés (12 + 98, y compris les 4 échecs dont la cause était identifiée) n’ont pas été répétés. Preuves : `e2e-completed-before-final.json`, `e2e-final.log`, `e2e-final.json`, puis copie des traces après arrêt du serveur. Le bilan additionne ces ensembles disjoints ; il ne traite pas les scénarios exclus de la reprise comme ignorés.

Les scripts de reproduction sont `preuves/audit.playwright.config.mts`, `preuves/resume-e2e.mjs`, `preuves/resume-e2e-final.mjs` et `preuves/run-independent.mjs`. Les logs conservent les erreurs initiales de ports/sorties et l’interruption ; le rapport ne transforme pas ces tentatives en réussites.

### Limite des URL fixées dans certains tests

`l2-accessibility.spec.ts:7` crée ses quatre contextes sur **5173**, et `full-backup.spec.ts:29,102` fait de même pour un contexte secondaire dans deux scénarios. Ces six scénarios ne dépendent donc pas entièrement du `baseURL` du lanceur. Le processus 5173 appartient au même checkout. Un contrôle en lecture seule des source maps a confirmé l’égalité exacte de quatre sources servies (`main.tsx`, `App.tsx`, `JourneysApp.tsx`, `backup.ts`) avec les fichiers actuels : [port-5173-source-check.json](preuves/port-5173-source-check.json).

Leurs profils demeurent jetables et le navigateur bloque le DNS externe. La configuration publique du serveur 5173 n’a pas été contrôlée ni modifiée. Le résultat de ces six scénarios est donc rapporté avec cette limite ; il n’atteste pas une exécution entièrement sur le serveur factice dédié. Recommandation de tests : dériver leurs contextes de l’URL configurée plutôt que d’un port fixe.

## Échecs de tests identifiés

### T01 — trois attentes Amap obsolètes, P2 outillage

- `audit-features.spec.ts:75`, « hébergement conserve nom chinois et adresse précise dans Amap ».
- `audit-features.spec.ts:139`, « adresse personnelle ajoutée au programme conserve sa recherche Amap ».
- `journey.spec.ts:12`, « naviguer entre villes et journées puis rechercher un lieu chinois ».

Les trois tests attendent un lien Amap (deux cherchent `Ouvrir dans Amap`, le troisième `/Amap/`) sans sélectionner la préférence correspondante ni ouvrir les actions du lieu. Or `src/map-preferences.ts:5–7` choisit Google par défaut ; `MapActions.tsx` expose un volet d’actions et un libellé Amap différent. Les captures/snapshots montrent le lieu, le nom local et l’adresse correctement conservés ; l’attente finale est introuvable. Les tests dédiés `l5-maps.spec.ts` exercent explicitement les deux fournisseurs et passent.

Conclusion : défaut de maintenance des tests, **pas preuve de perte d’adresse ni de recherche cartographique cassée**. Recommandation : actualiser ces trois scénarios autour du choix explicite du fournisseur et de l’ouverture des actions, ou conserver leur objectif de navigation sans dupliquer l’ancien libellé. Effort 0,5 j, risque faible ; relancer ces trois scénarios et les contrôles cartes ciblés, sans modifier le produit pour satisfaire l’ancien texte.

### T02 — smoke L4 hors ligne, délai du contrôle à instruire

Première exécution : `smoke-l4-offline.log`, échec sur `scripts/smoke-l4-offline.mjs:29`. Après suppression fictive d’un module différé du cache, le bouton Vérifier demeure désactivé au terme de l’attente de 5 s. Le code du produit relit et hache les ressources du manifeste ; le test n’a pas encore atteint l’assertion d’état `offline-missing`.

Ce résultat ne prouve ni un cache déclaré prêt à tort ni une perte de notes. Une reprise exacte et isolée en fin de batterie est nécessaire pour distinguer sensibilité au temps d’exécution et blocage reproductible. Le résultat final de cette reprise figure dans le bilan ci-dessous. Aucun délai/assertion n’a été relâché.

Si l’échec persiste, prévoir **0,5–1 j** d’investigation de la durée de relecture du cache et de son protocole, priorité P2. Risque d’une optimisation future : certifier un cache incomplet si l’on raccourcit la vérification ; conserver les contrôles d’intégrité et l’état de chargement explicite.

### T03 — smoke palette, comparaison historique bloquée

`smoke-palette-claire.log` : les **12 combinaisons de rendu** ont passé leurs assertions (Chrome 320/390/430/1440 clair/sombre, WebKit 390/1440 clair/sombre), puis le script échoue en lisant `docs/development/palette-claire/before.json`, absent du sandbox.

Il a donc réussi la partie actuelle de rendu et l’assertion d’absence d’erreurs runtime, mais **pas le contrôle entier**. La comparaison finale repose sur une baseline historique destinée à prouver un sombre inchangé ; sa pertinence pour la typographie et l’interface actuelles n’est pas établie. Aucun fichier historique n’a été réécrit pour le faire passer ; le script entier n’a pas été relancé inutilement après ses 12 réussites.

Recommandation : expliciter les entrées et la cible historique de ce script, ou séparer le contrôle de rendu actuel de la comparaison historique. Effort 0,5 j, risque faible. Ce n’est pas un bug du mode sombre démontré.

### T04 — couverture tactile à ne pas surinterpréter

`floating-mascot.spec.ts:53` teste des événements `pointerType=touch` dispatchés dans un contexte mobile et remplace le primitive de capture de pointeur. Il valide les handlers/cancel/persistance, mais ne simule pas l’arbitrage natif touch-action/défilement. Sa réussite ne tranche donc pas R09. Les vrais gestes synthétiques du test de navigation glass concernent un autre composant.

### T05 — deux valeurs alpha obsolètes, P2 outillage

`liquid-glass.spec.ts:4` échoue à 320 et 390 px sur la même attente : après défilement, le fond devrait finir en alpha `0.96`, mais il vaut `rgba(247, 242, 233, 0.98)`. Les assertions précédentes de taille, centrage et cibles ≥44 px ont passé. La valeur observée correspond exactement à `paletteTokens('signature','light')['--liquid-opaque']` ; le test impose l’ancienne valeur sans tenir compte de la palette actuelle. Les contrôles dédiés de palettes et de contraste passent.

Conclusion : assertion de style non actualisée, pas de dock non cliquable démontré. Recommandation : expliciter la palette du scénario et son contrat visuel, ou vérifier les invariants de lisibilité/position/transition plutôt qu’une ancienne valeur alpha unique. Effort 0,5 j, risque faible ; ne pas changer le CSS produit pour retrouver arbitrairement 0.96.

Les tests de palettes mesurent des surfaces/contrôles sélectionnés, pas chaque texte rendu. Leur réussite ne contredit donc pas le contraste insuffisant du nom local R02, qui échappe à cet échantillon. De même, les tests L2 vérifient les onglets, le focus, le clavier et les dates civiles ; ils ne sont pas un audit complet de lecteur d’écran ou de conformité WCAG.

## Reconnaissance locale : résultats actuels et limite importante

- [planning-evaluation.json](preuves/planning-evaluation.json) : **42/42 cas**, **219/219 contrôles**, zéro échec. Le document public embarqué est parcouru à titre structurel, sans évaluation sémantique indépendante.
- [planning-stress/results.json](preuves/planning-stress/results.json) : **27/36 plannings conformes**, **9 non conformes**, zéro exception, **85/114 activités séparées**, **83/114 bien rattachées**, zéro erreur sur les champs annotés. Le script sort avec code 0 parce qu’il produit une évaluation, **pas parce que les 36 cas sont conformes**.
- Le corpus est volontairement difficile et non représentatif ; il comporte notamment un cas allemand hors des quatre langues ciblées. Ne pas transformer 27/36 en taux de réussite général de Détours. Les commentaires historiques du rapport généré ne remplacent pas ses résultats JSON actuels.
- Complément actuel : parser + `reviewPassages` rejoués sur les cas 10/16/28, résultats dans [stress-review-check.json](preuves/stress-review-check.json). Cas 16 (correction finale) et 28 (chinois compact) sont signalés pour relecture. Cas 10 (Toulouse compact) produit une seule proposition pour cinq lieux, **aucun passage signalé**, trois lieux absorbés dans un titre sans activités. Ce dernier a été reproduit visuellement, après ajout d’un titre fictif : [capture](preuves/import-compact-observe.png), [arbre accessible](preuves/import-compact-ax.txt). Aucun carnet final n’a été créé dans cette reproduction.

R11 du rapport traite l’absence d’alerte du cas 10 comme bug confirmé. L’original reste récupérable ; aucune perte irréversible de source n’est alléguée. Les neuf divergences du corpus ne sont pas neuf bugs distincts déduits sans analyse.

## Performances frontend

`measure-l8` a terminé les **5 répétitions × 2 tailles**, sans erreur runtime, avec métriques présentes. [Résultat original](preuves/performance.json).

| Médiane | Petit corpus (3 voyages, 36 activités) | Grand corpus (60 voyages, 15 360 activités) |
|---|---:|---:|
| Accueil peint | 21,25 s | 25,93 s |
| Ouverture du carnet | 4,15 s | 5,09 s |
| Carte | 0,76 s | 0,92 s |
| Octets stabilisés | 2 412 436 | 3 614 122 |
| Couvertures demandées | 3 / 3 | 9 / 60 |
| Saisie note, médiane | 123,5 ms | 133,6 ms |
| Recherche, médiane | 56,7 ms | 61,9 ms |

Conditions : CPU ×4, téléchargement 200 000 octets/s, latence 80 ms, aucune compression, cache HTTP désactivé, service worker bloqué, mouvement réduit, réseau externe bloqué, Chrome 156.0.8078.74. **La suite E2E tournait sur le même PC pendant ces mesures** : charge concurrente non contrôlée, maxima et durées d’ouverture dispersés. Ce sont des observations de cette exécution sous contrainte, pas des temps utilisateur réels, une régression avant/après ou des vitaux Web terrain.

Le code 0 prouve que les mesures existent et les parcours aboutissent ; le script ne comporte pas de seuil de rapidité à respecter. Les octets et le chargement différé des couvertures sont plus directement interprétables que les temps sous charge. R12 recommande une mesure isolée puis un découpage justifié de l’import direct d’App ; aucun gain n’est promis sans cette mesure.

## Contrôles supplémentaires et résultats détaillés

Le bilan chiffré final des exécutions indépendantes, les mesures et les corpus est ajouté ci-dessous à partir des JSON et logs produits, et non d’un rapport antérieur.

<!-- FINAL-RESULTS -->
## Bilan final des exécutions

| Famille | Réussis | Échoués / non conformes | Bloqués / non exécutés |
|---|---:|---:|---|
| Gate original (35 étapes) | 8 étapes | arrêt brut code 1 à l’étape navigateur | port 5173 occupé ; 26 étapes non lancées par ce gate |
| Unitaires | 336 | 0 | 0 ignoré |
| E2E principal, ensembles disjoints | 244/249 | 5 | 0 ignoré, 0 flaky déclaré par Playwright |
| Analyse planning simulée | 3 | 0 | 0 |
| SQL supplémentaire | 3 scripts | 0 | 0, bases en mémoire |
| Smokes compilés distincts | 21/22 après reprise ciblée | aucun échec de parcours restant ; L4 a échoué au premier passage | comparaison palette historique bloquée après 12 rendus réussis |
| Corpus de reconnaissance structuré | 42/42, 219 assertions | 0 | 0 |
| Corpus de stress | 27/36 conformes | 9 non conformes | 0 exception ; pas un taux de précision représentatif |
| Mesure L8 | 10 mesures | aucun seuil temporel testé | vitaux Web terrain et mesure isolée non réalisés |

Les échecs E2E finaux ne sont pas requalifiés en réussites : les trois attentes Amap et les deux attentes alpha décrites en T01/T05 sont obsolètes. Les six échecs contaminés du premier dispositif ont été rejoués et réussis ; ils restent visibles dans leurs logs mais ne sont pas comptés deux fois.

### Reprise L4 hors ligne

Code final **0**, après fin de la suite principale et du runner de mesures : [résultat](preuves/offline-retry.json), [log](preuves/smoke-l4-offline-retry.log). Les mêmes assertions ont passé dans un profil neuf, sans changement de code, d’attente ou de permission. Sensibilité au temps/charge locale : l’échec initial reste documenté, sans le présenter comme un défaut de persistance.

### Résultats indépendants bruts

| Contrôle | Code original | Interprétation | Preuve |
|---|---:|---|---|
| planning-analysis | 0 | réussi | [log](preuves/planning-analysis.log) |
| test-sql-local | 0 | réussi | [log](preuves/test-sql-local.log) |
| test-collaboration-sql-local | 0 | réussi | [log](preuves/test-collaboration-sql-local.log) |
| test-participation-money-sql-local | 0 | réussi | [log](preuves/test-participation-money-sql-local.log) |
| smoke-production | 0 | réussi | [log](preuves/smoke-production.log) |
| smoke-backup | 0 | réussi | [log](preuves/smoke-backup.log) |
| smoke-ui | 0 | réussi | [log](preuves/smoke-ui.log) |
| smoke-common-sharing | 0 | réussi | [log](preuves/smoke-common-sharing.log) |
| smoke-l4-offline | 1 | échec initial ; reprise exacte isolée réussie | [log](preuves/smoke-l4-offline.log) |
| smoke-l4-persistence | 0 | réussi | [log](preuves/smoke-l4-persistence.log) |
| smoke-l5-now | 0 | réussi | [log](preuves/smoke-l5-now.log) |
| smoke-l6-preparation | 0 | réussi | [log](preuves/smoke-l6-preparation.log) |
| smoke-l8-release | 0 | réussi | [log](preuves/smoke-l8-release.log) |
| smoke-planning-structured | 0 | réussi | [log](preuves/smoke-planning-structured.log) |
| smoke-planning-documents | 0 | réussi | [log](preuves/smoke-planning-documents.log) |
| smoke-companion | 0 | réussi | [log](preuves/smoke-companion.log) |
| smoke-souvenirs | 0 | réussi | [log](preuves/smoke-souvenirs.log) |
| smoke-assistant | 0 | réussi | [log](preuves/smoke-assistant.log) |
| smoke-mascot | 0 | réussi | [log](preuves/smoke-mascot.log) |
| smoke-places | 0 | réussi | [log](preuves/smoke-places.log) |
| smoke-pwa-mobile | 0 | réussi | [log](preuves/smoke-pwa-mobile.log) |
| smoke-app-update | 0 | réussi | [log](preuves/smoke-app-update.log) |
| smoke-install-manifest | 0 | réussi | [log](preuves/smoke-install-manifest.log) |
| smoke-planning-import | 0 | réussi | [log](preuves/smoke-planning-import.log) |
| smoke-notebook | 0 | réussi | [log](preuves/smoke-notebook.log) |
| smoke-palette-claire | 1 | 12 rendus réussis ; comparaison historique bloquée (fixture absente) | [log](preuves/smoke-palette-claire.log) |
| measure-l8 | 0 | 10 mesures produites ; aucun seuil de rapidité vérifié, charge concurrente | [log](preuves/measure-l8.log) |
| evaluate-planning | 0 | réussi | [log](preuves/evaluate-planning.log) |
| evaluate-planning-stress | 0 | évaluation produite : 27/36 conformes, 9 non conformes | [log](preuves/evaluate-planning-stress.log) |

SQL détaillé : 35 contrôles du script de base ; 27 contrôles historiques et scénario de carnet commun avec rollback ; 31 contrôles participation/monnaie. Le SQL L6 du gate est distinct et réussi. Aucun de ces résultats ne prouve Supabase Auth/PostgREST distant.

### Contrôles non exécutés

Réseau Supabase/taux/Wikimedia, OAuth réel, comptes/appareils physiques, tests de déploiement distant, scripts de génération et benchmarks API/modèles : hors périmètre autorisé. La comparaison historique palette n’a pas abouti. Zoom navigateur réel200 %, lecteur d’écran et FPS/vitaux Web terrain non réalisés. Voir COUVERTURE.md pour les limites de chaque surface.

### Résumé machine exploitable

[RESULTATS.json](preuves/RESULTATS.json) rassemble les 249 résultats E2E, les codes indépendants, la reprise L4 et les deux corpus. Les rapports et logs originaux sont conservés ; aucune réussite n’est déduite d’un test non exécuté.
