import { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Moon, RefreshCw, Sun, Sunrise, Sunset, WifiOff } from 'lucide-react';
import { useLocale } from '../i18n';
import { useCloud } from '../cloud/CloudProvider';
import { localeFor } from '../locale-utils';
import { dayPhase, detourSummary, formatZoneGap, journalCounts, localHour, sunProgress, zoneOffsetMinutes } from '../live-activities';
import type { City, Day, StoredState } from '../types';
import './LiveActivities.css';

/** Wall clock aligned on minute boundaries, so the displayed time never lags. */
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => { setNow(new Date()); timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
    timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    const focus = () => setNow(new Date());
    window.addEventListener('focus', focus);
    return () => { clearTimeout(timer); window.removeEventListener('focus', focus); };
  }, []);
  return now;
}

const phaseLabel = { dawn: 'Le jour se lève', day: 'En pleine journée', evening: 'Le soir tombe', night: 'C’est la nuit' } as const;
const PhaseIcon = { dawn: Sunrise, day: Sun, evening: Sunset, night: Moon } as const;

export default function LiveActivities({ state, city, day, timezone }: { state: StoredState; city: City; day: Day; timezone: string }) {
  const { t, language } = useLocale();
  const cloud = useCloud();
  const now = useMinuteClock();
  const locale = localeFor(language);
  const homeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const clock = (zone: string) => { try { return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: zone }).format(now); } catch { return ''; } };
  const stageTime = clock(timezone), homeTime = clock(homeZone);
  const gap = formatZoneGap(zoneOffsetMinutes(timezone, now) - zoneOffsetMinutes(homeZone, now));
  const hour = localHour(timezone, now), phase = dayPhase(hour), Icon = PhaseIcon[phase];
  const u = sunProgress(hour), sx = (1 - u) ** 2 * 8 + 2 * (1 - u) * u * 100 + u * u * 192, sy = (1 - u) ** 2 * 40 + 2 * (1 - u) * u * -8 + u * u * 40;
  const detour = detourSummary(state, day);
  const counts = journalCounts(state);
  const syncState = !cloud.online ? 'offline' : cloud.working ? 'working' : cloud.pending ? 'pending' : 'ready';
  const syncTitle = syncState === 'offline' ? t('Hors ligne') : t(cloud.status);
  const n = detour.steps.length, xs = (i: number) => n < 2 ? 100 : 12 + i * (176 / (n - 1));
  const livedPath = detour.lived.map((step, i) => `${i ? 'L' : 'M'}${xs(step.index).toFixed(1)} ${step.detour ? 12 : 30}`).join(' ');

  return <section className="live-activities" aria-labelledby="live-activities-title">
    <h3 id="live-activities-title" className="live-heading"><span className="live-dot" aria-hidden="true"/>{t('En direct du carnet')}</h3>
    <div className="live-grid">
      <article className={`panel live-card live-zone live-phase-${phase}`}>
        <div className="live-row"><span className="live-chip live-apricot" aria-hidden="true"><Icon size={17}/></span><div className="live-titles"><p className="live-eyebrow">{t('Heure de l’étape')} · {city.name}</p><p className="live-title">{t(phaseLabel[phase])}</p></div><time key={stageTime} className="live-hero live-apricot live-roll" dateTime={now.toISOString()}>{stageTime}</time></div>
        <svg className="live-arc" viewBox="0 0 200 46" aria-hidden="true"><path d="M0 40H200" className="live-horizon"/><path d="M8 40Q100 -8 192 40" className="live-arc-track"/>{phase !== 'night' && <><path d="M8 40Q100 -8 192 40" pathLength={1} className="live-arc-fill" style={{ strokeDasharray: `${u.toFixed(4)} 1` }}/><circle cx={sx} cy={sy} r="9" className="live-sun-glow"/><circle cx={sx} cy={sy} r="5" className="live-sun"/></>}</svg>
        <p className="live-foot"><Moon size={12} aria-hidden="true"/>{timezone === homeZone || !gap ? t('Même heure que chez toi') : <>{t('Chez toi : {time}', { time: homeTime })}<span className="live-badge">{t('Décalage {diff}', { diff: gap })}</span></>}</p>
      </article>

      <article className={`panel live-card live-sync live-sync-${syncState}`}>
        <div className="live-row"><span className="live-chip live-green" aria-hidden="true">{syncState === 'offline' ? <WifiOff size={16}/> : syncState === 'ready' ? <CheckCircle2 size={16}/> : <RefreshCw size={16} className={syncState === 'working' ? 'live-spin' : ''}/>}</span><div className="live-titles"><p className="live-eyebrow">{t('Carnet')} · {state.journey?.title || city.name}</p><p className="live-title" role="status">{syncTitle}</p></div><span className="live-bars" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i}/>)}</span></div>
        <div className="live-track" aria-hidden="true"><i/></div>
        <p className="live-foot">{t('Dans ce carnet : étapes {steps} · hébergements {stays}', { steps: counts.steps, stays: counts.stays })}</p>
        {syncState === 'offline' && <p className="live-sub live-small">{t('Internet indisponible. Les changements peuvent rester enregistrés ici en attendant l’envoi.')}</p>}
      </article>

      <article className="panel live-card live-detour">
        <div className="live-row"><span className="live-chip live-green" aria-hidden="true"><Compass size={17}/></span><div className="live-titles"><p className="live-eyebrow">{t('Le détour du jour')}</p><p className="live-title">{detour.total ? detour.detours ? t('Faites avant leur tour : {count}', { count: detour.detours }) : t('Dans l’ordre prévu, pour l’instant') : t('Aucune étape prévue pour cette journée.')}</p></div><p className="live-hero live-green"><span key={detour.done} className="live-roll">{detour.done}</span><small>/{detour.total}</small></p></div>
        {detour.total > 0 && <svg className="live-path" viewBox="0 0 200 44" role="img" aria-label={`${detour.done} / ${detour.total} ${t('étapes vécues')}`}>
          <path d={`M${xs(0)} 30H${xs(Math.max(0, n - 1))}`} className="live-planned"/>
          {livedPath && <path key={livedPath} d={livedPath} pathLength={1} className="live-lived"/>}
          {detour.steps.map(step => <g key={step.id} transform={`translate(${xs(step.index).toFixed(1)} ${step.detour ? 12 : 30})`} className={`live-node ${step.done ? 'is-done' : ''} ${step.detour ? 'is-detour' : ''}`}><title>{step.title}</title>{step.detour && <circle r="8" className="live-node-halo"/>}<circle r={step.done ? 4.5 : 3.5}/></g>)}
        </svg>}
        <p className="live-foot live-legend"><i className="live-key-planned" aria-hidden="true"/>{t('prévu')}<i className="live-key-lived" aria-hidden="true"/>{t('vécu')}<span className="live-spacer"/>{t('D’après l’ordre où tu coches les étapes.')}</p>
      </article>
    </div>
  </section>;
}
