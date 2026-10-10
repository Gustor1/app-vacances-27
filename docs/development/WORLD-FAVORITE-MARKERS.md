# Etoiles des pays favoris — 11 octobre 2026

Cause : WorldView utilisait le centre des limites rectangulaires du pays, qui peut se trouver hors du territoire (Vietnam, Thailande, archipels). La hauteur de ligne de la police pouvait egalement decaler le symbole dans son ancre Leaflet.

Correction : point interieur de la plus grande composante du pays, recherche adaptative du point le plus eloigne des contours dans la projection Mercator de Leaflet. Les trous sont exclus, les longitudes sont normalisees. Calcul uniquement pour les favoris, sans dependance ni changement des donnees. Icone centree avec flex et hauteur de ligne explicite.

Verification ciblee : trois tests reussis, dont controle independant d'appartenance au territoire pour tous les pays du fichier world-geography.json, formes concaves, trous et archipels. Controle visuel Chrome mobile 390 px avec Myanmar, Thailande et Vietnam ; trois marqueurs, aucune erreur JavaScript. Un controle complet initial a ete arrete faute de configuration PGlite ; outil installe hors depot, puis gate relance. Le rendu physique iPhone reste a confirmer.

La branche conserve le socle de la beta actuelle (notifications et refonte UX). Retour arriere avant publication : dpl_BfYGXC2w46N7gHo25tDT6Xhkqq4k. Les favoris existants ne sont pas modifies.
