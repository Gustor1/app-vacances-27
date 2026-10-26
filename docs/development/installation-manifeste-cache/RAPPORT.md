# Installation — manifeste périmé conservé par un ancien worker

26 octobre 2026. Correction du titre encore abîmé dans la fenêtre d'installation Chrome après la première publication.

## Cause reproduite

Le manifeste servi par le réseau contient bien `Détours`. Un navigateur déjà contrôlé par le service worker précédent peut toutefois recevoir l'ancien `/manifest.webmanifest` depuis Cache Storage. La navigation récupère le nouvel HTML, mais les autres requêtes utilisent d'abord le cache. Même `fetch(..., { cache: 'no-store' })` ne contourne pas cette stratégie du worker.

Reproduction sur la bêta publiée dans un profil Chrome jetable : ancien manifeste placé dans le cache de ce profil uniquement, puis rechargement. Résultat observé : nom réseau `Détours`, nom lu dans la page et nom analysé par Chrome `DÃ©tours â€” Mes voyages`. Les carnets du navigateur utilisateur n'ont pas été ouverts ni modifiés.

Le nouveau smoke reproduit aussi cet état localement et échouait avant correction avec `Chrome installation must receive the corrected name while the old worker is still active`.

## Correction

Vite ajoute à l'URL du manifeste une version dérivée de son contenu SHA-256. Le nouvel HTML référence `/manifest.webmanifest?v=<empreinte du contenu>`. Cette URL ne correspond pas à l'entrée canonique de l'ancien cache et Chrome charge le nouveau manifeste. Une future modification du manifeste changera automatiquement cette version.

Le worker prépare également cette URL exacte pour l'installation hors ligne. L'identifiant explicite `/`, le lancement, les icônes et le périmètre de l'application restent conservés. Pas de suppression globale de caches, de données navigateur ou de carnets ; pas d'activation forcée du nouveau worker pendant qu'un ancien onglet est encore ouvert.

## Vérification

- `node scripts/smoke-install-manifest.mjs` : échec reproduit avant correction, réussite après recompilation.
- Lecture du manifeste effectivement analysé par Chrome avec [Page.getAppManifest](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-getAppManifest), et comparaison de l'identité avec `Page.getAppId`.
- Ancien worker toujours actif et entrée canonique encore incorrecte : Chrome reçoit néanmoins `Détours` depuis la nouvelle URL. Après activation normale du nouveau worker et rechargement hors ligne, le titre reste correct.
- Identité de l'app et carnet fictif inchangés. [Preuve Chrome](chrome-manifest.json).
- `npm run verify:local` avec PGlite externe : **gate échoué**, 8 contrôles réussis, un contrôle échoué, 26 non exécutés, `sourceUnchanged=true`. Types, lint, 332 tests unitaires, build, intégrité et SQL passent. Le groupe navigateur a 92 réussites et un dépassement du délai global de 30 secondes dans `companion.spec.ts:15` (`page.reload`). [Rapport exact](validation.json). Ce résultat reste un échec global.

Le scénario Compagnon ciblé a ensuite réussi en 19,9 secondes (25,7 secondes avec démarrage). Son composant, son test et sa fixture sont identiques au snapshot avant correctif. Sa cause de dépassement de délai n'est pas résolue par ce correctif du manifeste ; aucune réussite globale n'en est déduite.

Le test existant de mise à jour ne préparait pas de manifeste périmé dans son ancien cache. Le serveur de test a reçu une option pour ce cas et le smoke est intégré au gate.

## Préservation et publication

Snapshot avant modification : `C:/Users/eliot/Documents/detours-install-title-recovery-20261026`, 1 607 fichiers et bundle Git, base `a6ba26e53cf9edb5bed0bc8256fe40d91fef158b`. Branche dédiée `codex/installation-manifeste-cache` conservant les fonctionnalités déjà publiées. Le premier déploiement corrigé pour les préférences reste disponible comme retour arrière : `dpl_7jny8PyB1CjdjrSBajQLUSvuTWZB`.

Le correctif est publié après contrôles ciblés de mise à jour réussis. L'autorisation de déployer les changements sur la bêta reste celle donnée dans cette conversation. Aucune migration distante ni fusion vers `main` prévue.

Après publication, fermer la fenêtre d'installation déjà ouverte, puis recharger la page avant de la rouvrir : une fenêtre déjà affichée garde les informations de sa demande initiale. Ne pas effacer les données du site pour rafraîchir le titre.


## Vérifications complémentaires et publication

Les scénarios compilés `smoke-app-update.mjs` passent sous Chromium et WebKit (mise à jour différée, cache précédent, formulaires et carnets préservés ; émulation hors ligne WebKit exclue par le script existant). `smoke-install-manifest.mjs` repasse ensuite : ancien titre reproduit, titre corrigé avec l'ancien worker, identité inchangée et nouvelle URL disponible hors ligne. Ces réussites ciblées ne remplacent pas le gate échoué.

Publication sur le projet existant `app-vacances-27`, équipe `eliottle`, à partir du commit poussé `578e1b1e51b9e5b7a48b3e065eeeb661c8b0c16d`. Déploiement preview `dpl_5fTMbJniEiFEFB1X7c64iGcmioh3` READY ; URL https://app-vacances-27-iww4c1xx1-eliottle.vercel.app. Vercel a reconstruit avec la configuration preview existante ; le build local factice n'est pas publié. La route de démonstration `/mascotte/` est conservée.

La preview protégée a été contrôlée via le connecteur : révision du manifeste de build, lien versionné dans l'HTML, nom `Détours` et URL exacte présente dans les ressources précachées du worker. La version du contenu brut diffère entre le build Windows local et le build Linux distant en raison des fins de ligne ; le contrôle distant vérifie l'URL réellement référencée et ne suppose pas la valeur locale.

Alias public : https://app-vacances-27-beta-eliottle.vercel.app/. Ancienne affectation relue immédiatement avant la bascule : `dpl_7jny8PyB1CjdjrSBajQLUSvuTWZB`. Aucun autre domaine, rôle, accès, schéma ou carnet distant modifié.

Build public : `aa5567ba9eb95080adfaaa3b8ed7945194645c709e8815ea836c1c8bcb0fd6a7`, manifeste `/manifest.webmanifest?v=a6c89de356b1`. Les 111 fichiers du build sont vérifiés par taille et SHA-256, ainsi que la réponse de cette URL versionnée ; zéro erreur d'exécution observée. [Contrôle des fichiers servis](served-verification.json).

Un profil Chrome isolé a été ouvert **avant** la bascule publique, avec le titre abîmé dans son cache : [état avant](public-before.json). Il est resté ouvert pendant le déploiement. Après rechargement, alors que son ancien worker est encore actif, `Page.getAppManifest` renvoie `Détours` et `Page.getAppId` garde la même identité. L'entrée canonique périmée est toujours présente pendant cette assertion, ce qui vérifie que le test couvre réellement le cache problématique. Après activation normale du nouveau worker et réouverture hors ligne, le nom reste correct et le carnet fictif reste identique. [Résultat de la mise à jour réelle](public-upgrade.json).

Retour arrière frontend : réassigner seulement l'alias bêta à `dpl_7jny8PyB1CjdjrSBajQLUSvuTWZB` (https://app-vacances-27-aahwde5fn-eliottle.vercel.app). Le déploiement précédent est conservé. Aucune suppression de données utilisateur et aucune rétrogradation SQL.

Limites : le manifeste effectivement analysé par Chrome a été contrôlé via son protocole de diagnostic ; aucune capture du dialogue natif d'installation ni installation système n'est revendiquée. Pas d'essai sur un appareil physique, d'OAuth réel ou d'écriture cloud. Le gate global reste échoué sur le délai du parcours Compagnon, avec ses étapes non exécutées conservées dans le rapport.
