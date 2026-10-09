import { test, expect } from './fixtures';

for (const width of [320, 390]) {
  test(`mobile glass dock stays compact, centred and touchable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const dock = page.getByRole('navigation', { name: 'Navigation rapide', exact: true });
    await expect(dock).toBeVisible();
    const layout = await dock.evaluate(el => {
      const rect = el.getBoundingClientRect(), viewport = document.documentElement.clientWidth;
      return { width: rect.width, height: rect.height, left: rect.left, right: viewport - rect.right, centre: Math.abs(rect.left + rect.width / 2 - viewport / 2), targets: [...el.querySelectorAll('button')].map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })) };
    });
    expect(layout.width).toBeLessThanOrEqual(340);
    expect(layout.height).toBeLessThanOrEqual(58);
    expect(layout.left).toBeGreaterThanOrEqual(16);
    expect(layout.right).toBeGreaterThanOrEqual(16);
    expect(layout.centre).toBeLessThan(1);
    for (const target of layout.targets) { expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44); }
    await page.locator('.day-panel').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-scrolled', 'true');
    await expect.poll(() => dock.evaluate(el => getComputedStyle(el).backgroundColor)).toMatch(/, 0\.96\)$/);
    await dock.getByRole('button', { name: 'Carte', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Les petits points d’un grand voyage', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-scrolled', 'false');
  });
}

test('scroll glass changes its material without changing dock position or travel data', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dock = page.locator('.mobile-bottom-nav');
  const initial = await dock.boundingBox();
  const before = await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'));
  await page.locator('.day-panel').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveAttribute('data-scrolled', 'true');
  const scrolled = await dock.boundingBox();
  expect(scrolled?.x).toBe(initial?.x);
  expect(scrolled?.y).toBe(initial?.y);
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:china-legacy'))).toBe(before);
});

test('increased contrast gives glass chrome a solid background', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ contrast: 'more', colorScheme: 'dark' });
  await page.goto('/');
  const material = await page.locator('.mobile-bottom-nav').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, blur: getComputedStyle(el).backdropFilter }));
  expect(material.background).toMatch(/^rgb\(/);
  expect(material.blur).toBe('none');
});
