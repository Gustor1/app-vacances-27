# Détours — Fiabiliser, simplifier, rendre indispensable

Proposition du 8 octobre 2026. Statut : plan à arbitrer et à exécuter, aucune fonctionnalité annoncée comme livrée par ce document.

## Approche

Faire de Détours le carnet que l’on ouvre au départ de l’hôtel, devant un chauffeur et quand le réseau disparaît. Préserver l’expérience actuelle, consolider la confiance dans les données, puis développer quelques fonctions qui rendent le voyage plus simple. L’ambition porte sur l’utilité quotidienne et la qualité de réalisation, pas sur le nombre d’onglets.

Hypothèse de travail : usage personnel et petit groupe en priorité. L’ouverture publique reste une trajectoire possible, avec un jalon distinct. Le `PLAN-ACTION.md` du 6 octobre évoque cette ouverture ; le rapport personnel du 8 octobre l’exclut volontairement de son périmètre. Ce choix de périmètre ne vaut pas abandon de l’ambition initiale.

## 1. Lecture critique de l’audit

### Ce que le rapport fait bien

- Il sépare anomalies reproduites, observations de code et risques conditionnels.
- Il décrit les limites des preuves : mocks, SQL local, absence de téléphone physique et assertions non exécutées après un échec.
- Il place la restauration avant les optimisations. C’est cohérent avec un carnet qui contient réservations, notes et souvenirs.
- Il évite de traiter un usage personnel comme une plateforme publique à exploiter immédiatement.

### Ce que je changerais

1. **Remonter la sauvegarde du code au tout premier lot.** Des modules essentiels non suivis par Git rendent la reconstruction et le retour arrière fragiles. Le code et les données demandent deux protections distinctes ; un commit local seul ne protège pas contre la perte du disque.
2. **Élargir le contrat de sauvegarde.** Fractionner par carnet ne suffit pas si un carnet seul est trop gros. Les souvenirs de « Mon monde » sont exportés séparément selon le README. Un utilisateur doit comprendre exactement ce qu’il pourra retrouver sur un navigateur vierge.
3. **Distinguer import et restauration.** L’import actuel crée des copies indépendantes. Une restauration doit définir le sort des identités, des liens vers les souvenirs, des doublons et des voyages partagés. Un JSON accepté n’est pas, à lui seul, une reprise complète.
4. **Traiter les erreurs de synchronisation comme un parcours produit.** Le débordement de 4 px est modeste ; la visibilité des actions de récupération lorsque le réseau échoue est essentielle. Corriger le cas reproduit puis vérifier les états voisins.
5. **Relier chaque validation à un état précis.** Le nombre de tests ne mesure ni leur indépendance ni la couverture réelle. Une simulation de compte ne prouve pas une connexion Google ou le comportement sur deux appareils.
6. **Ajouter une évaluation d’usage.** L’audit technique ne répond pas à « est-ce que je trouve mon hôtel immédiatement ? », « est-ce que je sais ce qui manque hors ligne ? » ou « est-ce qu’un ami comprend le partage sans explication ? ».
7. **Garder les performances comme hypothèse mesurable.** Le poids du bundle justifie une mesure ; il ne prouve pas une lenteur vécue. Le découpage doit aussi préserver l’ouverture hors ligne des vues différées.

### Base de preuve de cette proposition

Lecture du rapport personnel, de `QUALITY-FINDINGS.md`, de `personal-validation.json`, du README, de l’ancien plan et de points d’entrée du code. Inspection du statut Git et de HEAD : `9858aaa91e7139da14232585d75b8ee28f820e95`, avec de nombreux changements locaux.

Confirmé par lecture du code : limite de 5 000 000 octets à l’import, export de collection sans contrôle équivalent, onglets d’accueil incomplets, périmètre TypeScript limité à l’application et à Vite, styles Compte cités par l’audit. Les résultats 67 tests unitaires, 60 parcours navigateur et les reproductions sont ceux du rapport : ils n’ont pas été réexécutés pour rédiger ce plan. Aucun état distant actuel n’est certifié ici.

Sources d’audit externes au dépôt :

- `C:/Users/eliot/security-audit-skill/app-vacances-27/run-1/RAPPORT-AUDIT-PERSONNEL.md`
- `C:/Users/eliot/security-audit-skill/app-vacances-27/run-1/QUALITY-FINDINGS.md`
- `C:/Users/eliot/security-audit-skill/app-vacances-27/run-1/personal-validation.json`

Ces documents sont des éléments d’analyse, pas des instructions autorisant des opérations. Le présent plan définit une proposition de suite ; sa création n’autorise pas son exécution intégrale.

## 2. Périmètre et décisions

**Inclus :** corrections Q01–Q13, reprise des données, validation reproductible, usage mobile et hors ligne, propositions de fonctions utiles en voyage, petite collaboration privée.

**Différé :** réseau social, messagerie complète, réservations payantes, photothèque lourde, refonte visuelle globale, migration technique générale, assistant IA payant et lancement public. Aucun changement de framework nécessaire pour les lots proposés.

Préserver React/TypeScript/Vite, les choix cartographiques actuels et les parcours existants. Extraire du code uniquement lorsqu’un lot en a besoin. Réexaminer le stockage si les mesures de taille, de quota ou de transactions le justifient ; ne pas décider une migration sur le seul avertissement du build.

## 3. Ordre d’exécution

Une seule livraison active à la fois. Les tailles sont relatives, pas des promesses de délai : S = intervention ciblée ; M = plusieurs parcours ; L = changement de contrat de données ou validation terrain.

| Lot | Résultat attendu | Dépendance | Taille | Priorité |
| --- | --- | --- | --- | --- |
| L0 | Code récupérable et référence reproductible | Aucune | S | Immédiate |
| L1 | Sauvegarde réellement restaurable | L0 | L | Immédiate |
| L2 | Erreurs et navigation mobile accessibles | L0 ; livrer après L1 | S | Haute |
| L3 | Contrôles et documentation fiables | L0 ; intégrer L1–L2 | M | Haute |
| L4 | Synchronisation et hors ligne éprouvés sur appareils | L1–L3 | L | Haute si partage utilisé |
| L5 | Vue « Maintenant » utile sur place | L4 pour les fonctions connectées | M | Produit |
| L6 | Préparation avec marges et alternatives | L5 | M | Produit |
| L7 | Coordination légère entre voyageurs | L4 et validation du besoin | M | Optionnelle |
| L8 | Performance mesurée et bêta traçable | Mesure après L3 ; livraison après lots retenus | M | Avant élargissement |

### [x] L0 — Constituer un point de reprise complet

Inventorier les changements existants sans les écraser. Identifier code, migrations, tests, documentation, fichiers générés et données à exclure. Vérifier l’absence de secrets dans les fichiers destinés à Git. Préparer une révision cohérente et une copie récupérable hors du dossier de travail selon les accès disponibles.

**Terminé quand :** un checkout propre de cette révision contient les modules nécessaires, `npm ci` puis le build réussissent, et l’emplacement de la copie récupérable est connu. Documenter les variables nécessaires sans leurs valeurs. Si la copie extérieure n’a pas été réalisée, garder cette partie explicitement ouverte. Correspondance : Q02.

### [x] L1 — Garantir une sauvegarde complète et explicable

Points d’entrée : `src/journeys.ts`, `src/App.tsx`, `src/components/JourneysApp.tsx`, `src/world.ts`, flux de récupération.

- Définir le périmètre : carnets, documents embarqués, souvenirs, préférences utiles et éventuelles sources illisibles conservées séparément. Exclure jetons et secrets. Ne jamais recréer des droits serveur à partir d’un fichier.
- Garder les imports historiques compatibles et distinguer « importer une copie » de « restaurer mes données ».
- Mesurer les octets du fichier réellement produit. Prévoir le cas d’une collection et celui d’un carnet seul dépassant 5 Mo. Ne pas simplement supprimer les limites de ressources.
- Choisir après un prototype le format le plus simple garantissant la reprise : archive versionnée segmentée avec manifeste si nécessaire, contrôle d’intégrité et limites documentées. Ne pas imposer ZIP ou une nouvelle base sans comparaison utile.
- Présenter avant écriture un bilan : objets récupérables, collisions, exclusions, place insuffisante. Valider tout le contenu avant application ; garantir l’atomicité ou une reprise idempotente des écritures partielles.
- Pour les carnets partagés, restaurer une copie privée par défaut ; rattachement au serveur et identités exigent une procédure distincte. Définir explicitement le mapping des liens entre carnets et souvenirs.

**Terminé quand :** export puis restauration dans un profil vierge retrouvent tous les champs du périmètre annoncé. Tester autour de la limite, un carnet seul trop gros, contenu multilingue, document corrompu, manque de stockage, interruption, réessai et anciennes versions. Une erreur laisse les données d’origine récupérables. La comparaison porte sur les contenus et relations, pas seulement le nombre de carnets. Correspondance : Q01.

### [x] L2 — Rendre les états difficiles utilisables

Corriger la barre Compte sans cacher le texte ; compléter les onglets avec leur panneau et leurs interactions clavier, ou choisir une navigation ordinaire cohérente ; localiser les dates civiles sans décalage de fuseau. Conserver les styles et animations existants, avec mouvement réduit.

**Terminé quand :** le scénario d’envoi refusé reste utilisable à 320, 390 et 1440 px ; les assertions suivant l’ancien échec s’exécutent ; erreurs longues, zoom à 200 %, focus et quatre langues sont vérifiés. Clavier : activation, flèches/Home/End si modèle d’onglets conservé, focus visible et aucun piège. Correspondance : Q07, Q08, Q13.

### [x] L3 — Unifier les preuves de qualité

Ajouter le contrôle TypeScript des tests/configurations avec les déclarations nécessaires, puis un lint React/TypeScript ciblé. Remplacer le nom de bundle figé par une identité de build explicite. Garantir le nettoyage des fixtures avec `finally` et signaler un nettoyage impossible sans toucher aux vrais voyages.

Créer une commande de vérification locale documentée, avec un code d’échec dès qu’un contrôle obligatoire échoue. Garder les contrôles réseau séparés, activés explicitement et identifiables. Corriger les contradictions de dates, de validation et de conversion monétaire du README et des guides.

**Terminé quand :** build, types des tests, lint et contrôles retenus réussissent sur la même révision ; un échec injecté dans un test distant simulé déclenche le nettoyage attendu. Chaque rapport indique date, révision, environnement, scénario, résultat et limites. Correspondance : Q03–Q06, Q12.

### [x] L4 — Prouver la confiance sur le terrain

Faire évoluer les indicateurs existants vers des états compréhensibles : enregistré sur cet appareil, en attente d’envoi, synchronisé, conflit à résoudre. Ne pas confondre réseau disponible, cache local et sauvegarde externe.

Étendre le contrôle hors ligne du carnet pratique : liste de ce qui est disponible, date du dernier contrôle et ressources externes indisponibles. Une carte de rues ou un lien distant ne devient pas hors ligne parce que l’application s’ouvre.

**Terminé quand :** sur un téléphone physique et un ordinateur, un carnet factice survit à une édition hors ligne, fermeture, réouverture, édition concurrente puis reconnexion. Vérifier aussi changement de compte, déconnexion avec envois en attente, rétrogradation/révocation et mise à jour du service worker. Si un appareil ou un accès manque, conserver « à vérifier », sans le remplacer par un résultat de mock.

Livrable utilisateur : une fiche courte « retrouver mes données » et un état de préparation compréhensible. Une révocation coupe les accès futurs ; elle ne promet pas l’effacement de copies déjà téléchargées.

### [x] L5 — Créer une vue « Maintenant »

**Hypothèse produit :** en déplacement, les informations nécessaires sont dispersées. Prototyper une vue dans la navigation existante, à partir des données déjà saisies : prochaine étape, adresse de l’hébergement en langue locale, réservation utile, note du jour et accès au trajet externe.

Ajouter une carte « À montrer » : nom local et adresse en grands caractères, copie du texte, retour immédiat. Si l’adresse locale manque, le dire ; ne pas inventer de traduction. Permettre une date choisie et respecter le fuseau de l’étape, sans imposer GPS ni suivi de position.

**Terminé quand :** depuis le voyage ouvert, retrouver l’adresse locale prend au plus deux actions ; la carte reste lisible hors ligne et en mouvement réduit. Sur trois scénarios observés, l’utilisateur retrouve sans aide l’hôtel, la réservation et la prochaine étape. Mesurer le temps avant/après ; simplifier ou retirer la vue si elle n’améliore pas le parcours.

**Clôture le 9 octobre 2026 :** après les corrections cartographiques, l’utilisateur confirme que cela fonctionne, ne relève pas d’inconvénient et accepte de garder Amap tel quel pour la Chine. L5 accepté sur ce retour qualitatif et les validations locales ; les trois temps avant/après et l’observation détaillée des scénarios ne sont pas fournis. Aucun gain chronométré revendiqué. Voir [les preuves et limites L5](docs/development/L5.md).

### [x] L6 — Aider à construire des journées respirables

**Hypothèse produit :** un planning doit distinguer ce qui est essentiel de ce qui est flexible. Proposer une ancre du jour, des options, des marges et un « plan pluie / fatigue » manuel. Une alternative est reliée au planning sans le remplacer silencieusement.

Première version sans API nouvelle : durées saisies, horaires connus et signalement des informations manquantes. Afficher un conflit seulement à partir de données suffisantes ; ne pas présenter un temps de transfert supposé comme vérifié. Montrer source et date de vérification lorsqu’elles existent.

**Terminé quand :** une alternative peut être comparée puis adoptée ou annulée en conservant l’ancien planning ; les réservations et dépenses restent intactes. Une journée sans durées reste « à compléter », jamais automatiquement déclarée faisable. Valider sur une journée urbaine, une excursion et un transfert.

### [ ] L7 — Faciliter les décisions de petit groupe

Observer d’abord une préparation à deux ou trois. Choisir une seule fonction initiale selon le blocage constaté : tâche « qui réserve ? », proposition d’alternative ou décision à confirmer. Relier cette fonction à une étape existante et réutiliser les droits actuels.

**Terminé quand :** un éditeur propose, les personnes autorisées décident et un lecteur consulte sans pouvoir modifier. Hors ligne, les actions en attente et les conflits restent explicites. Aucun email, notification externe ou messagerie n’est ajouté implicitement. Un journal se limite aux événements utiles et aux données autorisées.

Ne pas développer simultanément votes, tâches, commentaires et chat. Si aucun problème de coordination n’apparaît, reporter ce lot.

### [x] L8 — Mesurer puis livrer une bêta identifiable

Mesurer accueil, ouverture du carnet, carte et frappe sur une petite et une grande collection, sur le même appareil et avec le même profil réseau. Relever poids transféré, temps d’affichage utile et réactivité ; conserver plusieurs mesures et leur médiane.

Appliquer seulement les optimisations justifiées : vues lourdes différées, couvertures hors écran, dérivations mises en cache. Vérifier invalidation entre onglets et après modification des droits. Un chunk différé doit être disponible dans le parcours hors ligne annoncé.

**Terminé quand :** amélioration mesurée sans régression fonctionnelle, vérifications des lots inclus réussies, révision et manifeste du build identifiés. Après autorisation de publication, contrôler la version réellement servie et un parcours critique. Un retour arrière de code ne convertit pas automatiquement les données : préciser compatibilité et restauration. Correspondance : Q09–Q11.

## 4. Règles pour orchestrer le développement

1. À chaque reprise, lire les instructions applicables, le statut Git et le dernier compte rendu. Le code actuel et les preuves priment sur les cases anciennes de `PLAN-ACTION.md`.
2. Ne jamais attribuer les changements déjà présents au lot en cours. Ne pas réinitialiser le checkout pour obtenir un état propre.
3. Pour chaque lot, écrire le problème, le comportement attendu, les fichiers concernés et la preuve de sortie avant d’éditer.
4. Reproduire un défaut avant correction lorsque possible ; ajouter un test de comportement pertinent, pas un test qui recopie l’implémentation.
5. Faire une tranche complète et petite : données, interface, erreurs, traductions, droits concernés, tests et documentation. Éviter les refactorings sans lien avec cette tranche.
6. Conserver sources et sauvegardes lors des migrations. Vérifier relecture et idempotence. Aucun effacement de stockage pour résoudre un problème.
7. Distinguer contrôles unitaires, navigateur simulé, SQL local, service distant et appareil physique. « Non exécuté » reste un résultat acceptable à documenter, pas une réussite.
8. Si une ressource manque, avancer les travaux indépendants puis laisser un point de reprise précis. Ne jamais inventer un accès, une configuration ou une preuve.
9. Suivre les autorisations de la session pour commits, publication, modifications distantes et opérations destructives. La présence du plan ne les autorise pas. Les décisions techniques courantes ne demandent pas de confirmation supplémentaire.
10. Une éventuelle délégation doit être explicitement demandée ; ce document n’en déclenche aucune. Dans ce cas, assigner des fichiers distincts et un responsable de l’intégration.

## 5. Validation et ouverture publique

Commandes actuellement présentes : `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:production`, `node scripts/smoke-ui.mjs`. Les commandes de lint et de types des tests sont à créer dans L3, pas à supposer existantes. Lire les prérequis des scripts avant exécution ; les contrôles Supabase réels sont distincts des simulations.

Une livraison est prête lorsque les contrôles liés au changement passent, que les échecs préexistants sont explicités et que les critères du lot sont prouvés. Un défaut connu de restauration bloque une livraison présentée comme fiable pour les données.

Avant une ouverture publique, ouvrir un chantier séparé : suppression/export de compte, politique de conservation, gestion des abus et invitations, capacités et coûts mesurés, restauration serveur, suivi des erreurs et parcours d’assistance. Revalider alors les règles et tarifs des fournisseurs. Ces sujets ne sont ni des incidents observés ni des prérequis artificiels à l’usage personnel.

## 6. Suivi et reprise

Tous les lots commencent au statut « proposé ». États possibles : proposé → en cours → à valider → terminé ; ou bloqué avec cause et travaux indépendants restants. Un lot n’est terminé qu’avec ses preuves de sortie.

| Lot | État initial | Preuve / révision | Prochaine action |
| --- | --- | --- | --- |
| L0 | Terminé localement | [Preuves et copies récupérables](docs/development/L0-L1.md) ; HEAD initial + manifeste SHA-256 | Copier aussi sur un autre support pour couvrir une perte du disque |
| L1 | Terminé localement | [Contrat et validations](docs/development/L0-L1.md) ; sauvegarde v3 et restauration privée | Conserver le fichier original pour toute reprise |
| L2 | Terminé localement | [Reproductions, corrections et validations](docs/development/L2.md) ; manifeste SHA-256 externe | Conserver les preuves de dimensions/reflow et clavier |
| L3 | Terminé localement | [Gate local, identité du build et nettoyage](docs/development/L3.md) ; rapport sur empreinte stable + manifeste externe | Passer à L4 : appareils physiques et scénarios réseau/comptes |
| L4 | Terminé — essais terrain 1 à 5 confirmés le 9 octobre 2026 | [État et preuves L4](docs/development/L4.md), [matrice appareils](docs/development/L4-TERRAIN.md), [retrouver mes données](docs/RETROUVER-MES-DONNEES.md) | Prêt pour L5 : vue « Maintenant » |
| L5 | Terminé — accepté par l’utilisateur le 9 octobre 2026 ; gain non chronométré | [Prototype et validations L5](docs/development/L5.md) | Publié dans la bêta le 9 octobre 2026 |
| L6 | Terminé — essai utilisateur confirmé le 9 octobre 2026 | [Implémentation et preuves L6](docs/development/L6.md) | Migration distante et bêta publiées le 9 octobre 2026 |
| L7 | Reporté — passage à L8 demandé par l’utilisateur | — | Reprendre si un besoin concret de coordination apparaît |
| L8 | Terminé — bêta publiée et vérifiée le 9 octobre 2026 | [Mesures, contrôles et livraison L8](docs/development/L8.md) ; gate sur empreinte stable | Conserver les preuves et le déploiement précédent pour un retour arrière |

À la fin de chaque lot, consigner : date, périmètre, fichiers changés, révision ou empreinte de travail, contrôles exécutés et résultats, limites, retour arrière et prochaine action. Mettre à jour les liens du README et réconcilier les cases de l’ancien plan lors de L3, sans effacer l’historique.

### Prompt de démarrage proposé

> Exécute uniquement L0 puis L1 de `ORCHESTRATION-DEVELOPPEMENT.md`. Préserve tous les changements existants et les données personnelles. Commence par l’inventaire et le contrat de restauration, puis réalise et vérifie les corrections locales nécessaires. N’effectue pas de déploiement ni de modification de la base distante. Termine par les preuves, les limites et le point de reprise ; ne lance pas les lots produit suivants.
