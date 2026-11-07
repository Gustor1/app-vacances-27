# Détours — Recherche et comparaison d’une nouvelle typographie

Préparé le **28 octobre 2026**. Mission indépendante du [plan d’audit global](PLAN-AUDIT-GLOBAL.md). La préparation de ce document comprend une lecture ciblée des styles et une première recherche de familles ; **aucune police du site n’a été changée et aucun comparatif visuel n’a encore été réalisé**.

## Mission à donner à l’IA

> Cherche une typographie qui donne davantage de personnalité à Détours tout en restant confortable sur téléphone. Lis ce plan et les instructions du dépôt. Vérifie la typographie réellement affichée, approfondis la sélection et prépare trois variantes visuelles avec les mêmes écrans et contenus, plus la version actuelle comme témoin. Utilise les skills indiqués et des sources officielles pour les polices. Livre un comparatif consultable, des captures et une recommandation argumentée. Travaille dans un prototype isolé avec des données fictives ; conserve l’application actuelle. Arrête-toi au choix à présenter à Eliot : aucune intégration définitive ni publication avant ce choix.

## Direction et contraintes

Détours est un carnet de voyage : préparer un programme, retrouver une adresse ou une réservation, suivre une journée et conserver ses souvenirs. La typographie doit servir cette utilisation et donner une identité accueillante, personnelle et soignée.

- Budget de licence : **gratuit**, sans abonnement ; vérifier les conditions exactes des fichiers retenus, y compris diffusion web, auto-hébergement et conservation des notices.
- Une famille pour l’interface peut suffire. Deux familles maximum si les titres apportent un contraste utile ; les polices de repli multilingues ne comptent pas comme des directions graphiques supplémentaires.
- Français, anglais, espagnol et chinois simplifié restent utilisables. Une police latine ne résout pas à elle seule la typographie chinoise.
- Conserver palettes, mascottes, logo existant, effets, structure et fonctions dans le comparatif. Adapter uniquement famille, graisse, taille, interligne et espacement nécessaires à la comparaison.
- Donner la priorité aux horaires, adresses, formulaires et lecture mobile. Une belle couverture ne compense pas un programme difficile à lire.
- Pas de nouvelle préférence permanente de choix des polices demandée : le sélecteur de variantes appartient à l’atelier de comparaison.

## Premières pistes à explorer

Les qualificatifs ci-dessous sont des **intentions de design**, pas des résultats de tests sur Détours. Les dépôts officiels consultés le 28 octobre 2026 présentent ces familles sous licence OFL ; vérifier la licence et la version du fichier effectivement téléchargé lors du prototype.

| Variante | Familles et rôles proposés | Intention | Point de vigilance |
|---|---|---|---|
| **A — Clair et chaleureux** | **Figtree** pour corps, menus, boutons et titres ; hiérarchie par taille/graisse | Une seule famille simple, un peu plus personnelle que la police système. **Première piste recommandée à tester.** | La différence avec l’existant peut être subtile ; juger les petits textes et les chiffres. |
| **B — Carnet de voyage** | **Source Sans 3** pour l’interface ; **Lora** pour titres de voyage et de journée | Donner une touche éditoriale aux souvenirs et aux destinations, avec des contrôles sobres | Réserver Lora aux titres ; éviter de transformer boutons, montants et navigation en page de roman. |
| **C — Compagnon expressif** | **Source Sans 3** pour l’interface ; **Bricolage Grotesque** pour quelques grands titres | Une personnalité plus joueuse, à confronter au ton de Pico et à l’identité Détours | Garder les petits titres fonctionnels sobres ; vérifier largeur, accents et longues destinations. |
| **Témoin** | Typographie réellement rendue aujourd’hui | Permettre aussi de décider que l’existant reste préférable | Ne pas présenter DM Sans/Manrope comme le témoin sans vérifier leur rendu effectif. |

Sources de départ : [Figtree — créateur](https://github.com/erikdkennedy/figtree), [Source Sans — Adobe](https://github.com/adobe-fonts/source-sans), [Lora — Cyreal](https://github.com/cyrealtype/Lora-Cyrillic), [Bricolage Grotesque — Atelier Triay](https://github.com/ateliertriay/bricolage). Les fichiers de licence sont disponibles dans ces dépôts. Ne pas copier des polices depuis un site commercial ou un agrégateur à provenance incertaine.

Étudier au maximum **six familles** avant de sélectionner les trois directions. Il est permis de remplacer une candidate si sa couverture, son rendu ou son poids ne convient pas ; expliquer la décision. La popularité d’une police ne démontre ni son adéquation ni son caractère « trop IA ».

## 1. Établir le témoin et préserver le projet

**Skills :** `concise-planning`, `verify-and-stop`.

- [ ] Lire `AGENTS.md`, `README.md` et le guide de collaboration ; relever branche, SHA et changements présents. Préserver notamment les autres plans et travaux non suivis.
- [ ] Créer une branche de recherche dédiée selon le guide, en conservant les implémentations récentes. Prévoir un prototype autonome ou un worktree isolé ; ne pas altérer le site actuel pour créer le comparatif.
- [ ] Ouvrir l’application dans un profil de test et relever, sur corps, titre, bouton et champ : famille calculée, police effectivement utilisée si l’outil le permet, taille, graisse, interligne et espacement. Vérifier les requêtes de polices ; `font-family` seul ne prouve pas qu’un fichier a été chargé.
- [ ] Capturer le témoin sur accueil, journée et aperçu d’import. Relever navigateur/système, langue, taille d’écran et thème. L’aspect d’une pile système peut varier d’un appareil à l’autre.

### Repères issus de la lecture du code, à confirmer au démarrage

- `src/main.tsx:11–13` charge successivement `styles.css`, `theme.css`, `apple-design.css`.
- `src/styles.css:1` déclare DM Sans Variable et Manrope Variable. Ces packages figurent dans `package.json`, mais aucun chargement Fontsource/`@font-face` n’a été repéré dans les entrées examinées. **Une dépendance installée ne signifie pas une police affichée.**
- `src/apple-design.css:3–7` donne priorité à `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` ; les titres, marque et statistiques héritent aussi de cette famille aux lignes 76–81. Modifier seulement l’ancienne déclaration peut n’avoir aucun effet.
- Les poids actuels comprennent des valeurs comme 650/750/800 ; `font-synthesis: none` est déclaré dans les anciens styles. Vérifier les graisses réelles ou axes disponibles, sans supposer que tous les fichiers les couvrent.
- `src/i18n.tsx` applique la langue au document ; aucune pile chinoise dédiée n’a été repérée dans les styles examinés. Vérifier le mélange chinois/latin/chiffres sur les systèmes testés.
- `src/components/TripOverview.tsx` et `src/components/Souvenirs.css` ont leurs propres styles d’impression. Un changement de police de l’interface ne garantit pas leur harmonisation.

**Fin de l’étape :** état initial documenté, captures du témoin et prototype isolé préparé. Aucun diagnostic global de l’application n’est demandé.

## 2. Rechercher et qualifier les candidates

**Skill :** `frontend-design`.

- [ ] Consulter les spécimens et dépôts des créateurs ; utiliser Google Fonts/Fontsource comme moyens de distribution vérifiés si adaptés. Lire les conditions de la version choisie.
- [ ] Pour chaque candidate, noter : nom exact, créateur, source, version/commit, licence, styles, axes variables, formats web, couverture de caractères et poids des fichiers utiles.
- [ ] Vérifier accents français/espagnols, chiffres, symboles monétaires et ponctuation. Ne pas remplacer les accents ou caractères manquants pour faire réussir le comparatif.
- [ ] Définir les rôles : corps, titres, menus, champs, données chiffrées. Garder une famille lisible pour les textes denses ; justifier toute seconde famille.
- [ ] Sélectionner trois directions distinctes et expliquer les candidats écartés. Ne pas télécharger toute une bibliothèque de polices.

**Fin de l’étape :** tableau sourcé des candidates et des trois variantes retenues, avec fichiers de licence préservés pour les assets utilisés.

## 3. Définir la hiérarchie typographique

**Skills :** `frontend-design`, `web-design-guidelines`.

- [ ] Définir dans le prototype des rôles explicites (`--font-ui`, `--font-heading`) et une petite échelle de tailles/graisses/interlignes. Prévoir de vrais styles pour les noms de lieux, horaires, montants, notes et boutons.
- [ ] Comparer d’abord à tailles et mises en page identiques, puis produire les ajustements optiques nécessaires pour chaque variante. Documenter ces ajustements afin qu’une police ne paraisse meilleure uniquement parce que ses textes ont été agrandis.
- [ ] Prendre comme point de départ un corps et des champs autour de 16 px sur mobile, interligne de lecture autour de 1,5 ; ajuster sur le contenu réel. Préserver le zoom et le redimensionnement du texte, et vérifier séparément la réaction du clavier Safari sur appareil physique.
- [ ] Tester chiffres alignés dans les budgets/horaires lorsque la famille le permet, distinction `I/l/1`, `O/0`, €/$/¥/￥ et séparateurs de dates. Éviter les espaces de lettres serrés qui dégradent les petits textes ou le chinois.
- [ ] Définir une pile de repli adaptée aux plateformes. Pour le chinois, vérifier les glyphes effectivement rendus et l’équilibre avec le latin ; ne pas charger une famille CJK complète de plusieurs mégaoctets sans nécessité mesurée.

**Fin de l’étape :** une fiche typographique par variante, avec exemples et règles de repli, sans nouveau thème de couleurs.

## 4. Construire un comparatif sur les vrais usages

**Skills :** `frontend-design`, `product-design:audit` pour la capture et la comparaison des parcours, en suivant ses références préalables.

- [ ] Créer un atelier local dans `prototypes/typographie/` ou un checkout isolé. Réutiliser les vrais composants et styles lorsque possible ; si certains écrans sont reproduits, signaler leurs écarts et ne pas les présenter comme preuve d’intégration.
- [ ] Prévoir un basculement témoin/A/B/C conservant écran, texte, dimensions et thème. Montrer les variantes côte à côte sur bureau et successivement sur téléphone.
- [ ] Couvrir au minimum : accueil et carte de voyage ; journée dense avec horaires/adresses ; fenêtre d’édition ; aperçu d’import avec avertissement ; préférences et menu mascotte. Inclure aperçu imprimé si les titres de carnet sont concernés.
- [ ] Garder couleurs, images, icônes et espacements des blocs stables pour que le jugement porte sur la typographie. Aucun nouveau hero, carte ou animation pour rendre une variante artificiellement séduisante.
- [ ] Capturer les mêmes trois écrans représentatifs pour chaque variante et le témoin, sur mobile et bureau ; sauvegarder et inspecter les captures réellement obtenues.

Corpus fictif commun à utiliser, en plus des libellés traduits existants :

```text
Détours — Mes voyages
Une journée à Hong Kong
À découvrir près d’ici
09:05 → 10:35 · 1 h 30 · 12,50 € · ¥ 128
Réservation à vérifier — n° AB0I1L
Hébergement : Maison de l’île, deuxième étage
São Paulo · Málaga · L’Haÿ-les-Roses · Xi’an
É À Ç Œ œ é è ê ë î ï ô ù û ü ÿ ñ ¿Qué hacer mañana?
Tomorrow’s programme — Saved on this device
明天的行程 · 香港 · 北京南站 · 09:05 · ¥128
Une très longue activité dont le nom doit rester lisible sur plusieurs lignes
```

**Fin de l’étape :** atelier consultable et captures comparables, avec indication de ce qui fonctionne réellement et de ce qui est seulement maquetté.

## 5. Vérifier lisibilité, langues, poids et hors-ligne

**Skills :** `web-design-guidelines`, `vercel-react-best-practices`, `verify-and-stop`.

- [ ] Tester 320/390/430 px et bureau, clair/sombre et palettes contrastées ; couvrir les quatre langues, longues traductions, texte agrandi à 200 % et retours à la ligne. Aucun texte ni contrôle indispensable ne doit devenir inaccessible.
- [ ] Tester les menus étroits, montants, marqueurs de carte et titres sur plusieurs lignes. Vérifier la stabilité des zones cliquables, fenêtres et menu de la mascotte après chargement des polices.
- [ ] Comparer texte avant/après chargement, réseau lent, fichier de police indisponible et rechargement hors ligne. Conserver des textes lisibles avec les polices de repli ; mesurer les déplacements de contenu causés par les polices.
- [ ] Employer des fichiers WOFF2 locaux si disponibles et autorisés, uniquement les styles nécessaires. Définir une stratégie de `font-display` et de préchargement limitée aux fichiers indispensables ; aucun appel obligatoire à un CDN de polices pour utiliser l’app.
- [ ] Mesurer poids réellement servi et précaché, nombre de requêtes et impact initial. Objectif indicatif : au plus **200 Kio de nouvelles polices latines utiles au premier écran**, à justifier si dépassé ; ce budget est une cible de comparaison, pas une mesure déjà obtenue. Comparer variable et statique au lieu de supposer que variable est toujours plus léger.
- [ ] Vérifier les licences et notices du sous-ensemble réellement distribué. Si les caractères manquent, corriger la distribution ou éliminer la candidate ; ne pas compter sur un réseau externe silencieux.
- [ ] Identifier les essais encore nécessaires sur iPhone physique/Safari installé et Windows. Une émulation mobile n’établit pas le rendu exact des polices système du téléphone.

Une famille sans licence exploitable, avec caractères essentiels absents sans repli acceptable, ou cassant un parcours essentiel est éliminée avant le classement esthétique.

**Fin de l’étape :** mesures et défauts documentés pour chaque variante, avec distinction test local / appareil réel / non vérifié. Pas de gate global de l’application exigé pour un atelier isolé sans modification produit ; ses contrôles propres doivent réellement fonctionner.

## 6. Présenter une recommandation et obtenir le choix

**Skills :** `concise-planning`, `verify-and-stop`.

Évaluer les variantes sur les mêmes critères : lisibilité et usage mobile **35 %**, personnalité adaptée à Détours **25 %**, quatre langues **15 %**, performances et hors-ligne **15 %**, cohérence entre écrans **10 %**. Justifier les notes ; une préférence esthétique reste une préférence, pas une preuve objective.

Livrer dans `docs/design/typographie/` (ou emplacement conforme aux conventions actuelles) :

1. `COMPARATIF.md` : témoin, trois directions, captures, sources/licences, mesures, avantages et réserves.
2. Le lien ou les instructions de lancement de l’atelier local ; pas uniquement des noms de polices ou des images de spécimens.
3. `RECOMMANDATION.md` : une favorite argumentée, une alternative, raisons d’écarter la troisième et éventuelle raison de garder l’existant.
4. `PLAN-INTEGRATION.md` : fichiers visés, tokens/cascade CSS, poids et repli, licences, cache PWA, impression, tests et retour arrière ; ce plan reste à exécuter après le choix.

Conserver les captures utiles, pas des dizaines de duplications. Terminer par une question concrète à Eliot : **« Tu préfères le témoin, A, B ou C sur ces écrans ? »** La recherche et les prototypes avancent sans validations intermédiaires inutiles ; le choix visuel final précède l’intégration.

## Après le choix : ce que devra couvrir l’intégration

Cette phase n’est **pas** incluse dans la mission de recherche. Une fois la direction validée : modifier la source de vérité des styles plutôt qu’empiler des sélecteurs de plus en plus prioritaires ; vérifier les styles chargés tardivement ; charger seulement les fichiers retenus et leurs licences ; adapter les graisses aux vrais fichiers ; contrôler les formulaires, textes chinois et impressions ; vérifier la mise à jour de la PWA et la lecture hors ligne.

Les anciennes dépendances de polices ne pourront être retirées qu’après vérification de leur absence d’usage. L’intégration suivra `AGENTS.md`, les tests ciblés puis `npm run verify:local` ; rapporter les résultats réels. Le build factice du gate n’est pas à publier. Aucune publication n’est incluse par défaut.

## Skills disponibles pour cette mission

Lire chaque `SKILL.md` au moment de l’utiliser ; retrouver son nom si le chemin de cache a changé.

| Skill | Rôle |
|---|---|
| [frontend-design](C:/Users/eliot/.codex/skills/frontend-design/SKILL.md) | Direction typographique, choix intentionnels, hiérarchie et prototypes. |
| [concise-planning](C:/Users/eliot/.codex/skills/concise-planning/SKILL.md) | Périmètre et plan d’intégration borné. |
| [web-design-guidelines](C:/Users/eliot/.codex/skills/web-design-guidelines/SKILL.md) | Lecture, reflow, formulaires et interactions ; consulter ses règles à l’exécution. |
| [product-design:audit](C:/Users/eliot/.codex/plugins/cache/openai-curated-remote/product-design/0.1.56/skills/audit/SKILL.md) | Comparaison des mêmes parcours avec captures récentes et limites explicites. |
| [vercel-react-best-practices](C:/Users/eliot/.codex/skills/react-best-practices/SKILL.md) | Chargement et coût du prototype ; appliquer seulement les règles pertinentes pour React/Vite. |
| [verify-and-stop](C:/Users/eliot/.codex/skills/verify-and-stop/SKILL.md) | Contrôles proportionnés et arrêt au choix utilisateur. |

## Complément utile au futur audit : tester avec trois proches

En parallèle de cette recherche, proposer à Eliot une courte séance avec **trois proches qui découvrent l’app**, sans modifier le plan d’audit ni les contacter automatiquement. Leur faire réaliser trois tâches sans guider les clics : créer un carnet depuis un petit planning, retrouver l’activité/adresse du moment et expliquer comment récupérer leurs données sur un autre appareil.

Noter où ils hésitent, les libellés incompris et les actions introuvables. Montrer ensuite les variantes typographiques sur les mêmes écrans et demander ce qui se lit le mieux, en plus de ce qui plaît. Trois personnes ne constituent pas une étude représentative ; leurs difficultés peuvent néanmoins orienter des améliorations concrètes.

Autres pistes à examiner après l’audit : cohérence des noms et icônes d’actions, importance visuelle des informations du jour, clarté des états vide/chargement/erreur. Commencer par ces points avant d’ajouter davantage de réglages ou de fonctionnalités.
