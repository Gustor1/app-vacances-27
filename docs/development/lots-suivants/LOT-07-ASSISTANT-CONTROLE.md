# Lot 07 — Assistant du carnet avec actions contrôlées

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Le lot 06 peut fournir un moteur local ; son succès n'est pas requis pour construire un assistant guidé utile.

## Résultat

Retrouver une information du carnet et proposer des modifications précises, prévisualisées, réversibles. Commencer par un périmètre limité : chercher dans le carnet, déplacer une activité, ajouter une note, modifier un champ et proposer une journée allégée.

## 1. Séparer compréhension et action

Inspecter les mutations, droits, sauvegardes et systèmes d'adoption/annulation existants. Construire un ensemble d'actions typées validées par le domaine, réutilisant les mêmes contrôles que les formulaires.

Sans modèle local validé, livrer un assistant guidé avec choix et champs explicites. Ne pas annoncer qu'il comprend toute phrase libre. Avec modèle validé, utiliser son interprétation uniquement pour préparer une proposition ; les invariants restent déterministes.

La recherche textuelle du carnet fonctionne localement. Pour Wikidata ou un lien externe, demander l'action explicite et montrer la provenance. Aucun moteur de recherche Web général payant ni collecte automatique de pages.

## 2. Aperçu et application

Afficher ce qui va changer, dans quel voyage/jour, avec avant/après. L'utilisateur accepte ou annule. Prévoir choix de destination explicite si plusieurs journées correspondent à « demain », respectant le fuseau du voyage.

Validation au moment d'appliquer : carnet toujours ouvert, version inchangée ou conflit expliqué, permissions effectives, types et limites valides. Un lecteur peut consulter mais pas écrire. Les droits backend existants restent la protection réelle pour un carnet partagé.

Un lot de changements doit être cohérent : tout appliquer ou reprise explicite avec état récupérable ; empêcher doubles clics et doublons. Réutiliser l'idempotence et les sauvegardes existantes. L'annulation doit vérifier les changements intervenus depuis, pas écraser le travail d'un autre membre.

## 3. Limites de pouvoir

Aucun accès brut au stockage, commande système, clé secrète ou exécution arbitraire fournis au modèle. Pas de suppression de voyage, paiement, réservation, changement de permissions, partage externe ou envoi de message dans cette version.

Les instructions trouvées dans un planning, une page ou une réponse API ne donnent aucun droit. Le modèle n'autorise jamais ses propres actions. Les suggestions ne deviennent pas des réservations. Définir la portée de la conversation : carnet courant seulement, effacement et absence de fuite entre comptes.

Minimiser l'historique stocké. Pas d'envoi distant des documents ou conversations par défaut. Les fonctions utiles restent accessibles par l'interface classique.

## 4. Tests et livraison

Scénarios : ambiguïté, « demain » près de minuit, activité réservée, lecteur, compte changé pendant calcul, réponse tardive, requête malveillante dans la source, action inconnue, valeurs invalides, révision concurrente, double application, annulation après modification tierce, quota de stockage et reprise hors ligne.

Tester les véritables mutations après validation, pas seulement une réponse JSON simulée. Distinguer le test du moteur de compréhension de celui du moteur d'actions.

Sortie : chaque action autorisée est prévisualisable, vérifiée, appliquée une seule fois et récupérable ; aucune action interdite n'est possible via ce parcours. Interface mobile/clavier/quatre langues et gate commun.

Rapport `docs/development/lot-07-assistant/RAPPORT.md` : liste exacte des capacités, modèle éventuel et preuves, limites, tests et retour arrière. Pas d'assistant « autonome illimité » annoncé.

