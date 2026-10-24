# Publication des palettes — 19 octobre 2026

L’utilisateur a demandé « push ça en ligne ». La version locale validée est publiée sur la bêta Détours habituelle : **https://app-vacances-27-beta-eliottle.vercel.app/**.

- Projet/équipe vérifiés par le connecteur Vercel : `prj_GdllwjlfvjDogyKdH2ABRJay350a` / `team_lVeovobBaIvDqajTP8FZ3UvH`.
- Déploiement **READY**, créé en preview : `dpl_E6v9zr2TgMEdTLKh1NJq5NeMRCLG`, URL identifiable `https://app-vacances-27-6irkdg4sk-eliottle.vercel.app` (protection Vercel existante).
- Alias bêta réassigné après lecture authentifiée du manifeste et de l’entrée HTML de la preview. Protection du projet inchangée ; exception publique préexistante de l’alias conservée. L’alias `app-vacances-27.vercel.app` reste sur son déploiement précédent.
- Ancien déploiement de la bêta conservé : `dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS`, URL `app-vacances-27-k866hgari-eliottle.vercel.app`. Les 23 fichiers de son manifeste ont été téléchargés et vérifiés avant bascule, avec son service worker, dans `previous-dist/` du dossier externe de livraison.
- Aucun commit/push Git ou changement de base distante. Les fichiers locaux mixtes n’ont pas été réinitialisés. La publication transporte seulement les fichiers compilés et la configuration de desserte statique.

## Build et preuves

Le build factice du gate n’a pas été publié. `prepare-l8-release.mjs` a reconstruit avec les paramètres publics de la cible existante, en contrôlant l’empreinte source avant/après. Le candidat a été vérifié localement puis envoyé par l’API Vercel authentifiée. CLI non authentifiée ; aucun nouveau compte ni projet temporaire n’a été créé.

- Empreinte source : `9b35078d63686ad9d3cc8a80d11a008158e1362e285111d049c7a3182a0790c7` (identique au gate 24/24 ; recalculée après publication).
- Build réellement servi : `d5781145720af29541dd8bec34246df769733596383a5d88e737af769406fb0f`.
- Entrée HTML : `/assets/index-BwgUIzqR.js`.
- 33 fichiers servis vérifiés par taille/SHA-256 contre le manifeste, plus comparaison exacte du service worker.
- Parcours Chrome public à 390 px, profil synthétique isolé : douze palettes, nom chinois natif, choix sombre/violet mémorisé, nouveau logo sombre décodé, carnet inchangé après choix des couleurs, note éditée hors ligne et conservée après fermeture/réouverture/reconnexion, aucun débordement ni erreur d’exécution.
- Les requêtes aux services externes ont été bloquées dans ce parcours. Aucune preuve OAuth, écriture/synchronisation cloud réelle, iPhone physique ou installation OS n’est revendiquée.

[Résultat public](published-verification.json), [livraison](release.json), [archive précédente](previous-build-verification.json), [retour arrière](rollback.json), [capture](published-390.png).

Le premier essai de la recette publique a terminé le parcours mais signalé deux erreurs issues de l’injection du fixture dans les documents `about:blank` sans origine. L’injection a été limitée à l’origine bêta ; la recette complète a été rejouée avec zéro erreur. Aucun code produit ou assertion de conservation n’a été changé pour cela.

## Sauvegarde et retour arrière

Dossier externe : `C:/Users/eliot/Documents/detours-release-palettes-20261019`. Il contient le build nouveau, 256 fichiers source/config/tests/assets copiés (hors documents et secrets), leur manifeste, l’ancien build, les contrôles et la recette publique. Les sauvegardes antérieures restent conservées.

Pour annuler ce frontend, réassigner uniquement l’alias `app-vacances-27-beta-eliottle.vercel.app` au déploiement `dpl_Pa7FKYDyjEwsAtMaYxKRvnZe76NS` avec la même équipe. Ne pas supprimer les carnets, le stockage navigateur, les anciens déploiements ni les migrations additives. Un retour de code ne restaure pas les données ; refaire un contrôle de préparation hors ligne après changement de version.

La personnalisation peut être testée via **Préférences → Couleurs → Plus de palettes**. Les sessions installées/onglets déjà ouverts peuvent proposer une mise à jour de l’application. Ne pas effacer le stockage pour actualiser l’interface.
