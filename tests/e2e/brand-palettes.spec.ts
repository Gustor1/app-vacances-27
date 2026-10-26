import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { paletteIds, paletteNames, paletteTokens } from '../../src/palettes';
import { archive, chinaTrip } from '../../src/journeys';

test.use({ reducedMotion: 'reduce', deviceScaleFactor: 2 });
const output = 'docs/development/logos-palettes';
const hue = (rgb: number[]) => {
  const [r,g,b] = rgb.map(v=>v/255), max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  if (!d) return 0;
  const angle = max===r ? ((g-b)/d)%6 : max===g ? (b-r)/d+2 : (r-g)/d+4;
  return (angle*60+360)%360;
};
async function preferences(page: import('@playwright/test').Page) {
  await page.getByRole('button',{name:'Préférences',exact:true}).click();
  await page.locator('.palette-collection > summary').click();
}

test('the rendered bird and its badge follow all 24 palettes without changing the notebook',async({page,browserName})=>{
  test.setTimeout(180000);await page.setViewportSize({width:390,height:844});
  await page.route('https://**/*',route=>route.abort());
  const value=JSON.stringify(archive(chinaTrip(undefined,'brand-preserved')));
  await page.addInitScript(value=>{if(!localStorage.getItem('a-l-est-trip-v2:brand-preserved'))localStorage.setItem('a-l-est-trip-v2:brand-preserved',value);},value);
  await page.goto('/');
  const original=await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:brand-preserved'));
  await mkdir(output+'/screenshots',{recursive:true});const rows=[];const cards=[];
  for(const theme of ['light','dark'] as const){
    for(const id of paletteIds.filter(id => theme === 'dark' || id !== 'noir')){
      await preferences(page);await page.getByRole('radio',{name:theme==='light'?'Clair':'Sombre',exact:true}).check();
      await page.getByRole('radio',{name:paletteNames[id],exact:true}).check();await page.keyboard.press('Escape');
      const image=page.locator('.brand-icon');await image.evaluate(el=>(el as HTMLImageElement).decode());
      await expect(image).toHaveAttribute('data-logo-palette',id);
      const filter=await image.evaluate(el=>getComputedStyle(el).filter);
      expect(filter==='none').toBe(id==='signature');
      const colors=paletteTokens(id,theme);
      const badge=await page.locator('.brand-mark').evaluate(el=>getComputedStyle(el).backgroundColor);
      expect(badge).toBe('rgb('+colors['--brand-surface'].slice(1).match(/../g)!.map(v=>parseInt(v,16)).join(', ')+')');
      const png=await image.screenshot({path:`${output}/screenshots/${browserName}-${theme}-${id}.png`,animations:'disabled'});
      let difference=0;
      if(id!=='signature'){
        const average=await page.evaluate(async png=>{
          const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
          const mask=new Image();mask.src='/icons/brand-dark-128.png';await mask.decode();
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
          const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data;
          ctx.clearRect(0,0,image.width,image.height);ctx.drawImage(mask,0,0,image.width,image.height);const alpha=ctx.getImageData(0,0,image.width,image.height).data;
          const sum=[0,0,0];let count=0;
          for(let i=0;i<pixels.length;i+=4)if(alpha[i+3]>250&&alpha[i]>200){count++;sum.forEach((_,j)=>sum[j]+=pixels[i+j]);}
          if(!count)throw Error('No visible bird pixels');return sum.map(value=>value/count);
        },png.toString('base64'));
        const target=colors['--action'].slice(1).match(/../g)!.map(v=>parseInt(v,16));
        const distance=Math.abs(hue(average)-hue(target));difference=Math.min(distance,360-distance);
        expect(difference,`${theme}/${id}: rendered bird follows accent hue`).toBeLessThan(18);
        expect(Math.max(...average)-Math.min(...average),'bird retains its palette color').toBeGreaterThan(8);
      }
      expect(await page.evaluate(()=>localStorage.getItem('a-l-est-trip-v2:brand-preserved'))).toBe(original);
      rows.push({theme,id,filter:filter==='none'?'approved original':'palette paper relief',badge,hueDifference:difference,notebookUnchanged:true});
      cards.push(`<article style="background:${colors['--surface-alt']};color:${colors['--text']}"><img style="background:${colors['--brand-surface']}" src="data:image/png;base64,${png.toString('base64')}"><strong>${paletteNames[id]}</strong><span>${theme==='light'?'Clair':'Sombre'}</span></article>`);
    }
  }
  await writeFile(`${output}/matrix-${browserName}.json`,JSON.stringify(rows,null,2));
  const board=await page.context().newPage();await board.setViewportSize({width:1120,height:820});
  await board.setContent(`<html lang="fr"><style>body{margin:0;padding:24px;background:#e7e3dc;font-family:system-ui}h1{font-size:24px;margin:0 0 18px;color:#253b32}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}article{border-radius:16px;padding:14px;display:flex;align-items:center;flex-direction:column;gap:8px}img{width:68px;height:68px;border-radius:18px}strong{font-size:12px}span{font-size:10px;opacity:.75}</style><h1>Détours — un oiseau accordé à chaque palette</h1><div class="grid">${cards.join('')}</div></html>`);
  await board.screenshot({path:`${output}/${browserName}-24-logos.png`,fullPage:true});await board.close();
});

test('palette-colored brand survives reload and reaches the notebook footer',async({page})=>{
  await page.setViewportSize({width:1440,height:980});await page.route('https://**/*',route=>route.abort());
  await page.goto('/');await preferences(page);
  await page.getByRole('radio',{name:'Clair',exact:true}).check();await page.getByRole('radio',{name:'Bordeaux & ivoire',exact:true}).check();
  await page.keyboard.press('Escape');await page.reload();
  await expect(page.locator('.brand-icon')).toHaveAttribute('data-logo-palette','bordeaux');
  await page.getByRole('button',{name:'Ajouter l’exemple Chine',exact:true}).click();
  await expect(page.locator('.brand-icon')).toHaveAttribute('data-logo-palette','bordeaux');
  const small=page.locator('.brand-symbol');await expect(small).toHaveCount(1);await expect(small).toHaveAttribute('data-logo-palette','bordeaux');
  expect(await small.evaluate(el=>getComputedStyle(el).filter)).toContain('url(');
  await expect(small).toHaveAttribute('alt','');
});
