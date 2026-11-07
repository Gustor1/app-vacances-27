# Typographie C — intégration du 31 octobre 2026

Choix utilisateur : Newsreader pour les titres de carnet, Hanken Grotesk pour les informations pratiques. Branche `codex/typographie-c`, issue de la version locale `6e31945` qui contient déjà la base partagée récupérée `9fa03b1`. Les plans et le dossier d’audit non suivis sont préservés.

## Mise en place

- `src/typography.css` : quatre faces WOFF2 variables auto-hébergées (latin et latin-ext), chargement `swap`, tokens UI/titres et replis chinois locaux.
- Thème : titres d’accueil, voyages, villes, journées, vue d’ensemble et souvenirs en Newsreader 500 ; interface en Hanken. Les tailles existantes, palettes, marque, mascottes et parcours sont conservés.
- Remplacement des déclarations DM Sans/Manrope dans les styles, y compris les styles de partage chargés séparément. Dépendances historiques conservées pour éviter une modification de lockfile sans rapport.
- Styles de souvenirs et version imprimable du voyage raccordés aux polices.
- Fichiers et notices SIL OFL 1.1 dans `public/fonts/`. Provenance Fontsource épinglée dans `SOURCE.json` (Hanken 5.3.0, Newsreader 5.3.0 ; vérifier les fichiers pour la version exacte). Aucune requête obligatoire à un CDN.
- 148 620 octets de WOFF2 au total, environ 145 Kio. Les quatre fichiers sont inclus dans le cache du worker existant ; aucune modification du protocole de cache.

## Contrôles

Sur Chrome Windows, profil jetable, build compilé du gate avec backend factice : accueil et ouverture de l’exemple Chine, captures mobile ; planning sans débordement horizontal à 320/390/430/1440 px. Familles calculées : Hanken pour le corps, Newsreader pour les titres de page/journée. Après installation du worker, les quatre fichiers sont présents dans Cache Storage ; rechargement en mode hors ligne réussi avec Hanken et Newsreader chargées.

Captures et mesures locales : `C:/Users/eliot/AppData/Local/Temp/detours-typographie-c/`. Inspection visuelle du planning mobile effectuée. Accueil sombre à 320 px en français, anglais, espagnol et chinois : aucun débordement. Blocage des requêtes WOFF2 : accueil toujours visible à 390 px et aucun débordement avec les replis. Ces essais ne valident pas le rendu sur iPhone physique, les services distants ou OAuth. L’impression papier reste à contrôler sur appareil.

Gate global lancé : types produit/tests, lint, 332 tests unitaires, build, intégrité, SQL isolé et 93 premiers tests navigateur réussis. Groupe palettes/préférences : 36 réussites et un timeout à 390 px sur le clic direct d’un radio masqué (le texte English interceptait le clic). Les étapes suivantes du gate n’ont pas été exécutées. Rapport original : `C:/Users/eliot/AppData/Local/Temp/detours-verify-aX7CCi/validation.json`.

Correction ciblée du test `preferences.spec.ts` : clic sur le label visible, puis vérification explicite de la sélection ; aucun clic forcé. Relance des deux scénarios 320 et 390 px : 2/2 réussis. Le parcours utilisateur de changement de langue par son label a également été vérifié sur le build compilé. Le gate global n’est donc pas annoncé comme entièrement vert ; sa suite reste non exécutée.

La base partagée est antérieure à douze commits du checkout produit (lots/import/mascottes/préférences/PWA, 1373 fichiers). Une PR de cette branche vers la base embarquerait ce travail antérieur ; elle n’a pas été ouverte pour éviter de présenter ces changements comme faisant partie de la typographie. Livraison locale isolée sur `codex/typographie-c`, sans fusion de base ni déploiement.

## Livraison et retour arrière

Aucun déploiement ni migration distante. Le build du gate utilise une configuration factice : reconstruire avec les paramètres de cible avant une publication autorisée. Revenir sur le commit typographie pour annuler le changement ; aucun format de données ni préférence persistée n’a changé.

