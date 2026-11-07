# UX, accessibilité et PWA — examen de la référence

Référence : `6e319457ec9f20fe5720979640e950b7a4c0dccc`, 31 octobre 2026 (Asia/Shanghai). Aucun changement produit.

## Niveau de preuve

Ce fichier combine revue source, couverture des tests et parcours actuel partiellement capturé. Après indisponibilité IAB, un script Playwright externe autorisé a utilisé Chrome installé, un profil jetable, le seul preview 4179 et des données fictives; requêtes externes bloquées par routage du contexte et résolution DNS. Sept captures actuelles ont été ouvertes et inspectées. Les résultats du gate sont dans `VALIDATION.md`. Les captures historiques ne servent pas de preuve actuelle; la définition d'un test ne vaut pas réussite.

Skills lus : `product-design:audit`, routeur `index`, `critical-overrides`, `user-context`, `design-audit-framework`; préflight Python exécuté (aucun contexte sauvegardé). Le workflow a été appliqué aux sept états capturés; les étapes non capturées restent explicitement ouvertes. `web-design-guidelines` lu et règles officielles récupérées le 31/10/2026 : [source](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Application limitée à l'inspection sémantique des composants cités. Aucune certification WCAG.

## Parcours et état des étapes

| Étape | Objectif | Points vérifiés dans la source | État visuel actuel |
|---|---|---|---|
| 1. Accueil vide | Comprendre/créer/importer | `JourneysApp.tsx:177-196`: saut au contenu, onglets nommés, états vides et entrées | Voir captures 01–07 ci-dessous; couverture limitée |
| 2. Créer ou importer | Donner son programme puis corriger | Formulaire nommé `JourneysApp.tsx:200-212`; import distinct et lazy à `:196` | Voir captures 01–07 ci-dessous; couverture limitée |
| 3. Corriger une journée | Modifier puis conserver | Soumission explicite dans `App.tsx:192-201`; annulation par fermeture globale | Captures 02/03 : abandon reproduit |
| 4. Sur place / Maintenant | Retrouver adresse et hébergement | `NowView.tsx:59-60`: choix explicite du retour, nom local et adresse absents annoncés, lien de carte | Voir captures 01–07 ci-dessous; couverture limitée |
| 5. Bonus et carte | Utiliser ses données sans invention | Vue dédiée, actions cartographiques; notice hors ligne `App.tsx:220` distingue fond général et rues/liens externes | Voir captures 01–07 ci-dessous; couverture limitée |
| 6. Préparer le hors-ligne | Installer/protéger les données | `InstallHelp.tsx:7-49`: interception offre d'installation, aide Safari, rappel d'export; pas de transfert implicite entre modes | Voir captures 01–07 ci-dessous; couverture limitée |
| 7. Export/restauration | Reprendre sur navigateur vide | Parcours dédiés présents; voir `DONNEES-IMPORTS.md` | Non capturé par ce volet; voir gate |
| 8. Mise à jour | Garder une édition ouverte | `AppUpdate.tsx:57-65`: rechargement manuel refusé si formulaire/dialogue/écriture en cours | Non capturé par ce volet; voir gate |

La table des captures 01–07 ci-dessous précise les étapes réellement observées et leurs limites. Les étapes restantes ne sont pas réputées couvertes par ces images.

## Points favorables établis dans le code

- Accueil : onglets avec `aria-controls`, sélection, tabindex et raccourcis (`JourneysApp.tsx:181`; test `l2-accessibility.spec.ts:5-51`), saut vers le contenu `:177`. Quatre langues et date civile sont explicitement couverts par le scénario.
- Carnet : régions rendues inertes pendant les fenêtres (`App.tsx:207,215,238`); focus initial, boucle Tab et restauration du déclencheur dans `:49-73`. Notifications `role=status`, erreurs `role=alert` à `:219,243`. Cela ne prouve pas le comportement de toutes les combinaisons de dialogues.
- Préférences : véritable `<dialog>`, `showModal`, Escape, retour au bouton, radios regroupées et nommées (`Preferences.tsx:19-36`). La préférence conserve les textes personnels dans leur langue; tests `preferences.spec.ts:80` et `world-languages.spec.ts:8-84`.
- Mouvement : CSS global réduit `theme.css:78`, `apple-design.css:633`; sprites suspendus selon préférence, visibilité et démontage; `FloatingMascot.tsx:97-111` écoute le changement système et nettoie les ressources.
- Mascotte : actions par bouton, raccourci clavier Maj+flèches, annulation du geste, positions bornées, zones sûres et barres prises en compte (`FloatingMascot.tsx:16-36,86-141`); menu à défilement interne (`FloatingMascot.css:8`). La forme visible dispose d'une hitbox dédiée; sa qualité demande observation.
- Installation : notice explicite sur le changement de navigateur/mode (`InstallHelp.tsx:48`) et état installé fondé sur display-mode/standalone (`:12-16`). Offre Chromium simulée ne prouve pas installation réelle.
- Mise à jour : pas de skipWaiting automatique; le worker attend la fermeture des anciennes fenêtres (`build-sw.mjs:25-28`). Manifeste d'installation versionné et ajouté au précache (`:16-17,22-23`), test CDP du manifeste réellement consommé dans `smoke-install-manifest.mjs:23-59`.

## Constats et vérifications restant ouvertes

### UX-S1 — Une fermeture d'éditeur abandonne les champs non soumis

Certitude : comportement reproduit dans le navigateur sur build figé. Une ouverture, saisie de titre/destination, Escape et réouverture donnent deux champs vides (`results.json`, captures 02/03). Fréquence et gêne utilisateur non mesurées. Candidat de simplification P2 à arbitrer, pas une régression par rapport aux tests actuels.

Sources : `App.tsx:56-73` ferme par Escape, clic extérieur et contrôleur de glissement; `JourneysApp.tsx:200-212` démonte le formulaire et utilise des champs `defaultValue`. Le test `apple-design.spec.ts:3-13` attend explicitement que le titre saisi puis fermé ne crée aucun carnet. `:15-42` attend aussi la fermeture après glissement. Aucun dialogue de conservation ou brouillon d'éditeur de voyage n'est présent sur cette trajectoire.

Préconditions/reproduction observée : accueil → Créer un voyage → remplir titre, destinations et description → clic hors fenêtre ou glissement de fermeture → rouvrir. Attendu à décider : avertissement pour saisie modifiée ou brouillon récupérable. Observé dans Chrome : fermeture directe sans avertissement, titre et destinations vides à la réouverture. Ce n'est pas une disparition d'un carnet déjà enregistré; la fermeture peut être intentionnelle.

Proposition minimale : conserver Annuler explicite, intercepter seulement fermeture incidente d'un formulaire réellement modifié. Préserver les tests d'annulation volontaire; nouveau test utilisateur avec données fictives. Critère : aucune fermeture incidente ne détruit une saisie modifiée sans choix. Décision produit requise avant modification.

### UX-V1 — Clavier virtuel et focus mobile à observer

`JourneysApp.tsx:201` et `PlanningImport.tsx:179` utilisent `autoFocus` sans condition de largeur; `Modal` déplace ensuite le focus sur son conteneur (`App.tsx:61`). La succession peut ouvrir le clavier, déplacer l'écran ou produire une annonce superflue. Hypothèse, pas défaut reproduit : tester Safari iOS installé et navigateur, ouverture à 320/390/430 px, clavier présent, retour du focus, zone sûre et action Enregistrer atteignable. Le CSS mobile fixe bien 16 px pour les champs (`apple-design.css:603`); ne pas annoncer ici un zoom automatique iOS démontré.

### UX-V2 — Isolement modal et mascotte en portail à vérifier ensemble

Le carnet applique `inert` à sidebar/workspace/navigation; `FloatingMascot.tsx:124-143` crée son propre portail dans body. La source seule ne démontre pas qu'un clic ou parcours assistif peut franchir une fenêtre : vérifier z-index, pointeur, Tab et navigation VoiceOver avec mascotte ouverte puis formulaire. L'accueil utilise également le Modal partagé; ses régions ne montrent pas un `inert` équivalent à celles du carnet. Une boucle Tab ne prouve pas l'isolation VoiceOver. Ne pas signaler comme vulnérabilité.

### UX-V3 — Indicateur de focus de la mascotte en cas d'échec

`FloatingMascot.css:5-6` enlève l'outline et le remplace par un filtre sur le canvas. Le CSS global `apple-design.css:83` est plus spécifique et peut apporter un outline : vérifier le style calculé avant de conclure. Un atlas absent laisse le canvas vide et un fallback (`sprites.js:85-90,135-138`; `FloatingMascot.tsx:134`). Tester aussi échec de chargement du module, déplacement clavier et quatre palettes contrastées. Aucun défaut de focus confirmé sans ce contrôle.

## Couverture : quatre langues, dimensions et thèmes

| Famille | Test existant inspecté | Conditions explicitement décrites | Lacune à conserver |
|---|---|---|---|
| Accueil/onglets | `l2-accessibility.spec.ts:5` | FR/EN/ZH/ES, 320×1000, sombre, mouvement réduit, fuseau occidental, clavier | Pas tous thèmes/largeurs, ni lecteur d'écran |
| Vues principales/formulaires | `preferences.spec.ts:47,120`; `world-languages.spec.ts:5,87` | EN; ZH/ES toutes vues, notes persistantes; FR/EN 320/390 clair/sombre; ZH/ES 320 clair/sombre | 430, paysage bas, 200 % de zoom navigateur et palette×langue non exhaustifs |
| Préférences récentes | `preferences-refresh.spec.ts:16,54` | Choix mascotte au clavier masquée, 320; Noir automatique et quatre langues | Contrastes de tous états de toutes palettes non mesurés |
| Mascotte indicative historique | `mascot.spec.ts:17` | Quatre langues, clair/sombre, 320/390/1440 et reflow | Ne pas confondre avec tous les sprites flottants |
| Personnages flottants | `floating-mascot.spec.ts:5,53,82` | Trois personnages, 390, pointeur souris et touch synthétique, annulation, 320, quatre coins accueil/carnet, 1440 et paysage 568×250 | Déplacement tactile réel iOS non prouvé; pointer capture stub dans le test touch, langue FR |
| Installation/stockage | `pwa-lot02.spec.ts:4,22,54` | Événements install simulés; stockage accordé/refusé/erreur/absent, liens Google/Amap interceptés | Offre réelle/OS non prouvée |
| Ancien worker/mise à jour | `smoke-app-update.mjs:7,31,60,87`; `smoke-install-manifest.mjs:23-59` | Chromium/WebKit, édition ouverte, changement manifeste, identité app, carnets inchangés | WebKit exclut explicitement l'émulation hors ligne; pas un essai iPhone physique |

Le fichier `playwright.config.ts:3-14` utilise un seul worker, Chromium, capture seulement en échec et traces conservées en échec. Cette configuration ne fournit pas à elle seule un parcours illustré accepté du nouvel audit. Les scripts `floating-mascot.spec.ts:44-46` et `smoke-install-manifest.mjs:60-62` écrivent des preuves dans des répertoires de rapports historiques : préserver ces fichiers en exécutant dans la copie dédiée.

## Recommandations bornées

1. Terminer un parcours illustré actuel avant toute conclusion de refonte, avec données fictives et identité visuelle conservée.
2. Décider de la protection des saisies d'éditeurs sur fermeture incidente (UX-S1), sans confondre brouillon d'import et éditeur de voyage.
3. Conserver les trois personnages et le masquage tant qu'aucune gêne actuelle ne justifie leur retrait; tester l'interaction mascotte/fenêtre et les erreurs d'asset.
4. Garder les distinctions « fond général hors ligne / rues et services externes avec réseau » et « export du carnet / paquet souvenirs » dans les tâches principales.
5. Mesurer la compréhension de ces tâches avec Eliot; ne pas transformer l'impression de surcharge en défaut confirmé sans observation d'une tâche.

Aucun nouveau service payant, aucun changement graphique ni retrait n'est proposé pour compenser une preuve manquante.

## Tentative de captures sur le build figé

Le coordinateur a rendu disponible un preview dédié `http://127.0.0.1:4179/`, distinct du port 5173 des tests, avec le SHA ci-dessus et le build `ee91233738a522d1062fe667865b2a7b97578324e9c810c7256ebfd12d29c035`. Le sous-audit a tenté de créer un onglet via l'API CUA documentée : `cua.createBrowserTab("iab", "http://127.0.0.1:4179/", { visible: false })`.

Résultat exact : `Browser is not available: iab`. L'inventaire suivant `cua.listBrowsers()` retourne `[]`. Aucun navigateur contrôlable n'était donc exposé à ce sous-audit; aucun parcours n'a été visualisé, aucune capture acceptée et aucune reproduction dynamique d'UX-S1 n'est revendiquée. Le skill `computer-use` a été lu avant cette tentative. Le blocage a ensuite été contourné par le fallback de test décrit ci-dessous, autorisé pour ce preview jetable. Aucune interaction avec de vrais comptes ni le port 5173.

Les preuves textuelles de ce blocage sont conservées dans le dossier externe `C:/Users/eliot/detours-audit-20261031/ux/`. Le parcours visuel a ensuite été capturé partiellement avec Chrome/Playwright; les limites du tableau ci-dessous remplacent le blocage initial.


## Parcours actuel capturé et inspecté

Exécutions : `node C:/Users/eliot/detours-audit-20261031/ux/capture.mjs`, puis `capture-flow.mjs`. Chrome installé (channel chrome), contexte neuf 390×844 puis 1440×900, FR, thème clair par défaut, mouvement réduit. Il s'agit d'un test fonctionnel ordinaire; aucune preuve dynamique de sécurité n'en est déduite. Build et SHA indiqués plus haut. Les fichiers de captures ont tous été ouverts par `view_image` et acceptés : état correct, rendu chargé, pas de fenêtre étrangère ni de capture blanche. Les deux images plein carnet sont longues : consulter le PNG original pour les détails.

| Étape | Capture dans le dossier externe `ux/` | État et observation |
|---|---|---|
| 1. Accueil vide mobile | `01-accueil-mobile.png` | Sain sur l'échantillon : création/import visibles, distinction import JSON/planning/PDF et exclusions photos de la sauvegarde exposées. L'accueil est long, avec filtres Statut/Pays déjà présents avant le premier carnet : simplification possible, pas blocage démontré. |
| 2. Création et saisie | `02-editeur-rempli.png` | Formulaire lisible, champs nommés, focus visible. Titre et destination fictifs saisis; sauvegarde non soumise. |
| 3. Escape puis réouverture | `03-editeur-rouvert-vide.png` | UX-S1 reproduit : fermeture immédiate puis champs titre/destination vides. Les carnets déjà enregistrés ne sont pas affectés. |
| 4. Import texte local | `04-import-source.png` | Sain sur le corpus minimal : texte fictif et limites/TXT/PDF/DOCX visibles; reconnaissance explicitement locale. |
| 5. Aperçu reconnu | `05-import-apercu.png` | 1 jour, 2 propositions; devise/fuseau manquants à remplir; correction d'activité possible. Aucune coordonnée inventée. L'écran du haut n'expose pas toute la longueur de l'aperçu. |
| 6. Carnet créé mobile | `06-carnet-mobile.png` | Activité corrigée « Promenade au jardin — corrigée » conservée. Pas de débordement horizontal (scrollWidth <= innerWidth). Carte de recours visible avec absence de repères précis et fond détaillé indisponible; ce blocage des tuiles est volontaire dans le test. |
| 7. Rechargement puis bureau | `07-carnet-desktop.png` | Activité corrigée toujours présente après reload; contenu et navigation desktop lisibles, pas de débordement horizontal. Ce seul reload ne valide pas tous les modes de restauration. |

Corpus exact :

```text
Paris
Jour 1 — Balade fictive
- Promenade au jardin
- Déjeuner libre
```

Dans l'aperçu, renseigner explicitement EUR et Europe/Paris; renommer la première activité, puis créer. `results.json` enregistre `reopenedTitle=""`, `reopenedDestinations=""`, `mobileOverflow=false`, `correctedActivitySurvivesReload=true`, `desktopOverflow=false`.

Lancement et incidents : premier script refusé par le loader Windows car import ESM en chemin disque sans URL `file:///`; correction du script externe uniquement. Une extension de parcours cherchait « Mon planning » desktop à 390 px et a expiré; remplacement par le bouton réel de navigation mobile « Planning ». La reprise complète a terminé avec code 0. Ces deux erreurs sont d'orchestration du nouvel audit; elles ne sont pas des défauts produit. Les captures acceptées sont celles des exécutions finales.

### Friction observée à arbitrer

La vue planning mobile empile synchronisation, assistant, accès Maintenant, introduction et couverture avant la journée (`06-carnet-mobile.png`; structure `App.tsx:217-225`). Pour ce carnet d'un seul jour, la première activité n'est pas visible dans l'écran d'entrée 390×844. C'est une friction de densité observée, pas une incapacité à atteindre le planning : le défilement y mène. Proposition à valider : une introduction/couverture repliable dans la vue de travail, avec état préservé et raccourci vers le jour; conserver la vue d'ensemble et l'identité du carnet. Critère futur : atteindre la première activité depuis l'ouverture du planning sans défilement décoratif; mesurer avec Eliot avant implémentation.

### Limites encore ouvertes

Le parcours capturé ne couvre pas Maintenant, export/restauration via UI, PDF/DOCX, mise à jour worker, mode installé, toutes les dimensions/langues/palettes, lecteur d'écran ou tactile physique. Les étapes 4–8 du tableau de préparation restent donc partiellement/non capturées selon les résultats distincts du gate. Aucune conformité d'accessibilité n'est affirmée.


## Diagnostic des échecs de sélection de thème du complément palettes

Sources : `tests/e2e/brand-palettes.spec.ts:29-31,67-70`, `src/components/Preferences.tsx:31-37`, `src/components/Preferences.css:4`. Le test appelle `.check()` sur le radio natif. Le CSS donne à ce radio une boîte absolue de 1×1 px et une opacité nulle; l'interface destinée à être cliquée est son label entier avec icône et texte.

Les preuves brutes des deux échecs de la suite complémentaire (error-context, capture et trace disponibles) ont été copiées sans modification dans `C:/Users/eliot/detours-audit-20261031/ux/brand-palettes-failures/` avant reprise des autres contrôles. Le timeout original n'est pas effacé ni déclaré réussi par ces essais ciblés.

Protocole indépendant : `theme-diagnosis.mjs` et `theme-repeated.mjs` dans le dossier externe; Chrome installé, même build4179, profils jetables, réseau externe bloqué, mouvement réduit, deviceScaleFactor2. Le premier contrôle couvre 390×900 et1440×900; la répétition utilise exactement390×844 et1440×980, ouvre « Plus de palettes » comme les tests et commence avec l'autre thème explicitement activé.

Résultats actuellement établis :

- Clic sur le label visible Clair/Sombre : fonctionne aux deux largeurs. Après erreur éventuelle de `.check()`, le même label change immédiatement le thème.
- Focus radio Clair puis flèches Droite/Gauche : Sombre puis Clair cochés; indicateur de focus clairement visible dans les captures08. Le thème sombre choisi via label survit à Escape, rechargement et réouverture des Préférences (captures09).
- `.check()` du radio Clair : trois succès sur trois à390×844; trois échecs sur trois à1440×980 avec le même message « svg lucide-sun intercepts pointer events ». Délais bornés1500ms pour la reproduction ciblée, pas attente180s.
- Géométrie mesurée à1440×900 : input1×1, opacity0; `elementFromPoint` au centre retourne le SVG sun. À390×900, le centre retourne INPUT et `.check()` réussit. La source CSS explique donc une dépendance à la géométrie, sans hypothèse de lenteur réseau.

Les fichiers `theme-diagnosis.json`, `theme-repeated.json` conservent les mesures et résultats. Les quatre captures `08-theme-keyboard-390.png`, `08-theme-keyboard-1440.png`, `09-theme-dark-390.png`, `09-theme-dark-1440.png` ont été ouvertes et inspectées : thème/focus corrects, interface entière ciblée, pas de rendu blanc. Leur résolution est doublée par deviceScaleFactor2; les dimensions ci-dessus sont en pixels CSS.

Conclusion : cause du blocage desktop démontrée dans la manière dont le test cible le radio rendu invisible et recouvert. Les contrôles utilisateur label/clavier et la persistance fonctionnent dans ce protocole. Cela ne démontre ni les24palettes ni toutes les étapes du test initial; ne pas transformer cette conclusion en gate vert. Correction minimale proposée pour un futur lot de fiabilité des tests : cliquer le label associé réellement visible et garder `expect(radio).toBeChecked()`; éviter force:true ou hausse de timeout. Une éventuelle décision de modifier le CSS doit partir d'un défaut utilisateur démontré, absent de ces essais.

Complément sombre achevé : `theme-repeated-dark.mjs` répète la même préparation trois fois par largeur avec `.check()` Sombre après avoir choisi Clair via label. Résultat : trois échecs sur trois à390×844 **et** trois échecs sur trois à1440×980, tous avec interceptionSVG; clic label Sombre ensuite réussi dans les six essais (`theme-repeated-dark.json`). Cela reproduit aussi le mécanisme de l'échec mobile du premier scénario lors du passage au thème sombre. Les12essais répétés ne sont pas une relance des24palettes : Clair mobile3/3passe, Clair desktop0/3, Sombre mobile0/3, Sombre desktop0/3, et labels12/12passent.
