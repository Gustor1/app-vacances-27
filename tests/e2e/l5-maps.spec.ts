import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import type { City } from '../../src/types';
import { MAP_PREFERENCES_KEY } from '../../src/map-preferences';
import { PREFERENCES_KEY, translate } from '../../src/locale-utils';

for(const provider of ['google','amap'] as const) test(`cartes ${provider} : recherche distincte du trajet, modes et prochaine étape`,async({page})=>{
  await page.goto('/');
  const state=blankTrip({id:'maps-ux',title:'Map UX'});
  const city:City={id:'c',name:provider==='google'?'Paris':'上海',chineseName:provider==='google'?'':'上海',subtitle:'Test',image:'',color:'#547764',notes:[],mapProvider:provider,days:[{id:'d',title:'Test cartes',steps:[{id:'first',title:provider==='google'?'Tour Eiffel':'外滩',description:'',address:provider==='google'?'Paris, France':'',category:'visit'},{id:'next',title:provider==='google'?'Jardin du Luxembourg':'豫园',description:'',category:'visit'}]}]};
  state.cities=[city];
  await page.evaluate(({raw,key,provider})=>{localStorage.setItem('a-l-est-trip-v2:maps-ux',raw);localStorage.setItem(key,JSON.stringify({provider}));},{raw:JSON.stringify(archive(state)),key:MAP_PREFERENCES_KEY,provider});await page.reload();
  await page.getByRole('button',{name:'Ouvrir Map UX',exact:true}).click();
  const block=page.locator('#step-first .map-actions');
  const place=block.locator('.map-place-link');const initial=await place.getAttribute('href');
  expect(new URL(initial!).hostname).toBe('www.google.com');
  await expect(place).toContainText('Voir sur Google Maps');
  await expect(block.locator('.map-route')).not.toHaveAttribute('open');
  await expect(place).toBeHidden();
  await expect(block.locator('.map-route-panel .map-copy')).toHaveCount(0);
  await block.locator('.map-route-toggle').click();
  if(provider==='google'){
    await expect(block.getByRole('group',{name:'Calculer un trajet',exact:true})).toBeVisible();
    await block.locator('.map-next-route > summary').click();
    for(const [mode,label] of [['walking','À pied'],['driving','Voiture'],['transit','Transports']]){
      const route=block.getByRole('link',{name:'Y aller · '+label,exact:true});
      const following=block.getByRole('link',{name:'De ce lieu au suivant · '+label,exact:true});
      const url=new URL((await route.getAttribute('href'))!);expect(url.pathname).toBe('/maps/dir/');expect(url.searchParams.get('travelmode')).toBe(mode);
      const next=new URL((await following.getAttribute('href'))!);expect(next.searchParams.get('travelmode')).toBe(mode);expect(next.searchParams.get('origin')).toContain('Tour Eiffel');expect(next.searchParams.get('destination')).toContain('Jardin du Luxembourg');
      expect(await place.getAttribute('href')).toBe(initial);
    }
  }else{await expect(block.locator('select,fieldset')).toHaveCount(0);await expect(block).toContainText('Choisis ton trajet et ton mode de transport dans Amap.');await expect(block.getByRole('link',{name:'Y aller · Amap ↗',exact:true})).toHaveAttribute('href',/^https:\/\/uri.amap.com/);}
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

for(const country of ['CN','FR']) test(`voyage ${country} : préférence personnelle Google par défaut`,async({page})=>{
  await page.goto('/');const state=blankTrip({id:'country-maps',title:'Country Map',countries:[country]});
  await page.evaluate(raw=>localStorage.setItem('a-l-est-trip-v2:country-maps',raw),JSON.stringify(archive(state)));await page.reload();
  await page.getByRole('button',{name:'Ouvrir Country Map',exact:true}).click();await page.locator('.route-add').click();
  await expect(page.locator('.editor-form select[name=mapProvider]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Connexion',exact:true}).click();
  await page.getByRole('button',{name:'Mon compte et mes sauvegardes',exact:true}).click();
  await expect(page.getByLabel('Application de cartes préférée',{exact:true})).toHaveValue('google');
});

for (const language of ['fr', 'en', 'zh-CN', 'es'] as const) {
  for (const provider of ['google', 'amap'] as const) {
    test(`liens sans clé : ${language}, ${provider}, clavier, hors ligne et reflow`, async ({ page, context }) => {
      const googleRequests: string[] = [];
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
        if (/(^|\.)(google\.com|googleapis\.com|gstatic\.com)$/.test(url.hostname)) googleRequests.push(url.href);
        return route.abort();
      });
      await page.goto('/');
      const state = blankTrip({ id: 'maps-free', title: 'Maps Free' });
      state.cities = [{ id: 'c', name: 'Shanghai', chineseName: '上海', subtitle: '', image: '', color: '#547764', notes: [], coordinates: [31.23, 121.47], days: [{ id: 'd', title: 'Fiches', steps: [{ id: 'first', title: 'Le Bund & promenade', chineseName: '外滩', address: '中山东一路 #1', description: '', category: 'visit', coordinates: [31.24, 121.49] }] }] }];
      const raw = JSON.stringify(archive(state));
      await page.evaluate(({ raw, language, provider, preferences, maps }) => {
        localStorage.setItem('a-l-est-trip-v2:maps-free', raw);
        localStorage.setItem(preferences, JSON.stringify({ language, theme: 'light' }));
        localStorage.setItem(maps, JSON.stringify({ provider }));
      }, { raw, language, provider, preferences: PREFERENCES_KEY, maps: MAP_PREFERENCES_KEY });
      await page.reload();
      await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: 'Maps Free' }), exact: true }).click();
      const block = page.locator('#step-first .map-actions');
      const listing = block.locator('.map-place-link');
      await expect(listing).toBeHidden();
      const toggle = block.locator('.map-route-toggle');
      await expect(toggle).toContainText('中山东一路 #1');
      await expect(page.locator('#step-first .step-address')).toHaveCount(0);
      await expect(block.locator('.map-route-panel .map-copy')).toHaveCount(0);
      const url = new URL((await listing.getAttribute('href'))!);
      expect(url.searchParams.get('query')).toBe('外滩 中山东一路 #1 上海');
      expect(url.searchParams.has('key')).toBe(false);
      await expect(page.locator('.leaflet-container').first()).toBeVisible();
      await expect(page.locator('iframe[src*="google"]')).toHaveCount(0);
      expect(googleRequests).toEqual([]);
      // 640 CSS px is the reflow equivalent of a 1280px viewport at 200% browser zoom.
      for (const width of [320, 390, 640, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { message: `Reflow ${language}/${provider} at ${width}px` }).toBeLessThanOrEqual(width);
      }
      await page.setViewportSize({ width: 390, height: 1000 });
      await block.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/maps-free-${language}-${provider}.png` });
      const copy = block.locator('.map-copy');
      const [addressBox,copyBox] = await Promise.all([toggle.boundingBox(),copy.boundingBox()]);
      const rowBox = (await block.boundingBox())!;
      expect(Math.abs(copyBox!.x + copyBox!.width - rowBox.x - rowBox.width)).toBeLessThan(1);
      expect(copyBox!.x).toBeGreaterThan(addressBox!.x + addressBox!.width);
      expect(Math.abs(copyBox!.y - addressBox!.y)).toBeLessThan(1);
      await toggle.focus();
      await page.keyboard.press('Tab');
      await expect(copy).toBeFocused();
      await context.grantPermissions(['clipboard-read','clipboard-write']);
      await page.keyboard.press('Enter');
      await expect(copy).toHaveAttribute('aria-label', translate('Copié !', language));
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('外滩 上海 中山东一路 #1');
      await expect(block.locator('.map-route')).not.toHaveAttribute('open');
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(block.locator('.map-route')).toHaveAttribute('open', '');
      await expect(listing).toBeVisible();
      for (const width of [320, 390, 640, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
      await page.setViewportSize({ width: 390, height: 1000 });
      await page.screenshot({ path: `test-results/maps-expanded-${language}-${provider}.png` });
      await listing.focus();
      await page.keyboard.press('Escape');
      await expect(block.locator('.map-route')).not.toHaveAttribute('open');
      await expect(toggle).toBeFocused();
      await expect(block.locator('.map-route-panel')).toBeHidden();
      await context.setOffline(true);
      await page.keyboard.press('Space');
      await expect(block.locator('.map-route')).toHaveAttribute('open', '');
      await expect(listing).toHaveAttribute('href', url.href);
      await expect(block.getByRole('link', { name: provider === 'google' ? translate('Y aller', language) + ' · ' + translate('À pied', language) : translate('Y aller', language) + ' · Amap ↗', exact:true })).toHaveAttribute('href', provider === 'google' ? /^https:\/\/www.google.com\/maps\/dir\// : /^https:\/\/uri.amap.com/);
      expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:maps-free'))).toBe(raw);
      await context.setOffline(false);
      // Keyboard activation is intercepted: proves the requested URL, not Google's results.
      await listing.focus();
      const opened = page.waitForEvent('popup');
      await page.keyboard.press('Enter');
      const popup = await opened;
      await expect.poll(() => googleRequests.length).toBe(1);
      expect(googleRequests[0]).toBe(url.href);
      await popup.close();
    });
  }
}
