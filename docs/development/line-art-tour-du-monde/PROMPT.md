# Prompt — « Le tour du monde au trait » (line art animé de l'accueil)

_Rédigé le 12 nov. 2026, idée validée par l'utilisateur. Revérifier les chemins et l'état du code avant de reprendre._

## Avancement (13 nov. 2026, branche `claude/line-art-tour-du-monde`, non commité)

- **Lot 1 fait** : skill installé, `src/lineart/` (lib MIT vendorisée), voyageur, scènes Départ et France, `WorldLineArt` à la place du relief de l'accueil, bouton renommé « illustration » dans les 4 langues.
- **Lot 2 fait** : l'ordre est Départ → France → Espagne → Italie → Japon → **Chine** → **Hong Kong** → Vietnam → Brésil → retour à l'avion. La boucle complète dure environ 6 min 20 s.
  - **Chine** : c'est le pays coup de cœur de l'utilisateur, donc la scène est environ 3,5 fois plus longue que les autres. Elle comprend le Bund et la skyline de Pudong, une ruelle shikumen, le campus de Shanghai University à Baoshan (stylisé, sans photo de référence), Guilin/Yangshuo puis Zhangjiajie.
  - **Hong Kong** : une scène à part, avec le port Victoria (Star Ferry, jonque), la skyline (IFC, Bank of China) et une rue de Kowloon (enseignes, tram « ding ding »).
- **Performance** : chaque scène est placée individuellement et masquée hors écran. Mesuré à environ 60 FPS dans Chrome desktop et mobile (Intel Iris Xe, au départ du tour seulement).
- **Reste (lot 3 et suite)** : traiter les détails du campus avec les références de l'utilisateur, ajouter la V2 (Maroc, Inde, Corée, Pérou, États-Unis) et faire une revue sur un vrai téléphone.

---

## Rôle et objectif

Tu travailles sur Détours (React 19 / TypeScript / Vite, PWA hors ligne, 4 langues). Lis `AGENTS.md` et `docs/development/COLLABORATION.md`, puis fais `git status`. Préserve tout travail déjà présent.

Crée pour l'accueil (`src/components/JourneysApp.tsx`) une **animation line art décorative** intitulée « Le tour du monde au trait ». Utilise le skill `line-art-animation` (https://github.com/JDhruv14/line-art-animation, licence MIT). Installe-le d'abord et vérifie qu'il fonctionne. Le rendu est du **SVG animé en direct**, pas une vidéo MP4.

## Concept

- Un **voyageur au sac à dos, carte en main**, marche sur place, ancré en bas à droite du bandeau. Il est le fil conducteur et ne disparaît jamais. Son sac balance, ses cheveux et la carte bougent au vent, et il lève parfois la carte pour la consulter.
- Derrière lui, un **panorama dessiné à l'encre défile en continu** de droite à gauche, comme une seule ligne qui fait le tour du monde.
- **Chaque pays est une scène séparée dans le code**, un module par pays. On peut ainsi en ajouter, en retirer ou en réordonner sans toucher aux autres. Entre deux scènes, un élément de transition fait le pont (route, pont, rivière, ligne de train, vol d'oiseaux), avec un fondu enchaîné doux.
- Chaque scène dure environ **8 à 12 s**, et la boucle complète est sans couture.
- Les **figurants changent selon le pays** : tenues, gestes, objets du quotidien. Ils restent respectueux et évitent la caricature. Il faut des gestes du quotidien, pas des stéréotypes.

### Ordre des scènes (V1 : 8 scènes)

| # | Scène | Décor | Figurants / détails animés |
|---|---|---|---|
| 0 | Départ | Avion qui décolle, piste, nuages | Le voyageur ajuste son sac, l'avion traverse le ciel |
| 1 | France | Tour Eiffel au loin, boulangerie avec auvent, terrasse de café | Passant avec baguette, serveur au plateau, pigeons |
| 2 | Espagne | Sagrada Família, patio andalou, orangers, azulejos suggérés au trait | Danseuse de flamenco, éventail, guitare |
| 3 | Italie | Colisée, ruelle avec linge étendu, Vespa | Glacier, gestes de conversation |
| 4 | Japon | Torii, mont Fuji, cerisiers | Kimono, cycliste, pétales emportés par le vent |
| 5 | Chine | Grande Muraille sur les crêtes, lanternes | Tai-chi au parc, vapeur d'un panier de baozi |
| 6 | Vietnam | Baie d'Ha Long, rizières en terrasses | Chapeau conique et palanche, scooters |
| 7 | Brésil | Pain de Sucre, téléphérique, palmiers | Footballeur pieds nus, percussions |
| ↺ | Retour | L'avion revient, transition vers la scène 0 | — |

**V2, plus tard :** Maroc, Inde, Corée, Pérou, États-Unis. L'architecture doit les rendre ajoutables sans refonte.

## Placement dans l'interface

- **Uniquement l'accueil**, dans le bandeau `.journeys-intro`. Ce bandeau contient **déjà** `TopographicArt` (relief animé) et un bouton « Mettre le relief en pause / Animer le relief » (`.terrain-toggle`).
- Recommandation : le line art **remplace le relief** dans ce bandeau. La pile visuelle est donc fond de palette → line art → titre « Mes voyages », texte et boutons. Si tu préfères la coexistence, justifie-la par des captures et garde la lisibilité.
- Le texte et les boutons restent au-dessus et parfaitement lisibles. Le trait ne passe jamais sous le titre à pleine opacité : utilise un masque ou un dégradé côté texte.
- **Rien dans les carnets, la carte, les formulaires ni les modales.**

## Couleurs et thèmes

- L'encre utilise `currentColor`. Lie-la aux variables injectées par `paletteTokens()` dans `src/palettes.ts` : `--green` (accent lisible) pour le voyageur et `--muted` pour le décor. Garde une **opacité basse**, environ 0,18 à 0,28 pour le décor et un peu plus pour le voyageur.
- L'animation doit fonctionner avec les **13 palettes** (`signature`, `porcelaine`, `eucalyptus`, `sauge`, `ocean`, `glacier`, `foret`, `bordeaux`, `corail`, `abricot`, `soleil`, `violet`, `noir`), en clair et en sombre, sans couleur codée en dur.
- En **thème sombre**, active l'ambiance « nuit » du skill (encre pâle, fenêtres et lanternes allumées). La couleur doit toujours venir de la palette, jamais de l'indigo par défaut du skill.

## Contraintes non négociables

1. **Accessibilité** : couche en `aria-hidden="true"` et `pointer-events: none`, aucun focus, aucun texte, donc **aucune traduction à ajouter** (les 4 langues ne sont pas touchées).
2. **Mouvement réduit** : avec `prefers-reduced-motion: reduce`, on affiche une **image fixe** (une scène figée, par exemple la France). Reprends exactement la logique existante du relief : bouton pause/lecture, `data-animated`, et `forceMotion` quand l'utilisateur relance volontairement.
3. **Pause automatique** quand l'onglet est caché ou le bandeau hors écran. Réutilise le motif `IntersectionObserver` + `visibilitychange` de `src/components/TopographicArt.tsx`.
4. **Hors ligne / PWA** : aucune ressource réseau, police, image distante ni CDN. Tout est dans le bundle.
5. **Performance** : une seule boucle `requestAnimationFrame`, active seulement quand l'animation est visible. Charge le composant en **lazy** (`React.lazy`) pour ne pas alourdir le premier rendu. Vise moins de 30 ko gzip pour l'animation, et pas de baisse sensible des FPS sur mobile.
6. **Code** : le `lib/` du skill est copié dans le projet (par exemple `src/lineart/`), avec mention de la licence MIT. Les scènes vont dans `src/lineart/scenes/<pays>.ts` et un `src/components/WorldLineArt.tsx` orchestre le tout.
7. **Périmètre** : ne modifie ni les données, ni la persistance, ni la synchronisation, ni les exports. Ne fais aucun commit, push, déploiement ni changement distant sans accord explicite de l'utilisateur. Travaille sur une branche `claude/line-art-tour-du-monde`.

## Lots

**Lot 1 — Installation et prototype**
- Installe le skill et lance un de ses exemples en local.
- Crée `WorldLineArt` avec la scène 0 et la scène France seulement, le voyageur, le défilement et la couleur de palette.
- *Acceptation* : visible sur l'accueil en clair et en sombre (palette Signature), pause hors écran, image fixe en mouvement réduit.

**Lot 2 — Les 8 scènes et les transitions**
- Écris les scènes 2 à 7, les transitions, et la boucle sans couture.
- *Acceptation* : un tour complet sans saut visible ni trou, et chaque scène est reconnaissable sans légende.

**Lot 3 — Intégration finale**
- Choisis entre remplacer ou garder le relief, ajoute le masque côté texte et l'interrupteur pause, et vérifie les 13 palettes.
- *Acceptation* : texte de l'accueil lisible à 320, 390, 768, 1280 et 1920 px, sans débordement horizontal.

## Vérification (proportionnelle : changement visuel)

- `npm run typecheck` et `npm run lint`.
- Tests ciblés : `npx playwright test tests/e2e/apple-design.spec.ts tests/e2e/travel-delight.spec.ts tests/e2e/brand-palettes.spec.ts`. Adapte une assertion seulement si le changement voulu la rend obsolète, et dis-le.
- Ajoute un test e2e court : le SVG est `aria-hidden`, et il est figé quand `reducedMotion: 'reduce'`.
- Captures à 390 et 1280 px, en clair et en sombre, sur 3 palettes contrastées (Signature, Noir, Corail), plus une capture en mouvement réduit.
- Mesure CPU/FPS dans les DevTools (onglet Performance, 10 s) avec l'animation visible, puis cachée.
- **Ne pas** lancer `npm run verify:local` : changement non transversal.

## Rapport final attendu

Fichiers créés ou modifiés, contrôles réellement exécutés (réussis, échoués, non lancés), captures, poids du bundle ajouté, mesure de performance, et limites connues (par exemple : aperçu Chromium, pas de preuve sur un vrai iPhone).
