# Préférences — installation, mascottes et palette noire

26 octobre 2026, vérification locale sous Windows/Chrome.

## Résultat

- Installation : le manifeste proposait `DÃ©tours â€” Mes voyages` et `DÃ©tours`. Les deux noms sont désormais `Détours`. Identité `/`, URL de lancement, périmètre et icônes conservés. La mise à jour du libellé d'une application déjà installée dépend du navigateur ; aucune installation sur appareil physique n'est certifiée ici.
- Mascottes : menu dépliant avec aperçu statique des véritables sprites Pico, Mochi et Bivouac, accordés à la palette. Sélection visible, usage tactile/clavier, Échap ferme le menu sans fermer les préférences, retour du focus au déclencheur. Aperçus disponibles lorsque la mascotte flottante est masquée. Préférences locales existantes réutilisées.
- Palette **Noir** supplémentaire en apparence sombre : fond `#000000`, surfaces `#111111`, champs `#1b1b1b`, sélection `#292929`, accent sable. Les palettes historiques et les choix clair/sombre indépendants restent disponibles. Le bootstrap avant React applique aussi le noir ; le mode automatique retrouve ce choix quand le système repasse en sombre. Traduction FR/EN/ZH/ES.

## Préservation

Le checkout était propre sur `codex/mascotte-limites-ecran`, révision `a79cc0b6a3a481e7939352d09a13885f60a2728e`. Snapshot externe avant modification : `C:/Users/eliot/Documents/detours-preferences-recovery-20261026`, 1 597 fichiers et bundle Git. Base commune récupérée avec `git fetch origin codex/carnets-universels`.

La branche `codex/preferences-installation-mascottes-noir` conserve la version courante et ses huit commits déjà présents au-dessus de la base commune. Aucun remplacement par la base plus ancienne. Le sujet touche les préférences et le manifeste, sans migration des carnets ni écriture serveur.

## Vérification

- `npm run typecheck` et `npm run lint` : réussis.
- `node --test tests/palettes.test.mjs` : 29/29, notamment contrastes texte/actions/contrôles et cohérence CSS/bootstrap générés.
- Tests mascotte existants : 4/4. Les sélecteurs ont été adaptés au menu illustré.
- `tests/e2e/preferences-refresh.spec.ts` : 3/3 après correction d'un libellé chinois erroné dans le nouveau test. Manifeste, pixels des trois aperçus, sélection clavier/Échap, choix conservé après rechargement avec mascotte masquée, absence de débordement à 320 px, noir réel, quatre langues et bascule automatique clair/sombre.
- `npm run verify:local` avec PGlite externe : **34/34 contrôles réussis**, aucune étape sautée, `sourceUnchanged=true`, 332 tests unitaires. Analyse simulée, palettes/logos, 11 tests mascottes, assistant 14/14, souvenirs, sauvegardes et hors-ligne passés. Mises à jour testées sous Chromium et WebKit (l'émulation hors ligne WebKit est exclue par le script existant). [Rapport machine](validation.json).

Captures inspectées : [menu mobile](mascottes-mobile.png), [palette noire](palette-noire.png).

## Livraison

Les 44 captures et fichiers de preuve historiques régénérés par les tests sont archivées dans la récupération externe et remises à leurs octets initiaux. La branche conserve ses dépendances locales déjà présentes ; pas de push ni de PR vers la base commune plus ancienne dans ce sujet.

Pas de déploiement, de changement d'alias Vercel, de migration distante ou de fusion. Le build du gate utilise une configuration simulée et doit être reconstruit avec la configuration cible avant toute publication.
