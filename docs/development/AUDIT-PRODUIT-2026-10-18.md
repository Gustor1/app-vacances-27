# Détours : état réel, APIs gratuites et prochaines idées

Audit du 18 octobre 2026. Recherche et propositions ; les APIs et modèles présentés ici ne sont pas intégrés. Budget retenu : aucun service payant obligatoire. Hypothèse : petite bêta grand public, usage mobile prioritaire, modèle économique éventuel à préserver.

## Diagnostic

Détours est déjà un carnet de voyage opérationnel : collection de voyages, planning, cartes, budget, sauvegardes/restauration, langues, aperçu d'import et socle PWA. Il ne s'agit plus seulement d'un hébergeur de planning. Positionnement recommandé : « Ton programme devient un compagnon de voyage utilisable sur place ».

Le code local et les tests constituent les preuves de cet audit. La production distante, les comptes réels et un iPhone physique n'ont pas été vérifiés. Les nombreuses modifications préexistantes de cartes/UI ont été préservées ; seule une aide d'installation mobile a été ajoutée au produit pendant ce travail.

| Sujet | État constaté | Priorité |
|---|---|---|
| Import | Texte/Markdown, règles locales, aperçu corrigible et source conservée | Très haute : renforcer la fidélité sur les textes libres |
| PDF/Word/scans | Pas d'import direct dans le parcours actuel | PDF texte/DOCX avant OCR universel |
| IA hébergée | Adaptateur d'extraction existant, distinct du parseur ; aucune inférence réelle validée ici | Option après benchmark, pas promesse livrée |
| Cartes | Leaflet ; liens Google/Amap et améliorations locales en cours | Conserver, éviter un fournisseur facturable obligatoire |
| Budget | Frankfurter déjà présent dans live-rates.ts et money.ts | Améliorer l'expérience, ne pas réintégrer une API déjà utilisée |
| PWA | Manifest standalone, service worker, ressources locales et contrôle de préparation hors ligne | Finir installation et recette sur appareils |
| Assistant autonome | Pas de chatbot à droits d'édition validé dans cet audit | Commencer par actions bornées avec aperçu |

### Import : résultat reproduit aujourd'hui

Réexécution du vrai lecteur de fichiers et du parseur sur le corpus fictif existant de 36 cas : **18/36 conformes, 75/114 activités séparées, 66/114 au bon rattachement**. Le rapport du 16 octobre décrit les familles : les conventions explicites fonctionnent bien ; brouillons, messages sans structure et corrections de dernière minute posent problème.

Ce n'est pas une estimation de précision pour tous les utilisateurs. Conserver ce corpus comme régression et ajouter un lot inédit avant de comparer règles et modèles. La conservation du texte dans les notes ne signifie pas que les activités sont correctement reconnues.

## Recherche API : shortlist exploitable

Catalogue de découverte : [public-apis](https://github.com/marcelscruz/public-apis). Les conditions ci-dessous viennent des fournisseurs, pas des labels du catalogue.

| Source | Utilité concrète | Gratuité et limites | Décision |
|---|---|---|---|
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Nom local, identité d'un monument, coordonnées, site officiel, image Commons | Lecture publique sans clé ; données structurées CC0, usage commercial possible ; service public avec limites | Premier enrichissement à essayer |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en) | Photos de lieux et couvertures | Licence propre à chaque image ; auteur, source, licence et modifications à conserver ; tout n'est pas CC0 | Complément de Wikidata |
| [Frankfurter](https://frankfurter.dev/) | Taux indicatifs datés | Taux composites gratuits, sans clé ; antiabus ; taux non garanti identique à celui de la banque | Déjà intégré |
| [Open-Meteo](https://open-meteo.com/en/terms) | Pluie, température et préparation du lendemain | Offre gratuite hébergée non commerciale uniquement ; 600/min, 5 000/h, moins de 10 000/j, tableau 300 000/mois ; licence des données distincte des conditions du service | Option pour bêta non commerciale ; réexaminer avant publicité/abonnement |
| [Amap](https://lbs.amap.com/faq/advisory/authorization/43168) | Lieux et navigation en Chine | Clé et certification selon service ; gratuit personnel recherche/apprentissage, usage commercial à autoriser/licencier | Pas une dépendance API gratuite commerciale ; préserver les liens externes |
| [Nominatim public](https://operations.osmfoundation.org/policies/nominatim/) | Recherche ponctuelle d'adresse | 1 requête/s pour toute l'application ; pas d'autocomplétion ; cache, attribution et identification ; décision informée du développeur requise pour intégration via IA | Ne pas activer automatiquement ; pas un backend de recherche illimitée |
| [Overpass public](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) | Toilettes, fontaines, musées dans une petite zone | OSM/ODbL, attribution ; instances communautaires, limites variables, sans disponibilité garantie | Essai limité sur action utilisateur, facultatif |

Wikidata n'est pas une base exhaustive d'avis, de restaurants ou d'horaires. Un musée correctement identifié peut avoir des données incomplètes ou anciennes. Afficher source et date de consultation ; ne pas annoncer « ouvert demain » sur la seule base d'une fiche encyclopédique.

Pour Wikimedia, lecture navigateur via `origin=*` selon la [documentation CORS](https://www.mediawiki.org/wiki/API:Cross-site_requests). Respecter les [limites actualisées](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits), la concurrence et Retry-After. Ne pas multiplier les requêtes SPARQL lors de chaque frappe.

### Vérifications réseau effectuées par la recherche

Trois GET publics ont obtenu HTTP 200 avec en-tête CORS `*` : recherche Wikidata « Eiffel Tower » → Q243 ; prévision Open-Meteo aux coordonnées de Paris ; taux Frankfurter EUR/CNY daté du 17 octobre. Tests depuis l'environnement d'outillage, sans données privées. Cela ne prouve ni le comportement sur iPhone, ni l'accès depuis un réseau chinois, ni la disponibilité permanente.

Commons, Amap, Nominatim et Overpass : documentation examinée, pas de validation applicative réelle. Avant intégration, confirmer réponse, licence, disponibilité, coût commercial et conditions exactes de chaque endpoint.

### Premier usage recommandé

« Compléter ce lieu » → recherche Wikidata contextualisée → choix parmi quelques candidats → proposition de nom local/photo/site officiel → acceptation des ajouts. Préserver intégralement la source du planning et les corrections de l'utilisateur. Les nouveaux contenus ont une provenance et une date ; l'absence de réseau ne bloque jamais le carnet.

Ne jamais envoyer tout un planning à une API de lieux : uniquement la requête nécessaire. Définir une durée de cache par fournisseur/licence, gérer timeout et absence de résultat, plafonner les appels et conserver un fournisseur remplaçable.

## Modèles Hugging Face : oui pour expérimenter, pas comme garantie

[Transformers.js](https://huggingface.co/docs/transformers.js/index) permet une exécution locale navigateur via WASM/WebGPU. Un modèle open source évite une facture par requête, mais impose téléchargement, RAM, batterie et temps de calcul. Le support du moteur et la fluidité doivent être mesurés sur un iPhone réel.

[Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B), multilingue sous Apache 2.0, est un candidat de benchmark, pas une recommandation de production prouvée. Le dépôt contient déjà une comparaison : IMPORT-RECOGNITION-MODELS.md. Éviter une seconde étude identique ; passer à une expérience isolée, avec version/révision figées, si le bénéfice mérite le téléchargement.

L'[API Inference Providers Hugging Face](https://huggingface.co/docs/inference-providers/pricing) n'est pas un moteur gratuit illimité : crédit mensuel gratuit annoncé de 0,10 USD, modifiable. Ce n'est pas un socle pour un chatbot public gratuit.

Expérience proposée :
1. Corriger d'abord les cas simples : émojis devant titres, courriels cités, mois abrégés, répétitions dans les tableaux.
2. Comparer règles seules, petit modèle seul et règles + modèle sur les passages ambigus.
3. Mesurer omissions, inventions, bonnes journées/villes, alternatives, réservations, temps de correction utilisateur, latence et mémoire.
4. Conserver un lot jamais utilisé pour ajuster les règles/prompts.
5. Activer le modèle uniquement si le gain est mesuré et si l'utilisateur accepte le téléchargement. Repli local toujours disponible.

Avant les scans, ajouter [PDF.js](https://mozilla.github.io/pdf.js/) pour PDF avec texte et [Mammoth](https://github.com/mwilliamson/mammoth.js) pour DOCX : extraction locale bornée, ordre/pages/tableaux préservés autant que possible, texte brut validé. PDF.js ne remplace pas l'OCR ; Mammoth ne nettoie pas automatiquement un HTML hostile. Éviter le rendu HTML brut de documents importés.

## PWA et iPhone

Oui, l'ajout à l'écran d'accueil permet une expérience app sans abonnement Apple Developer. Le [Web Push est également possible sans cet abonnement](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), avec les prérequis iOS, installation et permission. Un rappel livré app fermée exige cependant une infrastructure d'envoi : un minuteur JavaScript local ne garantit pas sa livraison.

Constats de code : manifest `display: standalone`, viewport-fit=cover, worker de build, cache local et vérification des ressources. Le bouton d'installation existant dépend de beforeinstallprompt ; ce mécanisme ne suffit pas à guider les utilisateurs Safari.

Correction réalisée : panneau repliable « Installer sur iPhone ou iPad », instructions Safari et rappel de sauvegarde, traduit FR/EN/ZH/ES, dans OfflineStatus. Aucun changement visuel global ni donnée migrée.

À traiter ensuite :
- Compléter les icônes d'installation : seul SVG actuellement, prévoir PNG adaptés et apple-touch-icon puis vérifier le résultat réel ; pas affirmer que l'installation est impossible sans eux.
- Recette sur iPhone : ajout écran d'accueil, ouverture autonome, fermeture/réouverture en mode avion, retour depuis Google/Amap, téléchargement/import de sauvegarde, clavier et encoche, mise à jour pendant une édition.
- Vérifier la continuité des carnets entre Safari et l'app installée ; fournir export/restauration en secours, sans promettre un transfert automatique.
- Mesurer le poids réellement nécessaire au départ ; distinguer programme disponible, contours locaux et cartes de rues nécessitant Internet.
- Tester le stockage durable via Storage API comme amélioration, tout en conservant les sauvegardes ; une demande de persistance n'est pas une garantie absolue.

Les tests navigateur mobile sont utiles, mais ne remplacent pas cette recette physique.

## Assistant : des pouvoirs limités et utiles

Commencer par « Trouver dans mon carnet », « Déplacer cette activité à demain », « Alléger cette journée » et « Montrer ce qu'il reste à préparer ». Des commandes guidées peuvent déjà fonctionner sans LLM.

Un futur chatbot propose un lot de modifications lisible, puis l'utilisateur applique/annule. Le moteur ne reçoit pas un accès brut au stockage : actions typées, validation, droits serveur existants, version du carnet contrôlée, écriture atomique si possible ou reprise explicite, historique et annulation. Un rôle lecteur reste lecteur. Les pages web et documents importés sont des données, jamais des instructions d'autorisation.

Séparer les suggestions externes des réservations confirmées. N'envoyer au modèle que les informations nécessaires après choix clair du traitement local/distant. Un assistant de recherche Web général demande des sources, du réseau et potentiellement un budget : il ne devient pas gratuit grâce au seul mot « chatbot ».

## Idées distinctives

1. **Le contrôle avant départ** : trois incohérences concrètes à corriger plutôt qu'un score abstrait — lieu introuvable, deux activités qui se chevauchent, billet encore à joindre. Fonctionne largement avec des règles locales.
2. **Le mode « J'ai 45 minutes »** : pioche dans les favoris déjà enregistrés près de la prochaine étape. Les distances à vol d'oiseau restent clairement nommées ; ne pas inventer un temps de marche.
3. **Le plan B préparé** : pour chaque activité météo-sensible, enregistrer une alternative couverte. Lorsqu'une prévision autorisée devient disponible, proposer un échange, pas une modification silencieuse.
4. **La carte à montrer** : plein écran avec nom local, adresse, hébergement de retour et bouton copier. Utile au taxi, au guichet ou sans langue commune, y compris hors ligne.
5. **Le passeport du lieu** : nom d'origine, source, photo attribuée, lien officiel et note personnelle. L'utilisateur distingue ce qu'il a écrit de ce que l'app a ajouté.
6. **Le bilan d'import honnête** : « 12 activités reconnues, 3 passages à vérifier ». Cliquer un passage ouvre la source à côté de sa proposition ; aucun pourcentage de confiance inventé.
7. **Le souvenir léger** : en fin de journée, une photo personnelle et une phrase ; à la fin du voyage, un carnet partageable choisi par l'utilisateur, sans partage automatique de données privées.
8. **Le pont avec ChatGPT** : fournir un petit format d'export et un prompt copiable pour obtenir un programme structuré compatible Détours. Le traitement reste dans le compte de l'utilisateur, puis import local gratuit. Aucune automatisation de sa session ni clé empruntée.

## Mascotte

Bonne idée pour donner une identité sans refaire toute l'interface. Proposition créative : une hirondelle voyageuse, nom de travail « Détour », ailes évoquant un chemin et petite sacoche. Alternative plus sobre : une boussole expressive. Noms et identité restent à choisir, pas une marque vérifiée.

Trois interventions utiles : bienvenue au premier carnet, signalement d'un passage à vérifier, départ prêt. Pas de bulle persistante qui cache la carte, pas de culpabilisation, pas d'animation indispensable. Désactivation et mouvement réduit ; son message reste compréhensible sans l'image. La mascotte peut représenter l'assistant guidé sans prétendre qu'un modèle fonctionne derrière.

## Ordre conseillé

1. **Fiabilité et mobile** : corriger les cas d'import simples, bilan source/proposition, installation et recette PWA. Réussite : moins de corrections manuelles sur un lot inédit, carnet retrouvé hors ligne sur téléphone.
2. **Entrées pratiques** : PDF texte/DOCX et format ChatGPT compatible. Réussite : source conservée, aucun ajout silencieux, limites visibles.
3. **Lieux enrichis** : Wikidata + Commons, à la demande. Réussite : bonne identité confirmée, licences/attributions, défaillance réseau sans blocage.
4. **Compagnon sur place** : carte à montrer, contrôle de préparation, plan B et favoris à proximité. Réutiliser les vues et outils existants.
5. **IA expérimentale** : benchmark réel avant intégration ; assistant à actions contrôlées seulement après fiabilité du contrat de modification.
6. **Mascotte** : petit travail d'identité possible en parallèle des priorités, sans en faire une refonte.

Ne pas intégrer toutes les APIs ensemble. La valeur vient de la réduction du travail du voyageur et de la fiabilité de son carnet.

## Vérifications de ce travail

- 12 tests ciblés passés : iphone-glass, l2-accessibility et planning-local (Chrome avec dimensions/toucher mobile, pas un iPhone physique).
- Aide d'installation ouverte et capture inspectée à 390 × 844 : texte visible, aucun débordement horizontal. Première tentative du script interrompue car il n'ouvrait pas le menu mobile ; parcours corrigé et passé. [Capture](pwa-installation-2026-10-18.png).
- Corpus difficile réexécuté en lecture sans réécrire les résultats historiques : 18/36, 75/114 séparées, 66/114 bien rattachées.
- Vérification locale complète après correction PWA : réussie, code de sortie 0, empreinte des sources inchangée durant le contrôle. [Rapport JSON](audit-produit-2026-10-18-validation.json). Les suites navigateur du gate totalisent 84 scénarios ; autres contrôles : types, lint, unités, SQL local, compilation et scénarios compilés/hors ligne.
- Premier gate arrêté sur un sélecteur de test supposant un seul panneau repliable. Le test smoke-l4-offline cible désormais séparément installation et récupération, et vérifie les deux au clavier dans les quatre langues. Ce contrôle ciblé puis le gate complet ont réussi. Les modifications produit se limitent à OfflineStatus.tsx et locales/offline.ts ; le troisième fichier de code modifié par cet audit est ce test.
- Le gate a remplacé dist par une compilation de test avec configuration factice. Recompiler pour la cible avant toute publication autorisée. Aucun test local ne valide les services réels ni l'installation sur iPhone physique.
- Pas de modèle téléchargé, pas d'inférence ML, pas de chatbot créé, pas d'API ajoutée au produit, pas de déploiement ni action sur une base distante.
