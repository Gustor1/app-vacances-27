# Participation, rôles individuels et budget

Version publiée le 7 octobre 2026 sur [la bêta stable](https://app-vacances-27-beta-eliottle.vercel.app/). La migration Supabase `leave_trip_and_money` a été appliquée avant le frontend. Le déploiement Vercel Preview est `dpl_AJpBhe6qBTTc8WbJMLkgGBbNwRc8` ; l’exception d’accès public reste limitée au domaine stable.

## Participation et autorisations

- Le lecteur et l’éditeur peuvent quitter le voyage depuis son bandeau de collaboration, après confirmation. Une connexion authentifiée et Internet sont nécessaires pour révoquer réellement l’accès.
- `detours_leave_trip` utilise `auth.uid()` et ne prend aucun identifiant de participant fourni par le client. Il supprime seulement la participation de l’appelant et invalide ses invitations acceptées. Une répétition après une réponse réseau perdue est sans effet supplémentaire.
- Le créateur ne peut pas quitter son propre voyage. La gestion des membres reste réservée au créateur ; il ne peut pas attribuer à sa propre identité un rôle de participant.
- Le serveur sérialise sortie, sauvegarde, changement de rôle et acceptation d’invitation avec le verrou du voyage. Les contrôles d’autorisation lisent les participations actuelles, sans dépendre d’un rôle périmé dans le navigateur ou le JWT.
- Un lecteur ne peut enregistrer ni le planning ni les détails communs. Un éditeur rétrogradé est refusé à sa prochaine écriture, même avec les révisions exactes d’un formulaire déjà ouvert. Le client rafraîchit les droits des voyages partagés et désactive les champs d’édition.
- Le cache est marqué révoqué, ses envois sont arrêtés et le voyage disparaît de la collection. Une réponse de sauvegarde ou de téléchargement démarrée avant le départ ne doit pas réactiver l’accès.
- Le départ conserve le contenu partagé, les notes, les dépenses, les documents et les versions existantes. Les copies locales/exportées restent des copies ; les modifications non synchronisées ne constituent pas des contributions partagées.
- Une nouvelle invitation réouvre la version autorisée du serveur. Un ancien lien accepté reste invalide, y compris après cette réinvitation.

## Montants et conversions

- Le convertisseur est connecté à Frankfurter, sans clé API, selon le choix confirmé : derniers taux gratuits disponibles, avec date affichée. Il accepte un montant, deux devises, l’inversion et l’actualisation manuelle. La source publie des taux quotidiens ; l’interface ne prétend pas afficher des cotations intrajournalières.
- Les requêtes sont groupées par devise source, dédupliquées et mises en cache public pendant 15 minutes. L’ouverture, le retour sur l’onglet, le retour du réseau et un intervalle de 15 minutes vérifient leur fraîcheur. Les taux publics sont conservés pour le mode hors ligne, avec leur date réelle ; une paire absente ne devient jamais implicitement un taux de 1.
- **Mon pays / Ma devise** définit la devise personnelle, distincte de celle du voyage. Le pays propose la devise, modifiable. Cette préférence est mémorisée sur cet appareil dans le cache du compte concerné, séparément de celle des autres comptes ; elle n’est pas synchronisée entre appareils. Les lecteurs peuvent utiliser le convertisseur et ces préférences sans modifier le carnet commun.
- **Dans ma devise** calcule un équivalent au taux actuel à partir des montants d’origine, y compris quand plusieurs devises figurent dans les dépenses. Ajouter ou supprimer une dépense, changer de devise personnelle ou actualiser les taux recalcule cet affichage et les équivalents par ligne. Si une paire manque, le total est annoncé comme une estimation partielle.
- Une nouvelle dépense utilise automatiquement le taux disponible vers la référence du voyage ; un taux manuel déjà choisi garde la priorité. Au retour du réseau, les conversions manquantes peuvent être complétées automatiquement par un éditeur autorisé. Les taux déjà enregistrés restent figés et le total comptabilisé du voyage reste indépendant de l’estimation personnelle au taux actuel.
- La référence appartient à `journey.currency`. Chaque nouvelle dépense garde son montant et sa devise d’origine. Le formulaire refuse les décimales supplémentaires que sa devise ne permet pas.
- `Expense.conversions[reference]` conserve `{ rate, date, source }`. Une table vide représente une conversion manquante ; elle est signalée comme manquante et peut être complétée automatiquement au retour d’un taux disponible par un éditeur autorisé. Une conversion déjà enregistrée n’est jamais recalculée.
- Les taux proposés pour les prochains enregistrements sont dans `rateQuotes`, à côté de `exchangeRates` conservé pour compatibilité. Mettre à jour ou supprimer cette proposition ne remplace aucun taux déjà appliqué.
- Enregistrer les réglages applique le taux choisi uniquement aux dépenses sans conversion vers la référence courante. Chaque dépense est arrondie selon les décimales ISO disponibles dans `Intl.NumberFormat`, puis les montants arrondis sont additionnés.
- Les dépenses historiques utilisant un taux global sont figées avant un changement de taux ou de référence. La source `legacy` et la date vide indiquent explicitement une date inconnue ; aucune date historique n’est inventée.
- Changer de référence conserve toutes les conversions précédentes. Les nouvelles conversions partent toujours du montant original, sans chaîne d’arrondis. Une conversion absente, invalide ou trop grande empêche de présenter le sous-total comme un total définitif.
- L’objectif de budget conserve sa devise originale et ses propres conversions dans `budgetConversions`. Après changement de référence, renseigner son taux permet de le comparer aux dépenses. Un champ de nouvel objectif laissé vide ne supprime pas l’ancien objectif en devise étrangère.
- Les nouveaux champs monétaires sont projetés, filtrés et validés côté serveur avec la catégorie Budget. Les imports, exports et copies les conservent.
- Le partage des frais, payeurs et remboursements est hors périmètre.

## Sources

- [Frankfurter v2](https://frankfurter.dev/) : requête publique d’une paire de devises, réponse contenant les codes, le taux et sa date réelle. Le bouton propose le dernier taux disponible, qui peut dater du dernier jour publié. Les erreurs réseau, délais dépassés ou réponses incohérentes ne produisent aucune conversion. Le convertisseur consulte automatiquement les paires nécessaires et les met en cache. Les nouvelles dépenses et conversions manquantes peuvent utiliser ces taux ; les conversions déjà enregistrées restent figées. Le réglage manuel garde sa priorité. Seuls les codes de devises sont transmis à ce fournisseur, jamais les dépenses ou noms du voyage.
- [Unicode CLDR 48, currencyData](https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/currencyData.json) : correspondances locales des pays et devises actives au 7 octobre 2026. Les pays possédant plusieurs devises légales sont exclus des suggestions. Un voyage à plusieurs pays demande un choix explicite même s’ils partagent une devise. La suggestion reste modifiable et fonctionne hors ligne.
- [Fonctions PostgreSQL Supabase](https://supabase.com/docs/guides/database/functions) : conservation du modèle RPC existant, `search_path` vide, accès public/anonyme révoqué et permissions authentifiées explicites. Les tables restent protégées par leurs politiques existantes.

## Validation

```powershell
npm test
npm run build
npx playwright test tests/e2e/multi-trip.spec.ts tests/e2e/audit-features.spec.ts tests/e2e/budget-currencies.spec.ts tests/e2e/beta.spec.ts
npx playwright test tests/e2e/live-converter.spec.ts
node scripts/test-collaboration-sql-local.mjs <PGlite/dist>
node scripts/test-participation-money-sql-local.mjs <PGlite/dist>
node scripts/smoke-sharing.mjs
node scripts/smoke-converter-live.mjs
npm run test:production
```

Les contrôles SQL utilisent PostgreSQL/PGlite et trois identités Auth de test, sous le rôle `authenticated`, dans une base en mémoire isolée. Ils contrôlent les vrais corps des fonctions SQL, pas une simulation des droits. Les anciens scénarios SQL restent couverts. Les parcours de partage navigateur utilisent trois profils jetables avec sessions et API simulées ; ils ne prouvent pas une nouvelle connexion Google, PostgREST distant ou un essai physique multi-appareils. La compilation et le contrôle de production vérifient aussi les carnets et les traductions hors ligne.

Le convertisseur a également été vérifié dans Chrome contre la vraie API publique, sans taux simulés : réponse CNY/EUR datée du 7 octobre 2026, affichage des dépenses en CNY et EUR, thème sombre et largeur mobile. Le test réel crée uniquement un carnet local dans un profil jetable, sans compte connecté. Captures : `docs/sync/screenshots/converter-live-desktop.png` et `converter-live-mobile.png`.

La migration additive est `supabase/migrations/20261007140143_leave_trip_and_money.sql`, enregistrée dans la base distante sous la version `20261007155244`. Les fichiers de migrations précédentes restent inchangés ; ne pas les rejouer sur la bêta existante. Les versions antérieures du frontend ne doivent pas être utilisées pour modifier les nouveaux budgets communs, car elles ne connaissent pas les champs de taux figés.

Après publication, Chrome a vérifié le build `index-DFBTbbbQ.js`, le convertisseur réel (1 CNY = 0,1328 EUR, taux du 7 octobre 2026), l’ajout d’une dépense et son équivalent personnel, en sombre et sur mobile, sans erreur JavaScript et sans compte connecté. Le contrôle utilise un carnet local jetable ; aucune donnée utilisateur n’est modifiée. Commande actuelle : définir `DETOURS_ALLOW_NETWORK=1`, `BETA_TEST_URL` et `DETOURS_EXPECTED_BUILD_ID` depuis le manifeste de la publication autorisée, puis `npm run test:network:rates`. Le contrôle historique de bundle ci-dessus reste une preuve du 7 octobre, pas une contrainte sur les builds suivants.

Dans la vraie base Supabase, les 27 contrôles historiques et le scénario de carnet commun ont été rejoués avec succès. Un contrôle supplémentaire vérifie départ en lecteur puis en éditeur, refus du départ du créateur, rétrogradation d’un formulaire ouvert, ancien lien refusé, nouvelle invitation acceptée et conservation des contributions et taux datés. Ces contrôles utilisent deux identités Auth existantes sous le rôle `authenticated`, dans des transactions intégralement annulées. Ils complètent les trois identités du test SQL local ; aucune nouvelle connexion Google ou vérification physique multi-appareils n’est revendiquée. Les avis Supabase signalent les RPC authentifiées `SECURITY DEFINER` voulues, les tables privées sans accès direct, et le réglage préexistant de protection des mots de passe. Les RPC contrôlées gardent un `search_path` vide et refusent l’exécution anonyme.
