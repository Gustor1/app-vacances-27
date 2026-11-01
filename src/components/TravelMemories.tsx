import { useEffect, useId, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Camera, Images, LockKeyhole, Plus } from 'lucide-react';
import { Modal } from '../App';
import { useCloud } from '../cloud/CloudProvider';
import { useLocale } from '../i18n';
import { formatCivilDate } from '../locale-utils';
import { readSouvenirs, type Souvenir } from '../souvenirs';
import type { StoredState } from '../types';

function MemoryImage({ src, title }: { src?: string; title: string }) {
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)}/>
    : <span className="memory-image-missing"><Camera size={28}/>{src ? t('Photo illisible.') : t('Souvenir personnel')}</span>;
}

/** Read-only projection of the existing private media store; no new persistence or network. */
export default function TravelMemories({ state, onNavigate }: { state: StoredState; onNavigate?: (city: string, day: string) => void }) {
  const { storage } = useCloud();
  const { t, language } = useLocale();
  const titleId = useId();
  const scope = storage.accountId ? `account:${storage.accountId}` : 'local';
  const trip = state.journey!.id;
  const [media, setMedia] = useState<{ rows: Souvenir[]; urls: Record<string, string> }>({ rows: [], urls: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [opened, setOpened] = useState(false);
  const [album, setAlbum] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    let sequence = 0;
    let urls: Record<string, string> = {};
    const release = () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    const refresh = async () => {
      const request = ++sequence;
      try {
        const rows = await readSouvenirs(scope, trip);
        if (!alive || sequence !== request) return;
        release();
        urls = Object.fromEntries(rows.filter(row => row.photo).map(row => [row.day, URL.createObjectURL(row.photo!)]));
        setMedia({ rows, urls }); setError(false);
      } catch { if (alive && sequence === request) setError(true); }
      finally { if (alive && sequence === request) setLoading(false); }
    };
    const receive = () => { void refresh(); };
    receive();
    window.addEventListener('focus', receive);
    return () => { alive = false; sequence++; release(); window.removeEventListener('focus', receive); };
  }, [scope, trip, reload]);
  const days = state.cities.flatMap(city => city.days.map(day => ({ city, day })));
  const entries = days.flatMap(({ city, day }) => {
    const row = media.rows.find(row => row.day === day.id);
    return row ? [{ ...row, city, title: day.title, date: day.date }] : [];
  });
  const photos = entries.filter(row => row.photo);
  const current = entries.find(row => row.day === selected);
  const currentIndex = entries.findIndex(row => row.day === selected);
  const view = (id: string) => { setSelected(id); setAlbum(true); };
  const first = days[0];
  return <section className="travel-memories" aria-labelledby={titleId}>
    <div className="memory-box-scene" data-open={opened}>
      <div className="memory-box-prints" aria-hidden="true">{photos.slice(0, 3).map((row, index) => <span key={row.day} style={{ '--print-index': index } as CSSProperties}><MemoryImage key={media.urls[row.day]} src={media.urls[row.day]} title=""/><span>{row.title}</span></span>)}{!photos.length && <span className="memory-empty-print"><Camera size={32}/></span>}</div>
      <button type="button" className="memory-box-lid" aria-expanded={opened} aria-label={t(opened ? 'Refermer la boîte à photos' : 'Ouvrir la boîte à photos')} onClick={() => setOpened(!opened)}>
        <span className="memory-box-seal"><Camera size={21}/></span><strong>{t('Les beaux souvenirs')}</strong><span>{state.journey!.title}</span><small>{t('{count} photos', { count: photos.length })}</small>
      </button>
    </div>
    <div className="memory-story">
      <h2 id={titleId}>{t('Les souvenirs du voyage')}</h2>
      <p className="muted">{t('Les petits moments qui restent, même après le retour.')}</p>
      {loading ? <p role="status">{t('Chargement…')}</p> : error ? <p role="status">{t('Stockage des souvenirs indisponible. Le carnet reste utilisable.')} <button type="button" className="text-btn" onClick={() => setReload(value => value + 1)}>{t('Réessayer')}</button></p> : <>
        {photos.length > 0 && <div className="memory-fan" aria-label={t('Photos du voyage')}>{photos.slice(0, 5).map((row, index, items) => <button type="button" key={row.day} className="memory-fan-print" style={{ '--fan-offset': index - (items.length - 1) / 2, '--fan-index': index } as CSSProperties} aria-label={t('Voir le souvenir : {name}', { name: row.title })} onClick={() => view(row.day)}><MemoryImage key={media.urls[row.day]} src={media.urls[row.day]} title=""/><span>{row.title}</span></button>)}</div>}
        {!entries.length && <p className="memory-empty-text">{t('Ajoute une photo à une journée : elle trouvera sa place dans cette boîte.')}</p>}
        <div className="memory-story-actions">{entries.length > 0 && <button type="button" className="btn btn-secondary" onClick={() => { setSelected(null); setAlbum(true); }}><Images size={17}/>{t('Ouvrir mon album')}</button>}{onNavigate && first && <button type="button" className="text-btn" onClick={() => onNavigate(first.city.id, first.day.id)}><Plus size={16}/>{t('Ajouter un souvenir')}</button>}</div>
      </>}
      <p className="memory-privacy"><LockKeyhole size={13}/>{t('Photos et légendes privées, sur cet appareil uniquement.')}</p>
    </div>
    {album && <Modal title={t('Les souvenirs du voyage')} wide onClose={() => { setAlbum(false); setSelected(null); }}>
      <div className="memory-album">
        <p className="memory-privacy"><LockKeyhole size={13}/>{t('Photos et légendes privées, sur cet appareil uniquement.')}</p>
        {current ? <>
          <button className="text-btn" type="button" onClick={() => setSelected(null)}><ArrowLeft size={16}/>{t('Tous les souvenirs')}</button>
          <figure className="memory-viewer" key={current.day}><MemoryImage key={media.urls[current.day]} src={media.urls[current.day]} title={current.title}/><figcaption><h3>{current.title}</h3><p>{current.city.name}{current.date && ` · ${formatCivilDate(current.date, language)}`}</p>{current.caption && <p className="memory-caption">{current.caption}</p>}</figcaption></figure>
          <div className="memory-viewer-nav"><button type="button" className="btn btn-secondary" disabled={currentIndex <= 0} onClick={() => setSelected(entries[currentIndex - 1].day)}><ArrowLeft size={16}/>{t('Souvenir précédent')}</button><span>{currentIndex + 1} / {entries.length}</span><button type="button" className="btn btn-secondary" disabled={currentIndex >= entries.length - 1} onClick={() => setSelected(entries[currentIndex + 1].day)}>{t('Souvenir suivant')}<ArrowRight size={16}/></button></div>
        </> : <div className="memory-album-grid">{entries.map(row => <button type="button" key={row.day} className="memory-album-print" onClick={() => setSelected(row.day)}><MemoryImage key={media.urls[row.day]} src={media.urls[row.day]} title=""/><strong>{row.title}</strong><span>{row.city.name}</span>{row.caption && <span className="memory-caption">{row.caption}</span>}</button>)}</div>}
      </div>
    </Modal>}
  </section>;
}
