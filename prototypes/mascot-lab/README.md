# L’atelier des compagnons Détours

Prototype local du lot 08 bis, préparé le 24 octobre 2026 pour valider le dessin, les animations et les interactions avant intégration dans Détours.

## Essayer

Depuis la racine du dépôt, avec Node.js :

```powershell
node prototypes/mascot-lab/server.mjs
```

Ouvrir <http://127.0.0.1:5198/>. Arrêter avec `Ctrl+C`. Le serveur écoute uniquement sur cet ordinateur. Il ne faut pas ouvrir directement `index.html` en `file://`.

1. Choisir **Pico**, **Mochi** ou **Bivouac**.
2. Tester **Au repos**, **Salut !**, **La carte**, **Dodo**.
3. Changer de palette et de mode clair/sombre. Les accessoires reprennent la couleur d’accent ; le corps du personnage garde son identité.
4. Cliquer sur le personnage : **En ce moment**, **J’ai un peu de temps**, **Un coup de main**.
5. Plus bas, changer l’horloge du carnet fictif pour essayer les raccourcis. Sans horaires, le premier ouvre la journée.
6. Désactiver les animations ou masquer le compagnon. Les préférences survivent au rechargement.
7. **Déplacer le petit compagnon flottant** à la souris ou au doigt. Un glissement ne déclenche pas le menu ; un clic l’ouvre. Au clavier : focus sur le compagnon, puis Maj + flèches. Sa position est mémorisée et reste dans la fenêtre après redimensionnement. Le bouton « Replacer le compagnon sur le côté » réinitialise la position.

Le grand personnage dans le cadre sert à examiner les poses. Le petit personnage flottant représente le comportement prévu dans l’application. Il reste dans la fenêtre de Détours : ce site ne crée pas de compagnon au-dessus des autres applications du système.

## Ce qui fonctionne ici

- Trois planches transparentes originales, 24 poses par personnage, animées dans un canvas.
- Pico par défaut ; alternatives Mochi et Bivouac.
- Douze palettes issues de Détours, clair/sombre.
- Menu à trois actions, fermeture extérieure et Échap, retour du focus.
- Préférence de visibilité et de mouvement ; prise en compte de `prefers-reduced-motion`.
- Pause des animations quand le personnage ou la page n’est pas visible.
- Mise en page adaptée aux écrans étroits.
- Compagnon flottant, déplacement par Pointer Events, clavier, position persistante, menu repositionné aux bords.

## Frontière du prototype

Les horaires, activités et idées de Kyoto sont **fictifs**. Aucun carnet, compte ou service de Détours n’est lu ou modifié. Le bouton d’assistance affiche une explication, sans appel d’IA. Les préférences utilisent uniquement `detours-mascot-lab-preferences-v1` sur l’origine locale de la démo.

La position utilise `detours-mascot-lab-position-v1`. Test ciblé : `node --test prototypes/mascot-lab/floating.test.mjs`. Les séquences de pointeur sont simulées dans ce test ; elles ne remplacent pas un essai tactile sur téléphone.

Ce dossier n’est pas une entrée du build Vite. L’application conserve sa mascotte actuelle tant que le composant de production n’a pas été remplacé dans un lot séparé.

Les trois PNG pèsent environ 6,1 Mo au total. Ils sont conservés intacts ; la teinte est appliquée au rendu. Avant intégration, préparer un atlas optimisé avec coordonnées explicites, charger uniquement le personnage choisi et mesurer le coût mémoire sur mobile. Le découpage actuel détecte les espaces transparents des planches ; il convient à ces trois fichiers vérifiés, pas à des images arbitraires.

## Suite après validation visuelle

1. Ajuster la taille, le rythme et les poses selon le retour utilisateur.
2. Créer un composant React isolé, préserver la préférence existante de masquage et ajouter le choix du personnage sans modifier les carnets.
3. Relier les trois raccourcis aux vues existantes. Calculer l’activité du moment uniquement avec la date, le fuseau et les horaires réellement renseignés ; sinon ouvrir la journée.
4. Traduire les nouveaux textes dans les quatre langues et vérifier accessibilité, hors ligne et PWA.
5. Valider dans l’application, puis sur un vrai téléphone. Une vérification navigateur à largeur mobile ne prouve pas le fonctionnement sur iPhone.

Voir [le rapport et les captures](../../docs/development/lot-08-bis-prototype/RAPPORT.md).
