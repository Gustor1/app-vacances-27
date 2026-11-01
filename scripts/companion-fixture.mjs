import { blankTrip } from '../src/journeys.ts';
import { emptyCompanion } from '../src/companion.ts';
export function fixture() {
 const s=blankTrip({id:'companion-fixture',title:'Compagnon fictif',timezone:'Asia/Shanghai'});
 const step=(id,title,extra={})=>({id,title,category:'visit',description:'',...extra});
 s.cities=[{id:'c',name:'Ville test',chineseName:'测试城',image:'',subtitle:'',color:'#547764',notes:[],timezone:'Asia/Shanghai',mapProvider:'amap',days:[{id:'d',title:'Jour test',date:'2027-05-10',steps:[step('a','Musée',{booking:true}),step('unknown','Pause libre',{period:'10:00'}),step('b','Jardin')],preparation:{timings:{a:{startTime:'10:00',durationMinutes:60},b:{startTime:'10:30',durationMinutes:45}},alternatives:[{id:'rain',label:'Option couverte',reason:'rain',stepIds:['b']}]}},{id:'spare',title:'Réserve',steps:[step('short','Petite exposition',{optional:true}),step('long','Longue visite',{optional:true})],preparation:{timings:{short:{durationMinutes:20},long:{durationMinutes:120}}}}]}];
 s.customBonus=[{id:'bonus',cityId:'c',title:'Salon de thé',category:'food',description:'Lieu enregistré',address:'测试路 8 号',tip:'PRIVATE_TIP'}];s.favorites=['bonus'];s.companion=emptyCompanion();
 s.stays=[{cityId:'c',name:'Hôtel choisi',chineseName:'测试旅馆',address:'测试路 10 号',checkIn:'',checkOut:'',notes:'PRIVATE_STAY'}];s.notes={d:'PRIVATE_DAY',a:'PRIVATE_REF'};
 return s;
}
