# Relecture indépendante des conclusions

31 octobre 2026, SHA 6e319457ec9f20fe5720979640e950b7a4c0dccc. Auteur : agent données/imports, à la demande du coordinateur. Relecture source uniquement : aucune exécution produit, SQL, PoC ou validation dynamique de sécurité. Cette relecture ne satisfait pas le workflow complet du skill sécurité ; run-2 reste explicitement incomplete.

## Échecs de contrôle sensibles aux fins de ligne

La cause avancée par le coordinateur est cohérente avec les sources :

- tests/lot06-benchmark.test.mjs:56-58 compare des SHA-256 de fichiers bruts aux empreintes historiques.
- tests/nvidia-import.test.mjs:46 compare directement le hash du corpus brut. Le scénario CLI à :82 peut échouer indirectement : scripts/benchmark-nvidia-import.mjs:15-17 vérifie le hash du corpus avant les erreurs de clé/modèle attendues par le test.
- tests/palettes.test.mjs:30-31 compare le texte brut de public/palettes.css et palette-bootstrap.js aux chaînes générées.
- tests/planning-structured.test.mjs:69 compare les consignes téléchargées brutes à importKit(language), généré en mémoire ; :70 cherche des délimiteurs de blocs avec LF explicites.

Le réglage local core.autocrlf=true a été relu ; aucun .gitattributes n'existe à la racine. Un clone Windows peut convertir les fins de ligne sans différence sémantique du corpus ni du CSS. Cette explication source ne suffit pas seule à attribuer tous les échecs : les sorties et la comparaison avant/après de normalisation restent celles du coordinateur, à consulter dans VALIDATION.md. Aucun changement des tests, empreintes ou fichiers générés dans cette relecture. Il faut distinguer le contrôle d'intégrité documentaire trop sensible aux octets d'un défaut applicatif de voyage.

## Hypothèses sécurité historiques

Les traces anciennes ne peuvent pas être reprises avec leurs anciennes lignes sans vérifier les redéfinitions SQL. La définition actuelle de public.detours_save_trip est dans supabase/migrations/202610090001_day_preparation.sql:132-195. L'affirmation ancienne « définition non remplacée par les migrations suivantes » de run-1 est inexacte littéralement ; la dernière migration conserve toutefois les branches discutées ci-dessous.

| Hypothèse | Source actuelle et contre-contrôles | Certitude et critique |
|---|---|---|
| Résumés du compte A sous contexte B | CloudProvider.tsx:25 garde summaries sans scope attaché ; remember à :48 change session ; effet à :144+ recharge la liste ; JourneysApp.tsx:100 consomme cloud.summaries. signOut à :175+ efface explicitement ; OAuth page fraîche protège ancien hint ; requêtes async épinglées au stockage courant | Chemin source plausible mais frame réellement accessible à B non observée. Le batching React, les effets, la séquence SDK et le remount par scope doivent être observés sans pause artificielle. Aucune divulgation confirmée ni sévérité. |
| Dépense masquée déduite via ville | Dernier save_trip :175-178 merge les catégories puis vérifie expenses/cityId contre les villes entrantes ; merge_details dans 20261007140143_leave_trip_and_money.sql:150-162 conserve les champs non autorisés. Auth, appartenance, rôle, révisions et editors_enabled sont contrôlés | Différentiel erreur/succès à établir avec deux états autrement identiques et rôle éditeur sans budget. Préconditions importantes ; effet possible limité à existence d'une référence, pas aux montants/libellés/nombre. Aucun oracle confirmé. |
| Quota compte et concurrence entre voyages | Dernier save_trip :138 verrou p_trip, :151 count compte avant insertion, :187/:189 agrégats multi-voyages. Créations et révisions du même voyage sont sérialisées | Absence de verrou compte visible ne démontre pas un dépassement. Schedule PostgreSQL, isolation effective et contrôle supplémentaire extérieur inconnus. Aucun impact de disponibilité observé ; needs validation. |
| Suppression augmentant le contenu retenu | Dernier save_trip :163 propriétaire seul ; :168-169 met à jour contenu et deleted ; :181 historique ; :189 quota partagé sous not p_deleted ; quota personnel :187 reste actif | Exemption reste visible mais dépassement non démontré. Contraintes 1 Mo par ligne, rôle propriétaire, validation schéma et conservation historique bornée réduisent les conditions. Ne pas transformer en panne partagée démontrée. |

## Statut du volet sécurité

run-2/run-metadata.json indique incomplete avec motif os_sandbox_unavailable_and_full_independent_security_workflow_not_executed ; findings.json vaut []. Ces états sont cohérents avec cette relecture. Les hypothèses historiques restent des pistes à valider dans NEEDS-VALIDATION.md, sans promotion implicite dans le rapport général ni sévérité. Cette revue n'a exécuté aucun candidat faute de sandbox OS conforme et ne remplace ni les phases de chasse/revue complète, ni les vérificateurs indépendants prévus par le skill.
