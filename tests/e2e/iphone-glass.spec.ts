import { test, expect } from './fixtures';

test.use({ hasTouch: true });

test('header fills the viewport and has no seam in both themes, before and after scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.getByRole('button', { name: 'Préférences', exact: true }).click();
    await page.getByRole('radio', { name: theme === 'dark' ? 'Sombre' : 'Clair', exact: true }).check();
    await page.keyboard.press('Escape');
    for (const scroll of [0, 300]) {
      await page.evaluate(y => window.scrollTo(0, y), scroll);
      await expect(page.locator('html')).toHaveAttribute('data-scrolled', scroll ? 'true' : 'false');
      const header = await page.locator('.topbar').evaluate(el => {
        const style = getComputedStyle(el), bounds = el.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, width: innerWidth, top: bounds.top, image: style.backgroundImage, shadow: style.boxShadow, border: style.borderTopWidth, color: style.backgroundColor, body: getComputedStyle(document.body).backgroundColor };
      });
      expect(header.left).toBe(0);
      expect(header.right).toBe(header.width);
      expect(header.top).toBe(0);
      expect(header.image).toBe('none');
      expect(header.shadow).toBe('none');
      expect(header.border).toBe('0px');
      await expect.poll(() => page.locator('.topbar').evaluate(el => getComputedStyle(el).backgroundColor.replace(/, [\d.]+\)$/, ')').replace('rgba(', 'rgb('))).toBe(header.body);
    }
  }
  expect(await page.locator('meta[name=viewport]').getAttribute('content')).toContain('viewport-fit=cover');
});

test('a real touch opens and closes the glass bridge', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dock = page.locator('.mobile-bottom-nav');
  await expect(dock.locator('.glass-selection')).toBeVisible();
  const frames = dock.evaluate(el => new Promise<{ width: number; phase: string | undefined }[]>(resolve => {
    const glass = el.querySelector<HTMLElement>('.glass-selection')!;
    const samples: { width: number; phase: string | undefined }[] = [];
    el.addEventListener('click', () => {
      const sample = () => {
        samples.push({ width: glass.getBoundingClientRect().width, phase: glass.dataset.phase });
        if (samples.length < 70) requestAnimationFrame(sample); else resolve(samples);
      };
      requestAnimationFrame(sample);
    }, { once: true });
  }));
  const initial = (await dock.locator('.glass-selection').boundingBox())!;
  await dock.getByRole('button', { name: 'Bonus', exact: true }).tap();
  const samples = await frames;
  expect(Math.max(...samples.map(sample => sample.width))).toBeGreaterThan(initial.width * 1.4);
  expect(samples.some(sample => sample.phase === 'opening')).toBe(true);
  expect(samples.some(sample => sample.phase === 'closing')).toBe(true);
  const final = (await dock.locator('.glass-selection').boundingBox())!;
  const target = (await dock.getByRole('button', { name: 'Bonus', exact: true }).boundingBox())!;
  expect(Math.abs(final.x - target.x)).toBeLessThan(1);
  expect(Math.abs(final.width - target.width)).toBeLessThan(1);
});
