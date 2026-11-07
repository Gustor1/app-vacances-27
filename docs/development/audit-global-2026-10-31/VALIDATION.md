# Validation actuelle et limites

Référence `6e319457ec9f20fe5720979640e950b7a4c0dccc`, Windows/Node24.15.0/npm11.16.0, PGlite externe. Preuves : `C:/Users/eliot/detours-audit-20261031/INDEX.md`. Aucune correction produit.

## Gate officiel sur octets Git exacts

`npm run verify:local` : code 1, **8 étapes réussies, 1 échouée, 26 non exécutées**. Empreinte source inchangée : `True`. Sortie `C:\Users\eliot\AppData\Local\Temp\detours-verify-fV893Q`. Build `ee91233738a522d1062fe667865b2a7b97578324e9c810c7256ebfd12d29c035`. Le groupe navigateur rend 92 réussites et 1 échec en 7,7 minutes. Les étapes suivantes exécutées séparément ne rendent pas ce gate vert.

| Étape | Résultat | Début/fin UTC |
|---|---|---|
| types produit | passed / code 0 | 2026-10-31T03:46:59.931Z → 2026-10-31T03:47:09.651Z |
| types tests/configurations | passed / code 0 | 2026-10-31T03:47:09.651Z → 2026-10-31T03:47:14.112Z |
| lint | passed / code 0 | 2026-10-31T03:47:14.112Z → 2026-10-31T03:47:24.278Z |
| tests unitaires | passed / code 0 | 2026-10-31T03:47:24.278Z → 2026-10-31T03:47:30.314Z |
| build Vite | passed / code 0 | 2026-10-31T03:47:30.314Z → 2026-10-31T03:47:47.566Z |
| service worker et manifeste | passed / code 0 | 2026-10-31T03:47:47.566Z → 2026-10-31T03:47:48.059Z |
| intégrité du build | passed / code 0 | 2026-10-31T03:47:48.059Z → 2026-10-31T03:47:48.371Z |
| compatibilité SQL L6 | passed / code 0 | 2026-10-31T03:47:48.371Z → 2026-10-31T03:47:52.998Z |
| tests navigateur retenus | failed / code 1 | 2026-10-31T03:47:52.998Z → 2026-10-31T03:55:38.807Z |

Tests unitaires : **332/332**. SQL : migration L6 additive/idempotente, compatibilité formats et refus de références/champs invalides sur base mémoire ; pas de PostgREST/OAuth réel. Les tests du groupe navigateur couvrent notamment export/restauration, langues, documents, kit structuré, cartes, reflow et compagnon.

## Essais CRLF antérieurs

Premier et deuxième essais : types/lint réussis puis **327/332** unitaires. Fins de ligne converties par Git ; pas de changement logique. La deuxième tentative avait pour intention de rétablir LF, mais checkout-index puis checkout ont laissé les fichiers CRLF existants. Aucun résultat de ces deux essais n’est fusionné avec celui des octets exacts. AUD-01 et REVUE-INDEPENDANTE expliquent les cinq assertions. La réextraction `git archive` a supprimé le facteur CRLF sans modifier le produit.

## Timeout Compagnon : observation et limites

Échec du scénario `companion.spec.ts:12` au premier démarrage : délai global 30s, page.evaluate/goto et snapshot « Détours… ». Trace réseau : React, react-dom, JSX-dev-runtime, lucide-react et Supabase attendent environ 25,5–25,9s côté Vite. Les autres scénarios Compagnon passent. Hypothèse soutenue : optimisation/démarrage à froid du serveur de développement. Pas de perte de données ni refus fonctionnel démontré. Trois répétitions ciblées ont réussi **3/3**, en 42,2s pour la commande complète (scénarios environ10s) ; elles évaluent le cache déjà amorcé et ne recréent pas un démarrage vierge. Commande : `node node_modules/@playwright/test/cli.js test tests/e2e/companion.spec.ts --grep "departure corrections" --repeat-each 3`, avec dossier de sortie externe et mêmes variables factices que le gate. Une première commande grep ancrée n’a sélectionné aucun test ; non comptée comme essai.

## Étapes non atteintes dans le gate

- palettes, logo et préférences
- analyse planning simulée dans le navigateur
- états L4/L5/L6 et préférences dans le navigateur
- smoke-production
- smoke-backup
- smoke-ui
- smoke-common-sharing
- smoke-l4-offline
- smoke-l4-persistence
- smoke-l5-now
- smoke-l6-preparation
- smoke-l8-release
- kit et JSON structurés compilés hors ligne
- PDF et DOCX compilés hors ligne
- compagnon compilé hors ligne
- souvenirs navigateur
- souvenirs compilés hors ligne
- assistant navigateur
- assistant compilé hors ligne
- mascotte navigateur
- mascotte compilée hors ligne
- lieux compilés hors ligne
- PWA mobile compilée
- mise à jour Chrome et WebKit
- titre installation Chrome avec ancien manifeste en cache
- planning compilé, carte, hors ligne et restauration

## Contrôles complémentaires

Les 26 étapes restantes sont exécutées séparément par un orchestrateur externe qui reprend leurs commandes et poursuit après échec. Leurs résultats seront ajoutés ci-dessous ; ni tests ni source du dépôt ne sont modifiés. Même backend factice et ports séquentiels.

## Recette UI compilée actuelle

Sept captures inspectées, corpus et résultats dans `ux/INDEX.md` et UX-PWA. Création abandonnée par Échap reproduite ; import texte fictif → correction → nouveau carnet → rechargement réussi ; activité modifiée conservée ; pas de débordement horizontal à390/1440. Pas de coordonnées inventées pour ce seul exemple. Ne constitue pas une mesure générale de fidélité des imports.

## Contrôles non exécutés et portée

Pas de vrais comptes Google/Supabase, téléphone physique/Safari installé, lecteur d’écran, charge distante, paiement/inférence ou téléchargement de modèles. Pas de performance terrain en millisecondes ni matrice exhaustive écrans × langues × palettes. Pas de preuve dynamique sécurité conforme : run-2 incomplet ; les deux CLI du skill refusent cet OS. npm audit consulte des avis, ne reproduit aucune exploitation. La recette humaine et les gaps des rapports spécialisés restent explicites.

## Interruption explicite du groupe palettes

L’étape complémentaire palettes/préférences (37 scénarios prévus) a été interrompue après neuf résultats terminés : six réussites et trois timeouts — brand-palettes:19 (180s), brand-palettes:67 (30,9s), iphone-glass:5 (30,8s). Les journaux brand-palettes montrent une cible input recouverte par SVG ; les 28 autres scénarios prévus sont interrompus ou non démarrés. Le processus Playwright du groupe et ses descendants ont été identifiés par parent et commande puis arrêtés ; le parent complémentaire a poursuivi les 25 étapes suivantes. Les scénarios restants de cette étape sont non validés, pas réputés échoués ou réussis. Traces conservées dans palettes-interrupted-results ; détail du test indépendant label/clavier dans UX-PWA.

### Diagnostic indépendant thèmes

Douze essais bornés sur preview compilé : `.check()` Clair mobile3/3 passe, bureau0/3 ; Sombre mobile0/3 et bureau0/3, neuf échecs SVG. Les clics label associé passent12/12 ; clavier, focus et persistance après reload passent à390/1440. Douze essais supplémentaires sont un diagnostic UI ciblé, pas un retry de la suite ni une preuve des 28 scénarios manquants. Quatre captures supplémentaires inspectées. Cause test de thème source/DOM établie, aucun blocage utilisateur démontré.

## Résultat final des 26 étapes complémentaires

**22 réussies, 3 échouées et 1 interrompue** (le JSON brut compte l’étape interrompue comme failed/code1). Empreinte source inchangée : true. Orchestration externe distincte du gate ; le rapport brut conserve ses libellés mal décodés, normalisés ici. Sortie : `C:/Users/eliot/AppData/Local/Temp/detours-verify-8w0pZs`.

| Étape | Résultat |
|---|---|
| palettes, logo et préférences | interrompue après 6 réussites/3 échecs ; 28 scénarios non validés |
| analyse planning simulée dans le navigateur | réussie |
| états L4/L5/L6 et préférences dans le navigateur | réussie |
| smoke-production | échouée |
| smoke-backup | réussie |
| smoke-ui | réussie |
| smoke-common-sharing | réussie |
| smoke-l4-offline | réussie |
| smoke-l4-persistence | réussie |
| smoke-l5-now | réussie |
| smoke-l6-preparation | réussie |
| smoke-l8-release | réussie |
| kit et JSON structurés compilés hors ligne | réussie |
| PDF et DOCX compilés hors ligne | réussie |
| compagnon compilé hors ligne | réussie |
| souvenirs navigateur | réussie |
| souvenirs compilés hors ligne | réussie |
| assistant navigateur | réussie |
| assistant compilé hors ligne | réussie |
| mascotte navigateur | réussie |
| mascotte compilée hors ligne | réussie |
| lieux compilés hors ligne | réussie |
| PWA mobile compilée | échouée |
| mise à jour Chrome et WebKit | réussie |
| titre installation Chrome avec ancien manifeste en cache | réussie |
| planning compilé, carte, hors ligne et restauration | échouée |

### Portée des échecs complémentaires

- `smoke-production.mjs:92` et `smoke-pwa-mobile.mjs:99` échouent sur `.check()` Sombre sous SVG, même mécanisme TEST-02. Les premiers contrôles du worker/manifeste dans ces scripts ont pu passer ; les scripts complets restent échoués.
- `smoke-planning-import.mjs:204` échoue après setInputFiles puis reload immédiat ; aucun carnet lu au comparateur. Trois répétitions originales reproduisent l’échec. Diagnostic terminé : la même commande sur une copie externe du script avec attente explicite de la présence du carnet avant reload réussit3/3. Aucune perte après écriture confirmée démontrée.
- Mise à jour : Chromium et WebKit passent ; **hors ligne WebKit explicitement exclu** par le script (Playwright #42775). Aucun iPhone réel.
- Le titre du manifeste avec ancien cache passe sous Chrome, identité et carnet conservés.

### Échecs historiques requalifiés

| Historique | Statut sur ce SHA | Limite |
|---|---|---|
| Assistant révision pendant verrou | Scénario actuel :78 réussi, suite14/14 et compilé hors ligne réussi | Ancienne cause non reconstruite ; pas une preuve de zéro intermittence |
| Planning analyse fenêtre absente | Configuration isolée :3/3 réussis | Ancien échec non reproduit, cause historique inconnue |
| Smoke planning restauration :204 | Reproduit dans complément +3/3 essais originaux | Diagnostic barrière de fin d’import ci-dessous |
| Ancien gate préférences34/34 | Preuve historique conservée | Gate actuel différent et rouge, tests thèmes obsolètes identifiés |
| Compagnon reload/démarrage | Timeout actuel puis3/3 réussites cache amorcé | Trace cold-start, pas de preuve exhaustive démarrage vierge |

## Diagnostic final du smoke restauration

Trois répétitions originales : code1 à equivalentContent:57 appelé depuis:204, aucun carnet dans le profil destination après reload immédiat. Trois exécutions de la copie externe `planning-await-diagnostic.mjs` : code0, parcours entier et comparaison de contenu réussis. Unique changement logique : attente `expect.poll(states.length).toBe(1)` entre choix fichier et reload; imports absolus nécessaires pour exécuter hors dépôt. Aucun script du dépôt corrigé. Les répétitions et diagnostics s’exécutent séquentiellement avec même build/backend factice et profils neufs. TEST-03 établit une course d’orchestration; ces succès ne remplacent pas le résultat rouge du smoke officiel.

## Clôture

Tous les processus de contrôle sont terminés. Preview4179 arrêté après les captures. Le dépôt original ne présente aucune différence suivie ; seuls les deux plans préexistants et le dossier des rapports sont non suivis. Aucun commit, push, déploiement, changement distant, suppression ou correction produit. Les preuves sécurité restent incomplètes; les 28 scénarios palettes interrompus/non démarrés ne sont pas validés.
