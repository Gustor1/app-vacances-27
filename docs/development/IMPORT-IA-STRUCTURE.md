# Préparer un planning avec son propre outil IA

Dans **Mes voyages → Créer depuis un planning → Préparer mon planning avec mon IA**, télécharger les consignes puis les donner à son outil avec le planning personnel. Revenir importer le résultat JSON, lire et corriger l’aperçu puis créer le carnet. Le kit ne contient aucune donnée personnelle ; il ne connecte aucun compte IA. Le fournisseur choisi peut traiter les documents et appliquer ses propres tarifs.

## Fichiers réels du kit

- [Consignes françaises](../../public/import-kit/PREPARER-MON-VOYAGE-DETOURS.md)
- [English](../../public/import-kit/en/PREPARER-MON-VOYAGE-DETOURS.md)
- [中文](../../public/import-kit/zh-CN/PREPARER-MON-VOYAGE-DETOURS.md)
- [Español](../../public/import-kit/es/PREPARER-MON-VOYAGE-DETOURS.md)
- [Exemple minimal sans date](../../public/import-kit/exemple-minimal.detours.json)
- [Exemple complet fictif](../../public/import-kit/exemple-complet.detours.json)
- [Schéma public v1](../../public/import-kit/detours-planning-v1.schema.json)

Chaque variante est autonome et contient le même schéma complet, les mêmes règles et les deux exemples. Un seul fichier de consignes suffit ; aucun accès au dépôt ni outil spécialisé n’est nécessaire à l’IA. Les clés JSON restent identiques dans les quatre langues. Le générateur `node scripts/generate-import-kit.mjs` produit les fichiers à partir du contrat et des exemples utilisés par l’application ; les tests en vérifient l’égalité.

## Import structuré et sauvegardes

Un fichier `mon-voyage.detours.json` porte `format: "detours-planning"` et `version: 1`. C’est un format public de préparation, indépendant des objets internes. Il n’accepte ni identifiants internes, ni compte, ni rôle, ni état de synchronisation. Il ajoute un carnet après confirmation, sans remplacer un autre carnet. Une seconde copie volontaire est possible ; une reprise de la même session termine le même carnet.

Une sauvegarde voyage/collection v1/v2 ou une sauvegarde complète v3 utilise les fonctions **Importer un fichier** ou **Restaurer mes données** depuis Mes voyages. Ce n’est pas un résultat IA. L’import structuré refuse ces enveloppes et indique le bon parcours. Les imports directs texte, Markdown, PDF texte et DOCX restent disponibles.

## Contrat, limites et inconnues

Le schéma lié ci-dessus définit les champs, types, catégories, longueurs et collections. Tous les champs sont requis, les inconnues scalaires sont `null`, les collections vides sont `[]`. Une chaîne vide ou composée seulement d’espaces n’est pas une inconnue valide. Les villes et journées conservent leur ordre sans fabriquer de date. Aucune recherche de lieux ni conversion de fuseau n’est effectuée.

Limites globales : UTF-8, 200 000 octets avant lecture, 50 000 unités UTF-16 après décodage, profondeur 12, 10 villes, 100 journées au total, 200 éléments au total. Les bornes par collection/champ figurent dans le schéma. Les dates calendaires ISO sont vérifiées ; heures `HH:MM` sur 24 h ; horaires locaux `YYYY-MM-DDTHH:MM`, sans suffixe de zone. Devise de trois lettres majuscules et fuseau IANA seulement si fournis, sinon le formulaire conserve la saisie précédente.

`checkIn/checkOut` ne concernent que `stay`, avec départ au plus tôt le jour d’arrivée. `from/to/mode/departure/arrival` ne concernent que `transfer`. `from`, s’il est connu, doit correspondre exactement au nom de la ville contenant le trajet. Les suggestions et alternatives ne portent jamais de réservation confirmée. Les champs, versions, formats, clés dupliquées ou URL à protocole exécutable non pris en charge sont refusés avec un chemin vers l’erreur. Les blocs de code sont refusés ; fournir du JSON seul, sans réparation automatique.

`notes`, `ambiguities` et `unmapped` conservent les informations libres, incertaines ou non représentables. Les montants estimés n’engendrent aucune dépense. Les coordonnées géographiques ne font pas partie du contrat : si elles existent dans la source, les conserver en texte dans `unmapped`, sans les inventer. Le modèle de carnet n’est pas étendu pour ce lot.

Le premier hébergement d’une ville peut utiliser sa fiche d’hébergement ; les suivants restent dans les activités et les notes existantes. Un transport sans origine/destination fournies et uniques reste une activité de transport avec ses détails en notes. Aucune destination ou origine manquante n’est inventée.

## Fidélité, source et reprise

La validation vérifie la structure et les valeurs, **pas la fidélité au planning personnel original**, qui peut rester chez l’utilisateur. La provenance « fichier IA externe » donne un chemin dans le JSON et sa valeur décodée. Elle ne désigne ni une citation vérifiée de l’original ni une correction humaine. L’aperçu permet les corrections, exclusions, déplacements et vérifications avant confirmation.

Le fichier importé reste récupérable dans le brouillon personnel jusqu’à son effacement explicite. **Télécharger le texte source** récupère le JSON, y compris après correction de l’aperçu. L’ajout de cette source au carnet est un choix explicite ; son titre indique qu’il s’agit d’un fichier IA externe, pas du planning original. Les notes utiles non structurées restent conservées selon le contrat habituel. Avant d’effacer ou remplacer la session, télécharger sa source si elle doit être gardée.

Un fichier invalide ne remplace pas la source actuelle. Le téléchargement des erreurs contient uniquement code, chemin de champ et message, sans valeur du planning ; il permet de demander une correction à son outil. Vérifier ce diagnostic avant de le transmettre. Un manque de quota affiche une erreur et laisse la source consultable/téléchargeable, avec reprise après rechargement quand le stockage est disponible. Les sessions anciennes restent compatibles et les espaces personnels sont séparés.

## Hors ligne et preuves

Ouvrir la version compilée en ligne et attendre la préparation complète de la PWA. Kit, exemples et import JSON deviennent utilisables hors ligne, même pour un fichier jamais ouvert auparavant. Le travail dans l’outil IA choisi peut requérir sa propre connexion. L’import ne suit aucun lien contenu dans le fichier et ne contacte aucun modèle.

Les tests avec fichiers fictifs valident le contrat et le parcours, pas les capacités d’un fournisseur IA. Essais avec de vrais plannings et recette iPhone physique restent à effectuer par l’utilisateur. [Rapport de validation, limites et retour arrière](lot-03-bis-kit-import/RAPPORT.md). Aucun déploiement ou lot suivant n’est lancé par ce parcours ; le lot 06 de modèle local reste dans la feuille de route.
