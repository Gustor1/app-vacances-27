# Lot 05 — Un compagnon utile sur place, principalement local

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Réutiliser Maintenant, préparation des journées, favoris et carte à montrer s'ils existent déjà. Le lot 04 est facultatif.

## Résultat

L'utilisateur voit les points réellement incomplets de son programme, retrouve une adresse à montrer et peut choisir une alternative ou une courte activité enregistrée. Aucun besoin de chatbot ni API nouvelle pour le cœur du lot.

## 1. Contrôle avant départ

Créer une liste courte, actionnable, sans score artificiel : rattachement non résolu, information importante explicitement demandée mais absente, réservation indiquée comme à faire, chevauchement lorsque début ET fin/durée sont connus.

Ne pas alerter sur chaque adresse facultative vide. Une heure de début seule ne suffit pas à prouver un conflit. Aucun visa, exigence médicale, document légal ou temps de trajet déduit sans source adaptée. Chaque remarque explique son origine et ouvre la correction correspondante. L'utilisateur peut la résoudre ou l'écarter pour cette version des données ; une modification pertinente réévalue le signalement.

## 2. Carte à montrer

Auditer et améliorer l'existant avant création : nom local, adresse, établissement choisi, copie, lien de navigation et hébergement de retour sélectionné. Grand texte lisible, accessible hors ligne depuis le carnet.

Garder la source de l'adresse. Pas de traduction inventée, coordonnées Amap/Google non interchangeables, aucun choix automatique d'hôtel ambigu. Sur appareil partagé, ne pas exposer référence de réservation ou note privée dans la carte à montrer.

## 3. « J'ai un peu de temps »

Filtrer les favoris/bonus du carnet par ville ou distance à vol d'oiseau si coordonnées connues. Permettre un budget de temps choisi, mais n'affirmer « tient en 45 minutes » que si durée et déplacement pertinents sont renseignés. Sinon afficher des idées dont la durée reste à vérifier.

Aucune recherche externe automatique. Prendre en compte activités déjà faites, exclusions et préférences explicites. L'utilisateur choisit avant ajout au programme ; conserver une annulation.

## 4. Plan B

Réutiliser le système de comparaison/adoption des journées et ses alternatives. Permettre une alternative couverte ou « moins fatigante » étiquetée par l'utilisateur, et un échange prévisualisé. Préserver réservations, notes et historique ; avertir sur une activité réservée.

Météo facultative seulement si un accès gratuit compatible avec l'usage réel est vérifié. Open-Meteo hébergé gratuit est conditionné au non-commercial : ne pas l'activer par défaut dans une app destinée à la monétisation. Sans droit confirmé, livrer le plan B manuel et une interface météo désactivée seulement si elle est nécessaire au code, sans écran vide.

Une prévision future hors horizon n'est pas disponible ; les saisons/climats ne sont pas une prévision quotidienne. Toujours indiquer source/date et données périmées.

## Fin

Tests : dates/fuseaux, durées inconnues, aucune coordonnée, doubles visites, rôle lecteur, données partagées, modification concurrente, annulation, export/restauration et mode avion. Contrôler les faux positifs sur carnets incomplets volontairement.

Pas de notifications serveur, paiement, assistant général ni optimisation routière. Gate commun. Rapport `docs/development/lot-05-compagnon/RAPPORT.md` avec fonctionnalités réutilisées, ajouts et limites.

