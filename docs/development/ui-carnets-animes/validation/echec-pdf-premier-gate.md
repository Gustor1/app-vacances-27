# Échec observé dans le premier gate local

Révision : `70327210c642c199f1b7452006b8647bccd09f51`.
Test : `tests/e2e/planning-documents.spec.ts:33`.
Assertion : ligne 37, première entrée de la boucle, `scan.pdf`.

```text
Error: scan.pdf
expect(locator).toContainText(expected) failed
Locator: getByRole('dialog').getByRole('alert')
Expected substring: "Aucun texte extractible"
Timeout: 5000ms
Error: element(s) not found
```

Le snapshot au moment de l’échec montrait « Lecture du fichier… » et le texte source « Texte précédent », avec la reconnaissance désactivée pendant la lecture. Aucun message d’erreur n’était encore affiché.

Le gate a terminé cette suite à 92 scénarios réussis et un échec, puis arrêté les 26 étapes suivantes. Son empreinte de sources est restée identique.

Rejeu isolé, mêmes paramètres factices (`CI=1`, `DETOURS_LOCAL_VERIFY=1`, collaboration activée, URL et clé Supabase de fixture) :

```text
npx playwright test tests/e2e/planning-documents.spec.ts --grep protected --reporter=list
1 passed (22.1s)
scénario : 18.1s
```

Le lecteur et le délai du test n’ont pas été modifiés. Ce rejeu ne valide pas les étapes non exécutées du gate et ne suffit pas à identifier la cause du délai observé dans la suite complète.
