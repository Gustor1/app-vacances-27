# Rappels et récaps — implémentation locale

Travail du 10 octobre 2026 sur `codex/rappels-recaps`, depuis `9fa03b1` de `codex/carnets-universels`. Le plan original est conservé. Aucune publication, migration distante, configuration payante, tâche distante ou notification réelle n'est comprise dans ce travail.

## Parcours et contrats retenus

La cloche du voyage ouvre Mes récaps : Aujourd'hui, Demain et historique replié. Une fiche agrège les journées portant la même date, y compris les transports interétapes. La petite cloche d'une activité ou d'un transport ouvre son réglage personnel, y compris au-delà de demain et sans date. La saisie des délais propose les valeurs usuelles et des durées en minutes, heures ou jours. Les lectures et réglages appartiennent à l'espace local ou au compte courant, jamais au carnet partagé. Les hôtels sont exclus des filtres initiaux ; une exception personnelle peut les inclure. Les heures libres ne créent pas d'échéance. Les alternatives sélectionnées et les activités faites influencent la planification.

Les horaires viennent de `Day.preparation.timings` et des transports. La résolution utilise le fuseau de la ville, puis celui du voyage ; le transport privilégie son fuseau de départ. Une heure répétée prend la première occurrence et une heure inexistante avance à la prochaine minute valide. « 1 jour avant » représente 24 heures, contrairement au récap du soir qui utilise une date civile et un fuseau personnel stable. Le validateur historique des billets reste plus strict.

Les préférences sont dans `detours-notifications-v1:<voyage>` au sein du stockage personnel existant. Les caches de récaps et météo utilisent leurs propres clés. Le format v3 de sauvegarde complète inclut les réglages et exceptions, réattribue le voyage à la restauration et éteint les trois canaux distants. Les sessions, souscriptions push, files, lectures et météo ne sont pas exportées. Les imports/copies historiques gardent leur contrat et repartent avec les réglages initiaux.

Le cache garde jusqu'à 30 dates passées/actuelles et demain. Une mise à jour météo n'invalide pas la lecture ni la révision du programme. Les fiches passées sont photographiées. Quand l'application est restée fermée en mode local, la première ouverture produit la fiche courante : elle ne peut pas reconstruire un programme du soir qu'elle n'a jamais observé. Après remise distante, un instantané personnel du contenu envoyé fournit la référence du soir, même à la première ouverture ultérieure.

## Fournisseurs et limites

Météo : Open-Meteo, exclusivement à la demande dans le panneau, sans GPS. Dates/coordonnées/fuseaux proviennent du programme, horizon de 16 jours, cache 3 heures, 8 lieux maximum par chargement et délai de 6 secondes par requête. Une panne ou une date hors horizon reste un état explicite, avec cache périmé conservé. Un déplacement du lieu écarte sa prévision précédente. Les règles sont : pluie >= 50 %, UV >= 3 pour une marche déclarée, marche déclarée pour les chaussures. Une visite n'est pas présumée extérieure. Aucun passeport ou document obligatoire n'est inventé ; le modèle actuel ne porte pas de champ de document requis par activité. Les coches de valise ne changent pas.

Les [conditions Open-Meteo](https://open-meteo.com/en/terms) vérifiées le 10 octobre 2026 permettent l'API gratuite pour usage non commercial, avec attribution CC BY 4.0 et limites de 10 000 appels/jour, 5 000/heure et 600/minute. Couverture et [horizon de prévision](https://open-meteo.com/en/docs) sont documentés par le fournisseur. Il n'y a pas de garantie de fraîcheur/réception ni de mesure de qualité locale en Chine dans cette validation. Un usage commercial exige une autre configuration autorisée.

Email : adaptateur HTTP Resend, destinataire uniquement issu de `auth.users` avec adresse confirmée. HTML échappé et texte simple en quatre langues utilisent le modèle de récap de l'application. Pas de notes, documents ou références de réservation sensibles. Une clé d'idempotence SHA-256 identifie l'occurrence. La [fenêtre fournisseur](https://resend.com/docs/dashboard/emails/idempotency-keys) est de 24 heures ; le moteur reste prudent et classe les réponses ambiguës `uncertain` au lieu de les rejouer aveuglément. Une acceptation fournisseur ne prouve pas l'arrivée en boîte mail.

Le [tarif Resend](https://resend.com/pricing) consulté le 10 octobre 2026 affiche 3 000 emails/mois et 100/jour au palier gratuit ; 50 000/mois pour 20 USD/mois au palier Pro. L'hypothèse de 100 comptes suivant 5 voyages pourrait produire 500 emails/jour et 15 000/mois si tous ont un programme quotidien : elle dépasserait donc le palier gratuit. Aucun abonnement n'a été souscrit. Les frais Supabase restent à chiffrer sur la cible réelle.

Web Push : `web-push@3.6.7`, graphe figé par `deno.lock`. Les endpoints autorisés sont ceux de Google FCM, Mozilla et Apple, en HTTPS, sans hôte arbitraire ou redirection. Les messages d'écran verrouillé sont discrets et les tags sont des empreintes d'occurrence. Le worker existant conserve son cache et vérifie l'origine lors du push et du clic. La permission est demandée seulement par l'action d'activation. [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) documente le parcours web push ; la réception sur iPhone/Android/ordinateur et les restrictions d'installation restent à éprouver en N8.

## Serveur et reprise

Migration locale : `supabase/migrations/20261010104927_personal_notifications.sql`, créée avec la CLI Supabase 2.83.0. Tables personnelles exposées protégées par RLS ; souscriptions et file privée non accessibles aux autres comptes. Les RPC utilisateur vérifient identité et accès. Les RPC de travail sont réservées à `service_role`. Le moteur relit la projection de droits existante, les canaux, la révision, le statut et l'expiration avant remise.

Les occurrences ont une clé logique unique, échéance, révision, état, tentatives, token et bail de 2 minutes. La prise utilise `FOR UPDATE SKIP LOCKED`. Trois tentatives maximum, backoff exponentiel pour quota explicite, rappel expiré après 5 minutes ou au début de l'activité, récap expiré après 2 heures ou au début du jour ciblé. Le recalcul conserve le backoff et n'ouvre jamais une occurrence acceptée ou incertaine. Un crash après début fournisseur devient incertain à l'expiration du bail. Il n'existe aucune promesse d'« exactement une fois ».

L'Edge Function traite au plus 500 préférences par invocation, puis 10 livraisons ; elle borne la météo à 8 appels par invocation. L'offset fourni par l'ordonnanceur doit parcourir la population si elle dépasse 500 préférences. Une modification non synchronisée reste inconnue du serveur. Retrait d'un membre, suppression de voyage et changement de périmètre annulent/purgent les dérivés concernés ; les originaux locaux récupérables restent conservés. Le cycle complet de suppression du compte dans le produit existant n'est pas revendiqué comme livré.

## Activation N8 — séparée et à autoriser

1. Sauvegarder la cible et appliquer le protocole `L8.md`. Revalider les conditions, quotas et privilèges de l'environnement. Le [changelog Supabase](https://supabase.com/changelog) signale notamment l'évolution de l'exposition des tables : cette implémentation utilise des RPC explicitement accordées, pas l'accès direct aux souscriptions.
2. Appliquer la migration sur la cible autorisée. Elle ne crée aucun cron et démarre avec `enabled=false`, `push=false`, `email=false` dans `detours_private.notification_config`.
3. Déployer la fonction `notifications` avec `NOTIFICATIONS_ENABLED=false`. Configurer côté serveur exclusivement `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFICATION_WORKER_SECRET`, `NOTIFICATION_APP_ORIGIN`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL_FROM`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Aucun de ces secrets n'appartient à Vite ou aux archives. L'adresse d'envoi/domaine doit être validée chez le fournisseur.
4. Configurer la passerelle Edge selon sa documentation courante pour qu'une tâche serveur puisse joindre la fonction. L'authentification propre à la fonction exige `x-notification-secret`. Conserver le secret dans Vault ; ne pas employer une clé publique comme preuve d'autorisation du worker.
5. Après autorisation, renseigner la clé VAPID publique dans la table de configuration, activer les canaux voulus dans la table et `NOTIFICATIONS_ENABLED=true`. Inscrire uniquement des appareils/comptes de test avec leurs propriétaires.
6. Créer explicitement la tâche à la minute selon la [documentation Supabase](https://supabase.com/docs/guides/functions/schedule-functions). La tâche fait un POST authentifié avec corps `{"offset":0}` pour la population initiale. Au-delà de 500 préférences, faire tourner les pages et vérifier que la boucle revient à zéro. Vérifier le débit réel avant de promettre cette capacité.
7. Tester réception, refus, expiration de souscription, changement de compte, désactivation appareil/tous appareils, retrait d'accès et arrêt global. Apple Calendar, Google Calendar et Outlook exigent des imports réels distincts : voir `NOTIFICATIONS-CALENDAR.md`.

Surveiller uniquement états, quantités, latence et erreurs techniques : pas de contenu de voyage ni d'endpoints en logs. Les états `uncertain` nécessitent une inspection manuelle fournisseur ; ne pas les remettre tous en attente. Observer un retard de file et les quotas via le suivi opérateur de la cible ; aucun canal externe de surveillance n'a été créé. Les occurrences terminées et instantanés de plus de 31 jours sont purgés lors des remises. Vérifier une purge opérateur si les envois restent arrêtés longtemps.

Retour arrière : couper d'abord `enabled` dans la table et `NOTIFICATIONS_ENABLED`, arrêter la tâche, puis revenir au frontend précédent si nécessaire. Garder le schéma compatible et les carnets ; aucune suppression destructive de migration n'est nécessaire. Recontrôler consultation locale, exports et restauration.

## Vérification reproductible

Node >= 22.18, PGlite 0.5.8 et Deno 2.9.6 installés hors dépôt. Exemple adapté à ce PC :

```powershell
$env:DETOURS_PGLITE_PATH = 'C:/Users/eliot/.codex/tools/detours-notifications/node_modules/@electric-sql/pglite/dist'
$env:DETOURS_DENO_PATH = 'C:/Users/eliot/.codex/tools/detours-notifications/node_modules/deno/deno.exe'
npm run verify:local
node docs/development/notification-benchmark.mjs
```

Le contrôle Deno doit résoudre le graphe verrouillé lors de la première installation ; les tests de remise remplacent toutes les requêtes et ne disposent pas de permission réseau. Le gate contient les nouveaux tests SQL, Deno et neuf parcours navigateur, en plus des contrôles historiques. Il produit un build factice, à reconstruire pour toute publication autorisée.

Résultats détaillés et suivi des lots : `NOTIFICATIONS-VALIDATION.md`.
