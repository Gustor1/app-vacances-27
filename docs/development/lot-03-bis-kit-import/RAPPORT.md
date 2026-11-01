# Lot 03 bis — Kit universel et import JSON structuré

État : **lot 03 bis livré et vérifié localement le 21 octobre 2026**. Ne pas commencer le lot 04 ; le lot 06 reste prévu ultérieurement.

## État initial

21 octobre 2026, branche initiale `codex/lot-03-documents`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, nombreux travaux antérieurs non commités conservés. Copie récupérable hors dépôt : `C:/Users/eliot/Documents/detours-lot03bis-recovery-20261021`, 959 fichiers, bundle et manifeste d’empreinte `ac826e3149bf73659e5c962649d7696cdd5ea2b53afe0d67ebaca257c28d7033`. Fichiers ignorés/secrets exclus. Base distante récupérée sans remplacer les prérequis locaux. Branche dédiée `codex/lot-03-bis-kit-import`.

Lecture : AGENTS, README, COLLABORATION, consignes communes, mission 03 bis, rapport 03, code réel et tests. Parcours initial : fichier lu localement → session personnelle récupérable → reconnaissance/aperçu modifiable → création préparée et relue → reçu idempotent ; l’ancien carnet reste intact.

## Décisions et fichiers

Contrat public indépendant `format: detours-planning`, version 1. Schéma strict (champs tous requis, additionalProperties false), scalaires inconnus null, tableaux vides []. UTF-8 borné à 200 000 octets et 50 000 unités UTF-16, profondeur 12, 10 villes, 100 journées au total, 200 activités au total, bornes individuelles dans le schéma. Champs inconnus, versions incompatibles, sauvegardes, doublons de clés, URL à schéma exécutable et blocs de code refusés avec chemin et raison sans valeur personnelle.

`public-contract.ts` : schéma et validateur ; `structured.ts` : adaptation déterministe sans parseur libre ; `public-examples.ts` : exemples ; `import-kit.ts` et `scripts/generate-import-kit.mjs` : génération des quatre fichiers autonomes sous public/import-kit. Aucun nouveau paquet/service ni backend.

La provenance `external` utilise un chemin dans le JSON et une représentation de sa valeur décodée. Elle est acceptée uniquement dans la voie dédiée, avec revalidation du fichier public. Les citations des autres imports et de l’analyse distante conservent leurs protections. Les champs externes ne deviennent pas des corrections utilisateur. Une structure valide ne vérifie jamais le planning personnel original, que Détours ne demande pas.

Nouvelle métadonnée facultative de session `structuredSource`, sans migration de carnet. Fichier source brut dans la session ; copie dans le carnet seulement selon le choix de conservation, avec un titre distinct du planning original. Notes/ambiguïtés/informations non représentables conservées ; pas de dépense créée. Transport incomplet ou destination ambiguë : activité transport et détails conservés en notes, plutôt qu’un trajet inventé.

## Comportement livré

Parcours dans Mes voyages → Créer depuis un planning → **Préparer mon planning avec mon IA** : télécharger les consignes, les donner avec son planning à l’outil choisi, importer son résultat `.detours.json`, corriger l’aperçu, confirmer la création. Copie du kit en alternative ; collage du JSON disponible séparément. Aucun contenu privé n’est injecté dans les consignes. Aucun appel IA, clé, compte ou paiement nouveau requis par Détours. Les imports TXT/Markdown/PDF texte/DOCX et les sauvegardes existantes restent distincts et disponibles.

Fichiers réels : [FR](../../../public/import-kit/PREPARER-MON-VOYAGE-DETOURS.md), [EN](../../../public/import-kit/en/PREPARER-MON-VOYAGE-DETOURS.md), [ZH](../../../public/import-kit/zh-CN/PREPARER-MON-VOYAGE-DETOURS.md), [ES](../../../public/import-kit/es/PREPARER-MON-VOYAGE-DETOURS.md), [minimal](../../../public/import-kit/exemple-minimal.detours.json), [complet](../../../public/import-kit/exemple-complet.detours.json), [schéma](../../../public/import-kit/detours-planning-v1.schema.json), [guide utilisateur](../IMPORT-IA-STRUCTURE.md). Chaque kit contient intégralement le schéma, les deux exemples et les règles ; l’IA n’a pas besoin de consulter ces liens.

Le schéma est produit depuis le contrat utilisé par le validateur. Le JSON valide passe dans l’adaptateur dédié sans reconnaissance heuristique. Une correction utilisateur reçoit une provenance utilisateur ; un champ repris du fichier garde une provenance externe avec chemin et valeur décodée. La validation des citations des autres voies reste active. Les métadonnées externes sont optionnelles pour préserver les anciennes sessions.

## Contrat et limites pratiques

Enveloppe v1 : `format`, `version`, `title`, `currency`, `timezone`, `cities`, `notes`, `ambiguities`, `unmapped`. Ville : `name`, `days`. Journée : `title`, `date`, `items`. Élément : `type`, `title`, `category`, `description`, `address`, `time`, `period`, `checkIn`, `checkOut`, `from`, `to`, `mode`, `departure`, `arrival`, `reservation`. Réservation : `status`, `reference`. Tous les champs sont requis ; aucune propriété supplémentaire. Le [schéma](../../../public/import-kit/detours-planning-v1.schema.json) définit chaque longueur, enum et borne individuelle. Aucun identifiant interne ou droit serveur accepté.

Types : activity/stay/transfer/suggestion/alternative ; catégories visit/food/transport/hotel/walk/shopping ; modes train/plane/bus/car/other ou null ; réservation unknown/confirmed. Inconnue scalaire = null, pas chaîne vide. Devise et fuseau fournis seulement ; leurs valeurs null conservent les saisies existantes. Dates valides ISO, heure 24 h, horaire local sans conversion. L’ordre reste celui du fichier. Aucune coordonnée inventée ; les coordonnées fournies non représentables restent en notes.

Limites globales : 200 000 octets avant lecture, 50 000 unités UTF-16 après décodage, profondeur 12, 10 villes, 100 journées et 200 éléments au total. Collections locales : 100 journées par ville, 100 éléments par journée, 100 notes/ambiguïtés/informations non classées chacun. Titre voyage 140, ville 100, journée 200, élément 300, description/note 4 000, adresse 1 000, période 200, référence 500. Les surlimites sont refusées, sans troncature. Les chaînes UTF-16 sont comptées par JavaScript ; un caractère hors plan multilingue de base peut compter pour deux unités.

Les champs de séjour restent réservés à stay ; ceux de transport à transfer. Un départ d’hébergement antérieur à l’arrivée est refusé. Une suggestion/alternative ne peut être confirmée. L’origine fournie d’un trajet doit correspondre à sa ville parente. Un trajet sans origine/destination complète ou sans ville cible unique est conservé comme activité transport et détail en notes. Seul le premier hébergement d’une ville remplit sa fiche ; les suivants restent dans les activités et les notes. Les estimations ne deviennent jamais des dépenses. Les ambiguïtés et champs non représentables sont visibles dans les notes ; un avertissement accompagne unmapped.

Le JSON brut reste récupérable dans la session, indépendamment des corrections. Le choix de conservation ajoute un document intitulé « fichier IA externe (original personnel non vérifié) ». Aucune preuve de fidélité au planning initial n’est revendiquée. Les sauvegardes classiques, versions inconnues, champs inconnus, doublons de clés, blocs de code, encodage invalide et URL à protocole exécutable sont refusés. Diagnostics téléchargeables : code/chemin/message uniquement, sans valeur du planning. Le contenu HTML reste du texte ; aucun lien du fichier n’est chargé automatiquement.

## Modifications propres à ce lot

[changes.json](changes.json) recense les 29 fichiers fonctionnels/documentaires propres au lot : 13 modifications de fichiers initiaux et 16 ajouts. Le [patch isolé](lot03bis-code.patch) est relatif à la copie initiale sale, pas à HEAD ; il préserve donc les lots antérieurs. Le contrôle inverse à blanc `git apply --reverse --check --ignore-space-change docs/development/lot-03-bis-kit-import/lot03bis-code.patch` réussit. Aucun index ni commit du dépôt principal n’a été utilisé pour produire ce patch.

Ajouts : contrat/adaptation/exemples/générateur, quatre kits et schéma/exemples publics, tests unitaires et navigateur dédiés, smoke compilé hors ligne, guide utilisateur. Évolutions ciblées : provenance et sessions, panneau existant et traductions, compatibilité de copie du prompt, sélection du gate, README/index/reconnaissance. Le lecteur des documents personnels affiche la source JSON en texte brut et transforme les images Markdown en liens volontaires, sans chargement automatique. Aucun paquet ajouté, aucune modification Supabase, aucun début des lots 04 ou 06.

## Vérifications réalisées

- `npm run typecheck` et `npm run lint` : réussis.
- Tests unitaires ciblés import/documents/JSON : **25/25**.
- Navigateurs ciblés documents + JSON : **14/14**, dont sept scénarios nouveaux. Téléchargements réels, erreur sans perte, annulation/remplacement, correction, reprise, double clic, quota insuffisant, quatre langues, clavier, mouvement réduit, 320/390 px et zoom CSS 200 %.
- `npm run build` et smoke JSON compilé : réussis. Quatre kits identiques aux sources téléchargés hors ligne, premier import de JSON jamais ouvert en ligne, correction, rechargement, création et relecture. [Preuve](compiled/validation.json), [capture carnet](compiled/notebook-offline-390.png), [captures aperçu quatre langues](screenshots/kit-fr.png).
- Unités : minimal sans date et multi-villes chinois, séjour confirmé/transport inconnu/suggestions/alternatives, dates/heures/versions/tailles erronées, champs inconnus/prototype/doublons/profondeur/encodage, markup littéral, perte d’écriture/quota/reprise, copie intentionnelle, export/restauration, isolation de comptes sans envoi synchronisé. Les tests historiques assurent les anciennes sessions et les autres imports.
- `npm run verify:local` : **26/26 étapes réussies**, **250/250 tests unitaires**, **141/141 scénarios navigateur** (76 + 34 + 3 + 28), **14 contrôles compilés réussis**. Backend simulé, profils jetables, PGlite hors dépôt. Code inchangé pendant l’exécution (`sourceUnchanged: true`). [Rapport machine](validation.json), [journal complet](gate.log), [identité du build](build-info.json).
- Gate terminé le 21 octobre à 15:13:44 (Asia/Shanghai), Node v24.15.0 sous Windows. Empreinte des sources vérifiées : `84698f182f577c770ca10e52f3fc528cb9f0b058c1f0b3fcc41387d41b05eda9`. Build : `9e25a584962272f9d726c4185ad7826f03f21bf579b4ac4f5963c633b03a79c5`.
- Régression compilée PDF/DOCX : cinq documents lus pour la première fois hors ligne, dont chinois, colonnes et tableau ; [preuve propre à cette exécution](document-regression-compiled/validation.json). Mise à jour testée dans Chrome et WebKit simulés ; l’émulation hors ligne WebKit est exclue par le smoke existant, et aucune recette Safari physique n’est revendiquée.

Une première exécution a été interrompue volontairement après 51 scénarios navigateur réussis pour sécuriser la consultation des notes ; [journal conservé](gate-interrupted-before-reader-hardening.log). Après durcissement, les sept scénarios JSON ont été relancés et réussis, puis le gate complet ci-dessus a été relancé intégralement. Aucun échec restant n’est masqué.

La preuve compilée distingue les tentatives de tuiles OpenStreetMap déjà présentes du parcours JSON : zéro appel externe de conversion, zéro envoi et zéro erreur JavaScript. Les résultats utilisent des fichiers fictifs, Chrome/Playwright et un backend simulé local. Le gate remplace `dist/` par un build avec configuration Supabase factice : ce build n’est pas un candidat à publier ; toute publication future nécessite une reconstruction pour sa cible et une autorisation séparée. Ils ne prouvent pas la qualité d’une IA réelle.

## Non exécuté et actions humaines

NON EXÉCUTÉ : essai avec un outil IA réel, comparaison de deux ou trois plannings personnels à leur conversion, iPhone physique/Safari mobile, OAuth/services réels, publication, push, PR, déploiement ou migration distante. Ces actions n’empêchent pas la livraison locale. Le choix ultérieur de publication reste séparé. Le lot 04 attend une instruction ; le lot 06 reste dans la feuille de route.

## Retour arrière ciblé

Avant retrait, télécharger les JSON récupérables et exporter les carnets créés. Garder la copie de récupération externe et les preuves. Les carnets créés utilisent le modèle habituel et restent des carnets indépendants ; ne pas les supprimer pour retirer le code.

Le patch ne contient que les différences du lot 03 bis. Vérifier à blanc son retrait avec la commande ci-dessus ; si de nouveaux changements sont intervenus depuis, inspecter chaque conflit et utiliser changes.json avec les hashes avant/après. Retirer les modifications ciblées ou restaurer chaque fichier modifié depuis `source/` de la copie initiale, après comparaison ; retirer les seuls ajouts identifiés. Ne jamais appliquer un reset global, purger le stockage, supprimer les travaux antérieurs ou restaurer tout le dépôt en bloc. Une session JSON conservée doit être exportée avant le retrait, car l’ancien code ne connaît pas sa provenance externe.

## Préservation et état Git final

[Contrôle de préservation](preservation.json) : sur les 959 fichiers initiaux, **946 sont identiques**, **13 portent les seules modifications prévues du lot**, aucun fichier manquant ni changement inattendu. Les deux captures historiques du lot 01 régénérées par les tests ont d’abord été archivées sous `regenerated-historical/`, puis restaurées à l’identique depuis la copie initiale. Les preuves nouvelles restent dans ce dossier. Les 16 ajouts fonctionnels sont recensés dans changes.json ; rapport et preuves sont séparés.

Branche `codex/lot-03-bis-kit-import`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`, identique au départ. Les changements antérieurs non commités et leurs fichiers non suivis sont conservés. [État Git final](git-status-final.txt). Pas de commit, push, PR, déploiement, modification de base distante ou alias Vercel. La copie de récupération et le patch isolé permettent de revoir ou retirer la contribution sans réunir les travaux antérieurs dans un commit.

## État de reprise

**Aucun travail d’implémentation ou contrôle local requis ne reste en cours.** Dernier contrôle : gate complet réussi, patch inverse vérifié à blanc, préservation et empreinte des sources contrôlées. Résultats temporaires originaux : `C:/Users/eliot/AppData/Local/Temp/detours-verify-buXEHN`, preuves utiles recopiées ici. Aucun processus de vérification actif à reprendre.

Si une autre IA reprend : lire ce rapport, changes.json, preservation.json et validation.json ; vérifier d’abord la branche et le statut Git actuel, puis comparer les empreintes avant de modifier un fichier. Ne pas refaire les lots antérieurs ni appliquer le patch en double. Prochaine action possible seulement sur nouvelle instruction : accompagner les essais humains indiqués plus haut ou préparer séparément un partage/publication autorisé. **Ne pas commencer le lot 04. Le lot 06 reste prévu, non implémenté.**

Échecs intermédiaires résolus : propriétés de constructeur TS incompatibles avec Node strip-only remplacées par des champs explicites ; traductions manquantes ajoutées ; attente PDF à froid bornée à 30 secondes avec scénario de 90 secondes ; recherche du champ de notes par son rôle et nom accessible. Les parcours concernés ont été relancés, puis inclus dans le gate complet réussi.
