import { test, expect } from '@playwright/test';
import { archive, blankTrip } from '../../src/journeys';
import { defaultNotificationPreferences, notificationKey } from '../../src/notifications';
import { splitContent } from '../../src/cloud/projection';
import { readFileSync } from 'node:fs';

async function openSettings(page: import('@playwright/test').Page, existing?: unknown) {
  const state = blankTrip({id:'notification-ux',title:'Voyage Shanghai',timezone:'Asia/Shanghai'});
  await page.goto('/');
  await page.evaluate(({raw,existing}) => {
    localStorage.setItem('a-l-est-trip-v2:notification-ux', raw);
    if (existing) localStorage.setItem('detours-notifications-v1:notification-ux', JSON.stringify(existing));
  }, {raw:JSON.stringify(archive(state)),existing});
  await page.goto('/?trip=notification-ux');
  await page.getByRole('button',{name:'Mes récaps',exact:true}).click();
  await page.getByRole('button',{name:'Mes préférences pour ce voyage',exact:true}).click();
  return page.getByRole('dialog',{name:'Notifications du voyage',exact:true});
}

test('réglages courts : choix rapides, pause sans perte, reprise hors ligne et intention conservée', async ({page,context}) => {
  const dialog = await openSettings(page);
  await expect(dialog.getByRole('switch',{name:'Activer les notifications',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(dialog.getByRole('switch',{name:'Recevoir mon programme la veille',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(dialog.getByRole('switch',{name:'Me rappeler mes activités à venir',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(dialog.getByLabel('Heure du récap la veille',{exact:true})).toHaveValue('20:00');
  await expect(dialog).toContainText('Heure locale du voyage : Shanghai');
  await expect(dialog).not.toContainText('Asia/Shanghai');
  await expect(dialog.getByRole('button',{name:'30 min',exact:true})).toHaveAttribute('aria-pressed','true');
  await dialog.getByRole('button',{name:'15 min',exact:true}).click();
  await dialog.getByRole('switch',{name:'Recevoir mon programme la veille',exact:true}).click();
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Préférences enregistrées.');
  await page.keyboard.press('Escape');
  await context.setOffline(true);
  await page.getByRole('button',{name:'Mes récaps',exact:true}).click();
  await page.getByRole('button',{name:'Mes préférences pour ce voyage',exact:true}).click();
  await expect(dialog.getByRole('switch',{name:'Recevoir mon programme la veille',exact:true})).toHaveAttribute('aria-checked','false');
  await expect(dialog.getByRole('button',{name:'15 min',exact:true})).toHaveAttribute('aria-pressed','true');
  await dialog.getByRole('switch',{name:'Activer les notifications',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'15 min',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  const p = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), notificationKey('notification-ux'));
  expect(p.followed).toBe(false); expect(p.offsets).toEqual([15]); expect(p.categories).toEqual(['visit','transport']);
});

test('anciens réglages : plusieurs délais, 24 h, heure personnalisée et exceptions restent intacts', async ({page}) => {
  const original = {...defaultNotificationPreferences('Europe/Paris'), followed:false, activityPush:true, recapPush:false, email:false, offsets:[15,60,1440], categories:['hotel','shopping'], recapTime:'22:35', overrides:{'step:private':{mode:'custom',offsets:[7,10080]}}};
  const dialog = await openSettings(page, original);
  await expect(dialog).toContainText('Personnalisé');
  await expect(dialog.getByLabel('Heure du récap la veille',{exact:true})).toHaveCount(0);
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Préférences enregistrées.');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), notificationKey('notification-ux'));
  expect(saved).toEqual(original);
  await dialog.getByRole('switch',{name:'Activer les notifications',exact:true}).click();
  await dialog.getByRole('switch',{name:'Recevoir mon programme la veille',exact:true}).click();
  await expect(dialog.getByLabel('Heure du récap la veille',{exact:true})).toHaveValue('22:35');
  await dialog.getByText('Options avancées',{exact:true}).click();
  await expect(dialog.getByLabel('Hébergement',{exact:true})).toBeChecked();
  await expect(dialog.getByLabel('Shopping',{exact:true})).toBeChecked();
  await expect(dialog.getByLabel('Fuseau horaire du voyage',{exact:true})).toHaveValue('Europe/Paris');
});

test('permissions bloquées et sauvegarde refusée : aucun état téléphone trompeur ni perte de source', async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(Notification,'permission',{get:()=>'denied'}));
  const original = {...defaultNotificationPreferences('Asia/Shanghai'),activityPush:true,recapPush:true};
  const dialog = await openSettings(page,original);
  await expect(dialog.getByRole('switch',{name:'Sur mon téléphone',exact:true})).toHaveAttribute('aria-checked','false');
  await expect(dialog).toContainText('Notifications bloquées');
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Impossible');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), notificationKey('notification-ux'))).toEqual(original);
  await dialog.getByRole('switch',{name:'Sur mon téléphone',exact:true}).click();
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Préférences enregistrées.');
});

test('avancé : plusieurs délais, catégories, fuseau et erreur de quota', async ({page}) => {
  const dialog = await openSettings(page);
  await dialog.getByText('Options avancées',{exact:true}).click();
  await dialog.getByLabel('Durée personnalisée',{exact:true}).fill('1');
  await dialog.getByLabel('Unité de durée',{exact:true}).selectOption('1440');
  await dialog.getByRole('button',{name:'Ajouter ce délai',exact:true}).click();
  await dialog.getByLabel('Balade',{exact:true}).check();
  await dialog.getByLabel('Fuseau horaire du voyage',{exact:true}).fill('Europe/Paris');
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Préférences enregistrées.');
  const key = notificationKey('notification-ux');
  const before = await page.evaluate(key => localStorage.getItem(key), key);
  await page.evaluate(() => { const set=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){if(key.includes('detours-notifications-v1:'))throw Error('Quota');return set.call(this,key,value);}; });
  await dialog.getByLabel('Durée personnalisée',{exact:true}).fill('10');
  await dialog.getByLabel('Unité de durée',{exact:true}).selectOption('1');
  await dialog.getByRole('button',{name:'Ajouter ce délai',exact:true}).click();
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Impossible');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(before);
});

test('préférences serveur : chargement, email indépendant et refus réseau sans écraser le cache', async ({page,context}) => {
  page.on('pageerror', error => { throw error; });
  const configured = process.env.VITE_SUPABASE_URL || readFileSync('.env.local','utf8').match(/^VITE_SUPABASE_URL=(.+)$/m)![1].trim();
  const project = new URL(configured.replaceAll('"','')).hostname.split('.')[0];
  const user = '00000000-0000-4000-8000-000000000077';
  const state = blankTrip({id:'remote-notifications',title:'Voyage distant',timezone:'Europe/Paris'});
  const content = splitContent(state);
  const old = defaultNotificationPreferences('Europe/Paris');
  const remote = {...old,recapTime:'21:00',email:true,offsets:[15,1440],categories:['walk']};
  let reject = true, readReject = false, listUnavailable = false; const writes: unknown[] = [];
  const expiry=Math.floor(Date.now()/1000)+3600;
  const session={access_token:'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:user,exp:expiry,role:'authenticated'})).toString('base64url')+'.fixture',refresh_token:'fixture',token_type:'bearer',expires_at:expiry,expires_in:3600,user:{id:user,email:'test@example.invalid',email_confirmed_at:'2026-10-01T00:00:00Z',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google'},user_metadata:{},created_at:'2026-10-01T00:00:00Z'}};
  await context.route('https://*.supabase.co/**',async route => {
    const name=new URL(route.request().url()).pathname.split('/').pop();
    const args=route.request().postDataJSON() || {};
    let data: unknown = null;
    if(name==='detours_list_trips' && listUnavailable){await route.fulfill({status:503,json:{message:'offline'}});return;}
    if(name==='detours_list_trips') data=[{id:state.journey!.id,journey:state.journey,departureDate:'',revision:1,privateRevision:1,role:'owner',cityCount:0,deleted:false}];
    else if(name==='detours_roster'||name==='detours_list_invites'||name==='detours_versions')data=[];
    else if(name==='detours_get_trip') data={content,revision:1,private_revision:1,role:'owner',allowedFields:['notes','reservations','budget','documents','preparation']};
    else if(name==='detours_notification_capabilities')data={enabled:true,push:true,email:true,vapidPublicKey:'AQ'};
    else if(name==='detours_notification_recap_snapshots')data=[];
    else if(name==='detours_notification_preferences'){
      if(args.p_preferences){writes.push(args.p_preferences);if(reject){await route.fulfill({status:503,json:{message:'network unavailable'}});return;}data=args.p_preferences;}
      else {if(readReject){await route.fulfill({status:503,json:{message:'offline'}});return;}data=remote;}
    }
    await route.fulfill({json:data});
  });
  await page.goto('/');
  await page.evaluate(({project,session,raw,content,old})=>{
    localStorage.setItem(`sb-${project}-auth-token`,JSON.stringify(session));
    localStorage.setItem('detours-last-account-v1',JSON.stringify({version:1,id:session.user.id,email:session.user.email}));
    localStorage.setItem(`detours-account-v1:${session.user.id}:a-l-est-trip-v2:remote-notifications`,JSON.stringify({version:1,raw,base:content,revision:1,privateRevision:1,pending:false,operation:'seed',role:'owner'}));
    localStorage.setItem(`detours-account-v1:${session.user.id}:detours-notifications-v1:remote-notifications`,JSON.stringify(old));
  },{project,session,raw:JSON.stringify(archive(state)),content,old});
  await page.goto('/?trip=remote-notifications');
  await page.getByRole('button',{name:'Mes récaps',exact:true}).click();
  await page.getByRole('button',{name:'Mes préférences pour ce voyage',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Notifications du voyage',exact:true});
  await expect(dialog.getByRole('switch',{name:'Par e-mail (programme du lendemain)',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(dialog.getByRole('switch',{name:'Sur mon téléphone',exact:true})).toHaveAttribute('aria-checked','false');
  await expect(dialog.getByLabel('Heure du récap la veille',{exact:true})).toHaveValue('21:00');
  await dialog.getByLabel('Heure du récap la veille',{exact:true}).selectOption('19:00');
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Impossible');
  expect(await page.evaluate(user=>JSON.parse(localStorage.getItem(`detours-account-v1:${user}:detours-notifications-v1:remote-notifications`)! ),user)).toEqual(remote);
  reject=false;
  await dialog.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(dialog.locator('footer').getByRole('status')).toContainText('Préférences enregistrées.');
  expect(writes.at(-1)).toEqual({...remote,recapTime:'19:00'});
  readReject=true; listUnavailable=true;
  await page.reload();
  await page.getByRole('button',{name:'Mes récaps',exact:true}).click();
  await page.getByRole('button',{name:'Mes préférences pour ce voyage',exact:true}).click();
  await expect(dialog).toContainText('Impossible de charger vos réglages en ligne');
  await expect(dialog.getByRole('button',{name:'Enregistrer',exact:true})).toBeDisabled();
  readReject=false;
  await dialog.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'Enregistrer',exact:true})).toBeEnabled();
});

for (const width of [320,390,1440]) test(`préférences à ${width}px : thèmes, clavier, cibles tactiles et avancé`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  const dialog = await openSettings(page);
  for (const theme of ['light','dark']) {
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await expect(dialog.getByRole('switch',{name:'Par e-mail (programme du lendemain)',exact:true})).toBeDisabled();
    expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    for (const element of await dialog.getByRole('switch').all()) {
      const box=await element.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44); expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await dialog.getByText('Options avancées',{exact:true}).click();
    expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await dialog.getByText('Options avancées',{exact:true}).click();
  }
  const master=dialog.getByRole('switch',{name:'Activer les notifications',exact:true});
  await master.focus(); await page.keyboard.press('Space'); await expect(master).toHaveAttribute('aria-checked','false');
  await page.keyboard.press('Space'); await expect(master).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Mes récaps',exact:true})).toBeFocused();
});
