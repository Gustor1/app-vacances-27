# Détours — revue visuelle du 13 octobre 2026

**À lire au réveil : les deux prototypes sont prêts à comparer, l'interface actuelle est intacte.** Je recommande **B, compagnon pratique**, comme base fonctionnelle. A offre une identité plus éditoriale ; sa typographie et ses couleurs peuvent inspirer les couvertures sans réintroduire un grand bandeau avant les activités.

- [Essayer A — carnet éditorial](http://127.0.0.1:4318/?direction=editorial&screen=home)
- [Essayer B — compagnon pratique](http://127.0.0.1:4318/?direction=practical&screen=home)
- [Galerie comparative des captures](gallery.html)
- [Audit détaillé du code](CODE-UI.md) · [Plan de nettoyage et niveaux de confiance](CLEANUP.md)

Le serveur local écoute sur ce PC. Pour le relancer depuis la racine : `node prototypes/visual-review/server.mjs`. Il ne rend pas le prototype accessible sur un téléphone externe. Les dimensions mobiles sont des simulations navigateur, pas une validation iPhone.

## Trois étapes examinées

1. **Retrouver un voyage — fonctionnel, hiérarchie à alléger.** Accueil testé vide puis avec l'exemple fictif Chine. Sur 390 px, illustration du premier carnet vers 670 px, titre encore plus bas. Les filtres et le panneau de stockage occupent l'espace avant le contenu. Chaque carte porte cinq actions de gestion. Proposition : reprise visible, cartes plus compactes et menu secondaire nommé par voyage.
2. **Consulter sa journée — fonctionnel, accès trop indirect.** Exemple Chine → planning → journée Arrivée ; navigation mobile ouverte et retour à l'accueil. Le titre « Arrivée » apparaît à environ 1 343 px du haut. La capture du contenu montre ensuite une imbrication de panneaux et plusieurs contrôles par activité. Proposition : date/ville/activités en tête, couverture dans la vue d'ensemble, détails à la demande.
3. **Vérifier un import — parcours incomplet pour l'import classique.** L'export d'une collection fictive a été sélectionné dans « Restaurer mes données », puis le bilan a été annulé. Le bilan conserve bien les avertissements et permet de revenir, mais parle de « collisions » et ne nomme pas les carnets. L'import classique, vérifié dans le code, écrit directement après validation. Proposition : aperçu nominatif, quantités, informations manquantes et confirmation. L'écran prototype est une proposition nouvelle, pas une fonctionnalité livrée dans Détours.

## Preuves visuelles et effets

| Observation actuelle | Preuve / emplacement | Effet probable | Correction proposée |
|---|---|---|---|
| Introduction, hero, villes puis journée | [Planning mobile](captures/current-day-mobile.png), App.tsx:215–218 | Défilement avant de trouver une activité | Faire commencer le planning par la journée |
| Cinq actions de gestion par carte | [Accueil mobile](captures/current-home-mobile.png), JourneysApp.tsx:185 | L'ouverture du carnet rivalise avec la gestion | Une action principale et menu secondaire |
| Recherche calculée à 12,6 px sur mobile | `.search-box input`, apple-design.css:514, mesure navigateur | Lecture fine ; risque de zoom automatique Safari, non vérifié physiquement | Champ à 16 px au moins, zoom utilisateur conservé |
| Petits libellés et icônes d'édition proches du contenu | [Contenu de journée](captures/current-day-content-mobile.png) | Repérage moins rapide des actions secondaires | Regroupement, libellés explicites, cibles tactiles généreuses |
| Import/export et sauvegarde/restauration en deux panneaux voisins | [Accueil mobile](captures/current-home-mobile.png), JourneysApp.tsx:187, BackupPanel.tsx:83 | Le choix dépend de la compréhension des formats | Distinguer ajouter un carnet et protéger/restaurer sa collection |
| Bilan technique sans titres de carnets | [Restauration mobile](captures/current-restore-mobile.png), BackupPanel.tsx:92 | Effet concret difficile à anticiper | Nommer les carnets avant les détails techniques |

Les couleurs bleues, les arrondis et la police sans empattements actuels ne sont pas des défauts démontrés. Les remplacer par crème/terre cuite/serif est une **préférence esthétique**. La hiérarchie et la lisibilité sont les problèmes structurants. Le détail des dix constats et des acquis se trouve dans CODE-UI.md.

## Comparaison des prototypes

| | A · Carnet éditorial | B · Compagnon pratique |
|---|---|---|
| Intention | Plaisir de parcourir ses carnets | Retrouver rapidement une information en voyage |
| Langage | Papier crème, terre cuite, titres Georgia, filets, grandes illustrations | Blanc, vert profond, police système, cartes arrondies, couvertures plus petites |
| Même contenu | Chine 8–24 mai 2027, Lisbonne sans dates ; mêmes trois activités et aperçu | Identique |
| Compromis | Plus expressif, accueil plus long | Plus direct, identité moins singulière |
| Recommandation | Référence pour les couvertures et souvenirs | Base proposée pour la navigation et les journées |

Le choix B n'est pas une victoire mesurée auprès d'utilisateurs. Dans les captures mobiles, le titre de journée est vers 306–311 px dans les deux propositions, bandeau de comparaison compris. A peut même tenir sur une ligne là où B en occupe deux : la lisibilité et l'identité sont à comparer, pas seulement les pixels gagnés. L'accueil des prototypes reste perfectible : le bandeau d'atelier et la navigation de démonstration ajoutent de la hauteur ; ils n'ont pas vocation à être intégrés tels quels au produit.

Interactions exécutables : changement de direction en conservant l'écran, trois écrans, filtres, détails natifs, cases d'activité, simulation d'import et réinitialisation. Les actions de sauvegarde/préparation affichent une explication de démonstration. Aucun vrai parseur, réservation, carte de navigation ou compte connecté. Prototypes en français seulement ; les quatre langues et fonctions actuelles ne sont pas modifiées.

## Product Design appliqué

La compétence **Product Design / audit** a été utilisée après son invocation : préflight sans contexte enregistré, grille combinée UX/accessibilité, parcours numéroté, captures actuelles, forces/risques/limites séparés. L'application actuelle a d'abord été parcourue dans un profil Chrome jetable ; les prototypes ont ensuite été examinés et capturés dans le navigateur intégré Codex. Les images enregistrées ont été ouvertes et examinées. Aucun générateur d'images ni API payante appelé.

Forces conservées : identité chaleureuse, états de stockage explicites, retour possible, données manquantes nommées, aucune faisabilité inventée. Risques restant à traiter lors d'une intégration : densité avec longues traductions, lecteurs d'écran, grandes collections, import réellement invalide ou partiel, droits serveur et vraie synchronisation.

## Préservation et reprise

Base récupérée : `origin/codex/carnets-universels`, commit `9fa03b15c6dfeba7129b11df538edba1ea9d0a94`, identique au HEAD initial. Branche créée : `codex/interface-prototypes`.

Snapshot : `C:\Users\eliot\Documents\app-vacances-27-backups\2026-10-13-ui-prototypes`, avec `source/`, `history.bundle`, `manifest.json`. **297 fichiers vérifiés par SHA-256, aucune différence** entre la copie et les fichiers préexistants. Les quatre documents non suivis initiaux sont inclus et préservés. Secrets et fichiers ignorés exclus ; les données réelles n'ont pas été lues ou modifiées. Ce snapshot protège les sources, pas une sauvegarde des données personnelles du navigateur.

Pour récupérer, consulter d'abord le manifeste ; recopier les fichiers nécessaires depuis `source/` dans un autre dossier ou cloner `history.bundle` dans un nouveau dossier. Ne pas réinitialiser le checkout actuel. Pour abandonner le prototype, arrêter son serveur : aucun changement de produit à annuler.

Aucun fichier produit modifié, aucun fichier supprimé, aucun push ni déploiement. Le gate a régénéré `dist/` ignoré avec sa configuration de test : ce build ne doit pas être publié.

## Nettoyage

Conserver migrations, catalogues legacy, documents chargés dynamiquement, scripts alias et archives de preuve. Deux candidats **conditionnels** : cache CLI suivi Git (8 octets) et ancien fond régional (~1 Mo), encore généré et précaché. Le second exige des essais de mise à jour du worker et de cartes hors ligne avant tout retrait. [Justifications, confiance et ordre des lots](CLEANUP.md).

## Contrôles

- Parcours actuel sur 1440 × 1000 et 390 × 844 ; largeur 320 px contrôlée sur le planning. Profils fictifs, requêtes externes bloquées pendant ce parcours.
- Douze captures prototypes : 2 directions × 3 écrans × ordinateur/mobile. Aucun débordement horizontal sur les six vues à 320 et 390 px ; reflow à 640 px, équivalent de largeur d'une fenêtre 1280 px à 200 %, sans prétendre tester le zoom physique.
- Filtrage, case cochée et compteur, détails, Escape et retour du focus, simulation/réinitialisation d'import vérifiés ; focus clavier visible. Zoom non limité dans le viewport. Mouvement réduit prévu par CSS ; aucune animation nécessaire au parcours.
- Contrastes calculés des principales paires texte/fond : B texte 11,92:1, secondaire 5,15:1, bouton 7,90:1 ; A texte 13,20:1, secondaire 4,54:1, bouton 6,28:1. Ce contrôle de palette n'est pas une certification WCAG exhaustive.
- Premier `verify:local` : toutes les étapes passent, mais statut final échec car des fichiers prototypes ont été créés pendant le contrôle de stabilité. Nouvelle exécution sur fichiers stabilisés : voir VALIDATION.md.
- Non vérifiés : iPhone/Safari physique, lecteur d'écran, OAuth réel, services distants et intégration des prototypes dans les quatre langues.

## Décisions attendues

Choisir A ou B comme direction, éventuellement B avec les couvertures de A. Valider ensuite le périmètre d'une intégration progressive : hiérarchie journée, accueil, puis aperçu d'import. Le nettoyage reste un lot distinct et aucun retrait n'est proposé sans ses validations préalables.
