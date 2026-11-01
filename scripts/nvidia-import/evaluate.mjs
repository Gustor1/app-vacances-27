import { score, summarize } from '../lot06-core.mjs';

export function projectPublic(value) {
  return {cities:(Array.isArray(value?.cities)?value.cities:[]).map(city=>({name:typeof city.name==='string'?city.name:'',days:(Array.isArray(city.days)?city.days:[]).map(day=>({date:typeof day.date==='string'?day.date:'',items:(Array.isArray(day.items)?day.items:[]).map(item=>({
    title:typeof item.title==='string'?item.title:'',time:typeof item.time==='string'?item.time:'',period:typeof item.period==='string'?item.period:'',kind:item.type,booked:item.reservation?.status==='confirmed',coordinates:item.coordinates??null,
  }))}))}))};
}
export function evaluateNvidia(entry,result) {
  let wire,jsonValid=false,rawScore=null;
  try{wire=JSON.parse(result?.generatedText);jsonValid=true;rawScore=score(entry,projectPublic(wire));}catch{/* Raw invalid syntax remains an error, never repaired. */}
  const accepted=result?.acceptedForPreview===true;
  const expectedNotes=entry.source.split(/\r?\n/).filter(line=>/^(?:notes?|nota|备注)\s*[:：]/iu.test(line));
  const notes=[wire?.notes,wire?.ambiguities,wire?.unmapped].filter(Array.isArray).flat().filter(s=>typeof s==='string').join('\n');
  return {id:entry.id,jsonValid,contractValid:result?.contractValid===true,acceptedForPreview:accepted,rejected:!accepted,
    rawScore,sourceIssues:result?.issues||[],...score(entry,accepted?projectPublic(result.planning):{cities:[]}),
    expectedNotePassages:expectedNotes.length,preservedNotePassages:expectedNotes.filter(note=>notes.includes(note)).length};
}
export function summary(rows) {
  return {...summarize(rows),jsonValid:rows.filter(r=>r.jsonValid).length,contractValid:rows.filter(r=>r.contractValid).length,sourceIssues:rows.reduce((n,r)=>n+(r.sourceIssues?.length||0),0),
    expectedNotePassages:rows.reduce((n,r)=>n+(r.expectedNotePassages||0),0),preservedNotePassages:rows.reduce((n,r)=>n+(r.preservedNotePassages||0),0)};
}
