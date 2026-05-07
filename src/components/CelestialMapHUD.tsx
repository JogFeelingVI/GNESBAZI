import React, { useCallback, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toPng } from 'html-to-image';
import { Download, Target, ZoomIn, ZoomOut, Crosshair, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Compass from './Compass';
import { MapMarker } from '../App';

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

// Custom Gold Icon for Marks
const GoldIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = BlueIcon; // Set default to blue

interface CelestialMapHUDProps {
  lat: number;
  lng: number;
  markers: MapMarker[];
  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
  setInputLat: (val: string) => void;
  setInputLng: (val: string) => void;
  sunAzimuth: number;
  moonAzimuth: number;
  magneticDeclination: number;
  onMark: () => void;
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
    const center = map.getCenter();
    const isSame = Math.abs(center.lat - lat) < 0.0001 && Math.abs(center.lng - lng) < 0.0001;
    if (!isSame) {
      map.setView([lat, lng], zoom, { animate: true });
    }
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

const MapEvents: React.FC<{ onMapMove: (lat: number, lng: number) => void }> = ({ onMapMove }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMapMove(center.lat, center.lng);
    },
  });
  return null;
};

const CelestialMapHUD: React.FC<CelestialMapHUDProps> = ({ 
  lat, 
  lng, 
  markers, 
  setLat, 
  setLng, 
  setInputLat, 
  setInputLng, 
  sunAzimuth, 
  moonAzimuth, 
  magneticDeclination,
  onMark
}) => {
  const hudRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(12);
  const [target, setTarget] = useState<TargetPoint | null>(null);
  const [observerAlt, setObserverAlt] = useState<number | null>(null);
  const [isStationInfoCollapsed, setIsStationInfoCollapsed] = useState(false);
  const [isTargetInfoCollapsed, setIsTargetInfoCollapsed] = useState(false);

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
    
    // Wait for any pending transitions or Leaflet tiles to settle
    await new Promise(r => setTimeout(r, 1000));
    
    try {
      const el = hudRef.current;
      
      // Use actual dimensions to prevent distortion
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: '#0F1115',
        width: width,
        height: height,
        pixelRatio: 2, // Sharp high-res output
        style: {
          borderRadius: '0' // Remove rounded corners for a cleaner export
        }
      });
      
      const link = document.createElement('a');
      link.download = `Observation_${new Date().toISOString().slice(0, 10)}_${lat.toFixed(2)}N.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [lat, lng]);

  const handleMapMove = (nLat: number, nLng: number) => {
    // Normalize coordinates for tz-lookup and other calculations
    const wrapped = L.latLng(nLat, nLng).wrap();
    const finalLat = wrapped.lat;
    const finalLng = wrapped.lng;

    setLat(finalLat);
    setLng(finalLng);
    setInputLat(finalLat.toFixed(4));
    setInputLng(finalLng.toFixed(4));
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
          className="h-full w-full shadow-inner brightness-[0.85] contrast-[1.2]"
        >
          <TileLayer
            attribution='&copy; OpenTopoMap'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
            maxZoom={17}
          />
          
          {/* Marked Locations */}
          {markers.map(m => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={GoldIcon} />
          ))}

          <Marker position={[lat, lng]} icon={BlueIcon} />
          <SetMapState lat={lat} lng={lng} zoom={zoom} />
          <MapEvents onMapMove={handleMapMove} />
        </MapContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500] mix-blend-difference">
          <Compass 
            sunAzimuth={sunAzimuth} 
            moonAzimuth={moonAzimuth} 
            magneticDeclination={magneticDeclination}
            rotation={-magneticDeclination}
          />
          
          {/* HUD Crosshair - Aligned with Magnetic North (MN) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${magneticDeclination}deg)` }}
          >
            {/* Horizontal Line (MN East-West) */}
            <div className="w-[300%] h-[2px] bg-white/90 relative shadow-[0_0_12px_rgba(255,255,255,0.5)]">
            </div>
            {/* Vertical Line (MN Axis) */}
            <div className="h-[300%] w-[2px] bg-white/90 absolute flex flex-col justify-between items-center py-[35%] shadow-[0_0_12px_rgba(255,255,255,0.5)]">
              <span className="font-mono text-[10px] text-white font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" style={{ transform: `rotate(${-magneticDeclination}deg)` }}>Mag_North</span>
              <span className="font-mono text-[10px] text-white font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" style={{ transform: `rotate(${-magneticDeclination}deg)` }}>Mag_South</span>
            </div>
          </div>
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

        <div className="absolute top-4 left-4 z-[1000] glass p-3 border-l-2 border-l-accent-blue min-w-[220px] shadow-2xl space-y-3">
          {/* Station Info Section */}
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between gap-2 border-l-2 border-accent-blue pl-2 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setIsStationInfoCollapsed(!isStationInfoCollapsed)}
            >
              <p className="label-tech text-[10px] text-accent-blue uppercase tracking-widest font-bold">Station Info</p>
              {isStationInfoCollapsed ? <ChevronDown size={14} className="text-accent-blue/50" /> : <ChevronUp size={14} className="text-accent-blue/50" />}
            </div>
            
            <AnimatePresence>
              {!isStationInfoCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-2"
                >
                  <p className="text-[8px] opacity-50 uppercase mb-0.5 tracking-tighter">Station (Observer)</p>
                  <p className="font-mono text-xs text-white/90">{lat.toFixed(6)}° N, {lng.toFixed(6)}° E</p>
                  <p className="font-mono text-[10px] text-accent-blue/70">Elev: {observerAlt !== null ? `${observerAlt.toFixed(1)}m` : '--'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Target Section */}
          {target ? (
            <div className="space-y-2 border-t border-border-tech/30 pt-2">
              <div 
                className="flex items-center justify-between gap-2 border-l-2 border-accent-blue pl-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsTargetInfoCollapsed(!isTargetInfoCollapsed)}
              >
                <p className="label-tech text-[10px] text-accent-blue uppercase tracking-widest font-bold">Target Parameters</p>
                {isTargetInfoCollapsed ? <ChevronDown size={14} className="text-accent-blue/50" /> : <ChevronUp size={14} className="text-accent-blue/50" />}
              </div>

              <AnimatePresence>
                {!isTargetInfoCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden pl-2"
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
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="border-t border-border-tech/30 pt-2 animate-pulse">
              <p className="text-[8px] opacity-40 uppercase">Scanning Terrain...</p>
              <button 
                onClick={onMark}
                className="mt-2 text-[10px] text-accent-blue hover:text-white italic leading-tight text-left transition-colors cursor-pointer block select-none group underline decoration-accent-blue/30 group-hover:decoration-white font-bold uppercase tracking-tighter"
              >
                Click here to mark
              </button>
            </div>
          )}
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
