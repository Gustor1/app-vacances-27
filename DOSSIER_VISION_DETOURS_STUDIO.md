# Détours Studio — Vision, validation et premiers contacts

Date : 11 octobre 2026. Document de réflexion et de recherche, pas une spécification validée ni une autorisation d’implémentation. Aucun prospect n’a été contacté. Les fonctionnalités proposées restent des hypothèses.

## 1. Ce que Détours est déjà

« Hébergeur de planning » décrit le stockage, mais sous-estime l’usage. Je le positionnerais comme un **carnet de voyage interactif et collaboratif, utilisable sur place même hors ligne** : programme, carte, réservations, adresses, budget et outils pratiques réunis autour du voyage.

Le README courant présente ces usages ; cela ne constitue pas un nouvel audit de chaque fonctionnalité ni de la version publiée. Les récaps et notifications discutés précédemment ne sont pas considérés livrés sans vérification du code et des essais.

La nouvelle proposition peut devenir l’atelier de préparation en amont :

**Détours Studio : concevoir, vérifier et ajuster le voyage. Détours : l’emporter, le partager et le vivre.**

« Détours Studio » est un nom de travail, sans vérification de marque ou de disponibilité.

Deux expériences peuvent être pertinentes, mais ne nécessitent pas immédiatement deux comptes, deux bases et deux systèmes de synchronisation. Garder une marque cohérente et un format de voyage commun ; décider du découpage technique après validation du marché. Ne pas restructurer le dépôt maintenant.

## 2. Avis critique et recommandation

L’idée est ambitieuse et cohérente avec l’existant. La partie la plus difficile n’est pas de produire un programme qui semble agréable : c’est de le rendre réalisable, modifiable, sourcé et utilisable après les réservations.

Le concept « assistant IA + itinéraire + application voyageur » ne suffit pas à différencier le produit. Travefy propose déjà un éditeur d’itinéraires, de l’import assisté par IA, une bibliothèque réutilisable et une application client avec accès hors connexion. C’est un repère concurrentiel observé, pas un test comparatif ni une validation de ses promesses. [Source officielle](https://travefy.com/products/itinerary)

**Recommandation : tester d’abord un outil pour les créateurs de voyages sur mesure, avec le voyageur comme utilisateur final de Détours.** Commencer par les travel planners indépendants et petites agences, sans supposer que leurs besoins sont identiques. Vérifier s’ils paient pour la recherche, la production du carnet, les modifications ou autre chose.

Le premier cas à tester : transformer leurs documents et connaissances en carnet propre, réutilisable et ajustable. C’est plus borné qu’un organisateur mondial autonome, exploite Détours et permet de mesurer le gain. Ce n’est pas une preuve que l’import soit leur problème prioritaire : les entretiens doivent pouvoir invalider cette hypothèse.

Conserver le grand public dans la vision, mais ne pas construire dès le départ deux offres complètes. Les particuliers peuvent servir de groupe de comparaison : leurs difficultés et leur fréquence d’usage peuvent être très différentes.

## 3. Conserver, améliorer, différer

| Note initiale | Avis | Proposition |
|---|---|---|
| Décrire le voyage dans un chat | Conserver | Chat pour exprimer et ajuster ; aperçu structuré du programme en parallèle |
| Vols, hôtels, activités, transports, repas | Conserver comme vision | Commencer sur un périmètre géographique et quelques types de voyages |
| Budget faible/modéré/élevé | Améliorer | Niveau de confort plus montant, devise, nombre de voyageurs et vols inclus ou non |
| « Pas de budget » | Retirer comme libellé ambigu | « Budget à définir » |
| « Pas de limite mais raisonnable » | Reformuler | « Priorité à l’expérience », puis demander les arbitrages et un plafond d’alerte |
| Bonus, restaurants, spots photo, shopping | Conserver | Réserve d’envies distincte des activités réellement programmées |
| Guides et comptes locaux | Conserver avec contrôle | Liens vérifiés, langue et spécialité, raison de la recommandation, date de recherche |
| Import d’un programme existant | Priorité de test | Aperçu et correction avant création du carnet ; pas d’import silencieux |
| Créer tout automatiquement | Différer | Co-construction, points d’incertitude et validation avant publication au voyageur |
| Réserver directement vols et hôtels | Différer | Liens externes et suivi des choix au départ ; ne pas devenir une billetterie par défaut |
| Toutes les agences et tous les particuliers | Réduire au départ | Une cible prioritaire issue des entretiens |

Le budget doit distinguer les préférences : hôtel simple et repas ambitieux, ou l’inverse. Un seul curseur de luxe ne décrit pas un voyage.

Informations de brief importantes : dates/flexibilité, départ, voyageurs et âges utiles, envies, incontournables, exclusions, rythme, autonomie, mobilité/accessibilité, réservations déjà faites. Ne demander que ce qui change réellement les propositions ; les champs restent visibles et modifiables sans devoir relire le chat.

## 4. Expérience cible à explorer

Trois entrées : « J’ai une idée », « J’ai déjà un programme », « Je repars d’un voyage modèle ». Elles alimentent le même voyage structuré.

Parcours hypothétique : brief → deux ou trois orientations argumentées → choix → journées et carte → contrôle de faisabilité et budget → corrections → publication dans Détours.

Le chat doit proposer des changements limités. Exemple : « Réduis le budget de 15 % sans changer les hôtels déjà réservés » produit un avant/après, un effet estimé sur le prix et les compromis. Il ne remplace pas tout le voyage. Permettre de verrouiller dates, réservations ou activités importantes.

Pistes de différenciation à tester :

- **Traçabilité :** chaque information opérationnelle importante a une provenance et une date de vérification ; « estimé », « consulté », « réservé » restent distincts.
- **Faisabilité :** détecter journées trop chargées, détours, fermeture connue, correspondance impossible ou heure incohérente ; signaler ce qui reste inconnu.
- **Mémoire de l’agence :** réutiliser ses propres étapes et fournisseurs, sans mélanger ses données avec celles d’une autre agence.
- **Modifications contrôlées :** conserver les éléments validés et rendre les compromis visibles.
- **Passage au terrain :** le résultat devient directement un carnet Détours utilisable, avec noms locaux, adresses, alternatives et informations pratiques.

Ajouter quelques bons bonus pertinents plutôt qu’une liste interminable. Une activité bonus n’est ni réservée, ni incluse dans le temps disponible, ni automatiquement comptée comme dépense certaine.

Pour une agence, séparer le brouillon interne de la version publiée au client. Les notes internes, coûts fournisseurs et éventuelles marges ne doivent jamais apparaître dans le carnet voyageur. Définir ensuite les droits de modification et le traitement d’une correction du client ; ne pas laisser une nouvelle publication écraser ses annotations.

## 5. Faisabilité technique : principes, pas architecture définitive

Le modèle IA propose et synthétise. Les outils recherchent les faits. Des règles déterministes vérifient dates, durées, budget et cohérence. L’utilisateur ou le professionnel approuve les décisions importantes.

Ne pas laisser l’IA écrire directement un état libre dans le stockage Détours. Utiliser un format versionné validé, un aperçu d’import, les références sources, la gestion des doublons et une reprise en cas d’interruption. Réutiliser les formats et validateurs existants après inspection. La présence d’un export JSON ne prouve pas qu’un import PDF fiable existe.

Prioriser texte collé et un format PDF raisonnablement borné pour un prototype, avec indication des champs incertains. Ajouter OCR, scans complexes et multiples pièces jointes seulement si les vrais dossiers les exigent. Ne jamais inventer un numéro de réservation manquant.

Hypothèses non fonctionnelles pour les premiers pilotes :

- Quelques professionnels et quelques dizaines de dossiers, pas une infrastructure mondiale.
- Temps de traitement mesuré et progression visible ; aucune promesse de programme complet en quelques secondes avant mesure.
- Isolation stricte des agences et clients ; documents minimisés/anonymisés pendant les essais et suppression maîtrisée.
- Sources web et documents traités comme des données non fiables, jamais comme des instructions pour l’agent ou une autorisation d’action.
- En cas d’API indisponible, conserver les données acquises, signaler les éléments non vérifiés et permettre la reprise.
- Budget d’appels par dossier, limites de régénération, journal technique sans données sensibles et adaptateurs remplaçables.
- Éviter une équipe d’agents autonomes complexe au départ : un workflow instrumenté suffit pour mesurer les besoins.

Le coût d’un dossier comprend IA, recherche web, lieux/trajets, fournisseurs, extraction documentaire, infrastructure et assistance humaine. Mesurer aussi les révisions ; le premier brouillon seul sous-estime le coût réel.

## 6. API : présélection au 11 octobre 2026

Découverte via le [catalogue public-apis](https://github.com/public-apis/public-apis), puis consultation de sources officielles. Ce sont des candidats, pas des intégrations validées. Aucun compte créé, clé obtenue ou appel authentifié exécuté. Authentification, quotas contractuels, restrictions de réutilisation, couverture par destination et CORS restent à tester pour le service retenu. Les clés des outils de recherche restent côté serveur ; ne pas compter sur CORS pour protéger un secret.

| Besoin | Candidat | Informations vérifiées et conditions | Place dans un prototype |
|---|---|---|---|
| Recherche de sources web et guides | Tavily | Tarification en crédits : 1 000/mois gratuits affichés, puis 0,008 USD/crédit à l’usage ; recherche simple 1 crédit, avancée 2. Clé et quotas effectifs à vérifier avec le compte | Candidat à tester ; fournit des sources à vérifier, pas une garantie d’exactitude |
| Géocodage, lieux, trajets | Geoapify | Offre affichée : 3 000 crédits/jour, jusqu’à 5 requêtes/s ; forfait 10 000 crédits/jour à 59 USD/mois. Attribution et licence des usages à vérifier | Premier candidat pour un essai sur la carte existante ; couverture des lieux à comparer sur des voyages réels |
| Informations détaillées sur les lieux | Google Places | Restrictions de stockage/cache, exceptions notamment pour les identifiants de lieux, règles d’attribution | Candidat comparatif ; vérifier explicitement l’affichage avec Leaflet, l’export et le mode hors ligne avant de retenir |
| Vols et offres | Duffel | API d’offres et réservation ; frais affichés par commande et recherches excédentaires au-delà du ratio 1 500 recherches/commande | Plus tard ; confirmer que le contrat convient à un usage de planification sans réservation |
| Hébergements | Booking.com Demand API | Accès soumis au parcours de partenariat et contrat ; identifiants partenaire/affilié et authentification API | Ne pas en faire une dépendance bloquante du MVP |
| Activités réservables | Viator Affiliate API | Plusieurs niveaux d’accès ; fonctionnalités et qualification dépendent du niveau | Plus tard ou liens partenaires autorisés ; ne remplace pas la recherche de lieux gratuits |
| Météo proche du départ | Open-Meteo | Offre gratuite non commerciale ; abonnement commercial avec clé sur endpoint dédié ; attribution requise | Utile pour l’accompagnement, pas pour prévoir le temps exact plusieurs mois à l’avance |

Sources détaillées : [Tavily](https://docs.tavily.com/documentation/api-credits), [Geoapify tarifs](https://www.geoapify.com/pricing/), [Geoapify exemple de routage](https://apidocs.geoapify.com/docs/routing/), [Google Places règles](https://developers.google.com/maps/documentation/places/web-service/policies), [Duffel tarifs](https://duffel.com/pricing), [Duffel guide d’intégration](https://duffel.com/docs/guides/getting-started-with-flights), [Booking prérequis](https://developers.booking.com/demand/docs/getting-started/prerequisites), [Booking authentification](https://developers.booking.com/demand/docs/development-guide/authentication), [Viator accès](https://partnerresources.viator.com/travel-commerce/levels-of-access/), [Open-Meteo licence et tarifs](https://open-meteo.com/en/pricing).

Les montants sont des relevés de pages publiques, pas des devis, et doivent être revérifiés avant engagement. Ne pas présumer qu’une API de routage fournisse des horaires réels de trains/ferries partout. Pour chaque destination, différencier géométrie routière, estimation de trajet et transport effectivement réservable. La couverture Chine notamment exige un essai spécifique ; une API mondiale ne suffit pas à la prouver.

Le choix du modèle de langage doit venir d’un petit benchmark sur les mêmes dossiers : qualité d’extraction, respect du format, erreurs, temps et coût. Aucune nécessité de choisir un fournisseur définitivement maintenant. Comparer ensuite les politiques de traitement des documents clients.

## 7. Modèle économique : hypothèses à tester

Pour les professionnels : abonnement avec volume de dossiers inclus et supplément explicite si nécessaire. Valeur à démontrer : temps économisé après correction, qualité du livrable et facilité des changements. Éviter une promesse « IA illimitée » sans coût maîtrisé.

Pour les particuliers : tester une offre par voyage avant de supposer un abonnement mensuel ; la préparation peut être occasionnelle. Le carnet déjà créé doit rester accessible selon une règle claire après la fin d’une offre payante.

Ne pas compter sur l’affiliation comme seul modèle initial. Une commission ne doit pas dicter les recommandations ; signaler les liens commerciaux et proposer les options pertinentes non affiliées.

Ne pas fixer le prix à partir du seul coût technique. Interroger les solutions déjà payées, le volume de dossiers et le temps économisable. Les obligations associées à la vente/réservation et au traitement des données devront faire l’objet d’une vérification dédiée avant ouverture commerciale ; ce dossier n’est pas une analyse juridique.

## 8. Recherche terrain : apprendre avant de présenter la solution

Objectif de départ proposé : 8 à 12 entretiens professionnels, dont indépendants, petites agences sur mesure et réceptifs locaux ; en complément, 5 particuliers ayant récemment préparé un voyage complexe. Échantillon exploratoire, non représentatif.

Ne pas demander d’emblée « Voulez-vous de l’IA ? ». Faire raconter un dossier récent, observer les outils et mesurer le travail avant de présenter Détours. Une réaction enthousiaste ne prouve ni l’adoption ni le paiement.

### Trame d’entretien de 20 minutes

1. Pouvez-vous raconter votre dernier voyage sur mesure, de la demande initiale à l’envoi du carnet ?
2. Quelles étapes ont pris le plus de temps ? Combien approximativement, et sur combien de dossiers par mois ?
3. Quels outils utilisez-vous réellement pour la recherche, les devis, le programme et l’envoi au client ?
4. Où recopiez-vous les mêmes informations ? Entre quels outils ou documents ?
5. Quelle modification récente d’un client vous a demandé le plus de travail ? Pourquoi ?
6. Que réutilisez-vous d’un dossier à l’autre : adresses, journées, fournisseurs, textes ? Comment ?
7. Quelles erreurs sont les plus pénibles à détecter ou corriger ? Quelles informations vérifiez-vous vous-même ?
8. Comment vos clients consultent-ils le programme pendant le voyage ? Que vous redemandent-ils régulièrement ?
9. Utilisez-vous déjà une IA ? Pour quelles tâches précises ? Qu’avez-vous essayé puis abandonné ?
10. Quelles données ou décisions ne confieriez-vous pas à un outil externe ? Quelles intégrations seraient indispensables ?
11. Quelle amélioration justifierait de changer d’outil ou de payer davantage ? Qui décide et qu’est-ce qui est déjà budgété ?
12. Accepteriez-vous de tester sur un ancien dossier anonymisé, puis de comparer temps, corrections et résultat ?

Si le temps manque : questions 1 à 5, puis 8, 9 et 12. Ne pas envoyer les douze questions dans le premier email.

Fiche à remplir après entretien : profil ; dossiers/mois ; outils ; problème observé ; fréquence ; temps ; coût de l’erreur ; citation autorisée ; décisionnaire ; contrainte de migration ; intérêt pour un essai ; exemple anonymisé obtenu ; hypothèse invalidée ; prochaine action acceptée.

Demander l’accord avant enregistrement ou conservation d’un document. Ne pas utiliser les dossiers d’une agence pour enrichir les recommandations d’une autre.

## 9. Première liste de contacts francophones

Hypothèse de recherche : France et professionnels francophones, faute de région précisée. Coordonnées professionnelles publiées sur les sites officiels consultés le 11 octobre 2026. Elles n’ont pas été testées par appel ou envoi. Ce ne sont pas des prospects ayant exprimé un intérêt. Les formulaires constituent une solution lorsqu’aucun email adapté n’est publié.

| Organisation et profil | Contact public | Pourquoi l’interroger / priorité | Source |
|---|---|---|---|
| Agence 1994 — travel planner indépendante, Charente | 1994.agence@gmail.com ; 06 79 31 16 55 | Priorité 1 : production de carnets et organisation sur mesure. Se présente comme travel planner, à ne pas assimiler automatiquement à une agence de réservation | [Site officiel](https://www.agence1994.fr/) |
| Finding France — agence réceptive, voyages privés en France | bonjour@findingfrance.fr ; +33 1 84 80 13 80 | Priorité 1 : coordination locale et personnalisation ; demander la personne chargée de concevoir les programmes | [Contact officiel](https://finding-france.com/fr/contact/) |
| Shanti Travel — voyages sur mesure Asie/Amérique, contact Paris | +33 1 82 28 92 28 ; formulaire, email général non confirmé | Priorité 2 : conception avec experts locaux et dossiers complexes ; demander production ou opérations | [Contact officiel](https://www.shantitravel.com/fr/contact) |
| Nomadays — réseau d’agences locales | +33 1 59 16 97 74 ; formulaire privilégié | Priorité 2 : transmission entre plateforme, agence locale et voyageur ; leur page demande d’utiliser téléphone/formulaire | [Contact officiel](https://www.nomadays.fr/contact) |
| Continents Insolites — voyages sur mesure, France | +33 4 72 53 24 90 ; email adapté non confirmé | Priorité 3 : comprendre un fonctionnement plus structuré, pas nécessairement un premier pilote accessible | [Coordonnées officielles](https://www.continents-insolites.com/mentions-legales) |

Attention de recherche : une ouverture de la page TraceDirecte a redirigé vers Double Sens, tandis que les résultats de recherche affichaient encore d’autres coordonnées. Ce contact n’est pas retenu sans clarification. Ne pas prendre une adresse d’assurance ou de développement durable pour le contact commercial général.

Cette liste de cinq profils est un point de départ ; la compléter avec 5 à 10 indépendants de la région ou spécialité choisie. Commencer par des échanges individuels et personnalisés, pas une campagne de masse. Une relance courte après environ une semaine peut être préparée ; arrêter si refus. Aucun envoi n’est autorisé par cette préparation.

## 10. Email prêt à personnaliser

**Objet : Votre manière de préparer les voyages sur mesure — échange de 20 min ?**

Bonjour [Prénom / équipe],

Je développe Détours, un carnet de voyage numérique qui rassemble le programme, les adresses et les informations utiles pendant le séjour.

Je réfléchis maintenant à des outils pour faciliter la préparation des voyages et les modifications de programmes. Avant de construire cette partie, je cherche à comprendre le travail concret des professionnels : les outils que vous utilisez, les tâches répétitives et ce qui vous prend le plus de temps.

[Phrase personnalisée et vérifiée : Votre activité de voyages privés sur mesure en France m’intéresse particulièrement pour comprendre la coordination des étapes et des prestataires.]

Seriez-vous disponible pour un échange de 20 minutes ? J’aimerais aussi comprendre si vous utilisez déjà l’IA, ce qui vous aide réellement et ce que vous préférez garder entièrement sous votre contrôle.

Il s’agit d’un échange exploratoire, sans démonstration commerciale ni engagement. Un exemple anonymisé de votre méthode suffit ; aucun dossier client confidentiel n’est nécessaire.

Si ce sujet relève d’une autre personne dans votre équipe, pourriez-vous m’orienter vers elle ?

Merci,

[Prénom Nom]
[Téléphone facultatif]

Ne pas prétendre faire une étude universitaire ou neutre : le projet produit est annoncé. Ne pas promettre que l’outil ne changera aucun métier ; parler honnêtement de réduction du travail répétitif et de contrôle professionnel.

### Introduction téléphonique

« Bonjour, je m’appelle [Prénom]. Je développe un carnet de voyage numérique et je cherche à comprendre comment les professionnels préparent et modifient leurs programmes. Je ne vous appelle pas pour vous vendre un abonnement. Qui serait la bonne personne pour un échange de 15 à 20 minutes sur vos outils et les tâches qui prennent du temps ? »

### Variante asynchrone si aucun rendez-vous n’est possible

« Si vous préférez répondre par email : quelle étape vous prend le plus de temps ; quels outils utilisez-vous ; utilisez-vous déjà une IA et, si oui, pour quoi ? Même quelques lignes m’aideraient. »

## 11. Plan d’action proposé

Les périodes ci-dessous sont des fenêtres d’essai, pas des délais de livraison garantis. Adapter à la disponibilité des interlocuteurs.

| Étape | Action | Livrable / condition de passage |
|---|---|---|
| 1 — Clarifier la cible | Comparer travel planners, petites agences et particuliers ; analyser leurs outils actuels | Choisir un premier problème et un acheteur identifiable |
| 2 — Entretiens, environ 2 semaines | Personnaliser les prises de contact puis conduire 8 à 12 entretiens pro et quelques particuliers | Problèmes observés et dossiers anonymisés, pas seulement souhaits de fonctionnalités |
| 3 — Expérience manuelle, environ 1 semaine | Transformer 3 dossiers réels avec les outils disponibles et Détours ; mesurer chaque étape | Référentiel de qualité, temps initial/correction, erreurs et valeur perçue |
| 4 — Prototype ciblé | Automatiser uniquement la tâche ayant montré un gain : import, révision ou préparation | Parcours de bout en bout, publication contrôlée vers un carnet de test |
| 5 — Pilotes | 3 professionnels sur plusieurs dossiers, avec offre de pilote explicite | Utilisation répétée, mesure des gains et engagement commercial concret |
| 6 — Décider | Comparer valeur, corrections, coûts et volonté de payer | Approfondir, changer de cible/problème ou arrêter cette piste |

Seuils de décision proposés, à choisir avant les essais :

- Au moins 5 interlocuteurs d’un même segment décrivent un problème récurrent comparable sans qu’on le leur suggère.
- Au moins 3 acceptent de fournir un cas anonymisé ou de tester réellement.
- Sur 10 dossiers tests, viser au moins 30 % de gain de temps médian après corrections humaines, avec aucune erreur critique laissée dans le livrable final. Une erreur critique inclut une date/réservation inventée ou des informations d’un autre client.
- Mesurer les échecs d’extraction et les corrections, pas seulement les dossiers réussis.
- Au moins 2 pilotes souhaitent poursuivre sous une offre payante concrète ; distinguer parole, accord écrit et paiement effectif.
- Le revenu envisagé couvre les coûts variables mesurés et le support ; ne pas conclure à la rentabilité avec le seul coût de génération.

Si ces signaux ne sont pas présents, revoir le problème plutôt que rajouter des fonctionnalités. Si les agences sont déjà satisfaites de leur outil de carnet, explorer une brique complémentaire de contrôle ou d’import au lieu d’imposer une migration totale.

## 12. Ce qui reste à décider

Première décision produit : souhaite-t-on tester en priorité un outil de travail pour les professionnels, ou un planificateur autonome pour les particuliers ? Ma recommandation actuelle va au premier, avec un problème étroit et Détours comme livrable voyageur ; elle doit être confrontée aux entretiens.

Questions ultérieures : destination pilote, disponibilité pour les entretiens, budget mensuel maximal d’expérimentation, accès aux premiers utilisateurs, droit de conservation des contenus tiers et format exact de transmission à Détours. Aucune architecture définitive, tarification commerciale ou nouvelle application n’est validée par ce document.

## 13. Wikidata et données ouvertes — piste complémentaire

Wikidata est une base de connaissances structurée, accessible par plusieurs interfaces dont SPARQL. Candidat utile pour identifier monuments, musées, temples et autres lieux culturels : identifiant stable, catégories, coordonnées, noms multilingues et liens externes selon les données disponibles. Cela peut aider à rapprocher plusieurs noms du même lieu et enrichir les bonus.

Ses données structurées sont publiées sous CC0. Cette licence ne s’étend pas automatiquement aux articles Wikipédia ni aux photos liées : vérifier chaque contenu réutilisé. [Accès officiel](https://www.wikidata.org/wiki/Wikidata:Data_access), [licence officielle](https://www.wikidata.org/wiki/Wikidata:Licensing).

Positionnement proposé : socle d’identification et de découverte culturelle, complété par des sources opérationnelles. Ne pas en faire la preuve d’un horaire actuel, d’un tarif, d’une disponibilité ou de l’exhaustivité des restaurants. La qualité et les champs disponibles doivent être mesurés, destination par destination.

Le service public de requêtes impose des limites et peut retourner des erreurs ou délais dépassés. Utiliser des requêtes bornées, cache approprié, reprises limitées et solution de repli ; ne pas lancer une grande requête SPARQL pour chaque message de chat. [Limites documentées](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/query_limits).

Test proposé : Paris, Kyoto et Shanghai ; échantillon prédéfini de 20 lieux par ville, incluant lieux célèbres et lieux moins connus. Mesurer taux de correspondance, coordonnées, noms locaux, catégories, doublons, champs manquants et temps de réponse. Comparer Wikidata à une autre source sur les mêmes lieux. Ces tests ne sont pas exécutés dans ce dossier.

OpenStreetMap, Wikipédia et Wikimedia Commons sont d’autres pistes à étudier séparément, avec leurs licences et conditions d’accès propres. Ne pas assimiler « données ouvertes », « service gratuit illimité » et « droit de copier tout contenu associé ».

## 14. Étudier les applications existantes

Oui à une analyse approfondie des comportements observables : onboarding, collecte du brief, création, modifications, carte, sources, budget, imports, exports et carnet final. Un benchmark fonctionnel peut reconstituer les règles visibles sans connaître le code interne.

Choisir 3 à 5 outils après vérification de leur offre actuelle. Tester le même brief et la même demande de modification sur chacun. Distinguer promesse commerciale, comportement testé et hypothèse sur l’implémentation. Une interface ne prouve ni le modèle IA utilisé ni l’architecture interne.

Périmètre de travail proposé : pages publiques, démonstrations et comptes de test autorisés. Ne pas copier du code ou des contenus propriétaires, contourner des protections, extraire des secrets ou faire dépendre Détours d’une API privée non autorisée. Pour un projet open source, vérifier sa licence avant de réutiliser du code. Ce périmètre est une consigne de projet, pas une analyse juridique générale du reverse engineering.

Livrable utile : tableau de preuves avec date, scénario, captures si autorisées, résultat, limites d’accès, forces/faiblesses et opportunité spécifique pour Détours. Éviter un simple inventaire de fonctionnalités.

## 15. Missions prêtes à déléguer à l’IA

Ces missions sont proposées ; leur inscription ici ne signifie pas qu’elles ont été exécutées. Elles peuvent commencer sans attendre tous les entretiens. L’envoi de messages, les inscriptions engageantes, les achats et l’utilisation de dossiers clients nécessitent leur autorisation spécifique. L’IA n’invente jamais une réponse d’agence ni un résultat d’essai manquant.

| Mission | Travail délégable | Livrable et preuve attendue | Intervention humaine |
|---|---|---|---|
| A — Concurrence | Rechercher 3 à 5 outils, comparer sur le même cas, analyser les parcours accessibles | Tableau sourcé ; testé vs annoncé ; 3 opportunités à vérifier | Fournir un compte de test si nécessaire, choisir le positionnement |
| B — API et données ouvertes | Étudier et tester Wikidata puis les candidats de la section 6 ; mesurer couverture, latence et coût | Requêtes/scripts reproductibles, résultats datés, champs absents, licence/cache/export, recommandation conditionnelle | Autoriser les comptes/coûts nécessaires ; les parties sans accès restent explicitement non testées |
| C — Prospection préparatoire | Compléter à 15 contacts professionnels, vérifier les coordonnées, segmenter et personnaliser les brouillons | Liste dédupliquée avec sources et date, 5 emails individualisés, suivi prêt à remplir | Choisir les destinataires et autoriser/envoyer les messages |
| D — Import Détours | Inspecter les formats/validateurs réels et essayer des plannings synthétiques dans un prototype isolé | Mapping des champs, pertes/incertitudes, aperçu, tests d’import sans données personnelles | Valider les arbitrages ; fournir plus tard des exemples anonymisés autorisés |
| E — Prototype de parcours | Après choix d’un cas d’usage, créer une maquette chat + planning + modification + aperçu de publication | Démonstration sur données fictives, limites visibles ; aucune fausse prétention d’API live | Tester le parcours et décider si le développement mérite de continuer |
| F — Synthèse des entretiens | Analyser les notes réellement obtenues, regrouper les problèmes et contradictions | Matrice fréquence/gravité/solutions actuelles et liens vers les preuves | Conduire ou superviser les échanges ; trancher les décisions produit |
| G — Économie du pilote | Calculer des scénarios à partir des appels mesurés et offres fournisseurs vérifiées | Coût par dossier et révision, temps de support, sensibilité aux volumes | Définir le budget d’essai et tester la volonté de payer |

Ordre recommandé : A, B, C et inspection D peuvent avancer indépendamment. E dépend du cas d’usage choisi ; F dépend des entretiens ; G devient crédible après B et les premiers dossiers. Les résultats convergent vers une décision MVP, puis seulement vers un plan d’implémentation détaillé.

### Prompt — recherches produit et concurrence

> Lis ce dossier et exécute la mission A. Vérifie l’offre actuelle de 3 à 5 applications pertinentes. Compare un même voyage fictif et une demande de modification préservant une réservation. Utilise uniquement les accès autorisés. Sépare comportements testés, documentation et hypothèses. Livre les sources datées, limites, forces/faiblesses et trois différenciations possibles pour Détours. Ne développe pas le SaaS et ne contacte personne.

### Prompt — étude Wikidata et API

> Lis les sections 6 et 13 puis exécute la mission B, en commençant par Wikidata sur Paris, Kyoto et Shanghai. Fixe l’échantillon avant de mesurer. Fournis des appels reproductibles et les vrais résultats : couverture, identités, noms locaux, coordonnées, erreurs, latence. Étudie séparément les conditions d’usage commercial, stockage, export et coûts des autres candidats. N’invente aucun test sans accès, ne crée pas de compte payant et ne modifie pas Détours. Conclus sur les sources complémentaires nécessaires.

### Prompt — préparation des contacts

> Exécute la mission C : complète la liste à 15 organisations francophones pertinentes, en distinguant travel planners, agences et réceptifs. Vérifie les coordonnées professionnelles sur leurs sites officiels, déduplique et donne une raison précise de les interroger. Prépare cinq brouillons individualisés à partir du modèle fourni, sans inventer de relation antérieure. Aucun email, appel ou formulaire ne doit être envoyé.

### Prompt — faisabilité de l’import

> Lis les instructions du dépôt et exécute la mission D. Commence par une inspection sans modification des formats, validateurs, imports, sauvegardes et droits. Propose un mapping depuis un planning texte/PDF vers Détours, puis un prototype isolé sur données synthétiques si les instructions du dépôt le permettent. Montre les champs incertains et les informations perdues. Ne change pas l’application existante ni les données distantes. Livre les résultats réellement exécutés et ce qu’il reste à valider.

Le rôle du porteur de projet reste déterminant pour les relations, le choix de cible et les engagements. La recherche, la préparation, les prototypes, les tests et la synthèse sont largement délégables ; il n’a pas à porter seul toutes ces tâches.

## 16. Exemples publics et demande de carnets anonymisés

Recherche effectuée le 11 octobre 2026. Objectif : étudier des formats déjà utilisés par de petits professionnels et préparer des essais de conversion vers Détours. Aucun email envoyé, aucun formulaire soumis et aucun carnet importé dans l’application à ce stade.

### Exemples trouvés et niveau de vérification

| Professionnel | Exemple et accès | Ce qui est réellement vérifié | Utilité / suite |
|---|---|---|---|
| Partez Léger — Marine | [PDF public New York, 26 pages](https://cdnc.heyzine.com/files/uploaded/v3/f26855724a1c86c7c651a0de0dc8885f7092f414.pdf) ; [publication identifiée sur Calaméo](https://www.calameo.com/books/008056634b0bb4e04fc5d) ; [site](https://partezleger.fr/) | PDF ouvert et texte consulté : programme, transports, restaurants, conseils et checklist. Présenté comme un extrait ; ne pas le qualifier de dossier client complet | Premier candidat pour étudier le découpage programme/bonus/pratique et demander un essai de conversion privé |
| Explorations Uniques — Audrey | [Extrait Polynésie sur le site](https://explorationsuniques.com/) | La page présente une galerie annoncée comme un extrait de carnet de trois semaines ; les pages en images n’ont pas été analysées une par une, pas de PDF directement vérifié | Cas intéressant de voyage multiétapes ; demander le PDF de démonstration ou un extrait autorisé |
| La Route d’Oré — Aurélie | [Page présentant le carnet](https://www.laroutedore.fr/) ; [lien AnyFlip public](https://online.anyflip.com/ypnvb/dmxx/index.html) | Le lien est bien publié sur le site officiel, mais AnyFlip a renvoyé une erreur pendant la consultation | Demander une version PDF ; ne pas annoncer le contenu intégral comme consulté |
| Agence 1994 — Fabienne | [Portfolio de carnets réalisés](https://www.agence1994.fr/creations/) | Des créations sont présentées, notamment Japon et Sri Lanka ; aucun PDF intégral récupéré dans cette recherche | Demander un carnet de démonstration ou quelques journées anonymisées |
| Une Vie de Voyage | [Page Votre voyage](https://uneviedevoyage.fr/votre-voyage/) | La page annonce un exemple PDF à feuilleter ; fichier direct non confirmé et page contact inaccessible via l’outil | Piste secondaire ; ne pas inventer une adresse email ou prétendre disposer du fichier |

Ces exemples permettent de comprendre les formats sans attendre les entretiens. Ils ne prouvent ni un besoin commercial ni la robustesse de notre futur importeur. Les contenus historiques ne sont pas des conseils de voyage actuels : conserver la date et ne pas considérer leurs prix, horaires ou formalités comme vérifiés aujourd’hui.

Pour les essais : conserver ici les liens et observations de structure, pas les carnets tiers complets dans ce dépôt public. Demander l’accord avant conversion/republication d’un carnet professionnel ; le site Partez Léger demande explicitement une autorisation pour l’adaptation de ses contenus. En attendant, créer des jeux synthétiques originaux reproduisant les difficultés de format sans recopier les textes et images. Ne pas collecter des dossiers privés exposés accidentellement.

### Contacts spécialisés, prêts pour une demande d’exemple

| Contact | Email professionnel public | Autre contact | Source officielle |
|---|---|---|---|
| Marine — Partez Léger | partezleger@gmail.com | 06 02 18 52 95 | [Site et mentions](https://partezleger.fr/) ; le site affiche aussi contact@partezleger.fr dans certaines rubriques, privilégier l’adresse du bloc contact/éditeur |
| Audrey — Explorations Uniques | contact@explorationsuniques.com | WhatsApp +33 6 01 73 95 04 | [Contact](https://explorationsuniques.com/contact/) |
| Aurélie — La Route d’Oré | laroutedore@gmail.com | Non relevé | [Mentions officielles](https://www.laroutedore.fr/mention-legales) |
| Fabienne — Agence 1994 | 1994.agence@gmail.com | 06 79 31 16 55 | [Portfolio et contact](https://www.agence1994.fr/creations/) |

Coordonnées relevées sur les sites, sans vérification de délivrabilité ni prise de contact. Ce sont des professionnels de la planification indépendante ; ne pas supposer qu’ils vendent ou réservent les prestations touristiques.

### Email 1 — Partez Léger

Destinataire : partezleger@gmail.com

Objet : Votre carnet New York — essai de conversion en carnet interactif ?

Bonjour Marine,

J’ai découvert votre extrait de carnet New York, avec son programme, ses conseils pratiques et ses suggestions de restaurants.

Je développe Détours, une application qui rassemble le planning, la carte et les informations utiles pendant un voyage. J’étudie une fonction permettant de transformer un carnet déjà préparé par un professionnel en version interactive, tout en conservant son travail et ses recommandations.

Accepteriez-vous que je réalise un essai privé à partir de votre extrait public ? Un carnet de démonstration ou quelques pages anonymisées d’un ancien programme conviendraient aussi : je n’ai pas besoin d’un dossier client complet ni de votre fichier source modifiable.

L’objectif serait de vous montrer le résultat et d’identifier ce qui est bien repris, ce qui manque et les corrections nécessaires. Le document ne serait ni publié, ni revendu, ni utilisé pour entraîner un modèle. Si l’essai nécessite un service d’IA externe, je vous en préciserai les conditions avant de lui transmettre le fichier.

Un simple accord pour l’extrait, ou un lien vers un exemple que vous autorisez à utiliser pour ce test, suffirait pour commencer.

Merci pour votre retour,
[Prénom Nom]

### Email 2 — Explorations Uniques

Destinataire : contact@explorationsuniques.com

Objet : Un extrait de carnet pour tester un passage du PDF à l’interactif ?

Bonjour Audrey,

J’ai repéré sur votre site l’extrait de carnet consacré à trois semaines en Polynésie. Ce type de voyage avec plusieurs étapes est particulièrement intéressant pour le projet que je développe.

Détours est un carnet de voyage numérique réunissant programme, carte et informations pratiques. Je cherche à tester comment reprendre un planning déjà conçu par une travel planner, sans lui demander de ressaisir toutes les journées, les hébergements et les trajets.

Seriez-vous d’accord pour partager un PDF de démonstration, ou quelques pages anonymisées, et m’autoriser à en faire une conversion privée de test ? Deux ou trois journées avec un changement d’étape suffiraient. Aucun nom de client, numéro de réservation ou document personnel n’est nécessaire.

Je pourrais ensuite vous montrer le résultat pour recueillir votre avis. Le document ne serait pas publié, revendu ou utilisé pour entraîner un modèle ; l’usage éventuel d’un service d’IA externe serait précisé avant transmission.

Si vous préférez, votre exemple public peut aussi servir de point de départ avec votre accord.

Merci,
[Prénom Nom]

### Email 3 — La Route d’Oré

Destinataire : laroutedore@gmail.com

Objet : Tester la reprise d’un carnet existant dans Détours

Bonjour Aurélie,

J’ai découvert votre offre de carnet de voyage personnalisé et le lien vers votre exemple sur AnyFlip. Je développe Détours, une application de carnet de voyage, et j’étudie la possibilité d’y reprendre un programme existant sans devoir le ressaisir.

Pourriez-vous partager une version PDF de démonstration, ou quelques pages anonymisées d’un ancien carnet, avec votre accord pour un essai privé de conversion ? Un court extrait comportant deux ou trois journées et quelques adresses serait suffisant ; je ne recherche ni données clients ni fichier source modifiable.

Je vous présenterais le résultat pour vérifier si la structure et vos recommandations sont correctement conservées. Le document ne serait ni publié, ni revendu, ni utilisé pour entraîner un modèle. Avant toute transmission éventuelle à un service d’IA externe, je vous préciserai ses conditions d’utilisation.

Si cela vous intéresse, nous pouvons commencer simplement par un échange d’emails.

Merci,
[Prénom Nom]

Pour Agence 1994 : reprendre le troisième email en s’adressant à Fabienne et en remplaçant la référence AnyFlip par son portfolio Japon/Sri Lanka. Ne pas affirmer avoir lu un carnet complet. Ces engagements doivent être respectés par le workflow choisi ; l’accord pour un test ne vaut pas accord pour publier une démonstration ou entraîner un modèle.

### Ce qu’il faut demander et mesurer

Demander en priorité un exemple de démonstration déjà partageable ; sinon 2 à 5 pages anonymisées. Les noms, coordonnées clients, références de réservation, QR codes, liens privés, signatures et données de paiement doivent être retirés avant transmission. Ne pas demander l’accès à leurs comptes Canva, Google Drive ou logiciels métiers.

Pour chaque exemple autorisé : relever format, auteur/source, périmètre de l’accord, date, types de pages, texte sélectionnable ou scan, journées, horaires, lieux, transports, options et liens. Prévoir la suppression du fichier après le test, selon l’accord convenu ; ne pas conserver indéfiniment les originaux.

Comparer ensuite la source à un aperçu Détours : champs corrects, absents, mal classés, doublons, différences entre activité programmée et suggestion, temps de correction. Les données absentes restent absentes. Ne pas corriger silencieusement un ancien programme avec des informations actuelles : extraction fidèle et actualisation sont deux opérations différentes.

### Mission IA supplémentaire — corpus d’import

> Lis la section 16. Vérifie les exemples publics et classe les accès : PDF lisible, galerie, lecteur externe, portfolio ou indisponible. Fais un inventaire des structures sans recopier les carnets dans le dépôt. Prépare trois jeux de test synthétiques originaux : séjour urbain, circuit multiétapes et programme ambigu avec options. Pour chaque jeu, fournis le résultat structuré attendu, les inconnues et les contrôles d’import Détours. Les conversions de carnets professionnels attendent leur accord approprié ; ne contacte personne et ne transmets aucun document client à un service tiers. Rapporte clairement les tests exécutés et les travaux seulement préparés.
