# Audit global Détours — 31 octobre 2026

Référence : `6e319457ec9f20fe5720979640e950b7a4c0dccc`. Audit sans correction produit, suppression ni publication. Branche locale des rapports : `codex/audit-global-20261031`.

## Bilan

Le socle local est substantiel : carnets, imports avec aperçu, restauration avec reprise, assistant borné, compagnon et souvenirs séparés sont présents. La recette actuelle sur build compilé réussit un import fictif, sa correction, la création et le rechargement sans perdre l’activité modifiée. Les deux séries de lots sont distinguées dans [MATRICE-LOTS](MATRICE-LOTS.md) ; les benchmarks IA restent des expérimentations non intégrées, et L7 est explicitement reporté.

Le verdict reste **usage personnel ou entre proches avec sauvegardes et limites de bêta explicites**. Ce rapport n’autorise ni une ouverture publique ni une publication : les vrais comptes/OAuth, les droits installés, les appareils physiques et le workflow sécurité complet ne sont pas validés. Le gate rend 8 étapes réussies et 1 échouée (92/93 scénarios navigateur), après 332/332 unitaires. Les contrôles complémentaires rendent 22 étapes réussies, 3 échouées et 1 interrompue. Le gate, ses échecs et les contrôles complémentaires sont détaillés dans [VALIDATION](VALIDATION.md) ; ses réussites séparées ne constituent pas un nouveau gate vert.

## Priorités utiles

1. Rendre les contrôles reproductibles sur clone Windows et expliquer l’intermittence de démarrage Compagnon. Les tests de thèmes ciblent un input masqué sous SVG, alors que clics sur les labels et clavier fonctionnent. Le CRLF produit cinq échecs unitaires sans changement logique ; la première trace Compagnon montre des dépendances Vite attendues environ 26 secondes. Le smoke de restauration recharge aussi avant la fin de lecture du fichier : trois échecs originaux contre trois parcours complets réussis avec une attente de fin dans un diagnostic externe. Ne pas augmenter les délais pour masquer une cause inconnue.
2. Compléter les preuves d’accès/récupération : les contrôles source et PGlite n’établissent pas le comportement des comptes et appareils réels. Le volet sécurité est **incomplet**, avec ses hypothèses conservées sans sévérité.
3. Protéger la saisie non soumise : Échap abandonne les champs d’un éditeur, comportement reproduit et attendu par les tests actuels. Ce n’est pas une perte du carnet enregistré. La vue mobile accumule aussi compte, assistant, introduction et couverture avant la première activité : simplification à arbitrer, sans blocage démontré.
4. Réduire les ressources superflues : le build précache **1 002 221 octets** de géographie Asie sans consommateur identifié. Clarifier aussi le packaging de l’atelier `/mascotte/`, présent dans le manifeste public mais absent du build standard.
5. Trier les avis de dépendances, puis indexer les documents. Les 13 paquets signalés par npm ne sont pas 13 vulnérabilités démontrées du site. Les rapports historiques ne doivent pas être effacés pour rendre le dépôt visuellement propre.

Les fiches et niveaux de preuve sont dans [CONSTATS](CONSTATS.md). Les recommandations produit sont dans [DECISIONS-PRODUIT](DECISIONS-PRODUIT.md) ; les missions bornées dans [LOTS-CORRECTION](LOTS-CORRECTION.md). Aucun de ces lots n’a été lancé.

## Poids et nettoyage

Le build local exact contient 103 assets, **17 590 561 octets** listés ; JavaScript d’entrée 632 021 octets bruts, 191 135 octets gzip calculés localement. Ces chiffres ne mesurent ni le transfert réel ni la latence. Le précache, les imports différés et le démarrage initial sont séparés dans [ARCHITECTURE-MESURES](ARCHITECTURE-MESURES.md).

Les 1 614 fichiers suivis représentent 140 797 327 octets ; la documentation et ses preuves constituent l’essentiel du volume. Les 102 Markdown ne pèsent qu’environ 1,4 Mo. [NETTOYAGE-PROPOSE](NETTOYAGE-PROPOSE.md) précise les candidats, usages, gains et restauration. Les copies des sprites du prototype restent utilisées ; les retirer demande une décision sur l’atelier public. Aucune suppression exécutée.

## Données et frontières

[DONNEES-IMPORTS](DONNEES-IMPORTS.md) cartographie localStorage, caches de compte, brouillon, Mon monde et IndexedDB. Les photos/légendes quotidiennes nécessitent un paquet distinct ; l’exclusion existe déjà dans l’interface. Une sauvegarde historique dite complète ne doit pas être interprétée comme sauvegarde des médias récents. Les exports n’autorisent pas un rattachement serveur automatique.

Le [registre sécurité externe](C:/Users/eliot/security-audit-skill/app-vacances-27/run-2/REPORT.md) est explicitement `incomplete`. Le [skill security-audit](C:/Users/eliot/.codex/skills/security-audit/SKILL.md) impose : « If every control cannot be enforced, do not execute target code ». La plateforme ne fournit pas les contrôles OS exigés pour ses preuves dynamiques ; les validateurs du skill refusent également la lecture faute de protections no-follow/nonblocking. La relecture indépendante a rectifié les références SQL historiques. Aucun constat de sécurité confirmé n’est produit ; cela ne constitue pas un certificat d’absence de vulnérabilités.

## Couverture et limites par étape

| Étape du plan | Travail actuel | Limite conservée |
|---|---|---|
| 1 Référence/protection | Fetch, comparaison base, bundle vérifié, branche, copie exacte et environnements | Pas de copie de secrets ni sessions |
| 2 Lots | Matrice L0–L8 et 01–09, évolutions et rapports, code actuel | État publié non déduit d’un ancien rapport |
| 3 Contrôles | Gate et diagnostics ; résultats précis VALIDATION | Échecs et contrôles non atteints séparés |
| 4 Données/droits | Cartographie source, contrats, tests locaux disponibles | Droits déployés et comptes réels non vérifiés |
| 5 Sécurité | Inspection limitée, historique relu, registre et blocages écrits | Workflow complet et dynamique conformes non exécutés |
| 6 Import/assistant/lieux | Revue et corpus existants ; recette texte compilée actuelle | Pas de nouveaux appels modèles ni score de fidélité universel |
| 7 UX/PWA | Sept captures de parcours et quatre de diagnostic thème inspectées ; mobile390/bureau1440 et formulaire | Pas de matrice exhaustive langues × thèmes × écrans, ni iPhone physique |
| 8 Performance/architecture | Taille du build/précache et responsabilités mesurées | Pas de benchmark terrain, charge ou coût serveur |
| 9 Nettoyage | Inventaire et recherches d’usages, candidats précis | Aucune suppression ni réécriture Git |
| 10 Arbitrage | Décisions, lots bornés et relecture indépendante | Choix d’Eliot avant correction |

## Lire les preuves et reprendre

[ETAT-INITIAL](ETAT-INITIAL.md) fixe les références locale/publique et la récupération. [UX-PWA](UX-PWA.md) relie les captures au parcours. [REVUE-INDEPENDANTE](REVUE-INDEPENDANTE.md) apporte un regard critique sur les causes et hypothèses. [RECETTE-HUMAINE](RECETTE-HUMAINE.md) ne mélange pas appareils physiques et émulation. [REPRISE](REPRISE.md) indique les commandes et étapes restantes ou terminées.

Les preuves volumineuses sont hors dépôt : `C:/Users/eliot/detours-audit-20261031/`. Le manifeste public lu annonce `578e1b1`, le build de test local `6e31945` : les références restent distinctes. L’absence de corrections et de publication fait partie du résultat de cette mission.
