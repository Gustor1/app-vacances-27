# Carnets animés — 1er novembre 2026

## Intention et accès

Intégration autorisée par l’utilisateur après sélection des catalogues EasyUI et ReactDrops. Direction : papier manipulable, souvenirs photographiques et relief cartographique, en conservant les palettes, la typographie Newsreader/Hanken et les parcours existants. Les animations sont volontairement visibles pour permettre un jugement après essai.

- Accueil : relief topographique animé, pause/reprise, reflet et onde ponctuels sur le logo. Chaque carte de voyage propose **Mes souvenirs**.
- **Vue d’ensemble** : boîte à photos ouvrable, trois tirages, éventail de cinq photos maximum, album complet et visionneuse ; cartes horizontales des étapes ; aperçu des activités de chaque journée ; sommaire des villes avec suivi du défilement.
- **Mes outils sur place → Budget** : répartition des dépenses converties, sélection d’une catégorie. Les devises sans taux restent exclues du graphique et signalées ; aucun montant enregistré n’est changé.
- **Mon carnet pratique → Mes documents** : dossiers avec feuille qui se soulève ; ouverture et téléchargement conservés.
- **Créer depuis un planning** : progression source → vérification → création, reliée à l’état existant.
- Fiches : ouverture depuis la position de la carte sur ordinateur ; panneau mobile existant conservé.
- Déplacement d’une activité par les flèches : notification animée avec annulation, suspendue au survol ou au focus.

## Références et adaptation

Implémentations propres au projet, inspirées des interactions des catalogues ; aucun code, image de démonstration ou paquet de ces catalogues n’est recopié. Aucun nouvel abonnement, service ou dépendance.

| Référence | Adaptation Détours |
| --- | --- |
| [Photo Box](https://easyui.site/components/photo-box) | Boîte de souvenirs privés, ouverture au clic/toucher/clavier |
| [Fan Gallery](https://reactdrops.dev/components/gallery/fan-gallery) | Éventail de photos locales et album |
| [Topographic Flow](https://reactdrops.dev/components/background/topographic-flow) et [Topographic Terrain](https://reactdrops.dev/components/background/topographic-terrain) | Courbes SVG originales et perspective ; illustration décorative, sans prétention géographique |
| [Story Cards](https://easyui.site/components/story-card) | Carrousel manuel des villes du carnet |
| [Fractal Glass](https://reactdrops.dev/components/image/fractal-glass) | Verre strié CSS sur une partie des images des étapes, révélé au survol/focus |
| [Peek Card](https://easyui.site/components/peek-card) | Aperçu natif des journées |
| [Morphing Dialog](https://easyui.site/components/morphing-dialog) et [Sheet](https://easyui.site/components/sheet) | Continuité depuis la carte sur ordinateur ; ressort et geste mobile déjà présents réutilisés |
| [macOS Folder Cards](https://easyui.site/components/mac-os-folder-cards) | Dossiers des documents réellement joints |
| [Scroll Progress Navigation](https://easyui.site/components/scroll-progress-nav) | Sommaire collant des étapes, position active |
| [Donut Chart](https://easyui.site/components/donut-chart) | Anneau SVG avec légende interactive et montants lisibles |
| [Stepper](https://easyui.site/components/stepper) | Trois étapes de l’import existant |
| [Undo Toast](https://easyui.site/components/undo-toast) | Annulation limitée au dernier réordonnancement encore applicable |
| [Liquid Glass Logo](https://reactdrops.dev/components/text-reveal/liquid-glass-logo) | Reflet et onde ponctuels sur le logo existant ; pas de moteur WebGL ni de reproduction de la démonstration |

## Contrat et limites

Photos/légendes toujours lues depuis IndexedDB, séparées par compte et carnet. L’album est une projection en lecture seule ; seules les journées encore présentes sont affichées, les souvenirs détachés restent gérés par l’outil historique. Aucun envoi, ajout dans les sauvegardes ordinaires ou partage des médias. Les URL temporaires sont révoquées au démontage et au remplacement des lectures. Erreur de stockage, absence de photo et image illisible disposent d’un état explicite.

L’annulation du réordonnancement utilise le même verrou de carnet et la même sauvegarde de récupération que les écritures existantes. Elle relit les droits et le carnet sous verrou, vérifie l’ordre et le contenu attendus, restaure seulement l’ordre et conserve les modifications indépendantes. Elle est indisponible pendant une sauvegarde, une erreur ou sans Web Locks. Une révision divergente est refusée ; un accusé de réception interrompu peut être repris sans réécriture.

Clavier, focus des fenêtres, Échap, quatre langues, palettes claire/sombre et réduction des mouvements système conservés. Le relief se met en pause hors écran ou lorsque l’onglet est masqué, avec un bouton de pause manuel. Les autres effets sont ponctuels ou liés aux interactions. Les photos et éléments décoratifs ajoutés sont exclus de l’impression ordinaire ; l’impression des souvenirs reste soumise aux consentements existants.

Le travail part du checkout typographique `1e0d869`, descendant de la base partagée récupérée `origin/codex/carnets-universels` (`9fa03b1`). Les fichiers d’audit non suivis déjà présents ont été conservés. Aucun déploiement, changement de domaine, fusion ou migration distante.

## Vérifications

Résultats finaux à compléter après la fin des contrôles. Les captures utilisent uniquement une fixture fictive et l’illustration locale `public/china-landscape.svg`, jamais des photos personnelles.
