# Détours — Plan de corrections après essai sur téléphone

Date : 9 octobre 2026. Document à transmettre à une IA de développement.

## Mission

Corriger les problèmes signalés par le propriétaire lors de son utilisation sur téléphone : décalages horizontaux, zoom perturbant la mise en page, champs de dates disproportionnés, page instable pendant la saisie, filtres difficiles à désactiver, espacement des phrases, intégration autour de la Dynamic Island et place excessive du partage/synchronisation.

Préserver le design actuel, les données, les droits et les fonctions. Privilégier une interface stable et discrète : le contenu du voyage doit passer avant les commandes de compte et de synchronisation.

Ce document prépare le travail. Sa rédaction ne signifie pas que les bugs ont été reproduits ou réparés. Les observations viennent du téléphone de l’utilisateur ; les causes techniques restent à établir.

## Périmètre et état de départ

Inclus : diagnostic, corrections ciblées, tests automatisés pertinents, contrôle visuel et protocole de recette sur téléphone. Hors périmètre : nouvelles fonctions de voyage, refonte globale, migration de stockage et changements des règles de partage.

Le dépôt contient de nombreux changements locaux. Des travaux du précédent plan ont déjà fait évoluer les sauvegardes et les contrôles. Lire le code actuel avant toute intervention ; ne pas réappliquer les anciennes propositions comme si elles étaient toutes encore à faire.

Points observés par lecture le 9 octobre :

- `index.html` utilise déjà `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- Les styles existants utilisent déjà les marges `safe-area-inset-*`, dans plusieurs fichiers. Leur présence ne prouve pas leur application correcte sur le téléphone.
- `src/App.tsx` insère le contrôle de collaboration avant le contenu des vues du voyage.
- `TripCollaboration` contient à la fois participants, partage, état, explications de synchronisation et actions : cela explique son volume, sans établir les causes des autres défauts.
- Les filtres Bonus distinguent une catégorie active et un mode favoris. Garder cette séparation.

## Ordre de travail

- [x] M0 — Reproduire les défauts et identifier la version testée.
- [x] M1 — Stabiliser largeur, zoom et saisie des notes.
- [x] M2 — Uniformiser tous les champs de dates.
- [x] M3 — Permettre de désélectionner une catégorie Bonus.
- [x] M4 — Rétablir l’espacement des phrases utiles.
- [x] M5 — Corriger l’intégration de l’en-tête autour de la Dynamic Island.
- [x] M6 — Déplacer partage et synchronisation dans le menu, avec résumé compact.
- [x] M7 — Exécuter la recette et préparer une livraison identifiable.

M0 précède toute correction. M1 précède la validation des dates et de la zone supérieure. M6 doit être revalidé avec M1 et M5, car il change la hauteur et la structure des premières zones de page. Livrer des corrections cohérentes et petites ; ne pas modifier le moteur de synchronisation pour une demande de présentation.

## M0 — Établir une reproduction exploitable

1. Lire les instructions du dépôt et `git status`, préserver tous les changements existants.
2. Relever la version locale et l’identité de la version servie au téléphone si accessible. Une correction locale ne prouve pas une correction de la bêta installée.
3. Recueillir si disponible : modèle du téléphone, version iOS, navigateur, mode Safari ou app ajoutée à l’écran d’accueil, URL, orientation et réglage de taille du texte. L’allusion à Dynamic Island oriente vers un iPhone mais ne fournit pas son modèle.
4. Préparer un carnet factice : plusieurs jours, notes longues, hébergements, phrases, favoris et états de synchronisation simulés. Ne pas modifier les carnets personnels pour les tests.
5. Documenter chaque reproduction : écran, geste, résultat attendu, résultat obtenu et preuve avant correction. Pour le tremblement, une séquence ou des mesures temporelles sont plus utiles qu’une capture fixe.

Ne pas bloquer toute l’analyse si le modèle exact manque : avancer sur les scénarios génériques et marquer la reproduction physique « à confirmer ». Les éléments manquants ne justifient pas d’inventer une cause.

**Sortie :** tableau des défauts reproduits, non reproduits ou restant à vérifier sur appareil, avec hypothèses explicitement séparées des faits.

## M1 — Largeur stable, zoom maîtrisé et notes sans tremblement

### Retour utilisateur

« Décalage droite gauche », une fausse manipulation de zoom désorganise le centrage ; lors de la saisie d’une note, la page tremble.

### Résultat attendu

À l’échelle normale, aucun déplacement horizontal involontaire de la page. L’ouverture et la fermeture du clavier, la saisie et le retour depuis un champ ne laissent pas l’interface décentrée. Le texte et le curseur restent stables pendant la frappe.

### Diagnostic à mener

- Distinguer débordement de mise en page, zoom au focus d’un champ, double toucher, pincement volontaire et déplacement du viewport visuel lors de l’ouverture du clavier.
- Mesurer les rectangles des éléments, largeur du document, position de défilement et, si disponible, `visualViewport`. Chercher l’élément qui dépasse, plutôt que de masquer tout débordement.
- Examiner largeurs intrinsèques, `100vw`, grilles/flex sans réduction possible, textes longs, transforms et panneaux fixes/sticky.
- Pour les notes, identifier le champ exact et inspecter focus, clés React, remontage de composants, autosauvegarde, hauteur de textarea, effets de scroll et animations. Vérifier si un changement périodique du statut de synchronisation déplace la page. Ce sont des pistes, pas des diagnostics établis.
- Vérifier les tailles calculées des champs sur iOS et tester une taille de saisie mobile adaptée, notamment 16 px si un autozoom au focus est observé.

### Contraintes de correction

- Préserver le pincement et le zoom d’accessibilité. Ne pas ajouter globalement `user-scalable=no`, `maximum-scale=1` ou un blocage de tous les événements tactiles.
- Ne pas promettre une remise à zéro forcée du zoom du navigateur par script. Corriger le déclencheur indésirable et vérifier le retour naturel à l’échelle normale.
- Ne pas utiliser `overflow-x:hidden` sur la page comme seule correction : cela peut cacher une commande ou un champ trop large. Un débordement volontaire d’un composant doit rester local à celui-ci.
- Ne pas empêcher le défilement nécessaire pour garder le champ et le curseur visibles au-dessus du clavier.
- Conserver les caractères saisis et l’enregistrement ; ne pas désactiver la sauvegarde pour obtenir une animation stable.

**Recette :** taper une note pendant au moins 30 secondes, ajouter plusieurs lignes, déplacer le curseur, sélectionner/coller du texte, effacer, fermer/réouvrir le clavier puis recharger. Aucun caractère perdu, focus intempestif ni oscillation répétée après stabilisation du clavier. Refaire hors ligne et avec des changements de statut simulés. Tester focus des champs, double toucher et pincement ; après retour à l’échelle normale, la page retrouve ses marges sans rechargement. Le défilement horizontal normal d’une page zoomée ne doit pas être confondu avec un bug à l’échelle 1.

**Points d’entrée :** `src/App.tsx`, composants contenant les notes identifiés par recherche, `src/theme.css`, `src/apple-design.css`, `src/hooks/useScrollMaterial.ts`, `src/hooks/useSheetMotion.ts`. Examiner les hooks seulement si la reproduction les implique.

## M2 — Uniformiser les champs de dates

### Retours regroupés

- « Nouvelle journée » : la case date est plus grande que le thème au-dessus.
- « Ajouter un hébergement » : les dates sont disproportionnées.
- Le problème concerne plus largement toutes les cases de dates.

### Correction attendue

Appliquer une règle commune aux champs de formulaire : même hauteur visuelle et même largeur que les champs voisins dans une même colonne, même bordure, arrondi, police et marges internes. Dans une ligne à deux colonnes, chaque date remplit sa colonne sans imposer une largeur minimale excessive. Replier la ligne sur petit écran si nécessaire.

Recenser tous les `date`, `datetime-local` et champs temporels associés : journée, hébergement, départ/retour du voyage, vue d’ensemble, transports, budget et ancien séjour. Vérifier les contrôles natifs iOS, leur contenu interne et la cascade CSS avant de définir la règle partagée. Ne pas remplacer le sélecteur natif par une saisie libre uniquement pour régler la taille.

**Recette :** dates vides/remplies, valeurs longues selon la langue, création/édition, portrait/paysage. Dans « Nouvelle journée », hauteur égale à celle du thème à 1 px d’arrondi près ; même largeur disponible. Dans « Hébergement », aucune date ne dépasse sa colonne. Le calendrier natif s’ouvre, les valeurs restent exactes, les contraintes arrivée/départ fonctionnent et aucune nouvelle largeur horizontale n’apparaît. Garder une zone tactile confortable, cible minimale de 44 px.

**Points d’entrée :** `src/components/EditControls.tsx`, `src/theme.css`, `src/apple-design.css`, `src/App.tsx`, `src/components/PracticalView.tsx` et `.css`, `TravelTools.tsx`, `JourneysApp.tsx`, `TripOverview.tsx`, `TripBudget.tsx`, `WorldView.tsx`.

## M3 — Désélectionner une catégorie dans Bonus

### Comportement précis

Conserver une seule catégorie active, conformément au modèle actuel :

| Action | Résultat |
| --- | --- |
| Toucher une catégorie inactive | Activer cette catégorie |
| Toucher à nouveau la catégorie active | Retirer ce filtre, revenir à toutes les catégories |
| Toucher une autre catégorie | Remplacer le filtre précédent |
| Toucher « Toutes », si présent | Retirer le filtre de catégorie |

Le mode « Favoris uniquement » reste indépendant. Désélectionner une catégorie dans les favoris montre tous les favoris ; cela ne retire aucun favori enregistré et ne sort pas de ce mode.

**Recette :** catégorie active puis désactivée, passage A → B, combinaison avec favoris, résultats vides, activation clavier et état accessible `aria-pressed` cohérent. L’état visuel correspond toujours aux résultats affichés. Ajouter un test comportemental ciblé.

**Point d’entrée :** `bonusCategory`, `favoritesOnly`, calcul des résultats et boutons de catégories dans `src/App.tsx`.

## M4 — Espacer les cartes de phrases utiles

Ajouter entre la dernière carte de vocabulaire et la carte « Ajouter une phrase » le même espacement que celui utilisé entre les blocs comparables du carnet pratique. Préférer le système d’espacement existant ; ne pas ajouter de ligne vide ou de faux contenu.

**Recette :** aucune phrase, une phrase, beaucoup de phrases, contenu multiligne et ajout d’une phrase. La carte d’ajout ne touche jamais la précédente, conserve ses marges latérales et reste accessible au clavier. Vérifier clair/sombre et petit écran.

**Points d’entrée :** onglet phrases de `src/components/PracticalView.tsx`, `PracticalView.css`, éventuelles surcharges de `src/apple-design.css`.

## M5 — Intégrer correctement l’en-tête à la Dynamic Island

### Retour utilisateur

En thème clair, le haut de l’interface déborde dans la zone de la Dynamic Island et paraît mal intégré.

### Résultat attendu

Les commandes et le texte restent dans la zone utilisable. Le fond peut se prolonger derrière la zone système pour former une surface continue, sans laisser le contenu interactif passer sous la découpe. Aucun bandeau de mauvaise couleur ni marge supérieure doublée.

Vérifier la cascade des safe areas, le fond de `html`/`body`/en-tête, la barre sticky, `theme-color` et le manifeste. Distinguer ce que l’application contrôle de l’apparence propre au navigateur. Ne pas coder un nombre de pixels correspondant à un modèle particulier et ne pas modifier des métadonnées au hasard.

**Recette :** thème clair en priorité, puis sombre et automatique ; haut de page et défilement ; Safari avec barre d’adresse déployée/rétractée ; mode installé si disponible ; portrait/paysage ; retour depuis une fenêtre et depuis le clavier. Vérifier l’accueil des voyages et l’intérieur d’un voyage. La simulation WebKit seule ne valide pas la Dynamic Island réelle.

**Points d’entrée :** `index.html`, `public/manifest.webmanifest`, `src/theme.css`, `src/apple-design.css`, en-têtes de `src/App.tsx` et `src/components/JourneysApp.tsx`.

## M6 — Rendre partage et synchronisation discrets

### Décision produit retenue

Supprimer les grandes cartes permanentes de partage/synchronisation en tête de toutes les pages. Mettre les commandes et leurs détails dans le menu existant du voyage. Sur la première vue du voyage — Planning par défaut, à confirmer avec le routage actuel — garder seulement une ligne compacte contenant deux accès : Partage et Synchronisation.

Sur l’accueil « Mes voyages », si un statut global est utile, le réduire lui aussi à un résumé compact sans répéter le détail de chaque carnet. Ne pas confondre compte global et voyage actif.

### Règles d’interface

- Menu : entrées libellées « Partage » et « Synchronisation », accessibles depuis chaque vue du voyage en deux actions maximum : ouvrir le menu puis choisir l’entrée.
- Partage : icône et libellé court ; participants, emails, rôles, options, lien et départ du voyage se consultent dans le panneau de détails.
- Synchronisation : icône et état court fondé sur l’état réel. Conserver la distinction entre enregistré localement, en attente, synchronisé et problème à résoudre.
- Au repos, résumé sur une ligne si possible, deux au maximum sur écran étroit ou texte agrandi. Ne pas tronquer les actions essentielles pour respecter artificiellement cette limite.
- Icônes avec nom accessible ; état compréhensible sans dépendre uniquement de la couleur ; zones tactiles d’au moins 44 × 44 px.
- En cas de conflit ou d’échec de sauvegarde, conserver un signal visible sur toutes les vues concernées et une action directe vers la résolution. Un badge stable ou une courte alerte suffit ; ne pas remettre une grande carte explicative permanente.
- Les états ordinaires de sauvegarde ne changent pas sans cesse la hauteur du haut de page, notamment pendant la saisie d’une note. Éviter les annonces vocales répétées à chaque caractère.
- Conserver les actions existantes : partager, gérer les membres, consulter/résoudre les différences, relancer l’envoi, copie indépendante et quitter le voyage selon les droits.

### Attention technique

`TripCollaboration` contient aussi de la logique d’actualisation. En déplaçant ou masquant sa présentation, vérifier que l’actualisation nécessaire continue quand le menu est fermé. Ne pas dupliquer les timers ou les abonnements en montant plusieurs contrôles. Séparer la présentation de cette logique seulement autant que nécessaire.

**Recette :** propriétaire, éditeur, lecteur et mode local ; carnet privé/partagé ; connecté/hors ligne ; attente, conflit et erreur de stockage. Sur chaque page, aucun grand bloc de collaboration au-dessus du contenu. Les détails restent accessibles, les droits inchangés, les données et l’actualisation préservées. Le résumé normal n’occupe pas une troisième ligne à 320 px avec taille de texte standard.

**Points d’entrée :** `src/components/TripCollaboration.tsx` et `.css`, `HomeSyncStatus`, `TripSyncPanel`, `src/App.tsx`, `src/components/JourneysApp.tsx`, menu existant, `AccountPanel`, `SharePanel` et styles associés.

## M7 — Valider puis préparer la livraison

### Matrice minimale

| Axe | Couverture demandée |
| --- | --- |
| Écrans | 320, 390, 430 px ; contrôle de non-régression à 1440 px |
| Navigateurs | Chromium automatisé et WebKit si installé ; Safari sur iPhone réel pour clavier/zoom/Dynamic Island |
| Modes | Navigateur ; mode installé si utilisé |
| Apparence | Clair, sombre, automatique ; mouvement réduit |
| Données | Champs vides/remplis, textes longs, dates, plusieurs phrases |
| Langues | Français et contrôles de débordement anglais, espagnol, chinois |
| Accessibilité | Clavier, focus visible, zoom volontaire et texte agrandi |
| Réseau | Local, connecté, hors ligne, envoi en attente, conflit, erreur |

Éviter de multiplier toutes les combinaisons : couvrir les scénarios liés à chaque défaut, puis un parcours complet. À l’échelle normale, mesurer l’absence de dépassement document/viewport avec au plus 1 px de tolérance d’arrondi ; vérifier aussi visuellement qu’aucun contenu n’a simplement été coupé.

### Contrôles locaux

Les scripts suivants existent lors de la rédaction ; relire leur périmètre et leurs prérequis avant utilisation :

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:production
```

Utiliser les tests ciblés pendant les corrections, puis les contrôles de régression appropriés à l’ensemble livré. Examiner `npm run verify:local` pour éviter de répéter inutilement les mêmes suites. Ajouter les tests mobiles dans la structure Playwright existante ; ne pas présenter une émulation comme une validation physique.

### Parcours final sur téléphone

1. Ouvrir la version identifiée en thème clair et parcourir les pages sans déplacement latéral involontaire.
2. Créer une journée, saisir thème/date et comparer la taille des champs.
3. Saisir puis modifier une note longue avec le clavier ; vérifier stabilité et conservation après rechargement.
4. Activer puis désactiver une catégorie Bonus, avec et sans le mode favoris.
5. Ajouter un hébergement avec arrivée/départ ; contrôler les autres formulaires datés.
6. Ouvrir les phrases utiles puis ajouter une phrase ; contrôler l’espacement final.
7. Vérifier la zone Dynamic Island, défilement et changement de thème.
8. Accéder au partage et à la synchronisation depuis plusieurs vues ; vérifier la discrétion au repos et la visibilité d’un problème simulé.
9. Tester focus, double toucher, zoom volontaire, retour à l’échelle normale et rotation sans perdre le centrage normal ni les données.

**Livrable final :** liste des corrections, causes établies, fichiers modifiés, preuves avant/après, résultats réellement exécutés et éléments restant à vérifier. Identifier le build remis au testeur. Sans accès au téléphone, marquer la recette physique « à vérifier » tout en terminant les corrections et contrôles réalisables.

Ne publier que si la demande d’exécution ou une autorisation existante couvre la publication. Après publication autorisée, vérifier la version réellement servie et la prise en compte de la mise à jour du service worker avant de demander un nouvel essai.

## Suivi obligatoire

| Lot | Statut au 10 octobre 2026 | Cause / correction | Preuves | Reste à faire |
| --- | --- | --- | --- | --- |
| M0 | Validé | Diagnostic local ; base propre 9fa03b1, manifeste bêta relevé | Rapport MOBILE-CORRECTIONS.md ; profils factices | Cache/version réellement ouverte sur iPhone à confirmer |
| M1 | Corrigé à vérifier | Saisie mobile à 16 px ; largeurs bornées ; retour de focus sans scroll | WebKit : saisie prolongée hors ligne, focus et position stables, note relue | Clavier, pincement et tremblement sur iPhone |
| M2 | Corrigé à vérifier | Dates et champs voisins à 48 px ; colonnes réductibles | WebKit : journée/hébergement, valeurs exactes, largeur des colonnes | Calendrier natif et toutes les dates sur iPhone |
| M3 | Validé | Catégorie active désélectionnable, aria-pressed, favoris indépendant | Test comportemental WebKit, clavier, A → B et favoris | Recette physique complémentaire |
| M4 | Validé | Espacement de 18 px avant le formulaire | WebKit : grille, ajout réel et thème sombre | Zéro/une phrase sur appareil |
| M5 | Corrigé à vérifier | Safe area du menu ; fond opaque derrière découpe | WebKit : inset simulé, en-tête, menu et accueil | Dynamic Island Safari et mode installé, clair/sombre/automatique |
| M6 | Validé | Entrées dans menu ; résumé Planning ; alertes sur toutes les vues | WebKit : 4 langues, 320/390/430/1440 px, fermeture/focus | Gate comptes/rôles simulés réussi ; recette iPhone restante |
| M7 | Validé | Suite mobile incluse dans le gate ; configuration WebKit dédiée | Gate 19/19 ; 104 unitaires, 70 Chromium ; WebKit 10 + 3 ciblés | Recette Safari et mode installé ; publication séparément autorisée |

Statuts : à faire, en cours, corrigé à vérifier, validé, bloqué avec motif. Un défaut non reproduit ne devient pas « réparé ». À chaque interruption, noter la prochaine action précise. Ne pas étendre le travail aux autres lots produit d’`ORCHESTRATION-DEVELOPPEMENT.md`.

## Exécution du 10 octobre 2026

Rapport détaillé, causes établies, captures et recette physique : [docs/development/MOBILE-CORRECTIONS.md](docs/development/MOBILE-CORRECTIONS.md). Appareil indiqué : iPhone 17 Pro, iOS 27, Safari et icône sur l’écran d’accueil. Aucune publication dans cette tâche.

## Prompt à donner à l’IA

> Exécute `PLAN-CORRECTIONS-MOBILE.md` pour corriger les problèmes signalés sur téléphone. Commence par reproduire et identifier les causes, puis réalise M1 à M6 et la validation M7. Préserve tous les changements existants, l’expérience actuelle, les données, les droits et le zoom d’accessibilité. Prends les décisions techniques courantes de façon autonome. Ne te limite pas à proposer un autre plan. Si le téléphone réel manque, termine les travaux locaux possibles et laisse une recette physique explicite sans revendiquer son succès. Mets à jour le suivi avec les preuves et les limites. Ne déploie pas sans autorisation couvrant la publication.
