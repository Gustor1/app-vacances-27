# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-analysis.spec.ts >> SIMULATED provider: paste, analyze, correct, create and open an account-local notebook
- Location: tests\e2e\planning-analysis.spec.ts:26:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:5175/", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { SYNTHETIC_EXAMPLES } from '../../src/planning-import/fixtures';
  3   | 
  4   | const account = '00000000-0000-4000-8000-000000000071';
  5   | const authKey = 'sb-planning-fake-auth-token';
  6   | const draftKey = `detours-account-v1:${account}:detours-planning-draft-v1`;
  7   | const endpoint = '**/api/planning-extraction';
  8   | 
  9   | async function fakeAccount(page: Page) {
  10  |   await page.route('https://planning-fake.supabase.co/**', route => route.fulfill({ status: 200, json: [] }));
  11  |   await page.routeWebSocket('wss://planning-fake.supabase.co/**', socket => socket.close());
  12  |   await page.addInitScript(({ account, authKey }) => {
  13  |     const expires = Math.floor(Date.now() / 1000) + 3600;
  14  |     const encoded = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  15  |     const access_token = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: account, exp: expires, role: 'authenticated' })}.synthetic-signature`;
  16  |     localStorage.setItem(authKey, JSON.stringify({ access_token, refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expires,
  17  |       user: { id: account, aud: 'authenticated', role: 'authenticated', email: 'planning@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-12T00:00:00Z' } }));
  18  |   }, { account, authKey });
  19  | }
  20  | async function openImport(page: Page) {
> 21  |   await page.goto('/', { waitUntil: 'domcontentloaded' });
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  22  |   await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  23  |   return page.getByRole('dialog');
  24  | }
  25  | 
  26  | test('SIMULATED provider: paste, analyze, correct, create and open an account-local notebook', async ({ page }) => {
  27  |   await fakeAccount(page);
  28  |   let calls = 0;
  29  |   await page.route(endpoint, async route => {
  30  |     calls++;
  31  |     expect(route.request().postDataJSON()).toEqual({ source: SYNTHETIC_EXAMPLES[0].source });
  32  |     expect(route.request().headers().authorization).toMatch(/^Bearer /);
  33  |     await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft });
  34  |   });
  35  |   const dialog = await openImport(page);
  36  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  37  |   expect(calls).toBe(0);
  38  |   await expect(dialog.getByRole('button', { name: 'Analyser mon programme', exact: true })).toBeEnabled();
  39  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  40  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Paris');
  41  |   const extracted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  42  |   expect(extracted.draft.cities[0].days[0].items[0].coordinates).toEqual([48.8606, 2.3376]);
  43  |   expect(calls).toBe(1);
  44  |   await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Paris corrigé après analyse');
  45  |   await dialog.getByLabel('Lieu ou activité', { exact: true }).first().fill('Louvre corrigé');
  46  |   await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  47  |   await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  48  |   await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  49  |   await expect(dialog).not.toBeVisible();
  50  |   await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
  51  |   const records = await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).map(key => JSON.parse(localStorage.getItem(key)!)), account);
  52  |   expect(records).toHaveLength(1);
  53  |   expect(records[0]).toMatchObject({ localOnly: true, pending: false });
  54  |   const saved = JSON.parse(records[0].raw).state;
  55  |   expect(saved.cities[0].days[0].steps[0].title).toBe('Louvre corrigé');
  56  |   expect(saved.cities[0].days[0].steps[0].coordinates).toBeUndefined();
  57  |   await page.reload();
  58  |   await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
  59  | });
  60  | 
  61  | test('SIMULATED slow provider: cancellation and new source suppress late results even if transport ignores abort', async ({ page }) => {
  62  |   await fakeAccount(page);
  63  |   await page.addInitScript(() => {
  64  |     const original = window.fetch.bind(window);
  65  |     window.fetch = (input, init) => String(input).includes('/api/planning-extraction') ? original(input, { ...init, signal: undefined }) : original(input, init);
  66  |   });
  67  |   let releaseOld = () => {};
  68  |   const oldGate = new Promise<void>(resolve => { releaseOld = resolve; });
  69  |   let oldComplete = () => {};
  70  |   const delivered = new Promise<void>(resolve => { oldComplete = resolve; });
  71  |   let calls = 0;
  72  |   await page.route(endpoint, async route => {
  73  |     const index = calls++;
  74  |     if (index === 0) { await oldGate; await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft }); oldComplete(); }
  75  |     else await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[1].draft });
  76  |   });
  77  |   const dialog = await openImport(page);
  78  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  79  |   const firstRequest = page.waitForRequest(request => request.url().endsWith('/api/planning-extraction'));
  80  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click(); await firstRequest;
  81  |   await dialog.getByRole('button', { name: 'Annuler l’analyse', exact: true }).click();
  82  |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[1].source);
  83  |   expect(calls).toBe(1);
  84  |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  85  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  86  |   releaseOld(); await delivered;
  87  |   await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  88  |   const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  89  |   expect(session.source).toBe(SYNTHETIC_EXAMPLES[1].source); expect(session.draft.title).toBe('Shanghai → Pékin');
  90  |   expect(calls).toBe(2);
  91  | });
  92  | 
  93  | test('SIMULATED provider failures retain source through reload and never create a partial notebook', async ({ page }) => {
  94  |   await fakeAccount(page);
  95  |   let calls = 0;
  96  |   await page.route(endpoint, async route => {
  97  |     calls++; await route.fulfill({ status: calls === 1 ? 429 : 200, json: calls === 1 ? { error: 'quota' } : { version: 1, cities: [] } });
  98  |   });
  99  |   let dialog = await openImport(page);
  100 |   await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  101 |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  102 |   await expect(dialog.getByRole('alert')).toContainText('Limite d’analyse atteinte');
  103 |   await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  104 |   await page.reload();
  105 |   await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click(); dialog = page.getByRole('dialog');
  106 |   await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  107 |   await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  108 |   await expect(dialog.getByRole('alert')).toContainText('Réponse IA invalide');
  109 |   expect(await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).length, account)).toBe(0);
  110 | });
  111 | 
```