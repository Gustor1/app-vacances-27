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
- Contrôles ciblés : `npm test`, `npm run typecheck`, `npm run lint`.
- Avant une livraison de code : `npm run verify:local`, avec PGlite installé hors dépôt et `DETOURS_PGLITE_PATH` configuré (voir le guide). Le port 5173 doit être libre. Le gate valide un backend simulé et s'arrête au premier échec.
- Rapporter les contrôles réellement exécutés, les échecs et les étapes non exécutées. Ne pas affirmer qu'un contrôle local valide OAuth ou des appareils réels.
- Le gate remplace `dist/` par un build de test avec configuration factice : reconstruire avec la configuration de la cible pour publier.

## Publication

L'utilisateur accorde une autorisation permanente pour publier les changements demandés et validés sur la beta habituelle `https://app-vacances-27-beta-eliottle.vercel.app/`, y compris créer un aperçu Vercel et réassigner cet alias. Ne pas redemander de confirmation pour ces publications. Cette autorisation a été donnée le 11 octobre 2026 et reste valable jusqu'à révocation par l'utilisateur.

Cette autorisation ne couvre pas une fusion dans `main`, une publication en production, une migration ou une modification de la base distante : ces opérations nécessitent une autorisation spécifique. Suivre `docs/development/L8.md` pour chaque livraison, avec validation, sauvegarde, retour arrière et vérification de la version réellement servie. Le mode local fonctionne sans accès administrateur aux services distants.
