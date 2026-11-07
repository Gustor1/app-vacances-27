# Travailler sur Détours

## Projet et repères

Application de carnets de voyage React 19 / TypeScript / Vite / Leaflet. Lire `README.md` et `docs/development/COLLABORATION.md` pour démarrer. Les documents L0–L8 et les plans contiennent des preuves datées et des pistes : vérifier le code avant de considérer une fonctionnalité comme livrée.

- Accueil : `src/components/JourneysApp.tsx` ; voyages/import/migration : `src/journeys.ts`.
- Persistance : `src/hooks/useTravelState.ts`, `src/persistence.ts` ; sauvegardes : `src/backup.ts`.
- Synchronisation : `src/cloud/` ; migrations serveur : `supabase/migrations/`.
- Traductions : `src/locales/` ; thème : `src/theme.css`, `src/apple-design.css`.

## Collaboration

- Avant une modification, vérifier `git status` et la branche ; préserver les changements déjà présents.
- La base partagée actuelle est `codex/carnets-universels`. Récupérer cette base puis créer une branche `codex/<sujet>` ou `claude/<sujet>` pour chaque contribution.
- Partager les changements par push et pull request vers cette base. Ne pas forcer un push, réécrire l'historique partagé ou remplacer le travail d'un autre contributeur.
- Les comptes, conversations, mémoires et outils locaux de chaque IA sont personnels ; consigner les décisions utiles dans le dépôt.

## Expérience et données

- Préserver les parcours, le mode local, les exports/restaurations, le fonctionnement hors ligne et les quatre langues.
- Pour les données : migration idempotente, conservation des sources anciennes et des copies récupérables, validation avant écriture et relecture après écriture, isolation des voyages/comptes. Tester l'interruption et la reprise lorsqu'un changement touche ce contrat.
- Pour Supabase : conserver les droits serveur/RLS. Ne pas contourner les permissions pour faire passer un test.
- `.env.local`, sessions, jetons, exports personnels, `dist/` et `.vercel/` restent hors Git. `.env.example` contient uniquement des exemples publics.

## Vérification

Node.js >= 22.18, npm ; installation par `npm ci`.

- Développement : `npm run dev`.
- Choisir les contrôles selon le risque et les fichiers réellement modifiés. Ne pas lancer une batterie complète à chaque tâche ou itération.
- Pour du CSS, de la mise en page ou des ajustements visuels sans changement de comportement : privilégier la revue des écrans touchés sur desktop/mobile, et le clavier si pertinent. Exécuter seulement les tests UI ciblés utiles ; ne pas lancer automatiquement les tests unitaires globaux, SQL, sauvegardes ou hors ligne.
- Pour de la logique frontend ou du TypeScript : tests ciblés du comportement modifié, puis `npm run typecheck` et `npm run lint` si pertinents. `npm test` reste disponible lorsque le périmètre le justifie.
- Après un contrôle réussi, ne le répéter que si une modification ultérieure invalide son résultat, ou si un échec ou un doute concret le nécessite. Regrouper les vérifications à la fin d'un ensemble cohérent de changements.
- Le gate complet `npm run verify:local` est réservé aux changements transversaux à risque (persistance, migrations, sauvegardes, synchronisation), à la préparation d'une publication ou à une demande explicite de l'utilisateur. Il n'est pas une condition automatique pour terminer une tâche UI, créer un commit ou préparer une pull request.
- Si le gate complet est nécessaire : PGlite installé hors dépôt et `DETOURS_PGLITE_PATH` configuré (voir le guide), port 5173 libre. Il valide un backend simulé et s'arrête au premier échec.
- Rapporter les contrôles réellement exécutés, les échecs et les étapes non exécutées. Ne pas affirmer qu'un contrôle local valide OAuth ou des appareils réels.
- Le gate remplace `dist/` par un build de test avec configuration factice : reconstruire avec la configuration de la cible pour publier.

## Publication

Un push GitHub n'est pas une autorisation de déployer, de fusionner dans `main`, de modifier la base distante ou de réassigner une adresse Vercel. Effectuer ces opérations uniquement dans le périmètre explicitement demandé par l'utilisateur. Suivre `docs/development/L8.md` pour une livraison, avec sauvegarde et retour arrière. Le mode local fonctionne sans accès administrateur aux services distants.
