import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import type { City } from '../../src/types';
import { MAP_PREFERENCES_KEY } from '../../src/map-preferences';

for(const provider of ['google','amap'] as const) test(`cartes ${provider} : recherche distincte du trajet, modes et prochaine étape`,async({page})=>{
  await page.goto('/');
  const state=blankTrip({id:'maps-ux',title:'Map UX'});
  const city:City={id:'c',name:provider==='google'?'Paris':'上海',chineseName:provider==='google'?'':'上海',subtitle:'Test',image:'',color:'#547764',notes:[],mapProvider:provider,days:[{id:'d',title:'Test cartes',steps:[{id:'first',title:provider==='google'?'Tour Eiffel':'外滩',description:'',address:provider==='google'?'Paris, France':'',category:'visit'},{id:'next',title:provider==='google'?'Jardin du Luxembourg':'豫园',description:'',category:'visit'}]}]};
  state.cities=[city];
  await page.evaluate(({raw,key,provider})=>{localStorage.setItem('a-l-est-trip-v2:maps-ux',raw);localStorage.setItem(key,JSON.stringify({provider}));},{raw:JSON.stringify(archive(state)),key:MAP_PREFERENCES_KEY,provider});await page.reload();
  await page.getByRole('button',{name:'Ouvrir Map UX',exact:true}).click();
  const block=page.locator('#step-first .map-actions');
  const place=block.locator('.map-place-actions a');const initial=await place.getAttribute('href');
  expect(new URL(initial!).hostname).toBe(provider==='google'?'www.google.com':'uri.amap.com');
  if(provider==='google'){
    await expect(block.getByRole('group',{name:'Calculer un trajet',exact:true})).toBeVisible();
    const route=block.getByRole('link',{name:'Y aller ↗',exact:true});
    const following=block.getByRole('link',{name:'De ce lieu au suivant ↗',exact:true});
    for(const mode of ['walking','driving','transit']){
      await block.getByLabel('Mode de déplacement',{exact:true}).selectOption(mode);
      const url=new URL((await route.getAttribute('href'))!);expect(url.pathname).toBe('/maps/dir/');expect(url.searchParams.get('travelmode')).toBe(mode);
      const next=new URL((await following.getAttribute('href'))!);expect(next.searchParams.get('travelmode')).toBe(mode);expect(next.searchParams.get('origin')).toContain('Tour Eiffel');expect(next.searchParams.get('destination')).toContain('Jardin du Luxembourg');
      expect(await place.getAttribute('href')).toBe(initial);
    }
  }else{await expect(block.locator('select,fieldset')).toHaveCount(0);await expect(block).toContainText('Choisis ton trajet et ton mode de transport dans Amap.');}
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
