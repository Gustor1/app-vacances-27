# Assessment B — mesures techniques indépendantes

Date : 2 novembre 2026 (Asia/Shanghai). Source : état local courant, serveur http://127.0.0.1:5180 avec Supabase factice préparé par le parent. Aucun résultat de l'assessment A consulté.

## Exécution et preuves

- `impeccable.cmd detect --json src`, exécuté une fois : sortie `[]`, code 0. JSON conservé dans `detector.json`. Le résultat signifie absence de signaux de ce détecteur statique, pas conformité WCAG ni absence de bugs.
- Navigateur natif CUA : Chrome non disponible (`Browser is not available: chrome`). Inventaire : IAB disponible. Nouvel onglet IAB créé pour cette évaluation, sans connexion ni données personnelles.
- API navigateur `evaluate` explicitement en lecture seule. Injection mutable/overlay indisponible ; aucun live-server lancé, aucun fichier HTML injecté. Pas d'overlay présenté à l'utilisateur. Repli : rendus natifs + DOM/CSS calculés + revue du code. Les captures natives sont visibles dans les résultats outils de cette évaluation ; elles ne sont pas enregistrées comme fichiers PNG dans ce dossier.
- États réellement affichés : accueil vide sombre 1280×720 ; planning du modèle public Chine clair 1280×720 ; même planning clair 390×844 ; planning espagnol et chinois 390×844 ; préférences anglaises 768×1024.
- Actions : choix clair, ajout du modèle public Chine dans cet espace de test, choix espagnol/chinois/anglais, déplacement clavier de la mascotte avec Maj+Flèche gauche. Pas de visite de service distant ni d'écriture distante ; les tuiles cartographiques sont des ressources réseau ordinaires de l'application. La CUA n'offre pas d'interception réseau dans sa surface documentée, donc ces observations ne constituent pas un essai réseau isolé/hors ligne.
- Nettoyage : viewport réinitialisé et onglet B fermé. Aucun serveur à arrêter dans cette évaluation.

## Constats confirmés

### B-01 — P1 accessibilité : nom local de ville illisible en mode clair

Écran planning, exemple Chine, ville Shenzhen. `.city-heading h2 > span` contient `深圳` (source `src/App.tsx:242`). Valeurs calculées : texte `rgb(166,174,155)` (#a6ae9b), fond opaque body `rgb(232,223,208)` (#e8dfd0), 18px, poids 400. Contraste calculé selon luminance sRGB : **1,737547:1**. Seuil AA applicable texte normal : 4,5:1. La mesure n'utilise pas un fond semi-transparent ni un gradient. Impact : voyageurs malvoyants et lecture extérieure pénalisés sur un nom utile à l'orientation.

Recommandation : appliquer un token textuel suffisamment contrasté au nom local dans les palettes claires ; vérifier les autres occurrences du nom local, clair/sombre, FR/EN/ZH/ES. Effort petit (0,5–1 j avec revue palettes). Risque faible, ne pas traiter le nom comme un simple décor.

### B-02 — P2 UX : promesse de sauvegarde ambiguë sur les « souvenirs »

Accueil, panneau Sauvegarder et restaurer mes données : « Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier vérifié » puis, en plus petit, « Les photos et légendes quotidiennes sont exclues de cette sauvegarde ». Observé dans l'arbre accessible et le DOM. Source `src/components/BackupPanel.tsx:85`, dictionnaire `src/locales/backup.ts:4`, exclusion `src/souvenirs.ts:3`. Les souvenirs Mon monde et les souvenirs photos quotidiens utilisent le même mot ; l'album récent accroît cette ambiguïté.

Impact : utilisateur persuadé de transporter toutes ses photos avec la sauvegarde « complète ». Aucun défaut d'export démontré : il s'agit de terminologie et hiérarchie de l'avertissement. Recommandation : nommer explicitement les souvenirs de pays/visites inclus et le paquet photos séparé, afficher les exclusions au même niveau de lecture que la promesse. Effort petit (0,5–1 j traductions/revue). Risque faible ; préserver les formats.

### B-03 — P2 technique confirmé, impact tactile à vérifier : conflit touch-action de la mascotte

`src/components/FloatingMascot.css:3` demande `touch-action:none` pour le bouton déplaçable. `src/apple-design.css:95` définit `html:root:root :is(button, summary) { touch-action: manipulation; }`, plus spécifique. Mesure calculée dans le navigateur à 390px : `.floating-mascot .pet-button` a **touchAction=manipulation**, taille 96×96.

Le traitement pointer est cohérent (capture, cancel et lost capture : `FloatingMascot.tsx:127–130`) ; le conflit CSS réautorise cependant les gestes de défilement natifs là où le contrat de glissement prévoit de les réserver. **Aucun échec de glissement tactile n'est revendiqué**, car la surface CUA n'expose pas de synthèse tactile. Recommandation : protéger l'exception drag dans la cascade après essai tactile synthétique et téléphone ; garder le scroll normal hors mascotte. Effort petit à moyen (0,5–1 j). Risque : bloquer le défilement si l'exception déborde sur le parent.

### B-04 — P2 accessibilité : noms accessibles des marqueurs trop pauvres

Sur la mini-carte du planning, l'arbre accessible annonce le marqueur central comme bouton **« · »** ; le titre HTML et la description donnent « Shenzhen · centre indicatif ». DOM observé : `<div class="leaflet-marker-icon trip-map-marker trip-map-center-marker ..." title="Shenzhen · centro aproximado" tabindex="0" role="button" aria-describedby="leaflet-tooltip-550"><span>·</span></div>` ; aucun `aria-label`. Source `src/components/TripMap.tsx:158–161`. Les marqueurs ordinaires utilisent de même des chiffres dans leur `divIcon` (`TripMap.tsx:33–35`) et un titre (`:133`). Le titre ne remplace pas le nom texte pris en priorité pour le bouton. Impact : la liste des boutons ne décrit pas les lieux ; la description conserve une information, donc ce n'est pas une carte entièrement inaccessible.

Recommandation : définir explicitement le nom accessible du marqueur à sa création, y compris le repère indicatif, et vérifier Enter/Espace, fermeture popup et retour focus. Effort petit (0,5 j). Risque faible, attention au cycle de création Leaflet et au changement de langue.

## Signaux à ne pas transformer en bugs

- Détecteur statique : aucun finding, aucune règle ni localisation à valider ; aucune liste de faux positifs détecteur.
- Débordement géométrique des boutons villes à 390px : contenu d'un carrousel horizontal prévu, pas débordement du document. Mesure : innerWidth390 / document scrollWidth375. À 1280 : scrollWidth1265. À 768 après fermeture modal : scrollWidth761 (innerWidth768, clientWidth753). Pas de dépassement du viewport démontré sur ces états.
- Cibles <24px dans le planning desktop : input recherche hauteur20, liens d'attribution Leaflet hauteur12. L'input bénéficie d'un conteneur visuel large ; les liens inline relèvent des exceptions. Pas de violation WCAG 2.5.8 conclue sur ces seules dimensions.
- `FloatingMascot.css:5` contient outline:none, mais la cascade finale rétablit un focus : après Maj+Flèche gauche, focus sur la mascotte, `:focus-visible=true`, outline **3px solid rgb(59,109,88)**. Déplacement clavier réussi. Ce point est un faux positif de lecture CSS isolée.
- Le contrôle radio Clair via `check()` a produit un timeout CUA, puis le prochain état affichait Clair sélectionné : incident d'automatisation, pas défaut produit démontré.
- Préférences utilise un vrai `<dialog>.showModal()` (`Preferences.tsx:24–31`) : l'absence d'attribut role=dialog explicite n'est pas un bug sémantique.
- Textes du modèle Chine conservés en français en ES/ZH/EN : contenu utilisateur/catalogue d'origine ; ce contrat est annoncé dans les préférences. Pas d'erreur i18n générique conclue.

## Motion, performance et intégrité

- Présence d'un coupe-animation global à `.01ms` dans `src/theme.css:78`, puis règles ciblées pour décor, souvenirs et dossiers `TravelDelight.css:180–189`. Préférence système honorée au niveau CSS ; clarté du feedback en mouvement réduit non intégralement testée par B. Pas de symptôme de perte de feedback revendiqué.
- Couvertures de carnets et copies de souvenirs utilisent `loading=lazy` et `decoding=async` (JourneysApp.tsx:203, TravelMemories.tsx:13), ce qui mérite d'être préservé.
- Snapshot des tailles brutes dist (le build peut avoir été reconstruit par le gate parent) : index principal657533 octets, PDF573788, React221872, cloud217403, traductions199329, autre index154460, carte149501, PlanningImport80182. Ce sont des tailles non compressées, pas un budget réseau mesuré ni une régression démontrée. Modules PDF/carte/cloud découpés ; prioriser une mesure de chargement plutôt que déclarer le bundle lent par sa seule taille.
- Palette, typographie et détails de navigation sont cohérents avec un carnet de voyage : Newsreader pour les titres éditoriaux, Hanken Grotesk pour les contrôles, fallback CJK. Absence de PRODUCT.md/DESIGN.md signalée par le setup parent : documentation de design manquante, pas absence de système visuel.

## Score technique proposé (indicatif, pas certification)

| Dimension | Score /4 | Motif |
|---|---:|---|
| Accessibilité | 2 | Contraste 1,74:1 et noms marqueurs à corriger ; labels et focus présents |
| Performance | 3 | Chargements découpés/lazy, absence de mesure exhaustive B |
| Thèmes | 3 | Palettes cohérentes, fuite de couleur du nom local en clair |
| Responsive | 3 | États desktop/mobile/tablette utilisables, geste tactile restant à éprouver |
| Intégrité | 3 | Système cohérent, conflit de spécificité touch-action localisé |
| Total | **14/20** | Bon socle, corrections ciblées nécessaires |

Limites : pas de lecteur d'écran NVDA réel, appareil physique, zoom navigateur200%, synthèse tactile, preuve FPS ou mesure vitaux Web ; pas de tests indépendants exécutés par B (parent responsable du gate). Toutes les évaluations visuelles et mesures sont de l'état local courant.
