import { chromiumTestOptions } from './browser-test-options.ts';
/** Disposable browser profiles. Supabase API and sessions simulated;
 * actual RPC permissions and CAS are tested separately in rolled-back SQL. */
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import {productionTestServer} from './production-server.mjs';
import {archive,blankTrip,tripKey} from '../src/journeys.ts';
import {splitContent,emptyPrivate} from '../src/cloud/projection.ts';
const config=await readFile('.env.local','utf8');
const project=config.match(/^VITE_SUPABASE_URL=https:\/\/([a-z]+)\.supabase\.co/m)?.[1];
if(!project)throw new Error('Build Supabase configuré requis');
const server=await productionTestServer();server.update();
const browser=await chromium.launch(chromiumTestOptions()).catch(async error => { await server.close(); throw error; });
const A='00000000-0000-4000-8000-000000000901',B='00000000-0000-4000-8000-000000000902',C='00000000-0000-4000-8000-000000000903';
const emails={[A]:'creator@example.invalid',[B]:'friend@example.invalid',[C]:'reader@example.invalid'};
const groups=['notes','reservations','budget','documents','preparation'];
const categoryKeys={notes:['notes','cityNotes','stayNotes','bonusPrivate'],reservations:['bookings','transferPrivate'],budget:['expenses','budget','budgetCurrency','exchangeRates','rateQuotes','budgetConversions'],documents:['documents'],preparation:['favorites','done','packing','phrases']};
const trip=blankTrip({id:'sharing-fixture',title:'Tokyo ensemble'});
trip.notes.general='Note commune du propriétaire';trip.documents=[{id:'doc',title:'Document commun',content:'Contenu du document commun'}];
trip.cities=[{id:'tokyo',name:'Tokyo — quartiers et jardins',chineseName:'',subtitle:'Trois journées ensemble',color:'#638160',image:'',mapProvider:'google',notes:['Pense-bête commun'],days:[{id:'day-1',title:'Jardins et ruelles de Yanaka',steps:[{id:'walk',title:'Promenade à Yanaka',description:'Se retrouver autour d’un café.',address:'Yanaka, Tokyo',category:'walk',period:'Matin'}]}]}];
const docs=new Map([[trip.journey.id,{owner_id:A,content:splitContent(trip),revision:1,private_revision:1,fullSharing:false,deleted:false}]]);
let memberRole=null,readerRole=null,memberFields=[...groups];const errors=[],requests=[],invites=new Map();let token='a'.repeat(64);
function roleFor(id,tripId){return docs.get(tripId)?.owner_id===id?'owner':tripId===trip.journey.id?(id===B?memberRole:id===C?readerRole:null):null;}
function remote(id,tripId){const r=docs.get(tripId),role=roleFor(id,tripId);assert.ok(r&&role,'authorized read');const fields=role==='owner'?groups:memberFields;let p=emptyPrivate();if(role==='owner'||r.fullSharing){for(const g of fields)for(const k of categoryKeys[g])if(k in r.content.private)p[k]=r.content.private[k];}return {...r,role,allowedFields:fields,private_revision:role==='owner'||r.fullSharing?r.private_revision:0,content:{shared:r.content.shared,private:p}};}
async function profile(id,seed=false,intent=false){
 const context=await browser.newContext({viewport:{width:1440,height:980},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const exp=Math.floor(Date.now()/1000)+3600;
 const jwt='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:id,exp,role:'authenticated'})).toString('base64url')+'.fixture';
 const session={access_token:jwt,refresh_token:'fixture',token_type:'bearer',expires_at:exp,expires_in:3600,user:{id,email:emails[id],aud:'authenticated',role:'authenticated',app_metadata:{provider:'google'},user_metadata:{},created_at:'2026-10-07T00:00:00Z'}};
 await context.addInitScript(({project,session,seed,raw,content,intent})=>{
  localStorage.setItem(`sb-${project}-auth-token`,JSON.stringify(session));
  if(seed)localStorage.setItem(`detours-account-v1:${session.user.id}:a-l-est-trip-v2:sharing-fixture`,JSON.stringify({version:1,raw,base:content,revision:1,privateRevision:1,pending:false,operation:'seed',role:'owner'}));
  if(intent){localStorage.setItem('a-l-est-trip-v2:local-share',raw);sessionStorage.setItem('detours-share-after-signin','local-share');}
 },{project,session,seed,raw:JSON.stringify(archive(intent?blankTrip({id:'local-share',title:'Carnet local à partager'}):trip)),content:splitContent(trip),intent});
 await context.route(`https://${project}.supabase.co/**`,async route=>{
  const url=new URL(route.request().url()),name=url.pathname.split('/').pop(),args=route.request().postDataJSON()||{};requests.push(name);let data=null;
  if(name==='detours_list_trips')data=[...docs].filter(([tid])=>roleFor(id,tid)).map(([tid,r])=>({id:tid,journey:r.content.shared.journey,departureDate:r.content.shared.departureDate,revision:r.revision,privateRevision:remote(id,tid).private_revision,fullSharing:r.fullSharing,cityCount:r.content.shared.cities.length,role:roleFor(id,tid),deleted:r.deleted}));
  else if(name==='detours_get_trip'){if(!roleFor(id,args.p_trip)){await route.fulfill({status:403,json:{message:'Access denied'}});return;}data=remote(id,args.p_trip);}
  else if(name==='detours_roster'){const r=docs.get(args.p_trip);data=[{user_id:r.owner_id,email:emails[r.owner_id],display_name:'Créateur test',role:'owner',share_fields:groups}];if(args.p_trip===trip.journey.id&&memberRole)data.push({user_id:B,email:emails[B],display_name:'Ami test',role:memberRole,share_fields:memberFields});if(args.p_trip===trip.journey.id&&readerRole)data.push({user_id:C,email:emails[C],display_name:'Lecteur test',role:readerRole,share_fields:groups});}
  else if(name==='detours_list_invites'||name==='detours_versions')data=[];
  else if(name==='detours_enable_full_share'){const r=docs.get(args.p_trip);assert.equal(r.owner_id,id);r.fullSharing=true;r.revision++;}
  else if(name==='detours_invite'){token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');invites.set(token,{trip:args.p_trip,acceptedBy:null,cancelled:false});data={token};}
  else if(name==='detours_accept_invite'){const invite=invites.get(args.p_token);if(!invite||invite.cancelled||(invite.acceptedBy&&invite.acceptedBy!==id)){await route.fulfill({status:400,json:{message:'Invitation unavailable'}});return;}invite.acceptedBy=id;if(id===B)memberRole=memberRole||'reader';else if(id===C)readerRole=readerRole||'reader';data=trip.journey.id;}
  else if(name==='detours_set_member'){assert.equal(id,A);if(args.p_user===B)memberRole=args.p_role==='remove'?null:args.p_role;else readerRole=args.p_role==='remove'?null:args.p_role;if(args.p_role==='remove')for(const invite of invites.values())if(invite.acceptedBy===args.p_user)invite.cancelled=true;}
  else if(name==='detours_leave_trip'){assert.ok(id===B||id===C);assert.equal(args.p_trip,trip.journey.id);if(id===B)memberRole=null;else readerRole=null;for(const invite of invites.values())if(invite.acceptedBy===id)invite.cancelled=true;}
  else if(name==='detours_set_share_fields'){assert.equal(id,A);memberFields=args.p_fields;docs.get(args.p_trip).revision++;}
  else if(name==='detours_save_trip'){
   const r=docs.get(args.p_trip),role=roleFor(id,args.p_trip);assert.ok(!r||role==='owner'||role==='editor','reader cannot write');
   if(r&&(r.revision!==args.p_expected||remote(id,args.p_trip).private_revision!==args.p_private_expected))data={status:'conflict',record:remote(id,args.p_trip)};
   else {const next={...(r||{owner_id:id,fullSharing:false}),content:structuredClone(args.p_content),revision:(r?.revision||0)+(JSON.stringify(r?.content.shared)!==JSON.stringify(args.p_content.shared)?1:0),private_revision:(r?.private_revision||0)+1,deleted:false};if(r?.fullSharing&&role!=='owner'){next.content.private=structuredClone(r.content.private);for(const g of memberFields)for(const k of categoryKeys[g]){delete next.content.private[k];if(k in args.p_content.private)next.content.private[k]=args.p_content.private[k];}}docs.set(args.p_trip,next);data={status:'saved',record:remote(id,args.p_trip)};}
  }else if(name!=='detours_world')throw new Error('Unexpected fixture request: '+url.pathname);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });return {context,page};
}
async function nav(page,label){const menu=page.getByRole('button',{name:'Ouvrir le menu',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('button',{name:label,exact:true}).click();}
async function sync(page){await page.getByRole('button',{name:'Mon compte',exact:true}).click();await page.getByRole('group',{name:'Actions du compte'}).getByRole('button',{name:'Synchroniser maintenant',exact:true}).click();}
async function layout(page,selector){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');for(const box of await page.locator(selector).evaluateAll(nodes=>nodes.filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};})))assert.ok(box.width>0&&box.x>=0&&box.right<=await page.evaluate(()=>innerWidth)+1,selector+' fits viewport');}
async function closeSheet(page){await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);}
async function details(page){
 if(await page.getByRole('dialog',{name:'Partage',exact:true}).count())return;
 const menu=page.getByRole('button',{name:'Ouvrir le menu',exact:true});
 if(await menu.isVisible())await menu.click();
 await page.locator('.trip-menu-actions').getByRole('button',{name:'Partage',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Partage',exact:true})).toBeVisible();
}
async function share(page){await details(page);await page.getByRole('button',{name:'Partager',exact:true}).click();await page.getByRole('dialog',{name:'Partager et historique'}).waitFor();}
try{
 await mkdir('docs/sync/screenshots',{recursive:true});
 const owner=await profile(A,true);await owner.page.goto(server.url);
 await owner.page.getByRole('button',{name:'Ouvrir Tokyo ensemble',exact:true}).click();await share(owner.page);
 for(const width of [320,390,1440]){await owner.page.setViewportSize({width,height:980});await layout(owner.page,'.share-panel,.share-create,.share-access-grid,.share-card');}
 await owner.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true}).click();await expect(owner.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true})).toBeEnabled();
 await expect(owner.page.getByLabel('Lien à transmettre toi-même')).toHaveValue(server.url+'/#invite='+token);
 assert.equal(docs.get(trip.journey.id).fullSharing,true,'invitation prepares common notebook');
 await owner.page.getByText('Voir exactement le contenu partagé',{exact:true}).click();await expect(owner.page.locator('.share-preview')).toContainText(trip.notes.general);await closeSheet(owner.page);
 const friend=await profile(B);await friend.page.goto(server.url+'/#invite='+token);
 for(const width of [320,390,1440]){await friend.page.setViewportSize({width,height:980});await layout(friend.page,'.invitation-banner,.invitation-copy,.invitation-actions');}
 await friend.page.getByRole('button',{name:'Accepter l’invitation',exact:true}).click();
 await expect(friend.page.locator('.app-shell')).toHaveAttribute('data-readonly','true');
 await details(friend.page);await expect(friend.page.locator('.trip-collaboration')).toContainText(emails[A]);await expect(friend.page.locator('.trip-collaboration')).toContainText(emails[B]);
 await closeSheet(friend.page);await expect(friend.page.getByRole('button',{name:'Ajouter un jour',exact:true})).toBeDisabled();
 await friend.page.getByRole('heading',{name:'Jardins et ruelles de Yanaka',exact:true}).waitFor();
 for(const width of [320,390,1440]){await friend.page.setViewportSize({width,height:980});await details(friend.page);await layout(friend.page,'.trip-collaboration,.trip-collaboration-actions');await closeSheet(friend.page);if(width===390)await friend.page.screenshot({path:'docs/sync/screenshots/common-reader-mobile.png',fullPage:false});}
 await nav(friend.page,'Mes outils sur place');await friend.page.getByRole('tab',{name:'Budget',exact:true}).click();await expect(friend.page.getByLabel('Montant à convertir',{exact:true})).toBeEnabled();await friend.page.getByRole('combobox',{name:'Mon pays',exact:true}).selectOption('FR');await expect(friend.page.getByRole('combobox',{name:'Ma devise',exact:true})).toHaveValue('EUR');await expect(friend.page.getByRole('button',{name:'Ajouter la dépense',exact:true})).toBeDisabled();assert.ok(await friend.page.evaluate(({id,key})=>!JSON.parse(localStorage.getItem(`detours-account-v1:${id}:${key}`)).pending,{id:B,key:tripKey(trip.journey.id)}),'reader personal currency does not edit shared journal');
 await nav(friend.page,'Mon carnet pratique');await expect(friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true})).toHaveValue(trip.notes.general);await expect(friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true})).toBeDisabled();
 await friend.page.getByRole('button',{name:'Document commun',exact:true}).waitFor();
 const downloading=friend.page.waitForEvent('download');await friend.page.getByRole('button',{name:'Exporter ma sauvegarde',exact:true}).click();assert.ok((await readFile(await (await downloading).path(),'utf8')).includes(trip.notes.general));
 await friend.page.screenshot({path:'docs/sync/screenshots/common-reader-desktop.png',fullPage:false});
 await share(owner.page);await owner.page.getByRole('button',{name:'Actualiser les accès',exact:true}).click();await expect(owner.page.locator('.share-member').filter({hasText:emails[B]})).toContainText(emails[B]);
 await owner.page.getByText('Options avancées de ce collaborateur',{exact:true}).click();await owner.page.locator('.share-advanced').getByLabel('Documents du voyage',{exact:true}).uncheck();
 await expect.poll(()=>memberFields.includes('documents')).toBe(false);await sync(friend.page);await expect(friend.page.getByRole('button',{name:'Document commun',exact:true})).toHaveCount(0);
 await owner.page.getByRole('combobox',{name:'Rôle de '+emails[B],exact:true}).selectOption('editor');await expect.poll(()=>memberRole).toBe('editor');await sync(friend.page);
 await expect(friend.page.locator('.app-shell')).toHaveAttribute('data-readonly','false');await expect(friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true})).toBeEnabled();
 await friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true}).fill('Note commune modifiée par mon ami');await sync(friend.page);
 await expect.poll(()=>docs.get(trip.journey.id).content.private.notes.general).toBe('Note commune modifiée par mon ami');
 await closeSheet(owner.page);await nav(owner.page,'Mon carnet pratique');await sync(owner.page);await expect(owner.page.getByRole('textbox',{name:'Notes du carnet',exact:true})).toHaveValue('Note commune modifiée par mon ami');
 // One profile edits offline while another updates the same shared field.
 await friend.context.setOffline(true);await friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true}).fill('Brouillon hors ligne de mon ami');
 await expect.poll(()=>friend.page.evaluate(({id,key})=>JSON.parse(localStorage.getItem(`detours-account-v1:${id}:${key}`)).pending,{id:B,key:tripKey(trip.journey.id)})).toBe(true);
 await owner.page.getByRole('textbox',{name:'Notes du carnet',exact:true}).fill('Nouvelle note depuis le premier appareil');await sync(owner.page);await expect.poll(()=>docs.get(trip.journey.id).content.private.notes.general).toBe('Nouvelle note depuis le premier appareil');
 await friend.context.setOffline(false);await sync(friend.page);await friend.page.locator('.trip-summary').getByRole('button',{name:/Conflit à résoudre/}).click();
 const conflict=friend.page.locator('.account-conflict');await conflict.waitFor();await expect(conflict.getByRole('button',{name:'Appliquer mes choix',exact:true})).toBeDisabled();
 for(const width of [320,390,1440]){await friend.page.setViewportSize({width,height:980});await layout(friend.page,'.trip-sync-panel,.conflict-exports,.conflict-choice');}
 await friend.page.screenshot({path:'docs/sync/screenshots/common-conflict-desktop.png',fullPage:false});
 await conflict.getByRole('button',{name:'Garder ma version pour toutes les différences',exact:true}).click();await conflict.getByRole('button',{name:'Appliquer mes choix',exact:true}).click();
 await expect.poll(()=>docs.get(trip.journey.id).content.private.notes.general).toBe('Brouillon hors ligne de mon ami');
 const backups=await friend.page.evaluate(()=>Object.entries(localStorage).filter(([key])=>key.includes('~conflict-')).map(([,v])=>JSON.parse(v).raw));assert.equal(backups.length,2);assert.ok(backups.some(s=>s.includes('Brouillon hors ligne')));assert.ok(backups.some(s=>s.includes('Nouvelle note depuis')));await closeSheet(friend.page);
 await share(owner.page);await owner.page.getByRole('combobox',{name:'Rôle de '+emails[B],exact:true}).selectOption('reader');await expect.poll(()=>memberRole).toBe('reader');await sync(friend.page);await expect(friend.page.getByRole('textbox',{name:'Notes du carnet',exact:true})).toBeDisabled();
 await owner.page.setViewportSize({width:390,height:980});await layout(owner.page,'.share-panel,.share-member,.share-row-actions');await owner.page.screenshot({path:'docs/sync/screenshots/common-permissions-mobile.png',fullPage:false});
 await owner.page.getByRole('button',{name:'Retirer l’accès',exact:true}).click();await sync(friend.page);await expect(friend.page.locator('.app-shell')).toHaveCount(0);assert.equal(docs.get(trip.journey.id).content.private.documents[0].content,'Contenu du document commun');
 // Three sessions: simultaneous editor/reader roles, then both voluntary departures.
 const inviteAgain=async(profile)=>{await owner.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true}).click();await expect(owner.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true})).toBeEnabled();await expect(owner.page.getByLabel('Lien à transmettre toi-même')).toHaveValue(server.url+'/#invite='+token);await profile.page.goto(server.url+'/#invite='+token);await profile.page.getByRole('button',{name:'Accepter l’invitation',exact:true}).click();await expect(profile.page.locator('.app-shell')).toHaveCount(1);return token;};
 await closeSheet(owner.page);await details(owner.page);await expect(owner.page.locator('.trip-access-badge')).toContainText('Propriétaire');await expect(owner.page.getByRole('button',{name:'Quitter ce voyage',exact:true})).toHaveCount(0);await closeSheet(owner.page);await share(owner.page);
 const reader=await profile(C);await inviteAgain(reader);await expect(reader.page.locator('.app-shell')).toHaveAttribute('data-readonly','true');
 const oldReaderToken=await inviteAgain(friend);
 await details(friend.page);await friend.page.getByRole('button',{name:'Quitter ce voyage',exact:true}).click();await friend.page.getByRole('dialog',{name:'Quitter ce voyage ?'}).getByRole('button',{name:'Annuler',exact:true}).click();assert.equal(memberRole,'reader','cancellation preserves access');
 const contentBefore=structuredClone(docs.get(trip.journey.id));
 await details(friend.page);await friend.page.getByRole('button',{name:'Quitter ce voyage',exact:true}).click();await friend.page.getByRole('dialog',{name:'Quitter ce voyage ?'}).getByRole('button',{name:'Confirmer et quitter',exact:true}).click();
 await expect(friend.page.locator('.app-shell')).toHaveCount(0);await expect(friend.page.getByRole('button',{name:'Ouvrir Tokyo ensemble',exact:true})).toHaveCount(0);assert.equal(readerRole,'reader');assert.deepEqual(docs.get(trip.journey.id),contentBefore);
 await friend.page.goto(server.url+'/#invite='+oldReaderToken);await friend.page.getByRole('button',{name:'Accepter l’invitation',exact:true}).click();await expect(friend.page.getByRole('alert')).toContainText('Invitation expirée');await friend.page.getByRole('button',{name:'Ignorer l’invitation',exact:true}).click();
 const oldEditorToken=await inviteAgain(friend);await owner.page.getByRole('button',{name:'Actualiser les accès',exact:true}).click();
 await owner.page.getByRole('combobox',{name:'Rôle de '+emails[B],exact:true}).selectOption('editor');assert.equal(readerRole,'reader');await sync(friend.page);await expect(friend.page.locator('.app-shell')).toHaveAttribute('data-readonly','false');
 await expect(owner.page.getByRole('combobox',{name:'Rôle de '+emails[C],exact:true})).toHaveValue('reader');
 await friend.page.setViewportSize({width:390,height:900});await details(friend.page);await friend.page.getByRole('button',{name:'Quitter ce voyage',exact:true}).click();await expect(friend.page.getByRole('dialog',{name:'Quitter ce voyage ?'})).toContainText('contributions');await layout(friend.page,'.modal,.trip-collaboration-actions');await friend.page.screenshot({path:'docs/sync/screenshots/leave-trip-mobile.png',fullPage:false,animations:'disabled'});
 await friend.page.getByRole('button',{name:'Confirmer et quitter',exact:true}).click();await expect(friend.page.locator('.app-shell')).toHaveCount(0);assert.equal(readerRole,'reader');assert.deepEqual(docs.get(trip.journey.id),contentBefore);assert.equal(invites.get(oldEditorToken).cancelled,true);
 await inviteAgain(friend);await expect(friend.page.locator('.app-shell')).toHaveAttribute('data-readonly','true');await sync(reader.page);await expect(reader.page.locator('.app-shell')).toHaveCount(1);
 const attached=await profile(B,false,true);await attached.page.goto(server.url);await attached.page.getByRole('dialog',{name:'Partager et historique'}).waitFor();await attached.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true}).click();await expect(attached.page.getByRole('button',{name:'Créer un lien privé valable 72 h',exact:true})).toBeEnabled();await expect(attached.page.getByLabel('Lien à transmettre toi-même')).toHaveValue(server.url+'/#invite='+token);assert.ok(docs.has(B+'~local-share'));assert.ok(await attached.page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:local-share')),'local original preserved');
 assert.deepEqual(errors,[]);assert.ok(requests.includes('detours_enable_full_share')&&requests.includes('detours_set_share_fields'));
 console.log('UI commune validée : trois profils créateur/éditeur/lecteur, rôles individuels, annulation et confirmation du départ, réinvitation, refus des anciens liens, contributions intactes, partage direct, conflit hors ligne, révocation et 320/390/1440px. API et sessions simulées.');
}finally{await browser.close();await server.close();}

