# Banc d’essai : plannings propres et brouillons

Exécution du 16 octobre 2026. Version du produit : `c1dd8a686e5962a156bad1489e4e4d3f2c731d64`. **Reconnaissance inchangée pendant cet essai**. Les 36 sources sont fictives et nouvelles par rapport au corpus de régression précédent.

**18/36 plannings conformes à toutes les attentes. 75/114 activités retrouvées séparément ; 66/114 au bon emplacement ville/journée. 0 erreur(s) de parsing.**

Ces nombres décrivent ce jeu volontairement difficile, pas un taux de précision général. Les sources et attentes ont été écrites avant le premier passage. Aucun ajustement du parseur aux cas de ce banc n’a été réalisé.

## Conclusion et corrections à prioriser

La reconnaissance actuelle est bonne sur les conventions explicites testées, mais insuffisante pour promettre un import fiable de plannings écrits librement. Le précédent corpus de régression réussi ne démontrait pas cette robustesse.

1. Normaliser la présentation : émojis avant les titres (08), citations de courriel (15), séparateurs ASCII (12), noms de ville en minuscules (07).
2. Protéger la structure : répétition du même jour avec date laissée vide dans un tableau (23), jours de semaine (19), mois abrégés (20).
3. Écarter les faux éléments : numéros de page et mots coupés (17), estimation d’hôtel non choisi (33).
4. Traiter explicitement la compréhension difficile : messages compacts (10–14, 28), corrections de dernière minute (16) et alternatives conditionnelles (32). Un modèle éventuel devra être comparé sur ces mêmes attentes et sur un nouveau lot inédit ; sa supériorité n’est pas mesurée ici.

Aucune exception de parsing sur ces 36 sources ne signifie pas absence d’erreur : certains cas produisent un aperçu presque vide ou des activités mal affectées. Les notes conservées permettent de retrouver du texte, mais ne remplacent pas la reconnaissance.

## Résultats par famille

| Famille | Plannings conformes | Activités séparées | Bon rattachement |
| --- | ---: | ---: | ---: |
| Structuré | 6/6 | 20/20 | 20/20 |
| Brouillon | 0/6 | 5/23 | 2/23 |
| Récit et messages | 1/6 | 7/19 | 5/19 |
| Dates et horaires | 3/6 | 15/15 | 11/15 |
| Langues | 4/6 | 12/19 | 12/19 |
| Ambiguïtés | 4/6 | 16/18 | 16/18 |

## Les fichiers à essayer

Ouvrir **Créer depuis un planning**, choisir le fichier `.txt`, puis **Reconnaître mon programme**. Tous les fichiers sont UTF-8. Un document contenant du Markdown reste lisible depuis `.txt`. Le JSON détaillé conserve chaque attente, chaque brouillon réel et les écarts.

[Résultats détaillés JSON](results.json) · [Archive des 36 plannings](plannings-fictifs.zip)

| Cas | Famille | Format | Journées obtenues/attendues | Activités séparées/attendues | Bon rattachement | Conforme |
| --- | --- | --- | ---: | ---: | ---: | --- |
| [01](plannings/01.txt) | Structuré | Markdown classique avec heures | 2/2 | 3/3 | 3/3 | Oui |
| [02](plannings/02.txt) | Structuré | Circuit avec deux villes | 2/2 | 4/4 | 4/4 | Oui |
| [03](plannings/03.txt) | Structuré | Tableau complet | 2/2 | 3/3 | 3/3 | Oui |
| [04](plannings/04.txt) | Structuré | Périodes en sous-titres et notes | 1/1 | 2/2 | 2/2 | Oui |
| [05](plannings/05.txt) | Structuré | Liste à cocher et flèches | 2/2 | 5/5 | 5/5 | Oui |
| [06](plannings/06.txt) | Structuré | Texte Windows et caractères accentués | 2/2 | 3/3 | 3/3 | Oui |
| [07](plannings/07.txt) | Brouillon | Tout en minuscules | 2/2 | 3/3 | 0/3 | Non |
| [08](plannings/08.txt) | Brouillon | Émojis devant les titres | 0/2 | 0/3 | 0/3 | Non |
| [09](plannings/09.txt) | Brouillon | Fautes dans les marqueurs | 0/2 | 0/3 | 0/3 | Non |
| [10](plannings/10.txt) | Brouillon | Abréviations de messagerie | 2/2 | 0/5 | 0/5 | Non |
| [11](plannings/11.txt) | Brouillon | Aucun saut de ligne | 0/2 | 0/4 | 0/4 | Non |
| [12](plannings/12.txt) | Brouillon | Puces sans espaces et séparateurs ASCII | 2/2 | 2/5 | 2/5 | Non |
| [13](plannings/13.txt) | Récit et messages | Paragraphes racontés | 0/2 | 0/4 | 0/4 | Non |
| [14](plannings/14.txt) | Récit et messages | Discussion avec prénom et heure | 0/2 | 0/4 | 0/4 | Non |
| [15](plannings/15.txt) | Récit et messages | Courriel cité | 0/2 | 0/3 | 0/3 | Non |
| [16](plannings/16.txt) | Récit et messages | Départ puis correction explicite | 2/2 | 2/2 | 0/2 | Non |
| [17](plannings/17.txt) | Récit et messages | Texte après extraction PDF avec retours coupés | 2/2 | 2/3 | 2/3 | Non |
| [18](plannings/18.txt) | Récit et messages | Liste sans journées | 1/1 | 3/3 | 3/3 | Oui |
| [19](plannings/19.txt) | Dates et horaires | Jours de semaine sans date | 1/2 | 2/2 | 1/2 | Non |
| [20](plannings/20.txt) | Dates et horaires | Mois abrégés | 2/3 | 3/3 | 2/3 | Non |
| [21](plannings/21.txt) | Dates et horaires | Heures approximatives et fractions | 1/1 | 3/3 | 3/3 | Oui |
| [22](plannings/22.txt) | Dates et horaires | Date numérique volontairement ambiguë | 2/2 | 2/2 | 2/2 | Oui |
| [23](plannings/23.txt) | Dates et horaires | Tableau date uniquement sur première ligne | 3/2 | 3/3 | 1/3 | Non |
| [24](plannings/24.txt) | Dates et horaires | Liste non chronologique à conserver | 2/2 | 2/2 | 2/2 | Oui |
| [25](plannings/25.txt) | Langues | Anglais 12 heures et alternative | 2/2 | 3/3 | 3/3 | Oui |
| [26](plannings/26.txt) | Langues | Espagnol accentué | 2/2 | 3/3 | 3/3 | Oui |
| [27](plannings/27.txt) | Langues | Chinois avec ponctuation structurée | 2/2 | 3/3 | 3/3 | Oui |
| [28](plannings/28.txt) | Langues | Chinois compact de messagerie | 0/2 | 0/4 | 0/4 | Non |
| [29](plannings/29.txt) | Langues | Français et anglais mélangés | 2/2 | 3/3 | 3/3 | Oui |
| [30](plannings/30.txt) | Langues | Allemand hors langues ciblées | 0/2 | 0/3 | 0/3 | Non |
| [31](plannings/31.txt) | Ambiguïtés | Suggestions séparées et réservation négative | 1/1 | 4/4 | 4/4 | Oui |
| [32](plannings/32.txt) | Ambiguïtés | Choix alternatif dans une phrase | 1/1 | 1/3 | 1/3 | Non |
| [33](plannings/33.txt) | Ambiguïtés | Notes de budget qui ne sont pas des activités | 2/2 | 2/2 | 2/2 | Non |
| [34](plannings/34.txt) | Ambiguïtés | Même activité à des jours différents | 2/2 | 4/4 | 4/4 | Oui |
| [35](plannings/35.txt) | Ambiguïtés | Retour dans une ville déjà visitée | 3/3 | 3/3 | 3/3 | Oui |
| [36](plannings/36.txt) | Ambiguïtés | Lieu volontairement manquant | 2/2 | 2/2 | 2/2 | Oui |

## Comment lire le score

- Une activité doit être présente dans un titre propre. Un nom seulement conservé dans les notes ne compte pas comme activité reconnue.
- Deux activités fusionnées dans un seul titre ne comptent pas comme deux extractions réussies. Une répétition voulue sur deux jours exige deux éléments distincts.
- Le rattachement vérifie le bloc de ville, le jour et leur ordre. La conformité complète vérifie aussi les dates, les informations explicitement annotées et l’absence d’éléments supplémentaires.
- Une ville ou une année absente doit rester absente. Une approximation horaire ne doit pas devenir une heure exacte. Les notes sauvegardées ne prouvent pas que leur sens a été compris.
- Les cas narratifs, les corrections tardives et les alternatives conditionnelles mesurent un résultat souhaitable. Une demande explicite de clarification serait également sûre, mais le parseur actuel ne produit pas ce dialogue.

## Reproduire et limites

```powershell
node scripts/evaluate-planning-stress.mjs
node --test tests/planning-stress-evaluator.test.mjs tests/planning-parser.test.mjs tests/planning-files.test.mjs
```

La lecture utilise le vrai décodeur de fichiers puis le vrai parseur et son validateur. Les attentes ne proviennent pas de réponses IA simulées. Les cinq tests du score vérifient notamment que les fusions et les mauvais rattachements échouent ; les 58 tests ciblés du score, du parseur historique et des fichiers ont été exécutés avec succès lors de cet audit. Ces 58 tests ne signifient pas que les 36 plannings sont réussis.

Le produit, le serveur et les dépendances sont inchangés. Le gate applicatif complet du tour précédent n’a pas été relancé pour ce seul audit. Pas de nouvel essai navigateur, de modèle, d’OCR, de PDF/DOCX binaire ou de document personnel. Les cas sont courts : ils ne couvrent pas les performances de très longs voyages, tous les dialectes, ni tous les formats possibles.

## Écarts observés

### 07 — Tout en minuscules

[Source fictive](plannings/07.txt)

Structure attendue : `[["rouen",["",""]]]`. Structure obtenue : `[["",["",""]]]`.

- **gros horloge** : rattachée à (ville vide), bloc 1, journée 1.

- **jardin des plantes** : rattachée à (ville vide), bloc 1, journée 1.

- **musée des beaux arts** : rattachée à (ville vide), bloc 1, journée 2.

### 08 — Émojis devant les titres

[Source fictive](plannings/08.txt)

Structure attendue : `[["strasbourg",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Palais Rohan** : pas retrouvée comme activité séparée.

- **Parc de l’Orangerie** : pas retrouvée comme activité séparée.

- **Petite France** : pas retrouvée comme activité séparée.

### 09 — Fautes dans les marqueurs

[Source fictive](plannings/09.txt)

Bordeaux et les deux jours sont lisibles pour un humain malgré les fautes.

Structure attendue : `[["bordeaux",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Cité du Vin** : pas retrouvée comme activité séparée.

- **Jardin Public** : pas retrouvée comme activité séparée.

- **Musée Aquitaine** : pas retrouvée comme activité séparée.

### 10 — Abréviations de messagerie

[Source fictive](plannings/10.txt)

- **capitole** : pas retrouvée comme activité séparée.

- **jardin japonais** : pas retrouvée comme activité séparée.

- **canal du midi** : pas retrouvée comme activité séparée.

- **couvent des jacobins** : fusionnée dans « couvent des jacobins + musée saint raymond ».

- **musée saint raymond** : fusionnée dans « couvent des jacobins + musée saint raymond ».

Éléments supplémentaires ou fusionnés : « couvent des jacobins + musée saint raymond ».

### 11 — Aucun saut de ligne

[Source fictive](plannings/11.txt)

Structure attendue : `[["reims",["",""]]]`. Structure obtenue : `[["reims ; jour 1 : palais du tau ; basilique saint-remi ; jour 2 : parc de champagne ; musee des beaux-arts",[]]]`.

- **Palais du Tau** : pas retrouvée comme activité séparée.

- **Basilique Saint-Remi** : pas retrouvée comme activité séparée.

- **Parc de Champagne** : pas retrouvée comme activité séparée.

- **Musée des Beaux-Arts** : pas retrouvée comme activité séparée.

### 12 — Puces sans espaces et séparateurs ASCII

[Source fictive](plannings/12.txt)

- **Marché des Lices** : fusionnée dans « Marché des Lices -> Portes Mordelaises -> Musée de Bretagne ».

- **Portes Mordelaises** : fusionnée dans « Marché des Lices -> Portes Mordelaises -> Musée de Bretagne ».

- **Musée de Bretagne** : fusionnée dans « Marché des Lices -> Portes Mordelaises -> Musée de Bretagne ».

Éléments supplémentaires ou fusionnés : « Marché des Lices -> Portes Mordelaises -> Musée de Bretagne ».

### 13 — Paragraphes racontés

[Source fictive](plannings/13.txt)

Structure attendue : `[["marseille",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Mucem** : pas retrouvée comme activité séparée.

- **Palais Longchamp** : pas retrouvée comme activité séparée.

- **château d’If** : pas retrouvée comme activité séparée.

- **parc Borély** : pas retrouvée comme activité séparée.

### 14 — Discussion avec prénom et heure

[Source fictive](plannings/14.txt)

18:12 à 18:14 sont les heures des messages, pas les horaires des visites.

Structure attendue : `[["nice",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Musée Matisse** : pas retrouvée comme activité séparée.

- **promenade des Anglais** : pas retrouvée comme activité séparée.

- **Parc Phoenix** : pas retrouvée comme activité séparée.

- **colline du Château** : pas retrouvée comme activité séparée.

### 15 — Courriel cité

[Source fictive](plannings/15.txt)

Structure attendue : `[["angers",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Château d’Angers** : pas retrouvée comme activité séparée.

- **Jardin du Mail** : pas retrouvée comme activité séparée.

- **Galerie David d’Angers** : pas retrouvée comme activité séparée.

### 16 — Départ puis correction explicite

[Source fictive](plannings/16.txt)

Le résultat idéal applique la correction finale ou signale un conflit à résoudre. Un simple maintien des anciennes affectations échoue au score.

- **Musée d’Orsay** : rattachée à Paris, bloc 1, journée 2.

- **Louvre** : rattachée à Paris, bloc 1, journée 1.

### 17 — Texte après extraction PDF avec retours coupés

[Source fictive](plannings/17.txt)

Il s’agit du texte déjà extrait, pas de la lecture d’un PDF binaire.

- **Palais des Papes** : pas retrouvée comme activité séparée.

Éléments supplémentaires ou fusionnés : « Palais des », « Page 1 / 2 », « Page 2 / 2 ».

### 19 — Jours de semaine sans date

[Source fictive](plannings/19.txt)

Structure attendue : `[["amiens",["",""]]]`. Structure obtenue : `[["amiens",[""]]]`.

- **Hortillonnages** : rattachée à Amiens, bloc 1, journée 1.

Éléments supplémentaires ou fusionnés : « Mardi ».

### 20 — Mois abrégés

[Source fictive](plannings/20.txt)

Structure attendue : `[["colmar",["2027-06-12","2027-06-13","2027-07-14"]]]`. Structure obtenue : `[["colmar",["2027-06-12","2027-06-13"]]]`.

- **Parc du Champ de Mars** : rattachée à Colmar, bloc 1, journée 2.

Éléments supplémentaires ou fusionnés : « 14 juil. 2027 ».

### 23 — Tableau date uniquement sur première ligne

[Source fictive](plannings/23.txt)

Structure attendue : `[["grenoble",["2027-07-10","2027-07-11"]]]`. Structure obtenue : `[["grenoble",["2027-07-10","","2027-07-11"]]]`.

- **Parc Paul Mistral** : rattachée à Grenoble, bloc 1, journée 2.

- **Bastille** : rattachée à Grenoble, bloc 1, journée 3.

### 28 — Chinois compact de messagerie

[Source fictive](plannings/28.txt)

Structure attendue : `[["杭州",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **西湖** : pas retrouvée comme activité séparée.

- **灵隐寺** : pas retrouvée comme activité séparée.

- **中国茶叶博物馆** : pas retrouvée comme activité séparée.

- **河坊街** : pas retrouvée comme activité séparée.

### 30 — Allemand hors langues ciblées

[Source fictive](plannings/30.txt)

Cas exploratoire hors des quatre langues ciblées par l’application.

Structure attendue : `[["berlin",["",""]]]`. Structure obtenue : `[["",[]]]`.

- **Museumsinsel** : pas retrouvée comme activité séparée.

- **Tiergarten** : pas retrouvée comme activité séparée.

- **Schloss Charlottenburg** : pas retrouvée comme activité séparée.

### 32 — Choix alternatif dans une phrase

[Source fictive](plannings/32.txt)

Deux alternatives conditionnelles, pas deux activités certaines.

- **Musée des Beaux-Arts** : fusionnée dans « Si pluie : Musée des Beaux-Arts ; sinon : Parc Floral ».

- **Parc Floral** : fusionnée dans « Si pluie : Musée des Beaux-Arts ; sinon : Parc Floral ».

Éléments supplémentaires ou fusionnés : « Si pluie : Musée des Beaux-Arts ; sinon : Parc Floral ».

### 33 — Notes de budget qui ne sont pas des activités

[Source fictive](plannings/33.txt)

La ligne hôtel est une estimation sans hébergement choisi.

Éléments supplémentaires ou fusionnés : « Hôtel : environ 90 EUR, pas encore choisi ».
