# Atelier visuel Détours

Deux directions, trois écrans, mêmes contenus fictifs. Aucun import du code produit, aucun stockage navigateur, aucun accès réseau externe. Les SVG sont dessinés localement. La simulation ne lit pas de fichier et ne crée pas de carnet réel. Prototype français uniquement ; les quatre langues de l'application actuelle restent intactes.

Depuis la racine du dépôt : `node prototypes/visual-review/server.mjs`.

- [Carnet éditorial](http://127.0.0.1:4318/?direction=editorial&screen=home)
- [Compagnon pratique](http://127.0.0.1:4318/?direction=practical&screen=home)

Les boutons du bandeau changent la direction sans changer l'écran. La navigation propose accueil, journée et aperçu import. Tester filtres, ouverture de carnet, cases d'activités, détails/Escape, simulation d'ajout et réinitialisation. Les autres boutons expliquent leur portée de démonstration.

Le serveur écoute uniquement la boucle locale, ne sert que quatre fichiers autorisés et interdit les connexions réseau par CSP. Aucun paquet à installer. Arrêter avec Ctrl+C. Recharger réinitialise les interactions. Les liens locaux nécessitent ce serveur sur ce PC ; ils ne sont pas des liens publics ni un accès depuis un téléphone physique.

Captures et audit : `docs/design-review-2026-10-13/`. Ne pas intégrer directement ces fichiers au produit : l'aperçu doit être raccordé aux validations existantes, traduit et testé avant une future livraison.
