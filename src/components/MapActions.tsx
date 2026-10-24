import { useState } from 'react';
import { Car, Check, ChevronDown, Copy, Footprints, MapPin, Navigation, Route, TramFront } from 'lucide-react';
import { directionsLink, type Place, type TravelMode } from '../maps';
import { googlePlaceLink } from '../lib';
import type { City } from '../types';
import { useLocale } from '../i18n';
import { useMapPreferences } from '../MapPreferences';
import { preferredMapCity } from '../map-preferences';
import './MapActions.css';

const modes = [
  { mode: 'walking', label: 'À pied', Icon: Footprints },
  { mode: 'driving', label: 'Voiture', Icon: Car },
  { mode: 'transit', label: 'Transports', Icon: TramFront },
] as const satisfies readonly { mode: TravelMode; label: string; Icon: typeof Footprints }[];

export default function MapActions({ city: sourceCity, place, next }: { city: City; place: Place; next?: Place }) {
  const { t } = useLocale();
  const { provider } = useMapPreferences();
  const city = preferredMapCity(sourceCity, provider);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const address = [place.chineseName || place.title, city.chineseName || city.name, place.address].filter(Boolean).join(' ');
  const label = place.address?.trim() ? place.address : place.chineseName || place.title;
  return <div className="map-actions">
    <details className="map-route" name="detours-place-actions" onKeyDown={event => {
      if (event.key === 'Escape' && event.currentTarget.open) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector('summary')?.focus();
      }
    }} onBlur={event => {
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
    }}>
      <summary className="map-route-toggle" aria-label={t('Actions pour {name}', { name: label })}><MapPin size={14} aria-hidden="true"/><span>{label}</span><ChevronDown className="map-route-chevron" size={13} aria-hidden="true"/></summary>
      <div className="map-route-panel">
        <a className="map-place-link" href={googlePlaceLink(city, place)} target="_blank" rel="noopener noreferrer"><MapPin size={14} aria-hidden="true"/>{t('Voir sur Google Maps')}<span aria-hidden="true"> ↗</span></a>
        {provider === 'google' ? <>
          <div className="map-route-actions" role="group" aria-label={t('Calculer un trajet')}>
            {modes.map(({ mode, label: modeLabel, Icon }) => <a key={mode} href={directionsLink(city, place, mode)} aria-label={`${t('Y aller')} · ${t(modeLabel)}`} target="_blank" rel="noopener noreferrer"><Icon size={14} aria-hidden="true"/>{t(modeLabel)}</a>)}
          </div>
          {next && <details className="map-next-route"><summary><Route size={14} aria-hidden="true"/>{t('De ce lieu au suivant')}<ChevronDown size={13} aria-hidden="true"/></summary><div className="map-route-actions">
            {modes.map(({ mode, label: modeLabel, Icon }) => <a key={mode} href={directionsLink(city, next, mode, place)} aria-label={`${t('De ce lieu au suivant')} · ${t(modeLabel)}`} target="_blank" rel="noopener noreferrer"><Icon size={14} aria-hidden="true"/>{t(modeLabel)}</a>)}
          </div></details>}
        </> : <><a href={directionsLink(city, place)} target="_blank" rel="noopener noreferrer"><Navigation size={14} aria-hidden="true"/>{t('Y aller')} · Amap ↗</a><p className="map-route-hint">{t('Choisis ton trajet et ton mode de transport dans Amap.')}</p></>}
        <small>{t('Les trajets externes nécessitent Internet. L’adresse reste disponible ici.')}</small>
      </div>
    </details>
    <button className="text-btn map-copy" aria-label={t(copied ? 'Copié !' : 'Copier l’adresse')} title={t(copied ? 'Copié !' : 'Copier l’adresse')} onClick={async () => {
      try { await navigator.clipboard.writeText(address); setCopied(true); setCopyError(false); }
      catch { setCopyError(true); }
    }}>{copied ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}</button>
    <span className="sr-only" role="status">{copied ? t('Copié !') : ''}</span>
    {copyError && <span className="map-copy-error" role="status">{address}</span>}
  </div>;
}
