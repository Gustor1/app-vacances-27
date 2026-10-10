# Etoiles des pays favoris — 11 octobre 2026

Cause : WorldView utilisait le centre des limites rectangulaires du pays, qui peut se trouver hors du territoire (Vietnam, Thailande, archipels). La hauteur de ligne de la police pouvait egalement decaler le symbole dans son ancre Leaflet.

Correction : point interieur de la plus grande composante du pays, recherche adaptative du point le plus eloigne des contours dans la projection Mercator de Leaflet. Les trous sont exclus, les longitudes sont normalisees. Calcul uniquement pour les favoris, sans dependance ni changement des donnees. Icone centree avec flex et hauteur de ligne explicite.

Verification ciblee : trois tests reussis, dont controle independant d'appartenance au territoire pour tous les pays du fichier world-geography.json, formes concaves, trous et archipels. Controle visuel Chrome mobile 390 px avec Myanmar, Thailande et Vietnam ; trois marqueurs, aucune erreur JavaScript. Un controle complet initial a ete arrete faute de configuration PGlite ; outil installe hors depot, puis gate relance. Le rendu physique iPhone reste a confirmer.

La branche conserve le socle de la beta actuelle (notifications et refonte UX). Retour arriere avant publication : dpl_BfYGXC2w46N7gHo25tDT6Xhkqq4k. Les favoris existants ne sont pas modifies.

## Bilan final et publication

Types produit/tests, lint, 143 tests unitaires, deux suites SQL et 4 tests Deno passes. Gate zThfi7 en echec : 18 parcours notifications/calendrier passes et 49/50 parcours principaux passes ; la simulation de frappe de note depasse 90 secondes (reproduit separement avec et sans trace). Aucune modification du code des notes ni des limites du test. La correction de carte n'est pas chargee dans cette vue. Ne pas presenter le gate comme reussi.

Controles interrompus par le gate executes separement : 20/20 parcours L4/L5/L6 et preferences passes ; 9/9 controles du build compile passes, y compris Mon monde ouvert pour la premiere fois hors ligne et persistance des visites. Au total 87/88 parcours navigateur passes, avec le delai de note restant en echec. Rapport du gate conserve : WORLD-FAVORITE-MARKERS-GATE.json ; controles compiles : C:/Users/eliot/Documents/detours-world-validation-20261011/compiled-validation.json.

Beta publiee avec l'autorisation permanente : dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS, revision 14a96ec530690db25bf9b595fb88cabe5662e65b. Preview : 23 fichiers verifies par SHA-256 et comparaison au candidat reel ; trois favoris visibles, reglages notifications conserves, tailles 320/390/1440 sans debordement, hors ligne et aucune erreur JavaScript. Rapport public externe dans C:/Users/eliot/Documents/detours-release-20261011-world-markers. Retour arriere : dpl_BfYGXC2w46N7gHo25tDT6Xhkqq4k. Aucun changement de backend ni de donnees personnelles.

