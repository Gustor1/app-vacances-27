import { buildRecap, defaultNotificationPreferences, planOccurrences } from '../../src/notifications.ts';
const day={id:'day',title:'Synthetic',date:'2030-05-01',steps:Array.from({length:50},(_,n)=>({id:`step-${n}`,title:`Visit ${n}`,category:'visit',description:''})),preparation:{timings:Object.fromEntries(Array.from({length:50},(_,n)=>[`step-${n}`,{startTime:'10:00',durationMinutes:30}]))}};
const state={version:1,journey:{id:'synthetic',title:'Synthetic',timezone:'Asia/Shanghai'},cities:[{id:'city',name:'Shanghai',days:[day]}],done:[],bookings:[],notes:{}};
const preferences={...defaultNotificationPreferences('Asia/Shanghai'),activityPush:true,email:true};
const count=500;let occurrences=0;
let start=performance.now();for(let n=0;n<count;n++)buildRecap({...state,journey:{...state.journey,id:`trip-${n%5}`}},day.date,'Asia/Shanghai');const recapMs=performance.now()-start;
start=performance.now();for(let n=0;n<count;n++)occurrences+=planOccurrences({...state,journey:{...state.journey,id:`trip-${n%5}`}},preferences,`user-${Math.floor(n/5)}`,['device'],Date.parse('2029-01-01T00:00Z')).length;const planningMs=performance.now()-start;
console.log(JSON.stringify({synthetic:true,accounts:100,tripsPerAccount:5,itemsPerDay:50,recaps:count,recapMs,planningMs,occurrences,weatherCalls:0,networkCalls:0,node:process.version},null,2));
