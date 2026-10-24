# Lot 09 — Souvenirs légers et carnet exportable

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Extension secondaire après les priorités précédentes. Ce lot n'est pas un réseau social ni un nouveau service de stockage payant.

## Résultat

Associer à une journée une photo personnelle et une courte note, puis créer un souvenir imprimable/exportable choisi par l'utilisateur. Carnet toujours utilisable sans photo.

## 1. Contrat de données avant UI

Auditer les limites de stockage/sauvegarde actuelles. Les images ne doivent pas remplir localStorage sous forme de grosses chaînes base64. Préparer des miniatures bornées et un stockage de blobs adapté, avec IDs, validation et gestion du quota ; réutiliser l'existant s'il répond au besoin.

Décider explicitement si les photos sont personnelles locales ou partagées. Version initiale recommandée : personnelles locales, aucune synchronisation ou publication silencieuse. Ne pas afficher une disponibilité sur un autre appareil qui n'existe pas.

Préserver les exports historiques. Si un paquet exportable doit contenir les médias, ajouter un format versionné distinct ou étendre de manière compatible avec tests ; ne pas rendre les anciennes sauvegardes illisibles. Définir tailles maximales et stratégie de restauration avant implémentation.

## 2. Ajouter et conserver

Un souvenir par journée au départ : photo et légende courte modifiables. Vérifier type réel et dimensions ; traiter orientation, erreur de décodage et image trop grande. Réencoder localement vers un format pris en charge pour limiter le poids et retirer les métadonnées sensibles, notamment GPS. Conserver l'original sur l'appareil utilisateur, sans l'altérer.

Proposer uniquement les formats réellement supportés ; HEIC n'est pas garanti sur tout navigateur. Expliquer un format non supporté plutôt que produire une image vide.

Écriture robuste : photo et référence ne doivent pas rester incohérentes après interruption. Stockage plein, photo supprimée/manquante, compte changé et quota insuffisant laissent le carnet récupérable. Définir nettoyage des blobs orphelins sans supprimer les images encore référencées.

## 3. Export choisi

Créer une vue souvenir imprimable, sans photo si absente, avec choix explicite des journées et contenus. Utiliser l'impression navigateur pour « Enregistrer en PDF » quand disponible ; ne pas promettre un fichier PDF automatique si aucun générateur n'est intégré.

Séparer cet export de présentation de la sauvegarde restaurable. Avant export, afficher ce qui sera inclus. Exclure par défaut références de réservation, dépenses, documents, notes privées et adresses sensibles ; consentement explicite pour tout ajout personnel. Pas de lien public ou envoi externe automatique.

## 4. Tests

Photos orientées, grandes dimensions, faux MIME, format absent, quota, interruption entre blob/référence, rechargement hors ligne, suppression, compte isolé et restauration dans un profil vierge. Vérifier anciens exports et compatibilité des carnets partagés.

Tester qu'une sauvegarde déclarée complète contient bien les souvenirs inclus dans son contrat, ou indique clairement leur exclusion et le paquet séparé nécessaire. Aucune promesse ambiguë de sauvegarde.

Rapport `docs/development/lot-09-souvenirs/RAPPORT.md`, exemples fictifs, budgets de stockage mesurés, formats, reprise et retour arrière. Gate commun ; appareil physique et impression PDF réelle distingués des simulations.

