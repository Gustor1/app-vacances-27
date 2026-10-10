# Calendrier Détours — validation locale N6

Dans la vue d’ensemble, le téléchargement conserve par défaut les résumés de journées entières. Les options permettent d’ajouter les activités et transports horaires, ou d’exporter seulement ceux-ci, puis de sélectionner les objets. Le téléchargement est accessible aux lecteurs : il ne modifie pas le voyage partagé.

Le fichier constitue une copie du programme à l’export. Une modification dans Détours ne met pas à jour les événements importés. Des UID stables n’assurent ni la fusion des réimports ni la suppression d’événements devenus obsolètes dans le calendrier externe.

## Contrat du fichier

- `createTripCalendar(state, now)` et les UID historiques des journées sont conservés. `createProgramCalendar` l’étend sans remplacer cette API.
- Les événements horaires viennent de `projectProgram` et des alternatives actives. Ils réutilisent les dates civiles et heures explicites de préparation ; `period`, les descriptions et les estimations de trajet ne deviennent jamais des heures.
- Une activité sans heure fiable reste dans le résumé de sa journée et n’a pas d’événement horaire à minuit. Une heure sans fuseau IANA valide ne crée pas d’événement horaire. La vue expose le nombre d’éléments exclus pour ces raisons.
- Les instants sont écrits en UTC, avec date, heure locale et fuseau d’origine dans la description. Les changements d’heure suivent le contrat commun : première occurrence pour une heure répétée, prochain instant valide pour une heure inexistante.
- Une durée explicitement connue fournit une fin. Pour un transport, l’arrivée explicite est résolue dans son fuseau d’arrivée et doit être postérieure au départ. Sans fin fiable, l’événement contient seulement `DTSTART`, sans durée inventée. [RFC 5545 §3.6.1](https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1) définit un événement de ce type comme se terminant au même instant ; sa présentation reste à vérifier client par client.
- Les identités horaires encodent le triplet voyage/type/objet en UTF-8 hexadécimal. Un changement d’heure conserve l’UID ; deux voyages ou deux types d’objet ne partagent pas leur UID. Chaque identité apparaît une seule fois. Le modèle actuel ne contient pas de lien entre `Transfer` et `Step` : deux objets distincts ne sont pas fusionnés par une heuristique de titre ou d’horaire. Les temps de liaison `transferMinutes` ne sont pas exportés comme des transports supplémentaires.
- Les champs textuels sont échappés, les lignes pliées à 75 octets UTF-8, les fins de ligne sont CRLF. Les liens utilisent uniquement HTTP/HTTPS, avec `trip`, `kind` et `object` encodés dans les paramètres.
- Les alarmes sont désactivées par défaut. L’utilisateur peut choisir 15, 30, 60 et 1440 minutes, plus un délai personnalisé entier de 1 à 10 080 minutes. Les délais sont dédupliqués, limités à cinq, et écrits en `VALARM`/`DISPLAY`. Le délai d’un jour représente exactement 24 heures. Les résumés de journées entières n’ont pas d’alarme ajoutée.

## Preuves et limites

Le 10 octobre 2026, `node --test tests/calendar.test.mjs` a réussi 12 tests : dates réelles, export historique, échappement, pliage UTF-8, fuseaux, UID, sélection, alternatives, absence de fin inventée, alarmes, transports avec fuseaux distincts et DST. Ces tests vérifient le fichier produit et la logique partagée.

Apple Calendar, Google Calendar et Outlook n’ont pas été testés dans leurs interfaces réelles. Leurs durées affichées sans `DTEND`, traitement des alarmes et politique de réimport sont donc non vérifiés. Aucun essai iPhone physique n’a été effectué.

Avant de déclarer une compatibilité client, importer un fichier de test non personnel avec résumé entier, événement à durée connue, événement sans fin, trajet inter-fuseaux et deux alarmes ; observer chaque horaire et alarme, modifier puis réimporter avec le même UID, et consigner la présence de doublons ou de mises à jour. Répéter dans chacun des trois clients, puis sur les appareils visés. L’export local n’active aucun service distant et ne nécessite pas de secret.
