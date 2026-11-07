# Publication de la typographie C — 31 octobre 2026

Autorisation utilisateur : « Publié le ». Cible conservée : https://app-vacances-27-beta-eliottle.vercel.app/.

Commit produit `757ceadd14846fbc5d70fb3b0b977b96da22b915`, poussé sur `codex/typographie-c`. Aucune fusion dans `main` ou dans la base partagée, aucune migration distante et aucune configuration de compte/données modifiée.

## Candidat et publication

Vercel a reconstruit le commit Git avec sa configuration preview existante, sans réutiliser le build local factice. Preview vérifiée puis affectation du seul alias bêta :

- Déploiement : `dpl_3seVkAsM4XT9qNdmwS7KqH5ecs9R`.
- URL immuable : https://app-vacances-27-kzag1ux2r-eliottle.vercel.app.
- Build : `1cb4f78b8ecf71edbb7c2decbafe7c6c6aa75512473bed1c7e97413206f58cbb`.
- 111 fichiers servis vérifiés par taille et SHA-256 contre le manifeste, sur la preview puis sur l’alias public ; aucune différence.
- Chrome Windows, profil jetable : accueil et carnet exemple, Newsreader et Hanken réellement chargées, titres de journée en Newsreader, zéro erreur d’exécution observée.
- Sur l’alias public : note fictive conservée après rechargement, worker contrôlant la page, rechargement hors ligne et chargement des deux polices réussis. Les quatre WOFF2 sont précachés.
- Accès temporaire à la preview utilisé pour le contrôle puis révoqué ; aucun secret conservé dans le dépôt.

L’activation normale du worker est conservée. Fermer les autres onglets/fenêtres Détours et rouvrir le site si l’ancienne présentation persiste ; ne pas supprimer les données du navigateur.

## Retour arrière

Ancien déploiement relu immédiatement avant la bascule : `dpl_5fTMbJniEiFEFB1X7c64iGcmioh3`, https://app-vacances-27-iww4c1xx1-eliottle.vercel.app. Pour revenir en arrière, réassigner uniquement l’alias bêta à cet identifiant. L’ancien déploiement est conservé.

Sauvegarde source avant publication : `C:/Users/eliot/Documents/detours-typographie-publication-20261031/source-before-publication.bundle`. Aucun export de carnet personnel n’a été collecté ; la typographie ne modifie ni le stockage ni les droits. Les essais utilisent seulement le carnet exemple et une note fictive.

## Vérification globale et limites

Gate relancé sur le commit produit avec PGlite externe : rapport `C:/Users/eliot/AppData/Local/Temp/detours-verify-TDUG0s/validation.json`. Types, lint, 332 tests unitaires, build, intégrité, SQL isolé et 161 tests navigateur réussis. Le gate s’arrête ensuite dans `smoke-production.mjs` sur un clic direct du radio English masqué, intercepté par son texte. Rapport global conservé comme échoué, avec étapes suivantes non exécutées.

Correction du script uniquement : clic sur le label visible puis assertion de sélection (sans clic forcé). Relance ciblée du smoke sur le même build compilé : réussite, cache de 114 requêtes, mise à jour du worker, quatre langues hors ligne, notes et plusieurs carnets préservés. Lint relancé. Cette correction de script n’affecte pas le produit déployé ; aucun nouveau déploiement du frontend n’est nécessaire. Le gate entier n’est pas relancé et sa réussite complète n’est pas revendiquée. La publication repose également sur les contrôles ciblés détaillés ci-dessus ; elle ne signifie pas qu’OAuth, des écritures cloud, l’iPhone physique ou l’impression papier ont été validés.
