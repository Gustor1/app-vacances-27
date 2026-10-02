import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { City, Step } from '../types';
import { amapLink, amapSearch } from '../lib';
import './TripMap.css';
import { useLocale } from '../i18n';

type TripMapProps = {
  cities: City[];
  city: City;
  steps?: Step[];
  selectedStepId?: string;
  onSelectStep?: (id: string) => void;
  overview?: boolean;
  className?: string;
};

function validCoordinates(point?: [number, number]): point is [number, number] {
  return Boolean(point && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180);
}

function searchUrl(city: City, step?: Step): string {
  return step ? amapLink(city, step) : amapSearch(city.chineseName || city.name, '');
}

function markerIcon(index: number, selected = false): L.DivIcon {
  return L.divIcon({
    className: `trip-map-marker${selected ? ' is-selected' : ''}`,
    html: `<span>${index + 1}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

export default function TripMap({ cities, city, steps, selectedStepId, onSelectStep, overview = false, className = '' }: TripMapProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; index: number }>());
  const onSelectRef = useRef(onSelectStep);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  onSelectRef.current = onSelectStep;
  const plottedSteps = (steps ?? city.days.flatMap(day => day.steps)).filter(step => validCoordinates(step.coordinates));
  const hasCoordinates = overview ? cities.some(item => validCoordinates(item.coordinates)) : plottedSteps.length > 0;
  // Only geographic content affects the layers. Editing a note must not reset the map.
  const geographicContent = JSON.stringify(overview
    ? cities.map((item, index) => ({ id: item.id, title: item.name, chineseName: item.chineseName, coordinates: item.coordinates, url: searchUrl(item), index }))
    : (steps ?? city.days.flatMap(day => day.steps)).map((step, index) => ({ id: step.id, title: step.title, chineseName: step.chineseName, coordinates: step.coordinates, url: searchUrl(city, step), index })));
  const mapItems = useMemo(() => JSON.parse(geographicContent) as { id: string; title: string; chineseName?: string; coordinates?: [number, number]; url: string; index: number }[], [geographicContent]);
  const centerLat = validCoordinates(city.coordinates) ? city.coordinates[0] : 35;
  const centerLng = validCoordinates(city.coordinates) ? city.coordinates[1] : 105;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView(validCoordinates(city.coordinates) ? city.coordinates : [35, 105], 11);
    mapRef.current = map;
    map.zoomControl.setPosition('bottomright');
    map.zoomControl.getContainer()?.querySelector('.leaflet-control-zoom-in')?.setAttribute('aria-label', t('Zoomer sur la carte'));
    map.zoomControl.getContainer()?.querySelector('.leaflet-control-zoom-out')?.setAttribute('aria-label', t('Dézoomer sur la carte'));
    // Bundled public-domain country outlines remain usable without tile services.
    const backgroundPane = map.createPane('geographicBackground');
    backgroundPane.style.zIndex = '150';
    backgroundPane.style.pointerEvents = 'none';
    const backgroundRequest = new AbortController();
    fetch(`${import.meta.env.BASE_URL}asia-geography.json`, { signal: backgroundRequest.signal })
      .then(response => { if (!response.ok) throw new Error('Country map unavailable'); return response.json(); })
      .then(data => {
        if (backgroundRequest.signal.aborted) return;
        L.geoJSON(data, {
          pane: 'geographicBackground',
          interactive: false,
          style: { color: '#b7c6aa', weight: 1, fillColor: '#e1e8d7', fillOpacity: 1 },
          attribution: '<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · domaine public',
        }).addTo(map);
      })
      .catch(() => { /* Markers and Amap links remain available if the local background fails. */ });
    let errors = 0;
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    });
    tiles.on('tileerror', () => {
      errors += 1;
      if (errors >= 2) setTilesUnavailable(true);
    });
    tiles.on('tileload', () => { errors = 0; setTilesUnavailable(false); });
    tiles.addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(containerRef.current);
    return () => {
      backgroundRequest.abort();
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // The map instance is created once; the following effect updates its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    markersRef.current.clear();
    const coordinates: [number, number][] = [];
    mapItems.forEach(item => {
      if (!validCoordinates(item.coordinates)) return;
      coordinates.push(item.coordinates);
      const content = document.createElement('div');
      content.className = 'trip-map-popup';
      const heading = document.createElement('strong');
      heading.textContent = item.title;
      content.append(heading);
      if (item.chineseName) {
        const name = document.createElement('span');
        name.textContent = item.chineseName;
        content.append(name);
      }
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = t('Rechercher dans Amap ↗');
      content.append(link);
      const marker = L.marker(item.coordinates, { icon: markerIcon(item.index), title: `${item.index + 1}. ${item.title}`, keyboard: true })
        .bindPopup(content)
        .addTo(layer);
      if (overview) {
        const label = document.createElement('span');
        label.textContent = item.title;
        marker.bindTooltip(label, { permanent: true, direction: item.index % 2 ? 'left' : 'right', offset: [item.index % 2 ? -18 : 18, 0], className: 'trip-map-city-label', opacity: 1 });
      } else {
        marker.on('click', () => onSelectRef.current?.(item.id));
        markersRef.current.set(item.id, { marker, index: item.index });
      }
    });
    if (!coordinates.length && validCoordinates(city.coordinates)) {
      const label = document.createElement('span');
      label.textContent = t('{city} · centre indicatif', {city: city.name});
      const content = document.createElement('div');
      content.className = 'trip-map-popup';
      const heading = document.createElement('strong');
      heading.textContent = t('{city} · centre indicatif', {city: city.name});
      const link = document.createElement('a');
      link.href = searchUrl(city);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = t('Rechercher la ville dans Amap ↗');
      content.append(heading, link);
      L.marker([centerLat, centerLng], {
        icon: L.divIcon({ className: 'trip-map-marker trip-map-center-marker', html: '<span>·</span>', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18] }),
        title: t('{city} · centre indicatif', {city: city.name}),
        keyboard: true,
      }).bindPopup(content).bindTooltip(label, { permanent: true, direction: 'bottom', offset: [0, 18], className: 'trip-map-city-label', opacity: 1 }).addTo(layer);
    }
    if (overview && coordinates.length > 1) L.polyline(coordinates, { color: '#64826c', weight: 2, opacity: 0.75, dashArray: '6 9', interactive: false }).addTo(layer);
    if (coordinates.length > 1) map.fitBounds(L.latLngBounds(coordinates), { padding: [46, 46], maxZoom: 14, animate: false });
    else if (coordinates.length === 1) map.setView(coordinates[0], overview ? 7 : 13, { animate: false });
    else map.setView([centerLat, centerLng], validCoordinates(city.coordinates) ? 11 : 4, { animate: false });
    return () => { layer.remove(); markersRef.current.clear(); };
  }, [mapItems, centerLat, centerLng, overview, city.name, city.chineseName, city.coordinates, t]);

  useEffect(() => {
    const controls = mapRef.current?.zoomControl.getContainer();
    controls?.querySelector('.leaflet-control-zoom-in')?.setAttribute('aria-label', t('Zoomer sur la carte'));
    controls?.querySelector('.leaflet-control-zoom-out')?.setAttribute('aria-label', t('Dézoomer sur la carte'));
  }, [t]);

  useEffect(() => {
    markersRef.current.forEach(({ marker, index }, id) => {
      const selected = id === selectedStepId;
      marker.setIcon(markerIcon(index, selected));
      if (selected) {
        marker.openPopup();
        if (!mapRef.current?.getBounds().contains(marker.getLatLng())) mapRef.current?.panTo(marker.getLatLng());
      }
    });
  }, [selectedStepId, mapItems, centerLat, centerLng, overview, t]);

  return (
    <section className={`trip-map ${className}`} aria-label={overview ? t('Carte des villes du voyage') : t('Carte des étapes à {city}', {city:city.name})}>
      <div className="trip-map-stage">
        <div className="trip-map-canvas" ref={containerRef} />
        {!hasCoordinates && <div className="trip-map-notice" role="status">{t('Vue de {city} · Ces étapes n’ont pas encore de repère précis.', {city:city.name})}</div>}
      </div>
      <div className="trip-map-footer">
        <span className="trip-map-legend-dot" aria-hidden="true" />
        <span>{t('Repères approximatifs · itinéraires dans Amap')}</span>{!overview && <span className="trip-map-route-note">{t('{count} / {total} étapes repérées · autres adresses dans le planning', {count:plottedSteps.length,total:(steps ?? city.days.flatMap(day=>day.steps)).length})}</span>}
        {overview && <span className="trip-map-route-note">{t('Pointillés : ordre des étapes, pas un itinéraire routier.')}</span>}
      </div>
      {tilesUnavailable && (
        <div className="trip-map-fallback" role="status">
          <p>{t(overview ? 'Fond détaillé indisponible · contours des pays et repères indicatifs.' : 'Fond détaillé indisponible · repères indicatifs, sans rues. Itinéraires dans Amap.')}</p>
          <div className="trip-map-fallback-links">
            {overview ? cities.slice(0, 5).map(item => <a key={item.id} href={searchUrl(item)} target="_blank" rel="noopener noreferrer">{item.name} ↗</a>) : (steps ?? city.days.flatMap(day => day.steps)).slice(0, 4).map(step => <a key={step.id} href={searchUrl(city, step)} target="_blank" rel="noopener noreferrer">{step.title} ↗</a>)}
            {!overview && <a href={searchUrl(city)} target="_blank" rel="noopener noreferrer">{t('Carte de {city} ↗',{city:city.name})}</a>}
          </div>
        </div>
      )}
    </section>
  );
}
