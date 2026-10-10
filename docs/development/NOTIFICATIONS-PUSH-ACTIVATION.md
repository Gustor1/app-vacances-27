# Activation push de la beta — 11 octobre 2026 (Asia/Shanghai)

Demande utilisateur : mettre en place le push ; laisser les emails en attente.
Cible : Supabase `Detours-beta` (`ehvgecfakbxeatrcnfhm`) et preview Vercel de `codex/rappels-recaps`. Aucun alias de production modifié.

La configuration serveur peut venir des variables Edge habituelles ou du secret chiffré Vault `detours_notification_worker`. Le connecteur ne gère pas les variables Edge et la CLI locale n'a pas de session administrateur ; le bootstrap utilise donc une RPC réservée à `service_role`, fourni au runtime par Supabase. Il ne charge que les six valeurs propres au push, et ignore les autres clés. Ni le frontend, ni `anon`, ni `authenticated` ne peuvent appeler cette RPC. Les clés ne figurent pas dans ce document, les migrations ou les archives du produit. Une rotation des valeurs Vault exige un redéploiement de la fonction pour renouveler les isolates chauds. La coupure par la table de configuration reste immédiate pour toute nouvelle remise.

Le runtime hébergé refuse `Deno.env.set` : la configuration Vault est injectée dans la fonction pour chaque requête, sans modification des variables globales. Le transport accepte les clés de service historiques et le dictionnaire moderne `SUPABASE_SECRET_KEYS`, sans envoyer une clé `sb_secret_` comme JWT.

Sauvegarde avant migration : `C:/Users/eliot/Documents/detours-release-20261010-notifications-preview/remote-before-push.json` (carnets, membres, données personnelles, versions et monde ; aucune session Auth). Source récupérable : `C:/Users/eliot/Documents/detours-recovery-20261010-notifications-preview`.

Migration de notifications, RPC de configuration Vault et extensions `pg_cron` / `pg_net` appliquées séparément. Elles ne changent pas les carnets existants et n'inscrivent aucun appareil. Le canal email reste `false`, sans configuration Resend. La tâche est nommée `detours-notifications-push`, chaque minute ; elle charge le secret depuis Vault, et n'appelle la fonction que lorsqu'un carnet suivi a un canal push activé. L'offset tourne sur des pages de 500 préférences. Le secret n'est pas écrit dans le texte de la tâche.

Historique distant vérifié : `20261010160152_personal_notifications`, `20261010160154_notification_worker_vault`, `20261010160155_notification_scheduler_extensions`. Le connecteur attribue ses propres versions ; ne pas rejouer les migrations locales équivalentes avec `db push` sans rapprocher l'historique. L'ajout des extensions utilise `create extension if not exists pg_cron; create extension if not exists pg_net with schema extensions;`.

Parcours utilisateur : ouvrir la preview dans un navigateur compatible, se connecter, ouvrir un carnet synchronisé, puis **Mes récaps → Mes préférences pour ce voyage**. Cocher le rappel d'activités ou celui des récaps, enregistrer et accepter la permission du navigateur. Un carnet exclusivement local n'est pas connu de l'ordonnanceur distant. Sur iPhone/iPad, installer le site sur l'écran d'accueil et ouvrir cette application avant l'activation. Une notification ne se déclenche que pour un programme daté/horaire et un délai encore valide ; les dates libres ne créent pas d'envoi.

Arrêt opérateur : `update detours_private.notification_config set enabled=false,push=false,email=false where id;` puis `select cron.unschedule('detours-notifications-push');`. Garder les schémas et carnets. Réactivation sans changement de clés : remettre les flags push uniquement, puis recréer la tâche avec la procédure ci-dessous. Ne pas remettre aveuglément une occurrence `uncertain` en attente.

Les tests de SQL, bootstrap et worker restent distincts de la réception sur un iPhone ou Android réel. Le rapport d'activation contient le résultat de l'appel distant et de la planification ; aucune réception physique ne doit être revendiquée sans preuve.

## Vérifications distantes exécutées

- Fonction `notifications`, version 3, bundle `f780aeb47469ab12a087064afded940dace65bb6e83cc87cf1d26c1ea1967384`.
- Appel serveur authentifié : HTTP 200, `planned=0`, `claimed=0`, `accepted=0`. Aucun appareil ni préférence distante inscrit lors de l'activation.
- Appels non autorisés : POST HTTP 401, GET HTTP 405. RPC de configuration privée refusée au client anonyme (HTTP 401) et privilège absent pour `authenticated`.
- API de capacités : push activé, email désactivé, clé VAPID publique disponible. Les clés privées restent dans Vault.
- Tâche `detours-notifications-push` active, exécution observée `succeeded` le 11 octobre à 00:09 Asia/Shanghai. Avec zéro abonnement, elle n'invoque pas inutilement la fonction.
- Les cinq carnets et les deux comptes existants sont conservés.

La réception iPhone choisie par l'utilisateur, l'autorisation Safari et OAuth sur cette origine ne sont pas validés par ces contrôles. Les canaux personnels restent désactivés jusqu'à leur activation volontaire dans l'application. [SQL de planification et reprise](notifications-push-schedule.sql).

Références : [Vault](https://supabase.com/docs/guides/database/vault), [planification Edge](https://supabase.com/docs/guides/functions/schedule-functions), [variables serveur](https://supabase.com/docs/guides/functions/secrets), [domaines email Resend](https://resend.com/docs/dashboard/domains/introduction).

Les conseillers signalent les RPC `SECURITY DEFINER` appelables par leurs rôles autorisés et les tables privées sans politique : contrôles volontaires via RPC, tables fermées, droits personnels vérifiés. La configuration secrète n'est pas appelable par ces rôles. L'alerte historique [protection des mots de passe divulgués](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) demeure hors périmètre de cette activation.
