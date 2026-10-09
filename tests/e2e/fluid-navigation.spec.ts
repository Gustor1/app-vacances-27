import { test, expect } from './fixtures';

for (const width of [320, 390, 740, 1000]) {
  test(`compact connection leaves space for search at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const account = page.getByRole('button', { name: 'Connexion', exact: true });
    const box = await account.boundingBox();
    expect(box?.width).toBe(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    const search = page.getByRole('textbox', { name: 'Rechercher dans le carnet' });
    expect((await search.boundingBox())?.width).toBeGreaterThan(105);
    const headerFits = await page.locator('.topbar-actions').evaluate(el => [...el.children].every(child => {
      const rect = child.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
    }));
    expect(headerFits).toBe(true);
    await account.click();
    await expect(page.getByRole('group', { name: 'Actions du compte' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    await search.fill('Shenzhen');
    await expect(page.getByRole('heading', { name: 'À la recherche de « Shenzhen »' })).toBeVisible();
  });
}

test('glass selection travels between mobile buttons and can reverse before settling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dock = page.locator('.mobile-bottom-nav');
  const indicator = dock.locator('.glass-selection');
  await expect(indicator).toBeVisible();
  const initial = (await indicator.boundingBox())!;
  // Sample presentation frames in the page, independent of locator click latency.
  const motion = await dock.evaluate(async el => {
    const indicator = el.querySelector('.glass-selection')!;
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    const initial = indicator.getBoundingClientRect().x;
    buttons[2].click();
    let moving = initial;
    for (let frame = 0; frame < 60 && moving <= initial + .1; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      moving = indicator.getBoundingClientRect().x;
    }
    const destination = buttons[2].getBoundingClientRect().x;
    buttons[0].click();
    const reversed = indicator.getBoundingClientRect().x;
    return { initial, moving, destination, reversed };
  });
  expect(motion.moving).toBeGreaterThan(motion.initial);
  expect(motion.moving).toBeLessThan(motion.destination);
  expect(Math.abs(motion.reversed - motion.moving)).toBeLessThan(1);
  await expect.poll(async () => Math.abs((await indicator.boundingBox())!.x - initial.x)).toBeLessThan(1);
  await expect(dock.getByRole('button', { name: 'Planning', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.setViewportSize({ width: 320, height: 844 });
  await expect.poll(async () => Math.abs((await indicator.boundingBox())!.x - (await dock.getByRole('button', { name: 'Planning', exact: true }).boundingBox())!.x)).toBeLessThan(1);
  await dock.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigation principale', exact: true }).getByRole('button', { name: 'Vue d’ensemble', exact: true }).click();
  await expect(indicator).toHaveCSS('opacity', '0');
  await dock.getByRole('button', { name: 'Planning', exact: true }).click();
  await expect(indicator).toHaveCSS('opacity', '1');
});

test('reduced motion places selection immediately and desktop navigation stays usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale', exact: true });
  await nav.getByRole('button', { name: /^Mes envies & bonus/ }).click();
  const selected = nav.locator('[aria-current=page]');
  const indicator = nav.locator('.glass-selection');
  expect(Math.abs((await indicator.boundingBox())!.y - (await selected.boundingBox())!.y)).toBeLessThan(1);
  await expect(page.getByRole('button', { name: 'Connexion', exact: true }).locator('span')).toBeVisible();
  await page.getByRole('button', { name: 'Mes voyages', exact: true }).click();
  const tabs = page.getByRole('tablist', { name: 'Accueil' });
  await tabs.getByRole('tab', { name: 'Mon monde', exact: true }).click();
  await expect(tabs.getByRole('tab', { name: 'Mon monde', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(Math.abs((await tabs.locator('.glass-selection').boundingBox())!.x - (await tabs.getByRole('tab', { name: 'Mon monde', exact: true }).boundingBox())!.x)).toBeLessThan(1);
});

test('glass stays inside its dock when an animation starts after the frame timestamp', async ({ page }) => {
  // Model a busy frame: rAF timestamps precede the performance.now() read on retarget.
  await page.addInitScript(() => {
    const schedule = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => schedule(time => callback(time - 80));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dock = page.locator('.mobile-bottom-nav');
  await expect(dock.locator('.glass-selection')).toBeVisible();
  await dock.getByRole('button', { name: 'Bonus', exact: true }).click();
  await expect(dock.getByRole('button', { name: 'Bonus', exact: true })).toHaveAttribute('aria-current', 'page');
  const sample = await page.locator('.mobile-bottom-nav').evaluate(async el => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return { dock: el.getBoundingClientRect().toJSON(), glass: el.querySelector('.glass-selection')!.getBoundingClientRect().toJSON() };
  });
  expect(sample.glass.left).toBeGreaterThanOrEqual(sample.dock.left);
  expect(sample.glass.right).toBeLessThanOrEqual(sample.dock.right);
});

for (const destination of ['Carte', 'Bonus']) {
  test(`glass bubble opens a bridge to ${destination} then closes on the selected button`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const dock = page.locator('.mobile-bottom-nav');
    await expect(dock.locator('.glass-selection')).toBeVisible();
    const phases = await dock.evaluate(async (el, destination) => {
      const glass = el.querySelector('.glass-selection')!;
      const button = [...el.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === destination)!;
      const source = glass.getBoundingClientRect().toJSON();
      const target = button.getBoundingClientRect().toJSON();
      button.click();
      const frames = [];
      for (let i = 0; i < 90; i++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const bounds = glass.getBoundingClientRect();
        frames.push({ x: bounds.x, right: bounds.right, width: bounds.width, height: bounds.height });
        if (i > 10 && Math.abs(bounds.x - target.x) < .2 && Math.abs(bounds.width - target.width) < .2) break;
      }
      return { source, target, frames };
    }, destination);
    const bridge = phases.frames.find(frame => frame.width > phases.source.width * 1.4);
    expect(bridge, 'the bubble must visibly stretch, not merely slide').toBeTruthy();
    expect(bridge!.x).toBeLessThan(phases.source.x + 5);
    expect(bridge!.right).toBeGreaterThan(phases.source.right + 20);
    const final = phases.frames.at(-1)!;
    expect(Math.abs(final.x - phases.target.x)).toBeLessThan(1);
    expect(Math.abs(final.width - phases.target.width)).toBeLessThan(1);
    expect(Math.abs(final.height - phases.target.height)).toBeLessThan(1);
    await expect(dock.getByRole('button', { name: destination, exact: true })).toHaveAttribute('aria-current', 'page');
  });
}

test('the sidebar bubble opens vertically and closes without displacing the buttons', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale', exact: true });
  await expect(nav.locator('.glass-selection')).toBeVisible();
  const motion = await nav.evaluate(async el => {
    const glass = el.querySelector('.glass-selection')!;
    const button = el.querySelectorAll<HTMLButtonElement>('button')[2];
    const source = glass.getBoundingClientRect().toJSON(), target = button.getBoundingClientRect().toJSON();
    button.click();
    let peak = source.height, anchored = false;
    for (let i = 0; i < 100; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const bounds = glass.getBoundingClientRect();
      peak = Math.max(peak, bounds.height);
      if (bounds.height > source.height * 1.4 && bounds.y < source.y + 5) anchored = true;
      if (i > 10 && Math.abs(bounds.y - target.y) < .2 && Math.abs(bounds.height - target.height) < .2) break;
    }
    return { peak, anchored, source, target, final: glass.getBoundingClientRect().toJSON(), button: button.getBoundingClientRect().toJSON() };
  });
  expect(motion.peak).toBeGreaterThan(motion.source.height * 1.4);
  expect(motion.anchored).toBe(true);
  expect(Math.abs(motion.final.y - motion.target.y)).toBeLessThan(1);
  expect(Math.abs(motion.final.height - motion.target.height)).toBeLessThan(1);
  expect(motion.button).toEqual(motion.target);
});
