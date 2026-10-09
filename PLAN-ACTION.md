# Détours — Plan d’action pour la suite du développement

Créé le 6 octobre 2026 ; réconcilié le 8 octobre dans L3. Les anciens lots 0–6 décrivent la feuille de route produit ; ils ne correspondent pas aux lots L0–L8 du [plan de développement actuel](ORCHESTRATION-DEVELOPPEMENT.md). Les résultats datés ci-dessous sont conservés comme historique. Le statut courant et les preuves locales sont dans `docs/development/L3.md`.

## 1. Mission et mode d’emploi pour l’IA

Faire évoluer l’application existante vers des carnets synchronisés entre appareils, une carte personnelle du monde et des voyages partagés entre quelques amis. Suivre les lots ci-dessous dans l’ordre, en conservant les fonctions et les données existantes.

Ce document décrit du travail à réaliser. Aucune case cochée, fonctionnalité livrée ou validation réussie ne doit être déduite de sa seule présence.

Consigne d’exécution :

1. Lire les instructions applicables du dépôt, le README, ce plan et le code concerné. Vérifier l’état réel avant toute modification : les descriptions ci-dessous peuvent vieillir.
2. Inspecter `git status`. Des modifications importantes existaient déjà lors de la rédaction : ne pas les écraser, les réinitialiser ou les attribuer au travail de cette session.
3. Réaliser un lot cohérent à la fois, avec les contrôles nécessaires, puis mettre à jour le suivi à la fin de ce document.
4. Prendre les décisions courantes de façon autonome en respectant les choix ci-dessous. Ne demander des précisions que pour une information réellement manquante ou une décision qui change le périmètre.
5. Ne jamais inventer des identifiants, secrets, projets Supabase ou résultats de tests. Si un accès externe manque, préparer le code, les migrations, les tests et les instructions de configuration ; poursuivre les travaux indépendants et indiquer précisément ce qui reste non vérifié.
6. Conserver les secrets hors du dépôt et du navigateur. Documenter uniquement des noms de variables et des valeurs fictives dans `.env.example`.
7. Ne pas effectuer de déploiement en production, de migration destructive ou d’envoi de messages aux amis sans autorisation couvrant cette action. La lecture de ce plan autorise son implémentation, pas automatiquement ces opérations externes.
8. Ne pas s’arrêter après une proposition de plan : développer les lots autorisés. À chaque interruption, laisser un point de reprise précis. Ne déclarer un lot terminé qu’après ses critères de validation.

## 2. Objectif produit et limites

Public initial : le propriétaire et quelques amis pour la bêta. Objectif ultérieur confirmé le 6 octobre 2026 : ouverture au grand public. Le dimensionnement gratuit initial (moins de 10 utilisateurs, quelques dizaines de voyages) ne constitue pas la cible finale ; comptes indépendants, droits serveur, isolation et plafonds par compte doivent permettre cette évolution.

Objectifs :

- Retrouver ses voyages sur ordinateur et téléphone avec un compte personnel.
- Garder un usage rapide et utile sans connexion pour les carnets téléchargés.
- Visualiser les pays visités, les retours dans un pays et les prochains voyages.
- Ouvrir facilement les lieux et itinéraires dans Google Maps.
- Partager d’abord en lecture seule, puis préparer et modifier un voyage à plusieurs.
- Viser zéro coût récurrent au lancement et peu de maintenance.

Principes : carnets privés par défaut, conservation des exports, modifications locales immédiatement sauvegardées, synchronisation visible et aucun écrasement silencieux d’un conflit.

Le gratuit implique des limites : ne pas promettre une disponibilité permanente du service distant. Le carnet déjà téléchargé doit rester exploitable si le réseau ou le service est indisponible.

Hors périmètre initial : réseau social public, messagerie complète, édition de texte caractère par caractère à la Google Docs, albums photo volumineux, IA générative payante, paiement et abonnements, moteur de calcul d’itinéraires interne.

## 3. Point de départ observé

À revérifier au début du développement :

- React, TypeScript et Vite ; Leaflet pour la carte, tuiles OpenStreetMap et contours Natural Earth intégrés.
- Plusieurs carnets stockés dans le navigateur avec `localStorage`, sans compte ni serveur applicatif de synchronisation.
- Export/import JSON d’un carnet ou de la collection, sauvegarde précédente et récupération des données.
- Fonctionnement hors ligne de l’application et des carnets locaux ; les rues et ressources externes ne sont pas toutes disponibles hors ligne.
- Liens Google Maps ou Amap déjà présents selon le choix de l’étape/base de séjour. Les liens Google existants réalisent principalement des recherches.
- Langues : français, anglais, chinois simplifié et espagnol ; thèmes clair et sombre.
- Fusion locale à trois voies existante. Son arbitrage actuel sur un même champ n’est pas une politique suffisante pour les conflits entre appareils.

Fichiers à examiner selon le lot :

| Sujet | Points d’entrée actuels |
| --- | --- |
| Modèles et validation | `src/types.ts`, `src/lib.ts` |
| Collection, migration, imports | `src/journeys.ts`, `src/components/JourneysApp.tsx` |
| Écriture et fusion | `src/hooks/useTravelState.ts`, `src/persistence.ts` |
| Cartes et liens | `src/components/TripMap.tsx`, `src/lib.ts` |
| Géographie locale | `scripts/generate-geography.mjs`, `public/world-geography.json` |
| Mode hors ligne | `src/components/OfflineStatus.tsx`, `scripts/build-sw.mjs` |
| Traductions et apparence | `src/i18n.tsx`, `src/locales/`, `src/theme.css` |
| Tests et historique | `tests/`, `docs/transition/TRANSITION.md` |

Préserver les sauvegardes historiques et leurs lecteurs. L’export utilise actuellement une enveloppe v2 contenant un corps historique `StoredState.version = 1` : distinguer les versions de ces deux niveaux.

## 4. Choix de départ

### Comptes et hébergement des données

Choisir Supabase pour l’authentification et la base PostgreSQL. Conserver l’hébergement web existant s’il convient ; aucun changement de plateforme n’est nécessaire pour ce plan.

Première connexion proposée : Google via Supabase Auth. Garder possible l’usage local sans compte. Si une connexion par email est ajoutée, configurer et vérifier un service d’envoi adapté ; ne pas supposer que l’envoi email par défaut de Supabase suffit pour les amis.

Les limites gratuites vérifiées le 6 octobre 2026 incluent 500 Mo de base, 1 Go de fichiers et 50 000 utilisateurs actifs mensuels. Le projet gratuit peut être mis en pause après une semaine d’inactivité et les sauvegardes automatiques ne sont pas incluses. Revérifier ces conditions avant la configuration réelle.

Ne pas ajouter d’appels artificiels réguliers pour contourner la mise en pause. Documenter la reprise du service, garder les données locales et les exports, et limiter les pièces jointes. Ne pas bâtir une photothèque dans ce périmètre.

Alternative si une contrainte réelle invalide Supabase : Firebase. Ne pas implémenter deux fournisseurs ni une abstraction générique pour les supporter tous.

### Cartographie

Conserver Leaflet/OpenStreetMap pour les cartes des carnets et les contours locaux pour « Mon monde ». Utiliser les liens Google Maps pour les recherches et les trajets. Conserver Amap comme option existante.

Les liens Google Maps ne nécessitent pas de clé API. Afficher une carte interactive avec la Maps JavaScript API exige en revanche une configuration et une facturation Google Cloud : ce remplacement n’est pas prévu dans les premiers lots.

### Données et synchronisation

Conserver le format métier actuel autant que possible. Une ligne de carnet avec contenu JSON versionné dans PostgreSQL est un point de départ acceptable à cette échelle. Stocker séparément les membres, invitations, droits, visites personnelles et données privées.

Ne pas normaliser immédiatement toutes les activités en dizaines de tables. Ne pas non plus placer les données privées dans un document partagé envoyé intégralement aux lecteurs.

## 5. Ordre et dépendances

| Lot | Résultat | Dépendances |
| --- | --- | --- |
| 0 | État initial vérifié et stratégie de conservation | Aucune |
| 1 | Pays, statuts et règles de visites | Lot 0 |
| 2 | Boutons Google Maps utiles sur mobile | Lot 0 |
| 3 | Comptes et synchronisation personnelle fiable | Lots 0–1 |
| 4 | Onglet « Mon monde » | Lot 1 ; synchronisation branchée après lot 3 |
| 5 | Partage privé en lecture seule | Lot 3 |
| 6 | Édition collaborative et restauration | Lot 5 + conflits du lot 3 validés |
| 7 | Petites fonctions de préparation collective et souvenirs | Lots précédents concernés |

Ordre conseillé : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Si Supabase est momentanément inaccessible, avancer le lot 4 localement sans annoncer la synchronisation comme terminée.

## Lot 0 — Vérifier et protéger l’existant

- [x] Lire les flux de sauvegarde, import, récupération et mise à jour hors ligne.
- [x] Exécuter les contrôles de référence nécessaires et distinguer les erreurs déjà présentes de celles introduites ensuite.
- [x] Prévoir une migration versionnée, répétable sans duplication, conservant les sources jusqu’à vérification.
- [x] Documenter la récupération et le retour arrière pour chaque changement de stockage. Revenir à un ancien code ne doit pas être présenté comme une conversion inverse automatique des données.

Validation : un carnet existant reste lisible, exportable et modifiable ; un carnet vierge reste vierge ; aucun effacement de stockage ne sert de solution à une erreur de migration.

## Lot 1 — Structurer les voyages et les visites

### À développer

- [x] Ajouter les statuts : idée, en préparation, en cours, terminé, annulé.
- [x] Ajouter une sélection de plusieurs pays avec identifiants stables, compatible avec les contours géographiques. Prévoir un mapping explicite entre codes de pays et identifiants Natural Earth.
- [x] Conserver le texte libre de destination pour les villes, régions et descriptions. Traduire les libellés de pays sans changer leurs identifiants.
- [x] Conserver des dates facultatives, proposer le passage à « terminé » sans le forcer à partir de la date.
- [x] Ajouter les filtres de collection par statut et pays.
- [x] Adapter validation, exports, imports, duplication et migrations aux nouveaux champs.

### Règles métier à appliquer

Un carnet et un séjour réel sont deux choses distinctes. Prévoir des visites personnelles identifiées, liées si besoin à un carnet, pour ne pas compter les carnets à la place des voyages réellement effectués.

- Un séjour réel compte une fois par pays, même avec plusieurs villes dans ce pays.
- Un voyage terminé propose de confirmer les pays effectivement visités ; un passage prévu peut avoir été annulé.
- Un séjour dans plusieurs pays peut produire une visite dans chacun d’eux.
- Une escale n’est pas automatiquement une visite.
- Une duplication crée une nouvelle préparation et ne duplique pas les visites personnelles.
- Un import ajoute une copie conformément au comportement actuel ; il ne crée pas automatiquement des visites confirmées.
- Une restauration ou une synchronisation retrouve les mêmes identifiants : elle ne crée pas une nouvelle visite.
- Pouvoir enregistrer un ancien séjour avec seulement un pays et une année facultative.
- Supprimer ou archiver un carnet ne supprime pas silencieusement le souvenir d’un séjour réel. La suppression d’une visite est explicite.
- Dans un voyage partagé, être membre ne signifie pas avoir participé. La participation et les visites restent personnelles.
- Les anciens carnets migrés gardent leurs contenus ; leurs pays et visites doivent être confirmés, pas inventés à partir d’un titre ambigu.

Validation : comptages exacts pour voyage multi-pays, doublon/import, annulation, ancien séjour sans carnet et carnet partagé sans participation.

## Lot 2 — Améliorer l’ouverture dans Google Maps

- [x] Ajouter « Voir ce lieu », « Y aller » et, lorsque les données le permettent, « Rejoindre la prochaine étape ».
- [x] Pour « Y aller », laisser Google Maps déterminer le départ actuel lorsque pertinent, sans imposer une demande de géolocalisation dans Détours.
- [x] Proposer les modes marche, voiture et transports lorsque pertinents ; Google Maps décide des itinéraires disponibles.
- [x] Utiliser une destination précise : coordonnées validées si adaptées, sinon nom + ville + adresse. Permettre de corriger une adresse ambiguë.
- [x] Réutiliser le choix Google Maps/Amap existant, sans changer silencieusement les carnets Chine. Ne pas envoyer des coordonnées WGS84 à Amap comme si elles étaient en GCJ-02.
- [x] Expliquer simplement qu’un trajet externe nécessite le service correspondant ; conserver l’adresse copiable hors ligne.

Validation : liens correctement encodés, noms accentués et chinois, destination sans coordonnées, ouverture dans un navigateur et contrôle réel sur mobile lorsque disponible. Distinguer les tests de construction d’URL de l’ouverture réellement vérifiée sur un téléphone.

## Lot 3 — Comptes et synchronisation personnelle

Réconciliation L3 : les cases de code présentes et couvertes localement sont cochées ; les critères de parcours Google, de configuration distante et multi-appareils restent à contrôler dans leur environnement. Voir les validations historiques du 7 octobre dans `docs/sync/CONFIGURATION.md` et les limites locales L3. Une case de ce plan historique ne vaut pas preuve de terrain.

### 3A. Configuration et droits

- [x] Ajouter Supabase Auth avec Google, connexion, déconnexion et gestion des erreurs compréhensible.
- [x] Fournir les migrations SQL versionnées et les instructions de configuration du fournisseur Google et des URL de redirection.
- [ ] Définir les tables minimales pour carnets, propriétaires/membres, révisions et visites personnelles ; ne créer les fonctions d’invitation qu’au lot 5.
- [x] Activer des règles d’accès serveur (RLS) : chaque utilisateur accède uniquement à ses données et aux carnets autorisés.
- [x] Ne jamais exposer de clé `service_role` au client. Une clé publique Supabase ne remplace pas les règles d’accès.
- [ ] Tester avec deux comptes distincts que l’accès direct aux API respecte les droits, indépendamment des boutons visibles.

### 3B. Rattacher les carnets locaux

- [ ] Proposer au premier login les carnets locaux à rattacher, avec un choix explicite, en conservant une copie récupérable.
- [ ] Préserver ou mapper leurs identités de façon stable. Deux appareils peuvent posséder des copies différentes d’un même ancien carnet : détecter ce cas sans fusionner automatiquement sur le seul titre.
- [ ] Rendre l’envoi répétable sans créer de doublons après interruption.
- [x] Séparer les données du mode local et les caches de chaque compte. Un changement de compte ne doit pas exposer les carnets du précédent.

### 3C. Travail hors ligne et conflits

- [x] Sauvegarder les modifications localement avant l’envoi. Maintenir une file persistante des changements en attente, résistante au rechargement.
- [ ] Choisir le stockage local adapté aux transactions et à cette file. Si IndexedDB est nécessaire, réaliser une migration ciblée et vérifiée ; éviter de conserver deux sources de vérité concurrentes.
- [x] Utiliser une révision serveur et des écritures conditionnelles atomiques. Un client ne remplace pas une révision plus récente sans comparaison.
- [x] Fusionner les modifications indépendantes et détecter les conflits sur un même champ, une suppression/modification et un ordre concurrent.
- [x] Préserver les versions en conflit et proposer une résolution compréhensible. Ne pas utiliser l’horloge du téléphone comme seule autorité.
- [ ] Réessayer les opérations de façon idempotente, avec temporisation et sans boucle de requêtes intensive.
- [ ] Propager explicitement les suppressions pour qu’un appareil resté hors ligne ne ressuscite pas un carnet supprimé.
- [ ] Afficher « Synchronisé », « En attente », « Hors ligne », « Connexion nécessaire » ou « Conflit à résoudre » selon l’état réel.
- [ ] Synchroniser au retour du réseau et de la fenêtre au premier plan. Ne pas promettre un envoi lorsque l’application est fermée.
- [x] Charger la collection par résumés ; ouvrir le contenu d’un carnet à la demande. Ne pas transférer toute la collection à chaque frappe.
- [x] En cas de session expirée ou service en pause, garder les changements localement et permettre l’export.
- [ ] Lors d’une déconnexion, signaler les changements non envoyés avant toute purge. Conserver toute récupération éventuelle isolée du compte suivant.

### Validation obligatoire

- [ ] Créer sur ordinateur, retrouver sur téléphone, modifier et retrouver la modification sur ordinateur.
- [ ] Modifier hors ligne, recharger, retrouver le brouillon puis synchroniser après reconnexion.
- [ ] Modifier des champs différents sur deux appareils : conserver les deux modifications.
- [ ] Modifier le même champ : aucun écrasement silencieux, résolution possible.
- [ ] Tester suppression concurrente, coupure pendant l’envoi, répétition d’une requête et session expirée.
- [ ] Tester changement de compte et refus d’accès direct à un carnet d’autrui.
- [ ] Conserver des exports indépendants du service distant ; documenter sauvegarde et restauration du projet gratuit.

## Lot 4 — Ajouter « Mon monde »

- [x] Ajouter les onglets « Mes voyages » et « Mon monde » sur l’accueil.
- [x] Réutiliser les contours locaux : cette carte doit fonctionner sans télécharger des tuiles de rues.
- [x] Calculer l’apparence à partir des visites personnelles confirmées et des projets de voyage pertinents pour la personne.
- [x] Au clic sur un pays, afficher visites, dates disponibles, carnets associés et « Préparer un voyage ici ».
- [x] Ajouter une liste alternative accessible et une recherche de pays, utile aussi pour les petits territoires difficiles à sélectionner.
- [x] Prévoir trois palettes accessibles au départ. Les couleurs libres restent une extension facultative.
- [x] Ajouter une légende textuelle et un nombre de visites ; ne pas transmettre l’information uniquement par la couleur.
- [x] Permettre l’ajout et la correction d’un ancien séjour depuis la fiche pays.

Palette proposée :

| État | Affichage |
| --- | --- |
| Aucun séjour ni préparation | Gris neutre |
| En préparation ou en cours, sans visite passée | Bleu + libellé du statut |
| Une visite confirmée | Vert clair |
| Deux visites confirmées | Vert moyen |
| Trois visites ou plus | Vert foncé, nombre exact dans la fiche |
| Déjà visité et nouveau voyage prévu/en cours | Vert selon le compte + contour bleu |
| Simple envie, si activée au lot 7 | Étoile, sans comptage comme visite |

Un voyage annulé ne crée pas de couleur de préparation. Un pays inconnu ou absent du fond ne doit pas être attribué à un autre arbitrairement ; il reste accessible dans la liste. Documenter la convention géographique utilisée.

Validation : règles du lot 1, pays déjà visité avec retour prévu, absence de données, petits écrans, clavier, thèmes clair/sombre et disponibilité hors ligne. Vérifier que les totaux restent identiques après synchronisation, import et duplication.

## Lot 5 — Partager en lecture seule

- [ ] Ajouter une invitation privée par lien à transmettre soi-même. L’acceptation nécessite un compte ; le lien sert à obtenir un accès, pas à publier le carnet.
- [ ] Utiliser un jeton imprévisible, une expiration, une utilisation contrôlée et une possibilité d’annulation. Ne pas envoyer d’email ou de message automatiquement.
- [ ] À l’acceptation, créer une appartenance serveur de rôle lecteur. Le propriétaire peut retirer cet accès.
- [ ] Séparer « Mes voyages » et « Partagés avec moi », ou utiliser un filtre équivalent clair.
- [ ] Afficher un aperçu de ce qui sera partagé avant l’invitation.
- [ ] Garder les notes personnelles et références sensibles privées par défaut ; séparer leur stockage et leurs exports de la projection partagée.
- [ ] Proposer « Créer ma copie » sans transférer les données privées du propriétaire ni les visites personnelles.
- [ ] Tester les restrictions au niveau des API : un lecteur ne peut ni écrire ni inviter ni s’attribuer un autre rôle.

La révocation empêche les accès serveur ultérieurs ; elle ne peut pas retirer une copie déjà téléchargée ou exportée. À la reconnexion, retirer le cache partagé révoqué de l’interface et refuser tout renvoi de modifications. Ne pas promettre une suppression à distance d’un appareil hors ligne.

Validation : invitation valide, expirée, annulée et déjà utilisée ; lecteur empêché d’écrire ; données privées absentes des réponses réseau et exports partagés ; révocation effective côté serveur ; aucune visite personnelle créée par la seule acceptation.

## Lot 6 — Collaborer et restaurer

- [ ] Ajouter le rôle éditeur à côté de propriétaire et lecteur.
- [ ] Réserver au propriétaire la gestion des accès et la suppression du carnet partagé. Ne pas implémenter un transfert de propriété dans cette première version.
- [ ] Réutiliser les protections de synchronisation et de conflits du lot 3 pour plusieurs utilisateurs.
- [ ] Ajouter un historique serveur des versions et un journal lisible des modifications avec auteur et date.
- [ ] Livrer la restauration avant ou en même temps que l’accès éditeur. Restaurer crée une nouvelle révision ; cela n’efface pas l’historique et ne change pas les droits.
- [ ] Limiter la rétention de l’historique et la taille des versions pour rester dans les quotas, tout en protégeant les versions nécessaires aux conflits encore ouverts.
- [ ] Actualiser les modifications reçues sans détruire les formulaires en cours. Le temps réel est facultatif ; un rafraîchissement raisonnable suffit au départ.
- [ ] Définir le comportement lorsqu’un éditeur hors ligne perd ses droits : rejet serveur, conservation de son travail personnel exportable et absence de réintégration forcée.

Validation : deux éditeurs sur des champs distincts puis identiques, restauration avec une édition concurrente, retour d’un appareil ancien, révocation en cours d’édition et journal cohérent. La sécurité et les conflits doivent aussi être testés sans passer par l’interface.

## Lot 7 — Fonctions complémentaires, par petites étapes

Réaliser une fonction à la fois, après stabilisation des lots principaux. Réutiliser les outils déjà présents, notamment la valise, les réservations et la duplication.

1. **Prêt pour le départ** : vérifier la dernière synchronisation, les changements en attente et les carnets/documents téléchargés. Distinguer le contenu du carnet des rues de la carte qui nécessitent Internet.
2. **Pays qui me tentent** : conserver des envies personnelles depuis la carte sans créer un carnet vide. Une envie ne vaut ni préparation ni visite.
3. **Clôture du voyage** : confirmer les visites réelles, noter quelques coups de cœur et choisir une couverture, sans imposer de téléverser des photos.
4. **Repartir ici** : reprendre des bonnes adresses dans une nouvelle préparation sans anciennes réservations, paiements, coches ou visites confirmées.
5. **Suggestions et votes** : proposer une activité et exprimer « ça me tente », avec un vote par membre et possibilité de retrait. Définir explicitement qui peut proposer ; un lecteur reste en lecture seule.
6. **Répartition des tâches** : attribuer une réservation ou une démarche à un membre, avec un statut simple et sans notification externe automatique.
7. **Commentaires ciblés** : commenter une journée, une activité ou un hébergement ; éviter de construire une messagerie générale.

Critère commun : états vides et erreurs clairs, droits cohérents, compatibilité mobile et traduction de l’interface. Les contenus personnels ne sont pas traduits automatiquement.

## 6. Vérification et livraison

Adapter les tests aux risques réels et aux scripts disponibles, sans multiplier les tests qui ne font que recopier l’implémentation.

Commandes présentes lors de la rédaction :

```sh
npm test
npm run build
npm run test:e2e
npm run test:production
```

- Pour chaque lot, lancer les contrôles ciblés et la compilation pertinents.
- Pour les changements de stockage, synchronisation et droits, ajouter des tests comportementaux et des contrôles d’intégration avec des comptes distincts. Les mocks seuls ne valident pas les règles Supabase réelles.
- Pour une livraison globale, vérifier les parcours navigateur, le mode hors ligne et la mise à jour du service worker ; contrôler aussi mobile, clavier et traductions.
- Ne pas installer un outil ou changer la chaîne de tests sans nécessité identifiée.
- Rapporter séparément les contrôles réussis, échoués et non exécutés avec leur raison.
- Mettre à jour le README et les documents de migration avec la configuration, les limites, le secours et la reprise.
- Surveiller la taille de la base, les fichiers, les transferts et l’historique. Signaler un quota approchant sa limite ; ne pas activer un plan payant automatiquement.

Définition de terminé : fonctionnalité utilisable, données anciennes préservées, droits testés lorsque concernés, erreurs récupérables, documentation actualisée et critères du lot validés. Une fonction seulement simulée ou non configurée à distance est marquée partielle.

## 7. Suivi à maintenir par l’IA

| Lot | État initial | Preuves / reste à faire |
| --- | --- | --- |
| 0 — État initial et conservation | Validé | 37 tests de référence et compilation initiale réussis ; travail existant conservé ; sources, récupération et formats v1/v2 préservés. Nouvelle configuration/reprise documentée. |
| 1 — Pays, statuts, visites | Validé | Statuts/pays/dates/filtres, proposition de clôture, visites personnelles stables, imports et copies sans visites ; tests multi-pays, annulation, confirmations concurrentes et suppression. Participation personnelle séparée des droits de membre. |
| 2 — Google Maps | Validé | Recherche, destination WGS84 validée ou adresse, départ courant, modes et prochaine étape ; Amap préservé. Tests URLs et interface mobile navigateur ; ouverture sur téléphone réel non disponible. |
| 3 — Comptes et synchronisation | Partiel | Projet Supabase actif ; OAuth réel avec deux comptes, modification partagée reçue par le propriétaire et restauration réseau validées. Moteur/CAS/RLS testés. Scénarios multi-appareils, session expirée et coupures réseau réelles encore à compléter. |
| 4 — Mon monde | Partiel | Version locale utilisable : contours, liste, recherche, palettes, visites, envies et restauration. Mobile/clavier/quatre langues/hors ligne contrôlés. Raccord compte préparé ; totaux après synchronisation réelle à vérifier au lot 3. |
| 5 — Lecture partagée | Validé | Invitation réelle 72 h acceptée avec le deuxième compte ; accès lecteur, promotion éditeur et révocation vérifiés. Confidentialité et refus d’écriture contrôlés dans Supabase sous rôle authentifié, complétés par les tests locaux d’expiration. Aucune donnée envoyée par message externe. Copies hors ligne déjà obtenues non effaçables à distance. |
| 6 — Collaboration et restauration | Partiel | Édition collaborative activée et publiée : propriétaire gère les rôles, éditeur modifie le planning, changement reçu par l’autre compte, restauration réelle en nouvelle révision. 27 contrôles SQL distants. Conflits réseau réellement simultanés sur plusieurs appareils restent à compléter. |
| 7 — Compléments | Partiel | Sauvegardes au départ, envies, clôture/coups de cœur/couverture et Repartir ici livrés. Votes, tâches et commentaires restent hors de cette livraison ; le socle de partage et d’édition est maintenant actif. |

États autorisés : À faire, En cours, Partiel, Bloqué, Validé. Préciser la cause d’un blocage et avancer les éléments indépendants si possible.

À la fin de chaque session, compléter :

- Date et lot traité :
- Changements et fichiers principaux :
- Décisions prises et justification :
- Tests exécutés et résultats :
- Accès/configuration externe encore nécessaires :
- Limites ou conflits non résolus :
- Prochaine action précise :

## 8. Sources et vérification des services

Sources consultées pour la proposition initiale le 6 octobre 2026. Les offres et modalités doivent être revérifiées au moment de configurer les services.

- [Supabase — offres et quotas](https://supabase.com/pricing)
- [Supabase — connexion Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase — configuration des emails](https://supabase.com/docs/guides/auth/auth-smtp)
- [Google Maps — liens de recherche et d’itinéraire sans clé API](https://developers.google.com/maps/documentation/urls/get-started)
- [Google Maps JavaScript API — utilisation et facturation](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Firebase — tarifs, solution alternative](https://firebase.google.com/pricing)
- [Firestore — fonctionnement hors ligne](https://firebase.google.com/docs/firestore/manage-data/enable-offline)

## 9. Message à donner à l’IA

> Lis `PLAN-ACTION.md`, les instructions du dépôt et le code existant. Développe l’application en suivant les lots dans l’ordre. Préserve les données et le travail déjà présent. Prends les décisions courantes de façon autonome, vérifie chaque lot et tiens le suivi à jour. Si une configuration externe manque, indique précisément ce qu’il faut fournir et continue les travaux indépendants. Ne marque rien comme validé sans preuve et laisse une prochaine action précise si tu dois interrompre le travail.

## 10. Livraison du 6 octobre 2026

- **Périmètre** : partie locale des lots 0, 1, 2 et 4 ; fondations et écrans distants des lots 3, 5 et 6 ; quatre premiers compléments du lot 7. La bêta prépare une ouverture publique, sans prétendre qu’elle est prête pour cette exploitation.
- **Fichiers principaux** : `src/countries.ts`, `src/world.ts`, `src/maps.ts`, `src/cloud/`, `WorldView`, `CountryPicker`, `AccountPanel`, `SharePanel`, `MapActions`, accueil et hook de stockage. Modèles/validation/imports prolongés ; 188 textes traduits dans `src/locales/beta.ts`.
- **Décisions** : garder le corps métier v1 et enveloppes v2 ; nouveaux champs facultatifs, aucune déduction de pays ; document de souvenirs séparé ; une capsule atomique par carnet/compte avec sa file (pas de migration IndexedDB générale), indice d’identité sans jeton pour conserver le cache d’une session expirée et requêtes attachées à la session de leur compte ; clé de rattachement déterministe, contenus privés explicitement séparés ; droits serveur et éditeurs fermés par défaut ; aucun fournisseur alternatif ou service payant.
- **Préparation public** : comptes indépendants des amis, index propriétaire/membre, résumés puis téléchargement à la demande, plafonds 100 carnets/compte, 1 Mo/document, historique 30 versions, limite 20 Mo de planning/historique et 20 Mo privés par utilisateur. Les quotas globaux et protection contre l’abus restent à dimensionner avant ouverture publique.
- **Ajouts hors plan explicite** : téléchargement des copies de récupération des carnets supprimés depuis l’accueil ; garde d’activation des éditeurs côté serveur **et** interface ; export des deux versions de conflit ; limite de conservation des confirmations de requête, sans recopier des documents entiers ; chargement séparé de Mon monde et du SDK distant.
- **Préservation** : nombreuses modifications présentes avant cette session laissées en place. Aucune réinitialisation Git, suppression de sources, migration destructive, activation payante, envoi aux amis ou publication de production.
- **Preuves finales** : voir la mise à jour des contrôles ci-dessous. Des échecs intermédiaires de sélecteurs/Amap ont été corrigés. Une suite lancée pendant les dernières éditions a été perturbée par le rechargement Vite ; la suite finale est relancée sur le code figé, sans cacher ces essais.
- **Configuration nécessaire** : créer le projet Supabase, appliquer la migration, configurer Google/redirects, fournir uniquement URL et clé publique, puis exécuter `scripts/test-supabase.mjs` avec deux comptes de test. Le contrôle distant a indiqué NON EXÉCUTÉ faute de ces accès. Le contrôle SQL local utilise un vrai PostgreSQL/WASM et pgcrypto, mais simule `auth.uid()`.
- **Limites** : aucun contrôle Google/REST Supabase/téléphone réel ; votes, tâches et commentaires différés ; suppression complète de compte et exploitation publique encore à prévoir ; stockage navigateur limité ; avertissement de bundle Vite (entrée ~550 Ko bruts, ~160 Ko gzip) conservé comme limitation mesurée.
- **Prochaine action** : suivre `docs/sync/CONFIGURATION.md`, puis valider les lots 3–6 sur deux comptes/appareils avant activation des éditeurs et des compléments collectifs.

### Contrôles de livraison

- `npm test` : **52/52 réussis**, contre 37/37 au départ.
- `npm run test:e2e` : **50/50 réussis** sur code figé (7,7 min). Les retouches de présentation/traduction ont ensuite passé les 6 tests bêta ciblés ; 7 contrôles ciblés supplémentaires (bêta, écritures en attente et onglets) ont réussi après ajout de l’indice de session expirée.
- `scripts/test-sql-local.mjs` : **35 contrôles réussis**, migration complète + vraie extension pgcrypto dans PostgreSQL/WASM ; deux identités simulées, aucun service distant.
- `npm run build` : réussi ; TypeScript et cache hors ligne généré. Avertissement de taille mesuré de l’entrée (~550 Ko bruts) ; SDK et traductions séparés, Mon monde chargé à la demande.
- `npm run test:production` : réussi ; mise à jour depuis l’ancien service worker, documents, plusieurs carnets hors ligne, notes, quatre langues, mobile et première ouverture de Mon monde hors ligne ; carnet de souvenirs encore présent après rechargement.
- `scripts/test-supabase.mjs` : **NON EXÉCUTÉ** : URL, clé publique et deux jetons de comptes de test manquants. Le script et les instructions sont fournis.
- Mobile réel / ouverture native Google Maps, Google OAuth, Supabase Auth/PostgREST, service en pause réel, sessions réseau concurrentes : **non exécutés** faute de projet/appareils.
- Inspection visuelle : bureau clair et sombre, mobile sombre ; captures dans `docs/sync/screenshots/` et `docs/transition/screenshots/`.

### Publication : préversion livrée le 7 octobre 2026

- Projet Vercel retrouvé : `app-vacances-27` (`prj_GdllwjlfvjDogyKdH2ABRJay350a`), espace `eliottle` (`team_lVeovobBaIvDqajTP8FZ3UvH`).
- Accès détaillé au projet refusé par l’API : **403 Forbidden**, authentification à cet espace à renouveler. Aucun accès CLI local existant trouvé. La reconnexion du plugin a été demandée à l’utilisateur.
- Le service de préversion sans authentification du script de skill ne produit plus de déploiement : sa réponse renvoie vers Vercel CLI. Aucune URL de préversion ni aucun identifiant de déploiement créé n’a été reçu.
- `dist/` contient la version compilée validée. Aucun commit/push, changement de projet distant, publication de production ou migration distante n’a été effectué.
- Reconnexion signalée par l’utilisateur le **7 octobre 2026**. La recherche de plugins confirme Vercel installé et activé. Les appels `get_project` (ID puis nom/espace) et `list_projects` renvoient désormais **Unknown tool**, avant toute vérification des droits. Aucun nouvel envoi ni déploiement tenté dans cet état. Aucune authentification CLI locale disponible.
- Après redémarrage de Codex, l’accès au projet dans `eliottle` fonctionne. Les 25 fichiers du build validé ont été téléversés, puis publiés par l’API en **Preview**, avec une configuration de build propre à ce déploiement statique. Les paramètres permanents du projet restent Vite.
- **URL** : https://app-vacances-27-d47z8bjxa-eliottle.vercel.app ; identifiant `dpl_5eJ8rPHjpNyCbnhnaCXRquSQ6NMF`. État API **READY**, logs **Deployment completed**, 25 empreintes distantes vérifiées identiques au build local. Preuve : `docs/transition/deployment-preview-20261007.json`.
- Le domaine de production n’a pas été remplacé ; aucun commit/push ni migration Supabase distante. La protection Vercel existante reste active sur cette préversion. Aucun contrôle navigateur du domaine distant ; les contrôles navigateur/hors ligne locaux portent sur le build publié.
- **Reste à configurer** : créer Supabase et valider les parcours distants comme documenté. Les lots notés partiels ci-dessus restent partiels ; ce déploiement sert le mode local et ne prétend pas activer les comptes, invitations ou synchronisation sans backend. Les carnets du site précédent nécessitent un export/import, car le stockage dépend de l’origine.

### Connexion Supabase : préversion mise à jour le 7 octobre 2026

- Projet `ehvgecfakbxeatrcnfhm` créé par le propriétaire, SQL appliqué avec succès selon sa confirmation. Vérification distante : clé publishable acceptée, fournisseur Google actif, lecture anonyme de `detours_trips` refusée (401 / 42501 attendu). Aucun droit anonyme ajouté.
- Configuration publique enregistrée dans `.env.local` ignoré par Git et dans Vercel **Preview**, collaboration `false`. Build recompilé avec ces valeurs, 52 tests unitaires et smoke de production/hors ligne réussis. Bouton Google actif, requête PKCE S256 vers le bon projet et retour à l’origine vérifiés localement, sans connexion d’utilisateur.
- Nouveau déploiement **READY** : `dpl_4oyEQVjBTfAYCefMRDCxfbEQ8vTz`, https://app-vacances-27-pc3nhicvc-eliottle.vercel.app ; logs terminés et 25 empreintes vérifiées. Alias stable créé et vérifié sur ce déploiement : **https://app-vacances-27-beta-eliottle.vercel.app/**. Les alias de production restent sur `dpl_BXVDtw67sw39P4B9mchX4oaW4jon`.
- Ajout hors plan : adresse de bêta stable pour configurer OAuth une seule fois. Le propriétaire doit renseigner Site URL et Redirect URLs dans Supabase ; instructions actualisées dans `docs/sync/CONFIGURATION.md`. Aucun changement Supabase administrateur effectué par l’agent.
- Restent **non exécutés** : connexion Google réelle, synchronisation de deux comptes/appareils, droits REST authentifiés et scénarios distants. Les éditeurs restent fermés et les lots partiels ne deviennent pas validés par ces seuls contrôles de configuration. Preuve : `docs/transition/deployment-supabase-preview-20261007.json`.

### Corrections d’interface demandées sur captures — 7 octobre 2026

- Bouton **Connexion / Mon compte** explicite et menu déroulant : Google direct, sauvegardes, synchronisation et déconnexion ; disponible sur l’accueil, le carnet et la lecture partagée. Échap ferme le menu et rend le focus au bouton. La déconnexion avec envois/conflits conserve l’avertissement et les copies du compte.
- Cause des onglets bruts au premier chargement : leurs styles partagés étaient importés seulement par le module Mon monde chargé à la demande. La feuille de styles est maintenant chargée avec l’accueil ; le JavaScript de la carte reste chargé à la demande. Filtres et champs de pays ont également leurs styles immédiatement.
- Titres complets dans la barre latérale et les cartes de villes, zones flex réductibles et texte renvoyé à la ligne. Menu et barre supérieure vérifiés à 320/390/1440 px. Contenu des fenêtres uniformément espacé et rendu hors des contextes d’empilement du bandeau ; actions de suppression espacées et bouton Annuler ajouté.
- Copies de récupération présentées séparément avec le titre du carnet et un bouton par copie, avec marges et espacement. Aucune récupération existante supprimée.
- Validation : build réussi ; **52 tests unitaires**, **25 parcours navigateur sélectionnés** (bêta, voyage, raccourcis, préférences), smoke de production/hors ligne et `scripts/smoke-ui.mjs` réussis. Le test UI utilise des profils isolés et une session simulée pour la déconnexion avec changements en attente ; aucune requête de cette session n’atteint le projet réel. Captures dans `docs/sync/screenshots/ui-*.png`. Les tests d’authentification/droits avec deux comptes réels restent distincts.
- Publication **Preview / READY** : `dpl_EEbwFQbc6EGHUKtvunT3pkTKyZXR`, https://app-vacances-27-hpd56fuiz-eliottle.vercel.app. Les 24 fichiers distants ont les empreintes attendues ; l’alias https://app-vacances-27-beta-eliottle.vercel.app/ cible cette version. Domaine de production vérifié sur le déploiement précédent. Aucun commit/push ni migration distante. Preuve : `docs/transition/deployment-ui-preview-20261007.json`.

### Retour vers une ancienne interface après Google — corrigé le 7 octobre 2026

- Cause vérifiée : Supabase avait encore l’ancienne préversion `app-vacances-27-d47z8bjxa-eliottle.vercel.app` comme Site URL et unique Redirect URL ; la bêta stable demandée par le client n’était pas autorisée. Le retour Google basculait donc vers l’ancienne version figée.
- Correction appliquée dans le tableau de bord Supabase accessible : Site URL remplacée par l’alias stable et cette même URL ajoutée à la liste des retours autorisés. Réglages vérifiés après rechargement ; ancienne entrée conservée. Aucun changement SQL, de droits, de clés ou de données.
- **OAuth réel à un compte validé** dans Chrome : Google revient sur l’alias stable, session ouverte, interface actuelle et menu Compte avec déconnexion présents. Aucun code de connexion ni jeton conservé dans les documents. Pas de nouveau déploiement : la version UI publiée était correcte. Tests de droits/synchronisation à deux comptes toujours non exécutés.


### Bêta accessible aux amis et collaboration — 7 octobre 2026

- Demande : accès sans compte Vercel et voyages partagés entre utilisateurs, avec préparation d’une ouverture publique future.
- Exception Vercel limitée à **app-vacances-27-beta-eliottle.vercel.app**. Requête sans cookies : HTTP 200, HTML du dernier build, aucune redirection de connexion. Adresse unique de la nouvelle préversion : HTTP 302 de protection, donc les autres déploiements ne sont pas ouverts. Aucune modification de l’équipe ou du site historique de production.
- Connexion Supabase confirmée par l’utilisateur. Lecture administrative ciblée : cinq tables métier avec RLS active. Aucune clé service_role obtenue ou intégrée au client. Les lectures anonymes des carnets restent refusées (401).
- Nouvelle migration additive **202610070001_member_names.sql**, appliquée au projet existant : le propriétaire voit les noms Google de ses membres, sans emails ni autre métadonnée Auth. Les lecteurs et éditeurs ne peuvent pas appeler cette liste de noms. Migration initiale non réexécutée.
- **27 contrôles dans PostgreSQL Supabase**, avec deux utilisateurs Auth existants et le rôle authentifié/claims changés dans une transaction de test : droits directs/RPC, confidentialité, invitations/réessais, lecteurs, activation serveur, édition, propriétaire seul pour droits/suppression, conflits, restauration, rétrogradation, révocation et tombstone. La transaction est annulée intégralement ; zéro fixture SQL conservée. Le même script est aussi validé en PostgreSQL/WASM. Cela vérifie le vrai SQL ; ce n’est pas un échange réel de JWT via PostgREST.
- Collaboration activée dans le réglage SQL et VITE_ENABLE_COLLABORATION=true dans Preview et le build local. Les accès éditeur sont attribués voyage par voyage par le propriétaire ; une invitation donne d’abord la lecture.
- Panneau de partage guidé, lien lisible et copie confirmée, actualisation explicite des membres, noms et rôles. Correctifs découverts en réel : l’ouverture d’un carnet juste créé lit maintenant le stockage fraîchement écrit ; une invitation reçue pendant que le site est déjà ouvert est détectée sans recharge et affichée aussi dans un carnet actif.
- **Parcours Chrome réel** avec les deux comptes Google personnels autorisés : invitation reçue par le second en lecture seule, promotion depuis le panneau propriétaire, édition enregistrée comme révision 2 avec auteur second compte, changement affiché dans le compte propriétaire, restauration de la révision 1 en révision 3. Retrait d’accès réalisé depuis le panneau propriétaire. Les caches restent isolés et les voyages existants ne sont pas modifiés par les tests.
- Validation du build publié : **52 tests unitaires**, TypeScript/Vite, smoke UI, smoke production/hors ligne, **smoke de partage** avec profils/session/API simulés. Ce dernier vérifie création et invitation sans recharge, largeur mobile du lien, lecteur/éditeur, noms, rétrogradation et révocation. Aucun jeton réel extrait ; le script réseau par JWT n’a pas été exécuté. Multi-appareils réels encore à valider.
- Publication Preview **READY** : **dpl_5yBPFY6GBRHuTKcToNmUS861puJx** ; les **24 empreintes distantes** correspondent au build validé. L’alias stable pointe dessus et conserve son exception publique. Aucun commit/push. Preuve : docs/transition/deployment-sharing-preview-20261007.json.
- Libertés prises utiles à la demande : affichage des noms des amis, guide de partage et correction des deux petits bugs d’ouverture/invitation. Aucun ajout de votes, tâches ou commentaires, ni activation d’un abonnement.

- Révocation contrôlée dans la session réelle du second compte : zéro carte de voyage actif et aucun bouton d’ouverture du carnet retiré. La copie locale déjà reçue reste dans la récupération, sans accès au serveur.
- Nettoyage terminé : seul le carnet de test est marqué supprimé (révision 4), ses invitations sont annulées et ses membres retirés. Copies récupérables conservées. Le propriétaire est reconnecté et synchronisé ; le carnet Chine existant reste actif. Nouvelle version vérifiée dans un navigateur sans session Vercel.

### Carnet commun et synchronisation accessible — 7 octobre 2026

- Suite à la demande explicite de tout partager : même interface pour le propriétaire, les lecteurs et les éditeurs. Le voyage affiche « Partagé par » et « Partagé avec » avec les emails des membres autorisés. Le bouton Partager est disponible directement dans le voyage.
- Partage complet proposé par défaut : notes, références/réservations, budget/dépenses, documents, favoris et préparation utilisent la source commune du propriétaire. Options avancées par membre pour masquer chacune de ces catégories ; le serveur filtre les lectures et préserve les catégories cachées lors des écritures. « Mon monde » reste personnel.
- Transition additive : trois migrations appliquées, aucun ancien carnet passé automatiquement en partage complet. Le propriétaire active les anciens partages depuis le panneau. Aucune table ni donnée ancienne réinitialisée.
- Création du lien précédée d’un envoi automatique des changements, avec état visible et accès direct à la comparaison si nécessaire. Un carnet local partagé avant connexion est copié vers le compte au retour Google, son original reste conservé.
- Statut dans chaque voyage et à l’accueil ; comparaison directe, choix par champ ou pour une version entière, validation explicite et deux copies de récupération. Un changement de périmètre conserve le travail en attente avant de charger les champs autorisés. Capsules/conflicts inchangés ne provoquent plus de boucle de synchronisation. Actualisation des carnets communs visibles toutes les cinq secondes ; liste des membres toutes les quinze secondes.
- Validation : **55 tests unitaires**, TypeScript/Vite, smoke UI à 320/390/1440 px, smoke de partage commun dans deux profils avec API/sessions simulées (édition de notes, documents, masquage, concurrence hors ligne, résolution et deux copies, rétrogradation, révocation, rattachement), production/hors ligne et quatre langues. Les **27 contrôles SQL historiques + scénario du carnet commun** passent localement et dans Supabase sous les rôles authentifiés, avec fixtures entièrement annulées. Pas de nouveaux jetons Google réels extraits, ni d’essai physique téléphone/ordinateur revendiqué pour cette version.
- Publication Preview **READY** : `dpl_2kdaF1m1adCy9NYUzVBJHXRgTg8q`. Les 24 empreintes distantes correspondent au build. L’alias stable sert le HTML, le worker et le nouveau module `index-DUtNNFsJ.js` en HTTP 200 sans compte Vercel ; préversion unique protégée en HTTP 302. Version constatée dans le navigateur intégré sans connexion Vercel. Aucun commit/push. Preuve : `docs/transition/deployment-common-notebook-preview-20261007.json`.
- Initiative utile : rattachement direct après connexion, copies des deux sources après résolution, protection des brouillons lors d’un changement de périmètre, validation serveur des montants/devise/données communes. Pas de curseurs en direct ni de nouvelles fonctions votes/tâches/commentaires.

### Carnet pratique : marges et documents — 7 octobre 2026

- Cause reproduite : les cartes documents et détails utilisaient seulement le cadre générique `.panel`, avec marges intérieures à zéro et aucun espacement entre les blocs. Le contrôle navigateur échouait avant correction avec padding gauche/haut = 0 px.
- Mise en page dédiée au carnet pratique : cartes uniformément espacées et rembourrées, en-tête des documents avec bouton de pièce jointe, liste lisible et noms complets, téléchargement séparé, détails repliables compacts, actions des copies et sources espacées. Adaptation mobile et thèmes clair/sombre. Les droits et le contenu des documents sont conservés.
- Build, **55 tests unitaires**, smoke carnet pratique à 320/390/1440 px (import, ouverture, contenu téléchargé, nom long, marges et absence de débordement), smoke du partage commun et production/hors ligne réussis. Profils de test isolés ; aucune modification des voyages réels ni de Supabase.
- Publication Preview **READY** `dpl_4jeyd8acAST3NwmiRqawP94Tx8Zq`, 24 empreintes distantes conformes et exception publique de l’alias conservée. Navigateur public rechargé sur le nouveau module `index-AgNKqfJ8.js` et la nouvelle CSS `index-DE09iLfV.css`. Aucun commit/push. Preuve : `docs/transition/deployment-practical-notebook-preview-20261007.json`.
