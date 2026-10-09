import { blankTrip, archive } from '../src/journeys.ts';
import { dateInTimezone } from '../src/time.ts';
export const trip=blankTrip({id:'l6-demo',title:'Test L6 — Journées souples',timezone:'Europe/Paris',countries:['FR'],description:'Carnet fictif : horaires, durées et billets de démonstration.'});
const date=dateInTimezone('Europe/Paris');
const definitions=[
  {id:'urban',title:'Journée urbaine',labels:['Jardin de démonstration','Musée de démonstration','Promenade de démonstration'],categories:['visit','visit','walk'],ids:['urban-a','urban-b','urban-c'],chosen:['urban-b'],label:'Plan pluie',reason:'rain',anchor:'urban-a'},
  {id:'excursion',title:'Excursion',labels:['Bus aller de démonstration','Excursion de démonstration','Bus retour de démonstration'],categories:['transport','visit','transport'],ids:['excursion-a','excursion-b','excursion-c'],chosen:['excursion-a','excursion-c'],label:'Plan fatigue',reason:'fatigue',anchor:'excursion-b'},
  {id:'transfer',title:'Journée de transfert',labels:['Gare de démonstration','Train de démonstration','Hôtel de démonstration'],categories:['transport','transport','hotel'],ids:['transfer-a','transfer-b','transfer-c'],chosen:['transfer-b','transfer-c'],label:'Arrivée simplifiée',reason:'fatigue',anchor:'transfer-b'},
];
trip.cities=[{id:'l6-city',name:'Ville de démonstration',chineseName:'',subtitle:'Trois journées fictives pour essayer les alternatives',color:'#547764',image:'',notes:[],timezone:'Europe/Paris',mapProvider:'google',days:definitions.map(item=>({
  id:item.id,title:item.title,date,steps:item.labels.map((title,index)=>({id:item.ids[index],title,description:'Activité fictive pour les essais L6.',category:item.categories[index],optional:index===1&&item.id==='urban',booking:index===0})),
  preparation:{anchorStepId:item.anchor,startTime:'09:00',endTime:'18:00',marginMinutes:45,timings:Object.fromEntries(item.ids.map((id,index)=>[id,{durationMinutes:[60,90,60][index],transferMinutes:index?20:undefined,fromStepId:item.ids[index-1],source:'Saisie de démonstration — fictive',checkedAt:date}])),alternatives:[{id:item.id+'-alternative',label:item.label,reason:item.reason,stepIds:item.chosen}]},
}))}];
trip.bookings=definitions.map(d=>d.ids[0]);
trip.expenses=definitions.map((d,index)=>({id:'l6-expense-'+d.id,cityId:'l6-city',label:'Billet factice — '+d.title,amount:10+index,currency:'EUR',category:'transport'}));
trip.notes.general='Démonstration uniquement. Aucun billet réel ni temps de trajet vérifié.';
export const raw=JSON.stringify(archive(trip));
export function setupHtml(){return '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Test L6</title><body style="font:18px system-ui;max-width:36em;margin:2em;padding:1em"><h1>Test L6 — Journées souples</h1><p>Trois journées fictives : ville, excursion et transfert. Compare une alternative, adopte-la puis reviens au plan initial. Les billets et dépenses sont factices.</p><button id="prepare" style="font:inherit;padding:1em">Ouvrir le carnet de démonstration</button><p id="error"></p><script>document.querySelector("#prepare").onclick=()=>{try{const key='+JSON.stringify('a-l-est-trip-v2:'+trip.journey.id)+';if(!localStorage.getItem(key))localStorage.setItem(key,'+JSON.stringify(raw).replaceAll('<','\\u003c')+');sessionStorage.setItem("a-l-est-open-trip-v2",'+JSON.stringify(trip.journey.id)+');location.href="/";}catch(e){document.querySelector("#error").textContent=e.message;}};</script></body></html>';}
