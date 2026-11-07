# Référence de l’audit — 31 octobre 2026

## Version et préservation

- SHA audité : `6e319457ec9f20fe5720979640e950b7a4c0dccc`.
- Branche initiale : `codex/plan-typographie`. Aucun changement suivi ; deux fichiers non suivis : `docs/development/PLAN-AUDIT-GLOBAL.md` et `PLAN-RECHERCHE-TYPOGRAPHIE.md`.
- Branche de rapport créée : `codex/audit-global-20261031`, au même SHA. `git fetch origin` exécuté ; `origin/codex/carnets-universels...HEAD` : 0 commit exclusivement distant, 12 exclusivement locaux. Aucune fusion nécessaire pour examiner les lots récents. La référence distante la plus récente inventoriée est également `origin/codex/installation-manifeste-cache` à `6e31945`.
- Sauvegarde externe : `C:/Users/eliot/detours-audit-20261031/source.bundle`, complète pour HEAD et vérifiée par `git bundle verify`. Les deux plans ont été copiés à côté. Cette sauvegarde ne copie pas les fichiers ignorés (dont configurations et sessions personnelles) ni les autres branches non ancêtres de HEAD ; le contenu historique suivi n’est pas un nouveau scan exhaustif de secrets.
- Copie de test : `C:/Users/eliot/detours-audit-20261031/checkout`, HEAD détaché au SHA audité, dépendances existantes accessibles par jonction `node_modules`. Aucun fichier `.env.local` personnel copié. Le bundle est indépendant de l’emprunt d’objets du clone partagé.
- Les conversions Git Windows ont produit CRLF dans le premier clone ; réextraction des 1 614 fichiers par `git archive --format=zip HEAD` et écriture des octets exacts dans cette copie seulement. Voir VALIDATION pour les essais invalidés par cette différence.

## Environnement et droits

Windows, PowerShell, Node `v24.15.0`, npm `11.16.0`. Dépendances déjà installées ; pas de `npm ci` supplémentaire ni modification de lockfile. PGlite externe présent : `C:/Users/eliot/Documents/detours-test-tools/node_modules/@electric-sql/pglite/dist`. Le port 5173 était libre avant le gate. Les navigateurs des contrôles utilisent la configuration du dépôt et des profils jetables.

Trois sous-audits indépendants de lecture : données/imports, UX/PWA, architecture/nettoyage. Le coordinateur seul lance les contrôles utilisant build et port 5173. Le preview de recette utilise 127.0.0.1:4179 dans la copie externe. Aucune donnée personnelle utilisée.

Le gate fonctionnel est explicitement autorisé par le plan avec backend factice. Il ne constitue pas une preuve dynamique de sécurité. Aucun bac à sable OS avec l’ensemble des contrôles exigés par le skill sécurité n’est établi ; le run sécurité reste incomplet et ses exécutions cibles sont bloquées. Les validateurs du skill refusent également leur entrée sous Windows faute de protections no-follow/nonblocking ; aucun contournement appliqué.

## Version publique distincte

Lecture publique de `https://app-vacances-27-beta-eliottle.vercel.app/build-info.json` pendant cette session : build `aa5567ba9eb95080adfaaa3b8ed7945194645c709e8815ea836c1c8bcb0fd6a7`, baseRevision `578e1b1e51b9e5b7a48b3e065eeeb661c8b0c16d`. Réponse conservée dans `published-build-info.json` externe. Ce commit précède HEAD d’un commit documentaire. Aucun contrôle du service worker installé chez les utilisateurs, OAuth ou base distante n’en découle. Aucune publication effectuée.

## Récupération

Le dépôt original et ses builds historiques ne sont pas utilisés pour les tests mutateurs. Pour reprendre, vérifier SHA/statut, consulter REPRISE et les journaux externes. Le bundle permet de recréer HEAD même si le dépôt source disparaît. Les seuls livrables durables ajoutés au dépôt sont les documents d’audit. Ne pas publier le `dist` factice du gate.
