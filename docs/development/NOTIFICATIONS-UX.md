# Préférences de notifications — refonte du 11 octobre 2026

Demande : simplifier l'interface mobile sans réécrire le système d'envoi ni perdre les réglages historiques. Copie récupérable avant modification : `C:/Users/eliot/Documents/detours-recovery-20261011-notifications-ux` (source et historique Git, fichiers ignorés exclus). Branche : `codex/notifications-ux`, issue de la version réunissant notifications et corrections mobiles.

## Analyse de départ

- Interface : `src/components/Recaps.tsx` ; formulaire initial dans un accordéon, mélangé aux récaps et à la météo.
- Modèle v1 : `src/notifications.ts`. Defaults historiques : suivi actif, 20:00, délai 30 minutes, catégories visite/transport, push activité/récap et email désactivés. Fuseau du voyage ; exceptions personnelles par activité.
- Persistance : `notification-storage.ts`, clé `detours-notifications-v1:<voyage>`, validation avant écriture et relecture. `CloudProvider.storage` isole les comptes et l'espace local.
- RPC existantes : capacités, lecture/écriture des préférences, snapshots de récaps, inscription et désactivation d'appareils. Les écritures serveur précèdent la copie locale ; aucune file de préférences hors ligne n'est annoncée.
- Push : `notification-push.ts`, service worker, worker Supabase et ordonnanceur. Le suivi (`followed`) suspend les envois ; les deux types de push et l'email restent distincts. La beta garde les emails désactivés.
- Récaps locaux : cache consultable hors ligne. Il n'existe pas de second ordonnanceur natif de rappels locaux à réécrire. La météo reste une demande explicite.
- Limites du contrat inchangées : 1 à 5 délais de 1 à 10 080 minutes, horaires quelconques valides, catégories et overrides existants.

## Interface retenue

Les préférences occupent un écran dédié dans le dialogue existant, avec retour aux récaps. Trois sections : programme du lendemain, rappels d'activités, moyens de réception. Suivi général en interrupteur ; heure simple 18/19/20/21 h ; délai rapide 15/30/60 min, ou indication Personnalisé. Fuseau lisible au premier niveau, identifiant exact dans les options avancées.

Les catégories, délais multiples/longs, saisie libre, heure personnalisée, fuseau et désactivation des appareils restent disponibles dans Options avancées. Les heures historiques hors des quatre choix ne sont pas remplacées. Un choix rapide remplace les délais uniquement après un clic explicite.

Les switches exposent leur état avec `role=switch` et `aria-checked`, restent utilisables au clavier et ont une cible de 52 × 44 px. Les choix rapides font au moins 44 px de haut. Les sections sont désactivées pendant le chargement, la sauvegarde ou une pause générale. Styles clair/sombre et mouvement réduit du projet, sans dépendance ajoutée.

## Compatibilité et sauvegarde

Le suivi général réutilise exclusivement `followed`. Le mettre sur OFF ne supprime pas les canaux, horaires, délais, catégories ni exceptions. Le transport des préférences reste au format v1 et les RPC ne changent pas.

La présentation a besoin de mémoriser l'intention des sections lorsque tous les canaux sont OFF. `notification-form.ts` conserve un petit état d'interface dans le même stockage personnel, sous `detours-notification-form-v1:<voyage>`. Il n'est jamais envoyé au serveur. Il n'est accepté que s'il correspond exactement à la préférence courante ; une préférence distante modifiée reprend donc autorité. Ce cache est supprimé avec le carnet ou une révocation. Un export/restauration conserve le modèle v1 effectif, sans rendre ce cache de présentation obligatoire.

Les combinaisons historiques de canaux restent exactes lorsqu'aucun interrupteur associé n'est modifié. Par exemple « push activités + récap email » ne devient pas « push activités + push récap + email » parce que les sections Programme et Téléphone semblent actives.

L'initialisation d'une nouvelle préférence propose les deux sections et les valeurs historiques 20:00/30 min/visite+transport. Le téléphone est préselectionné seulement pour un carnet synchronisé avec push disponible et permission déjà accordée, après confirmation de l'absence de préférence distante. Aucun accès système demandé automatiquement à l'ouverture : l'inscription conserve le geste Enregistrer. Les canaux des préférences existantes ne sont pas activés automatiquement.

Une permission refusée apparaît inactive, avec aide pour les réglages de l'appareil. Le parcours Safari sans support push explique l'ajout à l'écran d'accueil. Le backend indisponible ou l'email non vérifié n'est pas affiché comme un canal nouvellement activable. Les anciens canaux peuvent être désactivés volontairement.

La sauvegarde reste explicite. L'échec réseau ne remplace pas le cache ; l'échec de quota garde la source précédente. L'échec de chargement distant bloque l'enregistrement et propose Réessayer. Pas de promesse de sauvegarde serveur hors connexion : les réglages locaux restent utilisables, et les limites hors ligne sont conservées dans les options avancées.

## Vérifications

Tests ajoutés : aller-retour des huit combinaisons de canaux, conservation des délais/classes/overrides, intention locale isolée par carnet, invalidation par préférences distantes, pause, email indépendant, choix simples et avancés, erreur de quota, refus de permission, chargement/échec/reprise RPC simulés, clavier, thèmes et largeurs 320/390/1440.

Les tests historiques de récaps ont été adaptés au nouvel accès aux préférences. Le gate inclut les nouveaux parcours. Les tests n'écrivent pas sur Supabase réel et n'envoient pas de notification. La réception iPhone confirmée auparavant reste celle de la version publiée précédente ; cette refonte n'est pas une nouvelle preuve physique.

Les premiers essais ont révélé des labels de sélecteur incomplets, un double label d'heure et une combinaison historique susceptible d'activer le push récap : corrigés et couverts. La première gate complète a été interrompue pour appliquer le style du bouton principal après contrôle visuel ; seule la gate finale sur la source inchangée sert de validation de livraison.

Captures et script de contrôle visuel : `C:/Users/eliot/Documents/detours-notifications-ux-20261011`. Aucun alias beta, schéma, clé ou configuration serveur modifié pour cette refonte.

La relecture finale couvre aussi les sauvegardes repetees des anciens canaux mixtes et les carnets synchronises connus du cache lorsque la liste distante est indisponible. Un second gate preliminaire a ete interrompu pour cette correction de compatibilite ; le rapport final conserve une empreinte de source stable. Les desactivations explicites d appareils conservent leur portee : elles ne reinscrivent pas silencieusement le telephone ni ne modifient les canaux des autres appareils lors d une sauvegarde sans changement.

Controle supplementaire execute hors gate : isolation du cache de formulaire entre deux comptes, purge lors de la revocation et de la suppression locale du carnet, autre compte intact. Script et rapport dans C:/Users/eliot/Documents/detours-notifications-ux-20261011/storage-isolation.mjs et storage-isolation.json. Aucun service distant utilise.

## Validation finale

Le gate final HgZ9y6 a termine avec succes : 22 etapes, 140 tests unitaires, 4 tests Deno, 88 tests navigateur et 9 controles du build compile. Rapport : NOTIFICATIONS-UX-LOCAL-VALIDATION.json. Aucun controle du gate omis ; sources inchangees durant la validation. Rendu controle a 320, 390 et 1440 px, en clair et sombre. La nouvelle interface n'a pas ete testee sur un iPhone physique. Aucun deploiement ni changement de l'adresse beta n'a ete effectue pour cette refonte.

