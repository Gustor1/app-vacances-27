# Lot 03 — Documents et pont IA externe

**Lot 03 terminé et testé localement**, sur `codex/lot-03-documents`. Extraction PDF texte/DOCX et pont IA externe livrés, travaux existants préservés. Gate final réussi : **25/25 étapes, 245 tests unitaires, 134 scénarios navigateur, 13 smokes compilés**. Aucun déploiement ni opération distante d’écriture. Ne pas commencer le lot 04.

## État initial et récupération

21 octobre 2026, branche initiale `codex/logos-palettes`, HEAD `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. Nombreux travaux préexistants des lots 01/02 et palettes, non commités, conservés. Lecture des consignes communes, du lot, README, COLLABORATION, rapport lot 02 et code effectif.

Copie hors dépôt : `C:/Users/eliot/Documents/detours-lot03-recovery-20261021`, 882 fichiers, bundle Git, manifeste SHA-256 `3e733838d1f88f45fb9acd2157c406dc93d7f66995c999710447d9cec1eac4c6`. Secrets/fichiers ignorés exclus. Base distante récupérée par fetch, aucun changement de base car les prérequis locaux sont non commités. Contribution sur `codex/lot-03-documents`.

## Décisions

PDF.js 6.4.299 Apache-2.0, fflate 0.8.3 MIT, saxes 6.0.0 ISC, versions épinglées. Mammoth 1.13.0 BSD-2-Clause évalué, non installé : sortie HTML non assainie par défaut et pas de limite intégrée de ZIP. Lecture DOCX XML contrôlée avec SAX, sans DOM/HTML ni résolution externe, dans un worker terminable. PDF.js utilise un worker explicite, sans rendu/JavaScript/actions/liens suivis. API v6 contrôlée dans les sources et déclarations installées : `PDFWorker.create`, option isEvalSupported supprimée en v6.

Limites centralisées dans `src/planning-import/document-contract.ts` : 10 Mio, 50 pages PDF, 50 000 unités UTF-16 (contrat existant), 1000 entrées ZIP, 20 Mio déclarés au total, 2 Mio par XML, 20 secondes. Sortie gonflée contrôlée indépendamment des tailles ZIP déclarées, par fragments. Aucun OCR ni .doc/.docm.

## Vérifications ciblées acquises

- Typecheck et lint : réussis. 15 tests import existant, puis 5 nouveaux tests unitaires : réussis. Le gate rejoue la suite complète.
- 13 scénarios Chrome : 7 documents et 6 TXT/Markdown existants, tous réussis. Annulation, remplacement, délai maximal simulé par horloge navigateur (vrai worker retardé), quatre langues, presse-papiers statique, 320 px et clavier.
- Smoke compilé : 5/5 documents ouverts pour la première fois hors ligne après préparation PWA, dont un PDF chinois avec CMap. Création/correction/rechargement hors ligne d’un carnet PDF, texte source retrouvé dans le carnet. `compiled/validation.json` conserve sources, SHA-256 fixtures, durées et résultats du parseur séparément. Aucun appel externe pendant extraction, aucun envoi POST. Les seules tentatives réseau dans le carnet ouvert sont les tuiles OSM existantes, indisponibles hors ligne ; elles ne transportent pas le document.
- Le tableau PDF conserve son texte mais son en-tête devient une proposition « Heure Activite » ; le texte de lien du DOCX devient aussi une proposition « Texte du lien » : à écarter manuellement dans l’aperçu. `quality.json` compare séparément les activités attendues/proposées : 3/5 listes exactes sur ces seules fixtures, aucune activité attendue absente, deux propositions supplémentaires. Ce résultat limité n’est pas un score de compréhension générale. Ce support de fichiers ne résout pas la compréhension générale, les tableaux complexes ou les ambiguïtés du lot 01. Le DOCX conserve titres/listes/tableau du corps ; en-têtes/pieds, images, commentaires et notes de bas de page exclus et annoncés dans le parcours.

## Échecs corrigés avant le gate

- Types PDF.js 6 : constructeur `PDFWorker` et option d’évaluation de l’ancienne API remplacés par l’API réellement installée. Ressources standard/CJK ajoutées localement après avertissements de polices.
- Premier chargement DOCX en développement : la découverte tardive de dépendances dans le worker provoquait un rechargement Vite. Dépendances déclarées dans `optimizeDeps`, puis parcours complet rejoué avec succès.
- Repère PDF `[Page 1]` interprété comme titre : remplacé par `Page 1 / N`, syntaxe déjà connue du parseur. Le parseur du lot 01 n’a pas été modifié.
- Échecs des nouvelles assertions/fixtures : attente asynchrone des fixtures, nombre d’éléments incluant le lien, PDF trop long dessiné hors de la page, gestion d’une route Playwright déjà traitée. Générateurs et assertions corrigés ; les 13 scénarios ciblés passent ensuite. Le test de fichier PDF ancien attend désormais « corrompu » plutôt que « non supporté ».
- Premier smoke compilé : assertion trop large sur les requêtes externes, due aux tuiles OSM du carnet ouvert. Les requêtes sont désormais classées par phase : zéro requête externe pendant extraction, zéro envoi, seules tentatives de tuiles existantes hors ligne après création.
- Une édition intermédiaire affectée par l’encodage Windows a été normalisée en UTF-8 avant les vérifications de langues. Le premier patch récupérable utilisait le filtre Git global astextplain ; il a été régénéré sans textconv, avec les fixtures binaires, puis vérifié en sens inverse sans appliquer de modification.

## Parcours et contrats livrés

Mes voyages → Créer depuis un planning → sélectionner PDF/DOCX. L’extraction est différée, la lecture annulable et remplaçable. Le texte extrait est présenté avant toute reconnaissance, y compris avec un champ vide. Accepter « Remplacer le texte » conserve une copie textuelle d’origine avec nom/format/pages dans la session personnelle v1. Les corrections ne changent pas cette copie, consultable et téléchargeable. Les anciennes sessions restent compatibles, sans migration ni modification de StoredState. Aucun binaire de document personnel n’est conservé. Aucun compte ChatGPT, endpoint, quota ou service supplémentaire n’est ajouté. Aucune activation de l’analyse distante existante.

Les TXT/Markdown conservent la même fonction de lecture, les limites et validations initiales. Le pont externe copie exclusivement un prompt et un modèle constants dans la langue active, jamais la source personnelle. Les erreurs de presse-papiers permettent la copie manuelle. L’utilisateur choisit son outil et revient coller sa réponse.

Pendant une extraction, annuler, taper un autre texte, choisir un autre fichier ou fermer invalide le résultat précédent. Aucune écriture de source avant acceptation du document extrait. Après acceptation, la sauvegarde de session existante vérifie l’écriture et la relecture. Les contrôles existants couvrent interruption/reprise de création, droits et séparation local/comptes. L’original extrait reste dans le brouillon jusqu’à son effacement explicite ; la copie intégrale dans le carnet dépend du choix habituel de conservation ; les extraits non structurés peuvent aussi être conservés en notes selon le contrat existant. Pour garder les deux variantes après effacement du brouillon, télécharger l’extraction originale avant de l’effacer.

## Versions, licences et poids

`npm view` et API du paquet installé vérifiés le 21 octobre 2026. PDF.js 6.4.299 : 34 913 648 octets de paquet décompressé, mais seuls lecteur, worker, polices et CMaps utiles au build sont distribués. Mammoth 1.13.0 évalué via archive npm hors dépôt : 438 003 octets compressés, 1 671 388 décompressés, standalone navigateur 598 457 octets ou 405 060 minifié. Mammoth n’est pas retenu : aucune injection HTML et bornes explicites de décompression souhaitées. Fflate/Saxes utilisent des workers et ne fournissent aucun transport réseau de document. Licences commerciales permissives ; textes et attributions distribués dans `public/licenses/lot03/`, dont polices Foxit/Liberation, CMaps et xmlchars.

Mesure locale reproductible dans `size.json` : reconstruction de la copie initiale, même outillage installé et mêmes paramètres Vite factices. Avant : 7 452 708 octets/33 fichiers ; après : 11 239 628 octets/92 fichiers ; ajout : **3 786 920 octets** (3,79 Mo, 3,61 Mio). Ressources d’extraction identifiées : 3 729 179 octets, estimation gzip 2 017 087 octets. Le cache PWA inclut les modules différés, polices et CMaps : ils ne s’exécutent pas au démarrage mais sont téléchargés pendant la préparation hors ligne. Ce surcoût est assumé pour lire les PDF CJK hors ligne sans CDN.

Le build émet un avertissement Vite de chunks >500 Ko, sans échec. `npm audit` signale une vulnérabilité modérée dans Vite 7.3.6 déjà installé avant le lot ; aucune mise à niveau d’outillage hors sujet effectuée.

Sources officielles consultées : [PDF.js, installation](https://mozilla.github.io/pdf.js/getting_started/), [API PDF.js](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html), [sources/API effectivement installées](https://github.com/mozilla/pdf.js), [Mammoth, navigateur et avertissement de sécurité](https://github.com/mwilliamson/mammoth.js), [fflate, flux de décompression](https://github.com/101arrowz/fflate), [Saxes](https://github.com/lddubeau/saxes). La documentation publique PDF.js peut décrire une API antérieure ; les types et sources 6.4.299 ont servi de référence d’implémentation.

## Gate final et état de reprise

Premier gate : 23 étapes passées, arrêt sur « mise à jour Chrome et WebKit » à `scripts/smoke-app-update.mjs:91` (lecture instantanée du cache `/` sans résultat après activation WebKit). Source inchangée, build `df74ac86c4d0be5d3433f3e7e702e10324c1600a5590880e4d276d7a899cd863`. `gate-first-attempt.log` et `validation-first-attempt.json` conservés. Dernière étape du gate non exécutée à ce stade. Reproduction instrumentée sans modifier le code produit : Chrome et WebKit passent, `/` et les ressources apparaissent dans le cache actif ; voir `app-update-diagnostic.log`. Cela établit un échec intermittent, pas sa cause exacte ni un caractère préexistant.

Le replay original de mise à jour échoue à nouveau sur la même assertion ; le replay d’import/export/restauration passe. Deux diagnostics instrumentés supplémentaires passent avec le même build et observent le cache présent (logs `app-update-cache-timing*.log`). La cause interne WebKit n’est pas démontrée. Le contrôle attend désormais, au maximum 15 secondes, la présence effective de `/` dans le cache plutôt que de l’exiger dès la première lecture après réouverture. La condition vérifiée n’est pas supprimée ni assouplie : un cache absent au terme du délai échoue toujours. Aucun changement produit/worker n’a été fait pour cet échec. `app-update-synchronized.log` confirme le contrôle Chrome/WebKit corrigé réussi.

Le second gate complet est **RÉUSSI : 25/25**, aucune étape non exécutée, source inchangée (`sourceUnchanged: true`). Types produit/tests/configurations, lint, 245 tests unitaires, build/intégrité, SQL PGlite isolé, 134 scénarios navigateur (69 + 34 + 3 + 28) et 13 smokes compilés passent. Le nouveau smoke documents et le contrôle de mise à jour Chrome/WebKit synchronisé sont inclus, ainsi que le dernier export/restauration.

- Node `v24.15.0`, Windows, Chrome installé/Playwright ; backend simulé. Aucun OAuth/service réel validé.
- HEAD de base : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64` ; les changements restent **non commités**, avec les contributions antérieures préservées.
- Empreinte des sources/configurations/tests/assets : `e9e3f8696d713e75c66203971639d07eda52a8c0aa05b9f62efbb8a5815a0e25`.
- Identité du build testé : `df74ac86c4d0be5d3433f3e7e702e10324c1600a5590880e4d276d7a899cd863` ; manifeste copié dans `build-info.json`.
- Preuves complètes : `validation.json`, `gate.log`, `compiled/validation.json`, `quality.json`, `size.json`, `dependencies.json`, captures `screenshots/` et `gate-pwa-screenshots/`. Premier échec et diagnostics conservés séparément. Origine des preuves finales : `C:/Users/eliot/AppData/Local/Temp/detours-verify-kKyNgX`.
- `dist/` est le build factice du gate : **ne pas publier ce dossier**. Aucun candidat de publication n’a été préparé.

Les 882 fichiers initiaux ont été comparés à la copie récupérable : 867 identiques, 15 modifiés intentionnellement (13 fichiers produit/tests/outillage, README et documentation d’import), aucun fichier initial modifié ou manquant de façon inattendue. Six captures historiques régénérées ont été archivées sous `regenerated-historical/` puis restaurées octet pour octet ; voir `preservation.json`. `changes.json` distingue 48 fichiers modifiés/ajoutés de produit, tests, fixtures, licences et outillage, plus 2 documents existants. Le patch binaire isolé est `lot03-code.patch` ; sa vérification inverse réussit sans appliquer de changement.

**Prochaine action : aucune implémentation restante pour ce lot.** La recette physique ci-dessous reste humaine et non exécutée. Avant toute reprise, lire ce rapport et `git status`, comparer l’empreinte et ne pas attribuer les travaux précédents au lot 03. Ne pas commencer le lot 04 sans nouvelle instruction. Aucun serveur de vérification ni navigateur de test lancé par cette mission n’est laissé actif ; le gate est terminé et le port 5173 est libre. Aucun serveur utilisateur n’a été arrêté.


## Démonstration reproductible

1. Démarrer `npm run dev`, puis Mes voyages → Créer depuis un planning. Saisir une note fictive avant de sélectionner `tests/fixtures/planning/documents/simple.pdf`.
2. Lire l’extraction et ses repères de page. Annuler : la note précédente est intacte. Réouvrir puis accepter « Remplacer le texte ».
3. Corriger le texte ; ouvrir « Texte extrait original » et télécharger la copie inchangée. Recharger, rouvrir l’import : les deux variantes sont présentes.
4. Reconnaître, vérifier ville/date/activités, compléter devise et fuseau si nécessaires, puis créer. Le carnet précédent n’est pas remplacé.
5. Refaire avec `lists-table.docx`, vérifier listes/tableau et la limite « corps uniquement ». Essayer `scan.pdf`, `protected.pdf` et `zip-bomb.docx` : erreurs explicites, source courante conservée.
6. Ouvrir « Préparer un programme avec ChatGPT ou une autre IA », copier le modèle dans un éditeur pour vérifier qu’il ne contient aucune note personnelle. Le remplir dans son propre outil puis revenir coller le résultat. Aucun abonnement ni service externe n’est nécessaire au parcours local.
7. Hors ligne : `npm run build` puis servir `dist` (build local, sans publication), ouvrir en ligne et attendre la fin d’installation du worker. Couper le réseau et recharger ; importer un document jamais ouvert auparavant. `node scripts/smoke-planning-documents.mjs` automatise ce cas sur un profil fictif isolé.

## Retour arrière ciblé

Les travaux des autres lots restent dans la copie initiale et dans le checkout ; ne jamais utiliser reset/clean global. `changes.json` et `lot03-code.patch` identifient seulement la différence avec la copie initiale, y compris les fichiers auparavant sales que ce lot touche.

Avant retour arrière : télécharger le texte corrigé et le texte extrait original, ainsi qu’une sauvegarde des carnets. Vérifier ensuite `git apply --reverse --check --ignore-space-change docs/development/lot-03-documents/lot03-code.patch`. N’appliquer l’inverse que si ce contrôle passe et qu’aucune contribution ultérieure ne dépend des lignes touchées. Puis `npm ci` et contrôles habituels. Conserver ce rapport et les preuves ; ne pas effacer le stockage du navigateur. Les carnets créés restent des carnets standard, sans migration distante à annuler.

## Limites et actions humaines

- Implémenté : extraction PDF texte/DOCX du corps, bornes, relecture, provenance récupérable, pont externe statique et quatre langues.
- Testé localement : preuves ciblées ci-dessus ; gate final réussi, preuves et empreintes ci-dessus.
- Service réel / OAuth / compte ChatGPT connecté : NON EXÉCUTÉ, aucun nouveau service intégré.
- Appareil physique : NON EXÉCUTÉ. Chromium mobile ne valide pas un iPhone réel. Le gate teste également la mise à jour WebKit existante ; cela ne constitue pas une certification physique du nouveau lecteur.
- Publié / push / migration distante / fusion : NON EXÉCUTÉ.

Recette humaine restante sur iPhone/Safari, sur une cible contenant ce code autorisée séparément : exporter une sauvegarde ; ouvrir un PDF texte depuis Fichiers et un DOCX ; comparer l’extraction au document ; annuler/remplacer, corriger et recharger ; copier le modèle dans un éditeur ; préparer la PWA puis passer en mode avion et ouvrir un autre fichier ; vérifier zoom 200 %, clavier et dernière action de la modale. Noter modèle, version iOS/Safari et étapes en cas d’écart. Aucune publication n’est requise ni autorisée par ce rapport.
