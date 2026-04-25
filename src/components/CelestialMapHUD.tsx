import React, { useCallback, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toPng } from 'html-to-image';
import { Download, Target, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Compass from './Compass';

// Fix for default marker icons in Leaflet - Observer (Blue)
const BlueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

// Custom Target Icon (Red)
const TargetIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = BlueIcon; // Set default to blue

interface CelestialMapHUDProps {
  lat: number;
  lng: number;
  sunAzimuth: number;
  moonAzimuth: number;
  magneticDeclination: number;
}

interface TargetPoint {
  lat: number;
  lng: number;
  alt: number | null;
  distance: number; // meters
  bearing: number;  // degrees (True North)
  elevationAngle: number | null; // degrees
}

const SetMapState: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
};

// Calculation helpers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of Earth in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360; // range [0, 360]
};

const MapEvents: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const CelestialMapHUD: React.FC<CelestialMapHUDProps> = ({ lat, lng, sunAzimuth, moonAzimuth, magneticDeclination }) => {
  const hudRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(12);
  const [target, setTarget] = useState<TargetPoint | null>(null);
  const [observerAlt, setObserverAlt] = useState<number | null>(null);

  useEffect(() => {
    const fetchObserverAlt = async () => {
      try {
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
        if (response.ok) {
          const data = await response.json();
          setObserverAlt(data.results[0].elevation);
        }
      } catch (e) {
        console.log('Observer elevation fetch failed');
      }
    };
    fetchObserverAlt();
  }, [lat, lng]);

  const exportAsPng = useCallback(async () => {
    if (hudRef.current === null) return;
    await new Promise(r => setTimeout(r, 800));
    try {
      const dataUrl = await toPng(hudRef.current, {
        cacheBust: true,
        backgroundColor: '#0F1115',
        canvasWidth: 1200,
        canvasHeight: 800,
      });
      const link = document.createElement('a');
      link.download = `Observation_${new Date().toISOString().slice(0,10)}_${lat.toFixed(2)}N.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [lat, lng]);

  const handleMapClick = async (tLat: number, tLng: number) => {
    const distance = calculateDistance(lat, lng, tLat, tLng);
    const bearing = calculateBearing(lat, lng, tLat, tLng);
    
    setTarget({
      lat: tLat,
      lng: tLng,
      alt: null,
      distance,
      bearing,
      elevationAngle: null
    });

    try {
      const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${tLat},${tLng}`);
      if (response.ok) {
        const data = await response.json();
        const alt = data.results[0].elevation;
        
        let elAngle = null;
        if (observerAlt !== null) {
          const altDiff = alt - observerAlt;
          elAngle = Math.atan2(altDiff, distance) * 180 / Math.PI;
        }

        setTarget(prev => prev ? { ...prev, alt, elevationAngle: elAngle } : null);
      }
    } catch (e) {
      console.log('Target elevation fetch failed');
    }
  };

  const clearTarget = () => setTarget(null);

  const zoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const zoomOut = () => setZoom(prev => Math.max(prev - 1, 3));

  return (
    <div className="space-y-4">
      <div 
        ref={hudRef}
        className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border-tech bg-bg-dark hud-container"
      >
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          zoomControl={false}
          scrollWheelZoom={true}
          className="h-full w-full shadow-inner"
        >
          <TileLayer
            attribution='&copy; OpenTopoMap'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
            maxZoom={17}
          />
          <Marker position={[lat, lng]} icon={BlueIcon} />
          {target && (
            <>
              <Marker position={[target.lat, target.lng]} icon={TargetIcon} />
              {/* Gradient Dashed Line Implementation */}
              {(() => {
                const segments = 10;
                const lines = [];
                for (let i = 0; i < segments; i++) {
                  const t1 = i / segments;
                  const t2 = (i + 1) / segments;
                  
                  const p1: [number, number] = [
                    lat + (target.lat - lat) * t1,
                    lng + (target.lng - lng) * t1
                  ];
                  const p2: [number, number] = [
                    lat + (target.lat - lat) * t2,
                    lng + (target.lng - lng) * t2
                  ];

                  // Color interpolation: Blue (0, 209, 255) -> Red (239, 68, 68)
                  const r = Math.round(0 + (239 - 0) * t1);
                  const g = Math.round(209 + (68 - 209) * t1);
                  const b = Math.round(255 + (68 - 255) * t1);
                  const color = `rgb(${r}, ${g}, ${b})`;

                  lines.push(
                    <Polyline 
                      key={`seg-${i}`}
                      positions={[p1, p2]}
                      pathOptions={{ 
                        color: color, 
                        dashArray: '10, 10', 
                        weight: 3, 
                        opacity: 0.8,
                        lineCap: 'round'
                      }} 
                    />
                  );
                }
                return lines;
              })()}
            </>
          )}
          <SetMapState lat={lat} lng={lng} zoom={zoom} />
          <MapEvents onMapClick={handleMapClick} />
        </MapContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
          <Compass 
            sunAzimuth={sunAzimuth} 
            moonAzimuth={moonAzimuth} 
            magneticDeclination={magneticDeclination}
          />
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
           <button onClick={zoomIn} className="glass p-2 hover:bg-accent-blue/20 transition-all text-accent-blue border border-accent-blue/30"><ZoomIn size={18} /></button>
           <button onClick={zoomOut} className="glass p-2 hover:bg-accent-blue/20 transition-all text-accent-blue border border-accent-blue/30"><ZoomOut size={18} /></button>
           {target && (
             <button onClick={clearTarget} className="glass p-2 hover:bg-red-500/20 transition-all text-red-400 border border-red-500/30">
               <Crosshair size={18} />
             </button>
           )}
        </div>

        <div className="absolute top-4 left-4 z-[1000] glass p-3 border-l-2 border-l-accent-blue min-w-[200px] shadow-2xl">
          <div className="flex items-center gap-2 mb-2 border-b border-border-tech/50 pb-1">
            <Target size={14} className="text-accent-blue" />
            <p className="label-tech text-[10px] text-accent-blue uppercase tracking-widest font-bold">Station Info</p>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[8px] opacity-50 uppercase mb-0.5 tracking-tighter">Station (Observer)</p>
              <p className="font-mono text-xs text-white/90">{lat.toFixed(6)}° N, {lng.toFixed(6)}° E</p>
              <p className="font-mono text-[10px] text-accent-blue/70">Elev: {observerAlt !== null ? `${observerAlt.toFixed(1)}m` : '--'}</p>
            </div>

            {target ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 border-t border-border-tech/30 pt-2"
              >
                <div>
                  <p className="text-[8px] text-accent-blue uppercase mb-0.5 tracking-tighter font-bold">Target Position</p>
                  <p className="font-mono text-xs text-accent-blue">{target.lat.toFixed(6)}° N, {target.lng.toFixed(6)}° E</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-muted p-1 px-2 border border-border-tech/30">
                    <p className="text-[7px] opacity-50 uppercase tracking-tighter">Elevation</p>
                    <p className="font-mono text-xs text-accent-blue tracking-tighter">{target.alt !== null ? `${target.alt.toFixed(1)}m` : '---'}</p>
                  </div>
                  <div className="glass-muted p-1 px-2 border border-border-tech/30">
                    <p className="text-[7px] opacity-50 uppercase tracking-tighter">Straight Dist</p>
                    <p className="font-mono text-xs text-accent-blue tracking-tighter">{(target.distance / 1000).toFixed(3)} km</p>
                  </div>
                  <div className="glass-muted p-1 px-2 border border-border-tech/30">
                    <p className="text-[7px] opacity-50 uppercase tracking-tighter">Bearing (TN)</p>
                    <p className="font-mono text-xs text-accent-blue tracking-tighter">{target.bearing.toFixed(2)}°</p>
                  </div>
                  <div className="glass-muted p-1 px-2 border border-border-tech/30">
                    <p className="text-[7px] opacity-50 uppercase tracking-tighter">Pitch Angle</p>
                    <p className="font-mono text-xs text-accent-blue tracking-tighter">
                      {target.elevationAngle !== null ? `${target.elevationAngle.toFixed(2)}°` : '---'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="border-t border-border-tech/30 pt-2">
                <p className="text-[8px] opacity-40 uppercase animate-pulse">Scanning Terrain...</p>
                <div className="mt-2 text-[10px] text-text-muted italic leading-tight">
                  Click map to designate custom coordinate
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          <div className="glass p-1 px-3 border-r-2 border-r-accent-blue">
            <p className="font-mono text-[8px] text-accent-blue/70 uppercase tracking-[0.2em]">{magneticDeclination > 0 ? '+' : ''}{magneticDeclination.toFixed(1)}° VAR</p>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-[1000] glass p-1 px-3">
          <p className="font-mono text-[8px] text-accent-blue uppercase tracking-[0.2em] animate-pulse">Sync: Active_Stream</p>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] glass p-1 px-3">
          <p className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em]">Map_Ref: OpenTopo_v1.2</p>
        </div>
      </div>

      <button
        onClick={exportAsPng}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#00D1FF10] border border-accent-blue/30 text-accent-blue text-xs font-bold uppercase tracking-[0.3em] hover:bg-accent-blue hover:text-bg-dark hover:border-accent-blue transition-all rounded shadow-lg shadow-accent-blue/5"
      >
        <Download size={16} /> Export Observation (PNG)
      </button>
    </div>
  );
};

export default CelestialMapHUD;
