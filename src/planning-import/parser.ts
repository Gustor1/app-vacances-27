import { blankItem, validateDraft, validateSource } from './draft.ts';
import { hasConfirmedBooking } from './booking.ts';
import { beginsWithPlanningDate, isWeekdayHeading, findExplicitDates, findExplicitTimes, plainPlanningText } from './normalizations.ts';
import type { DraftCity, DraftDay, DraftItem, Evidence, PlanningDraft } from './types.ts';

const dayPrefix = /^(?:(?:jour(?:née)?|day|d[ií]a)\s*\d{1,3}\b|J\s*\d{1,3}\b|第[\d一二三四五六七八九十百]+天)/iu;
const periodPrefix = /^(matin(?:ée)?|après[- ]midi|soir(?:ée)?|midi|morning|afternoon|evening|night|mañana|tarde|noche|上午|早上|中午|下午|晚上|傍晚)(?=\s|[:：]|$)/iu;
const notesPrefix = /^(?:notes?|correction|budget|conseils?|à réserver|a reserver|à vérifier|attention|important|penser|prévoir|si\b|pour la promenade|ignore\b|remarque|consejo|nota|备注|注意|提示|如果|建议预订|to book)\b|^(?:备注|注意|提示|如果)/iu;
const genericHeading = /\b(voyage|voyages|trip|travel|holiday|itinerary|planning|programme|program|circuit|escapade|journey|week[- ]end|trajet|conseils|budget|notes|réservation)\b|行程|旅行|攻略/iu;
const suggestionPrefix = /^(suggestions?|idée|envie|optional|optionnel|facultatif|sugerencia|opcional|建议|推荐)\s*[:：-]?\s*/iu;
const alternativePrefix = /^(alternatives?|option b|plan b|alternativa|备选|替代)\s*[:：-]?\s*/iu;
const unchosenStay = /^(?:h[oô]tel|hotel|alojamiento|酒店)\s*[:：]\s*(?:(?:environ|estimated?|aproximadamente|约)\s*\d|.*(?:pas encore choisi|not chosen|sin elegir|未定))/iu;
const proof = (quote: string, origin: Evidence['origin'] = 'source'): Evidence => ({ origin,quote });
const clean = (value: string) => plainPlanningText(value).trim();
const unquote = (line: string) => line.replace(/^\s*(?:>\s*)+/u, '');
const undecorate = (line: string) => line.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '');
const content = (line: string) => undecorate(clean(unquote(line).replace(/^\s{0,3}#{1,6}\s+/,'').replace(/\s+#+\s*$/,'')));
const dayLabel = (text: string) => text.replace(/^(?:[-+*•●▪]\s+|\d+[.)]\s+)/u,'');
const isDay = (text: string) => dayPrefix.test(dayLabel(text)) || beginsWithPlanningDate(dayLabel(text)) || isWeekdayHeading(dayLabel(text));

function category(title: string): DraftItem['category'] {
  if (/h[oô]tel|hostel|hébergement|alojamiento|酒店|旅馆|住宿/iu.test(title)) return 'hotel';
  if (/\b(train|bus|flight|ferry|gare|aéroport|airport|avion|métro|metro|station|rail)\b|火车|高铁|机场|车站/iu.test(title)) return 'transport';
  if (/\b(déjeuner|dîner|diner|restaurant|café|cafe|lunch|dinner|breakfast|almuerzo|cena|desayuno)\b|午餐|晚餐|早餐|餐厅/iu.test(title)) return 'food';
  if (/\b(shopping|boutique|market|marché|mercado|compras)\b|购物|商场|市场/iu.test(title)) return 'shopping';
  if (/\b(promenade|balade|walk|walking|paseo|randonnée)\b|散步|徒步/iu.test(title)) return 'walk';
  return 'visit';
}
function parseItem(text: string, quote: string, context: DraftItem['kind'] = 'activity'): DraftItem | null {
  let title = undecorate(clean(unquote(text)).replace(/^(?:[-+•●▪]\s+|\*\s*|\d+[.)]\s+)(?:\[[ xX]\]\s*)?/u,'').trim());
  if (unchosenStay.test(title)) return null;
  let kind = /^(?:(?:si|if|sinon|otherwise)\b|如果|否则)/iu.test(title) ? 'alternative' as const : context;
  if (alternativePrefix.test(title)) { kind = 'alternative'; title = title.replace(alternativePrefix,''); }
  else if (suggestionPrefix.test(title)) { kind = 'suggestion'; title = title.replace(suggestionPrefix,''); }
  const time = findExplicitTimes(title).find(t => t.index === 0);
  const period = title.match(periodPrefix)?.[0] || '';
  if (time) title = title.slice(time.quote.length).replace(/^\s*(?:[–—-]\s*\d{1,2}(?::\d{2}|\s*h(?:\s*\d{2})?)\s*)?/u,'').replace(/^[\s:：–—-]+/u,'');
  else if (period) title = title.slice(period.length).replace(/^[\s:：–—-]+/u,'');
  if (!title || title.length > 300) return null;
  const item = blankItem(title), suggestion = kind === 'suggestion' || kind === 'alternative';
  item.evidence = { title:proof(quote,suggestion ? 'suggestion' : 'source') };
  item.category = category(title);
  item.kind = kind === 'activity' && item.category === 'hotel' ? 'stay' : kind;
  item.optional = suggestion || /facultatif|optionnel|optional|opcional|可选|si possible|si encore/iu.test(title);
  item.booked = !suggestion && hasConfirmedBooking(title);
  if (item.booked) item.evidence.booked = proof(quote);
  if (time) { item.time = time.value; item.evidence.time = proof(time.quote); }
  if (period) { item.period = period; item.evidence.period = proof(period); }
  // Keep the full line: ranges, qualifiers and original Markdown remain recoverable.
  item.description = quote.trim(); item.evidence.description = proof(quote);
  return item;
}

type Column = 'title' | 'city' | 'day' | 'date' | 'time' | 'address' | 'description' | '';
function tableColumn(cell: string): Column {
  const value = clean(cell).toLowerCase();
  if (/^(activit[ée]s?|activity|activities|title|lieu|place|étape|stop|actividad|活动|景点|行程)$/.test(value)) return 'title';
  if (/^(ville|city|ciudad|城市)$/.test(value)) return 'city';
  if (/^(jour|day|día|dia|天数|天)$/.test(value)) return 'day';
  if (/^(date|fecha|日期)$/.test(value)) return 'date';
  if (/^(heure|horaire|time|period|période|hora|时间|时段)$/.test(value)) return 'time';
  if (/^(adresse|address|dirección|direccion|地址)$/.test(value)) return 'address';
  if (/^(notes?|description|details|détails|notas|备注|说明)$/.test(value)) return 'description';
  return '';
}
function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(cell => cell.trim());
}

/** Conservative offline extraction. All output stays a review draft, including missing fields. */
export function parsePlanning(source: string): PlanningDraft {
  validateSource(source);
  const draft: PlanningDraft = { version:1,title:'',cities:[],notes:[],evidence:{} };
  const lines = source.split(/\r?\n/);
  const nextLines = new Array<string>(lines.length);
  let nextLine = '';
  for (let i=lines.length-1; i>=0; i--) { nextLines[i]=nextLine; if (lines[i].trim()) nextLine=lines[i]; }
  let city: DraftCity | undefined, day: DraftDay | undefined, lastItem: DraftItem | null = null;
  let section: DraftItem['kind'] = 'activity', notesSection = false, fence = false, table: Column[] | null = null;
  let inheritedPeriod = '', plainCityBlocks = false;
  const note = (line: string) => { if (line.trim()) draft.notes.push(line); };
  const selectCity = (name: string, quote: string) => {
    if (city?.name === name) return city;
    city = { name,days:[],evidence:name ? { name:proof(quote) } : {} };
    draft.cities.push(city); day = undefined; lastItem = null; inheritedPeriod = ''; return city;
  };
  const selectDay = (title: string, quote: string, dateText = title, reuse = false) => {
    if (!city) selectCity('','');
    const dates = findExplicitDates(dateText), date = dates.length === 1 ? dates[0] : null;
    if (reuse && day?.title === title && (!date || day.date === date.value)) return day;
    day = { title:title.slice(0,200),date:date?.value || '',items:[],evidence:title ? { title:proof(quote) } : {} };
    if (date) day.evidence.date = proof(date.quote);
    city!.days.push(day); lastItem = null; inheritedPeriod = ''; section = 'activity'; notesSection = false; return day;
  };
  const addItems = (line: string, quote = line) => {
    if (!day) selectDay('','');
    const parts = line.split(/\s*(?:→|->)\s*/u);
    for (const part of parts) {
      const item = parseItem(part,quote,section);
      if (item && day!.items.length < 1000) {
        if (!item.period && inheritedPeriod) { item.period = inheritedPeriod; item.evidence.period = proof(inheritedPeriod); }
        day!.items.push(item); lastItem = item;
      }
      else note(part);
    }
  };
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index], structural = unquote(raw), text = content(raw);
    if (!text) { table = null; continue; }
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; note(raw); continue; }
    if (fence) { note(raw); continue; }
    if (/^(?:Page\s+\d+\s*(?:\/|of|sur)\s*\d+|第\s*\d+\s*页)$/iu.test(text)) { note(raw); lastItem = null; continue; }
    if (/^\s*(?:[-*_]\s*){3,}$/.test(raw)) continue;
    if (structural.includes('|')) {
      const cells = tableCells(structural);
      if (cells.every(cell => /^:?-{3,}:?$/.test(cell))) continue;
      const columns = cells.map(tableColumn);
      if (columns.includes('title')) { table = columns; continue; }
      if (table) {
        const row = Object.fromEntries(table.flatMap((column,i) => column && cells[i] ? [[column,cells[i]]] : []));
        if (!row.title || cells.length !== table.length) { note(raw); continue; }
        if (row.city && row.city.length <= 200) selectCity(clean(row.city),row.city);
        if (row.day || row.date) selectDay(clean(row.day || row.date),row.day || row.date,row.date || row.day,true);
        if (!day) selectDay('','');
        const item = parseItem(row.title,row.title,section);
        if (!item) { note(raw); continue; }
        if (row.time) {
          const times = findExplicitTimes(clean(row.time));
          if (times.length === 1 && times[0].index === 0) { item.time=times[0].value; item.evidence.time=proof(times[0].quote); }
          else { item.period=row.time; item.evidence.period=proof(row.time); }
        }
        for (const field of ['address','description'] as const) if (row[field]) { item[field]=row[field]; item.evidence[field]=proof(row[field]); }
        day!.items.push(item); lastItem=item;
        if (table.includes('')) note(raw);
        continue;
      }
    } else table = null;
    const explicitCity = text.match(/^(?:ville|city|ciudad|destination|城市|目的地)\s*[:：]\s*(.+)$/iu);
    if (explicitCity && explicitCity[1].length <= 200) { selectCity(explicitCity[1],raw); notesSection=false; continue; }
    if (isDay(text)) {
      const label = dayLabel(text);
      const compact = label.match(/^(?:(?:jour|day|d[ií]a|J)\s*\d{1,3}|第[\d一二三四五六七八九十百]+天)\s*[:：]\s*(.+)$/iu);
      const inline = compact && !findExplicitDates(compact[1]).length && !/^\d/.test(compact[1]);
      selectDay(inline ? label.slice(0,label.indexOf(compact![1])).replace(/[\s:：]+$/,'') : label,raw);
      if (inline) {
        const rawSuffix = raw.slice(raw.indexOf(compact![1]));
        addItems(compact![1],rawSuffix);
      }
      continue;
    }
    const next = nextLines[index];
    const heading = /^\s{0,3}#{1,6}\s+/.test(structural);
    const period = text.match(periodPrefix)?.[0] || '';
    if (day && period && /^[\s:：–—-]*$/u.test(text.slice(period.length))) {
      inheritedPeriod = period; notesSection = false; lastItem = null; continue;
    }
    const cityTitle = text.replace(/\s*(?:[-–—]\s*)?\d+\s*[jJdD]\s*\/\s*\d+\s*[nN]\s*$/u,'').replace(/\s+daytrip$/iu,'').trim();
    const plainCity = !heading && (!draft.cities.length || (plainCityBlocks && index > 0 && !lines[index-1].trim()))
      && /^[\p{L}][\p{L}\p{M} '-]{0,59}$/u.test(cityTitle) && !period && !notesPrefix.test(cityTitle);
    if ((heading || plainCity) && cityTitle.length <= 100 && !genericHeading.test(cityTitle)
      && (isDay(content(next)) || (heading && /\s+daytrip$/iu.test(text)))) {
      if (plainCity) plainCityBlocks = true;
      if (!draft.title) { draft.title=cityTitle.slice(0,140); draft.evidence.title=proof(raw); }
      selectCity(cityTitle,raw); notesSection=false;
      if (/\s+daytrip$/iu.test(text)) selectDay(text,raw);
      continue;
    }
    if (heading && !draft.title) { draft.title=text.slice(0,140); draft.evidence.title=proof(raw); continue; }
    if (/^(suggestions?|alternatives?|idées|options|sugerencias|建议|备选)\s*[:：]?$/iu.test(text)) {
      section = /alternativ|备选/iu.test(text) ? 'alternative' : 'suggestion'; notesSection=false; note(raw); continue;
    }
    if (heading) { notesSection=true; lastItem=null; note(raw); continue; }
    if (unchosenStay.test(text)) { note(raw); lastItem=null; continue; }
    if (/^(?:-\s*)?(?:(?:ne pas|pas de|do not|don't|no visitar)\b|不要|不去)/iu.test(text)) { note(raw); lastItem=null; continue; }
    if (notesSection || notesPrefix.test(text)) { note(raw); lastItem=null; continue; }
    if (lastItem && /^\s{2,}\S/.test(structural) && !/^\s*[-+*•●▪]\s|^\s*\d+[.)]\s/u.test(raw) && !raw.includes('→')) {
      const previous = lastItem.evidence.description?.quote || '';
      const start = source.indexOf(previous), end = source.indexOf(raw,start + previous.length);
      if (start >= 0 && end >= 0 && end-start+raw.length <= 10000) {
        const quote=source.slice(start,end+raw.length);
        lastItem.description=quote; lastItem.evidence.description=proof(quote);
        const combined = `${lastItem.title} ${text}`;
        if (combined.length <= 300 && /(?:\b(?:des|de|du|the|of|del|la|las|los)|[-‐])$/iu.test(lastItem.title)) {
          lastItem.title=combined; lastItem.evidence.title=proof(quote);
        }
        continue;
      }
    }
    const bullet = /^\s*(?:[-+•●▪]\s+|\*\s*|\d+[.)]\s+)/u.test(structural);
    const timed = findExplicitTimes(text).some(t => t.index === 0) || periodPrefix.test(text);
    if ((bullet && (day || city)) || (day && (timed || raw.includes('→') || (text.length <= 160 && !/[.!?。！？]$/.test(text))))) {
      addItems(structural, raw); continue;
    }
    if (!draft.title && !draft.cities.length && text.length <= 140 && !/[.!?。！？]$/.test(text)) { draft.title=text; draft.evidence.title=proof(raw); }
    else note(raw);
  }
  if (!draft.cities.length) selectCity('','');
  // Keep all unmapped notes, including large inputs, within the review contract.
  if (draft.notes.length > 300) draft.notes=[source];
  return validateDraft(draft,source,false,true);
}
