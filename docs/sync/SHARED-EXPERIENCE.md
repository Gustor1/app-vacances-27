# Carnet commun et synchronisation visible

Le créateur et ses collaborateurs ouvrent le même App, avec la même navigation, le planning, la carte, les transports et les outils. Un lecteur consulte et exporte ; un éditeur modifie les catégories autorisées. Les droits sont appliqués par les contrôles React, le stockage local et les RPC du serveur.

Le partage complet utilise les informations du propriétaire comme contenu commun : notes, réservations, budget/dépenses, documents, préparation. Les souvenirs de « Mon monde », l’identité Google et la navigation de chaque onglet restent propres au compte. Une rubrique avancée permet au propriétaire de masquer les catégories à chaque membre. Un champ masqué n’est pas envoyé au navigateur et sa valeur canonique est préservée si un éditeur tente de l’écraser.

La transition est additive : un carnet déjà partagé garde les anciens champs privés tant que son propriétaire n’a pas activé le partage complet. Les nouvelles invitations présentent clairement le périmètre complet et la visibilité des emails entre membres. Aucune base ancienne n’est réinitialisée.

Le voyage affiche la synchronisation et un accès direct aux différences à comparer. Des changements distincts continuent à fusionner automatiquement. Une résolution garde les deux sources en copies de récupération, demande un choix pour chaque différence et permet de choisir une version pour l’ensemble. Le partage attend les envois déjà en cours, synchronise avant de créer un lien et explique le blocage si un conflit, une session expirée ou une panne persiste.

Objectif de cette bêta : plusieurs amis et appareils, reprise hors ligne, accès retirés et concurrence sans perte silencieuse. Les mises à jour utilisent le mécanisme existant de révisions ; ce fonctionnement n’inclut pas des curseurs en direct comme Google Docs.

Un carnet commun visible et connecté vérifie les changements toutes les cinq secondes, sa liste de membres toutes les quinze secondes. Les requêtes simultanées sont réunies ; une capsule ou un conflit inchangé ne relance pas une boucle d’envoi. Les autres carnets téléchargés restent vérifiés à la minute. L’application ne promet pas d’envois lorsqu’elle est fermée.

Les contrôles SQL locaux et distants utilisent des fixtures annulées, les contrôles UI deux profils simulés. Les essais physiques téléphone/ordinateur et une nouvelle session Google réelle sur cette version restent distincts de cette couverture.

Contrôle des conseillers Supabase : les fonctions SECURITY DEFINER accessibles au rôle authentifié sont intentionnelles et contrôlent la session et le rôle du carnet avant toute donnée ; leur signalement est documenté dans [le linter officiel](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Les tables du schéma privé ont RLS sans politique, pour refuser tout accès direct aux clients ; [l’information RLS sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) correspond à cette fermeture voulue. Le signalement de [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) appartient à la configuration existante : le parcours de cette bêta utilise Google et aucune configuration de mots de passe n’a été changée.
