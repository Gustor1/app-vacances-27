# Lot 08 — Une mascotte discrète pour Détours

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Fonctionne avec ou sans modèle IA. Conserver l'interface de base.

## Résultat

Ajouter une touche d'identité et guider l'utilisateur dans trois moments utiles : premier carnet, passage d'import à vérifier, préparation hors ligne terminée. La mascotte ne doit pas rendre l'app plus encombrée.

## Direction de départ

Une petite hirondelle voyageuse avec sacoche, formes simples, ailes évoquant un chemin. Nom de travail « Détour », sans prétendre que sa disponibilité comme marque a été vérifiée. Préparer une première version intégrée réversible plutôt qu'une refonte. Conserver les icônes actuelles de l'application : la mascotte ne les remplace pas automatiquement.

Créer des assets originaux, traçables et légers, avec leurs sources. Utiliser un outil de génération d'images seulement s'il est disponible et dans le périmètre autorisé ; sinon produire une illustration vectorielle simple originale. Aucun asset récupéré sans licence. Documenter provenance et licence des éléments utilisés.

## Implémentation

États sobres : bienvenue, attention douce, prêt. Associer chaque état à un état produit vérifié. « Prêt » signifie que les contrôles de disponibilité du carnet ont réussi, pas que tout le voyage est garanti.

Présence dans les zones existantes, pas de bulle flottante couvrant carte, formulaire ou navigation. Texte compréhensible sans dessin. L'image est décorative quand son texte adjacent transmet déjà l'information, sinon alternative textuelle adaptée.

Préférence personnelle « Afficher la mascotte », conservée sans changer le carnet partagé. Mode mouvement réduit, pas d'animation continue ni son, pas de notification ni culpabilisation. Éviter répétition de l'accueil après chaque ouverture ; respecter isolation des comptes.

Si le lot 07 existe, la mascotte peut illustrer son entrée sans inventer une capacité de chatbot. Sans 07, elle guide les parcours ordinaires.

## Validation

Vérifier thèmes clair/sombre, 320/390/1440 px, zoom 200 %, clavier, lecteur d'écran et quatre langues. Désactivation immédiatement effective et persistante après rechargement, aucune action cachée derrière une animation.

Mesurer le poids ajouté ; viser moins de 150 Ko pour l'ensemble initial sauf justification. Aucun accès réseau obligatoire pour afficher la mascotte. L'application reste complète lorsque les images échouent à charger.

Rapport `docs/development/lot-08-mascotte/RAPPORT.md` avec captures comparables avant/après, provenance des assets et contrôles. Gate commun. Les préférences esthétiques peuvent être ajustées ensuite ; ne pas démarrer un nouveau design global.

