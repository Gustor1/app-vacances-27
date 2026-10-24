# Détours — Harmoniser le mode clair avec le nouvel oiseau

Date : 18 octobre 2026. Statut : **brief d’implémentation, UI non modifiée par ce document**.

## Mission à transmettre à l’IA

Adapter la palette de toute l’interface en **mode clair** à la nouvelle identité de Détours : oiseau vert, aile sauge, fond lin, relief discret. Conserver le **mode sombre actuel noir/anthracite et bleu**, ainsi que les parcours, la mise en page, les données et les fonctions existantes. Réaliser les modifications, les vérifications et un rapport de fin. Ne pas enchaîner sur un autre lot.

Il s’agit d’une harmonisation des couleurs et des matières visuelles, pas d’une reconstruction du site. Le résultat doit évoquer un carnet de voyage soigné : chaleureux, lisible, calme, avec des actions clairement identifiables. Éviter les grands aplats blancs éclatants, le bleu générique comme accent principal en mode clair et les surfaces toutes teintées en vert.

## 1. Décisions utilisateur et références

Décisions explicites :

- L’oiseau vert sur fond clair est la direction retenue. Le fond blanc initial était trop blanc ; la variante lin a été préférée.
- Une ombre légère sous l’oiseau est appréciée.
- Le mode clair doit reprendre cette famille de couleurs.
- Le mode nuit conserve son identité actuelle noire/bleue.
- La combinaison d’un D et d’un oiseau dans le même symbole a été jugée trop chargée.

Référence principale de travail — oiseau vert profond, aile sauge, fond lin :

![Oiseau vert sur fond lin](../design/palette-claire-detours/oiseau-lin-vert-profond.png)

Variante de comparaison — même direction avec un vert eucalyptus éclairci :

![Variante eucalyptus sur fond lin](../design/palette-claire-detours/oiseau-lin-eucalyptus.png)

**Précision sur le choix du fichier :** après la proposition éclaircie, l’utilisateur a dit « j’aime bien le premier ». Le premier visuel sur fond lin est donc retenu ici comme référence principale par interprétation ; la teinte exacte de l’oiseau reste moins certaine que la décision ferme sur la palette lin/vert/sauge. Cette ambiguïté ne bloque pas l’harmonisation du mode clair. Les couleurs ci-dessous constituent une proposition UI à vérifier, pas des valeurs hexadécimales explicitement validées par l’utilisateur.

Les deux PNG sont copiés dans le dépôt pour que l’IA destinataire n’ait pas besoin du dossier personnel de génération d’images. **Ne pas remplacer les icônes PWA ou favicon dans cette mission** : leur remplacement et le choix définitif du master sont un travail distinct. Ne pas redessiner l’oiseau ni ajouter un D. Utiliser les images comme références de couleur et de matière.

## 2. Préserver le travail en cours

Lire `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md` et ce document. Vérifier l’état réel avant d’agir :

```powershell
git status --short --branch
git diff --stat
```

À la rédaction, la branche est `codex/lot-02-pwa-mobile` et le dépôt contient de nombreux changements non commités, notamment des lots 01 et 02. `src/apple-design.css`, `src/App.tsx`, `index.html` et le manifeste sont déjà modifiés. Ne pas attribuer toutes les différences présentes à cette mission.

Faire un instantané récupérable **de l’état courant, y compris les fichiers non suivis**, avant toute modification. Le script existant convient ; choisir un nouveau dossier externe inexistant :

```powershell
node scripts/snapshot-source.mjs ../detours-palette-claire-recovery-YYYYMMDD-HHMM
```

Noter la branche, le HEAD, la liste initiale des modifications et le chemin du snapshot. Respecter le guide de branche dédiée sans perdre les travaux locaux : ne pas repartir d’une base distante plus ancienne qui omettrait ces changements. Pas de reset, clean, stash destructif ou écrasement du travail d’autrui. Conserver un diff propre à cette contribution par rapport au snapshot initial.

## 3. Palette du mode clair

Valeurs de départ cohérentes avec les visuels. Les ajuster légèrement si les mesures de contraste ou les captures le nécessitent, et documenter les valeurs finales.

| Rôle | Couleur proposée | Usage |
| --- | --- | --- |
| Fond général lin | `#E8DFD0` | Page, espaces entre les sections |
| Surface claire | `#F7F2E9` | Cartes, panneaux, fenêtres modales |
| Surface secondaire | `#EEE6D9` | Zones regroupées, barres secondaires |
| Champ de saisie | `#FAF6EE` | Fond des inputs, textarea, select |
| Texte principal | `#253B32` | Titres et texte courant, très sombre mais légèrement vert |
| Texte secondaire | `#5D685E` | Métadonnées, aides, légendes |
| Accent / action principale | `#3C6E59` | CTA, liens, éléments actifs, focus |
| Accent survol / pressé | `#305945` | Retour d’interaction des actions principales |
| Texte sur accent | `#FAF6EE` | Libellé des boutons remplis |
| Sauge décorative | `#A6BDA7` | Illustrations, détails non textuels, décor discret |
| Surface sélectionnée | `#DCE6D8` | Onglet actif, ligne sélectionnée, filtre actif |
| Texte sur sélection | `#305945` | Libellés des sélections |
| Séparateur décoratif | `#D3CBBB` | Séparation douce des cartes et sections |
| Bordure fonctionnelle | `#7A8778` | Limite d’un contrôle lorsque nécessaire pour l’identifier |

Ne pas utiliser le vert clair décoratif pour du petit texte sur fond lin. Ne pas déduire les couleurs fonctionnelles en prélevant simplement un pixel d’ombre dans le logo. Une même famille visuelle nécessite plusieurs niveaux de contraste.

Règles de rendu :

- Le lin domine le fond, les cartes sont un cran plus claires, le vert marque les actions et sélections.
- Conserver la typographie et les dimensions actuelles. La couleur ne doit pas provoquer une réorganisation des écrans.
- Ombres courtes, diffuses, peu opaques, teintées de brun/vert neutre ; pas de gros halos, de contours systématiques ou de relief 3D sur chaque carte.
- Une nuance lumineuse très légère est possible sur une grande surface d’accueil ; les zones de lecture et formulaires restent calmes. Ne pas reproduire le dégradé de l’icône derrière chaque bloc.
- Adapter les surfaces translucides au lin et leur fond opaque de repli. Vérifier les textes au-dessus de photos et pendant le défilement ; le flou seul n’assure pas la lisibilité.
- Garder des couleurs sémantiques distinctes pour erreur, avertissement, succès et information, avec texte/icône explicites. Ne pas transformer tous les états en vert.
- Les photos, drapeaux, tuiles cartographiques et couleurs des marques externes ne doivent pas être recolorés. Le bleu peut rester lorsqu’il a une signification fonctionnelle ou appartient à une marque.

## 4. Points techniques vérifiés dans le dépôt

À revalider au début de l’implémentation :

- `src/main.tsx` importe `styles.css`, puis `theme.css`, puis `apple-design.css`.
- `src/apple-design.css` porte la palette finale dans `html:root:root`, puis les valeurs sombres dans `html:root:root[data-theme=dark]`. Sa spécificité est volontaire ; ajouter un bloc moins spécifique dans `theme.css` peut n’avoir aucun effet.
- Les variables historiques `--green` et `--green-dark` valent actuellement du bleu dans cette couche finale. Les noms ne suffisent donc pas à déterminer le rendu.
- D’autres couleurs sont codées directement dans les règles de composants et dans `apple-design.css`, par exemple le fond bleu de la marque. Modifier seulement les variables racines sera insuffisant.
- `src/i18n.tsx` résout les préférences clair/sombre/système, applique `data-theme`, `colorScheme` et la balise `theme-color`.
- `index.html` applique aussi le thème avant le démarrage React. Les deux chemins doivent rester cohérents pour éviter un flash bleu/blanc ou clair lors d’un démarrage sombre.
- `public/manifest.webmanifest` contient des couleurs PWA statiques, ainsi que l’identité et les icônes issues du lot 02.

### Stratégie CSS

1. Inventorier les tokens réellement consommés et les couleurs de marque codées en dur. Examiner les styles calculés sur des éléments représentatifs.
2. Modifier les valeurs du mode clair à leur source. Réutiliser les tokens existants ; ajouter seulement les rôles manquants, tels que texte sur accent ou bordure fonctionnelle.
3. Limiter les corrections des règles partagées au thème clair, par exemple avec un sélecteur de spécificité appropriée contenant `[data-theme=light]`.
4. Pour tout nouveau token consommé par une règle commune, définir explicitement sa valeur sombre avec le rendu **actuel**. Éviter qu’un nouveau vert clair soit hérité par le mode sombre.
5. Corriger la cascade au bon endroit, sans empiler une nouvelle feuille de surcharge ni multiplier les `!important`. Éviter un renommage global des tokens dans cette mission.
6. Rechercher les résidus de l’ancien bleu de marque et des blancs éclatants en mode clair ; examiner chaque occurrence avant de la modifier. Pas de remplacement global de tous les hexadécimaux bleus ou blancs.

### Contrat du mode sombre

Le rendu sombre existant est la référence de non-régression, pas une proposition de nouvelle palette. À titre de repères actuels : surface `#232326`, fond `#161618`, texte `#F5F5F7`, texte secondaire `#A9A9B2`, accent `#80BAFF`, accent secondaire `#A3CFFF`, sélection `#26364B`.

Ne pas modifier les règles sombres ni leurs couleurs codées en dur pour les harmoniser avec le logo. Préserver aussi les couleurs sombres héritées de règles communes : figer leurs valeurs actuelles avant de modifier ces règles. Comparer avant/après les tokens **et** le rendu des composants ; conserver les mêmes tokens ne garantit pas à lui seul le même résultat visuel.

### Démarrage et PWA

Mettre à jour la couleur claire de `theme-color` dans `index.html` et `src/i18n.tsx` vers le fond clair final, tout en conservant la couleur sombre. Préserver le choix automatique, les changements système en direct, la synchronisation entre onglets et les clés de préférences existantes.

Le manifeste PWA est statique : ses couleurs de lancement ne suivent pas nécessairement le thème choisi dans l’app. Examiner séparément leur adaptation au lin et documenter cette limite ; ne pas promettre un écran de lancement sombre dynamique. Ne modifier ni `id`, ni `scope`, ni `start_url`, ni les ressources d’icônes. Ne pas toucher à la stratégie de cache ou forcer l’activation d’un service worker pour cette tâche.

## 5. Écrans et états à couvrir

Faire un inventaire dans le code, puis contrôler au minimum :

- Accueil « Mes voyages », cartes de carnet, couvertures, filtres, boutons de création/import, états vides et Mon monde.
- Carnet : sidebar, barre supérieure, navigation mobile, recherche, sélecteurs de villes/jours, planning, activités et détails.
- Maintenant, vue d’ensemble, carte et contrôles Leaflet, actions Google Maps/Amap, bonus/favoris et réservations.
- Carnet pratique, outils, budget, valise, notes et documents.
- Création/édition, aperçu d’import, confirmations, modales et panneaux mobiles.
- Préférences, compte, partage, synchronisation et conflits, hors ligne, sauvegarde/restauration, installation et bannière de mise à jour.
- États normal, survol, pressé, focus clavier, sélectionné, désactivé, chargement et erreur.

Ne pas développer une fonction manquante pour pouvoir la recolorer. Utiliser des données synthétiques et les parcours de test existants ; ne pas exposer de contenu personnel dans les captures.

## 6. Vérifications et critères d’acceptation

### Avant/après visuel

Capturer avant modification les écrans représentatifs en clair **et** en sombre. Refaire les mêmes captures après modification avec mêmes données, taille, position de défilement et état de l’interface.

- Largeurs 320, 390, 430 et 1440 px ; un paysage mobile et un formulaire avec hauteur disponible réduite.
- Français, anglais, chinois simplifié et espagnol : navigation, préférences, formulaire et import sans coupure ni débordement.
- Chrome/Chromium et WebKit selon les outils déjà configurés. Les résultats d’émulation ne constituent pas une preuve sur iPhone physique.
- Zoom volontaire à 200 %, navigation clavier et mouvement réduit ; ne jamais désactiver le zoom ni masquer globalement un débordement pour réussir un test.
- Contrôler séparément fond transparent et fond opaque de repli des barres et panneaux.

### Contrastes

Mesurer les contrastes des paires finales réellement rendues : texte/fond, texte de bouton/accent, texte secondaire, sélection, erreur, bordure fonctionnelle et focus. Cibles : au moins 4,5:1 pour le texte courant, 3:1 pour le grand texte et les éléments non textuels nécessaires à l’identification d’un contrôle. Calculer sur le fond composé pour les transparences. Les séparateurs purement décoratifs ne sont pas des bordures de contrôle.

Ces seuils sont des critères à vérifier, **pas une validation déjà acquise de la palette proposée**. Corriger une teinte si nécessaire et fournir un tableau des mesures dans le rapport.

### Comportement et commandes

Tester clair → sombre → système, rechargement, ouverture directe, changement de préférence système et synchronisation entre onglets. Préserver le thème sombre pendant tout le démarrage. Vérifier que changer de thème ne modifie pas les données des carnets.

Réutiliser les scénarios pertinents de `tests/e2e/preferences.spec.ts`, `apple-design.spec.ts`, `iphone-glass.spec.ts`, `l2-accessibility.spec.ts` et `pwa-lot02.spec.ts`. Ajouter uniquement les assertions utiles au nouveau contrat : palette claire effective, démarrage cohérent, absence de fuite des couleurs vers le sombre. Ne pas réécrire les attentes pour masquer une régression.

Exécuter les contrôles ciblés nécessaires, puis le gate obligatoire avant livraison de code :

```powershell
npm run typecheck
npm run lint
# PGlite doit être installé hors dépôt ; remplacer le chemin par celui vérifié localement.
$env:DETOURS_PGLITE_PATH = 'CHEMIN_ABSOLU_VERS_PGLITE/dist'
npm run verify:local
```

Lire le guide et les scripts pour configurer le gate, libérer le port 5173 sans arrêter un processus utilisateur arbitrairement. Ne pas lancer plusieurs suites Playwright en concurrence sur le même serveur ou dossier de résultats. Le gate s’arrête au premier échec : distinguer test réussi, échoué, bloqué et non exécuté. Il utilise des services simulés et ne valide ni OAuth réel ni appareils physiques. Son `dist/` contient une configuration de test et ne doit pas être publié tel quel.

Critères de fin :

- Le mode clair utilise de façon cohérente lin, surfaces crème et accents verts ; le bleu de marque historique ne subsiste que pour une raison explicite.
- Les contrôles, textes et états sont lisibles, avec mesures et captures à l’appui.
- Le mode sombre conserve son rendu de référence, y compris au démarrage et dans les composants partagés.
- Aucun parcours, contenu de carnet, langue, réglage, comportement hors ligne ou restauration n’est dégradé.
- Vérifications réellement exécutées, limites et éventuels échecs sont consignés ; aucun lot suivant n’a été commencé.

## 7. Livrables et reprise

Conserver les preuves dans `docs/development/palette-claire/` :

- `RAPPORT.md` : résultat, fichiers modifiés par cette mission, palette finale, écarts justifiés, commandes/résultats, contrastes, comparaison du sombre, limites et actions humaines éventuelles.
- Captures avant/après en clair/sombre, identifiées par écran, dimensions, langue et navigateur.
- Éléments de retour arrière limités à cette contribution, avec chemin du snapshot et méthode de restauration sélective. Ne pas recommander de restaurer tout le dépôt par-dessus des travaux ultérieurs.

Si la session s’arrête avant la fin, écrire `REPRISE.md` dans ce même dossier avec : branche/HEAD, état initial conservé, changements déjà faits, fichiers exacts, décisions de palette, contrôles exécutés et sorties, échecs reproductibles, processus/ports encore actifs, point bloquant et **prochaine commande ou action précise**. Ne pas annoncer la mission terminée si le gate ou une vérification requise reste à faire.

Cette mission n’autorise aucun déploiement, modification Supabase distante, fusion dans `main` ou réaffectation d’adresse Vercel. Ne pas commencer le lot suivant. La présente livraison est uniquement le brief et ses deux références visuelles ; elle ne constitue pas une implémentation ni une validation du nouveau thème.
