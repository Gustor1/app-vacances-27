import type { Day, DayPreparation, StepTiming } from './types.ts';

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const bounded = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1440;
export const clockMinutes = (value?: string): number | undefined => value && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? Number(value.slice(0,2))*60+Number(value.slice(3)) : undefined;
const optionalClock = (value: unknown) => value === undefined || (typeof value === 'string' && clockMinutes(value) !== undefined);
const keys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const civilDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value.slice(0,4) !== '0000' && !Number.isNaN(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
export function validPreparation(value: unknown, steps: { id: string }[]): value is DayPreparation {
  if (value === undefined) return true;
  if (!object(value) || !keys(value,['anchorStepId','startTime','endTime','marginMinutes','timings','alternatives','activeAlternativeId'])) return false;
  const ids = new Set(steps.map(step => step.id));
  if ((value.anchorStepId !== undefined && (typeof value.anchorStepId !== 'string' || !ids.has(value.anchorStepId))) || !optionalClock(value.startTime) || !optionalClock(value.endTime) || (value.marginMinutes !== undefined && !bounded(value.marginMinutes))) return false;
  if (value.startTime && value.endTime && String(value.endTime) <= String(value.startTime)) return false;
  if (value.timings !== undefined && (!object(value.timings) || Object.entries(value.timings).some(([id,timing]) => !ids.has(id) || !object(timing) || !keys(timing,['durationMinutes','transferMinutes','fromStepId','startTime','source','checkedAt']) || (timing.durationMinutes !== undefined && !bounded(timing.durationMinutes)) || (timing.transferMinutes !== undefined && !bounded(timing.transferMinutes)) || (timing.fromStepId !== undefined && (typeof timing.fromStepId !== 'string' || timing.fromStepId === id || !ids.has(timing.fromStepId))) || !optionalClock(timing.startTime) || (timing.source !== undefined && (typeof timing.source !== 'string' || timing.source.length > 1000)) || (timing.checkedAt !== undefined && !civilDate(timing.checkedAt))))) return false;
  if (value.alternatives !== undefined && (!Array.isArray(value.alternatives) || value.alternatives.length > 8 || value.alternatives.some(item => !object(item) || !keys(item,['id','label','reason','stepIds']) || typeof item.id !== 'string' || !item.id.trim() || item.id.length > 200 || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 100 || !['rain','fatigue'].includes(String(item.reason)) || !Array.isArray(item.stepIds) || !item.stepIds.length || item.stepIds.some(id=>typeof id!=='string'||!ids.has(id)) || new Set(item.stepIds).size !== item.stepIds.length) || new Set(value.alternatives.map(item=>item.id)).size!==value.alternatives.length)) return false;
  return value.activeAlternativeId === undefined || (typeof value.activeAlternativeId === 'string' && Array.isArray(value.alternatives) && value.alternatives.some(item=>item.id===value.activeAlternativeId));
}
export function activeSteps(day: Day, alternativeId = day.preparation?.activeAlternativeId) {
  const alternative = day.preparation?.alternatives?.find(item=>item.id===alternativeId);
  return alternative ? alternative.stepIds.flatMap(id=>day.steps.filter(step=>step.id===id)) : day.steps;
}
export function cleanPreparation(day: Day): Day {
  const p=day.preparation;if(!p)return day; const ids=new Set(day.steps.map(step=>step.id));
  const alternatives=p.alternatives?.map(a=>({...a,stepIds:a.stepIds.filter(id=>ids.has(id))})).filter(a=>a.stepIds.length);
  return {...day,preparation:{...p,anchorStepId:p.anchorStepId&&ids.has(p.anchorStepId)?p.anchorStepId:undefined,timings:p.timings?Object.fromEntries(Object.entries(p.timings).filter(([id])=>ids.has(id)).map(([id,t])=>[id,{...t,fromStepId:t.fromStepId&&ids.has(t.fromStepId)?t.fromStepId:undefined}])):undefined,alternatives,activeAlternativeId:alternatives?.some(a=>a.id===p.activeAlternativeId)?p.activeAlternativeId:undefined}};
}
export function analyzeDay(day: Day, alternativeId = day.preparation?.activeAlternativeId) {
  const steps=activeSteps(day,alternativeId),p=day.preparation||{},timings=p.timings||{};
  const missing=steps.filter((step,index)=>timings[step.id]?.durationMinutes===undefined || (index>0&&(timings[step.id]?.transferMinutes===undefined || timings[step.id]?.fromStepId!==steps[index-1].id))).map(step=>step.id);
  const start=clockMinutes(p.startTime),end=clockMinutes(p.endTime),conflicts:string[]=[];
  let total=p.marginMinutes||0,previousEnd:number|undefined;
  steps.forEach((step,index)=>{
    const timing:StepTiming=timings[step.id]||{},transfer=index?(timing.fromStepId===steps[index-1].id?timing.transferMinutes:undefined):0;
    total+=(timing.durationMinutes||0)+(transfer||0);
    const explicit=clockMinutes(timing.startTime);
    const earliest=index===0?start:previousEnd!==undefined&&transfer!==undefined?previousEnd+transfer:undefined;
    if(explicit!==undefined&&earliest!==undefined&&explicit<earliest)conflicts.push(step.id);
    const actual=explicit??earliest;
    previousEnd=actual!==undefined&&timing.durationMinutes!==undefined?actual+timing.durationMinutes:undefined;
    if(end!==undefined&&previousEnd!==undefined&&previousEnd>end)conflicts.push(step.id);
  });
  const complete=!!steps.length&&!missing.length&&start!==undefined&&end!==undefined&&p.marginMinutes!==undefined;
  if(complete&&total>end!-start!)conflicts.push('window');
  return {steps,missing,total,complete,conflicts:[...new Set(conflicts)],anchorMissing:!!p.anchorStepId&&!steps.some(s=>s.id===p.anchorStepId)};
}
