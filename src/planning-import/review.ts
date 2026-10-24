import { blankItem } from './draft.ts';
import { beginsWithPlanningDate, findExplicitDates } from './normalizations.ts';
import type { PlanningDraft, Provenance } from './types.ts';
export type ReviewPassage = { kind: 'unprocessed' | 'conflict' | 'assignment' | 'ambiguous'; quote: string; target?: string };
const explicitNote = /^(?:#{1,6}\s|[-*_]{3,}$|(?:>\s*)?(?:notes?|nota|备注|budget|conseil|page\s+\d+\s*\/|objet\s*:)|(?:suggestions?|alternatives?)\s*[:：]?$)/iu;
/** A review passage is an unmapped source block, conflict, incomplete assignment or ambiguous field.
 * Missing optional addresses/coordinates/dates alone are not extraction failures.
 * Recomputed from the source and existing provenance; never a confidence percentage.
 */
export function reviewPassages(draft: PlanningDraft, source: string, reviewedQuotes: string[] = []): ReviewPassage[] {
  const passages: ReviewPassage[] = [];
  const add = (p: ReviewPassage) => { if (p.quote && !passages.some(v=>v.quote===p.quote && v.target===p.target && v.kind===p.kind)) passages.push(p); };
  const conflicts = (e: Provenance, target: string) => { for (const value of Object.values(e)) if (value.origin==='conflict') add({kind:'conflict',quote:value.quote,target}); };
  conflicts(draft.evidence, 'planning-title');
  draft.cities.forEach((city,ci)=> {
    const fallback = city.days.flatMap(d=>d.items).find(i=>!i.excluded)?.evidence.title?.quote || source.split(/\r?\n/).find(l=>l.trim()) || source;
    if (!city.name.trim()) add({kind:'assignment',quote:fallback,target:`planning-city-${ci}`});
    conflicts(city.evidence,`planning-city-${ci}`);
    city.days.forEach((day,di)=> {
      const target=`planning-day-${ci}-${di}`, quote=day.evidence.title?.quote || fallback;
      if (!day.title.trim()) add({kind:'assignment',quote,target});
      conflicts(day.evidence,target);
      if (!day.date && (beginsWithPlanningDate(day.title) || /\b\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\b/u.test(day.title)) && !findExplicitDates(day.title).length && day.evidence.date?.origin!=='user') add({kind:'ambiguous',quote,target:`${target}-date`});
      day.items.forEach((item,ii)=> {
        if (item.excluded) return;
        const target=`planning-item-${ci}-${di}-${ii}`;
        conflicts(item.evidence,target);
        if (item.kind==='alternative' && item.evidence.title?.origin!=='user' && /(?:\b(?:si|if|sinon|otherwise)\b|如果|否则)/iu.test(item.title)) add({kind:'ambiguous',quote:item.evidence.title?.quote || item.description,target});
      });
    });
  });
  for (const note of draft.notes) {
    if (!source.includes(note) || reviewedQuotes.includes(note)) continue;
    if (note.includes('\n') || !explicitNote.test(note.trim())) add({kind:/correction|contradic|annul|peut-être|maybe|perhaps|si\b|sinon|如果|取消|quizás/iu.test(note)?'ambiguous':'unprocessed',quote:note});
  }
  return passages;
}

export function activityFromPassage(quote: string) {
  // A long source block needs a user-written title; never silently truncate it.
  const item=blankItem(quote.length <= 300 ? quote : '');
  item.description=quote.length <= 10000 ? quote : '';
  // Even when the description field cannot hold the block, its exact source remains
  // in provenance and in the original notes, within the existing 50k quote contract.
  item.evidence={title:{origin:'user',quote:''},description:{origin:'source',quote}};
  return item;
}
