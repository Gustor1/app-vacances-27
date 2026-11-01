# Lot 01 — Fiabiliser l'import des plannings Détours

Mission d'implémentation autonome — 18 octobre 2026.

## Résultat attendu

Un utilisateur colle son programme ou ouvre un fichier texte/Markdown, obtient un aperçu mieux structuré, retrouve clairement les passages à vérifier, corrige les erreurs et crée un nouveau carnet sans altérer ses carnets existants.

Implémenter et vérifier ce lot jusqu'au bout. Ce document constitue le périmètre accepté ; les choix techniques réversibles peuvent être faits sans redemander validation. Livrer une amélioration réelle et mesurée, pas seulement un audit ou des maquettes. Lire le code avant de tenir une fonctionnalité pour acquise.

## Périmètre

Inclus : reconnaissance locale gratuite, correction de l'aperçu, traçabilité vers la source, évaluation comparative et tests.

Conserver l'interface actuelle et ses composants. Améliorer les contrôles existants plutôt que créer un deuxième parcours d'import.

Hors de ce lot : modèle Hugging Face, API d'IA, Wikidata, nouvelles cartes, météo, chatbot, mascotte, lecture de PDF/DOCX binaires, OCR, refonte visuelle. Le texte déjà extrait d'un PDF ou d'un courriel entre dans le périmètre ; sa lecture binaire reste un lot ultérieur.

Le programme doit rester importable sans compte, sans clé et sans envoi de son contenu à un service externe. Préserver les quatre langues, les sauvegardes, les droits de partage et le fonctionnement hors ligne.

## 0. Préserver le travail et établir la référence

Lire `AGENTS.md`, `README.md`, `docs/development/COLLABORATION.md`, puis les instructions locales éventuelles. Vérifier branche, état Git et changements présents avant toute écriture.

À la rédaction, le dossier est sur `codex/audit-pwa-api`, avec des modifications non commitées de cartes, d'interface et d'aide PWA, ainsi que des corpus et documents non suivis. Ces fichiers ne sont pas des déchets à supprimer. Ne pas faire de reset, de nettoyage global, de stash forcé ou d'écrasement de branche.

Préparer une contribution `codex/import-fiable-lot-01` conformément au guide de collaboration. Partir d'un état qui contient la reconnaissance actuelle et le corpus difficile ; ne pas repartir silencieusement d'une base distante qui ne les contient pas. Utiliser si nécessaire un checkout isolé et une copie récupérable des seuls travaux nécessaires, avec provenance documentée. Une collision sur un fichier modifié par quelqu'un d'autre doit être résolue sans perdre ses changements.

Repères :
- `src/components/PlanningImport.tsx` : parcours et aperçu, à vérifier dans le checkout.
- `src/planning-import/parser.ts`, `normalizations.ts`, `booking.ts` : reconnaissance locale.
- `src/planning-import/draft.ts`, `types.ts`, `files.ts`, `persistence.ts` : validation, sources et reprise.
- `src/locales/planning-import.ts` : traductions.
- `tests/planning-parser.test.mjs`, `planning-files.test.mjs`, `planning-import.test.mjs`, `planning-extraction.test.mjs`.
- `tests/fixtures/planning/corpus.mjs`, `stress-corpus.mjs` et `scripts/evaluate-planning-stress.mjs`.
- `docs/development/IMPORT-RECOGNITION.md` et `planning-stress-2026-10-16/RAPPORT.md` : preuves historiques et limites.

Référence reproduite le 18 octobre : **18/36 plannings conformes ; 75/114 activités séparées ; 66/114 au bon rattachement ville/journée**. Ces résultats concernent un corpus fictif difficile, pas tous les utilisateurs.

Reproduire la référence avant modification. Attention : l'évaluateur actuel écrit dans le dossier historique du 16 octobre. Préserver ses résultats ; ajouter un paramètre de dossier de sortie ou appeler ses fonctions en lecture. Enregistrer les nouveaux résultats dans `docs/development/import-fiable-lot-01/` avec empreinte/version des sources et des attentes.

**Terminé lorsque :** état initial récupérable, périmètre des différences identifié, référence réellement exécutée et toute divergence expliquée.

## 1. Renforcer la reconnaissance sans inventer

Ajouter un test de comportement reproduisant chaque défaut avant sa correction. Priorités issues du corpus :

| Cas | Comportement attendu |
|---|---|
| 07 : villes en minuscules | Reconnaître les en-têtes grâce à leur contexte structurel, sans transformer tout mot inconnu en ville |
| 08 : émojis devant les titres | Ignorer les décorations pour la détection tout en conservant la source exacte |
| 12 : puces et séparateurs ASCII | Reconnaître les listes et séparer les activités explicitement délimitées, sans couper les noms composés |
| 15 : courriel cité | Comprendre les préfixes de citation et conserver les extraits originaux |
| 19 : jours de semaine | Créer des journées distinctes quand elles structurent le texte ; garder la date vide si elle est inconnue |
| 20 : mois abrégés | Normaliser les dates explicites non ambiguës ; ne pas fabriquer d'année |
| 23 : tableau avec cellules vides | Hériter d'un contexte de journée uniquement quand la structure le justifie ; éviter les fusions et doublons |
| 17 : texte issu d'un PDF | Écarter les numéros de page identifiables ; traiter les mots coupés prudemment, sans supprimer un numéro d'activité |
| 33 : hôtel estimé/non choisi | Garder une suggestion comme telle, sans réservation ni hébergement confirmé inventé |

Travailler sur une représentation normalisée liée à la source brute. Préserver des extraits exacts et, si nécessaire, leurs positions ; une normalisation interne ne doit pas falsifier les citations. Inspecter les validateurs existants pour garder un contrat cohérent.

Pour les récits compacts, fautes, contradictions, corrections tardives et alternatives conditionnelles : extraire ce qui est explicite ; signaler le reste. Le parseur n'est pas tenu de comprendre toute prose, mais l'interface ne doit pas présenter un résultat incomplet comme fiable.

Invariants :
- « matin » reste une période, pas une heure exacte ; une date ambiguë reste à préciser.
- Un prix estimé n'est pas une dépense ; une suggestion n'est pas une réservation.
- Aucune coordonnée, ville, disponibilité ou durée de trajet inventée.
- Deux activités peuvent porter le même nom : ne pas les dédupliquer sur le titre seul.
- Une négation ou une alternative ne devient pas une activité confirmée.
- Les instructions contenues dans un planning restent du texte, jamais des autorisations d'action.

**Terminé lorsque :** les neuf défauts sont corrigés lorsque les attentes sont déterminées par la source, chaque règle est couverte par un contre-exemple, et les 18 cas initialement conformes restent conformes. Si une attente du corpus exige une inférence non justifiée, conserver le cas historique, expliquer précisément le désaccord et exposer l'incertitude ; ne pas changer le score en silence.

## 2. Rendre l'aperçu honnête et facile à corriger

Ajouter à l'aperçu existant un bilan factuel : nombre de journées, activités proposées et passages restant à vérifier. Ne pas afficher un pourcentage de confiance sans mesure réelle. Ne pas prétendre connaître le nombre total d'activités de la source.

Définir précisément « passage à vérifier » : bloc source non traité, conflit, rattachement incomplet ou champ ambigu. Ne pas compter chaque ligne vide, titre ou note explicite comme un échec. Les passages écartés et les notes doivent rester accessibles sans polluer la liste des activités.

Depuis un avertissement, permettre de voir l'extrait source et la proposition concernée. Réutiliser le lecteur de source existant si possible. Les opérations utiles sont :
- corriger ville, journée, date, titre ou horaire ;
- déplacer une activité vers une autre journée ;
- transformer un passage non reconnu en activité ou le conserver comme note ;
- exclure explicitement une proposition ;
- résoudre un conflit sans effacer le texte original.

Ne réimplémenter que les opérations manquantes. Une création reste possible après les corrections requises, avec les avertissements restants explicitement visibles. La validation des données garde ses exigences actuelles.

Une nouvelle analyse ne doit pas écraser silencieusement les corrections manuelles. Réutiliser la confirmation et la reprise existantes. Vérifier aussi la source remplacée, l'annulation et les réponses tardives de l'éventuel ancien parcours distant, sans activer ce dernier.

**Terminé lorsque :** un planning presque vide après reconnaissance déclenche un bilan explicite ; chaque avertissement mène à un extrait utile ; une correction survit à un rechargement ; l'aperçu reste utilisable au clavier à 320 et 390 px dans les quatre langues.

## 3. Protéger les données et les performances

Conserver les limites actuelles des fichiers et textes (vérifier les valeurs dans le code). Tester un document proche de ces limites et une source malformée : pas de boucle excessive, troncature silencieuse ou blocage durable de l'interface. Mesurer les durées sur la machine de test et indiquer ses conditions ; aucun besoin d'ajouter un worker si les mesures ne le justifient pas.

Garder source et corrections dans le brouillon récupérable. Si un nouveau champ de suivi est nécessaire, rendre les anciens brouillons lisibles avec des valeurs par défaut ou une migration explicite et idempotente. Ne pas invalider les sessions existantes par un changement implicite de schéma.

Préserver : nouveau carnet à la confirmation, aucune écriture dans un carnet existant, validation avant écriture, relecture après écriture, reprise sans doublon, erreur de quota récupérable, isolation des comptes et protection contre un aperçu périmé dans un second onglet. La copie intégrale de la source dans le carnet demeure un choix explicite.

**Terminé lorsque :** ancien brouillon reprenable, nouveau carnet exportable/restaurable, source récupérable après échec et aucune régression de ces contrats.

## 4. Mesurer le gain sans arranger les tests

Conserver les corpus existants et les attentes historiques. Ajouter des variantes qui testent les règles, pas une liste de titres ou de villes codée spécialement pour le corpus.

Avant d'ajuster le parseur, préparer et figer un lot de validation inédit d'au moins 24 documents fictifs : français, anglais, espagnol, chinois ; listes, tableaux, courriels, brouillons ; inconnues et contradictions. Écrire les attentes à partir de la source avant d'observer les réponses du parseur. Garder ce lot hors des boucles de réglage jusqu'à l'évaluation finale. Si un cas sert ensuite à une correction, le déclarer comme régression et ajouter un autre cas inédit pour préserver la distinction.

Mesurer séparément avant/après :
- plannings entièrement conformes ; activités retrouvées séparément ; rattachement ville/journée ;
- omissions, éléments supplémentaires et champs inventés, contrôlés contre les attentes ;
- ambiguïtés correctement signalées, sans les compter comme extractions réussies ;
- temps de traitement et comportement sur sources longues.

Contrôler la métrique de couverture source : retrouver une chaîne dans une note ne doit pas compter comme une activité structurée. Ne pas confondre présence du bon mot et bon rattachement.

**Terminé lorsque :** les défauts ciblés sont couverts, aucune régression sur les cas historiquement corrects, un gain mesuré sur le corpus difficile et des résultats séparés sur le lot inédit sont publiés. Si le lot inédit révèle une régression de fidélité, corriger ou retirer la règle responsable ; ne pas masquer le résultat par un score global. Ne pas promettre un seuil arbitraire de compréhension générale.

## 5. Vérifier les parcours et livrer

Exécuter les tests unitaires ciblés, puis les parcours navigateur pertinents : `planning-local.spec.ts`, `planning-import.spec.ts` et les tests de simulation du fournisseur distant lorsqu'ils sont concernés. Les sorties du parseur doivent venir de son exécution réelle, pas d'une réponse préfabriquée qui reproduit l'attente.

Scénario de recette obligatoire : fichier brouillon → reconnaissance → passage incertain → correction du rattachement → rechargement → création → ouverture hors ligne → export → restauration dans un profil vierge. Vérifier que le carnet déjà présent reste inchangé.

Exécuter `npm run verify:local` avec `DETOURS_PGLITE_PATH` configuré conformément au guide. Le gate utilise une configuration et des services simulés ; son succès ne valide ni une IA distante ni un iPhone physique. Il remplace `dist` par un build de test, impropre à publier tel quel.

Rester dans le périmètre local autorisé ; suivre les règles du dépôt pour la contribution. Ne pas activer de service payant, déployer, fusionner dans main ou modifier une base distante au titre de cette mission.

Livrables :
1. Code et tests du lot, séparables des changements préexistants.
2. Rapport avant/après JSON et résumé lisible dans `docs/development/import-fiable-lot-01/`, avec corpus figés, commandes, conditions et limites.
3. Captures de l'aperçu corrigé sur mobile ; qualifier les tests physiques non exécutés.
4. Mise à jour concise de `IMPORT-RECOGNITION.md` pour les comportements réellement livrés, avec lien vers les nouvelles preuves. Conserver les résultats historiques comme historiques.
5. Message final : ce qui a changé, gain mesuré, limites restantes, contrôles passés/échoués, fichiers modifiés et méthode de retour arrière.

Retour arrière : revenir uniquement sur les changements de cette contribution, en conservant les sources et les brouillons utilisateur. Aucun reset global du dossier partagé.

## Skills à utiliser selon le besoin

Lire les versions réellement disponibles : `investigate-first` pour diagnostiquer une erreur ; `test-driven-development` pour les corrections du parseur ; `migration` si le format persistant change ; `web-design-guidelines` pour l'aperçu mobile. Utiliser les outils navigateur pour vérifier les parcours. Aucun nouveau plugin ni service n'est nécessaire à ce lot.

## Quand s'arrêter

Terminer après les critères ci-dessus et la validation. Une limite connue de compréhension de la prose libre se documente ; elle n'autorise pas à ajouter un modèle ou à ouvrir le lot suivant. Si une dépendance externe ou un fichier modifié simultanément bloque réellement une partie, terminer les parties indépendantes et décrire le blocage exact, sans annoncer le lot entièrement livré.
