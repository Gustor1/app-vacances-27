# À l’Est — Carnet de Chine 2027

Application de voyage en français, responsive, réalisée à partir des deux documents fournis. React, TypeScript, Vite, Leaflet et OpenStreetMap. Déploiement statique compatible Vercel, sans clé API et sans serveur applicatif.

## Démarrer

Node.js 22.18+ (validé avec Node 24) et npm sont nécessaires.

```sh
npm ci
npm run dev
```

```sh
npm run build       # TypeScript, production et cache hors ligne
npm run preview     # Tester la version de production
npm test            # Données, liens Amap et validation des sauvegardes
npm run test:e2e    # Parcours navigateur Chromium
```

Les tests utilisent `/usr/bin/chromium` dans l’environnement cloud. Sur un autre poste, définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` vers son Chromium, ou installer celui de Playwright et fournir son chemin. Le serveur de test est démarré automatiquement sur le port 5173 s’il ne tourne pas déjà.

## Ce qui est inclus

- 7 étapes : Shenzhen, Guangzhou, Yangshuo, Chongqing/Wulong, Chengdu, Shanghai à compléter, excursion Suzhou.
- 17 journées préparées et 130 fiches bonus. Les bonus restent séparés du planning jusqu’à leur ajout explicite à une journée.
- Thèmes clair, sombre et automatique, interface française ou anglaise via le bouton Préférences. Les documents sources et les textes personnels restent dans leur langue d’origine.
- Navigation mobile fixe, onglets qui gardent la sélection visible, raccourcis Aujourd’hui et Reprendre, respect des réglages de mouvement réduit.
- Édition des activités, déplacement entre journées, ordre des villes, ajout de villes et de journées, favoris, visites effectuées, réservations et notes.
- Vue d’ensemble, dates explicites par journée, export calendrier ICS et impression du voyage complet.
- Adresses bonus personnelles avec adresse précise conservée lors de leur ajout au planning.
- Carte des villes et repères disponibles. Noms chinois, copie, recherches et fiches Amap.
- Fiches de transport modifiables : gares, horaires locaux en Chine, références, notes et réservation.
- Hébergements avec adresses Amap, budget en CNY/EUR avec taux manuel facultatif, valise et phrases chinoises à copier.
- Notes originales consultables intégralement.
- Export/import JSON validé, sauvegarde de récupération et synchronisation entre onglets du même navigateur. Un fichier corrompu peut être téléchargé sans modification avant restauration. Les données personnelles restent dans le stockage local du navigateur, sans compte ni synchronisation entre appareils. Les préférences de thème/langue sont enregistrées séparément du carnet et se synchronisent entre onglets.
- Cache hors ligne après une première ouverture réussie de la version de production et l’installation de son service worker. Les documents, les polices et le fond géographique général sont inclus. Ouvrir le site une fois en ligne avant le départ ; conserver aussi un export JSON.

## Faire évoluer le voyage

Le planning initial est dans `src/data/trip.ts`, les bonus dans `src/data/bonus.ts`, les types dans `src/types.ts`. Chaque ville, jour, activité et bonus possède un identifiant stable. Conserver ces identifiants pour les entrées existantes, afin de préserver les favoris et les coches.

Les mises à jour du planning initial sont fusionnées avec le carnet local grâce à un instantané du catalogue précédent : les nouvelles entrées sont ajoutées et les champs restés inchangés sont actualisés. Les modifications et suppressions personnelles sont conservées. `src/data/legacy-catalog.ts` sert de référence pour migrer les anciens carnets. Garder ces identifiants et cette référence stables ; exporter le JSON avant une mise à jour importante. Deux onglets fusionnent aussi leurs modifications indépendantes ; si le même champ est modifié en concurrence, la dernière écriture de ce champ prévaut.

La date de départ est un repère personnel ; elle ne calcule pas automatiquement les dates des journées. Les journées d’arrivée et de départ entre deux villes peuvent se recouper. Les 17 journées préparées ne constituent pas une durée totale confirmée.

`TransportView` distingue les trajets personnels, le récapitulatif des liaisons des documents d’origine et les étapes transport du planning. Le récapitulatif source est filtré selon les villes présentes ; il ne représente pas des billets réservés. Les horaires personnels sont saisis en heure locale chinoise (UTC+8). Les dépenses en EUR restent séparées des CNY tant qu’aucun taux manuel n’est renseigné.

## Cartographie et données

Les coordonnées WGS84 sont des repères indicatifs, pas des entrées validées. Aucun transfert de coordonnées WGS84 vers Amap (GCJ-02) pour la navigation : les liens Amap utilisent les noms chinois, adresses ou fiches originales. Les fonds OpenStreetMap nécessitent Internet ; leur disponibilité en Chine n’est pas garantie. Les fonds locaux Natural Earth servent de vue géographique générale et ne contiennent pas les rues. Les horaires, gares, disponibilités, adresses, tarifs et distinctions cités dans les documents restent à revérifier.

Source du fond local : Natural Earth, domaine public, via `world-atlas` 1:50m. Illustration de couverture SVG originale. Polices DM Sans et Manrope distribuées sous SIL Open Font License via Fontsource ; elles sont servies localement.

## Déployer sur Vercel

Le fichier `vercel.json` est prêt : framework Vite, build `npm run build`, sortie `dist`. Relier le dépôt GitHub au projet Vercel, ou lancer `vercel` avec un compte connecté depuis le dépôt. Aucune variable secrète n’est requise pour l’application. La publication n’est pas effectuée par la configuration seule.

Les documents d’origine et le planning initial sont inclus dans les fichiers statiques : toute personne ayant accès au site peut les consulter. Pour un carnet privé, activer la protection d’accès du déploiement avant de le partager. Les notes ajoutées par le navigateur ne sont pas envoyées au site.

## Vérification de la version de production

Après `npm run build`, démarrer `npm run preview -- --port 4173` dans un terminal, puis `npm run test:production` dans un autre. Ce contrôle vérifie aussi les préférences sombre/anglais après rechargement hors ligne et les phrases chinoises. Il vérifie la sélection d’un repère, le fond géographique local, le cache du service worker, le rechargement hors ligne, les notes, les deux documents et l’absence de débordement mobile. `PRODUCTION_TEST_URL` permet de changer l’URL du serveur de test. Des captures de validation sont enregistrées dans `/tmp`.

Pour reconstruire le fond géographique à partir des dépendances verrouillées : `npm run generate:map`.

## Modifier les traductions et les thèmes

`src/i18n.tsx` fournit les préférences et le contexte de langue, `src/locale-utils.ts` valide les options et interpole les traductions. Les dictionnaires anglais sont dans `src/locales/` et utilisent le texte français comme clé ; conserver les variables `{name}` identiques dans les deux langues. `src/theme.css` couvre le thème sombre, Leaflet, la navigation mobile, les zones sûres et le mouvement réduit. Le thème automatique suit l’appareil ; le choix explicite reste prioritaire.
