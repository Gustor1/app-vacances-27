# L4 — matrice de preuves terrain

Début le 8 octobre 2026, clôture le 9 octobre 2026 après confirmation des essais terrain 1 à 5 par l’utilisateur. Premier essai privé sans backend, puis publication connectée de la bêta à la demande explicite de l’utilisateur (« fais le »). Aucun commit, push, changement de schéma ou de configuration Auth.

## Essai privé prêt

- Initialisation Safari : https://desktop-kpgljk5.tail0487a9.ts.net:8443/l4-setup.html
- Réouverture après initialisation : https://desktop-kpgljk5.tail0487a9.ts.net:8443/
- Serve HTTPS privé Tailscale 8443 → serveur statique 127.0.0.1:4194. La configuration existante 443 → 5173 est conservée. Aucun Funnel.
- Dossier compilé : `C:\Users\eliot\Documents\detours-validation-20261008-L4-physical\dist`. Version locale sans connexion Supabase, carnet « Terrain L4 — test uniquement », document et adresse fictifs. La page d’initialisation n’écrase pas un carnet existant et ne fait pas partie du cache de l’application.
- Build de terrain : `934df95b789f` (préfixe d’identité du manifeste). Cette variante sans backend est distincte de la variante de validation automatisée utilisant un backend factice. Elle précède une correction typographique chinoise sans effet sur la persistance.
- Arrêter uniquement ce service après les essais : `tailscale serve --https=8443 off`, puis arrêter le serveur local de cette tâche. Ne pas réinitialiser tous les services Tailscale.

## Résultats et limites

| Scénario | Preuve locale | Preuve physique / comptes réels |
| --- | --- | --- |
| Navigation et exports hors ligne sur téléphone | Parcours compilés couverts par la gate | Confirmé par l’utilisateur le 8 octobre : passage entre onglets, carte, bonus, budget, téléchargement/export du carnet accessibles sur iPhone |
| Cache complet, module différé absent/corrompu | Tests unitaires et navigateur compilé ; ancien comportement « prêt » reproduit malgré un module absent | Safari à vérifier |
| Notes hors ligne et contrôle daté | Navigateur compilé, quatre langues, 320/390/1440 px | iPhone : protocole envoyé, résultat attendu |
| Fermeture complète et réouverture hors ligne | Réussi avec Chrome Windows installé et profil disque isolé : note, document et cache conservés, puis reconnexion ; réseau simulé | Confirmé par l’utilisateur le 8 octobre : jour ajouté hors ligne, conservé après fermeture/réouverture de Safari hors ligne, puis après reconnexion et rechargement |
| Édition concurrente et reconnexion PC/iPhone | Fusion locale et scénarios serveur simulés couverts par la gate | Confirmé par l’utilisateur le 9 octobre : tests 1 et 2 du protocole final réussis (envoi après coupure, deux jours ajoutés sur appareils différents conservés) |
| Synchronisation PC/iPhone avec le même compte réel | Version connectée publiée, serveur et fichiers servis vérifiés | Confirmé par l’utilisateur le 9 octobre 2026 : « la synchro sur les mêmes comptes marche sur tel / pc » |
| Changement de compte et session absente | Deux espaces de compte simulés avec même identifiant de carnet, notes isolées ; file conservée | Confirmé par l’utilisateur le 9 octobre dans le test 4 : espace du second compte isolé avant invitation |
| Échec d’enregistrement local | Quota simulé : erreur visible, anciens carnets et file conservés | Limitation locale volontaire |
| Déconnexion avec envois en attente | Moteur et interface avec comptes simulés | Confirmé par l’utilisateur le 9 octobre : test 3 réussi, travail retrouvé après reconnexion au même compte et envoyé au PC |
| Rétrogradation / révocation | Scénarios de partage simulés, récupération du travail refusé | Confirmé par l’utilisateur le 9 octobre : test 4 réussi (éditeur puis lecteur, retrait d’accès) |
| Mise à jour du service worker | Ancien worker puis version compilée, test de production ; essai ciblé de la nouvelle publication réussi | Confirmé par l’utilisateur le 9 octobre : test 5 réussi, mise à jour de Safari, jours conservés, nouveau contrôle puis fermeture/réouverture hors ligne |

Les jetons des comptes de test ne sont pas disponibles dans cette session. L’essai privé sans backend ne valide ni OAuth Google ni l’envoi entre appareils. Les résultats automatisés ne remplacent aucune case physique. L’essai connecté suivant demande la connexion humaine au même compte Google sur les deux appareils.

## Bêta connectée publiée pour l’essai PC/iPhone

- URL stable : https://app-vacances-27-beta-eliottle.vercel.app/
- Déploiement preview : `dpl_4Pp3RqS8YqgL4vj3iUo3bJZiNGpT`, `app-vacances-27-iinqav9i1-eliottle.vercel.app`, état READY. Seul l’alias bêta a été réassigné ; ancien déploiement conservé `dpl_28fA59y4NfEKr6FwTuu5JZVwt3D8` pour retour éventuel.
- Projet Vercel existant `prj_GdllwjlfvjDogyKdH2ABRJay350a`, équipe `team_lVeovobBaIvDqajTP8FZ3UvH`. Build réel : `a4c3718873c97839da0cd4981c7ecdbb53c34475c98e4f66ee5f72b18e28dda8`. Publication des seuls fichiers compilés, sans fichiers d’environnement, clés secrètes, sources ni données de navigateur.
- Serveur réel `ehvgecfakbxeatrcnfhm.supabase.co` (Detours-beta), ACTIVE_HEALTHY. Migrations et signatures des RPC de lecture/écriture vérifiées en lecture seule ; appels RPC interdits au rôle anon, autorisés au rôle authenticated avec contrôles serveur existants. Aucun compte ou carnet réel modifié par l’agent.
- Google activé dans les paramètres publics Auth ; démarrage OAuth renvoie un 302 vers accounts.google.com. La connexion effective et son retour à la bêta demandent l’action humaine ; non déclarés validés à ce stade.
- 19 fichiers servis comparés par taille et SHA1 avec les fichiers publiés ; manifeste et entrée courants, interface mobile et état « prêt hors ligne » vérifiés dans un profil Chrome isolé. Sources produit identiques à celles de la gate L4 réussie ; environnement de build remplacé par le serveur réel.
- Preuves conservées dans `C:\Users\eliot\Documents\detours-release-20261008-L4` : manifeste de build, auth-readiness.json (aucun jeton), published-verification.json et capture published-mobile.png.

Protocole connecté : ouvrir la bêta sur iPhone et PC, se connecter au même compte Google. Sur l’iPhone, créer un carnet « Test synchro L4 » dans l’espace du compte, ajouter un jour et attendre « Synchronisé ». Sur le PC, ouvrir ce même carnet après actualisation/synchronisation. Pour conserver le jour du lien privé, exporter ce carnet sur l’iPhone puis importer cet export dans la bêta après connexion ; aucune copie locale de l’ancien site n’est envoyée automatiquement. Ensuite couper le réseau sur l’iPhone, éditer, attendre la sauvegarde, rouvrir hors ligne, reconnecter et vérifier le résultat sur PC.

Retour du 9 octobre 2026 : l’utilisateur confirme la synchronisation téléphone/PC avec le même compte réel. Ce retour confirme le parcours connecté entre ces appareils. Il ne détaille pas une édition simultanée sur les deux appareils, une reconnexion après édition hors ligne dans cette version connectée, un changement de compte, une révocation ou une mise à jour du worker : ces scénarios restent distincts et à vérifier.

Retour complémentaire du 9 octobre 2026 : après réception des quatre protocoles détaillés (1 : édition hors ligne puis envoi ; 2 : ajouts concurrents PC/iPhone ; 3 : déconnexion avec envoi en attente puis reconnexion ; 4 : isolation du second compte, invitation, rôle éditeur puis lecteur, révocation), l’utilisateur confirme « ok pour 1 2 3 4 ça marche ». Ces scénarios terrain sont validés sur déclaration de l’utilisateur ; aucune session réelle n’a été manipulée par l’agent. Le dernier essai restant est la mise à jour de l’application dans Safari pendant qu’un ancien onglet reste ouvert.

## Dernier essai — mise à jour Safari

L’utilisateur confirme avoir laissé le carnet ouvert dans Safari avant la publication de la nouvelle version. Build préparé dans `C:\Users\eliot\Documents\detours-update-20261009-L4`, avec identité de publication distincte produite par le hook Rollup `augmentChunkHash` sur l’entrée : aucun fichier de code produit modifié, références entre modules recalculées par le bundler. Nouveau manifeste `8a667d85c6861e96415baddfdf183e72baf0be43b143f504f3703267f8815816`, entrée `/assets/index-2VMoQdxD.js`, précédent manifeste `a4c3718873c97839da0cd4981c7ecdbb53c34475c98e4f66ee5f72b18e28dda8`.

Build et manifeste vérifiés. Test compilé ciblé avec Chrome Windows installé : détection après reprise de l’onglet à travers l’ancien cache, aucune recharge automatique du brouillon, bouton « Mettre à jour », carnets conservés, ancien cache remplacé et nouvelle version disponible hors ligne. Ce résultat automatisé ne remplace pas l’essai Safari physique.

Protocole transmis : après publication, quitter Safari pour une autre application puis revenir sans recharger la page, attendre « Une nouvelle version est prête », toucher « Mettre à jour », vérifier le carnet et ses jours. Dans le carnet pratique, refaire « Vérifier » et attendre « prêt hors ligne ». Passer en mode avion avec Wi-Fi coupé, fermer Safari puis rouvrir la bêta et vérifier que le carnet reste utilisable.

Résultat du 9 octobre 2026 : l’utilisateur répond « oui c’est bon ça marche » après ce protocole. L’essai de mise à jour et réouverture hors ligne sur Safari est confirmé sur déclaration de l’utilisateur. Les cinq essais finaux sont validés : L4 est clôturé. Le modèle/version iOS restent non renseignés et les manipulations humaines ne sont pas des sessions observées directement par l’agent.

Publication de l’essai : preview `dpl_3tEEEHsb2JUuy6RMs96gyXHvtJTM` READY, `app-vacances-27-mcu68pkhx-eliottle.vercel.app`, alias bêta stable réassigné depuis `dpl_4Pp3RqS8YqgL4vj3iUo3bJZiNGpT` conservé. 19 fichiers servis vérifiés par taille/SHA1, nouveau manifeste/entrée et état prêt hors ligne constatés dans un profil Chrome isolé. Preuves : `published-verification.json`, `published-mobile.png`, captures du test de mise à jour dans le dossier externe de cette publication. Aucun commit/push ni changement du backend.

Retour terrain de l’utilisateur, 8 octobre 2026 : navigation entre onglets, téléchargement/export du carnet, carte, bonus et budget accessibles hors ligne sur iPhone. Puis, après le protocole transmis (mode avion et Wi-Fi coupé, ajout d’un jour « Test hors ligne », attente de sauvegarde, fermeture complète de Safari, réouverture hors ligne, reconnexion et rechargement), l’utilisateur confirme : « oui c’est bon il est resté en hors ligne et en ligne ». La persistance locale après fermeture et reconnexion est confirmée pour ce jour ajouté. L’édition spécifique d’une note et la date du contrôle n’ont pas été confirmées séparément. Modèle et version iOS non renseignés. L’accès à la vue carte ne confirme pas la disponibilité hors ligne de toutes les tuiles de rues externes. Ce test sans backend ne prouve pas l’envoi vers un autre appareil.

## Protocole iPhone transmis

Avec Safari et Tailscale actif, ouvrir l’initialisation, préparer le carnet, puis Menu → Mon carnet pratique. Attendre « prêt pour le hors-ligne ». Enregistrer l’adresse principale en favori. Passer en mode avion, couper aussi le Wi-Fi. Écrire `IPHONE-L4-1`, attendre la sauvegarde locale, fermer complètement Safari puis rouvrir le favori hors ligne. Vérifier la note, le document factice et le contrôle. Reconnecter et vérifier encore. Consigner modèle, version iOS et première étape qui échoue.
