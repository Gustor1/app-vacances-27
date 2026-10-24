# Détours Studio — Missions autonomes pour l’IA

Date de préparation : 11 octobre 2026.
Statut : ordre de mission de recherche, d’évaluation et de prototypage isolé. Ce document ne signifie pas que les missions sont déjà réalisées.

## Prompt de lancement à copier

> Exécute les missions de `MISSIONS_IA_NUIT_DETOURS_STUDIO.md` jusqu’à produire les livrables demandés, dans leur ordre de priorité. Je serai indisponible pendant le travail : avance avec les hypothèses réversibles indiquées et consigne tes questions pour mon retour. Ne t’arrête pas après un plan ou à la première API inaccessible ; passe aux tâches indépendantes. Tu peux utiliser des sous-agents si disponibles, avec des fichiers de sortie distincts et une intégration finale. Ne modifie pas l’application Détours, ne contacte personne, ne crée pas de compte, n’engage aucun coût et ne publie rien. Ne confonds jamais recherche documentaire, test exécuté et prototype simulé. Termine par un rapport `00_LIRE_AU_REVEIL.md`, même si certaines missions restent incomplètes, avec liens vers les résultats, preuves, limites et décisions attendues. Lis aussi `DOSSIER_VISION_DETOURS_STUDIO.md` s’il est fourni ; le présent ordre de mission suffit pour démarrer sinon.

## 1. Objectif et contexte autonome

Détours est une application React/TypeScript/Vite de carnets de voyage : planning, carte, adresses, transports, informations pratiques et usages locaux/hors ligne. Une nouvelle expérience, nom de travail **Détours Studio**, pourrait aider à créer ou adapter ces carnets avec l’IA.

Deux publics sont envisagés : particuliers et professionnels du sur-mesure. La priorité de recherche proposée est celle des travel planners indépendants et petites agences. Ce choix n’est pas encore une décision commerciale définitive.

Hypothèse à tester : reprendre un programme déjà préparé, le structurer et le transmettre dans Détours pourrait faire gagner du temps. Une seconde piste est la construction d’un voyage à partir d’un brief. Ne pas construire tout le SaaS cette nuit : réunir les preuves et un essai limité pour choisir le premier produit.

Questions à résoudre :

1. Que font déjà les concurrents, et quelles difficultés semblent encore mal résolues ?
2. Quelles sources de lieux et API sont réellement accessibles et utiles ?
3. Quelles données Détours sait-il importer, et que perdrait-on avec des documents professionnels ?
4. Quels professionnels pertinents contacter, avec quel message adapté ?
5. Quel petit prototype et quelle expérience terrain permettraient de décider de la suite ?

## 2. Périmètre d’autonomie

### Autorisé

- Recherche sur le web et consultation de documentation publique, avec sources datées.
- Inspection du code local si le dépôt est accessible, en respectant ses instructions.
- Appels de test raisonnables à des services publics sans clé, gratuits pour cet usage et sans engagement.
- Création de documents, tableaux, scripts de recherche et prototypes isolés, sur données fictives uniquement.
- Brouillons de messages, sans aucun envoi ni soumission de formulaire.
- Sous-agents facultatifs : un coordinateur, missions indépendantes, fichiers distincts, pas de changements concurrents sur le dépôt.

### Limites de cette mission

- Aucun changement du produit actuel, de ses données, secrets, dépendances, comptes, service worker ou configuration de déploiement.
- Aucun email, appel, message social, formulaire envoyé, inscription, achat, activation d’abonnement, migration distante, push Git ou déploiement dans cette mission de recherche.
- La permission permanente de publier les changements produit validés sur la bêta ne justifie pas de publier ces recherches, des coordonnées de prospects ou un prototype non validé.
- Ne pas utiliser les identifiants présents sur le poste, même s’ils permettent techniquement d’appeler une API payante.
- Aucun document client réel à transmettre à un service tiers. Ne pas chercher de dossiers privés accidentellement exposés ni copier des carnets tiers dans le dépôt public.
- Pour les concurrents : accès publics et démonstrations accessibles. Pas de contournement d’accès ; un écran marketing ne vaut pas un parcours testé.

### Si quelque chose bloque

Deux essais raisonnables au maximum pour une même erreur technique, puis noter le blocage et avancer ailleurs. Ne pas passer la nuit à contourner un CAPTCHA, obtenir une clé ou attendre un interlocuteur.

Si une question n’affecte qu’un choix réversible, retenir une hypothèse explicite. Si elle conditionne une dépense, une divulgation ou une décision produit majeure, différer uniquement la partie dépendante et préparer les options.

Ne pas attendre artificiellement le réveil ni créer une automation. Le travail s’arrête quand les missions sont terminées ou que les moyens disponibles sont épuisés ; enregistrer régulièrement pour permettre une reprise après interruption.

## 3. Installation du dossier de travail et preuves

Si le dépôt est accessible, lire `AGENTS.md`, `README.md` et `docs/development/COLLABORATION.md`, vérifier branche et statut. Préserver les fichiers non suivis : ils peuvent contenir les dossiers de cette conversation. Ne jamais changer de branche, réinitialiser ou remiser silencieusement le travail d’un autre agent.

Créer un dossier de recherche **extérieur au checkout**, par exemple `../detours-studio-recherche-YYYYMMDD-HHMM/`, sans écraser un dossier existant. Si aucun dépôt n’est disponible, travailler dans un dossier dédié et noter que l’inspection technique reste à faire. Consigner tous les chemins absolus dans le rapport final.

Créer immédiatement `00_LIRE_AU_REVEIL.md` avec le tableau des missions, puis le compléter à chaque étape. Pour chaque résultat : statut `TESTÉ`, `DOCUMENTÉ`, `HYPOTHÈSE` ou `BLOQUÉ`, source/commande, date, résultat et limite. Ne pas convertir une absence d’information en certitude.

Livrables minimums :

| Fichier | Contenu |
|---|---|
| `00_LIRE_AU_REVEIL.md` | Synthèse, missions terminées/incomplètes, liens, limites et décisions |
| `01_CONCURRENCE.md` | Comparaison sourcée et scénarios réellement testés |
| `02_API_WIKIDATA.md` | Documentation, protocole, résultats d’appels et coûts |
| `03_IMPORT_DETOURS.md` | Inspection du format, mapping, essais et informations perdues |
| `04_CONTACTS.csv` | Coordonnées professionnelles vérifiées, sources, priorité |
| `05_EMAILS_BROUILLONS.md` | Cinq messages personnalisés et une relance type, sans envoi |
| `06_RECOMMANDATION_MVP.md` | Options et recommandation conditionnelle, sans fausse validation marché |
| `preuves/`, `fixtures/`, `scripts/` | Petits résultats techniques, jeux synthétiques et commandes reproductibles |

## 4. M1 — Concurrence et parcours existants

Comparer **4 outils maximum**, avec au moins un destiné aux professionnels et un aux particuliers. Travefy est un point de départ, pas un résultat acquis : https://travefy.com/products/itinerary. Trouver les autres à partir de l’offre actuelle.

Scénario commun fictif : deux adultes, dix jours au Japon, budget total indicatif 4 000 EUR hors vols, culture et cuisine, rythme modéré, hôtel déjà choisi pour les trois premières nuits. Utiliser les mêmes dates de test sur tous les outils et noter leur caractère fictif.

Modification : retirer une journée trop chargée et réduire les dépenses estimées sans changer l’hôtel verrouillé. Pour un outil d’import, examiner aussi comment il reprend un texte de planning déjà préparé.

Comparer : brief, budget, sources, carte, corrections, éléments verrouillés, options/bonus, export/import, partage voyageur, modèle tarifaire et traitement des informations incertaines.

Si l’accès interactif nécessite un compte, utiliser les démonstrations/documentations publiques et marquer le parcours non testé. Ne jamais inventer un résultat ou un coût non visible.

**Fin :** tableau des quatre outils, références datées, preuves accessibles, trois opportunités précises et ce qui pourrait invalider chacune. Ne pas affirmer qu’une fonction n’existe pas simplement parce qu’elle n’a pas été trouvée.

## 5. M2 — Wikidata et sélection d’API

### A. Test prioritaire Wikidata

Lire les sources officielles :

- https://www.wikidata.org/wiki/Wikidata:Data_access
- https://www.wikidata.org/wiki/Wikidata:Licensing
- https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/query_limits

Construire puis figer un échantillon de **20 lieux par ville : Paris, Kyoto, Shanghai**. Inclure lieux connus et moins connus, avec sources externes pour établir les lieux attendus avant le test. Ne pas sélectionner seulement les résultats que Wikidata trouve déjà.

Mesurer : correspondance d’identité, coordonnées, noms français/anglais/local, catégories, liens officiels lorsqu’ils existent, doublons, erreurs et temps de réponse. Distinguer absence de donnée, ambiguïté et échec de requête. Ne pas rechercher les horaires ou prix actuels comme si Wikidata les garantissait.

Effectuer des requêtes bornées, espacées conformément aux limites publiées, avec identifiant de client approprié. Garder scripts et résultats compacts. Si SPARQL échoue, essayer une autre méthode officielle adaptée ; sinon fournir le protocole et les limites, sans inventer les mesures. Ne pas télécharger la base complète.

### B. API complémentaires

Étudier Tavily, Geoapify, Google Places, Duffel, Booking.com Demand API, Viator et Open-Meteo. Chercher aussi si des données ouvertes répondent mieux au besoin. Pour chaque candidat : usage, authentification, éligibilité commerciale, coût public, quota, licence/attribution, stockage/export/hors ligne, couverture géographique et accès réel disponible.

Consulter uniquement des sources officielles pour les conditions techniques et commerciales. Tester les services accessibles dans le périmètre gratuit sans clé ; pour les autres, produire une fiche documentaire et le test à exécuter après accès autorisé. Ne pas masquer ce distinguo derrière une note globale.

**Fin :** recommandation de deux ou trois sources complémentaires pour un pilote, résultats Wikidata, coût de scénarios explicitement hypothétiques et points contractuels non résolus. Le choix final d’API n’est pas engagé.

## 6. M3 — Import et jeux de test Détours

Inspecter si disponibles `src/types.ts`, `src/lib.ts`, `src/journeys.ts`, `src/backup.ts`, les validateurs et tests d’import effectivement présents. Confirmer les noms de fichiers au lieu de les supposer. Identifier les formats réellement acceptés et les différences entre importer un voyage et restaurer une sauvegarde complète.

Créer **trois documents synthétiques originaux**, sans recopier les carnets professionnels :

1. Séjour urbain simple avec trois journées, adresses, heures précises et conseils.
2. Circuit multiétapes avec hôtels, transports, fuseaux, arrivée le lendemain et plusieurs devises.
3. Programme ambigu : dates manquantes, activités alternatives, restaurant seulement suggéré, lien invalide et informations contradictoires.

Pour chacun : document source, résultat structuré attendu, inconnues à demander, mapping vers Détours et éventuelles pertes. Ne pas transformer les suggestions en réservations ni inventer un horaire absent.

Tester la validation d’un payload synthétique avec les mécanismes existants, si possible dans un processus isolé sans écriture dans un carnet réel. Un passage dans le validateur n’est pas un test d’import complet. Si un test navigateur est possible, utiliser un profil jetable et une cible locale séparée ; ne pas lire ni modifier les données du navigateur utilisateur.

Un mini-prototype d’aperçu est autorisé hors dépôt : montrer le résultat attendu, les incertitudes et les erreurs. S’il s’agit d’un mapping manuel ou d’une simulation, le dire clairement. Ne pas construire un extracteur PDF généraliste ou une nouvelle application complète pendant cette mission.

**Fin :** trois fixtures avec résultats attendus, tableau de compatibilité, commandes réellement exécutées, limites et proposition du plus petit import utile. Le produit courant reste intact. Le gate du dépôt demeure requis pour une future livraison de code intégré, pas remplacé par ces essais de recherche.

## 7. M4 — Exemples de carnets et contacts

Points de départ à revérifier :

- Partez Léger : https://partezleger.fr/ ; contact relevé précédemment : partezleger@gmail.com.
- Explorations Uniques : https://explorationsuniques.com/contact/ ; contact@explorationsuniques.com.
- La Route d’Oré : https://www.laroutedore.fr/mention-legales ; laroutedore@gmail.com.
- Agence 1994 : https://www.agence1994.fr/creations/ ; 1994.agence@gmail.com.

Compléter à **15 organisations maximum**, avec priorité aux indépendants et petites structures produisant des programmes sur mesure. Ne pas classer un travel planner comme agence de réservation sans preuve.

Champs du CSV : organisation, profil, spécialité, site officiel, contact professionnel public, téléphone s’il est publié, URL de preuve, date de vérification, exemple public disponible et son format, raison de pertinence, priorité, statut de contact `NON CONTACTÉ`.

Identifier au moins trois structures avec un exemple annoncé ou consultable. Distinguer PDF ouvert, galerie, lecteur externe inaccessible et portfolio. Lister les structures des documents, pas recopier leur contenu. Une conversion de carnet tiers attend un accord approprié.

Préparer **cinq emails individualisés** : trois demandes d’exemple anonymisé et deux demandes d’entretien. Mentionner un détail réellement vérifié. Proposer quelques pages de démonstration et un essai privé, pas un dossier client complet. Aucun besoin de demander des identifiants Canva ou Drive.

Les messages doivent expliquer honnêtement le projet Détours, préciser que le professionnel reste auteur de ses recommandations et demander le périmètre d’utilisation de l’extrait. Ne pas promettre des garanties sur un prestataire IA encore non choisi : prévoir d’expliquer tout transfert externe avant sa réalisation. Aucune réutilisation pour entraîner un modèle ou publication sans accord distinct.

**Fin :** liste sourcée et dédupliquée, cinq brouillons prêts à personnaliser/signature, relance type et liste des accès non confirmés. Ne pas passer trop de temps à compléter artificiellement le quota si les contacts restants ne sont pas pertinents.

## 8. M5 — Recommandation et économie du pilote

Faire converger M1 à M4. Comparer trois options : import vers Détours, assistance aux modifications de programmes et génération depuis un brief. Recommander une première expérience en fonction des preuves, avec ses limites.

Pour chaque option : utilisateur/acheteur supposé, problème, démonstration minimale, dépendances, difficulté, mesure de réussite et signal d’abandon. Identifier les éléments que seuls les entretiens peuvent confirmer. Ne pas rédiger une roadmap détaillée de six mois à partir d’hypothèses non testées.

Estimer les coûts à partir des tarifs vérifiés, des appels réellement mesurés et d’hypothèses séparées. Montrer l’effet des corrections, du volume, des essais échoués et du temps de support. Sans benchmark LLM exécuté, fournir une formule/scénarios, pas une rentabilité prétendument mesurée. Aucune tarification commerciale finale imposée.

**Fin :** une recommandation argumentée, une alternative, trois hypothèses les plus fragiles et une expérience courte permettant de trancher. Ajouter les décisions attendues de l’utilisateur, au maximum cinq, dans le rapport du réveil.

## 9. Priorités, arrêt et reprise

Priorité 1 : premières preuves M1, test Wikidata M2, inspection et fixtures M3. Priorité 2 : contacts et brouillons M4. Priorité 3 : approfondissements facultatifs. M5 et le rapport final restent obligatoires, même avec des travaux incomplets.

Pour les sous-agents éventuels : répartir M1, M2 et M4 ; le pilote garde M3, la cohérence et M5. Ne pas créer de nouveaux chats utilisateur sans demande distincte. Aucun agent n’envoie de message externe.

Le temps disponible ne doit pas conduire à rechercher sans fin : quatre concurrents, trois villes, trois fixtures et quinze contacts sont des plafonds de travail initial. Réserver la fin à la synthèse. En cas d’interruption, laisser le dernier état sauvegardé, les tâches restantes et la commande de reprise.

## 10. Format obligatoire du rapport du réveil

1. **Recommandation principale**, en dix lignes maximum, et solidité des preuves.
2. **Tableau des missions** : terminé / partiel / bloqué / non commencé, avec liens de fichiers.
3. **Trois découvertes utiles et trois limites**, sans masquer les résultats négatifs.
4. **Tests réellement exécutés** : commandes, date, résultat, fixture, lien de preuve ; distinguer mocks et appels réels.
5. **Budget engagé** : zéro dans ce périmètre ; signaler toute anomalie plutôt que la dissimuler.
6. **Fichiers créés et état du dépôt** : confirmer les modifications réelles, ne pas présumer un checkout inchangé sans vérifier.
7. **Ce que l’utilisateur peut faire ensuite**, avec au plus cinq décisions et les contacts les plus prioritaires.
8. **Suite délégable** et point de reprise exact.

Terminer avec un court résumé copiable dans la conversation stratégique. Fournir les livrables effectivement disponibles ; ne pas seulement annoncer que le travail pourrait être fait.
