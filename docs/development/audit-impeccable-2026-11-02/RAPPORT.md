Method: dual-agent (A: /root/assessment_a · B: /root/assessment_b)

# Détours — audit global UX, interface et validation locale

**Date : 2 novembre 2026, Asia/Shanghai.** Audit sans correction. Révision locale `480c0f8257274d0ebfaa630e50933da90a16e5f6`, branche `codex/ui-carnets-animes`. Il s’agit du code et de l’interface locaux, pas d’un audit du site publié.

## Conclusion

Détours possède une identité de carnet de voyage cohérente et un contrat de données particulièrement explicite. Trois constats passent en priorité haute : un import compact masque plusieurs activités sans signal de relecture, certaines actions sortent de l’écran à 768 px, et un nom local présente un contraste mesuré insuffisant. Sur téléphone, les blocs répétés et la densité de l’aperçu d’import réduisent aussi l’efficacité d’usage.

**12 constats : 3 P1, 7 P2 dont un risque tactile non reproduit, 2 P3. Aucun P0 démontré.** Les constats issus du corpus et de sa reproduction complémentaire (R11/R12) ont été ajoutés par la synthèse après les deux évaluations indépendantes.

Conserver les titres éditoriaux, les couleurs papier/vert/prune, les noms locaux, les états de sauvegarde honnêtes et la création progressive. Ajuster la hiérarchie et les exceptions de mise en page là où elles gênent les tâches.

Les résultats automatisés détaillés et les incidents d’environnement figurent dans [TESTS.md](TESTS.md). Les situations réellement observées et les exclusions figurent dans [COUVERTURE.md](COUVERTURE.md). Les preuves originales sont sous [preuves/](preuves/).

## État du dépôt et méthode

`AGENTS.md`, `README.md` et `docs/development/COLLABORATION.md` lus. Au départ, ces trois documents étaient modifiés ; deux plans et `audit-global-2026-10-31/` étaient non suivis. Ces éléments n’ont pas servi de preuve de fonctionnement actuel et sont préservés. Aucun changement de branche/base : cet audit porte volontairement sur l’état demandé, sans fusion ni contribution de code.

Impeccable 4.8.0 : `context` exécuté une fois avec `src/components/JourneysApp.tsx` comme cible. Aucun PRODUCT.md/DESIGN.md présent ; l’implémentation existante est l’autorité visuelle. Références `audit` et `critique` appliquées ; critères de responsive, clarification, résistance aux cas limites, typographie et animation utilisés comme grilles, sans lancer de commande de transformation.

A a évalué le design et les parcours sans connaître B. B a exécuté le détecteur et examiné le rendu/CSS/structure sans connaître A. La synthèse confronte leurs preuves après livraison de A. Mode principal **Operate**, et **Read** pour les documents. Profils fictifs, aucun compte réel. L’évaluation A et les contrôles automatisés bloquent les destinations externes ; l’IAB de B ne fournit pas d’interception réseau, ce qui limite ses observations de cartes à un rendu d’interface.

Notes Impeccable : slug `src-components-journeysapp-tsx`, aucune liste d’exclusion de critique trouvée. Détecteur CLI exécuté une fois ; injection mutable/overlay indisponible dans l’API navigateur en lecture seule, donc aucun live-server lancé et aucun HTML du projet injecté. Repli : rendus réels, CSS calculés, arbre accessible et reproductions. La sauvegarde du rapport se fait dans le nouveau dossier demandé ; pas d’écriture de snapshot ni de lecture de tendance dans `.impeccable/critique/`, pour ne pas mélanger cet audit global avec des critiques antérieures.

## Verdict d’intégrité et scores

**Système visuel cohérent, corrections nécessaires avant de prétendre à une bonne accessibilité globale.** Le détecteur statique Impeccable renvoie `[]` avec code 0 ; il n’a pas détecté les défauts dynamiques de contraste, de nom accessible et de cascade tactile. Zéro signal statique ne signifie pas zéro problème.

| Dimension technique | /4 | Évidence déterminante |
|---|---:|---|
| Accessibilité | 2 | nom local à 1,74:1 ; marqueur annoncé « · » ; focus et vrais contrôles présents |
| Performance | 2 | 2,41 Mo transférés au démarrage du petit corpus sans compression ; App importé directement ; timings sous charge non attribuables au seul produit |
| Thèmes | 3 | clair/sombre cohérents, couleur héritée insuffisante pour le nom local |
| Responsive | 2 | actions coupées à 768 px malgré de bons résultats ponctuels à 320/390 px |
| Intégrité d’implémentation | 3 | identité spécifique, conflit local de spécificité touch-action |
| **Total** | **12/20** | Acceptable, travail ciblé nécessaire |

Scores indicatifs limités aux états inspectés ; aucune certification WCAG ou garantie de performance. La note responsive de B a été abaissée à partir de la preuve tablette de A, et la performance après la mesure du coût de chargement. Les notes indépendantes originales sont conservées.

| Heuristique UX | /4 | Évaluation |
|---|---:|---|
| État du système visible | 3 | local/synchronisation explicites, bloc trop volumineux au retour |
| Correspondance avec le monde réel | 3 | villes/journées compréhensibles, souvenirs ambigu |
| Liberté et contrôle | 3 | fermeture Escape et aperçus avant écritures |
| Cohérence | 3 | composants et identité communs, quelques textes hétérogènes |
| Prévention des erreurs | 2 | revue et sources conservées, mais cas compact sans alerte malgré activités non reconnues (R11) |
| Reconnaissance plutôt que mémorisation | 2 | nombreuses vues derrière Menu mobile et relecture dense |
| Souplesse et efficacité | 2 | contenu trop bas et peu de progression dans les longs formulaires |
| Esthétique et sobriété | 2 | identité soignée, scénographie répétitive sur les vues de travail |
| Récupération des erreurs | 3 | sources conservées, pannes explicitées, tests de reprise existants |
| Aide et documentation | 3 | limites IA/hors ligne et récupération concrètes |
| **Total** | **26/40** | Acceptable, 65 % ; A avait proposé 27/40 avant la reproduction R11 |

## Constats hiérarchisés

Priorité et gravité : **P0 bloquant**, **P1 majeur**, **P2 gêne avec solution de contournement**, **P3 facultatif**. L’effort est une estimation de développement + vérification ciblée, sans inclure une publication. Les risques sont ceux des corrections futures ; aucune n’a été réalisée.

### Bugs confirmés

**R01 — P1, majeur : actions coupées sur tablette.**

- Écrans : Mon carnet pratique EN sombre et Mes outils sur place FR, 768×1024.
- Preuve : [capture anglaise](preuves/assessment-a/10-practical-tablet-en-dark.png), [capture outils FR](preuves/assessment-a/14-tools-tablet-fr.png). La barre latérale de 264 px persiste, « Continue » et « Export notebook » se chevauchent/sortent à droite. Sur Outils FR, `scrollWidth=780` pour `innerWidth=768`.
- Reproduction : ajouter l’exemple Chine → ouvrir le carnet → afficher 768 px → Carnet pratique en anglais ou Outils en français. Le problème se situe juste au-dessus du seuil mobile de 760 px.
- Impact : export moins lisible et action potentiellement manquée ; défilement horizontal involontaire. Ce n’est pas une impossibilité prouvée d’exporter par tous les accès.
- Recommandation : passer les actions sous le texte avant que la colonne centrale soit trop étroite ; adapter la navigation à la largeur disponible. Cibles : `src/App.tsx` (page-intro), `src/apple-design.css:513–568` et règles intro-actions de `src/theme.css`.
- Effort : **0,5–1 j**. Risque : cascade desktop/mobile ; tester 761/768/820/1024 et les quatre langues. Orientation future : `adapt`.

**R11 — P1, majeur : activités absorbées dans un titre sans alerte de relecture.**

- Fonction : reconnaissance locale d’un planning compact, puis aperçu avant création. Défaut confirmé par exécution du code actuel et reproduction dans le navigateur, après les évaluations A/B.
- Source fictive exacte : `ville: Toulouse`, puis `j1 matin: capitole / aprem: jardin japonais / soir: canal du midi`, puis `j2: couvent des jacobins + musée saint raymond`.
- Résultat : deux journées, **une seule activité**, aucun passage signalé par `reviewPassages`. Le premier jour a pour titre toute la ligne j1 et **zéro activité** ; le second fusionne deux lieux dans une activité. Après renseignement du titre du voyage, l’aperçu annonce **« 2 journées · 1 propositions · 0 passages à vérifier »**, et l’action de création est disponible.
- Preuves : [capture navigateur](preuves/import-compact-observe.png), [arbre accessible](preuves/import-compact-ax.txt), [reproduction parser + revue](preuves/stress-review-check.json), [source du cas 10](preuves/planning-stress/plannings/10.txt). Sources responsables à examiner : `src/planning-import/parser.ts`, `review.ts`, bilan dans `PlanningImport.tsx`.
- Impact : un programme incomplet peut être accepté sans que le compteur de revue attire l’attention. **Le texte source n’est pas détruit** et la prévisualisation reste obligatoire ; le bug concerne la structure reconnue et l’absence d’alerte, pas une perte irréversible du fichier original.
- Portée mesurée : corpus difficile actuel **27/36 conformes**, **85/114 activités séparées**, **83/114 au bon emplacement**, zéro exception. Le cas 16 conserve sa correction finale en notes et la signale comme ambiguë ; le cas 28 chinois est bien signalé non traité. Le défaut de signalement ne s’applique donc pas indistinctement à tous les échecs du corpus.
- Recommandation : prioriser un garde-fou de revue sur les titres de journées contenant plusieurs moments/lieux et séparateurs ; rendre explicite le contenu non transformé en activités. Préserver chaque source et décision ; ne pas promettre la compréhension générale du langage libre ni appliquer silencieusement une correction narrative.
- Effort : **1–3 j** pour diagnostic/garde-fous et vérifications. Risque moyen : faux positifs de revue et changement du découpage ; régression sur corpus figé, nouveaux exemples indépendants FR/EN/ES/ZH et reprise du brouillon. Orientation : `harden`, `clarify`.

### Problèmes UX et accessibilité confirmés

**R02 — P1, majeur : nom local insuffisamment contrasté.**

- Écran : planning, Shenzhen, mode clair.
- Preuve : mesure DOM/CSS dans [notes B](preuves/assessment-b/NOTES.md), `.city-heading h2 > span` = `深圳`, texte `#a6ae9b` sur fond opaque `#e8dfd0`, 18 px, poids 400. Rapport sRGB **1,737547:1**, sous le seuil 4,5:1 du texte normal (WCAG 1.4.3). Source : `src/App.tsx:242`, règle historique `.city-heading h2 span` dans `src/styles.css`.
- Impact : une information utile pour se repérer localement devient difficile à lire, notamment en faible vision ou en extérieur.
- Recommandation : utiliser un token de texte contrasté pour les noms locaux ; contrôler les occurrences comparables dans toutes les palettes pertinentes. Préserver le texte chinois et son rôle fonctionnel.
- Effort : **0,5–1 j**. Risque faible ; vérifier le fond réellement composé et les quatre langues, pas seulement des paires de tokens abstraites. Orientation : `harden`, `colorize`.

**R03 — P2, modéré : marqueurs nommés « · » ou par leur seul numéro.**

- Écran : mini-carte du planning, repère de centre indicatif et marqueurs d’activités.
- Preuve : arbre accessible natif B : bouton « · ». Le DOM possède `role=button`, `tabindex=0`, un `title` et une description géographique, mais le contenu du divIcon fournit le nom prioritaire. `src/components/TripMap.tsx:33–35,133,158–161`.
- Impact : parcourir la liste des boutons ne permet pas d’identifier directement le lieu ; la description atténue la gêne. Pas d’affirmation de carte entièrement inaccessible ni de panne NVDA prouvée.
- Recommandation : nom accessible explicite, par exemple « Shenzhen, centre indicatif » ou « Activité 3, Musée… », mis à jour avec la langue et les couches Leaflet. Garder un équivalent dans la liste d’activités.
- Effort : **0,5 j**. Risque faible ; vérifier focus, activation, popup, fermeture et recréation des marqueurs. Orientation : `harden`.

**R04 — P2, modéré : les introductions répètent la bienvenue avant chaque tâche.**

- Écrans : planning, vue d’ensemble, outils/carnet pratique, carnet vierge.
- Preuve : [vue d’ensemble 390×844](preuves/assessment-a/06-overview-mobile.png) : état du voyage/synchronisation, assistant, Voir Maintenant, titre narratif, texte et actions précèdent le contenu. Exporter le calendrier arrive vers y=740. [Carnet vierge](preuves/assessment-a/23-blank-long-title-mobile.png) : première invitation à construire le carnet à y=1452 dans le relevé A. [Planning desktop](preuves/assessment-a/19-planning-desktop.png) : la journée n’est pas dans les 1000 premiers pixels.
- Impact : au retour dans le carnet, il faut défiler avant de lire une journée, une adresse ou un outil. Le lien Reprendre aide, mais ne compense pas sur toutes les vues.
- Recommandation : conserver l’entrée éditoriale pour la couverture/le premier accueil et condenser le bandeau habituel des vues de travail. Conserver l’alerte d’écriture ou de synchronisation quand elle est significative ; rapprocher l’action principale du contenu actif.
- Effort : **1–2 j**. Risque moyen : masquer un état local/en attente/erreur/lecteur si la condensation est mal conçue. Orientation : `distill`, `layout`.

**R05 — P2, modéré : l’aperçu d’import expose trop de champs simultanément.**

- Écran : Créer depuis un planning → Vérifier le programme, mobile.
- Reproduction : texte fictif « Jour 1 — Lyon / Matin : visiter le Vieux Lyon / Après-midi : musée » → Reconnaître mon programme.
- Preuve : [aperçu](preuves/assessment-a/21-import-preview-mobile.png) et relevé A : seulement deux propositions produisent **45 contrôles**, `scrollHeight=4019` pour 718 px visibles. Les inconnues et l’affectation ambiguë sont correctement signalées ; aucune ville inventée n’est alléguée.
- Impact : relecture longue, confusion entre correction requise et enrichissement facultatif, action finale éloignée de l’anomalie.
- Recommandation : commencer par le résumé des journées et les anomalies ; ouvrir les détails avancés d’une activité à la demande. Maintenir la source et le récapitulatif de confirmation accessibles. Ne pas modifier la reconnaissance dans ce lot de présentation.
- Effort : **2–4 j**. Risque moyen : rendre une anomalie moins visible ou perdre des décisions de revue ; utiliser les tests d’import existants. Orientation : `distill`, `harden`.

**R06 — P2, modéré : le périmètre des « souvenirs » contredit la lecture rapide de « sauvegarde complète ».**

- Écrans : panneau de sauvegarde de l’accueil, Mon monde, souvenirs quotidiens/album.
- Preuve concordante A+B : `src/components/BackupPanel.tsx:85` promet « Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier ». Plus bas, photos et légendes quotidiennes sont explicitement exclues. Mon monde emploie aussi Exporter/Restaurer mes souvenirs pour les visites.
- Impact : une personne pressée peut conserver un seul fichier et croire ses photos protégées. **Ce n’est pas un bug d’archive démontré** : le format respecte ses exclusions.
- Recommandation : distinguer « visites et pays de Mon monde » et « photos/légendes du carnet », annoncer la séparation dans la phrase principale, afficher les deux fichiers à conserver ensemble. Préserver formats et stockage.
- Effort : **0,5–1 j**, traductions comprises. Risque faible si les textes restent fidèles aux archives réellement produites. Orientation : `clarify`.

**R07 — P3, faible : accords singuliers incorrects dans le bilan d’import.**

- Preuve : même [capture d’aperçu](preuves/assessment-a/21-import-preview-mobile.png), « 1 journées » et « 1 passages à vérifier ».
- Impact : finition et confiance au moment de la vérification ; ne bloque pas la création.
- Recommandation : pluraliser les compteurs réellement concernés en FR/EN/ES/ZH, avec cas 0/1/2 ; éviter de refaire l’ensemble des textes personnels du modèle Chine.
- Effort : **quelques heures**. Risque faible de clé/traduction. Orientation : `clarify`.

### Amélioration visuelle reliée à une gêne observée

**R08 — P2, modéré : la mascotte masque des mots et des filtres sur mobile.**

- Preuves : [accueil mobile](preuves/assessment-a/02-home-mobile.png), [titre du carnet](preuves/assessment-a/23-blank-long-title-mobile.png), [320 px](preuves/assessment-a/28-planning-320.png). Pico se superpose au filtre Pays et à des mots du titre/texte principal.
- Impact : lecture gênée ; le premier utilisateur ne connaît pas forcément le déplacement ou la désactivation. Aucun blocage total d’un bouton n’est démontré.
- Recommandation : zone de repos qui évite champs, titres et actions ; adapter présence/position quand un panneau s’ouvre et sur 320–390 px. Conserver les raccourcis et la préférence personnelle.
- Effort : **1–2 j**. Risque moyen : drag, position persistée, clamping et clavier. Orientation : `adapt`, `animate`.

### Risque technique établi, panne utilisateur non reproduite

**R09 — P2 à instruire : exception tactile de la mascotte écrasée par le style général.**

- Preuve : `.floating-mascot .pet-button` demande `touch-action:none` dans `FloatingMascot.css:3`, mais `html:root:root :is(button, summary)` impose `manipulation` dans `apple-design.css:95`. Valeur calculée B : `manipulation`, bouton 96×96.
- Impact possible : le navigateur peut reprendre le défilement pendant le glissement. **L’échec du glissement tactile n’a pas été démontré** ; capture/cancel/lostcapture sont présents dans le code, et le déplacement clavier fonctionne.
- Recommandation : reproduire d’abord avec un vrai geste tactile ou une synthèse dédiée, puis protéger l’exception drag au bon niveau de cascade. Garder le défilement normal hors du personnage.
- Effort : **0,5–1 j**, validation comprise. Risque de bloquer la page si l’exception déborde sur le parent. Orientation : `adapt`, `harden`.

### Suggestion facultative

**R10 — P3 : documenter le système existant et ses exceptions.** Le setup ne trouve ni PRODUCT.md ni DESIGN.md ; la cascade actuelle combine styles historiques, thème et overrides `html:root:root`, avec deux conflits concrets R02/R09. Après les corrections, consigner les tokens de texte, les règles d’en-tête, les seuils intermédiaires et les exceptions drag/motion. Effort **0,5–1 j**, risque faible. Ce travail documentaire ne justifie ni refonte ni modification immédiate des styles. Orientation éventuelle : `document`.

## Charge cognitive et parcours utilisateur

- **Jordan, premier usage** : Créer un voyage et Créer depuis un planning sont compréhensibles. L’aperçu à deux activités expose ensuite 45 contrôles, et « souvenirs » change de périmètre selon l’écran : R05/R06.
- **Casey, téléphone en déplacement** : navigation basse persistante utile ; coût de défilement important avant l’outil/journée et mascotte sur le texte : R04/R08.
- **Sam, dépendant du clavier ou malvoyant** : focus visible et Escape dans les dialogues visités ; nom local à faible contraste et bouton carte « · » : R02/R03. Aucun essai avec un lecteur d’écran réel n’a été fait.

La première impression chaleureuse est un point haut. Les moments à enjeu — relecture d’import et conservation des souvenirs — sont les creux où simplifier les décisions et rendre le périmètre plus explicite. La précision des avertissements existants doit être conservée.

## Animations, typographie, thèmes et performances

Les titres Newsreader et les contrôles Hanken Grotesk sont auto-hébergés ; `font-display:swap` et fallbacks CJK existent dans `src/typography.css`. La typographie sert bien le carnet. Le problème R02 provient d’une couleur héritée sur une occurrence utile, pas d’un besoin de changer de police.

Le relief a une pause explicite, les photos et couvertures utilisent le chargement différé, les documents PDF/Word et Mon monde possèdent des modules différés. Les feuilles de style traitent les préférences de mouvement/transparence/contraste. Le coupe-animation global `.01ms` mérite une attention lors des futurs changements, mais aucune perte de feedback ne lui est imputée sans symptôme observé.

**R12 — P2, coût de démarrage à réduire après mesure isolée.** Le build signale un chunk principal de **657,53 ko** (gzip **201,73 ko**) et un chunk PDF de **573,79 ko** (gzip **181,42 ko**). Le PDF est différé ; `JourneysApp.tsx:7` importe en revanche `App` directement, qui importe plusieurs vues de travail. Le protocole L8 actuel transfère **2,41 Mo** pour la petite collection et **3,61 Mo** stabilisés pour la grande, sans compression, cache HTTP ou SW. La grande collection demande 9 couvertures sur 60 : le lazy loading apporte un gain à conserver.

Les cinq répétitions donnent des médianes accueil **21,25 s / 25,93 s**, ouverture **4,15 s / 5,09 s**, carte **0,76 s / 0,92 s**, pour petit/grand corpus. CPU ×4, 200 ko/s et 80 ms de latence ; **la suite E2E tournait simultanément**, donc ces temps ne permettent ni comparaison de régression ni attribution au seul produit. Aucun budget de performance n’est validé par le seul code 0 du script.

Recommandation : établir d’abord un budget isolé sur le même PC, puis mesurer le bénéfice d’un chargement différé du carnet/vues actuellement importés directement. Ne pas retirer du manifeste les ressources nécessaires hors ligne pour réduire artificiellement le trafic. Effort **0,5 j de mesure puis 1–3 j** si un découpage apporte un gain. Risque moyen : chargement différé hors ligne et reprise après mise à jour ; vérifier sur build compilé. Orientation : `optimize`. Preuve : [performance.json](preuves/performance.json), détails/limites dans TESTS.md.

## Points forts à préserver

- **Identité spécifique au voyage** : papier chaud, relief, titres éditoriaux, ligne des villes et noms locaux. Thème sombre lisible dans les états inspectés, sans besoin de remplacer la direction.
- **Données et récupération explicites** : validation des états, copies récupérables, sources anciennes conservées, lecture après écriture, séparation compte/carnet. Les tests prouvent des scénarios précis, sans étendre la conclusion aux services distants.
- **Mode local honnête** : « Internet disponible » n’est pas assimilé à une synchronisation réussie. Cartes de rues externes distinguées des contours locaux ; documents et imports décrivent leurs limites.
- **Création progressive** : carnet vierge sans Chine injectée, ville/journée/activité, dates et coordonnées facultatives, titre personnel long sans débordement à 390 px dans l’état inspecté.
- **Revue et contrôle** : import avec source, inconnues signalées, aperçu avant création ; assistant guidé avec prévisualisation, annulation et restrictions de droits.
- **Accessibilité déjà travaillée** : vrais boutons/champs, vrais dialogues pour les préférences, fermeture Escape et focus visibles dans les états testés. Ces acquis rendent les corrections ciblées possibles.

## Bilan des tests et limites

| Famille | Bilan final |
|---|---|
| Gate complet demandé, 35 étapes | **8 réussies**, arrêt d’environnement sur port 5173 occupé, **26 non exécutées par cette invocation** ; le gate reste non vert |
| Unitaires | **336 réussis**, zéro échec/ignoré |
| E2E principal | **244/249 réussis**, **5 échoués**, zéro ignoré ; trois anciennes attentes Amap et deux attentes alpha obsolètes |
| Analyse de planning simulée | **3/3 réussis** |
| SQL supplémentaire | **3 scripts réussis** en mémoire, en plus du SQL L6 réussi dans le gate |
| Smokes compilés distincts | **21/22 validés** après une reprise exacte du contrôle hors ligne ; le dernier a passé 12 rendus puis bloque sur une comparaison historique sans fixture |
| Corpus structuré | **42/42 cas**, 219 contrôles réussis |
| Corpus difficile | **27/36 conformes**, 9 non conformes, zéro exception ; défaut de revue R11 reproduit dans le navigateur |
| Performance | **10 mesures produites**, aucun seuil de rapidité ni vitaux Web terrain validés |

Voir [TESTS.md](TESTS.md) pour les résultats exécutés, échecs originaux, reprises ciblées, non-exécutions et fichiers de preuve. Un gate arrêté reste indiqué arrêté même si ses contrôles indépendants ont ensuite été exécutés séparément. Le contrôle hors ligne initialement en échec a réussi après la fin des autres batteries, sans changement d’assertion : incident de temps/charge locale, pas défaut de persistance établi.

**Préservation vérifiée :** l’empreinte finale du code/configurations/tests/assets est exactement celle du début (`67464bc48eb439867fa0a5c0266c1fd985a78011953b91bde4bc0fe59fedae1f`, documentation et fichiers ignorés exclus). Les **58 preuves historiques suivies régénérées** par les tests ont été archivées dans le nouveau dossier puis restaurées ; une nouvelle capture de test hors dossier a également été déplacée dans les preuves d’audit. Les trois documents modifiés et les plans/ancien audit non suivis présents au départ restent intacts. [État final](preuves/final-state.json), [inventaire des commandes](preuves/inventaire-commandes.json).

Aucune correction du produit ou des tests du dépôt, aucun commit/push, aucune fusion, publication ou modification distante. Le serveur d’observation 5180 a été arrêté, les serveurs des suites terminées ont été fermés et les onglets d’audit ont été fermés. Aucun live-server Impeccable n’a été lancé ; les traces et captures retenues restent volontairement comme preuves. Le `dist/` ignoré est le build de test factice généré par le gate.

Limites matérielles : aucun appareil physique, Safari/iOS réel, OAuth, compte réel, configuration distante, quota réel de navigateur utilisateur ou comportement de toutes les palettes certifié. Zoom navigateur réel 200 %, lecteur d’écran et FPS/vitaux Web terrain non réalisés. Les captures de petites largeurs et le zoom CSS des tests ne remplacent pas ces essais.

Les cas vides et certains cas limites ont été vus réellement ; les pannes/quota/restauration et la synchronisation sont surtout exercés par les fixtures automatiques et le code. La matrice [COUVERTURE.md](COUVERTURE.md) indique ce qui a été vu et ce qui reste hors preuve. Aucun bug de perte de données n’est déduit des seuls retards de test.

## Plan de corrections proposé — aucune exécution autorisée à ce stade

| Lot | Priorité et objectif | Périmètre | Effort | Risques / vérifications adaptées |
|---|---|---|---|---|
| 1 — Import sans fausse assurance | P1, R11 | garde-fous sur les lignes compactes et contenu non transformé | 1–3 j | cas 10 actuel et nouveaux cas indépendants ; corpus 42 + 36, tests parser/review/import, brouillon/reprise ; types/lint. Gate si persistance modifiée |
| 2 — Lisibilité et tablette | P1, R01/R02/R03 | responsive intermédiaire, noms locaux, noms accessibles carte | 1–2 j | captures 761/768/820/1024 + mobile/desktop ; 4 langues, clair/sombre, contraste composé ; clavier carte et popups ; tests UI ciblés. Pas de gate global pour CSS seul |
| 3 — Accès direct au contenu | P2, R04/R08 | en-têtes condensés, statut utile, position mascotte | 2–3 j | local/en attente/erreur/lecteur, 320/390/768 ; titres longs, scroll/reprise ; tests navigation et floating-mascot existants. Types/lint si TS modifié |
| 4 — Relecture d’import | P2, R05/R07 | anomalies d’abord, détails progressifs, compteurs | 2–4 j | TXT/PDF/DOCX/JSON, quatre langues, brouillon/reload/annulation, décisions de revue, clavier ; suites import ciblées puis types/lint. Gate seulement si contrat de persistance modifié |
| 5 — Sens des sauvegardes | P2, R06 | texte et hiérarchie des périmètres carnet/visites/photos | 0,5–1 j | archives existantes inchangées, aperçu exclusions FR/EN/ES/ZH ; tests backup/souvenirs ciblés si logique touchée. Pas de migration |
| 6 — Geste tactile | P2 à instruire, R09 | reproduire le geste puis ajuster l’exception CSS si nécessaire | 0,5–1 j | geste natif synthétique + téléphone, annulation, scroll hors mascotte, Maj+flèches, position/orientation. Aucune panne tactile déclarée avant reproduction |
| 7 — Coût et système visuel | P2/P3, R12/R10 | budget isolé puis découpage justifié ; documenter les exceptions | 0,5–4 j | mesurer au repos sur le même PC avant/après ; si découpage réalisé, build et parcours compilés/hors ligne ciblés ; ne pas engager de refonte sur la taille seule |
| 8 — Tests fiables et revue finale | P2 pour les tests obsolètes puis finition | attentes cartes et matériau, ports paramétrés, baselines explicites ; future passe `polish` | 0,5–1,5 j | relancer seulement les scénarios modifiés, audit des écrans corrigés ; gate complet si contrat transversal ou publication autorisée |

L’ordre privilégie la fiabilité du planning importé, les actions coupées et la lisibilité, puis l’efficacité des parcours. Les attentes obsolètes des tests se traitent dans un lot d’outillage distinct ; elles ne justifient pas de changer le produit pour retrouver un ancien libellé ou une ancienne valeur alpha. La synchronisation distante reste hors périmètre des corrections proposées.

Questions skipped: la demande fixe un audit et un plan avant toute correction ; aucun choix supplémentaire n’est nécessaire pour livrer ce rapport.
