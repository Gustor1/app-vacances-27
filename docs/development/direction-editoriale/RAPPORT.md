# Détours : un carnet d'éditeur

Intervention frontend du 1 novembre 2026, branche `codex/detours-direction-editoriale`, copie de travail `C:/Users/eliot/Documents/detours-design`. La mission jointe décrivait une console d'agents ; l'utilisateur a explicitement demandé son adaptation à Détours. V2/V3/Atelier V4 ne sont pas des vues de ce dépôt.

## Direction retenue

Trois pistes ont été examinées : console de terrain, album photographique et carnet d'éditeur. La première conservait trop de vocabulaire dashboard ; la deuxième donnait trop de place à l'image dans les tâches pratiques. Le carnet d'éditeur permet de distinguer le récit, les repères et le travail quotidien avec les ressources déjà présentes.

Newsreader garde les titres éditoriaux ; Hanken Grotesk garde les actions, les données et les noms d'activités. Les palettes personnelles et leurs ajustements de contraste restent les sources des couleurs. Les couvertures et les photographies conservent un rôle visuel réel ; les contenus techniques deviennent plus sobres.

## Ce que les captures ont montré

| Observation | Effet | Décision |
| --- | --- | --- |
| Un seul voyage enfermé dans une colonne étroite à 1280 px | L'espace libre domine le carnet | Premier carnet en composition horizontale pleine largeur ; suivants en grille |
| Cartes répétées autour des voyages, du statut local, de l'import et des sauvegardes | Informations secondaires aussi présentes que le contenu principal | Sections et filets, statut local plus discret |
| Pilules, fonds et ombres répétés dans la navigation | Repères interchangeables | Onglets soulignés, repère latéral dans le carnet, barre mobile pleine largeur |
| Cartes dans une carte pour préparer une journée et garder un souvenir | Encadrements sans hiérarchie utile | Rubriques dépliables séparées par des filets, contrôles existants conservés |

Comparaison avec un carnet fictif, sans données personnelles : [avant](captures/collection-avant.png), [après](captures/collection-apres.png), [accueil mobile](captures/accueil-mobile.png), [carnet sombre mobile](captures/carnet-mobile-sombre.png).

## Implémentation et règles

Les changements produit sont limités aux deux feuilles propriétaires `src/apple-design.css` et `src/components/TravelDelight.css`. Aucun changement React, gestionnaire d'action, chaîne traduite, contrat de formulaire, format de données, API ou droit serveur.

- Collection : introduction plus éditoriale, actions regroupées, couverture et corps du premier carnet côte à côte à partir de 761 px, une colonne sur téléphone, titres personnels pouvant revenir à la ligne.
- Navigation : chrome opaque, sélection lisible sans halo ; moteur existant de positionnement conservé, y compris toucher et mouvement réduit.
- Planning et vue d'ensemble : titres de journée, filets, encadrements réservés aux groupes qui le justifient ; dates et actions conservées.
- Outils, carnet pratique, préférences, modales et panneaux : mêmes familles de rayons et de contrôles. Ombres réservées aux éléments flottants. Les souvenirs gardent leurs gestes et leur présentation photographique.
- Suppression du scintillement du logo et de la couche de verre décorative sur les aperçus d'étapes. Aucun nouvel asset, police ou paquet.

| Rôle | Variable | Valeur / source |
| --- | --- | --- |
| Contrôle | `--radius-control` | 6 px |
| Groupe de contenu | `--radius-panel` | 10 px |
| Fenêtre flottante | `--radius-overlay` | 16 px |
| Espacement de rangée | `--space-row` | 0,75 rem |
| Espacement de groupe | `--space-panel` | 1,5 rem |
| Espacement de section | `--space-section` | 2,5 rem |
| Retour visuel | `--motion-feedback` | 120 ms, couleur/fond |
| Révélation | `--motion-reveal`, `--ease-reveal` | 220 ms, courbe de sortie |
| Fond et texte | `--surface`, `--surface-alt`, `--text`, `--muted` | Catalogue existant `src/palettes.ts` |
| Action et sélection | `--action`, `--on-action`, `--selected-surface`, `--focus` | Catalogue existant et contraste calculé |

Ces rayons remplacent des valeurs intentionnellement différentes, ce ne sont pas des substitutions à rendu identique. Le mouvement réduit neutralise toujours les transitions et conserve les contrôles.

La revue a aussi corrigé trois problèmes de cascade : un sélecteur `:is()` mélangeant des alternatives de spécificités différentes rétablissait des fonds non désirés ; une ancienne règle de bordure effaçait le soulignement de l'onglet actif ; la largeur historique du bouton d'export coupait son texte à 768 px. Les corrections se trouvent aux règles propriétaires, sans nouvelle feuille de surcharge.

## Skills

- `design-system-boss` : cadrage, séparation de l'écriture frontend et de la revue indépendante.
- `build-design-system` : inventaire, variables sémantiques et captures avant/après.
- `token-mapping` : correspondance ciblée des rôles ; pas d'affirmation de suppression de tous les littéraux de l'application.
- `ui-review` : critique des rendus, clavier, largeurs intermédiaires et revue après correction.
- `component-docs` : [indicateur de sélection](../../system/GlassSelection.md), documenté depuis les sources et ses usages.
- `migrate-design-system` : leçons sur la cascade, les chaînes métier, la capture isolée et la mesure des contrôles. Pas de migration de bibliothèque ni de nouveau système parallèle.
- `stageshow` lu : workflow de faux UI écarté, car la mission demande le produit réel.
- `swiftui-microinteractions` lu : inspiration pour un retour immédiat et des gestes causaux ; aucune introduction de SwiftUI ou d'haptique web.
- `systematic-debugging` : analyse de la trace du test d'en-tête, reproduction minimale de sa conversion de couleur et correction à la source du test.

Le protocole des skills est adapté au mandat explicite de refonte : pas de proposition arrêtée avant implémentation, de remplacement exhaustif des composants ou d'installation d'un checker universel. L'inventaire exploratoire reste un diagnostic, avec de nombreuses exceptions historiques, et non un contrôle de conformité réussi.

## Validation

Les 36 captures de référence ont été prises avant modification, puis les 36 captures finales à 390 et 1280 px, clair/sombre : accueil vide, création, collection, planning, vue d'ensemble, pratique, outils, Maintenant, bonus. Arbres d'accessibilité et mesures de débordement accompagnent chaque capture dans le dossier local ignoré `.design-system/captures/`. Aucune de ces captures finales ne déborde horizontalement.

Les navigateurs utilisent des profils jetables, des carnets fictifs et bloquent les requêtes externes. Le serveur de prévisualisation est local et sans configuration de compte ; les tests du gate emploient la configuration factice officielle.

La revue indépendante a contrôlé les titres longs à 320, 390, 768, 1280 et 1920 px, le focus visible au clavier, le confinement du focus et son retour après fermeture, les onglets et le mouvement réduit. Le cas à 768 px passe après correction : document 768 px ; bouton d'export largeur utile et largeur de contenu égales à 159 px.

| Contrôle exécuté | Résultat |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Réussis |
| `npm test` avec les fixtures aux octets Git canoniques | 336 réussis |
| Tests ciblés `editorial-ui` + `travel-delight` | 14 réussis pendant la finalisation |
| `editorial-ui` final, incluant le cas tablette | 4 réussis, quatre langues, cinq largeurs |
| `iphone-glass` après comparaison directe de couleur | 2 réussis |
| Revue indépendante et captures finales | Aucun défaut bloquant relevé sur les surfaces examinées |
| Premier gate complet | 9 étapes réussies ; échec du test historique de conversion de couleur à l'étape 10 ; 25 étapes non exécutées |
| Seconde exécution du gate | Interrompue à la demande de l'utilisateur après 90 scénarios navigateur réussis dans l'étape en cours ; aucun succès global revendiqué |

Deux tentatives du nouveau test matriciel ont rencontré sa durée limite initiale, puis deux lancements ciblés ont partagé un dossier de traces. Le test de 15 navigations par langue dispose désormais de son budget propre ; le lancement final isolé et séquentiel réussit dans les quatre langues. Aucun seuil d'assertion du produit n'a été assoupli.

### Environnement Windows

Le premier `npm test` donne 331/336, avec cinq échecs de comparaisons d'octets sur des fixtures et fichiers générés convertis en CRLF par le checkout Windows. Restituer dans cette copie isolée les octets du Git index pour ces fichiers inchangés donne 336/336. Aucune assertion, empreinte attendue ou logique métier n'a été changée ; ces restitutions n'ajoutent aucun diff Git.

### Limites

Les rendus ne couvrent pas exhaustivement chaque erreur, chargement, permission et combinaison de palette avec chaque largeur. Les tests existants couvrent des scénarios supplémentaires, sans constituer une certification générale d'accessibilité. OAuth, services distants et appareils physiques ne sont pas validés ici.

Les mesures EventTiming du serveur de développement partagé dépassent 100 ms sur certaines ouvertures/fermetures ; sans mesure isolée sur un build de production ni comparaison avant/après, elles ne prouvent pas une régression et ne permettent pas de déclarer l'objectif de latence validé. Aucun gain de performance chiffré n'est revendiqué.

Aucun déploiement, migration distante ou modification d'adresse Vercel. Le build du gate est une sortie de validation factice, pas un candidat à publier.

## Fichiers de la contribution

- `src/apple-design.css`
- `src/components/TravelDelight.css`
- `tests/e2e/editorial-ui.spec.ts`
- `tests/e2e/iphone-glass.spec.ts`
- `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md` : vérification proportionnée au changement, à la demande de l'utilisateur ; suppression de l'obligation de gate global pour chaque tâche UI.
- `docs/system/GlassSelection.md`
- Ce rapport et les quatre captures du sous-dossier `captures/`.

Le test historique d'en-tête retirait par expression régulière le dernier canal d'une couleur, supposant une chaîne `rgba(...)`. Le nouveau fond opaque renvoie `rgb(...)` : cette transformation supprimait alors le canal bleu. La comparaison directe avec le fond du document vérifie désormais aussi l'opacité et ne tolère aucun canal manquant. Les autres assertions du test (largeur, position, absence d'ombre, safe area, deux thèmes, défilement) sont conservées.

Les nouvelles consignes de validation ont aussi été appliquées immédiatement au checkout d'origine, sans déplacer ses fichiers non suivis. Le serveur de développement d'origine sur 5173 a été relancé. L'interface modifiée reste consultable dans la copie isolée sur 5181.
