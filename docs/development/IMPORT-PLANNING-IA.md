# Import de planning dans Detours

> Mise à jour du 16 octobre 2026 : une reconnaissance locale de texte et de fichiers Markdown est ajoutée sur `codex/import-recognition`. Voir [le rapport actuel](IMPORT-RECOGNITION.md). Le présent document conserve les preuves historiques du 12 octobre ; sa limitation à la saisie manuelle en l'absence d'IA ne décrit plus cette nouvelle branche. L'activation du service IA distant reste distincte.

12 octobre 2026, heure de Shanghai. Contribution locale `codex/import-planning-ia`, base actualisee `codex/carnets-universels` au commit `9fa03b15c6dfeba7129b11df538edba1ea9d0a94`.

## Resultat et essai

**PARTIEL : activation IA restante. Extraction reelle BLOQUEE.** Le parcours de revue, correction, creation, consultation et sauvegarde est integre. Les exemples et les reponses interceptees dans les tests ne demontrent pas la reconnaissance IA d'un programme libre.

Checkout de travail : `C:/Users/eliot/.codex/worktrees/import-planning-ia/app-vacances-27`. Le checkout Studio d'origine et ses quatre documents non suivis sont preserves. Aucun deploiement, appel IA payant, migration distante ou changement d'alias n'est effectue.

```powershell
cd C:/Users/eliot/.codex/worktrees/import-planning-ia/app-vacances-27
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Accueil > **Creer depuis un planning**. Coller son texte, puis utiliser la saisie manuelle tant que le service IA est desactive. Les exemples 1 a 3 chargent explicitement des donnees synthetiques et leur brouillon annote, sans appeler un modele. Corriger l'apercu, choisir devise et fuseau, conserver ou non le texte original dans le carnet, puis **Creer et ouvrir le carnet**. La creation manuelle habituelle reste accessible.

Serveur local laisse disponible sur `http://127.0.0.1:5174`, processus Node PID `3860`, verification HTTP 200. Il fonctionne en mode local et IA desactivee, sans copie du `.env.local` d'origine. Le build `dist/` produit par le gate utilise des parametres factices et ne doit pas etre publie.

L'analyse distante est un bouton desactive avec explication lorsqu'elle n'est pas configuree ou lorsque le compte n'est pas connecte. Aucune requete pendant la frappe. La source reste dans le brouillon personnel recuperable jusqu'a son effacement explicite, y compris apres creation ; la case de conservation concerne sa copie integrale dans le carnet. Les extraits non structures restent dans un document lisible pour eviter les pertes.

## Statut P0 a P6

| Lot | Statut | Livrable et limite |
| --- | --- | --- |
| P0 | DOCUMENTE / inspection executee | README, AGENTS, collaboration, types, voyages et stockage inspectes. Cinq observations officielles Wanderlog/TripIt dans `IMPORT-PLANNING-RESEARCH.md`. Pas de parcours concurrent authentifie execute. |
| P1 | TESTE localement | Brouillon versionne, validation, provenance, trois sources/resultats synthetiques separes, conversion sans extension de StoredState. |
| P2 | TESTE avec simulations ; extraction reelle BLOQUEE | Adaptateur client et handler protege, sortie strictement validee, annulation, timeout, limites et absence de retry automatique. Cle, hebergement, verification d'identite et quota durable manquants. |
| P3 | TESTE navigateur | Saisie, corrections, provenance, exclusions, deplacement et ordre, rendu hotel/transport, bilan, quatre langues, 320/390 px, clavier. |
| P4 | TESTE localement | Journal prepare avant ecriture, relecture, identite stable, reprise sans doublon, isolation comptes/local, conservation de l'existant, export/restauration. |
| P5 | TESTE sur build compile | Carte Leaflet, seul point Louvre explicite, ville inconnue sans marqueur, reload/hors ligne, export reel et restauration equivalente dans un autre profil. |
| P6 | TESTE localement ; livraison partielle | Revue croisee avec corrections, gate complet 21/21, rapport et preuve JSON. PR preparee localement, creation distante non executee ; voir section PR. |

## Contrat et choix de representation

`PlanningDraft.version = 1` contient titre, villes, journees, elements et notes. Aucun ID du modele n'est accepte. Chaque information importante possede une provenance : `source`, `missing`, `conflict`, `suggestion`, ou `user`. Les citations doivent etre presentes dans le texte et contenir les valeurs litterales correspondantes. Les nombres des coordonnees doivent correspondre exactement. `user` est interdit dans les reponses du fournisseur et apparait seulement lors d'une correction locale.

Le brouillon editable peut etre incomplet et demeure recuperable. La conversion est stricte avant toute creation. Un conflit dans un element actif bloque la confirmation ; corriger le champ ou exclure l'element permet de continuer. Les formes invalides de reponse fournisseur sont rejetees avant revue. Un score de confiance n'est ni demande ni utilise.

- Les periodes restent du texte ; seules les heures explicites alimentent `Day.preparation.timings`.
- Les journees sans date restent non datees. L'action facultative de datation est explicite et conserve les dates deja presentes.
- Suggestions et alternatives vont dans les bonus, distincts du planning principal. Leur nature reste visible dans la description. Les informations non mappables restent dans les notes documentaires.
- Un hotel est visible dans le planning et dans les hebergements. Le modele actuel ne permet qu'un hebergement par ville : les hebergements supplementaires restent dans le planning et leurs details dans les notes.
- Un transport interville est projete si la destination est unique et identifiable. Sinon les informations sont conservees en notes et dans l'activite de transport. Pas de fuseau ni d'annee deduit ; les heures locales sont interpretees avec le fuseau choisi explicitement pour le carnet.
- Aucun montant ne cree une depense ou un budget engage. Le corpus couvre les reservations confirmees, les suggestions, les alternatives, les dates absentes et un trajet de nuit.
- Changer un titre de lieu ou son adresse retire ses anciennes coordonnees pour eviter un repere devenu trompeur. Aucun fournisseur geographique n'est ajoute.
- Les IDs du carnet, des villes, jours, activites, bonus, documents et transports sont generes par l'application. Pas de fusion avec un carnet existant.

Le contrat ne garantit pas a lui seul la fidelite semantique : une citation existante ne prouve pas l'affectation a la bonne ville ni l'exhaustivite. L'apercu reste obligatoire. La validation effective d'un modele sur programme libre reste a faire apres activation autorisee.

Les extraits conserves en notes sont calcules par la meme fonction dans le bilan et la conversion. Ils sont consultables avant confirmation. Une citation couvrant tout le programme ne peut pas faire disparaitre des details non mappes. La fixture Paris compte quatre notes conservees, dont le budget estime et les trois lignes composites.

## Creation durable et synchronisation

Le brouillon utilise `detours-planning-draft-v1` dans le stockage de l'espace courant. `AccountStorage` fournit son namespace par compte ; aucun brouillon local ou d'un compte A ne se charge dans B.

Le commit sauvegarde d'abord le candidat complet avec son identite stable, ecrit le carnet, relit son contenu et sauvegarde le recu. Une interruption entre ces etapes permet une reprise du meme candidat. Apres preparation persistante, les champs de revue sont verrouilles ; l'interface propose de terminer le candidat ou d'effacer le brouillon pour un nouvel import. Une reprise avant recu compare aussi le carnet au candidat. Apres succes, la reprise ouvre la version courante, sans remplacer des modifications ulterieures. Deux imports volontaires distincts ont des identites distinctes, meme si leurs textes sont identiques.

Un import dans un compte cree une capsule `localOnly: true, pending: false`. Modifications et suppression restent locales. `syncRecord` refuse aussi un envoi de capsule locale. Le panneau de partage demande un consentement explicite pour **Rattacher ce carnet au compte** avant l'envoi par le parcours existant. Ce choix ne cree pas d'invitation automatiquement. Pas de changement de droits serveur/RLS, de projection distante ni de schema SQL.

Le carnet final utilise les archives et sauvegardes existantes et ne depend pas du fournisseur IA. Le drapeau localOnly appartient au cache, pas au format d'archive ; une restauration utilise le parcours de destination existant. Le gate ne prouve aucun rattachement reel ni OAuth reel.

## Extraction et configuration manquante

Adaptateur initial : OpenAI Responses, modele fige `gpt-4.1-mini-2025-04-14`. La documentation officielle verifiee et la justification sont dans [la recherche](IMPORT-PLANNING-RESEARCH.md). Les seules donnees transmises sont le programme synthetique ou consenti et les instructions fixes d'extraction, sans outils ni navigation. `store: false` est demande. Les journaux de surveillance du fournisseur peuvent conserver les donnees jusqu'a 30 jours par defaut ; aucun programme complet ni reference de reservation n'est journalise par ce code.

L'inspection des noms de variables du `.env.local` d'origine confirme uniquement `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ENABLE_COLLABORATION`. Aucun secret n'a ete affiche ni copie dans le worktree. Il n'y a aucune cle IA ni route applicative serveur configuree pour cette fonction.

`server/planning-extraction.mjs` exporte un handler Web `Request -> Response`, volontairement non monte. Il ne fonctionne que si sont fournis : activation serveur, cle privee, fonction d'authentification verifiant le jeton de session cote serveur et debit atomique de quotas durables par compte et globaux. Sans ces dependances : 503 avant tout appel. L'identite ne vient pas d'un ID libre fourni par le navigateur. Un compteur memoire ne satisfait pas le contrat de quota. L'adaptateur d'hebergement doit aussi limiter les requetes non authentifiees et la concurrence.

Limites : 50 000 caracteres client/serveur, corps serveur 350 Ko, reponse 1 Mo, sortie 12 000 tokens, timeout handler 35 s/client 45 s. Pas de troncature silencieuse. Pas de retry automatique facturable. Le texte est traite comme donnees non fiables ; pas de lecture d'URL, d'outils, de secrets ni de navigation. React rend les valeurs comme texte et les liens de carte reutilisent les protections existantes.

Activation restante, sans autorisation generale supplementaire pour le travail local :

1. Obtenir une configuration d'essai et une autorisation specifique pour un appel fournisseur sur les fixtures synthetiques ; aucune cle a demander dans l'interface.
2. Fournir un hebergement autorise pour `/api/planning-extraction`, verification de session cote serveur, quotas persistants atomiques et limites d'infrastructure. Garder la cle privee cote serveur.
3. Executer les essais reellement contre le fournisseur, verifier refus de l'anonyme, quota, annulation et journalisation, puis mesurer la fidelite des trois fixtures et de variantes.
4. Activer le flag public `VITE_PLANNING_EXTRACTION_ENABLED=true` seulement pour la cible configuree. Aucune publication n'est incluse dans cette contribution.

## Fichiers

- `src/planning-import/{types,draft,fixtures,persistence,extraction}.ts` : contrat, validation/conversion, exemples, journal et client.
- `src/components/PlanningImport.tsx`, `.css`, `JourneysApp.tsx` : saisie/revue et entree de l'accueil chargee a la demande.
- `src/locales/planning-import.ts`, `src/locale-utils.ts` : quatre langues.
- `src/cloud/{storage,engine,status}.ts`, `SharePanel.tsx`, `TripCollaboration.tsx` : carnet importe local, consentement et etat correct.
- `server/planning-extraction.mjs` : handler ferme par defaut ; aucun SDK serveur ajoute.
- `tests/planning-{import,extraction}.test.mjs`, `tests/e2e/planning-{import,analysis}.spec.ts`, `playwright.planning.config.ts`, `playwright.config.ts` : corpus, erreurs, reprise et navigateur.
- `scripts/smoke-planning-import.mjs`, `scripts/verify-local.mjs` : parcours compile et ajout des nouveaux controles au gate.
- Ce rapport, recherche et description de PR locale.

## Tests et preuves

Tests comportementaux de persistance ecrits avant leur implementation et observes en echec, puis reussis. La premiere conversion et ses fixtures ont ete caracterisees apres implementation ; pas de revendication TDD retroactive. Les regressions de relecture, saisie vide, exclusion et coordonnees ont ensuite ete observees en echec avant correction.

Resultats cibles executes avant le gate : 12 tests import, 7 tests extraction avec fournisseur simule ; 10 tests navigateur de revue ; 3 tests navigateur d'analyse avec endpoint simule. Typecheck et lint executes au cours de l'integration.

**Gate final `npm run verify:local` REUSSI, 21/21 etapes, code 0, aucune etape sautee, `sourceUnchanged: true`.** Preuve durable : [import-planning-validation.json](import-planning-validation.json). Execution originale : `C:/Users/eliot/AppData/Local/Temp/detours-verify-MBx3yW/validation.json`. Node 24.15.0, Chrome installe, backend/sessions simules, SQL uniquement en memoire, resolution DNS externe bloquee pour les navigateurs du gate.

- Types produit, tests/configurations et lint : reussis.
- Tests unitaires : 123/123, incluant les 19 nouveaux tests import/extraction.
- Tests navigateur : 47 + 3 + 20 = 70/70, dont revue en quatre langues a 320/390 px et analyse simulee.
- Build, service worker/manifeste et integrite : reussis. Identite `111f3d93fb2d26ead7a93a2ef18a26bd370e1e0aab30e3817ca9345901bb519c`, 23 assets et worker. Apercu charge a la demande : chunk JS 31,64 Ko brut / 9,90 Ko gzip ; entree principale 475,94 Ko.
- SQL L6/PGlite hors depot : reussi, sans base distante.
- Dix smokes compiles : reussis, dont parcours planning/carte/hors ligne/archive restauree. Captures finales dans `C:/Users/eliot/AppData/Local/Temp/detours-planning-import-va9FuW`, 320/390/1440 px. Deux captures inspectees visuellement pendant l'integration.
- Hors ligne : fond geographique local et marqueur explicite verifies ; les tuiles detaillees des rues distantes ne sont pas garanties, limite existante de la carte.
- Extraction IA reelle, OAuth reel, tests reseau Supabase/taux et appareil physique : NON EXECUTES.

Echec intermediaire execute et corrige : apres l'ajout de la liste des notes avant confirmation, le dernier smoke du gate trouvait deux blocs `.planning-source` au lieu d'un. Le selecteur est maintenant borne au detail **Texte source** et une assertion distincte controle les notes. Le smoke cible reexecute puis le gate complet passent. Les premiers tests navigateur ont aussi signale un chargement froid attendu trop longtemps et une assertion obsolete sur les coordonnees apres correction ; les tests ont ete ajustes au chargement DOM et au retrait volontaire des coordonnees devenues incertaines. Aucun echec de produit restant n'est masque par ces corrections de tests.

| Fixture | Resultat attendu verifie | Notes conservees |
| --- | --- | --- |
| Paris | Une date ISO, Louvre avec coordonnees explicites, Matin sans heure, un hotel reserve, aucune depense deduite | Budget estime et lignes composites non couvertes integralement par un champ |
| Shanghai/Pekin | Train 21 h le 2 mai vers 8 h le 3 mai, destination reliee, nom/adresse chinois, reservation non confirmee | Details horaires/composites non entierement structures |
| Madrid | Journee sans date, une activite, deux envies distinctes, hotel contradictoire bloque jusqu'a correction/exclusion | Choix d'hotel et arrivee ambigue restent relisibles |

Les tests couvrent aussi sortie JSON invalide, champs inattendus, texte trop long, dates impossibles, coordonnees invalides/approximees, origine user interdite au modele, HTML conserve comme texte, quota, annulation, timeout, ancienne reponse, double confirmation/reprise, espaces comptes/local et archives. Le smoke compile couvre la carte et le hors ligne apres chargement. Pas d'essai physique iPhone/Safari, d'OAuth, de Supabase distant ni d'extraction IA reelle.

## PR et retour arriere

La description reviewable est preparee dans `IMPORT-PLANNING-PR.md`, base `codex/carnets-universels`, sans fusion. Aucun push n'est effectue : `vercel.json` n'interdit pas les deployments Git et le depot est lie a Vercel. L'absence de deploiement automatique pour cette branche n'est pas confirmee ; un push/PR pourrait lancer une preview contrairement a l'interdiction de deploiement. La creation distante de PR reste donc non executee, avec cette raison precise. Aucune configuration Vercel distante n'est modifiee pour contourner cette limite.

Retour arriere du code : conserver une sauvegarde exportee des carnets puis revenir au commit de base dans un checkout distinct, ou reverter le commit de contribution. Aucun ancien format ni cle de carnet n'est remplace ; ne pas effacer le stockage navigateur. Les carnets crees restent des `TripArchive` ordinaires, lisibles/exportables/restaurables avec la base precedente. Les capsules de compte localOnly meritent une precaution : une ancienne version ignore ce drapeau et peut mettre une modification en attente d'envoi. Exporter les carnets locaux avant d'utiliser une ancienne version connectee, ou utiliser leur copie restauree dans l'espace local. Aucun retour arriere de base distante n'est necessaire.

## Fiche d'essai ulterieur

Sur un profil jetable, fournir un programme synthetique dans sa langue, analyser apres activation autorisee, comparer aux informations attendues, corriger une adresse et une journee, exclure une alternative, creer puis ouvrir carte/planning, recharger hors ligne et exporter/restaurer. Relever pertes, inventions, erreurs de classement, temps et obstacles. Les cinq essais voyageurs et la disposition a payer restent une etape ulterieure ; aucun testeur contacte.
