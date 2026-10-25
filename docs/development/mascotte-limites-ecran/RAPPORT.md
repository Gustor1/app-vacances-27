# Mascotte et menu dans la zone visible — 25 octobre 2026

## Correctif

Le menu choisit au-dessus, en dessous, à droite ou à gauche selon l’espace disponible. Ses dimensions sont contraintes avant mesure et son rectangle est borné dans la zone visible. Sur un écran bas, le contenu défile dans la boîte.

Le déplacement tient compte du viewport visuel, des zones sûres, de la barre du haut, de la barre latérale et de la navigation mobile en bas. Un portail dans le body évite les contextes d’empilement des carnets ; la mascotte reste au-dessus de la navigation si un clavier ou un viewport exceptionnellement petit ne laisse pas la place de réserver celle-ci. Les fenêtres modales restent prioritaires. Le placement est recalculé avant affichage, lors des redimensionnements, défilements et changements de dimensions du menu ou des barres. Les anciennes positions enregistrées sont réinterprétées dans la zone autorisée.

## Preuve du problème

Reproduction dans le carnet Chine 2027 sur la bêta précédente : la mascotte et son menu avaient un bord supérieur à 11,996 px alors que le bas de l’en-tête était à 111,491 px. Capture avant.png. Le code précédent positionnait systématiquement le menu au-dessus et ne réservait pas les barres de navigation.

## Contrôles ciblés

Quatre scénarios Playwright réussis (focused.log) : interactions et préférences existantes, déplacement tactile synthétique/annulation, quatre coins sur accueil et carnet en 390×844 et 1440×900, menu inférieur près du haut, non-recouvrement par en-tête/sidebar/navigation basse vérifié par hit testing, viewport paysage 568×250 avec dernier bouton atteignable et recharge. Les deux scénarios de bords sont ajoutés au contrôle global des mascottes. Aucun iPhone physique testé.

## Publication

Code : 1366febb5c9ed2e6d121b28d7b2935f20d8c5fe6, branche codex/mascotte-limites-ecran.
PR brouillon : https://github.com/Gustor1/app-vacances-27/pull/7, base codex/carnets-universels ; la branche préserve les intégrations précédentes.
Cible : https://app-vacances-27-beta-eliottle.vercel.app/
Déploiement préparé : dpl_14fsgLoLycUgW129dpWKy1N9s9D4, https://app-vacances-27-3euse1h0j-eliottle.vercel.app.

Publication confirmée : déploiement READY et alias bêta affecté le 25 octobre 2026. Sur le site public, l’ancienne position haute se replace à 123,49 px, sous l’en-tête finissant à 111,49 px. Le menu commence à 227,49 px, en dessous du personnage ; il reste dans le viewport de 392,73 px de large en haut à gauche et à droite. Captures apres-haut-gauche.png et apres-haut-droit.png. Aucune erreur console constatée pendant ces essais. Le contrôle global a été interrompu par l’arrêt de session/quota pendant les palettes, après neuf contrôles terminés, dont types, lint, 330 tests unitaires, build, SQL et 93 parcours navigateur. Le journal gate-interrupted.log conserve cette première exécution. La reprise repart au contrôle 10 avec le même build 66a0649558f7047329ff97514a976921d2dd87dc7c4c9d6f0f0e327d94a0e4dd, dont l’identifiant a été comparé au journal avant reprise. Un lanceur externe reprend les étapes inchangées de verify-local.mjs à partir des palettes.

La reprise a validé 17 contrôles puis échoué sur tests/e2e/assistant.spec.ts:78 (revision arriving during pending lock is preserved and refreshed for a new preview). Ce même scénario avait déjà échoué lors de la publication de la démo avant l’intégration des mascottes ; il n’est pas corrigé dans cette tâche. Résultat cumulé : 26 contrôles réussis, 1 échec et 7 non exécutés par le gate. sourceUnchanged=true pour la reprise ; détails dans gate-resumed-validation.json et gate-resumed.log. Aucun succès global revendiqué.

Étapes non exécutées par le gate : assistant compilé hors ligne, mascotte navigateur, mascotte compilée hors ligne, lieux compilés hors ligne, PWA mobile compilée, mise à jour Chrome/WebKit, planning compilé/carte/hors ligne/restauration. Les quatre scénarios ciblés des mascottes ont été exécutés séparément avant le gate et réussissent (focused.log). La simulation tactile ne valide pas un iPhone réel. Les tests utilisent un backend simulé, sans preuve OAuth ou de synchronisation réelle.

## Récupération

Sauvegarde Git avant édition : C:/Users/eliot/Documents/detours-mascotte-limites-recovery-20261025/history.bundle ; base a42b2b75c45336f343f336bdea620c7079c5f803. Les carnets et leurs formats ne changent pas.
Ancien déploiement pour retour arrière autorisé : dpl_GDbwpsdccHJuHsw4GmGDUwKpd6YT. Aucun déploiement de dist local simulé : Vercel reconstruit le commit avec les variables preview existantes. Aucune migration distante ni fusion main. Le réglage installCommand de la démo /mascotte/ est conservé ; l’application utilise les assets intégrés à son build normal.

## Vérification ciblée finale

Le scénario mascotte compilée hors ligne a été exécuté séparément après l’arrêt du gate et réussit : préférence conservée, rechargement hors réseau, canvas chargé, texte contextuel et état de préparation hors ligne cohérent. Journal offline.log et preuve offline-validation.json.
