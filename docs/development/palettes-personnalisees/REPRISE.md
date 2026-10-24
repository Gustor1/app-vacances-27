# État final et reprise — palettes personnalisées

Mission terminée localement le 19 octobre 2026. L’utilisateur a choisi la direction 2 prune/sable pour le sombre et confirmé toutes les familles proposées en bonus. Aucun lot suivant commencé. Publication bêta autorisée ensuite par l’utilisateur et terminée : voir publication/RAPPORT.md. Aucune modification de base distante.

## Livré

Préférences → Couleurs → Plus de palettes : douze familles, chacune en clair/sombre. Signature lin/vert le jour et prune presque noir/sable la nuit, avec nouvel oiseau sombre ivoire/sable. Choix mémorisés indépendamment par apparence, automatique, reset et quatre langues. Clé `detours-palettes-v1` séparée de l’ancienne clé et des carnets. Une écriture refusée/ignorée garde le choix pour la session et affiche l’échec. Synchronisation entre onglets et démarrage avant React vérifiés. Icônes d’installation/manifeste restent canoniques clairs ; palettes non exportées/synchronisées entre appareils.

Branche `codex/palettes-personnalisees`, HEAD initial `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. Aucun commit/push/PR du mélange local déjà présent. Le diff isolé de cette contribution est dans `contribution.patch`.

## Sauvegarde et préservation

Snapshot antérieur : `C:/Users/eliot/Documents/detours-palettes-recovery-20261019`, 760 fichiers et historique récupérable, empreinte `bdadae4caf9d26f4a94f7a12d0c84d8ac134d3fb1851555482fb23b03f899b53`.

Comparaison finale : **749 fichiers initiaux inchangés, 11 modifiés intentionnellement, aucun manquant**. Dix nouveaux fichiers de réalisation, dont le PNG source sombre, plus les documents/preuves de mission. `changes.json` et `preservation-finale.json` listent les hachages. Le contrôle inverse du patch sans mutation passe : `git apply --reverse --check --ignore-space-change docs/development/palettes-personnalisees/contribution.patch`.

Les preuves historiques réécrites par des recettes existantes ont été recopiées ici puis restaurées depuis le snapshot (PWA et deux captures d’import). Ne pas restaurer tout le dépôt : les travaux lots01/02/UI claire/imports étaient déjà modifiés au départ.

## Vérifications finales réelles

- Gate `npm run verify:local`, session93310 terminée exit0 : **24/24**, `notRun: []`, `sourceUnchanged: true`.
- Types produit/tests, lint, **240 unités**, build/SW/intégrité, SQL PGlite isolé.
- **125 scénarios Chromium** (62+32+3+28), dont les dix nouveaux scénarios de palettes et les quatre langues existantes.
- **12 smokes compilés**, dont PWA quarante dispositions, cache CSS/bootstrap/logo sombre, palette violette reprise hors ligne après fermeture/réouverture, carnets inchangés, reconnexion. Mise à jour Chromium/WebKit et conservation des carnets/cache réussies selon leurs limites d’émulation.
- **Dix nouveaux scénarios WebKit rejoués sur le code final : 10/10**, session35557 exit0, `webkit-final.log`. Les matrices et captures de ce dossier correspondent à la dernière exécution.
- Empreinte source : `9b35078d63686ad9d3cc8a80d11a008158e1362e285111d049c7a3182a0790c7`. Recalculée après gate, identique.
- Build : `71f5b458e96192bf26bfb70b9b4f3336f05bae43c5a78c4d221c37b90a6e30c1`.
- Résultats originaux : `C:/Users/eliot/AppData/Local/Temp/detours-verify-uXgAco`. Copies `validation.json`, `pwa-validation.json`, `gate.log` dans ce dossier.
- PGlite externe : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.

Premier gate conservé dans `premier-gate/` : échec60/62 car une édition sous encodage Windows avait altéré le libellé natif chinois dans locale-utils.ts. Libellé rétabli byte pour byte depuis le snapshot en UTF8 explicite ; aucun test ancien affaibli. Nouveau gate intégral réussi ensuite.

## Serveur et prochaine action

Le serveur de travail fonctionne sur **http://localhost:5173/**, session **52453**, commande `npm run dev -- --port 5173 --strictPort`. L’ancien serveur de la session81254 a été arrêté avant le gate après contrôle de son PID/commande. Les sessions de vérification sont terminées.

Une ouverture dans le panneau Codex a été demandée et renvoyée `queued` ; cela ne prouve pas que le panneau soit déjà visible. L’utilisateur peut ouvrir l’adresse locale puis Préférences → Couleurs → Plus de palettes.

**Aucune action de code obligatoire ne reste pour cette mission.** Si l’utilisateur demande un ajustement, repartir du code courant, refaire `git status`, préserver la sauvegarde et les travaux préexistants. Lire RAPPORT.md, examiner changes.json, appliquer uniquement le périmètre demandé. En cas de nouvelle livraison, régénérer les palettes si le catalogue change et refaire le gate avec le port5173 libre ; restaurer les preuves historiques que les anciennes recettes peuvent réécrire. Ne pas publier le `dist/` du gate, construit avec configuration factice.

## Repères et limites

Catalogue/parser/contrastes : `src/palettes.ts`. Génération : `scripts/generate-palettes.mjs` et `palette-assets.mjs` → `public/palettes.css` / `palette-bootstrap.js`. Contexte : `src/i18n.tsx`. UI : Preferences.tsx/css. Langues : `src/locales/palettes.ts` + locale-utils.ts. Logo : BrandMark.tsx, `public/icons/brand-dark-128.png` ; source `docs/design/palette-claire-detours/oiseau-sombre-ivoire-sable.png`, génération par `scripts/generate-pwa-icons.mjs` (Playwright existant, pas de dépendance ajoutée).

Validation locale avec profils synthétiques et émulation, pas iPhone physique, installation réelle OS, OAuth ni services réels. La sélection native active peut garder la couleur système. Les trois échecs historiques de focus/navigation du profil iPhone WebKit et le grand formulaire d’import sous zoom CSS200 restent documentés dans le rapport de la mission précédente ; aucune correction globale n’est revendiquée. Les dix nouveaux scénarios WebKit et les préférences à200 passent.

Mémoire consultée pour cascade CSS/petits écrans uniquement, aucune mémoire modifiée : MEMORY.md:150-150, rollout `01a145e7-70f1-7253-b8a4-98fc8aaa1870` à citer selon le format prévu si utilisée dans une réponse.


## Publication terminée après autorisation

Bêta : https://app-vacances-27-beta-eliottle.vercel.app/ ; déploiement READY dpl_E6v9zr2TgMEdTLKh1NJq5NeMRCLG ; build d5781145720af29541dd8bec34246df769733596383a5d88e737af769406fb0f. Source toujours identique au gate. Recette publique session51079 exit0, 33 assets + worker vérifiés, palettes/logo et notes hors ligne conservés, zéro erreur. Voir publication/RAPPORT.md et ses JSON. Aucun travail requis ne reste. Sauvegarde livraison C:/Users/eliot/Documents/detours-release-palettes-20261019 ; rollback par réassignation du seul alias bêta à dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS. Ne pas reprendre une ancienne instruction « ne pas publier » comme blocage : l’utilisateur a explicitement autorisé cette publication après la livraison locale.
