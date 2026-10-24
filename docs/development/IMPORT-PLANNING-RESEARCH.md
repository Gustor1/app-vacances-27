# Import de planning : comparaison et service d'extraction

Recherche documentaire bornee, 12 octobre 2026. Skill applique : `mattpocock-skills:research` (sources officielles). Les parcours authentifies des concurrents n'ont pas ete executes. Ces observations sont DOCUMENTEES, pas des essais de comptes concurrents.

## Cinq observations

1. Wanderlog importe vols et reservations par transfert d'emails et renseigne dates et heures. Cela documente un import de reservations, sans prouver un import de programme libre colle. [Page officielle](https://wanderlog.com/plan-a-trip).
2. Wanderlog documente la correction individuelle du numero de vol, de l'aeroport, de la date et des heures. D'etours conserve donc une revue champ par champ apres extraction. [FAQ officielle](https://wanderlog.com/blog/faq/).
3. Wanderlog affiche les lieux ajoutes sur la carte et propose l'export vers Google Maps. Le planning et la carte sont ainsi relies. D'etours reutilise sa carte Leaflet existante. [Page officielle](https://wanderlog.com/home).
4. TripIt propose l'import d'emails de confirmation, l'ajout manuel par type de plan et recommande une verification des donnees apres creation. Cela conforte une correction explicite plutot qu'une confiance automatique dans l'import. [Aide officielle](https://help.tripit.com/en/support/solutions/articles/103000063431-add-a-new-trip-in-the-tripit-website).
5. TripIt exige une adresse valide pour afficher un plan sur sa carte mobile. Une adresse imprecise ne constitue donc pas une preuve de coordonnees fiables. D'etours conserve les adresses textuelles et ne fabrique aucun point. [Aide officielle](https://help.tripit.com/en/support/solutions/articles/103000063298-map-view).

## Choix du fournisseur

Adaptateur prepare pour OpenAI Responses, modele initial fige `gpt-4.1-mini-2025-04-14`, remplacable par configuration serveur. Sa documentation officielle indique le support des sorties structurees et de Responses : [modele](https://developers.openai.com/api/docs/models/gpt-4.1-mini). La sortie respecte `text.format`, un schema JSON strict et `additionalProperties: false`; cela valide la forme mais ne garantit pas la fidelite. Le validateur applicatif exige aussi les citations dans la source. [Sorties structurees](https://developers.openai.com/api/docs/guides/structured-outputs).

Le serveur transmet le texte colle et les instructions d'extraction, sans outils, navigation, historique de compte, carnet existant ou secrets utilisateur. `store: false` desactive le stockage applicatif de la reponse ; cela ne supprime pas automatiquement la retention des journaux de surveillance des abus (jusqu'a 30 jours par defaut). Les donnees API ne servent pas a l'entrainement sans consentement explicite. [Controles de donnees](https://developers.openai.com/api/docs/guides/your-data). Aucun appel payant ou distant n'a ete lance pendant cette contribution.

## Etat et activation

Le depot inspecte fournit Vite, pas de fonction serveur applicative pour l'extraction. `.env.example` declare uniquement les options publiques Supabase/collaboration ; aucun nom de variable fournisseur IA ou planning n'est present dans l'environnement de ce processus. Aucun secret n'a ete affiche. **Extraction reelle BLOQUEE** : pas de configuration d'essai autorisee, de cle fournisseur, d'hebergement pour cette route ni d'adaptateurs d'identite/quota durable verifies.

`server/planning-extraction.mjs` exporte `createPlanningExtractionHandler(options)` : une fonction Web `Request -> Response` a raccorder a `/api/planning-extraction` par un futur adaptateur d'hebergement. Rien n'est lance ou deploye automatiquement. Options obligatoires : `enabled: true`, `apiKey` privee, `authenticate(request, signal)` retournant un compte serveur verifie `{id}`, et `consumeQuota(id, reservation)` debitant atomiquement une limite durable par compte et globale. Aucune confiance dans un ID fourni par le navigateur. Le jeton Bearer est fourni par la session authentifiee existante ; un verificateur serveur doit le valider. Une simple valeur statique, un compteur memoire ou un decodage JWT sans verification ne satisfait pas ce contrat.

Sans l'un de ces adaptateurs le handler retourne 503 avant tout appel. Quota refuse : 429 ; quota indisponible : 503 ; compte absent : 401. Les limites doivent aussi couvrir le cout maximal et la concurrence, et inclure les echecs, annulations et redemarrages. Le handler reserve un appel de 12 000 tokens maximum, sans retry automatique. L'adaptateur durable manque : aucune activation de production n'est revendiquee.

Apres accord specifique pour un essai synthetique et mise en place des dependances : configurer la cle uniquement sur le serveur, verifier les adaptateurs et l'origine de confiance, monter la route du meme domaine, puis ajouter `VITE_PLANNING_EXTRACTION_ENABLED=true` au build cible. Cette variable publique ne contient aucune cle. La presence de cette variable annonce la configuration attendue ; les erreurs 503 restent visibles si le service est indisponible.

Le client limite le texte a 50 000 caracteres et la reponse a 1 Mo, annule apres 45 secondes et transmet AbortSignal. Le handler limite le corps a 350 Ko, la source a 50 000 caracteres, la reponse fournisseur a 1 Mo et l'appel a 35 secondes. Aucun programme ou numero de reservation n'est journalise. Les callbacks d'identite et quota doivent honorer leur AbortSignal. Les tests utilisent uniquement des tokens, comptes, cles et reponses fictifs, et ne demontrent ni une extraction reelle ni une validation Supabase.

## Verification simulee executee

- `node --test tests/planning-extraction.test.mjs` : 7 tests reussis. Authentification et quota sont aussi bornes lorsque leurs adaptateurs ignorent l'annulation.
- `npx playwright test --config playwright.planning.config.ts` : 3 tests reussis dans Chromium, avec serveur Vite isole sur 5175, configuration Supabase fictive et interception de tous les appels HTTP/WebSocket vers ce faux projet. Le fournisseur est une reponse de route Playwright, pas OpenAI.
- Le parcours teste colle un programme, lance Analyser, corrige titre/activite, cree un carnet local au compte et le rouvre apres rechargement. Corriger le nom du lieu efface ses anciennes coordonnees : le point doit etre verifie a nouveau.
- Annulation puis nouveau texte : une ancienne reponse arrive apres la nouvelle et ne remplace pas la revue, meme avec un transport simule ignorant AbortSignal. Aucun appel d'analyse pendant la frappe.
- Quota refuse et JSON invalide : la source demeure recuperable apres rechargement et aucun carnet partiel n'est cree.
- Lint cible des fichiers extraction/serveur/tests/config reussi. Le serveur 5175 est arrete automatiquement a la fin. Ces essais ne prouvent ni OAuth, ni la fidelite d'un vrai modele, ni un appareil physique.
