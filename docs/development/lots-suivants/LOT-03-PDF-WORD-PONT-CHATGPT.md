# Lot 03 — Importer PDF texte et Word, faciliter les programmes ChatGPT

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Dépend du lot 01 ; préserver le lot 02.

## Résultat

Ouvrir un PDF contenant du texte ou un DOCX, extraire son contenu localement, le vérifier puis utiliser le même aperçu de reconnaissance que le texte/Markdown. Fournir aussi un format simple à demander à ChatGPT ou à toute autre IA, sans API hébergée dans Détours.

## 1. Définir les entrées supportées

Inspecter `planning-import/files.ts`, le parcours de source, ses limites et ses tests. Conserver exactement les comportements TXT/Markdown.

Évaluer [PDF.js](https://mozilla.github.io/pdf.js/) et [Mammoth](https://github.com/mwilliamson/mammoth.js) aux versions actuelles : licence, taille, exécution navigateur et sécurité. Chargement différé, aucun document envoyé à un serveur. Préférer extraction texte/structure contrôlée plutôt qu'HTML brut injecté.

Politique initiale, à rendre configurable au même endroit : 10 Mo maximum par fichier binaire, 50 pages PDF, 50 000 unités de texte extrait selon le contrat actuel. Limiter aussi la décompression DOCX, le nombre d'entrées et le temps de traitement ; le poids compressé seul ne protège pas d'un ZIP démesuré. Ajuster ces bornes seulement avec mesure et justification.

## 2. Extraire sans fausse fidélité

PDF : conserver ordre de lecture et repères de pages autant que possible. Colonnes/tableaux et césures peuvent être ambigus : montrer le texte extrait avant reconnaissance. Un scan sans texte reçoit un message explicite ; pas de planning vide présenté comme réussi.

DOCX : conserver titres, paragraphes, listes et tableaux utiles. Pas d'exécution de contenu actif, de macro, de script ni de chargement de ressources externes. Pas de support .doc/.docm annoncé par extension trompeuse.

Reconnaître les fichiers par contenu et extension ; gérer document corrompu, PDF protégé et format non supporté. Ne jamais tronquer silencieusement. Annulation et remplacement de source préservent le brouillon précédent ; une extraction tardive ne l'écrase pas.

Conserver une provenance distinguant texte original saisi et texte extrait. Éviter de stocker par défaut le binaire dans localStorage ou les exports ; fournir le nom et les repères d'origine utiles. Si le texte doit être corrigé, garder la version extraite récupérable.

Sortie : aperçu lisible, limites explicites, aucune perte de source et interface réactive.

## 3. Pont avec une IA externe

Ajouter un modèle de programme copiable compatible avec le parseur : ville, date explicite si connue, journée, activités, horaires ou périodes, adresses facultatives, suggestions distinctes. Fournir un prompt FR/EN/ZH/ES demandant de préserver les inconnues et de ne pas inventer réservations ou coordonnées.

Le bouton copie le prompt/modèle, pas le carnet personnel par défaut. L'utilisateur utilise son propre outil puis revient coller le résultat. Aucune connexion au compte ChatGPT, session récupérée ou promesse de gratuité du fournisseur externe.

## 4. Validation

Fixtures fictives binaires réellement ouvertes : PDF simple, deux colonnes, tableau, scan, document protégé/corrompu, DOCX listes/tableaux, extension fausse, ZIP excessif, source dépassant la limite. Tester annulation, import suivant, rechargement, quatre langues, mobile et absence d'envoi réseau du document.

Évaluer séparément qualité d'extraction et qualité du parseur. Les échecs historiques de prose du lot 01 ne deviennent pas résolus grâce au support PDF.

Définir et tester le comportement hors ligne : si le module d'extraction doit être préparé/téléchargé auparavant, l'indiquer clairement. Éviter de charger toute la bibliothèque au démarrage de l'app.

Gate commun puis `docs/development/lot-03-documents/RAPPORT.md`, avec poids ajouté, formats/limites, preuves de source conservée. OCR et nouveau modèle hors périmètre.

