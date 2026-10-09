# Refonte Apple de Détours

La refonte du 8 octobre 2026 applique le skill `C:/Users/eliot/.codex/skills/apple-design/SKILL.md` aux écrans existants : accueil des carnets, Mon monde, planning, vue d'ensemble, cartes, bonus, transports, carnet pratique, outils, préférences, compte et partage.

## Présentation

- Typographie système avec hiérarchie de taille, graisse et espacement.
- Surfaces neutres, accent bleu, cartes arrondies et contrôles cohérents.
- Navigation et barres d'outils translucides ; contenu sur des surfaces solides.
- Navigation mobile flottante, zones tactiles adaptées et formulaires en feuilles.
- Modes clair et sombre ; préférences de mouvement réduit, transparence réduite et contraste élevé.
- Résumé de la collection calculé depuis les carnets existants.
- Icône et couleurs de l'application installable alignées sur la nouvelle identité.

`src/apple-design.css` est importé après les styles existants. La spécificité du sélecteur racine est volontaire : les anciens sélecteurs de thème contiennent des `:is()` de forte spécificité. Les composants conservent leurs classes et leurs comportements métier.

## Mouvement et navigation au clavier

`src/hooks/useSheetMotion.ts` anime les fenêtres avec un ressort à amortissement critique, sans nouvelle dépendance. Le ressort repart de sa position et de sa vitesse courantes lorsqu'il change de cible.

Sur mobile, la poignée suit le pointeur après un seuil de 10 px, utilise la capture du pointeur, résiste progressivement aux déplacements vers le haut et projette la vitesse au relâchement. Un déplacement inversé revient à la position ouverte et conserve le formulaire. Un glissement vers le bas ferme la feuille, comme le bouton Fermer ou Échap. Les utilisateurs qui préfèrent réduire les animations obtiennent une présentation statique.

L'en-tête et la poignée restent disponibles pendant le défilement du formulaire. Le focus reste dans la fenêtre ouverte puis revient à son déclencheur, y compris lorsqu'un champ possède `autoFocus`.

## Sauvegarde et restauration

La sauvegarde complète avant refonte est conservée hors du dépôt :

`C:/Users/eliot/Documents/app-vacances-27-backups/2026-10-08-apple-design/avant-refonte.zip`

Le guide `RESTAURER.md`, dans le même dossier, détaille le retour à l'ancienne interface. Les sept fichiers remplacés pendant la refonte et les trois nouveaux fichiers de code ou de test y sont identifiés.

Le stockage des voyages, les migrations, les comptes, les règles de partage, les devises et les données personnelles ne sont pas modifiés par cette refonte.

La version approuvée est publiée depuis le 8 octobre sur `https://app-vacances-27-beta-eliottle.vercel.app/`. Le déploiement `dpl_C8CLFY8DcesHj9AapGbCqnkUeQNj` est prêt, ses 18 fichiers correspondent aux fichiers validés et l'accès public existant de la bêta est conservé. Pour revenir à la version en ligne précédente, réattribuer cette adresse à `dpl_AJpBhe6qBTTc8WbJMLkgGBbNwRc8`. La preuve du déploiement est dans `docs/transition/deployment-apple-design-20261008.json`.

## Vérifications

### Bulle qui s'ouvre et se referme, suivant le schéma utilisateur

La sélection s'étire depuis le bouton de départ : l'avant avance avec un ressort plus rapide, pendant que l'arrière reste attaché au départ. Après que l'avant a parcouru 68 % du trajet, l'arrière rejoint la destination et referme le pont. Les deux extrémités gardent leur vitesse lorsqu'une nouvelle sélection arrive. Le rayon des coins compense l'étirement pour conserver des extrémités rondes. Le léger gonflement reste dans les limites de la barre ; la réduction des animations utilise toujours une sélection immédiate. Un redimensionnement recale la bulle sur le bouton.

Quatorze parcours ciblés sont validés : les contrôles précédents de l'en-tête, du défilement et de l'accessibilité, plus l'ouverture/fermeture horizontale vers un bouton adjacent ou éloigné et le pont vertical du menu latéral. Les trois tests de forme ont été relancés après le réglage final des rayons ; le build TypeScript/production réussit. Le test d'ouverture échouait sur le simple glissement précédent.

Le déploiement actuel est `dpl_3Vp7ocGasajpahFrGJ5xXkzpkxhP`, publié sur la même bêta après vérification des 18 fichiers. La transition et les nouveaux assets ont été contrôlés en ligne, sans erreur JavaScript. Preuve : `docs/transition/deployment-glass-bubble-20261008.json`. Retour arrière : `dpl_EuTSrkCaQt2Y5aCRUxMHx1pkYBVR`. La source et le test avant changement sont sauvegardés dans `C:/Users/eliot/Documents/app-vacances-27-backups/2026-10-08-glass-bubble/`.

### Connexion compacte et sélection fluide du 8 octobre

Sous 1100 px, le bouton de compte devient une icône de 44 × 44 px. Son libellé accessible, son info-bulle, le menu et le retour du focus restent disponibles. La recherche récupère la largeur libérée : l'entrée mesure 217 px lors du contrôle local à 390 px. Les contrôles de l'en-tête restent dans la fenêtre aux largeurs 320, 390, 740 et 1000 px.

`GlassSelection.tsx` fournit une surface de sélection commune aux boutons de navigation mobile, au menu latéral et aux onglets d'accueil. Le ressort conserve sa position et sa vitesse lorsqu'une nouvelle sélection arrive. Il anime seulement les transformations, ne verrouille aucun bouton et respecte la réduction des animations. Un delta de temps négatif au démarrage d'une image est ramené à zéro pour éviter un saut pendant une image occupée.

Le build réussit. Quinze parcours ciblés sont validés, avec reprises ciblées ; le changement rapide de direction réussit cinq fois consécutives. Les thèmes, les quatre langues, les tailles mobiles, le contraste, le clavier et le menu de compte sont contrôlés. Le déploiement `dpl_EuTSrkCaQt2Y5aCRUxMHx1pkYBVR` est publié sur la bêta, avec 18 fichiers vérifiés. Les nouveaux assets, le bouton de 44 px et le passage Bonus → Planning ont été vérifiés sur le site publié, sans erreur JavaScript. Preuve : `docs/transition/deployment-fluid-navigation-20261008.json`.

Le déploiement précédent `dpl_7yaT9kXbjpH8z1bRWazqAmK64Xap` permet le retour arrière. Les quatre fichiers de source remplacés sont sauvegardés dans `C:/Users/eliot/Documents/app-vacances-27-backups/2026-10-08-fluid-navigation/`, avec un guide de restauration.

### Ajustement Liquid Glass du 8 octobre

Les barres utilisent un flou de 26 px, une saturation de 180 % et des reflets de bord. Leur opacité passe de 68 % à 96 % après 16 px de défilement. Le hook `useScrollMaterial` suit le défilement sans relancer le rendu React. Les modes de contraste élevé ou de transparence réduite utilisent un fond solide.

La navigation mobile est centrée, limitée à 340 px et conserve une marge latérale ainsi que les zones de sécurité du téléphone. Sa hauteur observée est de 54 px, avec des boutons tactiles d'au moins 44 px. Les tests ciblés à 320 et 390 px, dans les quatre langues et les deux thèmes, réussissent : 8 parcours ; le build TypeScript/production réussit aussi.

Cet ajustement est publié sur la même adresse avec `dpl_7yaT9kXbjpH8z1bRWazqAmK64Xap`, après vérification des 18 fichiers distants. Le défilement du site publié a été contrôlé à 390 px, sans débordement ni erreur JavaScript. Preuve : `docs/transition/deployment-liquid-glass-20261008.json`.

Pour revenir à la version Apple approuvée avant cet ajustement, réattribuer la bêta à `dpl_C8CLFY8DcesHj9AapGbCqnkUeQNj`. Les copies locales de `main.tsx` et `apple-design.css` sont conservées dans `C:/Users/eliot/Documents/app-vacances-27-backups/2026-10-08-liquid-glass/` ; le guide de restauration accompagne ces fichiers. La sauvegarde complète avant refonte reste disponible.

Les tests existants couvrent les fonctions de voyage, les sauvegardes, les quatre langues et les présentations mobiles. `tests/e2e/apple-design.spec.ts` ajoute la fermeture au clavier, le retour du focus, le glissement réversible, la fermeture par geste et la présentation sans animation.

Commandes : `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:production`.

Résultats : 67 tests unitaires réussis et 60 parcours navigateur validés, dont trois après reprise ciblée. Compilation TypeScript et build de production réussis. Le smoke de production valide le remplacement du cache du service worker, 17 ressources hors ligne, les cartes, les notes, les quatre langues et la persistance des souvenirs, sans erreur JavaScript.

Les reprises ciblées des tests navigateur utilisent des dossiers de résultats distincts : deux exécutions Playwright simultanées partageant le même dossier effacent leurs traces respectives. Sur cette machine, certains parcours dépassent aussi le délai global de 30 secondes pendant plusieurs lancements de navigateurs ; le parcours Mon monde en quatre langues a réussi seul en 9,9 secondes avec un délai global de 90 secondes, sans changer ses assertions.
