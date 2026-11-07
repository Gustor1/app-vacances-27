# Recette humaine — appareils, services réels et jugement utilisateur

Référence locale : `6e319457ec9f20fe5720979640e950b7a4c0dccc`. Tous les essais ci-dessous sont **non exécutés** par ce volet. Utiliser des carnets fictifs et noter version réellement servie, date, appareil/OS/navigateur, captures autorisées et résultat. Une éventuelle bêta plus ancienne ne valide pas le SHA local. Ne pas déployer le build factice du gate pour cette recette.

## Appareil physique

| Essai | Étapes | Résultat attendu |
|---|---|---|
| Safari iPhone installé | Exporter les données de test, installer depuis Safari; relever nom/icône et ouvrir depuis l'écran d'accueil | Détours correctement nommé; aucune promesse implicite de transfert des carnets entre espaces |
| Clavier iOS et zones sûres | Créer/importer puis éditer une activité; tester portrait, paysage, clavier ouvert, fermer et rouvrir | Champs, actions et focus atteignables; absence d'actions cachées par clavier/encoche |
| Hors ligne réel | Préparer en ligne un carnet fictif, fermer, mode avion, rouvrir l'app installée | Planning/notes/fond général disponibles; rues et liens externes annoncés indisponibles; aucune disparition de saisie enregistrée |
| Reprise après réseau instable | Modifier hors ligne, suspendre/reprendre l'app, rétablir réseau | Données locales conservées; état de synchronisation honnête sans duplication |
| Ancienne installation | Avec sauvegarde et ancien worker de test autorisé, ouvrir formulaire; proposer version nouvelle puis reprendre | Pas de rechargement automatique d'une édition; mise à jour volontaire après enregistrement/fermeture; identité app conservée |
| Mascottes au doigt | Pico/Mochi/Bivouac, quatre coins, menu, gestes annulés, défilement, rotation, clavier virtuel | Hitbox cohérente, pas d'obstruction des barres/actions, menu entier accessible, préférence masquée conservée |
| Mouvement réduit réel | Activer réduction système pendant l'app ouverte | Animations réduites sans perte d'action ni saut de navigation |
| VoiceOver et clavier | Accueil → importer → corriger → jour → adresse → export; fenêtres imbriquées et mascotte | Noms/états annoncés, ordre cohérent, fond de fenêtre non accessible, retour de focus approprié |
| Zoom/texte système | Zoom navigateur 200 %, taille texte système accrue, portrait/paysage | Reflow sans perte de commande; texte long dans les quatre langues et contraste des états de sélection/focus lisibles |

## Comptes et droits réels (environnement autorisé)

1. Deux comptes distincts et un carnet fictif : propriétaire invite lecteur puis éditeur. Le lecteur consulte mais ne modifie pas; les refus sont démontrés au serveur, pas seulement dans les boutons.
2. Préparer une modification, retirer le droit avant l'envoi, reprendre : refus serveur, conservation récupérable du travail et aucune exposition entre comptes.
3. Invitation expirée/révoquée : lien refusé; renouvellement explicite; aucun ancien droit récupéré par connaissance de l'identifiant.
4. Déconnexion/reconnexion et deux onglets : aucun carnet, brouillon, photo ou préférence personnelle du précédent compte n'apparaît dans le nouveau périmètre.
5. OAuth Google réel : connexion, refus, annulation et retour après navigateur externe; aucun jeton dans URL de rapport, capture ou journal partagé.
6. Synchronisation après conflit et quota : deux sources récupérables, résolution explicite et relecture des données finalement autorisées.

Ces essais nécessitent choix de cible et comptes par leur propriétaire; l'audit local ne les annonce pas exécutés. Ne pas modifier une politique RLS ni une base distante pour faciliter la recette.

## Jugement utilisateur

- Sur un planning personnel préalablement expurgé, observer les ambiguïtés détectées, corrections et omissions; compter corrections nécessaires avant de se fier au programme. Ne pas envoyer le document à une API pour cet essai local.
- Demander à Eliot de retrouver une réservation et l'hébergement depuis Maintenant sans consigne; noter les hésitations et le nombre d'actions.
- Observer la fermeture incidente d'un éditeur : l'abandon immédiat est-il attendu ou faut-il avertir/conserver un brouillon ? Distinguer Annuler volontaire et geste accidentel.
- Faire expliquer la différence entre export de carnet, sauvegarde historique et paquet des photos quotidiennes. Une hésitation répétée justifie une simplification contextualisée; aucune refonte globale acquise.

## Fiche à remplir

Pour chaque essai : identifiant, SHA/build servi, appareil/OS/navigateur/version, mode installé ou navigateur, langue/thème, préconditions, étapes, attendu/observé, capture expurgée, résultat et limite. Conserver les preuves hors dépôt; ne partager aucun carnet personnel, token ou email de compte.

## Reprise du volet visuel

Le preview dédié a été fourni le 31/10/2026 sur 4179 (build `ee91233738a522d1062fe667865b2a7b97578324e9c810c7256ebfd12d29c035`), mais l'ouverture IAB a échoué (`Browser is not available: iab`) et l'inventaire CUA retournait zéro navigateur. Un fallback Chrome/Playwright a ensuite capturé et inspecté sept états sur ce build : accueil390, création, abandon Escape, source import, aperçu, carnet390 puis1440. La correction importée survit au rechargement; aucun débordement horizontal sur ces deux largeurs. Voir UX-PWA.md et le dossier externe ux/. Les vérifications automatisables restantes (autres dimensions, focus complet, langues) ne nécessitent pas toutes une intervention humaine et ne doivent pas être confondues avec les essais physiques/services réels de ce document.

