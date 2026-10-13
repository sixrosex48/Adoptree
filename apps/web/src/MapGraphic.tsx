import { useEffect, useRef, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import type { Zone } from './types';

const SCRIPT_URL = 'https://unpkg.com/maplibre-gl@5.12.0/dist/maplibre-gl.js';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
// Keep the outline larger than the marker when zoomed out, then grow it with the map.
const REGION_RADIUS = ['interpolate', ['exponential', 2], ['zoom'], 9, 25, 10, 25, 11, 28, 12, 45, 13, 80, 14, 150, 15, 290];

type Coordinates = [number, number];
type MapInstance = {
  on: (event: string, callback: () => void) => void;
  addControl: (control: unknown, position: string) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  setFilter: (id: string, filter: unknown[]) => void;
  fitBounds: (bounds: [Coordinates, Coordinates], options: Record<string, unknown>) => void;
  flyTo: (options: Record<string, unknown>) => void;
  remove: () => void;
};
type MarkerInstance = {
  setLngLat: (coordinates: Coordinates) => MarkerInstance;
  addTo: (map: MapInstance) => MarkerInstance;
  remove: () => void;
};
type MapLibre = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  Marker: new (options: Record<string, unknown>) => MarkerInstance;
  NavigationControl: new (options: Record<string, unknown>) => unknown;
};

let scriptPromise: Promise<MapLibre> | null = null;

function loadMapLibre(): Promise<MapLibre> {
  const current = (window as Window & { maplibregl?: MapLibre }).maplibregl;
  if (current) return Promise.resolve(current);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<MapLibre>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = window.setTimeout(() => reject(new Error('El mapa tardó demasiado en cargar.')), 12000);
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timer);
      const library = (window as Window & { maplibregl?: MapLibre }).maplibregl;
      library ? resolve(library) : reject(new Error('MapLibre no está disponible.'));
    };
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('No se pudo cargar MapLibre.')); };
    document.head.appendChild(script);
  }).catch((error: unknown) => { scriptPromise = null; throw error; });
  return scriptPromise;
}

function toLngLat(zone: Zone): Coordinates {
  return [zone.coordinates[1], zone.coordinates[0]];
}

function FallbackMap({ zones, selected, onSelect, interactive }: MapGraphicProps) {
  return <div className="map-graphic map-fallback" aria-label="Mapa de respaldo con zonas de referencia de Bucaramanga">
    <svg className="map-lines" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="600" height="420" fill="#edf2e6" />
      <path d="M0 90 Q145 40 248 94 T600 72 L600 0 L0 0Z" fill="#dfeace" />
      <path d="M0 275 Q132 231 226 282 T600 250 L600 420 L0 420Z" fill="#dce8ce" />
      <path d="M414 -30 Q360 80 430 170 T434 450" stroke="#c8dcc3" strokeWidth="75" fill="none" opacity=".65" />
      <path d="M-20 250 Q150 220 240 180 T620 157 M80 -20 Q128 72 182 132 T244 440 M322 -20 Q286 110 332 180 T590 420 M-30 355 Q110 336 248 284 T620 310" stroke="#fffefa" strokeWidth="15" fill="none" />
      <path d="M-20 250 Q150 220 240 180 T620 157 M80 -20 Q128 72 182 132 T244 440 M322 -20 Q286 110 332 180 T590 420 M-30 355 Q110 336 248 284 T620 310" stroke="#d9e2d2" strokeWidth="2" fill="none" />
    </svg>
    {zones.map((zone) => <span key={zone.id} className={`map-region ${selected === zone.id ? 'active' : ''}`} style={{ left: `${zone.mapPosition[0]}%`, top: `${zone.mapPosition[1]}%` }} aria-hidden="true" />)}
    <div className="map-place" style={{ left: '47%', top: '52%' }}>BUCARAMANGA</div>
    {zones.map((zone) => <button key={zone.id} type="button" disabled={!interactive} onClick={() => onSelect?.(zone.id)} className={`map-pin ${selected === zone.id ? 'active' : ''}`} style={{ left: `${zone.mapPosition[0]}%`, top: `${zone.mapPosition[1]}%` }} aria-label={`Seleccionar ${zone.name}`} title={zone.name}><MapPin size={23} fill="currentColor" /></button>)}
    <span className="map-region-legend"><span /> Zonas aproximadas (radio ~1 km)</span>
    <span className="map-compass"><Compass size={16} /> N</span>
    <span className="map-watermark">Mapa sin conexión</span>
  </div>;
}

type MapGraphicProps = {
  zones: Zone[];
  selected?: string;
  onSelect?: (id: string) => void;
  interactive?: boolean;
};

export default function MapGraphic({ zones, selected, onSelect, interactive = true }: MapGraphicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<Array<{ id: string; element: HTMLButtonElement; marker: MarkerInstance }>>([]);
  const onSelectRef = useRef(onSelect);
  const [focused, setFocused] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const activeId = selected ?? focused;

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    let loadTimer = 0;
    loadMapLibre().then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [-73.116, 7.1235],
        zoom: 11.2,
        attributionControl: true,
        interactive,
      });
      mapRef.current = map;
      if (interactive) map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');

      for (const [index, zone] of zones.entries()) {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = 'real-map-marker';
        element.textContent = String(index + 1);
        element.title = zone.name;
        element.setAttribute('aria-label', `Seleccionar ${zone.name}`);
        element.disabled = !interactive;
        element.addEventListener('click', () => {
          setFocused(zone.id);
          onSelectRef.current?.(zone.id);
        });
        const marker = new maplibre.Marker({ element, anchor: 'center' }).setLngLat(toLngLat(zone)).addTo(map);
        markersRef.current.push({ id: zone.id, element, marker });
      }

      map.on('load', () => {
        if (cancelled) return;
        map.addSource('planting-regions', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: zones.map((zone) => ({
              type: 'Feature',
              properties: { id: zone.id },
              geometry: { type: 'Point', coordinates: toLngLat(zone) },
            })),
          },
        });
        map.addLayer({ id: 'planting-regions-fill', type: 'circle', source: 'planting-regions', paint: { 'circle-radius': REGION_RADIUS, 'circle-color': '#579461', 'circle-opacity': 0.15 } });
        map.addLayer({ id: 'planting-regions-active', type: 'circle', source: 'planting-regions', filter: ['==', ['get', 'id'], activeId ?? ''], paint: { 'circle-radius': REGION_RADIUS, 'circle-color': '#438750', 'circle-opacity': 0.16 } });
        map.addLayer({ id: 'planting-regions-border', type: 'circle', source: 'planting-regions', paint: { 'circle-radius': REGION_RADIUS, 'circle-color': '#397849', 'circle-opacity': 0, 'circle-stroke-color': '#397849', 'circle-stroke-opacity': 0.85, 'circle-stroke-width': 2 } });
        const latitudes = zones.map((zone) => zone.coordinates[0]);
        const longitudes = zones.map((zone) => zone.coordinates[1]);
        if (zones.length > 1 && !selected) {
          map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 55, maxZoom: 11.5, animate: false });
        }
        setReady(true);
        window.clearTimeout(loadTimer);
      });
      loadTimer = window.setTimeout(() => { if (!cancelled) setFailed(true); }, 15000);
    }).catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Zone fixtures are stable for the lifetime of a map view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, interactive]);

  useEffect(() => {
    markersRef.current.forEach(({ id, element }) => element.classList.toggle('active', id === activeId));
    const zone = zones.find((item) => item.id === activeId);
    if (ready) mapRef.current?.setFilter('planting-regions-active', ['==', ['get', 'id'], activeId ?? '']);
    if (zone && ready) mapRef.current?.flyTo({ center: toLngLat(zone), zoom: interactive ? 12.5 : 12, duration: 550 });
  }, [activeId, interactive, ready, zones]);

  useEffect(() => {
    if (!failed) return;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    mapRef.current?.remove();
    mapRef.current = null;
  }, [failed]);

  if (failed) return <FallbackMap zones={zones} selected={activeId} onSelect={(id) => { setFocused(id); onSelectRef.current?.(id); }} interactive={interactive} />;

  return <div className="map-graphic map-live" aria-label="Mapa interactivo de zonas de referencia en Bucaramanga">
    <div className="map-canvas" ref={containerRef} />
    {!ready && <div className="map-loading">Cargando mapa…</div>}
    {ready && <div className="map-zone-list" aria-label="Zonas del mapa">{zones.map((zone, index) => <button key={zone.id} type="button" className={activeId === zone.id ? 'active' : ''} disabled={!interactive} onClick={() => { setFocused(zone.id); onSelectRef.current?.(zone.id); }}><span>{index + 1}</span>{zone.name}</button>)}</div>}
    {ready && <span className="map-region-legend"><span /> Zonas aproximadas (radio ~1 km)</span>}
  </div>;
}
