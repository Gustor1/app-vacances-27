import { ArrowRight, Bird, CalendarDays } from 'lucide-react';
import { useLocale } from '../i18n';
import { formatCivilDate } from '../locale-utils';
import { tripTiming, type TripTiming, type TimingInput } from '../trip-timing';
import type { StoredState } from '../types';
import './TripTiming.css';

export function useTimingLabel() {
  const { t } = useLocale();
  return (timing: TripTiming) => {
    switch (timing.phase) {
      case 'upcoming': return timing.before === 1 ? t('Départ demain') : t('Départ dans {count} jours', { count: timing.before! });
      case 'during': return timing.total ? t('Jour {day} sur {total}', { day: timing.day!, total: timing.total }) : t('Jour {day}', { day: timing.day! });
      case 'past': return t('Dates prévues passées');
      case 'completed': return t('Voyage terminé');
      case 'cancelled': return t('Voyage annulé');
      case 'invalid': return t('Dates à vérifier');
      default: return t('Dates à préciser');
    }
  };
}
export function TimingBadge({ trip, instant }: { trip: TimingInput; instant: Date }) {
  const label = useTimingLabel();
  return <span className="trip-timing-badge"><CalendarDays size={13} aria-hidden="true"/>{label(tripTiming(trip, instant))}</span>;
}
export function TimingReminder({ trip, instant, onOpen }: { trip: TimingInput; instant: Date; onOpen: (view: 'now' | 'overview' | 'planning') => void }) {
  const label = useTimingLabel();
  const timing = tripTiming(trip, instant);
  const view = timing.phase === 'during' ? 'now' : ['past', 'completed'].includes(timing.phase) ? 'overview' : 'planning';
  return <button className="trip-timing-reminder" onClick={() => onOpen(view)}><CalendarDays size={15} aria-hidden="true"/>{label(timing)}<ArrowRight size={14} aria-hidden="true"/></button>;
}
export default function TripTimingCard({ trip, trips, instant, selected, onSelect, onOpen }: { trip: StoredState; trips: StoredState[]; instant: Date; selected: string; onSelect: (id: string) => void; onOpen: (id: string, view: 'now' | 'overview' | 'planning') => void }) {
  const { t, language } = useLocale();
  const label = useTimingLabel();
  const timing = tripTiming(trip, instant);
  const after = timing.phase === 'past' || timing.phase === 'completed';
  const action = after ? t('Revoir mes souvenirs') : timing.phase === 'during' ? t('Voir ma journée') : t('Préparer mon voyage');
  const heading = timing.phase === 'upcoming' && timing.before! > 1 ? t('J−{count}', { count: timing.before! }) : timing.phase === 'during' && timing.day === 1 ? t('C’est le jour du départ !') : timing.phase === 'past' ? t('Un voyage à se remémorer') : label(timing);
  return <section className="trip-timing" aria-label={t('Le voyage au fil des jours')}>
    <div className="trip-timing-copy"><h2>{trip.journey!.title}</h2><p className="trip-timing-number" aria-label={label(timing)}>{heading}</p>
      <p className="trip-timing-detail">{timing.phase === 'past' ? t(timing.since === 1 ? 'Fin prévue il y a 1 jour' : 'Fin prévue il y a {count} jours', { count: timing.since! }) : timing.phase === 'completed' ? t('Retrouve le carnet et ses souvenirs.') : <>{trip.departureDate && <time dateTime={trip.departureDate}>{t('Départ le {date}', { date: formatCivilDate(trip.departureDate, language) })}</time>}{' · '}{timing.total ? t(timing.total === 1 ? '1 jour prévu' : '{count} jours prévus', { count: timing.total }) : t('Durée non précisée')}{timing.phase === 'during' && timing.day === 1 && <> · {label(timing)}</>}</>}</p>
      {timing.phase === 'during' && timing.total !== undefined && <div className="trip-timing-track" aria-hidden="true"><span style={{ left: `${timing.total === 1 ? 50 : (timing.day! - 1) / (timing.total - 1) * 100}%` }}><Bird size={20}/></span></div>}
      <p className="trip-timing-calendar">{t('Selon les dates prévues du carnet.')} {timing.fallback && t('Fuseau non précisé ou invalide : calendrier UTC.')}</p>
    </div>
    <div className="trip-timing-controls"><button className="btn btn-primary" onClick={() => onOpen(trip.journey!.id, after ? 'overview' : timing.phase === 'during' ? 'now' : 'planning')}>{action}<ArrowRight size={16} aria-hidden="true"/></button>
      {trips.length > 1 && <TimingChoice trips={trips} selected={selected} onSelect={onSelect}/>}
    </div>
  </section>;
}

export function TimingChoice({ trips, selected, onSelect }: { trips: StoredState[]; selected: string; onSelect: (id: string) => void }) {
  const { t } = useLocale();
  return <label className="trip-timing-choice">{t('Choisir le voyage')}<select value={selected} onChange={e => onSelect(e.target.value)}><option value="">{t('Choix automatique')}</option>{trips.map(item => <option key={item.journey!.id} value={item.journey!.id}>{item.journey!.title}</option>)}</select><small>{t('Choix conservé jusqu’au rechargement de l’accueil.')}</small></label>;
}
