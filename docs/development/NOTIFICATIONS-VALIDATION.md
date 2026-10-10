# Rappels/récaps — preuves et état des lots

Date : 10 octobre 2026, repère Asia/Shanghai. Branche : `codex/rappels-recaps`, base `9fa03b1`. Document original préservé. Cette fiche décrit une implémentation locale ; elle ne prouve pas l'état de la bêta.

| Lot | État | Fichiers principaux | Preuves / limite |
|---|---|---|---|
| N0 | Terminé | `NOTIFICATIONS.md`, plan original | État Git vérifié, base distante récupérée, contrats horaires/droits/worker réutilisés ; fournisseurs consultés |
| N1 | Implémenté | `notifications.ts`, `backup.ts` | Délais, exceptions, projection, fuseaux DST, agrégation, restauration interrompue/reprise et canaux éteints testés |
| N2 | Implémenté | `Recaps.tsx`, `notification-storage.ts`, `notification-copy.ts`, `App.tsx`, `JourneysApp.tsx` | Quatre langues, clavier/focus, non lu, historique et référence distante ; limite de reconstruction locale du soir expliquée |
| N3 | Implémenté et simulé | Migration SQL, `notification-delivery.ts`, fonction `notifications` | RLS comptes A/B, lecteur, rôle service, deux prises de worker, résultat incertain, backoff, révocation et unicité ; aucune migration distante |
| N4 | Implémenté et simulé | `ReminderButton.tsx`, `notification-push.ts`, `notification-endpoints.ts`, `build-sw.mjs`, `CloudProvider.tsx` | Accès depuis toute activité/transport ; refus, worker absent, inscription annulée/rejetée, désactivation et push/clic testés ; aucune réception physique |
| N5 | Implémenté et simulé | `notification-weather.ts`, `notification-email.ts`, `handler.ts` | Horizon/cache/panne météo, règles, rendu échappé quatre langues ; requête email capturée et blocage sur révocation dans les tests Deno |
| N6 | Implémenté | `calendar.ts`, `TripOverview.tsx`, `NOTIFICATIONS-CALENDAR.md` | 12 tests unitaires et quatre téléchargements navigateur ; Apple/Google/Outlook réels non exécutés |
| N7 | Réussi localement | `verify-local.mjs`, nouveaux tests, ce rapport | Gate final réussi : 22 contrôles, source inchangée, 67 parcours navigateur et neuf smokes compilés |
| N8 | Non activé | Procédure `NOTIFICATIONS.md` | Nécessite cible autorisée, secrets, migration/déploiement, tâche, appareils et comptes de test |

## Vérifications déjà exécutées

- `npm test` : 134 tests réussis au lancement du premier gate intégré, sans email réel ni appel météo réel.
- `npm run typecheck`, `npm run lint` : réussis avant le gate.
- SQL PGlite : contrôle historique L6 et contrôle notifications réussis ; rôles authentifiés et service testés, en mémoire seulement.
- Deno : trois scénarios du handler réussis, réseau intégralement remplacé et permission réseau absente : refus de requête non autorisée/interrupteur arrêté, email accepté avec météo/instantané, révocation avant remise.
- Playwright ciblé : neuf parcours réussis dans les quatre langues : calendrier et récaps, 320/390/1440 px selon le scénario, clavier, focus, cache météo hors ligne, liens exacts.
- Le worker généré est exécuté dans un contexte simulé : push et clic d'origine sûre, payload discret, tag, `renotify=false`, listeners historiques conservés. Cela n'est pas une validation du système de notification d'un téléphone.
- Les premières exécutions Playwright avaient signalé le focus du dialog, une fixture au fuseau invalide et le nom accessible du sélecteur calendrier. Les causes ont été corrigées et les neuf parcours ciblés ont ensuite passé.

Un premier gate complet a réussi : `C:/Users/eliot/AppData/Local/Temp/detours-verify-obgCkc/validation.json`, empreinte du build `361520a3a38587b89e0c132fe4f09f038928f5925f89dca478629ee1d48d5b12`. Il précède les derniers ajouts : accès aux rappels depuis activités/transports, unités de durée, refus d'inscription sans worker et vérification du lieu météo.

**Gate final réussi** : `C:/Users/eliot/AppData/Local/Temp/detours-verify-pwbfgU/validation.json`, copié dans `NOTIFICATIONS-VALIDATION.json`. Code de sortie 0, `sourceUnchanged=true`, aucune étape non exécutée. Build : `76d7734ce3ef06e0ceca8e071941f5c8d86eb4d91176aec7917cf85318966c6c`. Les 22 contrôles couvrent types, lint, tests unitaires, build/manifeste, SQL L6/notifications, trois tests Deno, 10 nouveaux + 37 historiques + 20 parcours L4/L5/L6/préférences et neuf smokes compilés. Le build utilise la configuration factice prescrite et n'est pas publié.

Le test de l'activité future vérifie également un hôtel personnalisé et un transport sans date sans écrire dans le carnet. Les quatre langues vérifient la conversion d'un délai saisi en heures. La prévision d'un lieu déplacé est rejetée ; une visite n'est pas présumée extérieure. Les derniers ajouts sont inclus dans le gate final.

## Charge synthétique

`node docs/development/notification-benchmark.mjs` construit 500 récaps (100 comptes × 5 voyages), chacun avec 50 activités à heure explicite, et 25 500 occurrences pour un appareil/compte. Une première exécution, concurrente avec build/tests sur ce PC, a mesuré 19 939 ms pour les récaps et 40 471 ms pour les occurrences. Après réutilisation de la projection dans le planificateur et des instants identiques dans chaque projection : 2 607 ms et 3 607 ms lors d'une seconde exécution. Les conditions de charge du PC diffèrent, donc aucun pourcentage de gain contrôlé n'est revendiqué. La fixture fait commencer les 50 activités à la même heure : elle n'est pas représentative de toutes les journées. Zéro appel météo et zéro requête réseau ; aucune mesure de capacité distante.

## Non exécuté

Migration distante, déploiement, cron, authentification Google réelle, inscription/réception push physique, envoi email réel, validation métier terrain et import/réimport dans Apple Calendar, Google Calendar ou Outlook. La disponibilité d'un secret ou d'un service distant n'est pas présumée. La configuration factice produite par le gate ne doit pas être publiée.

## Reprise / exploitation

Guide d'activation, arrêt, rétention et retour arrière : `NOTIFICATIONS.md`. Les états `uncertain` ne doivent pas être renvoyés automatiquement. Les changements hors ligne ne sont connus du serveur qu'après synchronisation. Les pièces obligatoires ne sont pas inventées à partir de la valise ou du contenu des documents.
