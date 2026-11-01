# Mascottes intégrées à Détours — 25 octobre 2026

## Résultat publié

Pico (hirondelle, par défaut), Mochi (axolotl) et Bivouac (sac à dos) sont intégrés à l’accueil et aux vrais carnets. L’ancienne illustration statique est retirée de l’interface ; les messages utiles de premier carnet, de relecture et de préparation hors ligne sont conservés sous forme de texte.

Site public : https://app-vacances-27-beta-eliottle.vercel.app/
Code publié : b1f243b6591a3923f26e6ba3edc42cae667af9b3, branche codex/mascottes-integrees.
Pull request : https://github.com/Gustor1/app-vacances-27/pull/6 (brouillon vers codex/carnets-universels).
Déploiement READY : dpl_GDbwpsdccHJuHsw4GmGDUwKpd6YT.
URL du déploiement : https://app-vacances-27-gertqg8xa-eliottle.vercel.app

## Utilisation

- Déplacer le personnage au doigt ou à la souris ; Maj + flèches au clavier. Position mémorisée et maintenue dans le viewport lors des redimensionnements et des changements de viewport mobile.
- Cliquer/toucher pour ouvrir les raccourcis. Un glissement ne déclenche pas le menu ; une annulation remet la position précédente.
- Dans un carnet : Voir Maintenant, Explorer les bonus, Préférences. Maintenant utilise la vue existante, les dates et les fuseaux du carnet ; aucune activité fictive n’est injectée. Sans journée datée correspondante, cette vue demande de choisir une journée.
- Sur l’accueil : Créer un voyage, Créer depuis un planning, Préférences.
- Préférences : choisir Pico/Mochi/Bivouac, animer ou garder une pose fixe, masquer/afficher. Le mouvement réduit du système arrête les animations. Les animations sont suspendues lorsque l’onglet ou le personnage n’est pas visible.
- Les accessoires reprennent l’accent de la palette courante. Le bouton reste transparent au survol ; sa zone cliquable suit le cadre de la pose avec une petite marge, sans le grand vide supérieur. Ce cadre n’est pas un masque pixel par pixel des espaces entre les membres.

Choix, animation, visibilité et position restent personnels sur cet appareil, dans l’espace local ou du compte ouvert ; aucune écriture de ces réglages dans les carnets ou leur synchronisation. Les réglages historiques de masquage sont respectés. Si l’écriture échoue, le choix reste utilisable en session et les préférences signalent l’erreur.

## Implémentation

FloatingMascot.tsx est monté sur l’accueil et dans App.tsx ; ses raccourcis appellent la navigation et les parcours existants. Le moteur canvas et les trois planches originales du prototype sont inclus dans src/mascots/ et dans le cache hors ligne du build. Le moteur charge la planche du personnage choisi ; les images des autres personnages restent disponibles dans le cache de la PWA. Aucun paquet npm ajouté.

Les anciens fichiers SVG restent conservés dans le dépôt pour l’historique, sans import dans le composant affiché. Le prototype /mascotte/ reste accessible comme atelier indépendant. Sa copie dans public/mascotte est un réglage installCommand propre au déploiement, comme lors de la publication précédente ; les mascottes de l’application sont, elles, intégrées au build normal et ne dépendent pas de cette copie.

## Vérifications réellement exécutées

- Types produit et tests/configurations, lint, build, intégrité et cache du service worker : réussis.
- Tests ciblés : 7 scénarios historiques mascotte et 2 nouveaux scénarios flottants réussis. Le premier nouveau scénario a aussi été exécuté dans une passe initiale de 8 tests réussis.
- Nouvelles preuves : trois personnages, hitbox supérieure traversable, glissement souris, menu non ouvert après glissement, raccourcis du vrai carnet, choix/masquage conservés après recharge, gestes tactiles synthétiques, annulation, position persistante et viewport 320 pixels.
- Mascotte compilée hors ligne : recharge sans réseau, canvas chargé, préférences, texte contextuel et validité de la préparation hors ligne réussis. Aucun appel réseau externe constaté par ce scénario.
- Gate complet verify:local : **33 contrôles réussis, 1 échec, aucune étape non exécutée**, sourceUnchanged=true. Rapport gate-validation.json ; journal gate.log. Les 330 tests unitaires passent ; les parcours assistant passent cette fois, sans modification de l’assistant dans ce travail. Cela ne clôture pas l’échec intermittent observé à la publication précédente.
- Échec final du gate : scripts/smoke-planning-import.mjs:204 appelle equivalentContent avec un carnet absent après un import puis une recharge. TypeError à la ligne 57 lors de la lecture de journey. Cause et caractère préexistant non établis ; aucun correctif conjectural. Cet échec est conservé pour l’audit des lots demandé ultérieurement.
- Le contrôle PWA/mobile compilé, ses 40 mises en page, ainsi que la mise à jour Chrome/WebKit ont passé avant cet échec final.
- Site public : ouverture sans connexion Vercel, menu de Pico visible, raccourci Maintenant fonctionnel dans Chine 2027, puis chargement de Bivouac et Mochi et retour à Pico. Aucune erreur console constatée pendant ces vérifications. public-pico.png conserve une capture réelle en ligne ; mobile.png provient du scénario mobile local.

Le tactile est simulé ; aucun test sur iPhone physique, OAuth réel ou synchronisation entre comptes réels. Les mascottes proposent des raccourcis et des animations ; elles ne conversent pas avec une IA et ne modifient pas automatiquement les carnets. L’audit général des autres lots reste distinct.

## Conservation et retour arrière

Sauvegarde externe : C:/Users/eliot/Documents/detours-mascottes-integration-recovery-20261025, manifeste de source et bundle Git. La branche part du code déjà publié de la démo, qui contient les lots récents ; la base partagée distante a été récupérée et reste ancêtre de la branche.

Les 65 preuves historiques régénérées par les tests ont été archivées dans ce dossier externe, puis restaurées depuis la révision 70306fc. La liste est dans preserved-evidence.json. Les nouvelles preuves et les journaux sont rangés ici.

L’alias bêta a été affecté au déploiement ci-dessus. Retour arrière possible en le réaffectant, sur autorisation, à dpl_DgZQ9gmstEUvDvwfVvRVuxwVdxeU (démo précédente avec mascotte statique). Aucune fusion main, modification de protection ou migration distante dans cette tâche. Le dist local reste celui du gate simulé : ne pas le publier ; Vercel a reconstruit depuis le commit poussé avec les variables existantes de la preview.
