/** Deterministic, source-checkable formatting only; no inferred year or locale. */
export type SourceMatch = { value: string; quote: string; index: number };
const months: Record<string, number> = Object.fromEntries([
  ['january','janvier','enero','jan.','janv.'], ['february','février','fevrier','febrero','feb.','févr.'], ['march','mars','marzo'],
  ['april','avril','abril'], ['may','mai','mayo'], ['june','juin','junio'],
  ['july','juillet','julio','jul.','juil.'], ['august','août','aout','agosto'], ['september','septembre','septiembre','sept.'],
  ['october','octobre','octubre'], ['november','novembre','noviembre'], ['december','décembre','decembre','diciembre'],
].flatMap((names,index) => names.map(name => [name,index+1])));
const monthPattern = Object.keys(months).map(name => name.replaceAll('.', '\\.')).join('|');
const weekdayPattern = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lunes|martes|miércoles|jueves|viernes|sábado|domingo';
/** A date label can define a day while its missing year or ambiguous locale stays unresolved. */
export function isWeekdayHeading(text: string): boolean {
  return new RegExp(`^(?:${weekdayPattern}|星期[一二三四五六日天]|周[一二三四五六日天])[:：]?$`, 'iu').test(text);
}
export function beginsWithPlanningDate(text: string): boolean {
  const label = text.replace(new RegExp(`^(?:${weekdayPattern})\\s*,?\\s+`,'iu'),'');
  if (findExplicitDates(label).some(date => date.index === 0)) return true;
  return new RegExp(`^(?:\\d{1,2}(?:st|nd|rd|th|er)?\\s+(?:de\\s+)?(?:${monthPattern})|(?:${monthPattern})\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}[/.-]\\d{1,2}(?:[/.-]\\d{2,4})?|\\d{1,2}月\\s*\\d{1,2}日)(?=$|\\s|[:：,–—])`,'iu').test(label);
}
function civilDate(year: number, month: number, day: number): string | null {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month-1 && date.getUTCDate() === day ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null;
}
export function findExplicitDates(text: string): SourceMatch[] {
  const found: SourceMatch[] = [];
  const patterns: [RegExp, (match: RegExpMatchArray) => [number,number,number]][] = [
    [/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/gu,m => [+m[1],+m[2],+m[3]]],
    [/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/gu,m => [+m[1],+m[2],+m[3]]],
    [new RegExp(`(?<![\\p{L}\\d])(\\d{1,2})(?:st|nd|rd|th|er)?\\s+(?:de\\s+)?(${monthPattern})\\s+(?:de\\s+)?(\\d{4})(?!\\d)`,'giu'),m => [+m[3],months[m[2].toLowerCase()],+m[1]]],
    [new RegExp(`(?<![\\p{L}\\d])(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+(\\d{4})(?!\\d)`,'giu'),m => [+m[3],months[m[1].toLowerCase()],+m[2]]],
  ];
  for (const [pattern,parts] of patterns) for (const match of text.matchAll(pattern)) {
    const value = civilDate(...parts(match));
    if (value) found.push({ value, quote:match[0], index:match.index });
  }
  return found.sort((a,b) => a.index-b.index);
}
export function findExplicitTimes(text: string): SourceMatch[] {
  const pattern = /(?<![\p{L}\d])(?:(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?|(\d{1,2})\s*[hH](?:\s*(\d{2}))?|(\d{1,2}):([0-5]\d)|(\d{1,2})[点點时時](?:(\d{1,2})分?)?)(?![\p{L}\d])/giu;
  const result: SourceMatch[] = [];
  for (const match of text.matchAll(pattern)) {
    let hour = +(match[1] ?? match[4] ?? match[6] ?? match[8]);
    const minute = +(match[2] ?? match[5] ?? match[7] ?? match[9] ?? 0);
    if (match[3]) { if (hour < 1 || hour > 12) continue; hour = hour % 12 + (match[3].toLowerCase() === 'p' ? 12 : 0); }
    if (hour > 23 || minute > 59) continue;
    result.push({ value:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,quote:match[0],index:match.index });
  }
  return result;
}
/** Presentation delimiters and whitespace joins only; source quotations stay unchanged. */
export function plainPlanningText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\*\*([^\n]+?)\*\*/g,'$1').replace(/__([^\n]+?)__/g,'$1').replace(/\*([^*\n]+?)\*/g,'$1').replace(/`([^`\n]+?)`/g,'$1').replace(/\\([-*#])/g,'$1');
}
export function isSourceNormalization(field: string, value: string, quote: string): boolean {
  if (['date','checkIn','checkOut'].includes(field)) return findExplicitDates(quote).some(m => m.index === 0 && m.quote.length === quote.length && m.value === value);
  if (field === 'time') return findExplicitTimes(quote).some(m => m.index === 0 && m.quote.length === quote.length && m.value === value);
  return ['title','name','description'].includes(field) && plainPlanningText(quote).includes(value);
}
