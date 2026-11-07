# Un logo accordé à chaque palette — 19 octobre 2026

## Résultat

L’oiseau suit désormais la couleur d’accent des douze familles, en clair et en sombre. Le carré des onze palettes claires bonus suit aussi leur fond de champ : il ne conserve plus le beige du thème Signature. Bordeaux, corail, bleu, violet et les autres familles ont ainsi leur propre version cohérente du logo.

Les deux dessins Signature approuvés sont conservés sans changement. Les autres versions réutilisent l’oiseau transparent existant : un filtre SVG natif remappe ses plis en trois tons de l’accent actif. La silhouette et la transparence restent intactes. Cela permet une adaptation précise sans dupliquer ou redessiner vingt-deux images. Le petit oiseau en bas des carnets suit le même choix.

La correction ne modifie ni les carnets, ni les préférences enregistrées, ni les formats de sauvegarde. Les icônes installées sur l’écran d’accueil restent l’identité canonique ; cette correction concerne les logos de l’interface.

## Préservation

Branche `codex/logos-palettes`, HEAD initial `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. Le dépôt contenait déjà les travaux des lots/imports/UI et de la publication précédente.

Snapshot complet des **809 fichiers initiaux** : `C:/Users/eliot/Documents/detours-logos-palettes-recovery-20261019`, avec copie `source/` et hachages dans `manifest.json`. Aucun reset du dépôt ni lot suivant.

Fichiers de réalisation : `src/components/BrandMark.tsx`, `src/palettes.ts`, feuille générée `public/palettes.css`. Deux scénarios ciblés ajoutés dans `tests/e2e/brand-palettes.spec.ts`, intégrés au gate. La recette PWA compilée vérifie maintenant aussi l’application du filtre au logo violet repris hors ligne.

## Vérifications exécutées

- Types produit/tests et lint réussis en précontrôle.
- 27 unités de palettes réussies ; les contrastes et ressources générées restent cohérents.
- Chromium : **2/2 scénarios**, dont les 24 combinaisons effectivement rendues et la conservation d’un carnet synthétique.
- WebKit : **2/2 scénarios**, y compris les mêmes pixels colorés, le rechargement et le petit logo du carnet.
- La recette mesure la teinte des pixels visibles de l’oiseau après filtrage, plutôt que de vérifier uniquement la présence d’un attribut. Les 22 adaptations reprennent la teinte de l’accent, avec moins de 18° d’écart mesuré. Les deux Signature gardent leurs images originales sans filtre.

Preuves : [planche Chromium](chromium-24-logos.png), [planche WebKit](webkit-24-logos.png), [matrice Chromium](matrix-chromium.json), [matrice WebKit](matrix-webkit.json), [journal Chromium](chromium.log), [journal WebKit](webkit.log).

## Contrôle complet et publication

Le gate `npm run verify:local` est **réussi : 24/24 étapes, exit 0, `notRun: []`, source inchangée**. Il couvre 240 unités, 127 scénarios navigateur (62+34+3+28), types/lint/build/intégrité/SQL isolé et douze smokes compilés. Le filtre coloré et le choix violet sont repris hors ligne après fermeture/réouverture.

[Validation](validation.json), [journal](gate.log), [PWA compilée](pwa-validation.json), [préservation](preservation.json), [diff sélectif](contribution.patch). Les 809 fichiers initiaux sont conservés : 804 inchangés et cinq modifiés pour la correction, aucun manquant. Un test nouveau s’ajoute. Les captures historiques régénérées par les anciennes recettes ont été copiées dans ce dossier puis restaurées byte pour byte depuis le snapshot.

Empreinte source : `5a4ded414fe9d67df25df2f742bf0f313955963638173b22c355ed807f867e69`. Build factice testé : `1804a388b9fc93a5cb73bb4e0783ead553b57318c3e4d29bb4a2fa407016310d`. Le candidat de publication est reconstruit séparément avec la configuration de la cible : `6b78bce678df535a22170f98670d930bd65df61c4675448b2246380a415b1cb3`. Dossier externe : `C:/Users/eliot/Documents/detours-release-logos-palettes-20261019`.

Publication terminée sur **https://app-vacances-27-beta-eliottle.vercel.app/**. Déploiement preview **READY** : `dpl_61vHQY2eSUUTK9x6WPy6RgPkV1sy`. La preview protégée a été contrôlée via le connecteur authentifié, puis le seul alias bêta a été réassigné. Son exception publique existante est conservée ; domaine principal et protection globale inchangés.

Le contrôle public a vérifié les tailles/SHA-256 des **33 fichiers** et le service worker exact, puis les pixels de l’oiseau bordeaux clair (moyenne RGB 153/97/116) avec fond rosé `#F4E8E5`. Le logo violet, la sélection de palette et les notes sont conservés après fermeture/réouverture hors ligne et reconnexion. Aucun débordement à 390 px, aucune erreur d’exécution.

[Contrôle public](published-verification.json), [livraison](release.json), [capture bordeaux clair](published-bordeaux-light.png), [capture publique](published-390.png), [retour arrière](rollback.json). L’empreinte source après publication correspond toujours au gate. Le diff inverse est vérifié sans mutation.

Pour revenir au frontend antérieur, réassigner uniquement l’alias bêta à `dpl_E6v9zr2TgMEdTLKh1NJq5NeMRCLG`. Son build `d5781145720af29541dd8bec34246df769733596383a5d88e737af769406fb0f` est également conservé dans `previous-dist/` du dossier externe de livraison. Ne pas effacer le stockage des carnets ni rétrograder les migrations. Aucun commit/push Git ou changement de base distante n’a été effectué.

La cible est la bêta déjà publiée dans cette conversation. L’ancien déploiement est conservé pour retour arrière. Aucun changement de base distante, de domaine principal ou de protection globale n’est nécessaire.

## Limites

Ces contrôles utilisent des profils synthétiques et des navigateurs émulés. Ils ne prouvent pas le rendu sur iPhone physique ni une installation OS réelle. Les couleurs du logo d’installation ne dépendent pas du choix de palette dans l’application.
