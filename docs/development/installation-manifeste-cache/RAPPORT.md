# Installation — manifeste périmé conservé par un ancien worker

26 octobre 2026. Correction du titre encore abîmé dans la fenêtre d'installation Chrome après la première publication.

## Cause reproduite

Le manifeste servi par le réseau contient bien `Détours`. Un navigateur déjà contrôlé par le service worker précédent peut toutefois recevoir l'ancien `/manifest.webmanifest` depuis Cache Storage. La navigation récupère le nouvel HTML, mais les autres requêtes utilisent d'abord le cache. Même `fetch(..., { cache: 'no-store' })` ne contourne pas cette stratégie du worker.

Reproduction sur la bêta publiée dans un profil Chrome jetable : ancien manifeste placé dans le cache de ce profil uniquement, puis rechargement. Résultat observé : nom réseau `Détours`, nom lu dans la page et nom analysé par Chrome `DÃ©tours â€” Mes voyages`. Les carnets du navigateur utilisateur n'ont pas été ouverts ni modifiés.

Le nouveau smoke reproduit aussi cet état localement et échouait avant correction avec `Chrome installation must receive the corrected name while the old worker is still active`.

## Correction

Vite ajoute à l'URL du manifeste une version dérivée de son contenu SHA-256. Le nouvel HTML référence `/manifest.webmanifest?v=2ec90801d61b` pour le manifeste actuel. Cette URL ne correspond pas à l'entrée canonique de l'ancien cache et Chrome charge le nouveau manifeste. Une future modification du manifeste changera automatiquement cette version.

Le worker prépare également cette URL exacte pour l'installation hors ligne. L'identifiant explicite `/`, le lancement, les icônes et le périmètre de l'application restent conservés. Pas de suppression globale de caches, de données navigateur ou de carnets ; pas d'activation forcée du nouveau worker pendant qu'un ancien onglet est encore ouvert.

## Vérification

- `node scripts/smoke-install-manifest.mjs` : échec reproduit avant correction, réussite après recompilation.
- Lecture du manifeste effectivement analysé par Chrome avec [Page.getAppManifest](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-getAppManifest), et comparaison de l'identité avec `Page.getAppId`.
- Ancien worker toujours actif et entrée canonique encore incorrecte : Chrome reçoit néanmoins `Détours` depuis la nouvelle URL. Après activation normale du nouveau worker et rechargement hors ligne, le titre reste correct.
- Identité de l'app et carnet fictif inchangés. [Preuve Chrome](chrome-manifest.json).
- `npm run verify:local` avec PGlite externe : en cours, résultat à compléter.

Le test existant de mise à jour ne préparait pas de manifeste périmé dans son ancien cache. Le serveur de test a reçu une option pour ce cas et le smoke est intégré au gate.

## Préservation et publication

Snapshot avant modification : `C:/Users/eliot/Documents/detours-install-title-recovery-20261026`, 1 607 fichiers et bundle Git, base `a6ba26e53cf9edb5bed0bc8256fe40d91fef158b`. Branche dédiée `codex/installation-manifeste-cache` conservant les fonctionnalités déjà publiées. Le premier déploiement corrigé pour les préférences reste disponible comme retour arrière : `dpl_7jny8PyB1CjdjrSBajQLUSvuTWZB`.

Publication du correctif en attente de validation. L'autorisation de déployer les changements sur la bêta reste celle donnée dans cette conversation. Aucune migration distante ni fusion vers `main` prévue.

Après publication, fermer la fenêtre d'installation déjà ouverte, puis recharger la page avant de la rouvrir : une fenêtre déjà affichée garde les informations de sa demande initiale. Ne pas effacer les données du site pour rafraîchir le titre.
