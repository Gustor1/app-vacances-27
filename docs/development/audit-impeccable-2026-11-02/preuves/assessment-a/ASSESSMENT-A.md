# Assessment A — critique UX indépendante

Date : 2 novembre 2026 (Asia/Shanghai). Cible : état local de Détours, serveur fictif http://127.0.0.1:5180. Aucune sortie du détecteur ni assessment B consultée. Mode Operate pour le carnet, Read pour les documents. Observation avec Chrome installé (exécutable explicite), profils jetables et réseau externe bloqué. Les données créées restent dans ces profils.

## Verdict

Une identité reconnaissable : relief topographique, vert et papier chaud, titres éditoriaux, noms locaux, progression par étapes et compagnon animé. Ce système raconte réellement un voyage. Sa principale faiblesse est sa place à l’écran : la scénographie de bienvenue revient sur les outils, avant le contenu qui doit servir sur place. La marque est réussie ; l’efficacité mobile et la largeur intermédiaire demandent une passe dédiée.

## Scores heuristiques (jugement borné, pas certification)

| Heuristique | /4 | Preuve dominante |
|---|---:|---|
| Visibilité de l’état | 3 | état local et limites Internet explicites ; répétition volumineuse |
| Langage du monde réel | 3 | villes/journées/activités compréhensibles ; souvenirs polysémique |
| Contrôle et liberté | 3 | Escape ferme import/préférences/assistant ; brouillon annoncé récupérable |
| Cohérence | 3 | mêmes composants et repères ; tu/vous dans outils |
| Prévention des erreurs | 3 | aperçu import, inconnues signalées ; aucune destination inventée |
| Reconnaissance plutôt que rappel | 2 | navigation visible desktop ; nombreuses vues cachées derrière Menu mobile |
| Souplesse et efficacité | 2 | contenu opérationnel repoussé ; longs formulaires import |
| Esthétique et sobriété | 2 | identité cohérente mais en-têtes et messages redondants |
| Récupération | 3 | source conservée et problèmes import localisés ; pas de test manuel exhaustif des pannes |
| Aide et documentation | 3 | limites hors ligne/cartes/IA et sauvegardes explicites |
| Total | 27/40 | Acceptable, 67,5 % ; subjectif et limité aux états visités |

## Constats prioritaires

### A1 — P1, bug responsive confirmé : actions coupées sur tablette

Écran : Mon carnet pratique, EN sombre, 768×1024. Capture 10-practical-tablet-en-dark.png : la barre latérale desktop occupe 264 px ; Continue et Export notebook restent sur une rangée à côté du titre, Export notebook sort à droite du viewport. Le titre long traduit réduit encore la place. Sur Outils FR à 768 px : document.documentElement.scrollWidth=780 pour innerWidth=768 (capture 14-tools-tablet-fr.png). Le constat anglais est visuel ; la mesure 780 concerne Outils FR.

Impact : bouton moins lisible, risque de manquer l’export et glissement horizontal involontaire. Recommandation : faire passer les actions sous le texte et adapter la navigation avant la limite actuelle de 760 px ; vérifier 761, 768, 820, 1024 et les 4 langues. Sources candidates : src/App.tsx:239, .page-intro/.intro-actions dans theme.css et apple-design.css. Effort : 0,5–1 jour. Risque : petits effets de cascade desktop/mobile ; contrôle visuel ciblé suffisant si CSS uniquement. Commande future : adapt.

### A2 — P2, UX : le contenu utile arrive après presque un écran d’introduction

Écrans : vues du carnet, surtout mobile. Capture 06-overview-mobile.png à 390×844 : bandeau compte/sync, assistant, Voir Maintenant, titre narratif, texte, Reprendre et Exporter précèdent Vue d’ensemble ; le premier élément opérationnel visible est Exporter le calendrier (0) vers y=740. Le planning Chine desktop (19-planning-desktop.png) ne montre pas la journée dans les 1000 premiers pixels : bandeaux + intro + grande couverture + étapes. Pour un carnet vierge au titre long, mesuré dans 23-blank-long-title-mobile.png, Ton premier détour commence à y=1452, après deux grands titres ; pas de débordement horizontal (390/390).

Impact : Casey sur place et Alex qui revient doivent défiler avant leur tâche ; le lien de reprise aide mais ne remplace pas l’accès direct au contexte. Recommandation : réserver la grande entrée narrative au premier accueil/à la couverture ; condenser le statut et les actions au retour et dans Carte/Outils/Pratique. Préserver les alertes significatives. Effort : 1–2 jours. Risque : perdre la visibilité réelle de la synchronisation si condensation excessive ; vérifier local, attente, erreur et lecteur. Commandes futures : distill, layout.

### A3 — P2, UX : prévisualisation import trop dense sur mobile

Reproduction : accueil → Créer depuis un planning → texte fictif « Jour 1 — Lyon / Matin : visiter le Vieux Lyon / Après-midi : musée » → Reconnaître mon programme. Capture 21-import-preview-mobile.png : alerte d’affectation, titre vide signalé et source préservée ; l’interface avertit correctement sans inventer de ville. Mais seulement deux activités donnent 45 contrôles dans le dialogue et un contenu défilable de 4019 px pour 718 px visibles. Les champs avancés sont exposés d’emblée ; le bouton final est en bas. Texte « 1 journées · 2 propositions · 1 passages à vérifier » : accords singuliers incorrects confirmés.

Impact : fatigue de relecture, risque de confondre contrôle obligatoire et enrichissement facultatif ; l’utilisateur doit garder beaucoup d’informations en mémoire. Recommandation : présenter d’abord les anomalies et un résumé par journée, ouvrir les détails avancés par activité ; garder source et action finale accessibles ; corriger la pluralisation. Effort : 2–4 jours pour la présentation, quelques heures pour les accords. Risque : masquer une anomalie ou changer une décision de revue ; préserver explicitement les décisions et vérifier les tests import existants. Commandes futures : harden, clarify, distill.

### A4 — P2, UX de sauvegarde : le terme souvenirs désigne deux périmètres

Écrans : accueil et Mon monde. Capture 01-home-desktop.png, contenu BackupPanel.tsx:85 : « Carnets, documents embarqués, souvenirs et préférences utiles dans un seul fichier » ; plus bas le texte exclut explicitement photos et légendes quotidiennes et renvoie au paquet souvenirs. Mon monde propose aussi « Exporter mes souvenirs / Restaurer mes souvenirs » pour les visites. L’exclusion est présente et lisible : aucun export incomplet n’a été démontré par A.

Impact : un lecteur pressé peut interpréter sauvegarde complète comme incluant ses photos. Recommandation : nommer distinctement visites de Mon monde, carnet et photos/légendes ; annoncer l’exclusion dès la phrase principale ou fournir un résumé des deux fichiers à conserver. Effort : 0,5–1 jour avec traduction. Risque : dériver du contrat réel ; vérifier les archives et tests existants plutôt que changer le stockage. Commande future : clarify.

### A5 — P2, présentation : compagnon superposé au contenu de lecture

Captures 02-home-mobile.png : Pico recouvre le filtre Pays ; 23-blank-long-title-mobile.png et 28-planning-320.png : Pico recouvre des mots du titre et du texte principal ; 29-world-320.png : proche du texte de statut et du titre Mon monde. Position flottante au-dessus de l’interface. Le déplacement et la désactivation sont disponibles et expliqués dans Préférences ; aucune impossibilité d’activer un contrôle n’est revendiquée ici.

Impact : perte de lisibilité sur petite largeur, surtout au premier usage où le geste de déplacement n’est pas connu. Recommandation : réserver une zone de repos hors des champs/titres/boutons et déplacer automatiquement le personnage lors des panneaux, ou réduire sa présence au repos sur 320–390 px. Effort : 1–2 jours. Risque : gestes, persistance de position et raccourcis clavier ; reprendre tests mascot/floating-mascot ciblés et vérifier visuellement. Commandes futures : adapt, animate.

## Points forts à préserver

- Lecture de voyage soignée : titres, noms locaux et ligne des villes rendent le carnet reconnaissable. Cartes ne présentent pas leurs pointillés comme une route réelle ; fond indisponible clairement annoncé avec contours locaux.
- État local/synchronisation honnête : Internet disponible n’est jamais présenté comme preuve d’envoi. Documents, OCR absent et IA facultative ont des limites concrètes.
- Création progressive : carnet → ville → journée → activité fonctionne avec données fictives ; coordonnées et dates facultatives n’inventent pas de géographie. Titre personnel de 105 caractères se coupe proprement dans le haut de page et revient à la ligne dans la couverture, sans débordement à 390 px.
- Préférences lisibles, quatre langues réellement observées, thème sombre cohérent. Boutons de langue, focus visible et fermeture Escape fonctionnent dans les dialogues visités. Le contenu source Chine reste dans sa langue, conformément au contrat.
- Assistant explique précisément son caractère guidé, l’absence d’envoi IA et la prévisualisation avant écriture (27-assistant-mobile.png).

## Charge cognitive et parcours émotionnel

Jordan comprend l’action de départ (Créer un voyage / depuis un planning), mais rencontre sur l’accueil des filtres sans carnet et plusieurs entrées de création/import/restauration. Riley est rassuré par le brouillon récupérable et la source d’import, puis doit lire plusieurs écrans de champs pour deux activités. Casey trouve une navigation basse persistante mais un fort coût de défilement avant le contenu. Sam bénéficie de noms accessibles et Escape ; aucun lecteur d’écran réel ni parcours complet au clavier n’a été exécuté dans A. La première impression chaleureuse est un point haut ; l’aperçu import et les distinctions de sauvegarde sont les vallées où réduire la charge. Les confirmations de création/enregistrement sont visibles.

## Couverture réellement observée

Accueil vierge et collection, exemple Chine, planning, vue d’ensemble, carte, bonus, transports vides, Maintenant sans dates, carnet pratique/réservations/documents vides/préparation hors ligne (mode dev), outils/hébergements/budget vide et taux réseau indisponibles ; préférences FR/EN/ES/ZH clair/sombre ; assistant sans action confirmée ; import texte et aperçu ambigu ; carnet vierge avec titre long puis ville/journée/activité fictives. Mon monde vide à 320 px. Captures 01–29 dans ce dossier. Au moins les captures 01,03,04,05,06,07,09,10,11,17,18,19,21,23,27,28,29 ont été inspectées visuellement, au-delà des relevés DOM.

Largeurs : 1440 desktop, 768 tablette, 390 mobile et 320 petit mobile. À 320 : planning et Mon monde ont scrollWidth=innerWidth=320. Ces résultats ponctuels ne prouvent pas toutes les vues. Réduction de mouvement non évaluée manuellement par A. Zoom navigateur réel 200 %, touch physique, Safari, lecteur d’écran, authentification et services distants non testés. Photos réelles, impression et restauration de paquet souvenirs non exercées par A ; parent exécute contrôles existants distincts. Pas de jugement de performance chiffré à partir du serveur dev. Un chargement différé Mon monde a été attendu avant capture finale ; pas déclaré bug.

## Provenance et limites techniques

A s’est appuyée sur les fichiers courants et ses propres observations, pas sur l’ancien audit. Chrome channel standard était introuvable au chemin AppData attendu par Playwright ; lancement explicite réussi avec C:/Program Files/Google/Chrome/Application/chrome.exe. Une première capture import a été remplacée après attente du dialogue ; une capture assistant pendant transition a été remplacée par son état stabilisé. Deux timeouts d’orchestration de parcours ont réinitialisé le REPL : ils ne prouvent pas un défaut du produit. Les assertions de zoom, de tactile physique et de conformité WCAG globale restent hors preuve. Aucun changement de code, commit, push ou service distant.

Questions skipped: l’utilisateur demande un audit et un plan avant toute correction ; aucune clarification n’est nécessaire à ce stade.
