# Démo de progression — 25 octobre 2026

Publication demandée pour montrer les travaux aux proches, avec audit global reporté.

## Liens publics

- Détours : https://app-vacances-27-beta-eliottle.vercel.app/
- Atelier des mascottes : https://app-vacances-27-beta-eliottle.vercel.app/mascotte/
- Branche GitHub : https://github.com/Gustor1/app-vacances-27/tree/codex/demo-progression-20261025
- PR en brouillon vers `codex/carnets-universels` : https://github.com/Gustor1/app-vacances-27/pull/5

Commit applicatif : `b6f186b47e30622cc0d4ec151fa788b44039ed05`. Le push distant a été relu avec `git ls-remote`.

## Déploiement final

Projet Vercel existant : `app-vacances-27` (`prj_GdllwjlfvjDogyKdH2ABRJay350a`), équipe `eliottle`.

- Déploiement final : `dpl_DgZQ9gmstEUvDvwfVvRVuxwVdxeU`, état `READY`.
- URL du déploiement : `https://app-vacances-27-1nwposnwh-eliottle.vercel.app` (l’alias bêta ci-dessus est le lien public à partager).
- Build réellement servi : `034dd551dcec87d1fac14c4eb1cdacc282835260b23327d03a04cfe96c50934b`.
- Entrée observée dans l’accueil publié : `/assets/index-YmuK6ke3.js`.
- Manifeste public lu dans le navigateur : 108 fichiers, dont 8 pour l’atelier des mascottes. Copie dans `build-info-public.json`.

Déploiement de type preview, sans fusion dans `main`, sans changement du domaine de production et sans migration Supabase. L’alias bêta conserve sa dérogation publique préexistante ; la protection des autres previews reste en place. Les trois variables publiques Vite de la cible preview existaient déjà sur Vercel. Aucun secret NVIDIA n’est ajouté au navigateur ni à Vercel.

## Packaging des mascottes

La mascotte animée reste un prototype séparé des vrais carnets. Les fichiers web de `prototypes/mascot-lab/` sont copiés vers `public/mascotte/` pendant la préparation distante, avant le build Vite. Les scripts du serveur local, tests et README du prototype ne sont pas publiés dans cette route.

La commande d’installation du déploiement final est une surcharge propre à cette publication :

```sh
npm ci && mkdir -p public/mascotte && cp prototypes/mascot-lab/*.html prototypes/mascot-lab/*.css prototypes/mascot-lab/*.js public/mascotte/ && cp -r prototypes/mascot-lab/assets public/mascotte/
```

`vercel.json` conserve `npm run build`. Une tentative de surcharge de la commande de build seule était écrasée par ce fichier ; le premier frontend publié fonctionnait, mais sa route mascotte renvoyait 404. La préparation avant build du déploiement final corrige cela. Les deux liens ont ensuite été ouverts avec succès dans le navigateur.

Cette surcharge n’est pas une modification du script de build du dépôt : la conserver explicitement pour une future redémo, ou intégrer proprement cette route lors d’un prochain lot.

## Contrôles et limites

- Sauvegarde récupérable de 1 561 fichiers et bundle Git avant staging : `C:/Users/eliot/Documents/detours-demo-recovery-20261025`.
- Scans de signatures de clés privées sans correspondance dans les fichiers non ignorés. `.env.local`, clés, `dist/`, dépendances et fichiers locaux ignorés restent hors Git.
- Compilation distante Vercel réussie ; le build du gate local à backend factice n’est pas utilisé pour publier.
- Accueil ouvert publiquement, sans écran de connexion Vercel ; compte de l’application facultatif pour le mode local.
- Fenêtre « Créer depuis un planning » ouverte : import local PDF/DOCX et pont vers IA externe présents. Aucun document personnel importé pour cette vérification.
- Les cinq zones de rendu de l’atelier signalent leurs ressources chargées ; menu flottant de Pico ouvert puis refermé au clavier. Aucune erreur console constatée sur les contrôles ciblés.
- Le manifeste public référence le commit applicatif poussé. Ce contrôle ne revendique pas une comparaison SHA de chacun des 108 fichiers téléchargés.
- Tests sur navigateur de bureau ; aucune validation physique iPhone, OAuth réel, nouveau compte ou synchronisation distante réalisée dans cette livraison.
- L’IA distante d’import n’est pas activée par cette publication. Les benchmarks du lot 06 ne constituent pas un service d’IA public.

Les captures de l’accueil et de l’atelier publiés sont conservées dans ce dossier. L’audit global et ses corrections restent reportés.

## Résultat final du gate local

`npm run verify:local` a été exécuté avec PGlite externe. Il s’est arrêté à l’étape « assistant navigateur » : **26 étapes réussies, 1 étape échouée, 7 étapes non exécutées**, empreinte `sourceUnchanged: true`.

- Types, lint, 330 tests unitaires, compilation et intégrité du build local réussis.
- 180 scénarios navigateur réussis au total, 1 échoué.
- Échec : `tests/e2e/assistant.spec.ts:78`, `revision arriving during pending lock is preserved and refreshed for a new preview` (13/14 scénarios de l’assistant réussis). C’est le scénario déjà signalé dans les rapports précédents ; aucune correction ni relance pour masquer cet échec.
- Le scénario d’analyse planning simulée, en échec dans le rapport du lot 09, passe cette fois-ci (3/3). Cela ne suffit pas à conclure que son intermittence est résolue.
- Restent non exécutés dans ce run : assistant compilé, mascotte navigateur/compilée, lieux compilés, PWA compilée, mise à jour Chrome/WebKit et smoke final planning/carte/restauration. Les contrôles publics ciblés décrits plus haut sont distincts.

Le rapport exact et le log sont dans `gate/validation.json` et `gate/gate.log`. Le gate a démarré avant le commit applicatif ; son `baseRevision` reflète ce point de départ, tandis que son empreinte stable couvre le contenu de travail publié. Douze preuves historiques réécrites par les tests ont été archivées dans la sauvegarde externe puis restaurées à leurs octets initiaux ; liste dans `gate/restored-evidence.json`.

Le `dist/` local restant est le build du gate à backend factice. La version publique a été compilée séparément sur Vercel avec les variables preview de la cible. Ne pas republier ce `dist/` local tel quel.

## Retour arrière

L’alias bêta pointait avant cette livraison sur `dpl_61vHQY2eSUUTK9x6WPy6RgPkV1sy`. Réassigner ce même alias à ce déploiement permet de revenir au frontend précédent, sans intervention sur les carnets ou la base distante. Un retour du code ne restaure pas les données utilisateur : préserver les sauvegardes avant toute restauration explicite.
