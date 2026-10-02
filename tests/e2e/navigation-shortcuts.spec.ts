import { expect, test } from '@playwright/test';

test('Reprendre retrouve la première activité restante de la ville sélectionnée', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Marquer comme visité : Arrivée à Shenzhen', exact: true }).click();
  await page.getByRole('button', { name: 'Jour 3', exact: true }).click();
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Jour 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#step-sz-1-hotel')).toHaveClass(/highlighted/);
});

test('Aujourd’hui retrouve une journée datée en heure chinoise depuis une autre ville', async ({ page }) => {
  await page.goto('/');
  const today = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  await page.getByRole('button', { name: 'Vue d’ensemble', exact: true }).click();
  await page.locator('.overview-city').filter({ has: page.getByRole('heading', { name: /Guangzhou/, exact: false }) }).getByLabel('Date de Arrivée en soirée').fill(today);
  await page.getByRole('button', { name: 'Aujourd’hui', exact: true }).click();
  await expect(page.locator('.city-heading h2')).toContainText('Guangzhou');
  await expect(page.getByRole('heading', { name: 'Arrivée en soirée', exact: true })).toBeVisible();
});
