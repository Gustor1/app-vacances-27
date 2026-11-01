import { test, expect, type Page } from '@playwright/test';
import { SYNTHETIC_EXAMPLES } from '../../src/planning-import/fixtures';

const account = '00000000-0000-4000-8000-000000000071';
const authKey = 'sb-planning-fake-auth-token';
const draftKey = `detours-account-v1:${account}:detours-planning-draft-v1`;
const endpoint = '**/api/planning-extraction';

async function fakeAccount(page: Page) {
  await page.route('https://planning-fake.supabase.co/**', route => route.fulfill({ status: 200, json: [] }));
  await page.routeWebSocket('wss://planning-fake.supabase.co/**', socket => socket.close());
  await page.addInitScript(({ account, authKey }) => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const encoded = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const access_token = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: account, exp: expires, role: 'authenticated' })}.synthetic-signature`;
    localStorage.setItem(authKey, JSON.stringify({ access_token, refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expires,
      user: { id: account, aud: 'authenticated', role: 'authenticated', email: 'planning@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-12T00:00:00Z' } }));
  }, { account, authKey });
}
async function openImport(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click();
  return page.getByRole('dialog');
}

test('SIMULATED provider: paste, analyze, correct, create and open an account-local notebook', async ({ page }) => {
  await fakeAccount(page);
  let calls = 0;
  await page.route(endpoint, async route => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ source: SYNTHETIC_EXAMPLES[0].source });
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft });
  });
  const dialog = await openImport(page);
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  expect(calls).toBe(0);
  await expect(dialog.getByRole('button', { name: 'Analyser mon programme', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Paris');
  const extracted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  expect(extracted.draft.cities[0].days[0].items[0].coordinates).toEqual([48.8606, 2.3376]);
  expect(calls).toBe(1);
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Paris corrigé après analyse');
  await dialog.getByLabel('Lieu ou activité', { exact: true }).first().fill('Louvre corrigé');
  await dialog.getByLabel('Devise de référence', { exact: true }).fill('EUR');
  await dialog.getByLabel('Fuseau du voyage', { exact: true }).fill('Europe/Paris');
  await dialog.getByRole('button', { name: 'Créer et ouvrir le carnet', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
  const records = await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).map(key => JSON.parse(localStorage.getItem(key)!)), account);
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ localOnly: true, pending: false });
  const saved = JSON.parse(records[0].raw).state;
  expect(saved.cities[0].days[0].steps[0].title).toBe('Louvre corrigé');
  expect(saved.cities[0].days[0].steps[0].coordinates).toBeUndefined();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Paris corrigé après analyse', exact: true })).toBeVisible();
});

test('SIMULATED slow provider: cancellation and new source suppress late results even if transport ignores abort', async ({ page }) => {
  await fakeAccount(page);
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes('/api/planning-extraction') ? original(input, { ...init, signal: undefined }) : original(input, init);
  });
  let releaseOld = () => {};
  const oldGate = new Promise<void>(resolve => { releaseOld = resolve; });
  let oldComplete = () => {};
  const delivered = new Promise<void>(resolve => { oldComplete = resolve; });
  let calls = 0;
  await page.route(endpoint, async route => {
    const index = calls++;
    if (index === 0) { await oldGate; await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[0].draft }); oldComplete(); }
    else await route.fulfill({ status: 200, json: SYNTHETIC_EXAMPLES[1].draft });
  });
  const dialog = await openImport(page);
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  const firstRequest = page.waitForRequest(request => request.url().endsWith('/api/planning-extraction'));
  await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click(); await firstRequest;
  await dialog.getByRole('button', { name: 'Annuler l’analyse', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[1].source);
  expect(calls).toBe(1);
  await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  releaseOld(); await delivered;
  await expect(dialog.getByLabel('Titre du voyage', { exact: true })).toHaveValue('Shanghai → Pékin');
  const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), draftKey);
  expect(session.source).toBe(SYNTHETIC_EXAMPLES[1].source); expect(session.draft.title).toBe('Shanghai → Pékin');
  expect(calls).toBe(2);
});

test('SIMULATED provider failures retain source through reload and never create a partial notebook', async ({ page }) => {
  await fakeAccount(page);
  let calls = 0;
  await page.route(endpoint, async route => {
    calls++; await route.fulfill({ status: calls === 1 ? 429 : 200, json: calls === 1 ? { error: 'quota' } : { version: 1, cities: [] } });
  });
  let dialog = await openImport(page);
  await dialog.getByRole('textbox', { name: 'Ton programme', exact: true }).fill(SYNTHETIC_EXAMPLES[0].source);
  await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Limite d’analyse atteinte');
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  await page.reload();
  await page.getByRole('button', { name: 'Créer depuis un planning', exact: true }).click(); dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'Ton programme', exact: true })).toHaveValue(SYNTHETIC_EXAMPLES[0].source);
  await dialog.getByRole('button', { name: 'Analyser mon programme', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Réponse IA invalide');
  expect(await page.evaluate(account => Object.keys(localStorage).filter(key => key.startsWith(`detours-account-v1:${account}:a-l-est-trip-v2:`)).length, account)).toBe(0);
});
