# Détours — Accès Google Maps sans frais API

Plan révisé le 17 octobre 2026 à la demande du propriétaire : gratuit.
Cette version remplace le précédent plan Maps JavaScript + Places UI Kit. Ne pas implémenter ces services facturables ni se reposer sur leur franchise mensuelle.

## Résultat attendu

Conserver l'interface et la carte Leaflet actuelles. Faciliter l'accès à la fiche Google d'un lieu pour consulter ses avis/photos, et ouvrir un itinéraire Google Maps. Aucun abonnement, clé ou appel API Google nécessaire pour le parcours principal.

La consultation des avis/photos se déroule dans Google Maps, pas dans une fiche personnalisée Détours. Une carte Embed gratuite constitue une option secondaire, sans promesse de récupération de photos ou avis.

## Lot 1 — Vérifier l'existant

Lire AGENTS.md, README.md et docs/development/COLLABORATION.md. Vérifier branche et état Git ; préserver tous les travaux présents. Préparer une branche dédiée selon les règles du dépôt, sans perdre les évolutions récentes de l'import.

Inspecter src/maps.ts, src/lib.ts, src/map-preferences.ts, src/MapPreferences.tsx, TripMap.tsx et les boutons existants. Les liens Google/Amap existent déjà : les améliorer plutôt que créer un second système. Garder WorldView et les ressources hors ligne.

Terminé lorsque les usages existants et les changements nécessaires sont identifiés.

## Lot 2 — Fiches et itinéraires sans API

- Ajouter ou harmoniser « Voir sur Google Maps » et « Y aller » aux endroits utiles, sans multiplier les boutons.
- Construire les Maps URLs officielles avec api=1 et URLSearchParams.
- Pour une fiche, préférer nom + adresse + ville à des coordonnées seules, qui peuvent ouvrir seulement un point sur la carte.
- Utiliser un Place ID uniquement s'il existe déjà et a une provenance vérifiée ; conserver les paramètres texte obligatoires. Ne pas ajouter une API de recherche pour obtenir ces identifiants.
- Garder les modes marche, voiture, transports, et le départ depuis l'activité précédente quand disponible. Sans départ explicite, laisser Google déterminer la position.
- Préserver le choix personnel Amap pour les actions d'itinéraire. Une action explicitement nommée Google ouvre Google.
- Conserver le texte d'origine et les coordonnées existantes. Un résultat de recherche n'est pas une identification certaine du lieu.
- Aucun scraping, extraction d'avis ou téléchargement de photos Google.

Terminé lorsque les liens ouvrent des recherches/itinéraires corrects pour des lieux français et chinois, avec et sans adresse, sans appel API ni clé.

## Lot 3 — Option de carte Google intégrée gratuite

Option facultative : Maps Embed API, dont l'usage est gratuit et illimité selon la documentation vérifiée le 17 octobre 2026. Une clé API reste nécessaire ; vérifier les prérequis du compte avant activation. Ne pas activer de produit payant.

Préparer uniquement si utile une petite carte d'un lieu, chargée sur action volontaire. Garder la carte Leaflet pour tous les marqueurs de la journée : un iframe Embed ne remplace pas sa synchronisation avec la liste.

Restreindre la clé au seul service Embed et aux domaines autorisés. Ne jamais injecter un iframe arbitraire fourni par un utilisateur : construire l'URL depuis un hôte et des paramètres autorisés. Prévoir titre accessible, chargement différé, état indisponible/hors ligne et lien externe de secours. Conserver les crédits Google.

Sans configuration disponible, laisser l'option désactivée et terminer les lots indépendants. Le propriétaire configure le compte et la clé s'il souhaite cette option. Ne pas promettre un accès séparé aux photos, avis ou notes via cet iframe.

Terminé lorsque la version sans clé est complète ; si l'option est réalisée, distinguer tests simulés et essai Embed réel.

## Lot 4 — Validation et livraison

Vérifier : encodage, lieux homonymes, adresse absente, paramètres de trajet, préférence Amap, quatre langues, clavier, mobile et zoom 200 %. Aucun nouveau appel réseau Google au démarrage : les liens n'envoient la recherche que lors du clic ; Embed seulement si activé et ouvert.

Conserver le fonctionnement hors ligne du carnet et les sauvegardes existantes. Le lien externe peut être préparé hors ligne sans prétendre que Google Maps sera accessible. Ne pas modifier le modèle de données sans nécessité ; si une référence facultative est ajoutée, tester anciens carnets, validation, export/restauration et droits de partage.

Exécuter les tests ciblés puis npm run verify:local selon le guide du dépôt. Rapporter les tests réellement exécutés et leurs limites. Aucun déploiement ni activation distante hors autorisation.

Compléter ce fichier avec le bilan et les limites, plutôt que créer plusieurs rapports. Retour arrière : retirer les nouvelles actions ou désactiver Embed ; la carte et les données actuelles restent utilisables.

## Limites et sources

Le coût Google API du parcours par liens est nul ; cela ne garantit pas la gratuité de tout l'hébergement ou des fournisseurs de tuiles du projet. Leurs conditions restent applicables.

- Maps URLs sans clé : https://developers.google.com/maps/documentation/urls/get-started
- Embed gratuit, clé requise : https://developers.google.com/maps/documentation/embed/usage-and-billing
- Comparaison des produits facturables, exclus de cette version : https://developers.google.com/maps/billing-and-pricing/pricing

Les avis et photos intégrés sur mesure ne font pas partie de cette version gratuite. Le lien Google permet de les consulter sur la fiche publique du lieu.

## Bilan d’implémentation — 17 octobre 2026

### Lot 1 — Inventaire et préservation

- Base partagée récupérée avec `git fetch origin codex/carnets-universels`. Branche dédiée : `codex/google-maps-links`, créée depuis le HEAD local `c1dd8a6` : il contient déjà la base partagée et les deux commits récents d’import. Aucun reset, stash, remplacement des travaux ni migration des carnets.
- Copie récupérable préalable : `C:/Users/eliot/Documents/detours-google-maps-snapshot-20261017` (sources Git suivies et non ignorées, manifeste d’empreintes et historique Git ; fichiers ignorés exclus).
- Usages inspectés : `maps.ts`, `lib.ts`, préférences personnelles, `MapActions`, `TripMap`, hébergements, transports, bonus et impression. Les accès des vues existantes passent déjà par `amapLink` ; ils bénéficient du même constructeur de recherche Google. Leaflet, WorldView, ressources locales et synchronisation liste/marqueurs restent en place.

### Lot 2 — Parcours livré dans le code local

- `lib.ts` centralise la recherche Google avec `api=1` et `URLSearchParams`. La requête contient nom local ou titre, adresse si présente, puis ville. Elle ne remplace plus une fiche par les seules coordonnées ; celles-ci restent disponibles pour les itinéraires et marqueurs. Les textes sources et les archives ne sont pas modifiés.
- Dans les actions du planning, Maintenant et les autres usages de `MapActions`, le lien explicite « Voir sur Google Maps » ouvre Google, même avec la préférence Amap. « Y aller » garde Amap si choisi (recherche de destination puis choix du trajet dans Amap, comme auparavant). Les autres liens génériques des vues conservent la préférence personnelle.
- Les modes marche, voiture et transports et le lien « De ce lieu au suivant » sont conservés. Un départ non renseigné est omis, sans géolocalisation demandée par Détours.
- Traduction du nouveau libellé en français, anglais, chinois simplifié et espagnol. Aucun Place ID vérifié n’existe dans le modèle inspecté : aucun identifiant ajouté, aucune recherche API, aucune migration du modèle.
- Correction de reflow limitée au badge de progression : retour à la ligne de ses traductions longues dans la règle mobile existante. La vérification à 640 px avait révélé un débordement anglais/espagnol lié à `white-space: nowrap`, indépendant du lien Google.

### Lot 3 — Option Embed non réalisée

Le parcours sans clé est complet sans iframe. L’option facultative Embed reste absente et désactivée : aucun paramètre de clé, SDK ou appel API ajouté. Il n’y a rien à configurer pour utiliser les liens Google et consulter les fiches externes. La documentation officielle Maps URLs a été relue pendant cette implémentation.

Si une carte Google intégrée est souhaitée ultérieurement, ce sera une extension distincte : vérifier les prérequis du compte dans la documentation Embed, activer uniquement Maps Embed API, créer une clé limitée à ce service et aux domaines autorisés, puis implémenter l’ouverture volontaire et son secours hors ligne. Ajouter une clé à cette version n’activera aucun iframe. Les photos, avis et notes ne sont pas récupérés dans Détours.

### Lot 4 — Validation exécutée et limites

- Tests ciblés : `node --test tests/maps.test.mjs tests/map-preferences.test.mjs tests/beta.test.mjs tests/now.test.mjs` : **28/28 réussis**. `npm run typecheck`, `npm run lint` et `git diff --check` réussis.
- Premier passage navigateur ciblé : 11 réussites et 4 échecs de reflow anglais/espagnol à 640 px. Cause identifiée dans le badge de progression ; le scénario anglais isolé puis tous les scénarios ont repassé après correction. Aucun échec restant dans le gate final.
- `npm run verify:local` avec `DETOURS_PGLITE_PATH` pointant vers `../detours-test-tools/node_modules/@electric-sql/pglite/dist` : **21/21 étapes réussies**, **186 tests unitaires**, **84 tests navigateur** (53 parcours retenus + 3 d’analyse simulée + 28 états/cartes/préférences). Types, lint, build, intégrité, SQL en mémoire et tous les smokes compilés réussis. Source inchangée pendant le gate, aucun contrôle obligatoire omis.
- Rapport complet local : `C:/Users/eliot/AppData/Local/Temp/detours-verify-7qq87W/validation.json`. Identité du build de validation : `bdc2c6eb00b552d248f21f275ea8ee08b76fb32bc5706bbda955886707d3bc57`. Ce `dist/` contient les paramètres de test factices du gate ; une éventuelle publication demande la préparation L8 avec la configuration cible.
- Preuves Google spécifiques : requêtes texte françaises et chinoises, accents et paramètres spéciaux, homonymes distingués par ville, adresse absente, coordonnées pour les trajets, trois modes, origine précédente et origine absente, Google explicite avec préférence Amap, liens Amap conservés. Navigateur : quatre langues, clavier (Tab et ouverture par Entrée), 320/390/640/1440 px, aucun appel Google au démarrage ni iframe, adresse et liens préparés hors ligne, archive source inchangée. Captures mobiles Google/français et Amap/anglais inspectées visuellement.
- Préservation vérifiée : comparaison des 408 fichiers du cliché initial, aucune modification inattendue hors des fichiers de ce lot. Les fichiers et tests de stress d’import déjà présents sont conservés. Exports/restaurations, import local, Leaflet/WorldView et rechargement hors ligne passent aussi dans le gate.

**Réellement exécuté :** application et build locaux, génération des URL, interactions clavier, exports téléchargés puis restaurés dans des profils Chrome isolés, stockage, cache et rechargement hors ligne. Le reflow à 640 CSS px représente un écran de 1280 px au zoom 200 % ; il ne constitue pas un essai physique iPhone/Safari ou de zoom natif sur chaque appareil.

**Simulé :** comptes, sessions, API distantes et fournisseur d’analyse du planning du gate ; panne réseau et coupures émulées dans les profils de test. Les clics Google sont interceptés et leur URL contrôlée sans contacter Google Maps. Le repère Louvre du smoke d’import est une démonstration explicite, pas une géolocalisation réelle. Le SQL est exécuté dans PGlite en mémoire, sans modification de Supabase distant.

**À vérifier en usage réel :** fiche effectivement trouvée par Google (un nom/adresse ne garantit pas l’identité d’un établissement), avis/photos disponibles, calcul d’itinéraire, localisation choisie par Google et ouverture dans les applications mobiles. Aucun essai Google Maps distant, Embed réel, OAuth réel ou appareil physique revendiqué.

**Configuration du propriétaire :** aucune pour les liens Google livrés ici. Pour consulter un lieu, cliquer « Voir sur Google Maps » ; pour les trajets, garder Google ou choisir Amap dans les préférences personnelles. Embed reste une extension facultative non implémentée. Aucun déploiement, activation de produit Google, migration distante, fusion ni modification des adresses Vercel effectué.

**Retour arrière :** reprendre dans le cliché préalable les seuls fichiers de ce lot (`lib.ts`, `maps.ts`, `MapActions.tsx`, dictionnaire `now.ts`, règle `.progress-chip` et tests correspondants), en conservant les autres travaux. Aucun changement de données ni conversion d’archive à annuler ; Leaflet reste la carte du carnet.

### Publication d’essai autorisée — 17 octobre 2026

Après la demande explicite « je te fais confiance tu le déploies ? », version publiée en **preview isolée**, état **READY**, dans le projet Vercel existant `app-vacances-27` (`prj_GdllwjlfvjDogyKdH2ABRJay350a`), équipe `eliottle`.

- Déploiement : `dpl_4VULhYugdxK56o5Ra3nXwkZKRabK`, URL `https://app-vacances-27-lunmh8hn2-eliottle.vercel.app/`. Un lien d’accès temporaire de sept jours est remis dans la conversation ; il expire le **24 octobre 2026 à 02:34, heure de Chine**. Son paramètre d’accès n’est pas consigné dans Git.
- Candidat reconstruit par `prepare-l8-release.mjs` depuis la source validée, avec la configuration réelle du frontend : build `aebe0ea229587f5d7a36e51d59966d2df70533b0d8e21686d117ece66c31041d`. Backend cible confirmé, absence du backend factice vérifiée sans publier de clé. Seuls les fichiers compilés ont été envoyés, avec les en-têtes de cache du worker ; aucun fichier `.env`, export personnel ou source de recherche du dépôt envoyé.
- La bêta existante pointe sur `dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS` (commit `14a96ec`). L’inspection distante et Git a révélé qu’elle contient aussi des évolutions notifications/mobile absentes de cette branche. Son alias est donc conservé et a été relu après publication : aucune de ces évolutions remplacée. Cette preview sert à essayer le lot Google et les imports locaux de cette branche ; elle ne constitue pas une intégration de toutes les branches publiées.
- Contrôle L8 sur le candidat réel réussi avant envoi : modules différés, hors ligne, notes/rechargement et invalidation multi-onglets, avec comptes/permissions simulés.
- Contrôle sur l’URL déployée : **25 fichiers** comparés au candidat par taille et SHA-256, HTML et worker compris ; recherche Google par nom/adresse/ville, trois modes, origine absente et trajet vers le suivant, Google explicite avec préférence Amap, 320/390/640/1440 px, cache prêt puis rechargement hors ligne et archive locale inchangée. **Zéro erreur d’exécution**. Capture mobile inspectée. Profil Chrome jetable et carnet fictif local ; aucun carnet personnel ni compte réel ouvert.
- Un premier essai du script de contrôle a attendu une entrée de navigation masquée en vue mobile ; le script a été corrigé pour ouvrir cette vue avec la navigation de bureau, puis le contrôle entier a réussi. Le rapport préliminaire est conservé séparément.
- Preuves hors dépôt : `C:/Users/eliot/Documents/detours-release-20261017-google-maps/release.json`, `published-verification.json` et `published-390.png`. Le rapport de validation locale complet reste celui consigné ci-dessus. Aucune modification du code produit après le gate.

Pour essayer : ouvrir le lien de la conversation, choisir **Ajouter l’exemple Chine** ou importer une copie d’un carnet, puis utiliser **Voir sur Google Maps** / **Y aller** dans une activité. Les carnets locaux sont rattachés à leur adresse du site : ceux de la bêta n’apparaissent pas automatiquement sur la preview. Aucune clé Google n’est demandée. Les fiches/itinéraires Google réels et OAuth restent à essayer par le propriétaire ; les contrôles n’ont pas contacté Google Maps.

Retour arrière de cette publication : révoquer le seul lien d’essai ou retirer cette preview dans Vercel. L’alias de la bêta, ses déploiements précédents, les données et les protections générales du projet ont été conservés. Aucun commit/push, fusion, migration distante ou activation d’API Google effectué.

### Ajustement mobile — trajet replié par défaut, 17 octobre 2026

À la demande du propriétaire après essai de la preview : les options de trajet prennent trop de place dans chaque activité. `MapActions` conserve le lien Google explicite et la copie d’adresse, puis affiche un seul bouton « Calculer un trajet » avec chevron. Le panneau est fermé à l’ouverture de la vue, pour Google comme pour Amap.

Un toucher, Entrée ou Espace ouvre les options. Marche/voiture/transports, « Y aller » et le trajet vers l’étape suivante restent disponibles. Échap referme et rend le focus au déclencheur ; le mode choisi reste sélectionné lors d’une réouverture. Le composant natif `details`/`summary` porte l’état ouvert/fermé pour les outils d’accessibilité. Les cibles tactiles conservent au moins 44 px.

Le grand encadré et les deux paragraphes d’aide n’occupent plus l’état fermé. La phrase expliquant que le mode concerne le trajet est retirée ; l’information sur Internet est dans le panneau ouvert. Amap conserve son lien et son explication spécifiques. Aucun nouveau texte à traduire, aucune dépendance, aucun changement de données ou de constructeur d’URL.

Copie récupérable de l’état juste avant cet ajustement : `C:/Users/eliot/Documents/detours-google-maps-before-compact-20261017` (409 fichiers et historique Git). Comparaison des fichiers : aucune modification inattendue hors composant/style, tests concernés et présent bilan. Les nouveaux scénarios vérifient l’état fermé, ouverture/fermeture clavier, focus, conservation du mode et ouverture hors ligne dans les quatre langues avec Google/Amap, à 320/390/640/1440 px.

Retour du propriétaire pendant les vérifications : le déclencheur encadré paraît encore trop gros sur mobile et sur ordinateur. **Aucune nouvelle publication de cet ajustement** : le code est conservé comme brouillon local. Trois propositions interactives sont préparées dans la conversation (« Liens discrets », « Action unique », « Adresse active »), avant de retenir une nouvelle présentation.

Vérification du brouillon local terminée : `verify:local` **21/21 étapes réussies**, 186 tests unitaires et 84 tests navigateur, source inchangée. Rapport : `C:/Users/eliot/AppData/Local/Temp/detours-verify-tf69oJ/validation.json`, build de validation `e4d7865e275cb9fa85001cf0ec1aec91ed5cfaa5a03ddbec9a23aeb2593f1cf5`. Un premier scénario ciblé avait détecté la perte du nom accessible exact du sélecteur ; son libellé explicite a été rétabli avant le gate complet. Ces résultats techniques ne signifient pas que cette présentation visuelle a été acceptée. Les trois propositions dans la conversation ont été essayées à 360 et 780 px, avec menus fonctionnels et sans débordement ni erreur JavaScript ; elles ne modifient pas l’application.

### Présentation retenue — adresse active, copie à droite

Le propriétaire choisit « Adresse active » en demandant la copie d’adresse à droite, sur la même ligne, hors du menu. `MapActions` affiche désormais une seule ligne sans encadré : repère/adresse/chevron, puis bouton de copie transparent à son extrémité droite. Une adresse longue se replie dans sa colonne sans déplacer la copie ; en l’absence d’adresse, le nom local ou le titre sert de déclencheur de recherche.

Le menu contient « Voir sur Google Maps » et les trois accès directs à pied/voiture/transports. Un sous-panneau pour l’étape suivante conserve les trois modes et le départ depuis l’activité courante. Avec la préférence Amap, les itinéraires restent dans Amap et le lien explicitement nommé Google reste Google. Le champ de sélection et le bouton de trajet encadré sont retirés.

La copie reste accessible menu fermé, recopie le même texte source qu’avant, affiche une coche et annonce la réussite ; si elle échoue, le texte reste sélectionnable. Entrée/Espace ouvrent le menu, Échap referme et rend le focus, le changement de focus vers l’extérieur referme. Le groupe natif de panneaux garde un seul menu de lieu ouvert. Les surfaces de contact restent de 44 px, tout en gardant les icônes et l’adresse visuellement légères.

L’adresse répétée a été retirée des seuls appels de `MapActions` dans le planning, Maintenant et l’affichage partagé. Aucun retrait des adresses des hébergements ou de la carte « À montrer ». La nouvelle formulation accessible « Actions pour {name} » est traduite dans les quatre langues. Revue React : aucun nouvel effet, écouteur global, dépendance ou état persistant ; seuls les états de copie locaux restent nécessaires.

Copie de récupération avant intégration : `C:/Users/eliot/Documents/detours-before-active-address-20261017`. Comparaison des 409 fichiers : aucune modification inattendue. Tests ciblés réussis : 19 scénarios cartes/préférences/Maintenant, puis 15 cartes/préférences après ajustement de la priorité CSS de la grille, 9 tests unitaires ciblés, types et lint. Les assertions contrôlent aussi la copie sur la même ligne, son alignement au bord droit, son fonctionnement réel dans le presse-papiers sans ouvrir le menu et l’absence d’adresse en double.

**Validation finale :** `verify:local` **21/21 étapes réussies**, 186 tests unitaires, 84 tests navigateur, source inchangée, aucune étape omise. Rapport : `C:/Users/eliot/AppData/Local/Temp/detours-verify-Zw0owW/validation.json`. Build de test factice : `9c05533de85735611f4462174e2ad6adf80dbe9723fe6a945969b3f6fe7e0c28`.

**Version d’essai publiée et vérifiée :** `dpl_HsCdpaD7JZz5PSyCYTF9w4fHB11h`, état READY, URL `https://app-vacances-27-1ld7dbkjd-eliottle.vercel.app/`. L’accès de sept jours est remis dans la conversation et expire le 24 octobre 2026 à 03:07, heure de Chine ; son paramètre ne figure pas dans Git. Le candidat a été reconstruit avec la configuration cible après comparaison de l’empreinte validée : build `2d13bb4025fa9396bdb5f38540b9ffa2f876b1cc7201ad4cea6eb048b46ba360`. Backend attendu confirmé et backend factice absent, sans afficher de clé. Contrôle L8 compilé sur ce candidat réussi avant envoi.

Sur le site déployé : **25 fichiers** servis comparés par taille et SHA-256, menu d’adresse fermé au départ, copie réelle hors menu au bord droit de la ligne, trois modes actuels et vers le suivant, Échap/focus, Google explicite et Amap, captures 390 px et ordinateur, 320/390/640/1440 px sans débordement, préparation puis rechargement hors ligne avec archive inchangée ; zéro erreur d’exécution. Capture mobile relue. Un premier passage du script de vérification avait oublié de rouvrir le menu après rechargement avant de rechercher son lien Amap : script corrigé et contrôle entier repassé, rapport préliminaire conservé. Aucun changement du code produit après le gate.

Preuves : `C:/Users/eliot/Documents/detours-release-20261017-active-address/release.json`, `published-verification.json`, `published-390.png`, `published-expanded-390.png`, `published-desktop.png`. Les essais utilisent un profil Chrome jetable et un carnet fictif local ; comptes distants, appels Google Maps réels et appareils physiques ne sont pas validés. La bêta principale reste sur `dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS` et a été relue après publication. Le déploiement d’essai précédent est également conservé. Aucune fusion, migration distante ou activation d’API Google.
