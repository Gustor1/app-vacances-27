# Publication des corrections Impeccable — 2 novembre 2026

La demande « push les modifications sur le site en ligne pour que j’essaie » autorise la publication de la version locale. Cible : la bêta habituelle `https://app-vacances-27-beta-eliottle.vercel.app/`, projet Vercel `app-vacances-27` (`prj_GdllwjlfvjDogyKdH2ABRJay350a`). Les autres adresses de production, GitHub et la base distante restent hors de cette livraison.

## Préparation

- Branche `codex/corrections-audit-impeccable`, révision de base `480c0f8257274d0ebfaa630e50933da90a16e5f6`, modifications locales conservées. Aucun commit ou push nécessaire à la publication directe du build.
- Déploiement précédent de la bêta confirmé via Vercel : `dpl_3seVkAsM4XT9qNdmwS7KqH5ecs9R`, `app-vacances-27-kzag1ux2r-eliottle.vercel.app`.
- Copie récupérable du code, patch et référence de retour arrière : `C:/Users/eliot/Documents/detours-release-20261102-impeccable-1793622720540/`. Aucun fichier `.env.local` ou compte personnel inclus dans l’archive de code.
- Les trois paramètres publics Vite de la configuration locale correspondent exactement aux paramètres preview du projet Vercel. Aucun paramètre distant n’a été modifié.
- Aucune modification de format, migration, droit, carnet ou donnée distante prévue. Le contrôle authentifié Google et la synchronisation d’un compte réel ne sont pas revendiqués.

## Contrôles avant livraison

La première invocation du gate (`%TEMP%/detours-verify-puA8gA/validation.json`) reste un **échec** : 91/93 scénarios navigateur réussis à la neuvième étape ; les étapes suivantes non exécutées par cette invocation. Deux constats supplémentaires :

1. À 320 px, réserver la largeur de la mascotte à tout l’en-tête réduisait trop le champ de recherche. La place est maintenant réservée à la première ligne du carnet, laissant toute la largeur à la recherche et aux actions sur la deuxième ligne. Le dock de l’accueil garde sa place réservée.
2. Le scénario d’import manuel doit ouvrir « Détails de l’activité » avant de renseigner la période. Le test suit maintenant cette interaction, sans forcer la visibilité ni modifier le comportement pour contourner l’échec.

Le gate a été relancé après cet ensemble cohérent, pour associer le candidat à la nouvelle empreinte de code et de tests. Son résultat final et les vérifications du déploiement sont consignés ci-dessous après livraison. Détecteur Impeccable du style corrigé : `[]`, code 0.

## Où retrouver les changements

| Dans l’application | À essayer |
|---|---|
| Accueil → Créer depuis un planning | Un programme compact avec plusieurs lieux dans un titre déclenche des passages à vérifier ; sa source reste disponible. |
| Aperçu d’import → Détails de l’activité | Les champs avancés s’ouvrent à la demande ; les compteurs ont leurs accords et la progression ne recouvre plus les champs. |
| Mon planning → Voir la couverture | La couverture illustrée reste accessible ; les introductions de travail occupent moins de place. |
| Mon carnet pratique / Mes outils sur place | Les actions Reprendre/Exporter restent dans l’écran sur tablette ; la recherche garde sa largeur sur petit mobile. |
| Planning et carte | Noms locaux plus contrastés et marqueurs nommés pour le clavier et les technologies d’assistance. |
| Mascotte sur mobile | Taille et position de repos adaptées, disparition dans les dialogues, déplacement tactile corrigé. Une position volontairement enregistrée est conservée. |
| Accueil → Sauvegarder et restaurer mes données ; Mon monde | Distinction explicite entre visites/pays et photos/légendes quotidiennes, qui conservent leur paquet séparé. |
| Démarrage de l’application | Le code du carnet est différé ; le cache prépare toujours les modules nécessaires hors ligne. |

Les limites du parseur compact restent celles du [bilan des corrections](../corrections-impeccable-2026-11-02/RAPPORT.md). Aucun découpage général du langage libre n’est promis.

## Retour arrière

Réassigner uniquement l’alias bêta au déploiement précédent indiqué ci-dessus. Ne pas rétrograder le schéma, effacer des données du navigateur ou restaurer une archive personnelle pour revenir au code précédent. Une mise à jour ou un retour arrière demande ensuite une nouvelle préparation hors ligne.


## Résultat livré

**Publication terminée sur [la bêta habituelle](https://app-vacances-27-beta-eliottle.vercel.app/).** Déploiement `dpl_nyPjrPj8ShMczGVCjggSKNAZt4qw`, état Vercel **READY**, URL de version `https://app-vacances-27-873i684rj-eliottle.vercel.app`. L’alias est confirmé sur ce déploiement et conserve son accès public antérieur. Le projet reste configuré Vite ; les trois adresses de production générales n’ont pas été réassignées.

Build candidat puis public : `5fc4f79d3281fa0171977082efae642f949882df47c16d3fd3f8f3949559d444`. Base Git `480c0f8` avec modifications locales, sans commit, push ni fusion. Le candidat a été construit par `prepare-l8-release.mjs` hors du dépôt, après validation de l’empreinte courante. Seuls le build compilé et sa configuration de service statique ont été envoyés via le connecteur Vercel. Aucun fichier d’environnement privé ou code de benchmark privé n’a été publié. Aucune migration ou modification de base distante.

### Validation locale et reprises

Les invocations initiales de `verify:local` **restent des échecs documentés** ; elles ne sont pas décrites comme une invocation verte. Les 35 étapes ont ensuite été couvertes par une continuation ciblée et consolidées dans [publication-validation.json](preuves/publication-validation.json) : 35 étapes réussies, aucune non exécutée, `sourceUnchanged=true` à la fin de chaque continuation.

Pour conserver les contrôles déjà acquis, chaque reprise compare l’inventaire et les SHA-256 des fichiers, ainsi que les identités des builds original et copié. Après le dernier changement produit (largeur de recherche à 320 px), le build de validation est resté exactement `728569b4b6759a479bc505563804655e5a666b5f4b0fecdb6a1dd198f6870758`. Les seules différences autorisées pendant les reprises suivantes sont les scripts de test précisés ci-dessous, lintés séparément ; les sources produit et leurs configurations sont identiques. Les empreintes avant changement et les rapports précédents sont joints dans les preuves.

- Partage : assertion immédiate pendant un redimensionnement. Une reproduction instrumentée mesure de nouveau 320 px après stabilisation et le parcours complet passe. Le smoke attend maintenant la stabilisation par `expect.poll` en conservant la même exigence d’absence de débordement ; aucun overflow persistant n’est masqué.
- Mise à jour : la simulation d’ancienne page modifiait uniquement l’URL du point d’entrée. L’import différé du carnet révélait alors deux instances du module principal ; les caches WebKit pouvaient aussi mélanger les graphes simulés. La fixture versionne désormais **tout le graphe JavaScript ancien**, y compris les requêtes tardives après la bascule. Les assertions de brouillon, carnets, mise à jour et absence d’erreur n’ont pas été supprimées. Chrome et WebKit passent. L’émulation hors ligne WebKit reste exclue par le smoke pour sa limitation Playwright documentée ; Chrome couvre ce rechargement.
- Import compilé : ouverture explicite des détails avant correction du texte ou de l’affectation, comme dans le vrai parcours. Le smoke vérifie ensuite le téléchargement de l’archive, sa restauration dans un autre profil, la carte, la reprise hors ligne et les trois largeurs.

Les 337 tests unitaires, les sélections navigateur du gate et tous ses smokes sont ainsi couverts. Les échecs initiaux et intermédiaires sont conservés dans les journaux et rapports des preuves, sans requalification. Ce bilan consolidé est une continuation vérifiée, pas une nouvelle exécution monolithique de toutes les étapes.

### Vérifications réellement servies

[Preview](preuves/preview-verification.json) puis [adresse publique](preuves/public-verification.json) : les **115 ressources du manifeste**, l’entrée HTML et le service worker correspondent exactement au candidat par taille et SHA-256. L’import compact Toulouse affiche deux passages à vérifier. Les écrans passent à 320/390/768/1440 px. Une note fictive reste disponible après rechargement hors ligne, sans erreur JavaScript observée.

Les essais utilisent des profils jetables sans compte réel, et bloquent les requêtes externes. Ils n’attestent pas Google OAuth, une synchronisation Supabase réelle, un appareil physique ou un lecteur d’écran. Les paramètres publics correspondent à ceux de la bêta mais aucun droit serveur n’a été modifié.

L’accès temporaire de vérification de la preview a été révoqué et son fichier privé supprimé. Les preuves locales régénérées par les suites sont archivées hors dépôt puis restaurées ([inventaire](preuves/generated-docs-restored.json)). Les modifications initiales de documentation sont préservées.

Si l’ancienne interface reste visible, fermer tous les onglets et fenêtres Détours puis rouvrir la bêta, sans effacer les données. Refaire ensuite la préparation hors ligne avant de partir.
