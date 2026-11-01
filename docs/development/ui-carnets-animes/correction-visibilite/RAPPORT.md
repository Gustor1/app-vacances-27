# Correction de visibilité — 1er novembre 2026

Retour utilisateur sur la version locale `http://127.0.0.1:5173` : dossiers, graphique de budget et progression d’import non repérés ; relief d’accueil paraissant immobile.

## Causes et corrections

- **Documents** : le dossier animé n’existait qu’après une première pièce jointe. Le carnet sans document montre désormais un dossier vide, avec une feuille qui se soulève au survol/focus. Son bouton ouvre le vrai sélecteur de fichier. Aucun document fictif n’est ajouté.
- **Budget** : le graphique retournait `null` lorsque le total convertible était nul ou absent. Un anneau neutre reste désormais visible dans la première carte de dépenses, avant les informations de devise personnelle. Il indique zéro en l’absence de dépenses et un tiret lorsque des montants attendent leur conversion ; aucune répartition n’est inventée. Le graphique se remplit à partir des montants réellement convertibles.
- **Import** : les trois étapes existaient, mais restaient discrètes et défilaient avec le contenu. Leur bloc affiche maintenant le compteur et l’étape courante ; il reste en tête de la zone de défilement, avec animation de la progression.
- **Relief** : animation de 19 secondes à démarrage très lent. Mesure initiale sur une seconde : déplacement du rectangle d’environ 0,04 px horizontalement et 0,05 px verticalement. Le déplacement est désormais linéaire sur huit secondes et les courbes évoluent aussi séparément. Le test vérifie un déplacement réel supérieur à 2 px avant 1,8 seconde.
- **Réduction des mouvements** : le bouton affichait auparavant « pause » même lorsque le système supprimait l’animation. L’état initial suit maintenant la préférence système ; un bouton textuel « Animer le relief » permet de lancer explicitement ce seul effet. Pause, changement de préférence système, masquage de l’onglet et sortie d’écran restent pris en compte. Aucun réglage Windows ni préférence globale n’est changé.

La fenêtre Chrome personnelle n’a pas pu être inspectée par l’outil, qui ne parvenait pas à vérifier son adresse. Le diagnostic a été reproduit dans des profils de navigateur de test isolés, puis confirmé par les conditions de rendu du code. Les données personnelles de la fenêtre de l’utilisateur n’ont pas été manipulées.

## Vérifications ciblées

Code : `e11b75b`.

Avant correction, cinq régressions échouaient : dossier vide absent, graphique vide absent, progression non épinglée, mouvement imperceptible et état lecture/pause incompatible avec la préférence système.

Après correction :

- **21 scénarios navigateur réussis** : les onze nouveaux scénarios de visibilité et les dix scénarios préexistants des carnets animés.
- **Quatre scénarios complémentaires réussis** après ajout de l’assertion « toutes les dépenses sans taux » : anneau neutre et tiret conservés, puis apparition d’une vraie répartition après ajout d’une dépense convertible. FR/EN/ZH/ES.
- `npm run typecheck`, `npm run lint`, **336 tests unitaires** : réussis.
- Contrôle visuel ordinateur et mobile ; contrôle Impeccable : aucun signalement (`[]`).

Captures avec carnet fictif sans document et sans dépense : [dossier vide](dossier-vide-desktop.png), [budget](budget-vide-desktop.png), [budget à 320 px](budget-vide-mobile.png), [progression d’import](progression-import-mobile.png).

## Contrôle global

`npm run verify:local`, avec PGlite hors dépôt, lancé sur `e11b75b` : **12 étapes réussies**, dont les batteries de 93 + 37 + 3 + 28 scénarios navigateur (161 scénarios), puis échec de `smoke-production` à la recherche du bouton anglais « Create journal ». **22 étapes non exécutées**. Sources inchangées pendant ce passage. [Rapport machine](gate-local.json).

Le dictionnaire des nouveaux composants remplaçait la traduction anglaise existante « Create journal » par « Create notebook ». La ligne redondante a été retirée pour réutiliser les traductions préexistantes. Vérification directe des libellés EN/ZH/ES réussie après cette correction.

**À la demande explicite de l’utilisateur, la batterie globale n’est pas relancée.** Elle s’était déjà arrêtée sur l’échec ci-dessus avant la demande d’arrêt. Les tests ciblés réussis restent la validation de cette correction ; le contrôle global n’est pas présenté comme réussi. L’utilisateur a demandé de terminer cette correction avec les vérifications ciblées déjà réussies.

Vérification complémentaire sur le build compilé : dossier vide, graphique vide, commande de lecture explicite sous réduction des mouvements et rechargement du graphique hors ligne réussis. [Preuve](verification-compilee.json).

Ces contrôles ne valident ni OAuth réel, ni les services distants, ni un appareil physique. Le build de test `5b65175ec3ae1839a58b334caae65ef190b93ae4027ca321e7b57d2e51e278a1` utilise une configuration factice et ne doit pas être publié tel quel. La dernière correction de dictionnaire est validée séparément et n’est pas incluse dans ce build.
