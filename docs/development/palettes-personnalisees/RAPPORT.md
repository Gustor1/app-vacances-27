# Palettes personnalisées de Détours — 19 octobre 2026

## Résultat

Le thème Signature conserve le lin et le vert en clair. Le sombre adopte la direction 2 retenue par l’utilisateur : prune presque noir, surfaces prune, accents sable et oiseau ivoire/sable sur fond transparent.

Dans **Préférences → Couleurs → Plus de palettes**, douze familles sont disponibles : Signature Détours, Porcelaine, Eucalyptus, Graphite & sauge, Nuit océan, Encre & glacier, Forêt & jade, Bordeaux & ivoire, Corail, Abricot & encre, Soleil & pétrole et Violet origami. Chaque famille possède une déclinaison claire et sombre, soit vingt-quatre combinaisons. Il s’agit de déclinaisons utilisables des familles explorées, avec des accents ajustés pour la lisibilité.

Chaque apparence mémorise sa propre palette. Le mode Automatique utilise la palette correspondant à l’apparence du système. La sélection s’applique immédiatement, y compris aux champs et menus, et la réinitialisation restaure seulement les deux palettes Signature. Les quatre langues sont disponibles.

La personnalisation reste locale à l’appareil. Le logo d’interface suit l’apparence : oiseau vert/lin le jour, ivoire/sable la nuit. Les icônes d’installation et le manifeste restent l’identité claire canonique ; ils ne changent pas à chaque sélection.

## Préservation et compatibilité

- Branche : `codex/palettes-personnalisees`, créée après récupération de la base partagée. HEAD de départ : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`.
- État initial complet sauvegardé dans `C:/Users/eliot/Documents/detours-palettes-recovery-20261019` : 760 fichiers, historique récupérable et manifeste de hachages. Empreinte initiale : `bdadae4caf9d26f4a94f7a12d0c84d8ac134d3fb1851555482fb23b03f899b53`.
- Les travaux des lots 01/02 et de la palette claire présents au départ sont conservés. Aucun lot suivant ni changement distant de base. La publication, autorisée ensuite par l’utilisateur, est décrite dans le rapport de publication ci-dessous.
- Les couleurs utilisent la nouvelle clé versionnée `detours-palettes-v1`, séparée de `a-l-est-preferences-v1`. Une ancienne version qui écrit seulement langue/thème ne supprime donc pas les palettes.
- Les formats des carnets, archives et sauvegardes ne changent pas. Les palettes ne sont pas incluses dans les exports de carnets/sauvegardes actuels et ne sont pas synchronisées entre appareils. Restaurer un carnet conserve la personnalisation locale.
- Au démarrage, aucune écriture automatique n’altère une valeur inconnue ou illisible. Les identifiants invalides reviennent à Signature par apparence ; une version inconnue est conservée dans le stockage jusqu’à une sélection explicite.
- Après une écriture, la valeur est relue. Si le stockage refuse l’écriture ou l’ignore silencieusement, le choix reste actif pour la session et un message indique que sa sauvegarde est indisponible. Les onglets suivent les changements stockés.

## Réalisation

`src/palettes.ts` centralise le catalogue, le parseur et les couleurs. `scripts/generate-palettes.mjs` produit `public/palettes.css` et `public/palette-bootstrap.js` depuis cette même source. Le script de démarrage résout l’apparence et la palette avant React ; la couleur du navigateur suit le fond actif. Les tests détectent des ressources générées qui ne correspondraient plus au catalogue.

Les règles de palette sont limitées à l’écran, pour préserver l’impression. Les préférences de contraste renforcé et de transparence réduite gardent des surfaces opaques. Les couleurs sémantiques des erreurs/catégories, photos et cartes ne sont pas recolorées par les palettes.

Pour modifier le catalogue, exécuter `node scripts/generate-palettes.mjs`, puis les vérifications. Pour régénérer les logos, exécuter `node scripts/generate-pwa-icons.mjs`. La source du nouvel oiseau sombre est `docs/design/palette-claire-detours/oiseau-sombre-ivoire-sable.png` ; sa version d’interface est `public/icons/brand-dark-128.png`.

## Vérifications ciblées exécutées

- Types produit/tests et lint : réussis.
- 27 nouveaux tests unitaires : parseur, 24 paires de palettes, cohérence des ressources générées et démarrage sans React/stockage accessible.
- Dix nouveaux scénarios Chromium et dix WebKit réussis : les 24 combinaisons, conservation byte pour byte d’un carnet synthétique et de ses notes, navigation clavier, reset, rechargement, onglets, écriture par une ancienne version, refus explicite/silencieux du stockage, version inconnue, quatre langues, largeurs 320/390/430, paysage, faible hauteur et préférences à 200 %, mode automatique et palette avant React.
- Les huit scénarios existants de palette claire, menus et logo ont aussi passé dans Chromium, avec l’attente sombre adaptée au nouveau défaut prune.
- Préflight compilé PWA réussi : 40 dispositions, quatre langues, ressources servies et en cache, manifeste/critères Chrome, édition de notes hors ligne, fermeture/réouverture/reconnexion, puis reprise hors ligne d’une palette sombre personnalisée et de son logo sans altérer les carnets.
- Les dix nouveaux scénarios WebKit ont été rejoués après la correction d’encodage : **10/10 réussis, exit 0**, sur le même code que le gate final.
- Revue React : état versionné séparé, radios natifs, effets/listeners nettoyés et absence de nouvelle dépendance.

Les mesures des 24 profils sont dans [contrastes-catalogue.json](contrastes-catalogue.json). Sur les quatre surfaces testées, les textes/liens dépassent 4,5:1 ; les textes des actions remplies dépassent 4,5:1 ; les contours de champs/focus dépassent 3:1 sur les surfaces testées. Cela ne constitue pas un audit exhaustif de toutes les superpositions photographiques ou couleurs métier.

Preuves : [matrice Chromium](matrix-chromium.json), [matrice WebKit](matrix-webkit.json), [journal WebKit final](webkit-final.log), [PWA préflight](pwa-preflight-validation.json), captures dans `screenshots/`.

## Vérification complète

`npm run verify:local` : **24/24 étapes réussies, exit 0, `notRun: []`, `sourceUnchanged: true`**. Types, lint, **240 tests unitaires**, build/intégrité, SQL isolé, **125 scénarios navigateur** (62+32+3+28) et **12 smokes compilés** passent. La recette PWA vérifie les quarante dispositions et la reprise d’une palette personnalisée/logo hors ligne. La recette de mise à jour passe dans Chromium et WebKit, avec les limites d’émulation indiquées dans son journal.

- [Validation finale](validation.json), [journal complet](gate.log), [PWA compilée finale](pwa-validation.json), [préservation finale](preservation-finale.json).
- Empreinte source finale : `9b35078d63686ad9d3cc8a80d11a008158e1362e285111d049c7a3182a0790c7`.
- Build testé : `71f5b458e96192bf26bfb70b9b4f3336f05bae43c5a78c4d221c37b90a6e30c1`.
- Sorties originales : `C:/Users/eliot/AppData/Local/Temp/detours-verify-uXgAco`.
- PGlite externe : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.

L’empreinte a été recalculée après le gate : elle correspond au résultat final. Les fichiers ignorés et `docs/`/Markdown ne font pas partie de cette empreinte ; les hachages du snapshot et du diff complètent la preuve de préservation. Deux captures historiques de l’import régénérées par les tests ont été restaurées byte pour byte après copie des nouveaux résultats dans `import-regression/`. Le build du gate utilise une configuration factice : **ne pas publier son `dist/`**.

Le premier essai a arrêté le gate à l’étape navigateur, avec 60/62 scénarios réussis. Les deux scénarios chinois ne trouvaient plus le libellé natif de la langue : une édition Python sous Windows avait réencodé cette ligne en cp1252. Le libellé a été restauré exactement depuis le snapshot par lecture/écriture UTF-8 explicite, sans modifier les assertions existantes. Les preuves de l’échec restent dans [premier-gate/](premier-gate/validation.json). Le nouveau gate intégral ci-dessus réussit sur le code corrigé ; le premier essai ne valide pas les étapes qu’il n’avait pas exécutées.

## Limites

Ces résultats sont locaux, avec profils jetables et services simulés/interceptés. Ils ne prouvent pas une installation réelle par iOS/Android, un appareil physique, OAuth ou un service distant. La couleur de la ligne active d’un sélecteur natif peut rester celle du système.

Les trois échecs historiques du profil iPhone WebKit sur des tests de focus/navigation restent documentés dans le rapport de la palette claire ; les dix nouveaux scénarios passent. Le défaut historique du grand formulaire d’import sous zoom CSS de 200 % n’est pas corrigé par cette mission ; la nouvelle collection dans les préférences passe à ce zoom.

## Retour arrière et reprise

La sauvegarde initiale et les hachages permettent un retour arrière sélectif. Refaire une copie de l’état courant avant de restaurer, identifier les seuls fichiers de cette contribution, et préserver toute modification ultérieure. Ne pas réinitialiser globalement le dépôt : il contenait déjà des travaux non commités.

Le nouveau stockage étant séparé, revenir au code antérieur laisse les carnets et l’ancienne clé de préférences lisibles ; l’ancienne version ignore simplement `detours-palettes-v1`. Conserver cette clé facilite un retour en avant. L’état précis de reprise figure dans [REPRISE.md](REPRISE.md).

L’inventaire [changes.json](changes.json) compare la contribution au snapshot : **749 fichiers initiaux inchangés, 11 modifiés, aucun manquant**, et dix nouveaux fichiers de réalisation, dont la source du logo. Les documents de mission et captures s’ajoutent séparément. Les preuves historiques du lot 02 et de la palette claire restent conservées.

Le [diff binaire sélectif](contribution.patch) contient seulement cette contribution, au-dessus de l’état local initial. Son contrôle sans mutation `git apply --reverse --check --ignore-space-change docs/development/palettes-personnalisees/contribution.patch` réussit. Il permet de préparer un retour arrière ou une contribution isolée, après relecture des éventuels travaux ultérieurs. Aucun commit, push ni PR n’a été créé avec les travaux locaux mélangés du dépôt.

Le vert Signature clair a été très légèrement ajusté de `#3C6E59` à `#3B6D58` pour garantir 4,5:1 sur toutes les surfaces sélectionnées testées. Les matériaux translucides utilisent les tokens de chaque palette ; les fonds lin/crème/champs de Signature restent respectivement `#E8DFD0`, `#F7F2E9` et `#F2EBDF`.


## Publication autorisée ensuite

Après « push ça en ligne », la bêta habituelle a été mise à jour et contrôlée publiquement. Voir [rapport de publication](publication/RAPPORT.md) et [preuve des fichiers servis et du parcours hors ligne](publication/published-verification.json). Le déploiement précédent reste disponible pour retour arrière.
