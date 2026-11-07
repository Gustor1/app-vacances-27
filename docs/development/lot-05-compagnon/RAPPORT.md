# Lot 05 — Compagnon sur place

État au **23 octobre 2026 (Asia/Shanghai)** : **lot 05 implémenté et vérifié localement**, gate final **28/28 réussi**. Tentatives précédentes conservées. Ne pas commencer le lot 06. Aucun déploiement.

## État initial et récupération

Branche initiale `codex/lot-04-lieux`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, nombreux fichiers modifiés/non suivis des lots antérieurs. Lecture des consignes communes, AGENTS, README, COLLABORATION, mission 05 et rapport du lot 04, puis inspection du code. Skill lean-build utilisé pour limiter le périmètre et réutiliser les parcours existants.

`git fetch origin codex/carnets-universels` effectué sans remplacer les prérequis locaux ; branche dédiée `codex/lot-05-compagnon` créée sur l’état local. Aucun reset, purge, stash ni remplacement de la base. Copie récupérable hors dépôt : `C:/Users/eliot/Documents/detours-lot05-recovery-20261023`, **1 142 fichiers**, manifeste SHA-256 `ceb82d3f945ed6dd1071ba9f2c60eae0e97f555bb84b81858d68905bfaa603bb`, statut initial, sources et bundle Git. `git bundle verify` confirme un historique complet et valide. Secrets, sessions, exports personnels et fichiers ignorés exclus.

## Fonctionnalités réutilisées et ajouts

**Maintenant** conserve les journées civiles et fuseaux par étape, les hébergements, la prochaine activité, réservations et notes. Les nouveautés sont accessibles dans cette vue, sans refonte de la navigation.

**Contrôle avant départ.** Réservations explicitement marquées nécessaires mais non confirmées ; adresse, nom local ou durée explicitement exigés par l’utilisateur et absents ; chevauchements entre intervalles avec début ET durée connus. Comparaison par paires, même avec une activité intermédiaire sans durée. Les heures libres du champ période ne sont pas interprétées. Les activités faites ou écartées du plan actif ne génèrent pas d’alertes. Six points visibles au départ, liste complète à la demande, sans score.

Chaque remarque indique activité/journée/ville/date/fuseau et origine ; **Ouvrir la correction** ouvre l’éditeur d’activité ou les durées de la journée. Elle peut être écartée pour l’empreinte pertinente des données ; changement de date/fuseau, titre, durée ou exigence concernée la réévalue. Une note sans rapport ne la réactive pas. Réexamen manuel possible. Les exigences deviennent satisfaites lorsque les champs sont remplis et peuvent être retirées explicitement. Aucune alerte pour une adresse facultative vide, un début isolé ou un carnet volontairement succinct ; aucune exigence de visa/santé/document ni trajet inventé.

**Rattachements.** Le modèle du carnet validé contient déjà des activités sous ville/journée ; aucun état de rattachement non résolu n’y est ajouté artificiellement. L’aperçu d’import existant conserve les conflits et refuse la création tant qu’ils ne sont pas corrigés/écartés (`draftToTrip`, `draftSummary`). Ces cas restent à corriger dans cet aperçu, avant création. Aucun nouveau diagnostic heuristique à partir des noms de ville/journée.

**Carte à montrer.** Amélioration de la carte d’hébergement existante : sélection explicite du lieu parmi l’hébergement et les activités de la journée, grand nom local et adresse, établissement affiché, copie et liens MapActions. L’hébergement de retour reste vide jusqu’au choix explicite de l’utilisateur parmi les hébergements enregistrés. Le modèle existant accepte au plus un hébergement par ville ; aucun choix entre hôtels homonymes n’est inventé. Adresse identifiée comme saisie du carnet ; nom accepté du lot 04 avec source/date Wikidata lorsqu’il est utilisé. Aucune traduction. Liens fondés sur le texte, sans transfert de coordonnées WGS84 vers Amap. Les destinations externes nécessitent Internet.

Une liste fermée ne transmet au composant que titre/nom local/adresse : aucune référence de réservation, note d’hébergement ou note personnelle. Le fond de la carte est opaque pour ne pas laisser lire le carnet derrière ; copie limitée au nom local (ou nom enregistré) et à l’adresse. Les sélecteurs de lecture restent utilisables par les lecteurs.

**J’ai un peu de temps.** Bonus enregistrés et activités facultatives des autres journées de la même ville, filtre favoris/catégorie/budget de temps et exclusions personnelles. Filtrage par ville, sans géolocalisation ni distance calculée. Durées connues supérieures au budget écartées ; inconnues conservées et identifiées à vérifier. Les temps de trajet d’une autre journée ne sont pas réutilisés comme s’ils partaient du lieu actuel : aucun « tient en 45 minutes ». Les activités faites, déjà au programme et doublons de noms/nom local/adresse sont écartés de façon conservatrice.

Aperçu avant confirmation ; ajout en fin de journée au plan initial uniquement. Source conservée dans les bonus/activités facultatives d’origine ; les notes privées, conseils privés et confirmations de billet ne sont pas copiés au programme partagé. Identité déterministe de l’ajout pour éviter une double insertion du même choix dans deux onglets. Nouvelle vérification de la source au moment de confirmer. Annulation du seul ajout tant qu’il n’a pas reçu de modification, note, réservation, achèvement ou préparation ; sinon correction manuelle demandée. Les autres changements du carnet restent conservés.

**Plan B manuel.** Réutilisation de la préparation des journées, alternatives pluie/fatigue nommées par l’utilisateur, comparaison/adoption et retour au plan initial. Indication de nommer une option « couverte » ou « moins fatigante », sans inférence météo. Ajout d’une annulation de l’échange vers le plan précédemment actif. Un changement de la journée pendant comparaison bloque la confirmation jusqu’à actualisation ; contrôle supplémentaire au moment de sauvegarder. Avertissement existant sur les activités réservées laissées de côté, sans annulation des billets. Réservations, notes, dépenses et activités initiales conservées.

## Données et permissions

Champ facultatif `StoredState.companion` : exigences, exclusions et empreintes des remarques écartées. Validation à l’import et avant écriture, listes bornées, aucun changement de version ni migration destructive. Anciens carnets acceptés ; exports/restaurations et duplication conservent cette surcouche. Les écritures empruntent la file existante, copie précédente et relecture, fusion entre onglets et isolation voyage/compte.

Surcouche **personnelle au compte sur cet appareil**, absente des projections commune ET privée transmises au serveur, même en carnet intégralement partagé. `contentRaw` la conserve depuis la capsule locale uniquement pour le même voyage pendant accusé de réception, actualisation, réessai et résolution ; un autre compte/appareil ne la reçoit pas. Transport via sauvegarde, sans synchronisation de ces choix entre appareils. Aucun champ serveur, migration distante, permission ou RLS modifiés.

Les activités effectivement ajoutées rejoignent le programme commun : mention explicite dans l’aperçu. Lecteurs bloqués par EditControls, le setter et AccountStorage ; lecture, comparaison, copie et carte restent disponibles. Pas de service externe nouveau, clé API, paquet, météo hébergée ni notification serveur.

## Fichiers de la mission

- `src/companion.ts` : validation, alertes et empreintes, filtrage/doublons, ajout/annulation, liste fermée de la carte.
- `src/components/Companion.tsx` et `.css` : contrôle, exigences explicites, filtres, exclusions, aperçu et annulation.
- `src/components/NowView.tsx` et `.css` : intégration et carte à montrer.
- `src/components/DayPreparation.tsx`, `src/App.tsx` : correction directe, comparaison actualisée et annulation du plan B.
- `src/types.ts`, `src/lib.ts`, `src/cloud/engine.ts` : champ facultatif validé et conservation locale. `src/cloud/projection.ts` inchangé.
- `src/locales/companion.ts`, `src/locale-utils.ts` : FR/EN/ZH/ES.
- `tests/companion.test.mjs`, `tests/e2e/companion.spec.ts`, `scripts/companion-fixture.mjs` et déclaration, `scripts/smoke-companion.mjs` ; scénarios et smoke intégrés au gate.
- README et dossier de preuves de ce rapport.

## Contrôles exécutés

- Types produit/tests et lint : réussis.
- **6/6 tests unitaires ciblés** : faux positifs, débuts isolés/durées inconnues, paire non adjacente, plan actif, dates/fuseaux et écart versionné, exigences, filtres sans coordonnées, doublons, changements concurrents, annulation protégée, archives anciennes/export/restauration/duplication, projection privée/commune, compte/lecteur et interruption/réessai de synchronisation simulée.
- **20/20 scénarios navigateur** ciblés compagnon/Maintenant/préparation, puis **8/8** du compagnon sur le code final après correction du fond de carte. Quatre langues, thèmes clair et sombre, 320/390/1440 px, zoom CSS 200 %, mouvement réduit, clavier Entrée/Échap et retour de focus. Exigence ajoutée/retirée et correction directe ; exclusion/réintégration ; aperçu annulé puis confirmé et annulé ; export téléchargé et parsé ; autre onglet modifiant une source puis une journée pendant comparaison ; rôles lecteur/éditeur simulés. Journaux `targeted.log`, `targeted-final.log`.
- Captures françaises claires et carte anglaise sombre inspectées visuellement. Une capture pleine page Playwright peut décaler les éléments fixes historiques ; aucun débordement horizontal observé aux largeurs testées. Le zoom CSS ne prouve pas un appareil physique.
- **Smoke compilé hors ligne réussi** : PWA préparée puis mode hors ligne et rechargement, alerte écartée persistée, carte sans notes privées, choix du retour, aperçu/ajout/annulation, export parsé, second rechargement, aucune erreur JS. Preuve dans `compiled/validation.json`, capture `compiled/offline.png`. Les quatre requêtes de tuiles OSM du premier écran historique, bloquées par le test, sont recensées séparément ; aucune requête externe pendant le parcours du compagnon. La disponibilité hors ligne des fonds de carte n’est pas affirmée.
- `git diff --check` : réussi (avertissements habituels de fins de ligne Windows).
- **Gate complet final : 28/28 réussi**, **261/261 tests unitaires**, **158/158 scénarios navigateur** (93 + 34 + 3 + 28) et **16 contrôles compilés** réussis ; types/lint/SQL isolé/build/intégrité réussis. Rapport [validation.json](validation.json), [journal](gate.log), [identité du build](build-info.json). Sources inchangées : `sourceUnchanged=true`. Cette exécution finale ne remplace pas les tentatives antérieures décrites plus bas.

## Incidents et limites

Première tentative ciblée : 16/20, quatre échecs sur le nom accessible du sélecteur de retour ; ajout de noms accessibles explicites, puis 20/20 et 8/8 réussis. Première vérification de types des tests : déclaration du nouveau fixture absente, ajoutée puis types et lint réussis. Première assertion du test de projection cherchait le mot « companion » dans tout le JSON alors que l’ID du voyage fictif le contenait : remplacée par la vérification des propriétés projetées. Première tentative du smoke hors ligne échouée sur le comptage des tuiles du planning initial : parcours déjà réussi, mesure séparée avant/après entrée dans Maintenant, puis smoke réussi. Journaux initiaux conservés, aucun échec remplacé silencieusement.

Pas de météo ni prévision, temps de trajet estimé, routage optimisé, chatbot, notifications serveur, paiement ni lot suivant. Pas de distance faute de coordonnées sur les bonus : filtre ville livré. Les doublons de nom/adresse peuvent cacher des visites distinctes au même établissement ; utiliser l’éditeur de planning pour les ajouter volontairement. L’annulation immédiate d’une idée/d’un échange est propre à la vue courante ; le planning et le retour au plan initial restent utilisables après rechargement. Les durées d’une idée ajoutée restent à saisir pour sa nouvelle journée. Aucun service réel, compte/OAuth/synchronisation réels, appareil physique ou publication vérifiés.

## Démonstration

1. Ouvrir un carnet fictif, choisir Maintenant puis une journée. Une activité « À réserver » apparaît dans le contrôle ; ouvrir sa correction, ou l’écarter puis réexaminer.
2. Exiger une adresse pour une activité ; ouvrir sa correction, remplir l’adresse puis revenir : l’exigence satisfaite ne signale plus ce point. Un simple début sans durée ne crée aucun conflit.
3. Ouvrir À montrer ou Montrer ce lieu ; choisir le lieu et, si souhaité, l’hébergement de retour. Copier nom/adresse, vérifier les liens et fermer par Échap.
4. Enregistrer un bonus, ouvrir J’ai un peu de temps, choisir favoris/catégorie/temps, prévisualiser puis confirmer. Annuler cet ajout. Répéter hors ligne après préparation de la PWA.
5. Dans Préparer cette journée, créer/nommer une alternative couverte ou moins fatigante ; comparer, vérifier l’avertissement si billet réservé, adopter puis annuler l’échange. Les activités et notes initiales restent présentes.

## Retour arrière ciblé

Exporter les carnets avant retrait et garder la récupération externe. Le patch `lot05-code.patch` et `changes.json` isolent 10 fichiers modifiés et 9 ajouts relativement à la copie initiale sale, pas à HEAD. Le retrait à blanc réussit : `git apply --reverse --check --ignore-space-change docs/development/lot-05-compagnon/lot05-code.patch`. Ne jamais restaurer le checkout entier : il contient les travaux antérieurs. Retirer uniquement les différences du lot après contrôle du patch inverse et conservation de toute modification ultérieure. Conserver les archives complètes pour garder les choix personnels ; les champs facultatifs ne remplacent aucune donnée initiale.

## Reprise exacte — lot terminé

**Aucun travail d’implémentation ni contrôle local obligatoire restant.** Gate final `WA7JTM` réussi, session 72970 terminée, PID 14432 terminé ; serveur temporaire du gate arrêté. Preuves copiées dans ce dossier. Aucun lot suivant commencé.

Pour reprendre, lire ce rapport, `changes.json`, `preservation.json` et `validation.json`, vérifier la branche et l’état Git réel avant toute modification. Ne pas appliquer le patch une deuxième fois. Les seules suites éventuelles sont la recette physique ou une livraison distante explicitement demandées ; elles ne sont pas comprises dans ce lot terminé.

Les étapes de reprise des sections suivantes sont historiques. Leur dernière action (gate complet sur la validation corrigée) est désormais accomplie. Commit/push/PR, fusion, publication, alias Vercel, migration distante et recette physique : non exécutés.

## Premier gate arrêté et reprise

Première exécution `gqJfbp` : **26 étapes réussies, une échouée, une non exécutée**, `sourceUnchanged=true`. Les 261 tests unitaires, 158 scénarios navigateur et 14 contrôles compilés dont le compagnon ont réussi. Échec dans `scripts/smoke-app-update.mjs:75` : après fermeture de la dernière page Chrome, la vérification des anciens caches via `context.serviceWorkers()` n’a pas obtenu true sous 15 s. Symptôme observé, cause intermittente non établie ; aucune preuve permettant de l’attribuer au lot ou de le qualifier de préexistant. Contrôle final du planning non exécuté dans cette tentative. Rapport conservé dans `validation-first-failure.json`, journal `gate-first-failure.log`.

Skill investigate-first appliqué ; lecture de l’étape précise et rejeu **du script inchangé** depuis la copie du même build dans `C:/Users/eliot/AppData/Local/Temp/detours-verify-gqJfbp`, `DETOURS_LOCAL_VERIFY=1`. Rejeu isolé réussi sur Chrome et WebKit, dont mise à jour/cache/reprise et brouillon préservé ; Chrome couvre le rechargement hors ligne, limite d’émulation WebKit conservée (`update-recheck.log`). Aucun timeout, assertion ou code produit modifié pour obtenir ce succès.

Nouvelle action : relancer intégralement `npm run verify:local` avec le même PGlite et les mêmes sources, suivi dans `gate.log`. Ce second résultat doit rester distinct du premier échec. Les processus du premier gate et du rejeu isolé sont terminés. Après fin, copier le rapport et les preuves compilées, recontrôler les empreintes et restaurer seulement les deux captures historiques si régénérées à nouveau. Aucun lot suivant commencé.


## Revue finale de validation — seconde exécution interrompue

Le second gate a de nouveau passé les 261 tests unitaires et les 158 scénarios navigateur, puis plusieurs smokes, avant interruption volontaire pour corriger un cas d’archive mal typé découvert par revue. Reproduction directe : `validCompanion` acceptait `field: ["address"]` à cause de la conversion String. Le nom du champ doit être une chaîne littérale de la liste fermée. Ajout du contrôle de type et de deux rejets unitaires (liste et objet). Aucun changement aux données des carnets existants valides ni au parcours UI. Le journal de cette exécution interrompue est conservé dans `gate-interrupted-validation-review.log` ; son résultat n’est pas compté comme un gate réussi. Seul l’arbre du PID vérifié 19204 (commande verify-local.mjs) a été arrêté, aucun serveur utilisateur.

Suite alors requise, désormais accomplie : tests ciblés/types/lint réussis, patch et changes.json régénérés, troisième gate complet réussi. La session du second gate est terminée. L’état antérieur à cette correction n’est pas la livraison finale.

Reprise finale accomplie : patch et changes.json régénérés ; retrait à blanc réussi ; gate final terminé avec succès. Les cas liste/objet mal typés sont rejetés par le code effectivement vérifié.


## Actions humaines restant facultatives

Recette physique non effectuée : sur un iPhone, ouvrir un carnet fictif dans Safari puis en mode installé, attendre l’état prêt hors ligne dans Mon carnet pratique, passer en mode avion, fermer et rouvrir l’application, choisir une journée puis À montrer, sélectionner l’hébergement de retour et vérifier lisibilité, copie, zoom et retour au carnet. Les liens de navigation nécessitent ensuite de rétablir le réseau. Refaire une prévisualisation/annulation d’idée sans changer un vrai carnet, puis exporter la sauvegarde.

Aucune publication automatique. Pour une publication demandée ultérieurement, repartir du rapport final réussi et de la même empreinte, reconstruire un candidat séparé avec la configuration de la cible et suivre L8. Ne pas publier le dist factice du gate. Aucun compte, secret ou droit serveur à transmettre à une autre IA pour reprendre le travail local.


## Clôture, empreintes et préservation

Gate final exécuté par `npm run verify:local`, `DETOURS_PGLITE_PATH=C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`, profils jetables et backend simulé. Fin le **23 octobre 2026 à 03:28:54 (Asia/Shanghai)**. Rapport temporaire : `C:/Users/eliot/AppData/Local/Temp/detours-verify-WA7JTM/validation.json`. Node v24.15.0 / Windows. Les derniers contrôles de mise à jour Chrome/WebKit et planning compilé sont tous deux réussis ; aucune assertion ni délai du test de mise à jour n’a été modifié.

- Empreinte des sources vérifiées : `36c09b3c6418e228c70f1ac4036d579d231bdeb464dc4ed66039a7bcdff3f374`.
- Identité du build : `b24bba63cf7eacee7e68f61f517e52d58d31e0c9a4a5b784c55eca8e79235f6d`.
- Patch isolé : [lot05-code.patch](lot05-code.patch), SHA-256 `5f9f14fbe33e0e21115bba4143850382d37b836f0871a1a875ce6dafd0e2517a` ; [inventaire](changes.json) : 10 fichiers modifiés, 9 ajouts.
- [Préservation finale](preservation.json) : sur 1 142 fichiers initiaux, **1 132 identiques**, dix différences prévues, **aucun fichier manquant ni changement inattendu**. Les 1 142 copies de récupération ont été relues ; les empreintes finales des 19 fichiers de la mission correspondent à changes.json. Deux captures historiques régénérées sont archivées dans regenerated-historical et regenerated-historical-final, puis restaurées à leur empreinte initiale. Vérification réexécutable : `python ../detours-lot05-recovery-20261023/audit-lot05.py` depuis la racine du checkout.
- `git apply --reverse --check --ignore-space-change docs/development/lot-05-compagnon/lot05-code.patch` réussi après fin du gate ; aucune annulation réellement appliquée.

Branche finale `codex/lot-05-compagnon`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64` inchangé ; [statut](git-status-final.txt). Les modifications antérieures restent conservées et non regroupées dans un commit global. Aucune suppression de carnet ni migration distante. Le code du lot est **implémenté et testé localement**, les comptes et services du gate **simulés**, les appareils physiques et services réels **non testés**, la livraison **non publiée**. Le dist du gate utilise une configuration factice et doit être reconstruit pour toute publication ultérieure autorisée. **Lot 06 non commencé.**
