# Lot 02 — Finaliser la PWA et l'expérience mobile

Lire d'abord [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Premier lot à exécuter après le lot 01.

## Résultat

Détours s'ajoute à l'écran d'accueil, s'ouvre comme application et permet de retrouver un carnet préparé sans réseau. Préserver son interface, ses données et les travaux récents. Aucun abonnement Apple Developer.

## 1. Auditer l'existant

Inspecter `public/manifest.webmanifest`, `index.html`, `scripts/build-sw.mjs`, `src/offline.ts`, `OfflineStatus.tsx`, `AppUpdate.tsx` et les tests mobile/hors ligne. Le manifest standalone et l'aide iPhone en quatre langues existent déjà. Vérifier le code avant d'ajouter un équivalent.

Reproduire sur un build local : installation proposée, lancement, navigation, édition, fermeture/réouverture, sauvegarde et actualisation. Séparer Chrome, WebKit simulé et vrai iPhone.

Sortie : défauts observés et critères à vérifier listés, sans refonte.

## 2. Compléter l'installation

Préparer des icônes PNG aux tailles adaptées, dont 180 px pour apple-touch-icon, 192/512 px pour le manifest et une variante maskable si correctement dessinée. Réutiliser l'identité actuelle ; pas de nouvelle mascotte dans ce lot. Vérifier cadrage et lisibilité.

Compléter id/scope uniquement après vérification de l'identité et des chemins existants : préserver l'identité implicite et le start_url pour éviter une installation doublonnée. Ajouter les références et contrôler que chaque ressource existe dans le build.

Rendre l'aide à l'installation trouvable depuis l'accueil ou les préférences, en réutilisant les textes existants. Adapter l'état installé/non installé avec détection de capacité ; pas de fausse promesse de bouton automatique Safari. Vérifier le nom actuel des options avec la documentation Apple.

Sortie : installation expliquée, icônes valides, aide non intrusive et traduite.

## 3. Vérifier les usages mobiles

Contrôler 320/390/430 px, portrait/paysage, zoom 200 %, clavier ouvert, encoches et barre basse. Réparer les débordements à leur cause, pas en masquant tout horizontalement. Vérifier formulaires d'import, modales, boutons, menus et liens Google/Amap aller-retour.

Contrôler mise à jour pendant une édition : pas de rechargement destructeur ni de brouillon perdu. Tester échec partiel du cache, fermeture/réouverture hors ligne et reconnexion. Distinguer carnet local disponible et cartes/images externes non disponibles.

Étudier Storage API pour demander une persistance seulement dans un contexte utile ; le refus doit être normal et sans blocage. Les sauvegardes restent nécessaires, même en cas d'accord.

Sortie : parcours essentiels utilisables sans débordement, perte de texte ou affirmation trompeuse sur le hors-ligne.

## 4. Recette et fin

Exécuter les tests mobile existants et les smokes compilés, puis le gate commun. Ajouter uniquement les tests pertinents pour les défauts corrigés.

Préparer une checklist physique courte : iPhone/Safari, ajout à l'accueil, ouverture depuis icône, carnet retrouvé, mode avion, modification, fermeture complète, réouverture, export/import, retour depuis navigation externe. Sans appareil accessible, livrer le code validé localement et laisser cette recette marquée NON EXÉCUTÉE ; ne pas attendre indéfiniment ni déclarer l'iPhone certifié.

Pas de push notifications, App Store, abonnement Apple, changement de thème ou nouvelle architecture dans ce lot.

Rapport : `docs/development/lot-02-pwa/RAPPORT.md`. Critère final : tests locaux requis passés et aucune régression de sauvegarde ; statut physique explicite.

Sources à vérifier : [Web apps iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [stockage WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/).

