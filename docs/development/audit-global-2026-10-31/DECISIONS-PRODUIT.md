# Décisions produit proposées

Ces décisions attendent le choix d’Eliot. L’audit ne les implémente pas. Cap conservé : carnet personnel et entre proches, utile sur place ; aucune transformation en SaaS d’agence.

| Fonction | Recommandation | Besoin, preuve et coût | Effet sur données et parcours |
|---|---|---|---|
| Carnets locaux, édition, exports v1/v2 et restauration v3 | Garder, consolider les contrôles | Contrats en code et tests actuels ; cœur du produit | Préserver identités, relations, sources et reprise, ne pas simplifier les garanties |
| Souvenirs quotidiens | Garder ; clarifier la sauvegarde | IndexedDB séparé et paquet distinct ; nuance du mot « souvenirs » dans backup | Ne jamais laisser penser qu’un seul JSON couvre les photos/légendes |
| Import texte/Markdown/PDF texte/DOCX | Garder avec aperçu | Extraction locale, limites et récupération source ; tests et revue DONNEES-IMPORTS | Créer un carnet sans écraser l’existant, conserver les ambiguïtés |
| Kit IA externe | Garder, distinguer fidélité et structure | Pas d’appel IA intégré ; schéma/générateur fournis | Ne pas transformer validation syntaxique en certification du document |
| Assistant local | Garder dans son vocabulaire actuel | Actions bornées, aperçu et verrou ; ne remplace pas un chatbot général | Préserver confirmation, conflit, annulation et droits |
| Modèle local lot 06 | Reporter l’intégration | Candidat rejeté dans le rapport ; pas de preuve nouvelle justifiant téléchargement | Garder protocole et corpus, aucun appel ni modèle ajouté |
| NVIDIA/Minimax lot 06 bis | Reporter, conserver les résultats | Benchmark non suffisant, fixtures fictives et limites documentées | Pas d’inférence pendant cet audit ni dépendance obligatoire |
| Maintenant/compagnon/alternatives | Garder ; diagnostiquer le timeout | Valeur sur place, données locales, tests navigateur en VALIDATION | Corriger une cause prouvée avant d’ajouter météo/recherche externe |
| Wikidata/Commons et liens Google/Amap | Garder optionnels | Acceptation champ par champ et limites de provenance visibles | Ne pas promettre des avis Google ni cartes rues complètes hors ligne |
| Mon monde | Garder | Souvenirs de pays distincts des photos ; fond local | Préserver l’export indépendant et absence de visite inventée |
| Compte/synchronisation/carnet commun | Garder en bêta, compléter la recette | Contrôles locaux ne valident pas Auth/RLS déployés ni appareils | Pas d’ouverture publique validée par ce rapport |
| Pico/Mochi/Bivouac | Garder optionnels | Préférences et mode réduit présents ; recette tactile physique manque | Aucun transfert du choix personnel vers carnet partagé |
| Atelier `/mascotte/` | Décider d’un packaging séparé ou reproductible | AUD-03, différence build standard / publication ; copies de sprites utilisées | Ne pas supprimer les prototypes avant arbitrage de la route |
| Multiples palettes | Garder, différer l’élargissement | Contrats générés existants ; pas de comparaison utilisateur démontrant besoin de plus | Préserver boot sans flash et accessibilité ; pas de refonte spontanée |
| Géographie Asie résiduelle | Retrait proposé après contrôle | AUD-02 : 1 002 221 octets précachés sans consommateur | Gain ressource sans changement fonctionnel attendu ; test cartes/hors ligne requis |
| Fermeture des formulaires modifiés | Simplifier la récupération | UX-01 : abandon attendu par code/test ; saisie à protéger | Confirmation conditionnelle ou brouillon local ; pas de blocage des formulaires inchangés |
| Coordination L7 (votes/tâches/commentaires) | Reporter | Déjà explicitement reportée ; sécurité et fiabilité prioritaires | Éviter nouvelles données partagées avant validation des droits existants |

## Ajouts à valeur mesurable (trois maximum proposés ici)

1. **Protection de saisie modifiée** : issue UX-01. Alternative simple : confirmation à la fermeture plutôt que nouveau moteur de brouillons. Sans API, fonctionne hors ligne, nécessite uniquement état local dirty. Critère : Échap/fond/glissement n’abandonne plus silencieusement une saisie modifiée ; aucune friction quand elle est inchangée.
2. **Rappel de la paire de sauvegardes** : nuance carnets/médias dans DONNEES-IMPORTS. Un avertissement existe déjà (`BackupPanel.tsx:85`, SOUVENIR_EXCLUSION) ; vérifier sa compréhension avant toute modification. Alternative : préciser le texte et les deux liens existants, sans inventer un nouveau format. Sans API, hors ligne, lire seulement présence/nombre de souvenirs. Critère : l’utilisateur peut nommer les deux fichiers nécessaires et récupérer carnet puis médias dans un profil vide.
3. **Index documentaire canonique pour contribuer** : fragmentation mesurée des documents. Alternative : README liens existants améliorés. Hors ligne, sans API ni données personnelles. Critère : retrouver contrat actuel, dernier rapport et limite réelle pour chaque lot depuis un seul index, sans faire passer l’historique pour l’état actuel.

## À ne pas construire maintenant

Chatbot général, génération automatique complète de voyage, intégration NVIDIA, nouvelle météo proactive, SaaS d’agence, votes/commentaires, refonte globale des polices et palettes. Aucun de ces ajouts n’est nécessaire pour traiter les constats observés. Le plan typographie non suivi reste un travail distinct, préservé.
