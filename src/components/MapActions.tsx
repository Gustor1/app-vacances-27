import { useState } from 'react';
import { Copy, Navigation } from 'lucide-react';
import { directionsLink, placeLink, type Place, type TravelMode } from '../maps';
import type { City } from '../types';
import { useLocale } from '../i18n';
import './MapActions.css';
import { useMapPreferences } from '../MapPreferences';
import { preferredMapCity } from '../map-preferences';


export default function MapActions({ city: sourceCity, place, next }: { city: City; place: Place; next?: Place }) {
  const { t } = useLocale();
  const { provider } = useMapPreferences();
  const city = preferredMapCity(sourceCity, provider);
  const [mode, setMode] = useState<TravelMode>('walking');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const google = city.mapProvider === 'google';
  const address = [place.chineseName || place.title, city.chineseName || city.name, place.address].filter(Boolean).join(' ');
  return <div className="map-actions">
    <div className="map-place-actions"><a className="amap-link" href={placeLink(city, place)} target="_blank" rel="noopener noreferrer"><Navigation size={12}/>{t(google ? 'Voir ce lieu' : 'Ouvrir dans {map}', { map: 'Amap' })}<span aria-hidden="true"> ↗</span></a><span className="map-provider">{google?'Google Maps':'Amap'}</span>
      <button className="text-btn" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}><Copy size={12}/>{t(copied ? 'Copié !' : 'Copier l’adresse')}</button>
    </div>
    {google ? <fieldset className="map-route"><legend>{t('Calculer un trajet')}</legend><div className="map-route-actions"><label className="map-mode"><span>{t('Mode de déplacement')}</span><select aria-label={t('Mode de déplacement')} value={mode} onChange={e => setMode(e.target.value as TravelMode)}><option value="walking">{t('À pied')}</option><option value="driving">{t('Voiture')}</option><option value="transit">{t('Transports')}</option></select></label><a className="amap-link" href={directionsLink(city, place, mode)} target="_blank" rel="noopener noreferrer">{t('Y aller')} ↗</a>{next&&<a className="amap-link" href={directionsLink(city,next,mode,place)} target="_blank" rel="noopener noreferrer">{t('De ce lieu au suivant')} ↗</a>}</div><p className="map-route-hint">{t('Le mode choisi concerne le trajet, pas la recherche du lieu.')}</p></fieldset> : <p className="map-route-hint">{t('Choisis ton trajet et ton mode de transport dans Amap.')}</p>}
    {copyError && <span className="map-copy-error" role="status">{address}</span>}
    <small>{t('Les trajets externes nécessitent Internet. L’adresse reste disponible ici.')}</small>
  </div>;
}
