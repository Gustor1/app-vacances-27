// Test oracle built from frozen annotations. These are NOT outputs from an AI.
export function oraclePlanning(entry) {
  return {format:'detours-planning',version:1,title:'Simulation de transport',currency:null,timezone:null,
    cities:entry.expected.map(city=>({name:city.name,days:city.days.map((day,index)=>({title:'Day '+(index+1),date:day.date||null,
      items:day.items.map(item=>({type:item.kind||'activity',title:item.anchor,category:'visit',description:null,address:null,time:item.time||null,period:item.period||null,checkIn:null,checkOut:null,
        from:null,to:null,mode:null,departure:null,arrival:null,reservation:{status:item.booked?'confirmed':'unknown',reference:null}}))}))})),
    notes:[entry.source],ambiguities:[],unmapped:[]};
}
export function envelope(content,overrides={}) {
  return {choices:[{finish_reason:'stop',message:{role:'assistant',content}}],...overrides};
}
