import type { Recap } from './notifications.ts';
import { checklistCopy } from './notification-copy.ts';
export type NotificationLanguage='fr'|'en'|'es'|'zh'|'zh-CN';
const words={fr:{subject:'Votre programme de demain',open:'Ouvrir Détours',weather:'Météo',bag:'À prendre',off:'Désactiver les emails dans Mes récaps'},en:{subject:'Your programme for tomorrow',open:'Open Détours',weather:'Weather',bag:'Things to bring',off:'Disable emails in My recaps'},es:{subject:'Tu programa de mañana',open:'Abrir Détours',weather:'Tiempo',bag:'Qué llevar',off:'Desactiva los emails en Mis resúmenes'},zh:{subject:'明日行程',open:'打开 Détours',weather:'天气',bag:'随身物品',off:'在我的每日摘要中关闭邮件'}};
export const escapeEmail=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function renderRecapEmail(recap: Recap,language:NotificationLanguage,origin:string) {
  const u=new URL(origin);if(u.protocol!=='https:' || u.username || u.password)throw Error('Invalid application origin');
  const url=`${u.origin}/?trip=${encodeURIComponent(recap.tripId)}&kind=recap&object=${encodeURIComponent(recap.date)}`;
  const w=words[language==='zh-CN'?'zh':language], lines=recap.items.map(i=>`${i.time?`${i.time} (${i.timezone}) · `:''}${i.title}${i.location?` · ${i.location}`:''}`);
  const forecasts=recap.weather.map(f=>`${f.place}: ${f.min??'—'}–${f.max??'—'} °C (${f.source}, ${f.fetchedAt})`);
  const checklist=recap.checklist.map(l=>checklistCopy(language==='zh'?'zh-CN':language,l));
  const text=[w.subject,recap.tripTitle,recap.date,...lines,w.weather,...forecasts,w.bag,...checklist,url,w.off].join('\n');
  const html=`<!doctype html><html lang="${language}"><body><h1>${escapeEmail(w.subject)}</h1><h2>${escapeEmail(recap.tripTitle)} · ${escapeEmail(recap.date)}</h2><ul>${lines.map(l=>`<li>${escapeEmail(l)}</li>`).join('')}</ul><h3>${escapeEmail(w.weather)}</h3>${forecasts.map(f=>`<p>${escapeEmail(f)}</p>`).join('')}<h3>${escapeEmail(w.bag)}</h3><ul>${checklist.map(l=>`<li>${escapeEmail(l)}</li>`).join('')}</ul><a href="${escapeEmail(url)}">${escapeEmail(w.open)}</a><p>${escapeEmail(w.off)}</p></body></html>`;
  return {subject:`${w.subject} · ${recap.date}`,text,html};
}
