# Transition vers plusieurs carnets de voyage

Base : application À l’Est existante, commit `9858aaa`. Travail isolé dans la branche `codex/carnets-universels`. Le projet alternatif n’a pas été utilisé comme base. Aucun déploiement de production n’est effectué.

## Décisions

- Préserver React, TypeScript, Vite, Leaflet, les sept vues, les composants et les styles du carnet. Ajouter un accueil autour de cette expérience.
- Conserver le corps historique `StoredState.version = 1` et l’envelopper dans un fichier `version: 2, scope: "trip"`. Éviter une réécriture simultanée du planning et du stockage.
- Garder localStorage pour cette transition : le volume du carnet initial est raisonnable, et une clé par voyage suffit à isoler les écritures. Les documents joints sont limités à 500 Ko et les imports JSON à 5 Mo. Un échec de quota reste visible, exportable et récupérable ; aucun passage implicite vers une collection vide.
- Ne pas créer d’index mutable commun. L’accueil découvre les enveloppes par leur préfixe et signale séparément les entrées illisibles. Deux créations ne peuvent pas écraser un index partagé.
- Les préférences d’interface restent globales. La sélection est enregistrée dans le carnet et, pour un rechargement dans un onglet donné, dans sessionStorage avec l’identité du voyage.
- Tous les identifiants et références sont remappés lors d’une duplication ou d’un import. Les dates, montants, réservations et coches restent copiés explicitement.
- Un carnet vide ne contient aucun catalogue, phrase, transport source ou document Chine. L’exemple est ajouté à la demande. Seuls les carnets Chine d’origine suivent les mises à jour du catalogue ; les copies deviennent indépendantes.

## Format et lecteurs

```json
{
  "version": 2,
  "scope": "trip",
  "id": "trip-…",
  "state": {
    "version": 1,
    "journey": {
      "id": "trip-…",
      "title": "Mon voyage",
      "destinations": "",
      "description": "",
      "cover": "/travel-landscape.svg",
      "currency": "EUR",
      "timezone": "UTC",
      "source": "custom",
      "followsCatalog": false
    },
    "cities": [],
    "favorites": [],
    "done": [],
    "bookings": [],
    "notes": {},
    "departureDate": ""
  }
}
```

Une collection contient `version: 2`, `scope: "collection"` et `trips`, une liste d’enveloppes. Une version ou une portée inconnue est rejetée avant la première écriture. Chaque import ajoute des copies ; il ne remplace pas le carnet ouvert. En cas de quota au milieu d’une collection, le nombre déjà ajouté est signalé et le fichier source reste réimportable.

Le champ historique `chineseName` est conservé pour les anciens lecteurs. L’interface le présente comme « Nom local » : toute écriture est acceptée. Les nouvelles étapes choisissent Google Maps par défaut ; une étape peut utiliser Amap. Les liens utilisent des noms et adresses, sans envoyer de coordonnées WGS84 à Amap.

## Migration et secours

| Clé | Utilisation |
| --- | --- |
| `a-l-est-v1` | Source ancienne, conservée sans modification |
| `a-l-est-recovery-v1` | Ancienne récupération, conservée |
| `a-l-est-legacy-source-v1` | Copie brute avant migration |
| `a-l-est-legacy-recovery-v1` | Copie brute de l’ancienne récupération |
| `a-l-est-migration-v2` | Source utilisée, pour détecter un ancien onglet qui continue à écrire |
| `a-l-est-trip-v2:<id>` | Enveloppe validée d’un carnet |
| `a-l-est-recovery-v2:<id>` | Copie précédente de ce carnet |

Le carnet ancien obtient l’identité stable `china-legacy`. La migration valide la source, matérialise les bonus et les phrases du modèle, conserve les références et le catalogue de base, écrit puis relit l’enveloppe. Une nouvelle tentative retrouve cette identité. Si la source change après une tentative incomplète, sa copie antérieure est conservée et la divergence bloque la migration : récupérer les fichiers pour comparer les versions.

Les dépenses gardent leurs devises et valeurs. `budgetCny` devient `budget` avec `budgetCurrency: "CNY"`. `cnyPerEuro` devient `exchangeRates.EUR` : **1 EUR = taux × CNY**, sans inversion. Les horaires historiques gardent leurs valeurs locales et reçoivent `Asia/Shanghai` aux deux extrémités.

Une ancienne version qui écrit encore dans la clé v1 déclenche un avertissement. Ses nouvelles données sont téléchargeables pour un import supplémentaire ; elles ne sont pas fusionnées silencieusement avec la v2.

Chaque hook est monté avec l’identité immuable du voyage. Les écritures différées et le verrou Web Locks capturent sa clé, même si un import ouvre un autre carnet. Les modifications indépendantes sont fusionnées à trois voies. Les champs réellement modifiés dans un brouillon prévalent ; les champs restés inchangés conservent les modifications distantes. La fermeture de page effectue une sauvegarde synchrone de dernier recours ; garder un export avant une fermeture forcée ou un effacement du navigateur.

Un échec de sauvegarde garde l’état à l’écran et dans l’export. Une tentative suivante conserve les changements non enregistrés précédemment. Une récupération illisible peut être téléchargée mais ne peut pas être restaurée depuis le bouton normal.

## International et documents

Les devises sont identifiées par leur code. Le budget affiche les sommes par devise et un total partiel tant qu’un taux manque. Changer la référence conserve montants, devises d’origine et conversions déjà enregistrées. Une conversion manquante est signalée et peut être renseignée manuellement ou complétée avec un taux disponible par un éditeur autorisé ; les taux enregistrés restent figés.

Les transports stockent des heures locales, un fuseau de départ et un fuseau d’arrivée. La validation compare les instants en tenant compte de l’heure saisonnière. Une heure inexistante ou répétée est signalée, sans choix silencieux. Les journées calendaires restent des dates civiles sans décalage de fuseau ; depuis L2, la date sur la carte du voyage est aussi localisée dans la langue de l’interface. Aujourd’hui utilise le fuseau de chaque étape, ou celui du voyage à défaut.

Les documents texte et Markdown sont conservés dans le carnet et dans ses exports. Leur lecture ne transforme pas automatiquement le texte en activités. Les documents originaux et conseils Chine restent propres au modèle Chine. Les couvertures distantes nécessitent Internet ; les visuels intégrés et le fond mondial restent disponibles localement.

## Retour arrière

Le commit de référence permet de revenir au code historique. Télécharger « Sauvegarde avant migration » dans Mes voyages fournit le JSON v1 brut, lisible par l’ancienne version. L’ancienne copie de secours est également disponible. Les modifications effectuées ensuite ne sont pas réécrites dans les clés v1 : conserver les exports v2 pour les reprendre dans cette version, et ne pas supprimer les nouvelles clés lors d’un retour arrière.

Le stockage est attaché à une origine et à un profil navigateur. Un autre port local ou une autre URL Vercel n’a pas accès aux carnets de production. Exporter depuis l’ancien site, puis importer dans la prévisualisation ; le clonage du dépôt ne transfère aucune donnée personnelle.

## Vérification et limites de la transition initiale (6 octobre 2026)

Les commandes actuelles et leur périmètre sont dans le README et le rapport L3 ; les tableaux ci-dessous restent les résultats historiques de chaque livraison. Les profils Playwright sont isolés des données réelles de l’utilisateur. Les captures de référence et de livraison se trouvent dans `screenshots/`.

La publication sur le site existant, la synchronisation entre appareils, les comptes, l’IA générative et la reconnaissance automatique de PDF, Word ou scans sont hors périmètre. Aucun planning, taux, coordonnée ou conseil touristique d’une nouvelle destination n’est inventé.

Le test de production démarre un serveur isolé sur la version compilée, installe d’abord un service worker précédent, puis contrôle sa mise à jour, son cache et plusieurs carnets hors ligne. Les rues OpenStreetMap et les liens cartographiques demandent toujours une connexion.

### Résultats de livraison — 6 octobre 2026

| Contrôle | Résultat |
| --- | --- |
| Référence avant modifications | 27 tests de données réussis, compilation réussie, captures ordinateur et téléphone |
| `npm test` | 35 tests réussis, aucun échec |
| `npm run test:e2e` | 40 parcours réussis, aucun échec |
| `npm run build` | TypeScript, compilation Vite et génération du service worker réussis |
| `npm run test:production` | Réussi : 22 requêtes en cache, mise à jour du service worker, plusieurs carnets ouverts et édités hors ligne, documents Chine, préférences, cartes et aucun problème d’exécution |
| Mobile | Parcours à 320 et 390 px, français/anglais, clair/sombre, menu et clavier, sans débordement horizontal |
| Fidélité | Captures du carnet Chine avant/après conservées ; même couverture, sections, navigation, planning, notes, bonus et carte |

La passe navigateur a notamment vérifié les trois destinations, la reprise par carnet et onglet, les copies et exports indépendants, un brouillon ouvert pendant une modification distante, une écriture A différée après import et ouverture de B, un quota simulé suivi d’une reprise, un document personnel isolé, ainsi que le changement de devise sans altération des valeurs.

Le contrôle de production a également révélé la génération de séparateurs Windows dans la liste de ressources du service worker. La génération les normalise maintenant en chemins URL ; la nouvelle version a été reconstruite et contrôlée hors ligne.

Non exécutés : déploiement de production, migration dans le profil réel du propriétaire et transfert de ses données depuis le domaine Vercel. Les tests utilisent exclusivement des profils isolés et des données de test. La prévisualisation locale ne donne pas accès aux données du site existant.

### Détours et les quatre langues — 6 octobre 2026

À la demande du propriétaire, le site s’appelle désormais **Détours** : logo, titre d’onglet, nom PWA, impression et signature universelle « Le monde, au gré des envies. ». Les identifiants de stockage, les formats de sauvegarde et les identifiants de calendrier historiques restent compatibles.

Les préférences proposent français, anglais, chinois simplifié (`zh-CN`) et espagnol. Les deux nouveaux catalogues couvrent les vues, formulaires, notifications et erreurs ; les dates et l’impression utilisent la langue choisie. Les noms, descriptions et notes personnels ne sont pas réécrits. Les libellés natifs restent lisibles à 320 px, y compris l’option chinoise sélectionnée.

Validation finale : **37 tests unitaires et 44 parcours navigateur réussis**, compilation TypeScript/Vite et service worker réussis, contrôle de production hors ligne réussi avec **22 ressources en cache**. Les parcours chinois/espagnol vérifient les sept vues, les formulaires, les dates, le document imprimable et la conservation des notes après rechargement. Le contrôle de production vérifie aussi les quatre langues sans réseau et les carnets indépendants. La prévisualisation ouverte sur `http://localhost:4173/` a été actualisée et les quatre options y sont visibles. Aucun déploiement de production n’a été effectué.


## Suite du 6 octobre 2026 : comptes et souvenirs

Les clés historiques et enveloppes v1/v2 restent conservées. Les nouveaux champs de voyage (statut, pays, date de retour, coups de cœur) sont facultatifs pour la lecture des anciens fichiers. Aucune migration ne déduit des visites à partir du titre ou des coches d’activités.

Les souvenirs sont un document indépendant `detours-world-v1`, avec export/restauration dédiés. Les comptes disposent de capsules `detours-account-v1:<userId>:` ; le contenu et l’opération en attente sont écrits ensemble. Le rattachement copie explicitement les carnets et mappe leur identité vers le compte sans effacer l’original. Déconnexion et changement de compte isolent l’affichage ; ils ne purgent pas le travail en attente.

Supprimer un carnet conserve une source de récupération et ses visites. À distance, la suppression est un tombstone qui ne peut pas être recréé par un appareil ancien. Le secours est une exportation, puis une nouvelle copie. Un rollback du code n’interprète pas automatiquement les capsules de compte : exporter avant retour et garder ces clés.

Voir [configuration et reprise](../sync/CONFIGURATION.md) pour les migrations SQL, protections serveur, plafonds, tests à deux comptes et ouverture au public. À la rédaction initiale du 6 octobre, le projet Supabase manquait. Les validations distantes du 7 octobre sont consignées dans le guide de configuration ; les nouveaux lots L0–L3 restent locaux.
