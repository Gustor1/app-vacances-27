# Repères du système conservé

2 novembre 2026. Note limitée aux corrections de l’audit, sans refonte ni nouveau système de design.

- L’interface est une surface de travail : titres Newsreader, contrôles Hanken Grotesk, palette papier/vert et sombre prune conservés. Les noms personnels et locaux restent dans leur langue.
- `src/palettes.ts` fournit les couleurs ; `src/typography.css` les polices. Un nom local fonctionnel utilise `--text`, même dans un titre. Le contraste se vérifie sur le fond composé, pas uniquement entre deux tokens.
- `src/apple-design.css` est la dernière couche de finition. Ses sélecteurs `html:root:root` peuvent gagner sur les styles des composants ; les deux conflits corrigés concernaient le nom local et le geste de déplacement. Cette passe ne réorganise pas toute la cascade.
- Le seuil de navigation mobile reste 760 px. Au-dessus, la barre latérale occupe 264 px ; les actions des titres doivent donc pouvoir revenir à la ligne selon l’espace central, sans attendre un autre seuil global.
- Les vues de travail portent leur nom fonctionnel. La couverture illustrée du planning est un élément `details` accessible au clavier. Elle conserve le visuel complet à la demande. Le résumé du voyage reste visible.
- Le statut d’enregistrement/synchronisation reste toujours visible. Les explications de connexion sont repliables ; attente, conflit, erreur ou absence de connexion les ouvrent. Les droits lecteur, changements d’accès et alertes de récupération gardent leurs messages visibles.
- L’aperçu d’import montre les anomalies, titres, journées et activités en premier. Les enrichissements se trouvent dans « Détails de l’activité ». Un lien de correction et la validation native ouvrent les panneaux qui contiennent la cible. La source, la provenance et la confirmation restent accessibles. Aucun champ n’est supprimé du brouillon.
- Une ligne compacte suspecte déclenche une relecture ; elle n’est pas transformée automatiquement en plusieurs activités. La décision utilise le mécanisme existant `reviewedQuotes`, sans nouveau format de stockage.
- Sur mobile, la mascotte au repos mesure 64 px et dispose d’une place réservée dans l’en-tête. Après déplacement volontaire, elle reste dans la zone utilisable ; sa position personnelle est conservée. Les panneaux de dialogue masquent la mascotte. Hors mobile, la taille historique de 96 px est conservée.
- `touch-action:none` concerne uniquement le bouton de déplacement de la mascotte. Les autres boutons gardent la règle générale et le reste de la page conserve son défilement. Annulation, capture, clavier et mouvement réduit restent actifs.
- `Modal.tsx` est commun à l’accueil et aux vues différées. Il ne doit pas importer `App`. Le carnet est chargé au premier accès, avec état « Chargement… ». Le service worker prépare aussi ses modules avant un départ hors ligne.

Les sauvegardes ne changent pas : visites/pays de Mon monde, carnet et paquet photos/légendes ont des périmètres différents. Le texte doit annoncer cette séparation avant le téléchargement. Aucun fichier n’est décrit comme contenant les photos quotidiennes s’il les exclut.
