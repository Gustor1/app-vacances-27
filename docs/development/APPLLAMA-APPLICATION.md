# Application des skills Appllama — 6 novembre 2026

Source : https://github.com/Appllama/appllama-skills (licence MIT).

## Installation et périmètre

Les skills `appllama-app-design-skill` (version déclarée 1.3.0) et
`appllama-usage` (1.1.0) sont installés dans le dossier personnel
`~/.codex/skills/`. Ils seront détectés au prochain tour Codex ; leurs
instructions ont aussi été lues et appliquées pendant cette intervention.
Cette installation personnelle n'est pas embarquée dans l'application.

Détours reste une application React / Vite. Les recommandations Expo,
Reanimated, stockage natif et navigation native ne justifient pas une migration.
L'identité éditoriale existante, ses polices, ses palettes, ses icônes Lucide
et ses mascottes constituent les choix de marque conservés.

Le connecteur Appllama n'est pas disponible dans cette session. Aucune
recherche de références dans son catalogue, connexion Pro ou consommation
de crédits n'a été effectuée. Le skill de design fonctionne sans ce connecteur.

## Correction appliquée

Dans `src/apple-design.css`, les boutons à icône passent à 44 × 44 pixels CSS
sur les dispositifs tactiles, y compris hybrides (`any-pointer: coarse`).
Les règles plus spécifiques des actions du planning et de l'en-tête de journée
respectent cette taille. Les actions textuelles des cartes de voyage ont une
hauteur minimale de 44 pixels ; leurs anciennes règles à 36 pixels ne prennent
plus le dessus au toucher. Les boutons de copie gardent leur minimum tactile.

Ce changement applique la règle de cible tactile du skill au web. Il ne change
ni la taille des symboles, ni les libellés, ni le stockage ou la synchronisation.
Les commandes compactes à la souris restent disponibles.

Base partagée récupérée : `9fa03b1`. La branche de départ
`codex/compteur-voyage` contenait déjà cette base ainsi que de nombreux travaux
locaux. La branche `codex/appllama-mobile` a été créée depuis cet état pour
préserver ces travaux. Aucun commit, push ou déploiement dans cette intervention.

## Vérification effectuée

- Chrome, six combinaisons : 320, 390 et 1440 pixels, clair et sombre,
  mouvement réduit. Création de voyage, fermeture par Échap, retour du focus
  et absence de débordement horizontal vérifiés. Fermeture mesurée à 44 × 44
  sur mobile et 36 × 36 à la souris. Captures de l'accueil et du formulaire.
- Planning fictif Chine à 320 et 390 pixels avec émulation tactile :
  15 boutons contrôlés par largeur, tous au moins 44 × 44, aucun débordement.
- Captures inspectées : formulaire clair à 320, accueil sombre à 390,
  planning à 320 pixels.
- `audit-corrections.spec.ts`, sélection `work views wrap` : 4 tests réussis,
  français, anglais, chinois et espagnol, de 320 à 1440 pixels.
- `l2-accessibility.spec.ts`, sélection `accueil` : 4 échecs à la ligne 39.
  - Corrigé le 7 novembre 2026 : le sélecteur `time[datetime="2027-05-01"]` trouvait aussi la date du compteur (`TripTiming`). Il est limité à `.journey-details time[...]`, la date civile de la carte. Relance `DETOURS_TEST_PORT=5191 npx playwright test tests/e2e/l2-accessibility.spec.ts -g accueil` : **4/4 réussis** (fr, en, zh-CN, es). Le reste de la suite n'a pas été relancé.
  Le sélecteur `time[datetime="2027-05-01"]` trouve deux éléments : le badge
  du compteur et la date détaillée. Les assertions clavier précédentes passent.
  Le sélecteur existant n'a pas été modifié dans ce lot CSS.
- `git diff --check -- src/apple-design.css` : réussi.

Captures et scripts de vérification jetables : `test-results-appllama/`
(ignoré par Git). Les traces des tests échoués sont dans `test-results/`.

## Limites et réutilisation

La boucle simulateur natif du skill n'est pas validée : pas de simulateur iOS
ou Android, pas de clavier logiciel réel, pas de mesure de 60 fps sur appareil
de référence, pas de vidéo complète analysée image par image. Les captures
ne prouvent pas la fluidité. Aucun audit exhaustif de toutes les cibles ou
de tous les écrans n'est revendiqué.

Pour les prochains changements d'interface, utiliser les tokens sémantiques
existants, conserver une hiérarchie claire des actions, vérifier les états
vides/erreur, les textes longs, le clavier, les deux thèmes et le mouvement
réduit. Réserver les animations à un retour d'action ou une continuité utile.
Étudier les références Appllama lorsque le connecteur est disponible, puis
vérifier les parcours réellement touchés dans le navigateur et sur appareil.

Pas de gate global, de tests SQL ou de sauvegardes pour cette correction CSS.
