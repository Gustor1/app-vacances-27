# Lot 04 — Enrichir les lieux avec Wikidata et Commons

Lire [les consignes communes](00-LIRE-AVANT-LES-LOTS.md). Budget : zéro service payant obligatoire. Lot 03 non indispensable.

## Résultat

Depuis une activité, « Compléter ce lieu » permet de rechercher une entité, choisir le bon établissement/monument puis accepter nom local, site officiel, position ou photo autorisée. Le carnet d'origine demeure la source principale.

## 1. Contrat fournisseur

Vérifier [Wikidata Data access](https://www.wikidata.org/wiki/Wikidata:Data_access), [Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en), [CORS](https://www.mediawiki.org/wiki/API:Cross-site_requests) et [limites](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits).

Choisir recherche d'entité puis lecture ciblée ; éviter SPARQL massif et appels à chaque rendu. Lecture publique sans clé quand permise. Utiliser identification du client adaptée au navigateur, concurrence bornée, timeout, Retry-After, cache raisonné et annulation.

Tester de vrais GET sur des lieux publics ; conserver séparément les fixtures déterministes. Aucune requête contenant notes privées, réservation ou tout le voyage.

## 2. Correspondance contrôlée

Requête contextualisée nom/ville/pays/langue. Présenter plusieurs candidats, une description et la localisation si connue. Ne pas sélectionner silencieusement le premier ni utiliser une confiance numérique inventée. Prévoir « Aucun de ces lieux ».

Conserver l'identifiant Q, provenance et date de consultation. Comparer avant/après champ par champ. L'utilisateur peut accepter une coordonnée sans remplacer son titre ; il peut retirer l'association. Un nom chinois ne devient pas une traduction inventée par l'app.

Valider nombres, latitude/longitude et URLs ; autoriser seulement des liens sûrs, pas du HTML arbitraire. Garder valeurs d'origine et corrections personnelles. Association manuelle et enrichissement ne doivent pas contourner le rôle lecteur.

Sortie : bon lieu confirmé, aucune modification silencieuse, doublons et homonymes gérés.

## 3. Photo et licence

Pour chaque image Commons, vérifier type MIME, dimensions et licence effectivement exploitable ; choisir une vignette adaptée, pas le fichier original énorme. Afficher auteur, licence, source et liens requis. Une image sans licence exploitable reste non proposée. Tout Commons n'est pas CC0.

Définir explicitement ce qui est téléchargé pour le hors-ligne et ce qui reste distant. L'éventuelle copie conserve les crédits et respecte les quotas de stockage. Ne pas prétendre qu'une URL distante constitue une image hors ligne. Les exports gardent la provenance et les droits associés ; conserver anciens formats lisibles.

## 4. Défaillances et tests

Cas : homonymes, résultat vide, image absente, licence non supportée, réponses malformées, 429, délai, annulation et changement rapide d'activité. Tester qu'une réponse tardive n'enrichit pas le mauvais carnet.

Vérifier quatre langues, clavier/mobile, export/restauration, droits lecteur/éditeur, anciens carnets et fonctionnement sans réseau. Le carnet s'ouvre même si Wikimedia est indisponible.

Frankfurter est déjà présent. Pas d'Amap API, Google Places, Nominatim par défaut, recherche de restaurants exhaustive ou calcul d'itinéraire dans ce lot. Aucune promesse d'horaires ou d'avis actualisés.

Gate commun ; rapport `docs/development/lot-04-lieux/RAPPORT.md` : endpoints, licences, cache, requêtes effectivement essayées et critères atteints.

