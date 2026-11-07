# Détours — Compteur de voyage avant, pendant et après

Mission d’implémentation préparée le 3 novembre 2026. Ce fichier décrit le travail à réaliser ; sa rédaction n’a modifié aucun comportement du produit.

## Mission pour l’IA

Implémente une carte de voyage évolutive sur l’accueil de Détours : compte à rebours avant le départ, jour du séjour pendant les dates prévues et invitation à revoir ses souvenirs après. Ajoute des badges compacts sur les voyages et un rappel discret dans le carnet. Réutilise les données et parcours existants, respecte l’interface actuelle et les quatre langues. Travaille jusqu’à une version locale vérifiée et documentée, sans déploiement implicite.

Lis `AGENTS.md`, `README.md` et `docs/development/COLLABORATION.md`. Vérifie la branche et les changements présents. Préserve les travaux des autres contributions et prépare une branche dédiée selon le guide. Vérifie que la référence contient les dernières corrections : repartir d’une ancienne base peut les perdre. Aucun reset, nettoyage massif ou remplacement du travail existant.

## Résultat recherché

Donner envie de préparer le voyage, puis permettre de retrouver rapidement la bonne journée. Le compteur est une information calculée à partir des dates saisies, pas une confirmation que la personne a réellement voyagé.

Exemples fictifs de contenu :

| Moment | Affichage principal | Complément | Action |
|---|---|---|---|
| Avant | **J−42** | Chine · Départ le 15 mai · 17 jours prévus | Préparer mon voyage |
| Veille | **Départ demain** | Chine · Date de départ | Préparer mon voyage |
| Départ | **C’est le jour du départ !** | Jour 1 sur 17, si la durée est connue | Voir ma journée |
| Pendant | **Jour 4 sur 17** | Programme du jour, uniquement s’il est identifié | Voir ma journée |
| Après les dates prévues | **Un voyage à se remémorer** | Fin prévue il y a 7 jours | Revoir mes souvenirs |

Quand le statut est explicitement « terminé », un libellé « Voyage terminé » est possible. Afficher « Retour depuis… » uniquement si les données existantes attestent réellement le retour ; une date prévue ne suffit pas. Ne pas transformer automatiquement le statut du carnet.

## Périmètre V1

- Une carte mise en avant dans l’onglet Mes voyages, avant la grille, sans ajouter un écran intermédiaire.
- Un badge par carte de voyage : J−N, départ aujourd’hui, jour X/Y, jour X, dates passées ou terminé selon le cas.
- Un rappel compact à proximité du titre du carnet, sans nouvelle grande couverture ni duplication de la vue Maintenant.
- Un choix manuel du voyage mis en avant, seulement quand plusieurs voyages éligibles existent.
- Calcul local, sans API, compte obligatoire, géolocalisation ni inférence IA ; utilisation hors ligne après chargement de l’application.

Hors périmètre : notifications, emails, décompte en secondes, compteurs valise/réservations, score de préparation, anniversaires de voyage, nouveau chatbot, refonte typographique, synchronisation des préférences et modification des formats d’import/export.

## 1. Repérer et réutiliser les contrats actuels

Entrées vérifiées lors de la préparation, à relire sur la référence de travail :

- `src/components/JourneysApp.tsx` : collection, filtres, ouverture des voyages, édition départ/retour, accès aux souvenirs, participation aux carnets partagés.
- `src/App.tsx` et `src/components/NowView.tsx` : navigation dans le carnet et accès à Maintenant.
- `src/now.ts` : sélection des journées selon dates et fuseaux des étapes.
- `src/time.ts` : `dateInTimezone`, `validTimezone` et gestion des dates/heures.
- `src/journeys.ts`, types de l’état et `src/countries.ts` : contrats de voyage et statuts.
- `src/locales/`, `src/i18n.tsx`, utilitaires de dates : traductions et formats.

La date de départ est actuellement portée par `trip.departureDate`, la fin par `trip.journey.endDate`, le fuseau général par `trip.journey.timezone`. Ne pas créer de doublons de ces champs. Les journées planifiées ne représentent pas nécessairement tous les jours calendaires du séjour.

**Sortie :** identifier les fonctions réutilisables, les sources réellement disponibles dans les résumés cloud et les actions existantes à ouvrir.

## 2. Écrire une fonction pure de calcul

Créer un module cohérent avec les conventions du projet, par exemple `src/trip-timing.ts`. Il reçoit les dates, le statut, le fuseau et un instant injectable. Il retourne des données sémantiques (phase, nombres de jours, dates valides, raison d’indisponibilité), pas du JSX ou des phrases françaises figées.

### Calcul calendaire

- Utiliser la date civile du fuseau du voyage, de façon cohérente entre accueil et carnet. Si ce fuseau est absent/invalide, reprendre la convention UTC existante, et rendre ce repli explicite dans l’aide si nécessaire.
- Calculer la différence entre dates civiles validées ; ne pas diviser deux minuits locaux par 24 heures, ce qui échoue lors de changements d’heure.
- Avant le départ : `joursAvant = départ − aujourd’hui`.
- Pendant : `jourCourant = aujourd’hui − départ + 1`.
- Durée prévue : `retour − départ + 1`, avec les deux dates incluses. Un séjour du 15 au 17 correspond à trois jours ; départ et retour le même jour correspondent à un jour.
- Le jour de retour appartient encore au voyage. Le lendemain, le nombre de jours depuis la fin prévue vaut 1.
- Sans retour : afficher « Jour X » après le départ et « Durée non précisée » si utile. Ne pas inventer une fin à partir du nombre d’activités ou journées importées.
- La date de l’étape peut différer de celle du voyage : utiliser le fuseau général pour le compteur global et la logique existante de Maintenant pour le programme local. Ne pas mélanger ces deux calculs.

### Statuts et données incohérentes

| Situation | Comportement |
|---|---|
| Aucune date de départ | Pas de J−N ; « Dates à préciser ». Proposer l’édition uniquement aux utilisateurs autorisés. |
| Départ valide, fin absente | Compte à rebours puis Jour X ; aucun total ou progrès fictif. |
| Fin antérieure au départ ou date invalide | Compteur indisponible, message « Dates à vérifier », pas de nombre négatif ou NaN. |
| Statut annulé | Conserver le statut ; exclure de la mise en avant automatique et ne pas annoncer un départ. |
| Statut terminé, dates futures ou fin absente | « Voyage terminé » sans décompte actif ni durée passée inventée. |
| Statut préparation/idée mais dates courantes ou passées | Décrire le calendrier prévu sans changer le statut ni affirmer une présence réelle. |
| Date de fin passée | Invitation aux souvenirs ; indiquer qu’il s’agit des dates prévues si le statut ne confirme pas la fin. |

**Sortie :** règles testables couvrant les frontières de dates, les statuts et les informations manquantes.

## 3. Choisir le voyage mis en avant

Choix automatique déterministe, parmi les voyages visibles selon les filtres actuels et dont les métadonnées nécessaires sont disponibles :

1. Voyage dont les dates comprennent aujourd’hui, hors annulé/terminé. Un départ passé sans retour peut entrer dans ce groupe, en gardant la mention de durée inconnue.
2. Sinon, prochain départ futur.
3. Sinon, voyage aux dates passées ou explicitement terminé le plus récent, si une date permet de les ordonner.
4. Sinon, aucune carte de compteur ; les cartes ordinaires gardent leur indication « Dates à préciser ».

Pour plusieurs voyages en cours, privilégier le départ le plus récent ; pour une égalité, utiliser un identifiant stable. Si les dates ne permettent aucune sélection sûre, laisser la grille normale et le choix manuel plutôt qu’inventer un ordre temporel.

Les carnets possédés sont éligibles. Un carnet partagé n’est sélectionné automatiquement que si la participation existante est confirmée ; le simple rôle lecteur/éditeur ne suffit pas. Ne pas proposer de confirmer automatiquement une participation pour afficher un compteur.

Prévoir une commande discrète « Choisir le voyage » pour les autres voyages éligibles. En V1, ce choix peut rester **en mémoire pour la session de l’accueil** ; préciser qu’il revient au choix automatique après rechargement. Le réinitialiser lors d’un changement de compte, révocation, suppression ou filtre rendant le voyage indisponible. Aucune nouvelle préférence persistante ou migration nécessaire.

Respecter les droits : consulter le compteur ne donne aucun droit d’édition. Ne pas charger tous les carnets distants pour calculer la carte ; utiliser les résumés disponibles. Les actions ouvrent le carnet par le mécanisme existant, avec ses états de chargement et ses erreurs.

**Sortie :** sélection stable, compréhensible, sans apparition d’un carnet caché par les filtres ou appartenant à un ancien compte.

## 4. Intégrer la carte et ses raccourcis

Conserver le style actuel et les variables de thème. Le chiffre principal attire le regard, mais la carte ne doit pas repousser la liste des voyages hors du premier écran sur un téléphone courant. Éviter une nouvelle pile de blocs compte/introduction/couverture avant le contenu utile.

- Avant : nom, couverture existante si pertinente, J−N, date et durée connue. Action vers le carnet et son parcours de préparation existant.
- Pendant : jour X/Y ou jour X. Action vers Maintenant. Afficher ville/activité seulement si les données sont déjà accessibles et la journée non ambiguë ; sinon « Ouvrir le programme du jour » sans inventer de destination.
- Après : titre et action vers le parcours existant de souvenirs. Si aucun souvenir n’est enregistré, un état vide accueillant reste utile ; ne pas prétendre qu’il existe des photos.
- Plusieurs journées correspondant à aujourd’hui : laisser la vue Maintenant résoudre le choix ; ne pas afficher arbitrairement la première comme unique programme.
- Les actions fonctionnent aussi sans mascotte et au clavier. Pas de bouton interactif imbriqué dans un autre bouton.

Option visuelle incluse si elle reste simple : une ligne de progression avec un petit oiseau statique. Elle représente les jours calendaires du séjour, pas une position GPS ou l’avancement des activités. Pour Y > 1, positionner l’oiseau de 0 % au jour 1 à 100 % au jour Y ; pour un séjour d’un jour, utiliser un repère fixe. Masquer la ligne si le total est inconnu. L’oiseau décoratif est ignoré des lecteurs d’écran ; « Jour X sur Y » porte l’information.

Pas de nouvelle animation perpétuelle, de clignotement ou de deuxième mascotte flottante. Respecter mouvement réduit, palettes et contrastes. Limiter les grands chiffres et titres avec des tailles fluides, sans tronquer l’information essentielle.

**Sortie :** carte, badges et rappel dans le carnet utilisables sur mobile et bureau, sans modifier la structure des données.

## 5. Actualiser et traduire

- Recalculer à l’ouverture, après changement des dates/statuts, au retour de l’onglet au premier plan et après passage au jour suivant.
- Réutiliser une horloge partagée si elle existe. Sinon, un contrôle léger au maximum chaque minute quand la page est visible suffit pour détecter le changement de date ; éviter un intervalle par carte et arrêter les écouteurs/timers au démontage.
- Ne pas utiliser une alarme fixe de 24 heures supposant des journées identiques. Tester le changement de date et le retour après une longue suspension.
- Ajouter les textes FR/EN/ZH-CN/ES via le système existant ; gérer singulier/pluriel et dates locales. « J−42 » peut devenir un libellé plus naturel dans les autres langues.
- Fournir un texte accessible complet, par exemple « Départ dans 42 jours ». Aucun `aria-live` répétitif sur tous les compteurs.
- Calcul sans réseau ; aucune télémétrie, API ou dépendance externe ajoutée pour cette fonctionnalité.

## 6. Vérifier selon le risque réel

Suivre les nouvelles règles de `AGENTS.md` : tests ciblés, puis types/lint pertinents. Aucun gate global automatique pour ce lot de présentation et de calcul local tant qu’il ne touche pas transversalement persistance/synchronisation/sauvegardes. En cas d’élargissement indispensable à ces contrats, expliquer le besoin et adapter les contrôles.

### Tests de logique

- J−42, veille, départ, milieu, retour, lendemain ; séjour d’un jour.
- Mois/année différents, 29 février, transition heure d’été/hiver, instant proche de minuit donnant deux dates selon le fuseau.
- Départ/retour absents ou invalides, fin avant départ, fuseau absent/invalide.
- Annulé et terminé ; statut préparation conservé lorsque les dates passent.
- Sélection automatique, égalités, filtres, participation partagée et choix manuel invalidé.

### Tests d’interface ciblés

- Accueil avant/pendant/après avec horloge contrôlée et données fictives ; actions vers les bons carnets/parcours.
- Recalcul après modification de dates et retour de visibilité ; pas d’écriture des nombres calculés dans le carnet.
- Navigation clavier du choix de voyage et des actions ; affichage lecteur sans commande d’édition.
- Contrôle d’isolation lors d’un changement d’espace/compte ; aucune sélection conservée vers un carnet devenu inaccessible.
- Revue visuelle 320/390 px et bureau, clair/sombre, textes longs et quatre langues. Vérifier les chevauchements avec la mascotte et la navigation fixe.
- Un contrôle hors ligne ciblé de l’affichage et des actions disponibles sur carnet déjà chargé ; ne pas relancer toutes les suites PWA/sauvegardes pour cela.

Utiliser les outils et conventions déjà présents ; éviter de nouveaux tests répétant simplement l’implémentation. Regrouper les contrôles après les changements cohérents, sans les relancer si rien ne les invalide. Un téléphone émulé ne constitue pas une validation iPhone physique.

## Skills à utiliser si disponibles

- `concise-planning` : déroulement borné et critères de fin.
- `frontend-design` : hiérarchie de la carte dans l’interface existante, sans refonte globale.
- `web-design-guidelines` : lecture, clavier, responsive et états d’erreur.
- `vercel-react-best-practices` : calcul dérivé, chargement et cycle de vie des écouteurs.
- `verify-and-stop` : vérifications proportionnées et arrêt au périmètre demandé.

Lire leur `SKILL.md` dans le catalogue de l’environnement ; signaler un skill indisponible sans prétendre l’avoir appliqué. Les instructions utilisateur et les règles actuelles du dépôt prévalent. Aucun skill de déploiement nécessaire.

## Livraison et critères de sortie

Créer `docs/development/compteur-voyage/RAPPORT.md` contenant : comportement livré, règles de dates/statuts, fichiers modifiés, captures avant/pendant/après sur mobile et bureau, tests exécutés avec résultats, limites et retour arrière.

La livraison est prête lorsque :

- les trois phases et les données manquantes ont une présentation honnête ;
- les compteurs sont calendaires, cohérents avec les fuseaux et actualisés sans rechargement manuel obligatoire ;
- les actions ouvrent les parcours existants et respectent les droits ;
- les filtres et participations sont respectés ;
- aucune date, activité, présence réelle ou durée inconnue n’est inventée ;
- aucun statut du carnet, contrat d’export ou choix partagé n’est modifié automatiquement ;
- les contrôles ciblés sont documentés, les changements préexistants préservés ;
- commit et PR éventuels restent limités au lot, conformément au guide de collaboration ; aucune publication ou modification distante sans demande explicite.

Ne pas enchaîner sur des notifications, des scores de préparation ou le chantier typographique. Remettre la fonctionnalité locale vérifiée et le rapport.
