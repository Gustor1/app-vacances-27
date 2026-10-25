# Lot 09 — Souvenirs personnels et export choisi

État final du 24 octobre 2026 (Asia/Shanghai). **Lot 09 implémenté et testé localement. Le gate commun reste en échec sur un scénario d'import simulé, réussi ensuite en reprise ciblée ; son origine exacte n'est pas établie.** Les 23 contrôles non exécutés après cet arrêt ont tous réussi séparément. Aucun lot suivant commencé.

## Résultat livré

Dans **Mon planning → Souvenir personnel**, une journée reçoit une photo et une légende de 500 caractères maximum, avec enregistrement explicite, annulation des changements, remplacement de photo et suppression confirmée. Le carnet reste utilisable sans photo. Les copies sont privées dans l'espace local ou du compte ouvert, pour ce voyage et ce navigateur ; aucune synchronisation, publication ou disponibilité sur un autre appareil annoncée.

**Préparer un souvenir imprimable** propose un choix de journées initialement vide. Titres et dates constituent l'aperçu de base ; photos et légendes nécessitent chacune une case d'accord. Réservations, dépenses, documents, notes privées et adresses d'activités sont exclus. L'utilisateur vérifie les titres avant impression. Le titre du document est temporairement générique pour éviter d'inclure le titre global du carnet dans les métadonnées PDF. Impression navigateur seulement : choisir PDF si disponible, aucun générateur PDF automatique intégré.

Les sauvegardes historiques sont préservées. Toutes les nouvelles sauvegardes complètes indiquent l'exclusion des photos/légendes quotidiennes. Un **paquet souvenirs personnel v1** distinct, précédé de son aperçu, contient les photos/légendes sauvegardées de ce carnet, y compris ses journées supprimées, sans compte ni contenu du carnet. Restaurer d'abord le carnet, l'ouvrir, puis importer son paquet, vérifier la destination et confirmer. Les journées absentes et les souvenirs déjà présents sont comptés et ignorés ; aucun écrasement automatique. L'accès au paquet et au nettoyage reste disponible après suppression de toutes les journées.

## État initial et préservation

- Checkout initial sale sur `codex/mascotte-pixel-demo`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, avec les lots précédents non commités. Consignes communes, lot 09, AGENTS, README, collaboration, rapport du lot 08 et code concernés lus. Aucun AGENTS imbriqué trouvé.
- Base distante `codex/carnets-universels` récupérée par fetch ; branche `codex/lot-09-souvenirs` créée sur l'état local contenant les prérequis, sans reset, stash forcé, changement de base ou réécriture d'historique.
- Snapshot préalable : `C:/Users/eliot/Documents/detours-lot09-recovery-20261024`, bundle Git et manifeste SHA-256 `df0b48d3e0c5ebe2526cae520e233959f51ccc0a06a2c6337b9749d522a9d79c`. Ignorés/secrets exclus.
- **1480 des 1487 fichiers initiaux identiques ; 7 modifications prévues ; aucun fichier initial manquant, aucune modification/addition inattendue.** Dix captures historiques régénérées par les tests ont été archivées dans `regenerated/`, puis rétablies octet pour octet depuis le snapshot vérifié.
- Preuves : [préservation](preservation.json), [captures rétablies](restored-evidence.json), [liste des changements et empreintes](changes.json), [patch inverse vérifié](patch-check.json), `lot09.patch`.

Fichiers préexistants modifiés : `README.md`, `src/App.tsx`, `src/backup.ts`, `src/components/BackupPanel.tsx`, `src/locale-utils.ts`, `scripts/verify-local.mjs`, `tests/backup.test.mjs`. Ajouts propres : module `src/souvenirs.ts`, composant/CSS `Souvenirs`, dictionnaire quatre langues, tests unitaires/navigateur, smoke compilé et script de préservation. Aucun changement de schéma StoredState, de projection cloud, de serveur ou de droits RLS. Aucune dépendance ajoutée.

## Contrat de données et budgets

IndexedDB `detours-personal-souvenirs-v1`, version 1. Un enregistrement associe la clé `[espace, voyage, journée]`, une révision, la légende et le Blob JPEG. **Photo et référence sont dans le même enregistrement et la même transaction** : aucune fenêtre d'interruption entre deux stockages et aucun blob séparé orphelin. Les écritures demandent une durabilité stricte, valident avant écriture et relisent dans la transaction ; elles vérifient la révision et le budget sous verrou transactionnel commun aux onglets. Un refus de quota, une interruption ou un conflit conserve l'ancien enregistrement.

| Élément | Limite |
|---|---|
| Entrée photo | JPEG, PNG, WebP ; 12 Mio ; 32 millions de pixels ; côté 16384 maximum |
| Copie locale | JPEG réencodé ; côté 1600 maximum ; 512 Kio maximum |
| Légende | 500 caractères UTF-16 maximum, comme le champ navigateur |
| Stockage logique global | 32 Mio pour tous les espaces, 1000 souvenirs maximum ; blobs, texte UTF-8 et réserve de 1024 octets par entrée |
| Paquet personnel v1 | 48 Mio ; 1000 entrées ; validation et SHA-256 de chaque photo avant réencodage/restauration |
| Sauvegardes existantes | Plafond complet inchangé : 64000000 octets ; import historique de carnet inchangé |

Les dimensions encodées et la signature réelle sont contrôlées avant allocation des pixels. Le décodage applique l'orientation EXIF, puis canvas réencode les pixels, sans recopier les métadonnées originales dont GPS. L'original sur disque reste inchangé. HEIC, SVG, vidéo, faux MIME et fichiers indécodables sont refusés avec explication. PNG/WebP transparents deviennent des copies JPEG sur fond blanc.

Mesures sur données fictives : PNG 4000×3000 de **237718 octets → JPEG 1600×1200 de 12008 octets** ; JPEG orienté → 30×80, 773 octets, sans EXIF ; WebP réel 37×29 de 102 octets → JPEG de 767 octets. Paquet photo/légende du smoke : **8950 octets**. Un lot logique de 65 photos de 512 Kio (34078720 octets avant réserve) est refusé sans aucune entrée partielle. Ces images synthétiques ne représentent pas le poids de toutes les photos réelles. [Mesures](image-budgets.json), [WebP](webp-decoder.json).

Le quota disque effectif du navigateur peut être inférieur au budget ; aucune capacité physique garantie. Une coupure système peut perdre la dernière transaction malgré la demande de durabilité. Conserver des sauvegardes hors du navigateur.

## Vérifications exécutées

[Résumé structuré](validation-summary.json), [gate initial complet](gate/validation.json), [log du gate](gate.log), [continuation](remaining-validation.json), [log de continuation](remaining.log).

| Contrôle | Résultat |
|---|---|
| Types produit et tests, lint | Réussis |
| Tests unitaires du dépôt | 330/330 |
| Tests unitaires propres au lot | 5/5 ; sauvegarde + souvenirs ciblés : 14/14 |
| Build Vite, SW, identité et SQL isolé PGlite | Réussis |
| Groupe principal navigateur | 93/93 |
| Palettes/logo/préférences | 34/34 |
| Analyse planning simulée dans le gate | 2 réussites, 1 échec ; reprise ultérieure 3/3 |
| L4/L5/L6, cartes et préférences | 28/28 |
| Souvenirs navigateur | 9/9 sur la version finale |
| Assistant / mascotte navigateur | 14/14 et 7/7 |
| Smokes compilés | 19/19 dans la continuation |
| Étapes non exécutées après l'arrêt du gate | 23/23 réussies séparément |
| Préservation et contrôle inverse du patch | Réussis |

Au total gate + continuation : **187 scénarios navigateur réussis et 1 échec**, puis les 3 scénarios d'analyse réussis en reprise séparée. **Cela ne rend pas le gate global vert.** Le script `continue-validation.mjs` rejoue uniquement ses étapes non exécutées et garde explicitement `globalGatePassed=false`.

Les neuf tests du lot couvrent les quatre langues, clavier, mouvement réduit, 320/390/1440 px et zoom 200 %, note sans photo, consentements d'impression, orientation EXIF réelle, grandes dimensions, faux MIME, formats absents, corruption/intégrité, photo illisible et récupération de légende, interruption après put, refus de quota simulé, plafond logique, concurrence entre onglets, isolation comptes/voyages, restauration idempotente, suppression, annulation et nettoyage confirmé des journées détachées. Contrôle supplémentaire de l'éditeur à 320 px sombre dans les quatre langues : aucun débordement ([mesures](editor-layout.json)).

Le [smoke souvenirs compilé du gate](gate/souvenirs-compiled/validation.json) prouve le rechargement réellement hors ligne avec photo, le téléchargement du paquet, la sauvegarde qui annonce son exclusion, la restauration carnet puis paquet dans un profil vierge, le réessai sans écrasement et la suppression. Zéro erreur runtime. Quatre tentatives de tuiles OSM héritées de l'accueil ont été bloquées ; aucune autre requête externe relevée dans ce parcours. Aucun envoi de photo.

PDF de preuve fictif : [impression automatisée](gate/souvenirs-compiled/impression-automatisee.pdf), titre « Mes souvenirs de voyage », une page A4, 46685 octets. Le PDF a été rendu par Poppler et inspecté visuellement : photo et texte lisibles, pas de coupe observée. Le dialogue d'impression humain et une imprimante réelle ne sont pas validés. WebKit a participé au contrôle existant des mises à jour ; cela ne vaut pas recette des souvenirs sur iPhone.

## Échecs, corrections et incertitude restante

1. **Corrigé : test de taille de sauvegarde.** La nouvelle exclusion accentuée révélait un test qui remplissait le fichier en caractères au lieu d'octets. Le test vérifie maintenant exactement 64000000 octets UTF-8 et refuse l'octet suivant ; aucun relèvement de plafond. [Premier arrêt](gate-initial/validation.json), `gate-initial/run.log`.
2. **Corrigé : titre PDF et localisation.** Le titre global du carnet apparaissait dans les métadonnées sans figurer dans l'aperçu ; titre temporairement générique et assertion quatre langues ajoutés. Les exclusions du bilan de restauration sont traduites et le paquet invalide a un message distinct. Deux exécutions de vérification intermédiaires ont été arrêtées volontairement pour ces corrections, logs `gate-print-audit/` et `gate-localization-audit/`. Seuls nos processus de test ont été arrêtés.
3. **Non expliqué : import simulé.** Le gate final s'arrête à `planning-analysis.spec.ts:36`, champ « Ton programme » absent après ouverture de la fenêtre. Le retry courant réussit 3/3 sans modification de code ni de timeout. Avant-lot : première série 2/3 avec un échec différent de navigation initiale à la ligne 21, puis série à chaud 5/5. **Le défaut exact n'a pas été reproduit sur le snapshot : son antériorité n'est pas démontrée.** Les cinq fichiers import/auth/test impliqués sont identiques au snapshot ; aucune régression fonctionnelle propre aux souvenirs identifiée sur ce parcours avant montage du composant. Cause interne exacte non établie, aucun correctif d'auth/import hors lot appliqué. [Investigation](planning-investigation.json), [empreintes](planning-before-hashes.json), logs `planning-before.log`, `planning-before-warm.log`, `planning-current-retry.log`, traces dans `gate/planning-analysis-failure/` et `planning-before-failure/`.

## Version vérifiée

- Branche `codex/lot-09-souvenirs`, HEAD initial inchangé `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`.
- Empreinte source : `79870f5c6eff957f91498f09a68e89e4c94860a5bdf2daebc15ed0738060a526` ; **sourceUnchanged=true pour le gate et la continuation**. Périmètre : sources/configurations/tests/assets visibles par Git, hors docs, Markdown et ignorés.
- Build : `9e48e06eaa1e13e2c08479f6c0f22e10f42850f823065bb94b7a74651dee4440`.
- Node v24.15.0, React 19.3.0, TypeScript 5.9.3, Vite 7.3.6, Playwright 1.63.0, Windows/Chrome installé. [Environnement](environment.json).
- PGlite externe : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`.
- Le dist du gate contient des paramètres factices : ne pas le publier. Reconstruire pour une cible séparément autorisée.

## Limites de récupération

Les sauvegardes habituelles et le paquet sont complémentaires. Une restauration du paquet réencode les photos : contenu visuel borné, pas d'identité binaire promise. Une entrée existante est ignorée même si différente ; sauvegarder puis supprimer explicitement l'existant pour la remplacer par import. Les journées absentes sont ignorées et le paquet original reste nécessaire pour les retrouver.

Les copies des journées supprimées ne sont nettoyées qu'après confirmation. Il n'existe pas de blob isolé du record à collecter. Aucune purge automatique d'un carnet entier supprimé : exporter son paquet avant suppression. Après suppression confirmée, récupération via un paquet antérieurement exporté ; pas d'annulation magique. Effacer les données du site efface aussi IndexedDB. Les brouillons non enregistrés ne sont pas une sauvegarde.

## Démonstration et retour arrière

1. Ouvrir une journée → **Souvenir personnel** → choisir JPEG/PNG/WebP → légende → **Enregistrer le souvenir**. Recharger ; le build compilé préparé retrouve la copie hors ligne.
2. Modifier puis **Annuler les modifications**, ou retirer la photo puis enregistrer. Pour effacer photo et légende, utiliser **Supprimer ce souvenir** et confirmer.
3. Préparer l'impression, choisir les journées et éventuellement les deux accords personnels, relire l'aperçu, puis imprimer/PDF si proposé.
4. Télécharger la sauvegarde du carnet et le paquet après aperçu. Dans un autre profil : restaurer le carnet, l'ouvrir, importer le paquet et confirmer la destination. Réimporter ne crée aucun doublon.
5. Exemple sans photo : `exemple-souvenirs-v1.json`, pour la journée `d` de la fixture fictive. Aucune photo personnelle utilisée pour les tests/captures.

Pour un retour arrière, sauvegarder d'abord carnets et paquets et créer un nouveau snapshot si le checkout a évolué. Vérifier `git apply --reverse --check --ignore-space-change docs/development/lot-09-souvenirs/lot09.patch`, puis appliquer à l'envers uniquement si souhaité et si le contrôle réussit. Ce patch retire seulement les modifications propres au lot, sans reset global. Le snapshot externe contient les sources originales et le bundle ; ne pas le recopier globalement sur un checkout modifié depuis.

Retirer le code ne supprime pas `detours-personal-souvenirs-v1` : une ancienne version ignore ce stockage séparé et réinstaller le lot retrouve ses copies. Les sauvegardes historiques restent lisibles.

## États de livraison et reprise

| État | Résultat |
|---|---|
| Implémenté | Oui : souvenirs locaux, paquet distinct, impression choisie, quatre langues |
| Testé localement | Ciblés et 23 contrôles de continuation réussis ; gate global non validé |
| Testé avec service réel | Aucun service nécessaire aux souvenirs ; aucun service distant ni OAuth réel validé |
| Testé sur appareil physique | Non ; viewports et Chrome mobile simulés |
| Impression | PDF Chromium automatisé rendu et inspecté ; dialogue humain/imprimante/iPhone non testés |
| Publié | Non : aucun commit, push, PR, déploiement, migration distante ou achat |

Tous les contrôles lancés sont terminés. Aucun serveur de cette mission ne reste sur 5173 ou 5175. Copie diagnostique indépendante conservée à `C:/Users/eliot/Documents/detours-lot09-before-validation-20261024`, avec jonction node_modules ; aucun secret copié.

**Pour reprendre :** commencer par `git status`, ce rapport, `validation-summary.json`, `gate/validation.json`, `remaining-validation.json`, `planning-investigation.json`, `preservation.json` et `patch-check.json`. Aucun complément de code du lot 09 identifié. Si un gate entièrement vert est requis, prochaine action précise : reproduire le scénario planning isolé avec `DETOURS_LOCAL_VERIFY=1`, `CI=1`, `node node_modules/@playwright/test/cli.js test --config playwright.planning.config.ts --grep 'paste, analyze' --repeat-each 10`, examiner la trace du champ manquant et les changements d'espace/compte sans modifier les carnets, puis rejouer le gate entier après diagnostic/correction autorisée. Ne pas attribuer sans preuve l'échec à l'avant-lot et ne pas remplacer le résultat du gate par celui des reprises.

Recette humaine restante : après une publication séparément autorisée, tester une vraie photo orientée sur le téléphone, vérifier sauvegarde/rechargement hors ligne, produire un PDF si proposé, comparer au choix de l'aperçu et restaurer les deux fichiers dans un autre profil. Garder les sauvegardes hors du navigateur. **Ne commencer aucun autre lot.**

Sources techniques consultées le 24 octobre 2026 : [HTML Standard — orientation ImageBitmap](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html), [MDN — transactions IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [durabilité](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability). APIs natives, aucune licence de bibliothèque nouvelle à intégrer.
