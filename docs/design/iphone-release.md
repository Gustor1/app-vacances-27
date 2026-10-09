Correction iPhone publiée le 8 octobre 2026

- En-tête continu : viewport-fit=cover, espacements des zones de sécurité, suppression des bordures et reflets de contour du haut, couleur de Safari alignée dès le premier affichage.
- Bulle tactile : mesure de la boîte de disposition indépendante du rétrécissement pendant le tap.
- Mise à jour : vérification au retour sur la page, à la reconnexion et toutes les cinq minutes ; bouton explicite sans rechargement des saisies en cours.
- Cache : HTML revalidé sur le réseau avec secours hors ligne ; worker et manifeste revalidés. Aucun stockage de carnet supprimé.

Validation : build TypeScript/Vite ; 67 tests unitaires ; 16 scénarios UI par moteur (Chromium/WebKit), dont les 12 concernés par la dernière modification rejoués avec succès ; test de nouvelle version au retour sur la page dans les deux moteurs ; parcours de production hors ligne Chromium. L'émulation de navigation hors ligne WebKit est exclue pour le défaut Playwright #42775 : https://github.com/microsoft/playwright/issues/42775. Aucun iPhone physique disponible pour confirmer la barre système réelle.

Bêta : https://app-vacances-27-beta-eliottle.vercel.app/
Déploiement : dpl_28fA59y4NfEKr6FwTuu5JZVwt3D8 ; 18 fichiers vérifiés par SHA-1 et alias public confirmé.
Retour arrière en ligne : réassigner l'alias bêta au déploiement dpl_3Vp7ocGasajpahFrGJ5xXkzpkxhP.
Sauvegarde source : C:\Users\eliot\Documents\app-vacances-27-backups\2026-10-08-iphone-update