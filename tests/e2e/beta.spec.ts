import { test, expect, type Page } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import { emptyWorld } from '../../src/world';

async function home(page: Page) {
  const menu = page.getByRole('button', { name: 'Ouvrir le menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
}
test('voyage multi-pays terminé, confirmation explicite, copie et suppression sans nouveau souvenir', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Créer un voyage', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Titre du voyage', { exact: true }).fill('Été France Japon');
  await dialog.getByRole('textbox', { name: 'Rechercher un pays', exact: true }).fill('France');
  await dialog.getByRole('checkbox', { name: 'France', exact: true }).check();
  await dialog.getByRole('textbox', { name: 'Rechercher un pays', exact: true }).fill('Japon');
  await dialog.getByRole('checkbox', { name: 'Japon', exact: true }).check();
  await dialog.getByRole('combobox', { name: 'Devise de référence', exact: true }).fill('EUR');
  await dialog.getByRole('combobox', { name: 'Statut', exact: true }).selectOption('completed');
  await dialog.getByRole('button', { name: 'Créer le carnet', exact: true }).click();
  await home(page);
  await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(page.getByText('0 pays · 0 visites confirmées', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Mes voyages', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmer mes visites', exact: true }).click();
  await page.getByRole('dialog').getByRole('checkbox', { name: 'France', exact: true }).check();
  await page.getByRole('dialog').getByRole('checkbox', { name: 'Japon', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmer les pays visités', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Dupliquer', exact: true }).click();
  await expect(page.locator('.journey-card')).toHaveCount(2);
  const original = page.locator('.journey-card').filter({ has: page.getByRole('heading', { name: 'Été France Japon', exact: true }) });
  await original.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.locator('.journey-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Télécharger la copie de récupération', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(page.getByText('2 pays · 2 visites confirmées', { exact: true })).toBeVisible();
  await page.reload(); await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(page.getByText('2 pays · 2 visites confirmées', { exact: true })).toBeVisible();
});

test('ancien séjour indépendant, envie, palette et nouveau voyage prérempli', async ({ page }) => {
  await page.goto('/'); await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Rechercher un pays', exact: true }).fill('Japon');
  await page.getByRole('button', { name: /^Japon 0 visites$/ }).click();
  await page.getByRole('button', { name: 'Ajouter un ancien séjour', exact: true }).click();
  await page.getByLabel('Souvenir du séjour', { exact: true }).fill('Kyoto avec les amis');
  await page.getByLabel('Année (facultative)', { exact: true }).fill('2018');
  await page.getByRole('button', { name: 'Enregistrer le séjour', exact: true }).click();
  await expect(page.getByText('Kyoto avec les amis', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ça me tente', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ça me tente', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Palette', exact: true }).selectOption('ocean');
  await page.reload(); await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Palette', exact: true })).toHaveValue('ocean');
  await expect(page.getByText('1 pays · 1 visites confirmées', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Japon ★ 1 visites/ }).click();
  await page.getByRole('button', { name: 'Préparer un voyage ici', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: 'Japon', exact: true })).toBeChecked();
});

test('partage local sans notes sensibles ; menu de compte conforme à la configuration', async ({ page }) => {
  const trip = blankTrip({ title: 'Planning public', countries: ['FR'], status: 'planning' });
  trip.notes.general = 'REF-PASSPORT-SECRET'; trip.documents = [{ id: 'd', title: 'Réservation', content: 'REF-PASSPORT-SECRET' }];
  await page.goto('/');
  await page.getByLabel('Choisir une sauvegarde JSON').setInputFiles({ name: 'planning.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(archive(trip))) });
  await home(page); await page.getByRole('button', { name: 'Partager et historique', exact: true }).click();
  await page.getByText('Voir exactement le contenu partagé', { exact: true }).click();
  await expect(page.locator('.share-preview')).not.toContainText('REF-PASSPORT-SECRET');
  await expect(page.getByRole('button', { name: 'Créer un lien privé valable 72 h', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Connexion', exact: true }).click();
  await page.getByRole('button', { name: 'Mon compte et mes sauvegardes', exact: true }).click();
  const login = page.getByRole('button', { name: 'Se connecter avec Google', exact: true });
  if (await login.count()) await expect(login).toBeEnabled();
  else await expect(page.getByText('Les comptes ne sont pas encore activés dans cette bêta. Tes carnets restent enregistrés sur cet appareil et exportables.', { exact: true })).toBeVisible();
});

test('Mon monde : mobile, clavier, quatre langues et thèmes sans débordement', async ({ page }) => {
  const world = emptyWorld(); world.visits = [{ id: 'past', stayId: 'past', country: 'FR', year: 2020, label: 'Lyon' }]; world.wishes = ['JP'];
  await page.addInitScript(world => localStorage.setItem('detours-world-v1', JSON.stringify(world)), world);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const [language, tab] of [['fr', 'Mon monde'], ['en', 'My world'], ['zh-CN', '我的世界'], ['es', 'Mi mundo']]) {
    await page.setViewportSize({ width: 320, height: 780 }); await page.goto('/');
    await page.evaluate(language => localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'dark' })), language);
    await page.reload(); await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.locator('.world-map .leaflet-interactive').first()).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: /France|法国|Francia/ }).first().focus();
    await page.keyboard.press('Enter'); await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('souvenirs corrompus conservés et aucune visite ajoutée sur erreur', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('detours-world-v1', '{broken memories'));
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('Les souvenirs sont illisibles.');
  await page.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Rechercher un pays', exact: true }).fill('France');
  await page.getByRole('button', { name: /^France 0 visites$/ }).click(); await page.getByRole('button', { name: 'Ça me tente', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Sauvegarde des souvenirs impossible.');
  expect(await page.evaluate(() => localStorage.getItem('detours-world-v1'))).toBe('{broken memories');
});

test('fin de voyage passée : proposition de clôture sans statut imposé', async ({ page }) => {
  const trip = blankTrip({ id: 'old-plan', title: 'Ancienne préparation', countries: ['FR'], status: 'planning', endDate: '2000-01-02' });
  await page.addInitScript(raw => localStorage.setItem('a-l-est-trip-v2:old-plan', raw), JSON.stringify(archive(trip)));
  await page.goto('/'); await page.getByRole('button', { name: 'Ce voyage est-il terminé ?', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Statut', exact: true })).toHaveValue('completed');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('a-l-est-trip-v2:old-plan')!).state.journey.status)).toBe('planning');
});
