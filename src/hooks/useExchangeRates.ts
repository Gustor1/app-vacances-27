import { useCallback, useEffect, useRef, useState } from 'react';
import { validCurrency } from '../lib';
import { fetchLiveQuotes, pairKey, RATE_CACHE_KEY, RATE_MAX_AGE, readRateCache, type LiveQuote } from '../live-rates';

// Public quotes contain no trip content and can safely be shared by account caches.
const inFlight = new Map<string, Promise<Record<string, LiveQuote>>>();
export function useExchangeRates(pairs: [string,string][]) {
  const key = JSON.stringify([...new Set(pairs.filter(([from,to])=>validCurrency(from)&&validCurrency(to)&&from!==to).map(([from,to])=>pairKey(from,to)))].sort());
  const [quotes,setQuotes] = useState(()=>readRateCache(localStorage));
  const [loading,setLoading] = useState(false), [unavailable,setUnavailable] = useState(false);
  const generation = useRef(0);
  const refresh = useCallback(async (force=false) => {
    const request = ++generation.current;
    const wanted = JSON.parse(key) as string[];
    const cached = readRateCache(localStorage);
    setQuotes(previous=>({...previous,...cached}));
    const groups = new Map<string,string[]>();
    for (const pair of wanted) {
      const [from,to] = pair.split(':');
      if (!force && cached[pair] && Date.now()-cached[pair].fetchedAt < RATE_MAX_AGE) continue;
      groups.set(from,[...groups.get(from)||[],to]);
    }
    if (!groups.size) { setLoading(false); setUnavailable(false); return; }
    if (!navigator.onLine) { setLoading(false); setUnavailable(true); return; }
    setLoading(true); setUnavailable(false);
    const result = await Promise.allSettled([...groups].map(async ([from,targets])=>{
      const requestKey = from+':'+targets.sort().join(',');
      let task = inFlight.get(requestKey);
      if (!task) { task = fetchLiveQuotes(from,targets); inFlight.set(requestKey,task); void task.finally(()=>{if(inFlight.get(requestKey)===task)inFlight.delete(requestKey);}).catch(()=>{}); }
      return task;
    }));
    if (request !== generation.current) return;
    const next = { ...readRateCache(localStorage) };
    const received = new Set<string>();
    let failed = false;
    for (const item of result) {
      if (item.status==='fulfilled') {Object.assign(next,item.value);for(const pair of Object.keys(item.value))received.add(pair);} else failed=true;
    }
    // Bound public cache growth; a full device still retains the live result in memory.
    const bounded = Object.fromEntries(Object.entries(next).sort((a,b)=>b[1].fetchedAt-a[1].fetchedAt).slice(0,300));
    try { localStorage.setItem(RATE_CACHE_KEY,JSON.stringify(bounded)); } catch { /* Converter remains usable in this session. */ }
    setQuotes(previous=>({...previous,...next}));
    setUnavailable(failed || [...groups].some(([from,targets])=>targets.some(to=>!received.has(pairKey(from,to))))); setLoading(false);
  },[key]);
  useEffect(()=>{
    void refresh();
    const update=()=>{if(document.visibilityState==='visible')void refresh();};
    const online=()=>void refresh(true);
    const cached=(event:StorageEvent)=>{if(event.key===RATE_CACHE_KEY)setQuotes(previous=>({...previous,...readRateCache(localStorage)}));};
    const timer=setInterval(update,RATE_MAX_AGE);
    window.addEventListener('focus',update);window.addEventListener('online',online);window.addEventListener('offline',update);window.addEventListener('storage',cached);document.addEventListener('visibilitychange',update);
    return()=>{generation.current++;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',online);window.removeEventListener('offline',update);window.removeEventListener('storage',cached);document.removeEventListener('visibilitychange',update);};
  },[refresh]);
  return { quotes, loading, unavailable, refresh:()=>refresh(true) };
}
