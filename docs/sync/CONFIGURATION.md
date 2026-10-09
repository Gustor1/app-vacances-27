# Détours : activer les comptes et vérifier la bêta

Les constats de service distant de ce guide datent du 7 octobre 2026. Le 8 octobre, L3 ajoute des contrôles locaux et harmonise la documentation ; il ne revalide pas l’état de la bêta ou Google. Résultats actuels locaux : [rapport L3](../development/L3.md).

La bêta est accessible à tes amis sans compte Vercel à [l’adresse stable](https://app-vacances-27-beta-eliottle.vercel.app/). Seul ce domaine bénéficie d’une exception de protection Vercel ; les adresses de préversion uniques restent protégées. Les carnets restent privés par défaut, avec authentification Google et droits SQL par voyage. Le mode local reste utilisable sans compte.

Le 7 octobre 2026, Google a été testé avec les deux comptes du propriétaire autorisés pour les essais. Une invitation réelle a été acceptée en lecture seule. **La collaboration est activée côté serveur et dans le build Preview**, après 27 contrôles dans la vraie base Supabase sous le rôle PostgreSQL authentifié (identités existantes, transaction intégralement annulée). Ces contrôles vérifient notamment la confidentialité, les lecteurs/éditeurs, les conflits, la restauration, la rétrogradation et la révocation. Le parcours navigateur valide séparément OAuth et les requêtes de l’application ; le test SQL ne simule pas un échange OAuth. Le second compte a enregistré une modification du planning, reçue par le propriétaire. Celui-ci a restauré une version puis retiré l’accès ; le second compte ne peut plus ouvrir le carnet partagé. Une copie de récupération locale reste exportable, comme prévu.

## Partager avec tes amis

1. Ouvrir un voyage et cliquer **Partager**, ou **Partager et historique** depuis l’accueil. Pour un carnet local, la connexion Google prépare directement une copie dans le compte et conserve l’original ; aucun détour par les sauvegardes n’est nécessaire.
2. **Partager le carnet complet** est coché par défaut : notes, réservations, budget/dépenses, documents et préparation deviennent communs. Vérifier le périmètre puis **Créer un lien privé valable 72 h**. L’envoi des changements est préparé automatiquement. Envoyer soi-même un lien différent à chaque ami : il est utilisable une seule fois. Aucun message automatique n’est envoyé.
3. L’ami ouvre le lien, se connecte avec son propre Google et accepte. Il devient lecteur. L’invitation reste visible même si un autre carnet est déjà ouvert.
4. Tous les membres ouvrent la même interface du voyage. Le bandeau affiche **Partagé par** et **Partagé avec**, avec les emails des seuls membres autorisés. Le propriétaire repère son ami dans **Membres**, puis **Autoriser les modifications**. Les **Options avancées de ce collaborateur** masquent séparément notes, réservations, budget, documents ou préparation. Une catégorie masquée est filtrée côté serveur et ne peut pas être écrasée par ce membre.
5. Le statut et **Voir la synchronisation** sont directement dans le voyage. Les modifications distinctes se réunissent automatiquement. En cas de conflit, **Résoudre les différences** permet un choix par champ ou pour toute une version, puis **Appliquer mes choix**. Les deux sources sont conservées en copies de récupération. Les carnets communs ouverts récupèrent les changements toutes les cinq secondes visibles et en ligne ; les autres caches sont vérifiés chaque minute. Il n’y a pas de curseurs partagés en direct.
6. **Passer en lecture seule** ou **Retirer l’accès** reste réservé au propriétaire. Les nouveaux partages complets utilisent les informations du propriétaire comme source commune. Les anciens partages gardent leur périmètre privé jusqu’à **Activer le carnet commun pour les membres actuels**. « Mon monde » reste personnel. L’historique restaure uniquement le planning et conserve les détails actuels du carnet.

Les migrations d’un projet neuf sont tous les fichiers de `supabase/migrations/`, dans l’ordre. Les migrations jusqu’à `20261007140143_leave_trip_and_money.sql` sont déjà appliquées au projet bêta ; ne pas les réexécuter sur ce projet. Le départ des collaborateurs, les rôles individuels, les taux datés et le convertisseur sont publiés sur la bêta stable depuis le 7 octobre 2026. Voir [les règles de participation et du budget](PARTICIPATION-BUDGET.md).

Dans **Authentication → URL Configuration**, remplacer `http://localhost:3000` par `https://app-vacances-27-beta-eliottle.vercel.app/` dans **Site URL**, enregistrer, puis utiliser **Add URL** pour ajouter exactement cette même URL dans **Redirect URLs**. Pour Google Cloud, ajouter l’origine `https://app-vacances-27-beta-eliottle.vercel.app` (sans slash) au client Web. Le callback Google reste `https://ehvgecfakbxeatrcnfhm.supabase.co/auth/v1/callback`. Utiliser l’adresse stable pour les connexions ; chaque adresse de déploiement unique utilisée directement aurait besoin de sa propre redirection autorisée.

Les variables publiques sont configurées dans `.env.local` (ignoré par Git) et dans l’environnement Vercel **Preview**. Ce déploiement contient un build Vite compilé localement : changer les variables Vercel seules ne modifie pas les fichiers déjà compilés. Reconstruire avec les valeurs voulues avant de republier. Aucune clé privilégiée n’est embarquée dans le client. Contrôles historiques du carnet commun, le 7 octobre : 55 tests unitaires, TypeScript/Vite, smoke UI, production/hors ligne et partage entre deux profils simulés. Les migrations de carnet commun et leurs droits ont été vérifiés séparément dans la vraie base, en annulant toutes les fixtures de test. La connexion Google réelle de cette nouvelle version et les appareils physiques restent à vérifier séparément.

### Retour Google corrigé et vérifié en réel — 7 octobre 2026

L’utilisateur revenait après Google sur `app-vacances-27-d47z8bjxa-eliottle.vercel.app`, une préversion figée antérieure aux corrections d’interface. Lecture du tableau de bord Supabase : **Site URL** et l’unique **Redirect URL** étaient encore cette ancienne adresse. L’application demandait pourtant l’origine de la bêta stable ; celle-ci n’était pas autorisée, donc Supabase utilisait l’ancienne adresse par défaut.

Correction enregistrée dans le projet existant via son tableau de bord : Site URL `https://app-vacances-27-beta-eliottle.vercel.app/`, ajout de cette même adresse exacte aux Redirect URLs, ancienne entrée conservée pour compatibilité. Rechargement du tableau de bord : les valeurs sont persistées. Aucune clé, table, donnée ou politique SQL modifiée.

Vérification dans le navigateur utilisateur : connexion Google réelle avec le compte propriétaire déjà autorisé, retour à l’origine stable, session ouverte et menu **Mon compte** contenant sauvegardes, synchronisation et **Se déconnecter**. Les onglets ont leur style dès ce retour (rayon 24 px). Aucun nouveau déploiement requis et aucun code d’authentification ou jeton enregistré dans les preuves. Cela valide ce retour OAuth avec un compte ; les vérifications à deux comptes effectuées ensuite sont consignées en tête de ce document.

## Mise en route

1. Créer un projet Supabase dédié à la bêta dans une région adaptée au public. Conserver le mot de passe PostgreSQL dans un gestionnaire de secrets.
2. Appliquer les fichiers de `supabase/migrations/` dans l’ordre dans ce projet neuf. Ils sont transactionnels ; ne pas les réexécuter sur une base déjà initialisée. Pour une évolution ultérieure, ajouter une nouvelle migration, ne pas modifier une migration déjà appliquée.
3. Créer un client OAuth **application Web** dans Google Cloud / Google Auth Platform. Configurer l’audience de test avec les comptes bêta. Demander uniquement `openid`, email et profil. Renseigner l’URL de callback **fournie par Supabase** dans les URI Google ; enregistrer l’identifiant et le secret Google dans le fournisseur Google de Supabase, jamais dans Vite.
4. Configurer Site URL et Redirect URLs dans Supabase : adresse de la bêta, puis `http://localhost:5173/` et `http://127.0.0.1:5173/` pour les tests locaux. Ajouter chaque préversion autorisée explicitement, sans joker global.
5. Copier `.env.example` dans `.env.local`. Renseigner uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. Ces deux valeurs sont publiques ; la sécurité repose sur les droits SQL. Le client refuse les clés `sb_secret_` et JWT `service_role`. Ne jamais utiliser une variable `VITE_` pour un secret.
6. Sur Vercel, ajouter ces deux valeurs dans l’environnement **Preview**, puis reconstruire. Garder `VITE_ENABLE_COLLABORATION=false`. Aucun changement de production n’est nécessaire pour valider cette bêta.
7. Se connecter avec Google. L’accueil reste vide pour le compte tant que les carnets locaux n’ont pas été rattachés explicitement dans **Mon compte et mes sauvegardes**. Les originaux locaux restent disponibles après déconnexion.

Instructions officielles vérifiées pendant le développement : [Google dans Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [RLS PostgreSQL](https://supabase.com/docs/guides/database/postgres/row-level-security), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started). Revérifier [l’offre Supabase](https://supabase.com/pricing) avant de créer le projet ; les quotas ne sont pas des garanties de disponibilité.

## Validation réelle des droits

Créer deux utilisateurs de test distincts A et B par Google. Pour inclure les droits éditeur dans le script réseau, définir aussi `DETOURS_TEST_EDITORS=true`, après activation serveur. Obtenir leurs jetons **utilisateur** de courte durée dans le navigateur de test. Les conserver uniquement dans l’environnement du processus de test, jamais dans un fichier versionné ou un message. Le script n’utilise pas de clé privilégiée.

Opt-in requis : `DETOURS_ALLOW_NETWORK=1`. Variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `DETOURS_TEST_A_TOKEN`, `DETOURS_TEST_B_TOKEN`.

```sh
npm run test:network:supabase
```

Ce contrôle crée un carnet de test, le partage, vérifie les refus d’accès directs, puis le marque supprimé. Il ne supprime pas les autres carnets. Il laisse l’historique et le tombstone du test ; supprimer physiquement ces fixtures relève d’une opération administrateur séparée. Sans configuration, le script sort avec le code 2 et indique **NON EXÉCUTÉ**.

Compléter dans deux profils / appareils : création et édition entre ordinateur et téléphone ; modification hors ligne, rechargement et reconnexion ; champs distincts puis identiques ; ordre concurrent ; suppression/modification ; coupure pendant l’envoi ; token expiré ; passage d’A à B sans données d’A ; invitation réellement expirée (avancer `expires_at` de la fixture dans le SQL Editor), annulation et révocation ; export d’un travail d’éditeur révoqué. Conserver les preuves et les résultats exacts dans `PLAN-ACTION.md`.

## Activer ou fermer l’édition collaborative

L’édition est déjà activée dans ce projet bêta. La restauration et la file de synchronisation sont communes aux propriétaires et éditeurs. Pour un nouveau projet, après validation des droits :

```sql
update detours_private.settings set editors_enabled=true where id=true;
```

Puis définir `VITE_ENABLE_COLLABORATION=true` dans **Preview** et reconstruire. Tester deux éditeurs, un lecteur, une restauration concurrente et une révocation pendant une édition avant de publier cette capacité. Le drapeau Vite ne donne aucun droit serveur. Pour fermer l’édition, remettre le réglage SQL à `false`, puis le drapeau interface à `false`.

## Stockage, reprise et limites

- Mode local : clés historiques conservées et exports v1/v2 toujours lisibles. Les champs pays/statut sont facultatifs pour les anciens carnets ; absence de statut affichée comme « Idée », aucun pays déduit du titre. Le corps métier reste `version: 1`, l’enveloppe reste v2.
- Comptes : espace `detours-account-v1:<userId>:` distinct des clés locales. Un carnet tient dans une capsule contenant son export, la base serveur, les révisions, l’opération en attente et les versions en conflit. **Une seule écriture localStorage** enregistre les données et la file. Pas de deuxième source de vérité ni migration générale IndexedDB. Web Locks protège les écritures du carnet là où disponible ; PostgreSQL contrôle toutes les révisions à distance.
- Rattachement : identifiant `userId~ancienId`, identifiants de visites liées mappés vers ce carnet. Une nouvelle tentative retrouve la même identité. Deux anciennes sources divergentes provoquent un choix explicite, elles ne sont pas fusionnées par titre.
- Le mode local n’envoie aucune donnée. Les requêtes sont attachées au jeton de la session dont elles utilisent le cache, pour éviter qu’un changement de compte dans un autre onglet les fasse écrire dans le mauvais espace. Un compte ne télécharge que des résumés à l’accueil, puis le contenu à l’ouverture ; seuls les carnets déjà téléchargés sont rafraîchis. Un rafraîchissement par minute intervient uniquement pendant l’usage visible. Les changements sont envoyés après une temporisation et au retour du réseau ou du premier plan ; aucun maintien artificiel du service ni envoi promis application fermée.
- Le planning n’est accessible qu’aux **membres autorisés**. Dans les anciens partages, les détails restent propres à chaque compte. L’activation explicite du carnet commun utilise les détails du propriétaire pour tous les membres, avec filtrage par catégorie. Un changement de périmètre conserve les modifications en attente comme copie de récupération avant de charger les informations autorisées. Les souvenirs et l’identité Google restent propres au compte ; les emails sont visibles uniquement au sein du carnet accepté.
- Les invitations contiennent 32 octets aléatoires, sont stockées hachées, expirent en 72 h et ne servent qu’une fois. Une répétition par le même destinataire est idempotente. Le jeton est dans le fragment du lien ; aucun message n’est envoyé automatiquement.
- La révocation bloque les lectures/écritures serveur futures. Une copie déjà exportée ou un appareil hors ligne reste hors de son contrôle. Le travail refusé reste exportable dans le cache isolé du compte.
- Les suppressions sont des tombstones, jamais des absences interprétées comme créations. Un conflit avec suppression distante oblige à garder la suppression ; l’utilisateur peut exporter et importer une **nouvelle copie**. Les visites personnelles restent intactes.
- Les 30 derniers états **du planning** sont conservés. Restaurer réutilise la file et crée une nouvelle révision, même si le contenu est identique. Les détails courants du carnet et les droits sont préservés. Les résolutions de conflit conservent leurs deux sources en copies locales indépendantes, exportables même après résolution.
- Plafonds initiaux : 100 carnets actifs par propriétaire, 1 Mo par contenu partagé ou privé, 10 000 visites, 30 révisions/carnet et 20 Mo de planning + historique par propriétaire et 20 Mo de données privées par utilisateur. Les confirmations d’opérations gardent seulement des numéros de révision, jusqu’à 2 000 entrées/utilisateur sur 30 jours. Au-delà de la rétention, une ancienne requête retrouve un conflit de révision plutôt qu’une seconde application silencieuse.
- Les limites navigateur localStorage restent réelles, souvent inférieures aux quotas serveur. En cas de saturation, l’état à l’écran et les exports sont les secours ; ne pas effacer le stockage. IndexedDB pourra être introduit par une migration ciblée si l’usage public et les documents le nécessitent.
- Une pause Supabase ou une session expirée conserve les changements. Un indice de compte local (identité, sans jeton) maintient l’accès à son cache pour lecture/édition/export ; il ne donne jamais de droit serveur. La déconnexion explicite retire cet indice, pas les carnets. Le début d’une nouvelle connexion OAuth retire également l’indice précédent avant le retour Google. Réactiver le projet dans son tableau de bord si nécessaire, se reconnecter, puis synchroniser. Exporter régulièrement chaque compte et « Mon monde » ; le gratuit ne remplace pas une sauvegarde administrateur de PostgreSQL. Préparer une sauvegarde SQL chiffrée hors dépôt et tester sa restauration dans un projet distinct.

Le script réseau crée un seul identifiant `rls-check-<UUID>` et le suit avant la première écriture, y compris si la réponse échoue. Son `finally` relit cet identifiant, vérifie propriétaire, identité et marqueur unique de création, applique une suppression logique conditionnelle puis contrôle tombstone, absence de membres et invitations annulées. Aucune recherche globale, purge physique, clé privilégiée ou suppression d’un utilisateur n’est utilisée. Historique et données retenues par le serveur restent soumis à sa politique de conservation. Un nettoyage impossible ou un conflit laisse un code d’échec et l’identifiant exact à inspecter ; l’erreur initiale est conservée. Cette mécanique est éprouvée avec un faux client dans L3, sans nouvel essai sur le projet distant.

## Vérification SQL locale reproductible

Pour vérifier la syntaxe et les politiques PostgreSQL sans projet distant, installer `@electric-sql/pglite` dans un dossier temporaire **hors dépôt**, puis fournir son dossier `dist` :

```sh
node scripts/test-sql-local.mjs <chemin-vers-PGlite/dist>
```

`node scripts/test-collaboration-sql-local.mjs <chemin-vers-PGlite/dist>` applique toutes les migrations, les 27 contrôles historiques et le scénario de carnet commun (emails, notes/documents, droits et catégories, CAS, données invalides, révocation). Les mêmes contrôles sont exécutés dans la base distante dans une transaction annulée. `node scripts/smoke-sharing.mjs` vérifie la nouvelle interface avec deux profils et une API simulée, dont la concurrence hors ligne et la récupération des deux sources.

Le script utilise un PostgreSQL/WASM en mémoire et la vraie extension `pgcrypto`, applique la migration entière et simule deux identités via `auth.uid()`. Aucun secret ni donnée de voyage réelle n’est utilisé. Les contrôles couvrent RLS directe, refus d’écriture, droits éditeur, porte d’activation des éditeurs, confidentialité, invitations expirées/annulées/répétées, opérations idempotentes, restauration, révocation, visites privées et tombstones. Cela complète les tests du moteur mais ne valide pas Supabase Auth, Google, PostgREST ou deux sessions réseau.

## Géographie

Identifiants de pays/territoires ISO alpha-2, mapping explicite vers les identifiants numériques du fond Natural Earth dans `src/countries.ts`. Convention des codes consultable dans [M49/ISO de l’ONU](https://unstats.un.org/unsd/methodology/m49/overview/). Le Kosovo (`XK`, convention additionnelle) reste accessible dans la liste sans identifiant numérique ISO. Les polygones non codés (notamment Somaliland, Chypre du Nord et glacier de Siachen) restent neutres ; ils ne sont pas attribués arbitrairement à un autre pays. Les petits territoires de la liste peuvent manquer de contours à cette résolution. Le nombre affiché suit ces entrées, sans prétendre définir une reconnaissance diplomatique.

## Ouverture future au grand public

Les comptes sont indépendants des amis initiaux : aucune liste d’emails intégrée au client, droits serveur, index par propriétaire/membre, chargement à la demande et plafonds par compte. Les carnets sont privés par défaut. L’audience de test Google reste une configuration externe remplaçable.

Avant ouverture : valider OAuth et RLS en réel ; configurer l’audience Google publique et les URL finales ; publier politique de confidentialité et contact ; fournir suppression/export de **compte** (la suppression d’un carnet ne supprime pas l’utilisateur Supabase) ; dimensionner la rétention et les plafonds selon la base totale ; surveiller stockage, transferts et historique dans Supabase ; ajouter limitation des requêtes et protection contre les créations massives selon l’exposition. Le seuil par compte ne garantit pas le quota global du projet gratuit. Aucun abonnement n’est activé automatiquement.

Votes, tâches et commentaires ciblés restent à implémenter après validation de l’édition et de leurs droits : un vote personnel par membre, auteur contrôlé côté serveur, lecteur strictement en lecture seule. Le code ne simule pas ces fonctions.

## Retour arrière

Avant tout retour de version, exporter les carnets locaux, ceux du compte et les souvenirs. Garder les anciennes clés et les capsules de compte. Une ancienne application n’interprète pas les capsules : revenir au code précédent ne fait pas de conversion inverse. Déployer une version sans les variables Supabase désactive les comptes dans l’interface, sans supprimer les caches ni le serveur. Une restauration de carnet est une nouvelle révision conditionnelle ; une restauration PostgreSQL se teste séparément et ne doit jamais être confondue avec ce bouton.

Pour une reprise de développement : créer le projet, appliquer la migration, configurer Google, exécuter les contrôles à deux comptes, consigner les preuves et seulement ensuite activer les éditeurs. Aucune table ne doit être supprimée pour contourner une erreur.
