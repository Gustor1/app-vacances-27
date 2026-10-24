# État final — logos par palette, 19 octobre 2026

**Mission terminée et correction publiée sur la bêta. Aucune action obligatoire ne reste.**

## Demande et réalisation

L’utilisateur souhaitait un logo coloré associé à chaque palette, surtout en clair, après la publication des palettes dans cette conversation. BrandMark suit désormais `palettes[resolvedTheme]`. Les deux dessins Signature sont inchangés. Les vingt-deux adaptations utilisent le PNG transparent existant et un filtre SVG natif à trois tons de l’accent : silhouette, transparence et relief conservés. `useId` évite les collisions entre l’en-tête et le petit logo du pied de page. Le fond des onze palettes claires bonus suit le champ au lieu de garder le beige Signature.

Les icônes d’installation OS, les données, les préférences et les formats de sauvegarde ne changent pas.

## Branche et préservation

Branche : `codex/logos-palettes`. HEAD initial : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. Aucun reset, commit, push ni lot suivant.

Snapshot antérieur : `C:/Users/eliot/Documents/detours-logos-palettes-recovery-20261019`, 809 fichiers Git-visibles avec copie `source/` et manifeste. Comparaison finale : 804 fichiers initiaux inchangés, cinq modifiés intentionnellement, aucun manquant. Un nouveau test est ajouté. Les fichiers et hachages figurent dans `changes.json` et `preservation.json`.

Le diff sélectif est `contribution.patch`. Contrôle inverse réussi sans mutation : `git apply --reverse --check --ignore-space-change docs/development/logos-palettes/contribution.patch`. Avant restauration, sauvegarder l’état courant et conserver toute modification ultérieure. Les deux captures historiques réécrites par les recettes d’import ont été archivées dans ce dossier puis restaurées exactement depuis le snapshot.

## Vérifications finales

- Chromium 2/2 et WebKit 2/2 ciblés : pixels rendus des 24 combinaisons, fond exact, carnet inchangé, rechargement et petit logo du carnet. Planches, matrices et journaux dans ce dossier.
- Gate session 49194 terminé exit 0 : 24/24 étapes, 240 unités, 127 scénarios navigateur (62 + 34 + 3 + 28), douze smokes compilés. Source inchangée. Fichiers `validation.json`, `gate.log`, `pwa-validation.json`.
- Le smoke PWA vérifie le logo violet coloré après fermeture/réouverture hors ligne, quarante dispositions et quatre langues. Les recettes de mise à jour passent dans Chromium et WebKit selon leurs limites d’émulation.
- Empreinte source : `5a4ded414fe9d67df25df2f742bf0f313955963638173b22c355ed807f867e69`, recalculée après publication et toujours identique.
- Build factice du gate : `1804a388b9fc93a5cb73bb4e0783ead553b57318c3e4d29bb4a2fa407016310d`. Ne pas publier ce `dist/`.
- Sorties originales : `C:/Users/eliot/AppData/Local/Temp/detours-verify-iLyapQ`.

## Publication vérifiée

URL publique : **https://app-vacances-27-beta-eliottle.vercel.app/**.

Déploiement READY : `dpl_61vHQY2eSUUTK9x6WPy6RgPkV1sy`. Preview : `https://app-vacances-27-p1t1y8udg-eliottle.vercel.app`.

Build servi : `6b78bce678df535a22170f98670d930bd65df61c4675448b2246380a415b1cb3`.

Projet : `prj_GdllwjlfvjDogyKdH2ABRJay350a`. Équipe : `team_lVeovobBaIvDqajTP8FZ3UvH`.

`prepare-l8-release.mjs` a reconstruit le candidat avec la configuration de la cible. Huit nouveaux fichiers (601 Ko) ont été envoyés via le connecteur Vercel ; les SHA1 déjà chargés sont réutilisés pour les autres. La preview protégée a été contrôlée avant de réassigner le seul alias bêta. Son exception publique préexistante est conservée. Domaine principal, protection globale et base distante inchangés.

Recette publique session 29685 terminée exit 0 : 33 fichiers contrôlés par taille/SHA-256, service worker exact, pixels de l’oiseau bordeaux clair et fond rosé vérifiés, logo violet et choix mémorisés, note éditée hors ligne puis conservée après fermeture/réouverture/reconnexion, aucun débordement à 390 px et zéro erreur d’exécution. Profil synthétique et requêtes externes bloquées. Voir `published-verification.json`.

La CLI Vercel n’est pas authentifiée : utiliser le connecteur existant plutôt que demander un nouveau login. Pour une éventuelle publication ultérieure : omettre `target` dans l’API create_deployment pour une preview ; `projectSettings` framework/buildCommand/installCommand/outputDirectory à null ; configuration statique externe avec framework null, outputDirectory point et header `/sw.js` no-cache.

## Livraison et retour arrière

Dossier externe : `C:/Users/eliot/Documents/detours-release-logos-palettes-20261019`. Il contient `dist`, `previous-dist`, 257 fichiers source/config/tests/assets et leur manifeste, le diff, le rapport du gate, la recette publique et les informations de retour arrière.

Pour annuler ce frontend, réassigner uniquement l’alias bêta à `dpl_E6v9zr2TgMEdTLKh1NJq5NeMRCLG`, build `d5781145720af29541dd8bec34246df769733596383a5d88e737af769406fb0f`. Ne pas supprimer le stockage des carnets ni rétrograder les migrations. Un retour de code ne restaure pas les données.

Le serveur local est relancé sur **http://localhost:5173/**, session **54444**, commande `npm run dev -- --port 5173 --strictPort`. L’ancien serveur a été arrêté avant le gate après contrôle de son PID/commande. L’ouverture de la bêta dans Codex a renvoyé `queued` : cela ne prouve pas que le panneau soit déjà visible.

## Reprise éventuelle et limites

Ne reprendre aucune opération de publication déjà terminée. Pour une nouvelle retouche, relire RAPPORT.md, vérifier `git status` et le périmètre demandé, préserver les travaux préexistants et les snapshots. Aucun travail obligatoire ne reste pour cette demande.

Les preuves couvrent des navigateurs émulés et des profils synthétiques, pas un iPhone physique, une installation OS, OAuth ou une synchronisation cloud réelle. La personnalisation concerne les logos de l’interface ; l’icône installée reste canonique.

Mémoire consultée uniquement pour la cascade CSS : MEMORY.md:150-150, rollout `01a145e7-70f1-7253-b8a4-98fc8aaa1870`. Aucune mémoire modifiée.
