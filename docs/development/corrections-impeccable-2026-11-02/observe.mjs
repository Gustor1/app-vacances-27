import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { paletteIds } from '../../../src/palettes.ts';
const directory = new URL('./preuves/',import.meta.url);
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
const url=process.env.CORRECTIONS_TEST_URL || 'http://127.0.0.1:53020';
await context.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
const page=await context.newPage();
try {
  await page.goto(url);await page.locator('.mascot-sprite[data-ready="true"]').waitFor();
  await page.screenshot({path:new URL('accueil-mobile.png',directory).pathname.replace(/^\/(\w:)/,'$1')});
  await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();
  await page.locator('.day-panel').waitFor();
  const contrast=[];
  for(const theme of ['light','dark']) for(const palette of paletteIds) {
    await page.evaluate(({theme,palette})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.palette=palette;},{theme,palette});
    contrast.push(await page.locator('.city-heading h2 > span').evaluate((element,{theme,palette})=>{
      const parse=value=>{const n=value.match(/[\d.]+/g)?.map(Number)||[];return [n[0]||0,n[1]||0,n[2]||0,n[3]??1];};
      const chain=[];for(let e=element;e;e=e.parentElement)chain.push(getComputedStyle(e));
      let bg=[255,255,255];for(const style of chain.reverse()){const [r,g,b,a]=parse(style.backgroundColor);bg=[r,g,b].map((v,i)=>v*a+bg[i]*(1-a));}
      const fg=parse(getComputedStyle(element).color).slice(0,3);
      const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const x=lum(fg),y=lum(bg);return {theme,palette,text:element.textContent,foreground:fg,background:bg,ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05),backgroundImages:chain.map(s=>s.backgroundImage).filter(s=>s!=='none')};
    },{theme,palette}));
  }
  const positions=[];
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:width===768?1024:900});
    await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.palette='signature';});
    await page.evaluate(()=>scrollTo(0,0));
    positions.push({width,day:await page.locator('.day-panel').boundingBox(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)});
    await page.screenshot({path:new URL(`planning-${width}.png`,directory).pathname.replace(/^\/(\w:)/,'$1')});
  }
  await writeFile(new URL('observations.json',directory),JSON.stringify({contrast,positions},null,2));
  console.log(JSON.stringify({minimumContrast:Math.min(...contrast.map(c=>c.ratio)),positions}));
  if(contrast.some(c=>c.ratio<4.5)) throw new Error('Local name contrast below 4.5');
}finally{await browser.close();}
