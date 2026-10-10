# Détours — Rappels, récaps quotidiens et calendrier

> Plan d’orchestration transmissible à une IA de développement.
> Rédigé le 10 octobre 2026. Statut : direction produit validée, implémentation à réaliser.
> Cette demande porte sur le plan. Elle n’autorise aucun déploiement, envoi réel, achat, activation de tâche distante ou migration distante.

## 1. Mission et décisions produit

Faire de Détours un compagnon utile pendant le voyage : préparer le lendemain et rappeler les engagements horaires, sans transformer le carnet en flux d’alertes.

Décisions validées avec le porteur du projet :

- Proposer des rappels par activité, configurables dans les préférences et personnalisables sur une activité.
- Proposer des délais de rappel : 1 jour avant, 1 heure, 30 minutes, 15 minutes et durée personnalisée ; plusieurs délais possibles.
- Filtrer les types d’activités. Les hébergements sont désactivés par défaut, mais une exception manuelle reste possible.
- Ajouter une cloche dans l’application, ouvrant « Mes récaps ». Elle contient les récapitulatifs quotidiens, jamais l’historique des rappels individuels.
- Mettre Aujourd’hui et Demain en avant, avec un historique discret. Un seul récap par journée et voyage, mis à jour si le programme change.
- Ajouter un email facultatif pour le programme du lendemain, à une heure choisie. Le récap dans l’app reste accessible sans email ni autorisation push.
- Présenter les grandes lignes du programme, les horaires importants, la météo disponible et les affaires utiles à prendre.
- Améliorer l’ajout au calendrier à partir de l’export existant. Viser Apple Calendar, Google Calendar et Outlook avec des validations distinctes.
- Commencer sans IA générative. Une évolution IA pourra enrichir les suggestions après validation séparée.

Journal des arbitrages :

| Décision | Alternative écartée pour cette version | Motif |
|---|---|---|
| Cloche réservée aux récaps | Toutes les alertes dans un historique | Les rappels passés encombrent sans aider à préparer la journée |
| Rappels ponctuels séparés | Uniquement un email quotidien | Les deux besoins sont complémentaires |
| Règles explicites pour les affaires | IA obligatoire dès le départ | Coût, vérifiabilité et fiabilité |
| Faire évoluer l’export existant | Reconstruire une intégration calendrier complète | Réutilisation et périmètre maîtrisé |
| Fiche actualisable dans l’app | Recréer un message à chaque modification | Une seule référence lisible par journée |

## 2. État observé et vérifications de démarrage

L’inspection initiale a eu lieu sur `codex/corrections-mobile`, sans changements locaux. Le présent document est préparé sur `codex/plan-rappels-recaps`, créée depuis la base distante `codex/carnets-universels` récupérée le 10 octobre 2026, commit `9fa03b1`. Ces repères ne prouvent pas l’état futur du dépôt ni de la bêta.

L’IA doit commencer par lire `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md` et les instructions locales applicables, puis vérifier branche et changements présents. Préserver tout travail existant. Pour l’implémentation, créer une branche dédiée depuis la base partagée actualisée, conformément aux règles du dépôt.

Points d’intégration observés, à revalider avant modification :

| Fichier ou zone | Rôle utile |
|---|---|
| `src/types.ts` | Activités `Step`, dates `Day`, horaires `StepTiming`, fuseaux des étapes/voyage, transports `Transfer`, valise |
| `src/day-preparation.ts` | Validation stricte de la préparation et `activeSteps`, qui applique l’alternative pluie/fatigue sélectionnée |
| `src/calendar.ts` | Export ICS existant : un événement journée entière par journée datée, sans alarme individuelle |
| `src/components/TripOverview.tsx` | Déclenchement du téléchargement du calendrier |
| `src/components/NowView.tsx` | Vue Maintenant à réutiliser pour accéder au programme |
| `src/components/Preferences.tsx` | Préférences actuelles, notamment langue et apparence |
| `src/components/JourneysApp.tsx`, `src/App.tsx` | Navigation et affichage des voyages, emplacements possibles de la cloche |
| `src/cloud/projection.ts`, `src/cloud/engine.ts`, `src/cloud/CloudProvider.tsx` | Projection des données autorisées, synchronisation, contexte du compte |
| `src/persistence.ts`, `src/backup.ts`, `src/journeys.ts` | Persistance, restauration, identité et copie des voyages |
| `scripts/build-sw.mjs`, `public/manifest.webmanifest` | Construction du service worker et installation web |
| `src/locales/`, `tests/calendar.test.mjs`, `scripts/verify-local.mjs` | Traductions et vérifications à étendre |

Attention : `Step.period` est un texte libre, pas un horaire fiable. Les heures précises peuvent exister dans `Day.preparation.timings[stepId].startTime`. Ne pas créer une deuxième source d’horaire sans nécessité démontrée. Les transports interétapes possèdent leur propre modèle : ne pas les ignorer ni les compter deux fois.

Les recherches initiales n’ont pas identifié de moteur Web Push ou d’envoi quotidien déjà prêt. L’IA doit vérifier ce point et inventorier les éventuelles intégrations météo avant de choisir des services. Aucune capacité distante n’est présumée activée.

## 3. Périmètre et valeurs de départ

### Obligatoire pour la première version

Récaps dans l’app, préférences personnelles, rappels push sur les appareils compatibles, email quotidien facultatif, météo avec mode dégradé, checklist déterministe et export ICS amélioré. L’absence de secrets ou d’autorisation distante ne bloque pas le développement local des adaptateurs et des tests ; elle bloque leur activation réelle et doit être signalée.

### Hors périmètre

IA générative, application native, suivi GPS permanent, calcul automatique de l’heure de départ, mises à jour live des vols/trains, notifications sociales, email par activité, synchronisation bidirectionnelle Apple/Google, abonnement ICS distant. L’abonnement reste une évolution distincte : ne pas confondre import et synchronisation.

### Hypothèses d’exécution à documenter, sans nouvelle validation générale

Ces valeurs sont des propositions de première version, pas des préférences déjà exprimées par l’utilisateur. L’IA peut ajuster un détail réversible avec justification ; un changement de périmètre exige une décision produit.

- Bêta entre amis ; scénario de charge synthétique initial : 100 comptes, 5 voyages suivis par compte et 50 éléments par journée. Ce n’est pas une mesure de fréquentation réelle.
- Push et email désactivés avant activation explicite. Récaps consultables immédiatement dans l’app.
- Valeurs présentées lors de l’activation : rappel 30 minutes avant ; transports et visites à heure explicite sélectionnés ; autres catégories désélectionnées. Une réservation ne crée pas automatiquement une heure.
- Heure proposée du récap : 20 h, modifiable. Historique limité initialement aux 30 derniers jours ; suppression des anciens caches sans toucher au carnet.
- Délai personnalisé : entier de 1 à 10 080 minutes, avec saisie en minutes/heures/jours ; 5 délais distincts maximum par événement, triés et dédupliqués.
- Récap du lendemain envoyé une fois par voyage et destinataire ; ne pas créer de récap pour une journée absente ou vide. Afficher un état vide explicite dans l’app.
- Traitement serveur visé à la minute, si l’infrastructure autorisée le permet. Cela ne garantit pas l’heure de réception par le téléphone ou la boîte mail.
- Aucun appel météo ni génération de récap ne doit bloquer l’ouverture du carnet. Charger le panneau à la demande, mettre en cache et borner les traitements.

## 4. Contrat fonctionnel

### 4.1 Préférences et rappels individuels

Prévoir des réglages personnels, distincts du contenu partagé : canaux, catégories, délais, heure et fuseau du récap, voyages suivis. Une modification par un membre ne modifie jamais les préférences des autres.

Sur une activité, proposer trois états : « Selon mes préférences », « Désactivé », « Personnalisé ». L’exception personnelle l’emporte sur le filtre de catégorie. Si aucun horaire précis n’existe, proposer de le renseigner avec les droits applicables ; un lecteur ne peut pas modifier le planning partagé. Expliquer pourquoi un rappel est indisponible.

Réutiliser les horaires explicites. Ne pas déduire une heure de « matin », d’une description ou d’une durée estimée. Pour une activité sans heure, conserver sa présence dans le récap, sans notification horaire. Pour les transports, respecter le fuseau de départ déjà disponible.

Une alerte ouvre l’activité ou le transport du bon voyage. Si l’objet est supprimé, inaccessible ou déplacé, afficher une issue compréhensible ; ne pas ouvrir un autre objet avec un identifiant approchant. Ne jamais ajouter l’alerte à « Mes récaps ».

Suspendre les envois sur les voyages terminés/annulés, les éléments supprimés ou marqués faits lorsque ce statut s’applique, les activités exclues par l’alternative active et les voyages dont l’accès est perdu. Recalculer les occurrences futures après changement de date, d’heure, de fuseau ou de préférences.

### 4.2 Cloche et Mes récaps

Prévoir une entrée cohérente sur mobile et ordinateur, accessible au clavier, avec nom accessible, focus visible et fermeture/restauration du focus. Ne pas refondre toute la navigation.

- Dans un voyage : montrer ses récaps. Depuis l’accueil, si la cloche y est disponible, regrouper explicitement par voyage sans mélanger les journées.
- Sections prioritaires Aujourd’hui et Demain, puis historique replié. Toujours afficher la date et le voyage, car « demain » seul est ambigu.
- Le récap créé la veille reste celui d’aujourd’hui. En mode local, produire aussi la fiche à l’ouverture si l’application était fermée la veille.
- Une identité logique par espace personnel, voyage et date civile ; en cas de plusieurs journées à cette date, les agréger sans écrasement.
- Point discret pour un récap disponible non lu, pas de compteur croissant. Marquer lu à l’ouverture de la fiche ; ne pas réactiver le point à chaque rafraîchissement météo.
- Contenu : étapes principales, horaires saisis, réservations connues, météo sourcée et datée, affaires conseillées ou requises explicitement, bouton « Voir la journée ».
- Conserver les données déjà chargées hors ligne, avec indication de leur fraîcheur. L’absence de push/email n’empêche jamais ce parcours.

Le contenu courant de la fiche peut être recalculé, mais conserver la révision de référence du récap du soir et les métadonnées d’envoi. En cas de changement ultérieur du planning, afficher « Programme modifié depuis le récap du soir ». Distinguer changement du programme et simple actualisation météo. Ne pas réenvoyer automatiquement l’email ni créer un nouveau récap. Pour l’historique passé, conserver une photographie bornée plutôt que réécrire rétroactivement tous les souvenirs.

### 4.3 Email et notification de disponibilité

L’email doit utiliser le même modèle de récap que l’application, rendu en HTML échappé et texte simple, dans la langue personnelle parmi les quatre langues. Inclure la date, le fuseau pertinent, les informations utiles et un lien vers Détours. Aucun document privé, numéro de passeport, référence sensible ou note personnelle ne doit être repris sans nécessité explicite.

Utiliser l’adresse vérifiée du compte comme destinataire initial. Une adresse différente nécessite un parcours de vérification ; ne pas créer d’outil d’envoi vers des tiers arbitraires. Prévoir une désactivation simple des emails sans désactiver les récaps. Un éventuel lien de désinscription doit être limité à cette action.

Le push « Ton programme de demain est prêt » est une option distincte des rappels d’activités. Il ouvre la fiche. Un seul email et un seul push de disponibilité par occurrence, hors reprise technique contrôlée. Les alertes d’activités ne sont pas envoyées par email.

### 4.4 Météo et affaires à prendre

Choisir un fournisseur uniquement après vérification des conditions d’usage, de l’attribution, des quotas, de la couverture, du coût et de la fraîcheur des données. Réutiliser une intégration si elle existe. La localisation provient du programme ; aucune permission GPS n’est nécessaire pour ce besoin.

Prévisions pour les lieux et dates concernés, pas la météo du téléphone. Une journée avec déplacement peut montrer plusieurs lieux, en restant concise. Sans coordonnées fiables ou au-delà de l’horizon de prévision, indiquer l’indisponibilité, sans inventer de valeurs ni empêcher le récap.

Règles explicables et testables : pluie prévue → protection pluie ; exposition extérieure et UV disponibles → conseil de protection solaire ; marche déclarée → chaussures adaptées ; document explicitement requis → rappel de ce document. Définir et tester les seuils météo choisis. Ne jamais présenter une suggestion comme une obligation légale ou une condition d’admission vérifiée.

La valise existante indique potentiellement « emballé », pas « dans mon sac aujourd’hui ». Ne pas assimiler ces états ni modifier automatiquement les coches. Éviter une nouvelle liste parallèle si une présentation dérivée suffit.

### 4.5 Calendrier

Conserver l’export historique par journée. Ajouter une option d’export des activités et transports datés, avec horaires explicites, fuseaux corrects, lieu utile et lien vers Détours. Les éléments sans heure peuvent rester dans le résumé journée entière ; ne pas leur attribuer arbitrairement minuit.

Utiliser des UID stables comprenant le voyage et l’identité de l’objet, un échappement et un pliage ICS conformes, les alternatives actives et les choix de périmètre. Éviter les doublons entre transports et étapes liées. Ne pas inventer une durée : utiliser une durée connue ou une représentation ICS valide sans fin si le client la supporte, puis documenter les différences observées.

Proposer l’inclusion des alarmes en option, désactivée par défaut pour limiter le cumul avec les push Détours. Tester leur interprétation par les clients ; ne pas promettre une gestion identique des alarmes ou réimports.

Afficher clairement : « Copie du programme au moment de l’export. Les changements dans Détours ne sont pas synchronisés automatiquement. » Des UID stables ne prouvent pas que chaque calendrier fusionnera les réimports. Ne pas annoncer « tous les calendriers » après un simple test du fichier.

## 5. Temps, livraison et cohérence

### Fuseaux et occurrences

Conserver dates civiles, heures locales et fuseaux IANA ; calculer les échéances UTC côté logique partagée. Ordre de résolution pour une activité : fuseau de l’étape, puis du voyage. Si aucun fuseau fiable n’existe, demander le renseignement plutôt qu’utiliser silencieusement celui du serveur.

Pour « 1 jour avant », la V1 utilise 24 heures de délai ; le libellé doit l’expliciter. « Récap la veille à 20 h » est au contraire une règle de date civile. Tester le passage à minuit et les changements d’heure. Heure locale inexistante : prochain instant valide ; heure répétée : première occurrence seulement, avec test et comportement documenté.

Le fuseau d’envoi du récap est une préférence IANA explicite, initialisée depuis celui du voyage et affichée dans les réglages. Il reste stable malgré les déplacements du téléphone. La fiche « Aujourd’hui/Demain » utilise ce même repère pour sélectionner sa date ; les horaires locaux des activités restent affichés avec leur fuseau si différent. Ne pas inventer un suivi automatique de la position du voyageur. Toute amélioration de cette règle doit être explicitement documentée avant implémentation.

### Planification et reprise

Ne pas utiliser un `setTimeout` dans une page ni maintenir artificiellement un service worker éveillé pour promettre des rappels application fermée. Prévoir un ordonnanceur serveur pour les canaux distants, alimenté uniquement par les données synchronisées autorisées. Une modification encore hors ligne ne peut pas annuler un envoi que le serveur ignore : rendre la limite visible dans les réglages et les essais.

Prévoir une file ou table d’occurrences avec états, échéance, révision source, canal, destinataire, tentatives et bail de traitement. Contraintes d’unicité et prise atomique empêchent deux workers de traiter normalement la même occurrence. Les noms et le schéma final restent au choix de l’IA.

Clé logique minimale : destinataire, voyage, objet/date, type, délai, canal ; appareil pour une livraison push. Définir une politique de recalcul qui invalide les échéances anciennes sans renvoyer une occurrence déjà acceptée par le fournisseur. Utiliser l’idempotence du fournisseur lorsqu’elle existe. Traiter explicitement le crash après acceptation externe mais avant écriture locale : une garantie absolue « exactement une fois » n’est pas réaliste sans support externe.

Avant chaque envoi/reprise, revérifier préférences, accès courant, activité, révision et validité de l’échéance. Reprises bornées avec backoff. Valeurs initiales : ne plus envoyer un rappel au-delà de 5 minutes après son échéance ou après le début de l’événement ; ne pas rattraper un email plus de 2 heures après l’heure choisie ni après le début de la date ciblée. Une activation tardive ne rejoue pas tous les anciens rappels. Préserver le récap dans l’app.

Le push est envoyé une fois par appareil inscrit : plusieurs appareils volontairement activés peuvent chacun le recevoir. L’email reste unique par compte. Sur un même appareil, la notification de même occurrence doit pouvoir remplacer son doublon technique si la plateforme le permet. Ne pas confondre cela avec une preuve de lecture.

## 6. Architecture, confidentialité et mode local

Séparer sans multiplier inutilement les couches :

1. Logique pure : projection du programme actif, résolution des dates, calcul des occurrences, récap, règles de checklist et modèle calendrier.
2. Stockage personnel : préférences, exceptions, lectures, cache des récaps ; isolation par compte/espace local et voyage.
3. Interface : préférences, cloche, fiche, réglages d’activité et export.
4. Services serveur : planification, livraison email/Web Push et récupération météo, derrière des adaptateurs testables.

Réutiliser l’infrastructure Supabase si son inspection confirme sa pertinence. Cron et Edge Functions constituent une piste, pas un service déjà activé. Vérifier la documentation courante avant d’implémenter. Ne pas ajouter Redis, plusieurs ordonnanceurs ou un bus distribué sans besoin démontré.

Exigences de sécurité :

- RLS et autorisations sur toutes les données personnelles exposées. Le droit d’accéder au voyage ne donne pas accès aux préférences, endpoints push ou états de lecture des autres membres.
- Le worker ne doit pas envoyer des notes ou détails que le destinataire ne peut plus lire. Reprendre la projection des droits existante et la tester sous les rôles réels, sans contournement.
- Secrets d’email, clés privées Web Push et privilèges serveur exclusivement côté serveur. Aucun secret dans le frontend, les logs, `.env.example` ou les archives.
- Souscriptions push traitées comme des données sensibles ; endpoints validés, requêtes réseau bornées et protégées contre les destinations arbitraires/SSRF.
- Désinscrire ou désactiver l’association de cet appareil au compte lors de déconnexion/changement de compte. Prévoir aussi « Désactiver cet appareil » et « Désactiver tous mes appareils » pour le canal push.
- Retrait d’un membre, suppression du voyage ou du compte : annuler les occurrences et purger les données personnelles dérivées concernées. Ne pas annoncer que le cycle de suppression de compte est terminé si l’existant ne le permet pas encore.
- Choix de contenu discret sur écran verrouillé ; ne pas mettre de document ou donnée sensible dans le payload. Un clic revérifie l’accès avant d’afficher le carnet.

Mode local : préférences, récaps dérivés, cache météo déjà obtenu et export calendrier restent utilisables sans compte. Aucun transfert implicite d’un carnet local au serveur. Push programmés et emails nécessitent, pour la V1, un compte et un voyage synchronisé explicitement ; expliquer cette condition sans bloquer le carnet local.

Migrations et sauvegardes : valider les entrées avant écriture, relire ensuite, garder les sources récupérables, préserver les formats historiques. Les préférences non sensibles et exceptions doivent être couvertes par le contrat de sauvegarde approprié avec remapping des identités. Ne pas exporter sessions, clés, souscriptions push, file d’envoi ou caches météo. Restaurer/importer/dupliquer ne doit jamais réactiver un canal distant ni rejouer les notifications d’un ancien voyage. Préférer un recalcul des récaps locaux.

## 7. Lots d’implémentation et dépendances

L’agent pilote maintient un tableau de suivi dans son compte rendu : lot, état, fichiers, contrôles, limites et prochaine action. Pas besoin de produire un document par sous-tâche.

| Lot | Travail | Dépendances | Critère de fin |
|---|---|---|---|
| N0 — Inspection et contrats | Vérifier les repères, droits, horaires, transports, worker, sauvegardes ; préciser schéma, fuseaux, fournisseurs et valeurs de départ | Aucune | Contrat court, points ouverts isolés, aucune fonctionnalité existante supposée |
| N1 — Modèle et logique | Préférences personnelles, exceptions, projection active, dates, occurrences, récap pur, compatibilité/import | N0 | Tests déterministes des règles et migrations ; pas d’envoi externe |
| N2 — Mes récaps | Cloche, Aujourd’hui/Demain, historique borné, point non lu, fiche, actualisation, hors ligne, quatre langues | N1 | Parcours local complet utilisable sans canaux distants |
| N3 — Planification et droits | Stockage serveur, RLS, occurrences, annulation, bail, reprise, mode simulation | N1 | Deux workers et deux comptes testés ; accès révoqué bloqué ; aucun envoi réel |
| N4 — Rappels push | Réglages, exceptions, inscription d’appareil, worker existant, clics, support/refus/expiration | N2, N3 | Scénarios simulés complets ; protocole iPhone/Android/PC prêt |
| N5 — Météo, checklist, email | Adaptateur météo, règles, rendu email, préférences d’heure, désinscription, push de récap | N2, N3 ; N4 pour push de récap | Même contenu métier app/email ; panne météo non bloquante ; email simulé unique |
| N6 — Calendrier | Export historique préservé, événements horaires, alarmes optionnelles, sélection et explication | N1 | ICS validé ; matrice Apple/Google/Outlook distingue essais réels et non exécutés |
| N7 — Intégration et validation | Non-régression, charge bornée, sécurité, reprise, traductions, gate, guide d’exploitation | N2 à N6 | Gate exécuté, preuves et limites publiées dans le dépôt, procédure de retour arrière |
| N8 — Activation contrôlée | Configurer fournisseurs, migrations, ordonnanceur et déploiement sur cible autorisée | N7 + autorisation explicite de publication | Essais réels sur comptes de test autorisés ; réception et arrêt vérifiés |

Ne pas annoncer l’ensemble livré après N2 : la cloche seule ne satisfait pas les rappels/email. Si N8 manque, annoncer « implémenté et validé localement, activation distante en attente » pour les canaux concernés.

### Coordination si plusieurs agents sont utilisés

Un pilote possède le modèle, le schéma, les règles de dates et l’intégration. Après N1, on peut confier N2 à un agent interface, N3 aux services et N6 au calendrier, avec ownership explicite des fichiers. N4 et N5 attendent les contrats N3.

Ne pas laisser plusieurs agents modifier simultanément `src/types.ts`, `src/backup.ts`, le service worker généré, les mêmes migrations ou les fichiers de traduction sans coordination. Fixer les interfaces communes avant parallélisation ; chaque agent rend son diff, ses contrôles et les risques résiduels. Une seule personne intègre et exécute le gate final.

Liberté technique : réutiliser, simplifier, choisir une bibliothèque maintenue si nécessaire et justifiée. Validation produit requise pour une refonte majeure, la suppression du mode local, l’ajout d’IA, un suivi GPS ou une synchronisation calendrier bidirectionnelle. La configuration payante et les actions distantes nécessitent leur autorisation propre. Continuer les lots indépendants pendant une décision externe.

## 8. Matrice de validation obligatoire

Utiliser horloge injectable et fournisseurs simulés. Aucun test automatique ne doit envoyer un vrai email ou notifier des voyageurs.

| Domaine | Cas à couvrir |
|---|---|
| Rappels | 24 h/1 h/30 min/15 min/personnalisé ; déduplication ; catégorie exclue ; exception explicite ; heure absente ; activité faite/supprimée |
| Programme | Modification après planification ; déplacement de journée ; alternative pluie/fatigue ; transport interétapes ; plusieurs jours à même date |
| Fuseaux | Paris/Shanghai ; téléphone dans un autre fuseau ; minuit ; heure d’été inexistante/répétée ; départ/arrivée avec fuseaux distincts |
| Récaps | Aujourd’hui/Demain ; non lu puis lu ; une fiche après plusieurs modifications ; historique borné ; email ancien et fiche actualisée |
| Local et réseau | Premier usage sans compte ; app fermée la veille ; hors ligne ; données périmées ; synchronisation différée explicitement signalée |
| Droits | Deux comptes, deux appareils, lecteur/éditeur, membre révoqué avant envoi, déconnexion, changement de compte, voyage supprimé |
| Livraison | Workers concurrents ; crash avant/après appel fournisseur ; retry ; résultat incertain ; quotas/429 ; souscription expirée ; occurrence obsolète |
| Météo/checklist | Prévision absente/périmée, plusieurs lieux, seuils, pas de passeport inventé, pas de mutation des coches de valise |
| Sauvegardes | Ancien export, nouveau format, remapping, migration répétée, écriture interrompue/reprise, restauration sans réactivation distante |
| Calendrier | UTF-8, caractères spéciaux, UID, dates/fuseaux, absence de durée, alarmes, export ancien, réimport documenté, alternatives actives |
| Interface | Mobile 320/390 px, clavier, focus, lecteur d’écran, zoom, thème clair/sombre, quatre langues, aucun overflow masqué |
| Worker | Cache hors ligne, mise à jour de l’app, push/clic, aucun conflit avec le worker existant |

Mesurer sur les fixtures annoncées : temps de construction du récap, nombre d’appels météo, traitement d’un lot et stabilité des reprises. Les objectifs de charge sont synthétiques et ne prouvent pas la capacité en production.

Exécuter les tests ciblés puis `npm run verify:local` avant livraison de code, avec PGlite hors dépôt, `DETOURS_PGLITE_PATH` configuré et port 5173 libre. Intégrer les contrôles critiques nouveaux au gate lorsque pertinent. Le gate ne valide ni email réel, ni fournisseur push, ni iPhone physique. Tester ces canaux séparément en N8 et consigner les plateformes réellement utilisées.

Le gate construit avec une configuration factice : reconstruire pour la cible avant toute publication autorisée, selon `docs/development/L8.md`.

## 9. Exploitation, livraison et reprise par une autre IA

Prévoir un interrupteur serveur d’arrêt des envois, séparé de la consultation des récaps. Journaliser seulement les identifiants techniques nécessaires, état, latence et motif d’échec ; pas le contenu du voyage. Documenter quotas, limites de tentatives, purge et coût estimé fondé sur les tarifs vérifiés des fournisseurs choisis. Configurer un signal d’erreur pour une file bloquée sans spammer les utilisateurs.

Avant activation : sauvegarde, migrations compatibles et testées, configuration des secrets, domaine d’email si nécessaire, inscription push sur comptes de test, cadence autorisée et surveillance. Ne pas activer automatiquement un cron lors de la simple application d’une migration de schéma : séparer l’activation des envois.

Retour arrière : arrêter d’abord les workers/envois, désactiver les canaux, revenir au frontend précédent si nécessaire, conserver les données compatibles et les preuves. Ne pas supprimer des carnets ni annuler destructivement les migrations. Vérifier que la consultation locale et les exports fonctionnent encore.

Livrables attendus de l’IA :

- Code intégré, migrations locales, adaptateurs et exemples de configuration sans secrets.
- Tests et rapport indiquant réussi/échoué/non exécuté, avec motif et preuves.
- Guide concis d’activation et de retour arrière, limites connues, besoins externes restants.
- Compte rendu produit : ce qui est visible et fonctionnel, ce qui est simulé, ce qui reste à activer ou vérifier sur appareil.
- PR vers `codex/carnets-universels` selon le workflow du dépôt ; aucune fusion ou publication implicite.

En cas d’interruption, laisser : commit/branche, lots terminés, contrats retenus, commandes et résultats, fichiers en cours, blocage précis et prochaine action sûre. Une roadmap ou un mock ne vaut pas implémentation.

## 10. Références à revalider avant intégration

- [Apple — Web Push pour les applications web](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) : prise en charge notamment pour les apps web ajoutées à l’écran d’accueil sur iOS 16.4 ou ultérieur ; vérifier version, autorisation et parcours réel.
- [Google Calendar — Importer des événements](https://support.google.com/calendar/answer/37118?hl=en-uk) : un import ne reste pas synchronisé avec la source.
- [Supabase Cron](https://supabase.com/docs/guides/cron) et [planification des Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) : pistes pour l’ordonnancement serveur, à vérifier sur l’environnement autorisé.
- [Changelog Supabase](https://supabase.com/changelog) : à consulter avant intégration ; l’index Markdown n’a pas pu être lu par l’outil web lors de la rédaction, aucune absence de changement incompatible n’est donc affirmée.

## Prompt prêt à transmettre

> Lis `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md` et `IMPLEMENTATION_PLAN_NOTIFICATIONS_RECAPS.md`. Implémente les lots N0 à N7 en préservant le mode local, les données, les droits et les quatre langues. Commence par vérifier le code et les contrats du plan ; distingue les décisions validées des valeurs de départ proposées. Réutilise les horaires, l’export calendrier et le worker existants. Avance jusqu’à une implémentation locale vérifiée, sans te limiter à une maquette. Si un fournisseur ou secret manque, termine les adaptateurs et tests simulés, puis indique précisément ce qui empêche l’activation réelle. N’effectue ni migration distante, ni déploiement, ni activation d’ordonnanceur, ni envoi réel sans autorisation explicite. Rapporte chaque lot, les contrôles exécutés, les limites et les étapes restantes.
