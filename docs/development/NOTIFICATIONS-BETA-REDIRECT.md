# Retour de connexion vers une beta sans notifications

Diagnostic du 11 octobre 2026 (Asia/Shanghai). L'utilisateur ouvre la preview des notifications, puis retrouve l'adresse habituelle de la beta après Google, sans cloche.

L'alias `app-vacances-27-beta-eliottle.vercel.app` sert encore `dpl_3WEvq5G839wEHsDf9FGEUWThZkbK`, commit `0aec6c8afbe89f617b723c35b052549e445b62a4`, branche `codex/corrections-mobile`. Son manifeste `908bf170f9f12428394a88021e5b92ec843618df887576e4a61fc925ef7e6956` ne contient pas le module Recaps. La preview des notifications est un autre déploiement, `dpl_EVHvRAby79RJNf3E1fkBU4XrRHpj`, commit `f39c80c5c7e6313af127e62369a3d9ed43a04353`.

Le client demande comme retour OAuth l'origine courante. Le retour observé vers la beta est compatible avec un refus de la preview dans la liste des redirections Supabase, mais la configuration Auth distante n'a pas été lue : cette cause reste une hypothèse. Le code de connexion personnel n'est pas conservé dans les preuves.

La correction préparée réunit `codex/rappels-recaps` et `origin/codex/corrections-mobile` (y compris son compte rendu de publication), afin que l'adresse habituelle puisse afficher la cloche sans perdre les corrections mobiles. Les deux conflits de fusion conservent le bouton Recaps, les liens vers les activités, le retour de focus mobile, le menu de collaboration et tous les contrôles des deux branches. Aucun changement du contrat des carnets ni de la configuration OAuth.

Copie récupérable : `C:/Users/eliot/Documents/detours-recovery-20261011-notifications-mobile`, source et historique Git, sans fichiers ignorés. La beta précédente reste le point de retour arrière.

Avant réassignation de la beta : gate complète, reconstruction avec la configuration cible, vérification du manifeste et des fichiers de la nouvelle preview, puis autorisation de l'utilisateur selon AGENTS.md. La réassignation doit conserver l'accès public de l'alias sans désactiver la protection du projet.

Après autorisation : pointer l'alias beta vers la version réunie, vérifier les fichiers réellement servis, la cloche dans un carnet et les préférences aux tailles mobiles, puis le hors ligne. Faire aussi pointer `NOTIFICATION_APP_ORIGIN` dans la configuration Vault vers l'origine beta pour que les notifications ouvrent la même version. Redéployer le worker identique pour renouveler les isolates qui mettent la configuration en cache ; conserver les clés VAPID et le canal email désactivé. Aucune migration supplémentaire nécessaire.

OAuth réel et réception sur iPhone physique restent des contrôles distincts des tests locaux et du navigateur jetable.

Validation locale complete reussie : 22 controles, 136 tests unitaires, quatre tests Deno, 80 parcours navigateur et neuf scenarios compiles. Rapport NOTIFICATIONS-MOBILE-LOCAL-VALIDATION.json ; sourceUnchanged=true, exitCode=0, aucune etape non executee. Backend et sessions simules ; aucun OAuth ou iPhone reel valide.

Publication autorisee et executee le 11 octobre 2026 : alias beta reassigne a dpl_2MxhqUoFup48esi4RvKosdVWL5fC, commit 1a696c85719648ebbc7e47b58109c5ce8400f69e. Manifeste servi 0ce7a6eb96ca7f814e131bba9463a4018c2438ae704cafc937f097ced6e86438 : 23 fichiers verifies par taille et SHA-256, cloche et preferences accessibles, aucun debordement a 320/390/1440 px, recap disponible hors ligne, aucune erreur runtime. Acces public sans bypass temporaire. Origine des notifications redirigee vers la beta ; worker redeploye identique, version 4 ACTIVE. Push actif, email desactive. Aucun OAuth reel ni reception physique revendiques. Retour arriere frontend : dpl_3WEvq5G839wEHsDf9FGEUWThZkbK ; conserver migrations et donnees.
