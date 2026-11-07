# Lots suivants proposés, non lancés

Chaque lot part d’un état Git propre conservant le travail existant, sur branche dédiée, sans déploiement implicite. Les résultats de l’audit ne constituent pas une autorisation de correction. Ordre : preuves données/accès, blocages, fiabilité, simplicité puis poids et documentation.

## A — Requalifier les contrôles et les anciennes intermittences

Objectif : un résultat reproductible qui distingue défaut produit et attente du test. Fichiers : `.gitattributes` éventuel, `tests/lot06-benchmark.test.mjs`, `nvidia-import.test.mjs`, `palettes.test.mjs`, `planning-structured.test.mjs`, `tests/e2e/companion.spec.ts`, tests de palettes/thème (`brand-palettes.spec.ts`, `iphone-glass.spec.ts`), `assistant.spec.ts`, `planning-analysis.spec.ts`, scripts smoke import. Dépendance : journaux VALIDATION et copie exacte du SHA.

- [ ] Reproduire le clone Windows CRLF et conserver les cinq assertions avant tout changement.
- [ ] Définir les fins de ligne des fichiers figés sans réécrire les hachages de référence pour masquer l’échec.
- [ ] Relire les traces des intermittences actuelles et répéter trois fois seulement les scénarios concernés à environnement identique.
- [ ] Distinguer attente de démarrage, navigation, verrou/révision et défaut réel de persistance ; instrumenter sans données personnelles si la cause reste inconnue.
- [ ] Modifier uniquement l’invariant fautif établi, en gardant les assertions utilisateur et les refus de conflit.
- [ ] Vérifier clones LF/CRLF, tests ciblés puis gate complet avec PGlite externe et ports libres.

Exclusions : pas de hausse arbitraire des timeouts, retrait de scénario, retry servant de preuve, nouvelle fonctionnalité. Risque : rendre le test artificiellement vert. Retour arrière : commit isolé. Sortie : cause documentée ou limite explicite, gate correspondant au SHA livré ; ne pas promettre le vert avant preuve.

## B — Compléter les preuves d’accès et de récupération

Objectif : borner les hypothèses sécurité/données avant élargissement. Fichiers : `src/cloud/CloudProvider.tsx`, storage/engine, migrations et `src/hooks/useTravelState.ts`, `backup.ts`, `souvenirs.ts` uniquement si défaut confirmé.

Précondition : environnement OS conforme pour sécurité, vrais comptes de test séparés pour recette autorisée. Relire la dernière RPC `202610090001_day_preparation.sql:132-195`. Vérifier résumés lors changement A/B, budget masqué/villes, quotas concurrentiels et suppression sans croissance ; utiliser comptes et carnets factices. Rejouer révocation/lecteur/éditeur, refus serveur, sauvegarde/restauration et interruption. Ne jamais contourner RLS ni modifier la base distante pour réussir un test.

Sortie : verdict vérifié par candidat, données d’autrui jamais utilisées, aucune sévérité sur hypothèse non validée. Exclusions : migrations et mutations distantes non autorisées, sondages de production, ouverture publique. Retour arrière : seulement fixture jetable pour audit ; toute future correction isolée avec test avant/après.

## C — Protéger la saisie et clarifier les sauvegardes

Objectif : retrouver une saisie et savoir quoi sauvegarder. Fichiers : `App.tsx`, `JourneysApp.tsx`, le composant `Modal` exporté par `src/App.tsx`, `BackupPanel.tsx`, quatre locales ; vérifier réutilisation de brouillons existants pour import. Dépendance : UX-01 et DONNEES-IMPORTS.

Choisir confirmation conditionnelle ou brouillon pour éditeurs ordinaires ; ne pas dupliquer le mécanisme de brouillon d’import. Préciser que médias quotidiens demandent paquet distinct. Tests : fermeture Échap/fond/glissement, clavier/focus, mobile, quatre langues, rechargement et quota ; restauration carnet puis médias dans profil vide. Exclusions : nouveau format global, synchronisation automatique des photos, refonte générale. Risque : modal bloquante ou fuite entre comptes ; état lié au voyage/compte. Retour arrière : commit UI isolé. Sortie : protection et texte compris dans parcours actuel, sans altérer données enregistrées.

## D — Réduire le précache et rendre le packaging reproductible

Objectif : ne télécharger que les ressources prévues et reproduire l’atelier public. Fichiers : `public/asia-geography.json`, `scripts/generate-geography.mjs`, `scripts/build-sw.mjs`, scripts de packaging et prototype/README cités dans NETTOYAGE-PROPOSE.

Vérifier tous usages avant retrait d’Asie ; décider du statut `/mascotte/` avant manipulation des copies d’images. Comparer manifestes, cartes Monde/Chine, installation, mise à jour ancien worker et hors ligne. Gain attendu borné : 1 002 221 octets bruts pour Asie ; aucune promesse de latence sans mesure. Exclusions : suppression massive d’assets ou rapports, réécriture Git, changement stack. Risque : ressource dynamique oubliée. Retour arrière : restaurer fichier exact ; mise à jour des caches existante testée en préservant les données utilisateur, sans nouvelle migration par défaut. Sortie : build reproductible, route annoncée présente ou clairement séparée, poids mesuré.

## E1 — Mettre à jour les dépendances

Objectif : traiter les avis applicables dans un lot indépendant de E2. Partir des avis datés dans CONSTATS ; identifier dev/production et chemin réel, choisir correctif compatible, pas `npm audit fix --force`. Vérifier types/lint/unitaires/build/gate et versions installées. Risque : régression compilation/parser ; retour arrière par commit isolé avec ancien lockfile. Sortie : avis retriés et régressions contrôlées.

## E2 — Indexer les documents

Objectif : retrouver les contrats actuels, sans dépendance à E1. Suivre les lignes exactes de NETTOYAGE-PROPOSE : ajouter index canonique, conserver décisions, licences, migrations et preuves d’échecs. Pas d’effacement automatique de `.md`. Risque : perte de contexte documentaire. Retour arrière : commit documentaire isolé. Sortie : liens valides, index canonique et historique accessible.
