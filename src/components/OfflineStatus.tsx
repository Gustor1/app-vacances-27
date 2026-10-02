import { useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, WifiOff } from 'lucide-react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function OfflineStatus() {
  const [status, setStatus] = useState<'checking'|'ready'|'missing'|'dev'>('checking');
  const [install, setInstall] = useState<InstallEvent|null>(null);
  async function check() {
    if (!import.meta.env.PROD) {setStatus('dev');return;}
    setStatus('checking');
    if(!('serviceWorker' in navigator) || !('caches' in window)) {setStatus('missing');return;}
    try {
      await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error()),6000))]);
      const names=await caches.keys();
      const cacheName=names.find(name=>name.startsWith('a-l-est-'));
      if(!cacheName) {setStatus('missing');return;}
      const cache=await caches.open(cacheName);
      const files=await cache.keys();
      const required=['/','/documents/planning-original.md','/documents/bonus-original.md','/asia-geography.json','/china-landscape.svg'];
      const available=await Promise.all(required.map(async url=>(await cache.match(url,{ignoreVary:true}))?.ok));
      const assets=files.filter(request=>new URL(request.url).pathname.startsWith('/assets/'));
      const documentAssets=Array.from(document.querySelectorAll<HTMLScriptElement|HTMLLinkElement>('script[src],link[rel=stylesheet],link[rel=modulepreload]')).map(el=>el instanceof HTMLScriptElement ? el.src : el.href).filter(url=>url.startsWith(location.origin));
      const loadedAssets=await Promise.all(documentAssets.map(async url=>(await cache.match(url,{ignoreVary:true}))?.ok));
      const allAssets=await Promise.all(assets.map(async request=>(await cache.match(request,{ignoreVary:true}))?.ok));
      setStatus(available.every(Boolean)&&assets.length>=3&&allAssets.every(Boolean)&&loadedAssets.every(Boolean)?'ready':'missing');
    }catch{setStatus('missing');}
  }
  useEffect(()=>{void check(); const before=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent);};window.addEventListener('beforeinstallprompt',before);return()=>window.removeEventListener('beforeinstallprompt',before);},[]);
  return <section className={`offline-status panel offline-${status}`} aria-labelledby="offline-heading"><div className="offline-status-icon">{status==='ready'?<CheckCircle2/>:<WifiOff/>}</div><div><h2 id="offline-heading">{status==='ready'?'Ton carnet est prêt pour le hors-ligne':status==='checking'?'Vérification du carnet hors ligne…':status==='dev'?'Préparer le carnet pour le départ':'Le carnet hors ligne n’est pas encore prêt'}</h2><p className="muted">{status==='ready'?'Planning, documents, polices et fond géographique sont conservés sur cet appareil. Les cartes détaillées et Amap demandent toujours Internet.':status==='dev'?'Le cache hors ligne se prépare dans la version publiée ou la version de production. Garde aussi une sauvegarde JSON.':'Ouvre le site avec Internet et attends son chargement complet, puis vérifie de nouveau. Pense à conserver un export JSON.'}</p></div><div className="offline-status-actions"><button className="btn btn-secondary" disabled={status==='checking'} onClick={()=>void check()}><RefreshCw size={16}/> Vérifier</button>{install&&<button className="btn btn-primary" onClick={async()=>{await install.prompt();await install.userChoice;setInstall(null);}}><Download size={16}/> Installer le carnet</button>}</div></section>;
}
