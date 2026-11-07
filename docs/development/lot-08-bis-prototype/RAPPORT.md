# Lot 08 bis — prototype des compagnons animés

Date : 24 octobre 2026. Branche : `codex/mascotte-pixel-demo`.

## Résultat

Une démonstration indépendante est disponible dans `prototypes/mascot-lab/`. Pico, l’hirondelle, est le compagnon par défaut. Mochi, l’axolotl, et Bivouac, le sac à dos vivant, sont sélectionnables. Chaque personnage dispose de poses animées de repos, salut, lecture de carte et sommeil.

Les accessoires reprennent les accents des douze palettes de l’application. Le clic ouvre trois raccourcis : activité du moment, idées mises de côté et aide. Une journée fictive à Kyoto illustre leur fonctionnement avec plusieurs heures et une variante sans horaires. Le choix, le thème, les animations et le masquage sont conservés dans un stockage propre au prototype.

Le prototype est prêt pour un avis sur son apparence et ses mouvements. **Il n’est pas intégré à l’application** et ne calcule pas encore l’activité réelle d’un voyage.

## Fichiers

- `index.html`, `style.css`, `app.js` : interface et interactions de démonstration.
- `sprites.js` : lecture des poses, teinte des accessoires, pause hors écran et mode statique.
- `assets/pico.png`, `assets/mochi.png`, `assets/bivouac.png` : trois planches originales transparentes générées pour Détours, 24 poses chacune.
- `server.mjs` : serveur local, sans dépendance ajoutée, port 5198 limité à `127.0.0.1`.
- `README.md` : lancement, périmètre et étapes d’intégration.

## Vérifications ciblées réellement effectuées

Contrôles interactifs dans le navigateur intégré, avec voyage fictif uniquement :

- Chargement des trois personnages et des cinq zones de rendu sans erreur console constatée.
- Sélection exclusive : seule la carte du personnage choisi affiche sa coche.
- Affichage des poses, salut suivi d’un retour au repos. Correction de la synchronisation lorsque seul le petit compagnon du carnet est visible.
- Arrêt des animations : pose de sommeil de Mochi stable à deux observations successives.
- Palettes claire/sombre et personnalisation des accessoires observées ; pas de mesure systématique des contrastes des 24 combinaisons.
- Affichage sans débordement horizontal aux largeurs de viewport 320, 390 et 1280 pixels (largeurs de document constatées : 305, 375 et 1265 pixels, scrollbar exclue).
- Menu du grand personnage à trois actions, testé visuellement sur écran étroit sans recouvrir le personnage.
- Menu du petit personnage, fermeture par Échap et retour du focus au bouton déclencheur.
- Cas 09:30 → marché Nishiki ; 12:00 → déjeuner ; 17:00 → Yasaka ; sans horaires → journée entière. Les heures sont simulées.
- Raccourcis idées et aide ouvrant leurs panneaux respectifs.
- Masquage conservé après rechargement ; raccourcis ordinaires toujours accessibles.
- `node --check` réussi sur `app.js`, `sprites.js` et `server.mjs`.

Le support de `prefers-reduced-motion` et la pause de page sont présents dans le code ; aucun changement du réglage système d’un appareil réel n’a été testé. Aucun test sur iPhone physique, OAuth, synchronisation distante ou service d’IA n’est revendiqué.

Captures : [Pico sur ordinateur](pico-desktop.png), [menu sur mobile simulé](pico-menu-mobile.png), [Bivouac en sombre](bivouac-sombre.png).

## Préservation et livraison

Les modifications préexistantes des lots précédents sont conservées. Les nouveaux fichiers de cette tâche sont dans le prototype et ce dossier de preuves. `preservation-before.json` contient les empreintes des fichiers applicatifs à la reprise de cette tâche, pour comparaison finale.

La comparaison consignée dans `preservation-after.json` couvre 268 fichiers applicatifs : aucun fichier modifié ou manquant par rapport à cette reprise. Elle ne signifie pas que le dépôt était propre avant la tâche.

Le gate général `npm run verify:local` est exécuté séparément des contrôles du prototype. Son résultat final est consigné dans `gate/validation.json` et le complément de vérification ci-dessous. Le gate du projet ne couvre pas cette démo indépendante. Il utilise un backend simulé et produit un `dist/` de test à ne pas publier.

Aucun commit, push, déploiement, changement Supabase ou audit correctif des autres lots n’a été effectué dans cette tâche.

## Avant l’intégration

- Recueillir l’avis sur le style, la taille et le rythme des mouvements.
- Optimiser les ressources : environ 6,1 Mo de PNG source ; limiter le chargement au personnage choisi et remplacer l’analyse des pixels au démarrage par des coordonnées d’atlas explicites.
- Adapter le moteur à React avec libération des timers/observateurs et validation du coût mémoire mobile.
- Préserver les préférences existantes et l’isolation des comptes ; ajouter les quatre traductions.
- Brancher la navigation et l’assistant existants, sans nouvelle écriture implicite dans les carnets.
- Définir le calcul réel de l’activité en cours : date/fuseau, horaires/durées, alternatives, fin de journée et absence de données. Ne pas assimiler automatiquement la première étape non cochée à l’activité en cours.

L’étape suivante dépend du retour visuel de l’utilisateur, pas d’une permission technique ou d’une publication.

## Reprise : compagnon flottant et déplaçable

À la demande de l’utilisateur, le petit compagnon est désormais fixé au-dessus de la page, indépendant du défilement. Il peut être déplacé à la souris, au doigt via Pointer Events ou avec Maj + flèches. Le grand personnage reste une présentation des poses.

`floating.js` gère le seuil séparant clic et déplacement, la capture du pointeur, l’annulation, le confinement dans la fenêtre, la mémorisation d’une position relative et le placement du menu selon l’espace disponible. Un bouton réinitialise la position. La préférence de masquage s’applique aussi à cette version flottante. Le périmètre reste la fenêtre web/PWA, pas le bureau du système.

Vérifications supplémentaires :

- Test Node `floating.test.mjs` réussi : petit mouvement conservé comme clic, glissement sans ouverture parasite, annulation et remise en place, limites d’écran, activation clavier, position enregistrée, redimensionnement et menu sous le personnage au bord supérieur. Ces événements sont simulés dans un environnement unitaire.
- Dans le navigateur : déplacement avec Maj + flèches, position retrouvée après rechargement, confinement dans le coin supérieur gauche, menu maintenu dans le viewport de 390 × 844, masquage/réaffichage, réinitialisation et ouverture des raccourcis.
- Correction d’un défaut visuel repéré pendant le contrôle : le filtre d’ombre du conteneur décalait le menu fixe hors de l’écran. L’ombre est désormais portée par le dessin uniquement.
- Aucune erreur console constatée dans ces interactions. Un vrai glisser-déposer a ensuite été effectué dans l’onglet localhost via le contrôle natif du navigateur : déplacement de Pico, menu restant fermé après dépôt, ouverture au clic suivant, puis position conservée au rechargement. Le tactile sur téléphone physique reste à vérifier.

Capture : [compagnon flottant et menu au-dessus du carnet](pico-flottant-mobile.png).

Le gate général récupéré de la session interrompue a réussi ses 32 contrôles (`exitCode: 0`, `sourceUnchanged: true`), rapport daté du 24 octobre à 02:38, **avant cet ajout du déplacement**. Ce gate n’a pas été relancé pour cet ajout isolé ; les contrôles ciblés ci-dessus couvrent le nouveau module. Le build produit n’inclut pas le prototype. Sept fichiers de preuves préexistants réécrits par le gate ont été restaurés depuis la sauvegarde externe vérifiée ; voir `gate/restored-evidence.json` et `gate/backup-path.txt`.

Capture finale après le contrôle du glisser-déposer : [Pico flottant](pico-flottant-final.png).

## Ajustements de la zone interactive

Le fond rectangulaire au survol a été retiré. Le focus clavier utilise un léger repère sur le dessin, sans cadre rectangulaire.

La zone interactive est ensuite limitée aux bornes de la pose dessinée, avec une marge de 8 pixels dans le canvas source (environ 3 pixels à la taille flottante). Le grand vide au-dessus et les marges latérales ne capturent plus les clics. Les conteneurs flottants laissent passer les événements ; seuls le personnage et le menu sont interactifs. Pendant le chargement, la zone du personnage est inactive.

Vérification navigateur avec Mochi : `elementFromPoint` renvoie la page dans le vide supérieur et la marge gauche, et le bouton sur le corps. Ouverture du menu au clavier réussie. Glisser-déposer réel après correction réussi, sans ouverture parasite au dépôt. `node --check sprites.js` et le test ciblé de déplacement ont réussi. Pas de relance du gate produit pour ces ajustements isolés au prototype.

Capture : [zone interactive resserrée](mascotte-hitbox-resserree.png).
