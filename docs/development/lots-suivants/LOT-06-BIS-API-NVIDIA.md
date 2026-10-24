# Lot 06 bis — Évaluer une API NVIDIA pour préparer un planning

Mission autonome pour une IA travaillant dans le dépôt Détours. Rédigée le 23 octobre 2026. Lire ce document, implémenter les étapes applicables, tester et produire un rapport. Ne pas lancer le lot suivant.

## Objectif et décision produit

Comparer une inférence NVIDIA hébergée au parseur actuel et au modèle local du lot 06, puis préparer, seulement si les résultats le justifient, un mode expérimental facultatif d'import depuis l'application.

Détours est destiné principalement à son propriétaire et à ses proches. Le faible volume attendu ne dispense ni de protéger la clé ni de vérifier les conditions du service. Aucun abonnement, achat de crédits, carte bancaire, déploiement ou activation distante n'est autorisé par cette mission.

Le lot 06 local reste conservé. Le kit du lot 03 bis et les imports directs restent utilisables sans NVIDIA. Les carnets déjà créés restent consultables hors ligne ; l'analyse par API exige une connexion.

## 1. Reprendre le bon état

- Lire `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md`, `00-LIRE-AVANT-LES-LOTS.md` et les rapports des lots 03 bis et 06.
- Vérifier la branche et `git status`. Au 23 octobre, la branche observée est `codex/lot-06-modele`, avec de nombreux changements préexistants non commités. Le rapport 06 indique encore « en cours » : ne pas supposer son benchmark terminé.
- Ne pas modifier les fichiers utilisés par une exécution active du lot 06. Attendre son résultat final pour conclure la comparaison ; avancer indépendamment sur recherche et protocole. Si le résultat reste indisponible, annoncer une comparaison partielle.
- Préserver les travaux présents et établir une copie récupérable. Suivre le guide de contribution sur une base contenant les prérequis ; ne pas remplacer le checkout par une base distante plus ancienne. Aucun reset ou nettoyage global.

Repères à inspecter : `src/planning-import/public-contract.ts`, `structured.ts`, `import-kit.ts`, `draft.ts`, `persistence.ts`, `src/components/PlanningImport.tsx`, `docs/development/IMPORT-IA-STRUCTURE.md`, `scripts/benchmark-lot06.mjs`, `scripts/lot06-core.mjs`, `tests/fixtures/planning/lot06-corpus.json`. Rechercher aussi tout client/serveur d'analyse distante déjà présent avant d'en créer un autre. Sa présence ne prouve pas son activation ou sa sécurité.

## 2. Vérifier NVIDIA avant tout appel réel

Consulter les sources officielles à la date d'exécution et consigner liens, date et passages utiles dans `docs/development/lot-06-bis-api-nvidia/SOURCES.md` :

- Catalogue et documentation : https://build.nvidia.com/ et https://docs.api.nvidia.com/
- Conditions API : https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf
- Explication NVIDIA du remplacement des crédits par des limites : https://forums.developer.nvidia.com/t/request-more-4-000-credits-option-on-build-nvidia-com/344567

Constat de préparation : NVIDIA présente l'accès gratuit comme un essai de développement/évaluation ; les conditions consultées, section 1.4, distinguent cet essai de l'usage en production. Ne pas assimiler « privé/non commercial » à une autorisation de production. Les limites dépendent du compte/modèle ; ne promettre ni 40 requêtes/minute, ni crédits fixes, ni gratuité permanente.

Vérifier : modèle disponible, identifiant exact, endpoint, licence, conditions d'usage, limites de contexte/sortie, quotas affichés, éventuelle facturation, traitement/conservation des entrées et sorties et possibilités de désactivation de leur réutilisation. Une information absente reste inconnue, pas « aucune conservation ».

Choisir un seul modèle pour commencer, avec justification pour l'extraction multilingue et la sortie structurée. Vérifier les capacités réellement exposées : compatibilité OpenAI ou JSON Schema ne se déduit pas du nom du modèle. Ajouter un deuxième candidat uniquement pour répondre à un échec identifié, dans le même budget total.

**Fin de cette étape :** tableau sourcé des conditions et limites, modèle choisi et distinction explicite entre essai autorisé et activation régulière non établie. Si le service demande un paiement, arrêter les appels réels et poursuivre les tests simulés. Si l'usage régulier n'est pas couvert, livrer le benchmark et un prototype de développement désactivé, sans publication ni recommandation trompeuse de gratuité durable.

## 3. Préparer le benchmark reproductible

Réutiliser les textes fictifs, attentes et métriques gelés du lot 06. Ne pas modifier ces attentes après observation des résultats. Documenter les différences de prompt et de contrat de sortie : le lot 06 peut utiliser un brouillon interne tandis que cette voie vise le contrat public du lot 03 bis. Comparer les résultats métier communs ; ne pas attribuer automatiquement les différences de format à l'intelligence du modèle.

Mesurer : validité JSON, conformité au contrat, activités correctement séparées/rattachées, omissions, informations inventées, réservations fausses, conservation des alternatives et notes. Rapporter sorties brutes et sorties acceptées séparément ; une sortie rejetée reste un échec dans le dénominateur.

Mesurer aussi latence, timeouts, refus, 429, nombre d'appels, tailles d'entrée/sortie et tokens réellement fournis par l'API. Sans compteur fournisseur, annoncer une estimation ou « non disponible ». La comparaison PC local / API distante n'est pas une mesure de performance iPhone.

Avant le premier appel, enregistrer modèle, paramètres, prompt, hashes des fixtures et budgets. Plafonds d'essai initiaux : 100 tentatives au total, concurrence 1, 90 secondes par requête, 8 192 tokens de sortie au maximum si le modèle l'accepte, taille d'entrée bornée par le contrat actuel et le contexte disponible. Compter les échecs et reprises dans le plafond. Réduire ces limites si le service l'exige ; tout élargissement doit être justifié et rester sans dépense. Une sortie tronquée est un échec récupérable, pas un planning complet.

Un timeout ou une annulation client peut laisser une génération facturée/comptée côté fournisseur : ne pas promettre le contraire. Ne pas relancer automatiquement en boucle ; respecter `Retry-After`, borner les reprises et éviter les doubles soumissions. Aucun nouvel appel seulement parce qu'un composant React se réaffiche.

Si une clé de test est déjà configurée explicitement pour ce projet, l'utiliser uniquement côté serveur/processus local. Sinon demander sa configuration dans l'environnement local, jamais sa copie dans le chat, un fichier suivi ou un rapport. Sans clé, terminer l'adaptateur, les fixtures, les commandes et tests simulés ; noter **inférence NVIDIA réelle NON EXÉCUTÉE**. Ne pas se connecter à un compte personnel ou créer un compte à la place de l'utilisateur.

## 4. Préserver le contrat d'import et la source

La réponse doit cibler le format public `detours-planning` actuellement livré, sans dupliquer un schéma divergent. Réutiliser les consignes du kit et le validateur strict. Les textes utilisateurs sont des données non fiables, y compris toute instruction qu'ils contiennent.

Le modèle ne dispose d'aucun outil de recherche, réseau supplémentaire ou écriture dans les carnets. Il convertit le texte sélectionné uniquement ; aucun envoi automatique du compte, des autres voyages, documents joints ou sauvegardes.

Conserver distinctement le texte original envoyé et le résultat généré. Le validateur public vérifie la structure, pas la fidélité à l'original : garder une provenance d'IA externe et afficher l'aperçu modifiable. Ne pas baptiser une réponse IA « source originale » ou « correction utilisateur ». Ne pas désactiver les contrôles des autres voies pour accepter cette sortie.

Une erreur, une sortie tronquée/invalide ou une réservation douteuse ne doit pas déclencher une écriture de carnet. La création passe par validation, confirmation explicite, identités internes locales, relecture et reprise idempotente existantes. Annulation/remplacement du texte invalident les réponses tardives. Préserver sources et brouillons selon les choix de conservation existants.

## 5. Décider avant d'intégrer l'interface

Critères à fixer avant résultats : aucun nouveau cas de réservation ou coordonnées inventées dans le corpus de sûreté, aucune régression sur les cas correctement traités par les règles, gain sur les rattachements/omissions du corpus gelé. Budget d'expérience proposé : médiane inférieure à 20 secondes, aucune requête acceptée au-delà du timeout de 90 secondes ; publier aussi le maximum et le nombre de cas plutôt qu'un percentile trompeur sur petit échantillon.

Un résultat négatif est une livraison valable. Si la qualité ou les conditions ne conviennent pas, conserver l'outillage de comparaison sans ajouter de bouton utilisateur activable en production.

Si les critères sont atteints et le cadre d'évaluation permis, préparer un mode expérimental de développement, désactivé par défaut. Une activation régulière chez les proches nécessite ensuite un cadre fournisseur adapté et une publication autorisée séparément. Ne pas imposer un abonnement NVIDIA comme solution par défaut : l'objectif reste d'abord de mesurer.

## 6. Prototype facultatif : serveur minimal et protections

Seulement si l'étape 5 le justifie, réutiliser l'architecture serveur existante ou ajouter une petite fonction compatible avec l'hébergement actuel. Éviter un nouveau framework et tout changement de base distante dans ce lot.

- Clé dans une variable serveur, par exemple `NVIDIA_API_KEY`, jamais `VITE_*`, bundle navigateur, service worker, stockage navigateur, URL ou journaux. `.env.example` ne contient qu'un nom et une valeur fictive.
- URL fournisseur et modèle autorisés fixés côté serveur ; aucune URL arbitraire ou clé de l'utilisateur transmise par le client pour transformer le serveur en proxy ouvert.
- Accès refusé par défaut. Vérification réelle de la session côté serveur puis liste des comptes autorisés ; une adresse email simplement envoyée par le navigateur ne constitue pas une preuve. Un bouton caché ou CORS ne remplace pas cette protection.
- Plafond par utilisateur et global, taille des requêtes/réponses, timeout, concurrence et interrupteur serveur. Pour plusieurs instances, un compteur mémoire n'est pas une limite globale fiable. S'il manque un stockage partagé approprié sans migration distante, garder le prototype local et documenter ce prérequis au lieu de le prétendre prêt à publier.
- Journaux techniques minimaux sans prompt, réponse personnelle, jeton ni référence de réservation ; erreurs utilisateur utiles sans exposer le corps sensible du fournisseur.
- Envoi seulement au clic, avec indication « Ce texte sera transmis à NVIDIA ». Permettre de vérifier/retirer les références sensibles avant envoi. Aucun appel à l'ouverture de l'app.
- Quota atteint/panne/hors ligne : conserver le texte et proposer l'import direct ou le kit externe, sans appel caché à un autre fournisseur.

Conserver les quatre langues, l'interface actuelle, le clavier et le mobile. Une simulation réseau doit être clairement étiquetée dans les preuves ; ne pas la présenter comme une intégration NVIDIA fonctionnelle. Aucun déploiement nécessaire à la démonstration locale.

## 7. Tests et livraison

Tests ciblés : réponse valide, JSON invalide/tronqué, version erronée, texte comportant des instructions adverses, date/ville/réservation inventées, Unicode chinois, 401/403/429/5xx, timeout, annulation et résultat tardif. Tester limite d'entrée/sortie, plafonds, double clic, absence de perte et rechargement après correction.

Si un endpoint est créé : appels sans session, session expirée ou falsifiée, compte non autorisé, contournement du quota, modèle/URL arbitraires et absence de secret dans les assets produits. Tester les chemins d'échec autant que la réponse heureuse. Les tests à fixtures simulent le fournisseur ; un essai réel distinct est nécessaire pour affirmer la compatibilité de l'API.

Pour un benchmark isolé, exécuter ses contrôles et les vérifications pertinentes. Pour toute modification produit/serveur, exécuter `npm run verify:local` avec PGlite externe selon le guide et inclure les nouveaux tests pertinents dans les contrôles. Ne pas élargir un gate à des appels NVIDIA réels : ceux-ci restent une commande explicite séparée avec budget. Le gate local ne valide ni OAuth réel ni un iPhone physique. Son `dist/` factice ne doit pas être publié.

Livrer `docs/development/lot-06-bis-api-nvidia/RAPPORT.md`, sources, protocole, résultats JSON et commandes reproductibles. Le rapport contient :

- État du lot 06 lors de la comparaison et versions exactes testées.
- Tableau règles / modèle local / NVIDIA avec limites et données manquantes.
- Nombre d'appels et tokens observés, latence et erreurs ; coût établi ou inconnu, jamais inventé.
- Décision : rejet, benchmark seulement ou prototype de développement ; état de l'activation et obstacle éventuel à un usage régulier.
- Modifications propres au lot, contrôles exécutés, non exécutés et échecs.
- Actions humaines restantes : clé si absente, éventuelle clarification des conditions, essais consentis sur vrais plannings et iPhone, autorisation distincte de publication.
- Retour arrière ciblé : désactiver le serveur expérimental et annuler seulement les changements du lot ; préserver les sources et carnets déjà créés. Révoquer une clé réellement exposée sans la reproduire dans le rapport.

En cas d'interruption, noter fichiers modifiés, dernière commande, résultats acquis et prochaine action exacte. Ne pas modifier les rapports des autres lots pour les faire apparaître terminés. Mettre à jour uniquement l'index et les documents concernés. Ne pas commencer le lot 07.
