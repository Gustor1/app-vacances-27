import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import { Download, Globe2, Plus, Star, Trash2, Pencil } from 'lucide-react';
import { countries, countryName, geographyCountry, statuses } from '../countries';
import { countrySummary, validWorld } from '../world';
import { downloadText, normalizeSearch, uid } from '../lib';
import type { PersonalVisit, PersonalWorld, StoredState } from '../types';
import { Modal } from '../App';
import { useLocale } from '../i18n';

const palettes = {
  forest: { label: 'Forêt', visited: ['#b3dba9', '#62965c', '#235736'], planned: '#467cb7' },
  ocean: { label: 'Océan', visited: ['#a8dadd', '#4898a2', '#155164'], planned: '#a86a20' },
  sunset: { label: 'Soleil', visited: ['#f2d59a', '#d2954b', '#845023'], planned: '#7563ae' },
} as const;
function WorldMap({ world, trips, onSelect }: { world: PersonalWorld; trips: StoredState[]; onSelect: (code: string) => void }) {
  const { t, language, resolvedTheme } = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const select = useRef(onSelect); select.current = onSelect;
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false, minZoom: 1, maxZoom: 7 }).setView([20, 0], 2);
    map.zoomControl.getContainer()?.querySelector('.leaflet-control-zoom-in')?.setAttribute('aria-label', t('Zoomer sur la carte'));
    map.zoomControl.getContainer()?.querySelector('.leaflet-control-zoom-out')?.setAttribute('aria-label', t('Dézoomer sur la carte'));
    const controller = new AbortController();
    const palette = palettes[world.palette];
    fetch(`${import.meta.env.BASE_URL}world-geography.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<FeatureCollection>; }).then(data => {
      if (controller.signal.aborted) return;
      setError(false);
      const codeFor = (f: Feature) => geographyCountry.get(String(f.id ?? '').padStart(3, '0'));
      L.geoJSON(data, {
        attribution: '<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>',
        style: f => {
          const code = f && codeFor(f);
          const info = code ? countrySummary(code, world, trips) : null;
          return { fillColor: info?.count ? palette.visited[Math.min(info.count, 3) - 1] : info?.upcoming.length ? palette.planned : resolvedTheme === 'dark' ? '#34443e' : '#e2e4df', fillOpacity: 0.95, color: info?.upcoming.length ? palette.planned : resolvedTheme === 'dark' ? '#819487' : '#83938b', weight: info?.upcoming.length ? 3 : 0.8 };
        },
        onEachFeature: (f, layer) => {
          const code = codeFor(f);
          if (!code) return;
          const info = countrySummary(code, world, trips);
          const label = document.createElement('span');
          label.textContent = `${countryName(code, language)} · ${t('{count} visites', { count: info.count })}${info.upcoming.length ? ' · ' + t('Voyage prévu') : ''}${info.wished ? ' ★' : ''}`;
          layer.bindTooltip(label, { sticky: true });
          layer.on('click', () => select.current(code));
          if (info.wished && 'getBounds' in layer) L.marker((layer as L.Polygon).getBounds().getCenter(), { interactive: false, icon: L.divIcon({ className: 'world-wish-marker', html: '<span>★</span>', iconSize: [20, 20], iconAnchor: [10, 10] }) }).addTo(map);
        },
      }).addTo(map);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false })); observer.observe(container.current);
    return () => { controller.abort(); observer.disconnect(); map.remove(); };
  }, [world, trips, t, language, resolvedTheme]);
  return <><div className="world-map" ref={container} role="img" aria-label={t('Carte de mes séjours. La liste des pays offre les mêmes informations.')}/>{error && <p role="status">{t('Carte indisponible. Tous les pays restent accessibles dans la liste.')}</p>}</>;
}
export default function WorldView({ world, trips, onChange, onPrepare, onOpen }: { world: PersonalWorld; trips: StoredState[]; onChange: (world: PersonalWorld) => void; onPrepare: (country: string) => void; onOpen: (id: string) => void }) {
  const { t, language } = useLocale();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('mine');
  const [editing, setEditing] = useState<PersonalVisit | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const items = useMemo(() => countries.map(c => ({ ...c, name: countryName(c.code, language), ...countrySummary(c.code, world, trips) })).sort((a, b) => a.name.localeCompare(b.name, language)), [world, trips, language]);
  const filtered = items.filter(c => normalizeSearch(c.name + ' ' + c.code).includes(normalizeSearch(search)) && (filter === 'all' || c.count || c.upcoming.length || c.wished));
  const info = selected ? items.find(c => c.code === selected) : null;
  return <section className="world-view">
    <div className="world-heading"><div><p className="eyebrow">{t('LES VOYAGES LAISSENT UNE TRACE')}</p><h2><Globe2 size={28}/> {t('Mon monde')}</h2><p className="muted">{t('{countries} pays · {visits} visites confirmées', { countries: new Set(world.visits.map(v => v.country)).size, visits: world.visits.length })}</p></div><label className="field">{t('Palette')}<select value={world.palette} onChange={e => onChange({ ...world, palette: e.target.value as PersonalWorld['palette'] })}>{Object.entries(palettes).map(([id, p]) => <option key={id} value={id}>{t(p.label)}</option>)}</select></label></div>
    <div className="panel world-map-panel"><WorldMap world={world} trips={trips} onSelect={code => { setSelected(code); setEditing(null); }}/><div className="world-legend"><span>{t('Aucun séjour')}</span>{palettes[world.palette].visited.map((color, i) => <span key={color}><i style={{ background: color }}/>{t(i === 2 ? '3 visites ou plus' : '{count} visite(s)', { count: i + 1 })}</span>)}<span><i style={{ border: `3px solid ${palettes[world.palette].planned}` }}/>{t('Voyage prévu ou en cours')}</span><span>★ {t('Pays qui me tentent')}</span></div><p className="muted small">{t('Contours disponibles hors ligne. Les escales et les imports ne créent aucune visite.')}</p></div>
    <div className="world-search"><label className="field">{t('Rechercher un pays')}<input type="search" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setFilter('all'); }}/></label><label className="field">{t('Afficher')}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="mine">{t('Mes pays')}</option><option value="all">{t('Tous les pays')}</option></select></label></div>
    {!filtered.length && <div className="panel world-empty"><h3>{t('Chaque voyage commence par une envie.')}</h3><p>{t('Recherche un pays pour préparer un voyage ou enregistrer un ancien séjour.')}</p><button className="btn btn-secondary" onClick={() => setFilter('all')}>{t('Tous les pays')}</button></div>}
    <div className="world-countries">{filtered.map(c => <button key={c.code} className="panel world-country" onClick={() => { setSelected(c.code); setEditing(null); }}><strong>{c.name} {c.wished ? '★' : ''}</strong><span>{t('{count} visites', { count: c.count })}{c.upcoming.length ? ' · ' + t('Voyage prévu') : ''}</span></button>)}</div>
    <div className="world-backup"><button className="text-btn" onClick={() => downloadText(JSON.stringify(world, null, 2), 'detours-mes-souvenirs.json')}><Download size={16}/>{t('Exporter mes souvenirs')}</button><button className="text-btn" onClick={() => file.current?.click()}>{t('Restaurer mes souvenirs')}</button><p className="muted small">{t('La restauration conserve les identifiants. Un import de carnet ne confirme jamais de séjour.')}</p><input hidden type="file" accept=".json" ref={file} onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { if (f.size > 5_000_000) throw new Error(); const data: unknown = JSON.parse(await f.text()); if (!validWorld(data)) throw new Error(); const visits = new Map(world.visits.map(v => [v.id, v])); data.visits.forEach(v => { if (!visits.has(v.id) && ![...visits.values()].some(old => old.stayId === v.stayId && old.country === v.country)) visits.set(v.id, v); }); onChange({ ...world, visits: [...visits.values()], wishes: [...new Set([...world.wishes, ...data.wishes])] }); setError(''); } catch { setError(t('Sauvegarde de souvenirs invalide. Rien n’a été remplacé.')); } }}/>{error && <p role="alert">{error}</p>}</div>
    {info && <Modal title={info.name} onClose={() => { setSelected(null); setEditing(null); setDeleting(null); }}><div className="world-detail"><p>{t('{count} visites', { count: info.count })}</p><div className="form-actions"><button className="btn btn-primary" onClick={() => { onPrepare(info.code); setSelected(null); }}><Plus size={16}/>{t('Préparer un voyage ici')}</button><button className="btn btn-secondary" aria-pressed={info.wished} onClick={() => onChange({ ...world, wishes: info.wished ? world.wishes.filter(c => c !== info.code) : [...world.wishes, info.code] })}><Star size={16} fill={info.wished ? 'currentColor' : 'none'}/>{t('Ça me tente')}</button></div>
      {info.upcoming.map(trip => <button className="text-btn" key={trip.journey!.id} onClick={() => onOpen(trip.journey!.id)}>{trip.journey!.title} · {t(statuses[trip.journey!.status!])}</button>)}
      {info.visits.map(v => <div className="world-visit" key={v.id}><div><strong>{v.label || t('Séjour')}</strong><p>{v.date || v.year || t('Date non renseignée')}</p>{v.journeyId && trips.some(tr => tr.journey?.id === v.journeyId) && <button className="text-btn" onClick={() => onOpen(v.journeyId!)}>{t('Ouvrir le carnet')}</button>}</div><button className="icon-btn" aria-label={t('Modifier le séjour')} onClick={() => { setEditing(v); setDeleting(null); }}><Pencil size={16}/></button><button className="icon-btn" aria-label={t('Supprimer le séjour')} onClick={() => setDeleting(v.id)}><Trash2 size={16}/></button></div>)}
      {deleting && <div className="notice"><p>{t('Supprimer cette visite confirmée ? Le carnet est conservé.')}</p><button className="btn btn-secondary" onClick={() => setDeleting(null)}>{t('Annuler')}</button><button className="btn btn-primary" onClick={() => { onChange({ ...world, visits: world.visits.filter(v => v.id !== deleting) }); setDeleting(null); }}>{t('Supprimer')}</button></div>}
      {!editing ? <button className="text-btn" onClick={() => setEditing('new')}><Plus size={16}/>{t('Ajouter un ancien séjour')}</button> : <form key={editing === 'new' ? 'new' : editing.id} className="editor-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const year = String(data.get('year') || ''); const value: PersonalVisit = { ...(editing === 'new' ? { id: uid('visit'), stayId: uid('stay') } : editing), country: info.code, label: String(data.get('label') || '').trim(), year: data.get('date') ? Number(String(data.get('date')).slice(0, 4)) : year ? Number(year) : undefined, date: String(data.get('date') || '') || undefined }; onChange({ ...world, visits: [...world.visits.filter(v => v.id !== value.id), value] }); setEditing(null); }}><label className="field">{t('Souvenir du séjour')}<input name="label" maxLength={300} defaultValue={editing === 'new' ? '' : editing.label}/></label><label className="field">{t('Année (facultative)')}<input name="year" type="number" min={1} max={9999} defaultValue={editing === 'new' ? '' : editing.year}/></label><label className="field">{t('Date du séjour (facultative)')}<input type="date" name="date" defaultValue={editing === 'new' ? '' : editing.date}/></label><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>{t('Annuler')}</button><button className="btn btn-primary">{t('Enregistrer le séjour')}</button></div></form>}
    </div></Modal>}
  </section>;
}
