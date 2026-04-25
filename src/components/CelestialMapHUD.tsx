import React, { useCallback, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toPng } from 'html-to-image';
import { Download, Plus, Minus } from 'lucide-react';
import Compass from './Compass';

// Fix for default marker icons in Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface CelestialMapHUDProps {
  lat: number;
  lng: number;
  sunAzimuth: number;
  moonAzimuth: number;
  magneticDeclination: number;
}

const SetMapState: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
};

const CelestialMapHUD: React.FC<CelestialMapHUDProps> = ({ lat, lng, sunAzimuth, moonAzimuth, magneticDeclination }) => {
  const hudRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(12);

  const exportAsPng = useCallback(async () => {
    if (hudRef.current === null) return;
    
    // Brief delay to ensure map tiles are fully rendered for capture
    await new Promise(r => setTimeout(r, 500));

    try {
      const dataUrl = await toPng(hudRef.current, {
        cacheBust: true,
        backgroundColor: '#0F1115',
        style: {
          borderRadius: '0px'
        }
      });
      const link = document.createElement('a');
      link.download = `Celestial_Observation_${lat.toFixed(4)}_${lng.toFixed(4)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  }, [lat, lng]);

  const zoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const zoomOut = () => setZoom(prev => Math.max(prev - 1, 3));

  return (
    <div className="space-y-4">
      <div 
        ref={hudRef}
        className="relative w-full h-[550px] rounded-lg overflow-hidden border border-border-tech bg-bg-dark"
      >
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          zoomControl={false}
          scrollWheelZoom={true}
          className="h-full w-full shadow-inner"
        >
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
            maxZoom={17}
          />
          <Marker position={[lat, lng]} />
          <SetMapState lat={lat} lng={lng} zoom={zoom} />
        </MapContainer>

        {/* HUD Compass Overlay - Perfectly Centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
          <Compass 
            sunAzimuth={sunAzimuth} 
            moonAzimuth={moonAzimuth} 
            magneticDeclination={magneticDeclination}
          />
        </div>

        {/* HUD Overlay - Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
           <button 
             onClick={zoomIn}
             className="glass p-2 hover:bg-accent-blue hover:text-bg-dark transition-all text-accent-blue"
           >
             <Plus size={18} />
           </button>
           <button 
             onClick={zoomOut}
             className="glass p-2 hover:bg-accent-blue hover:text-bg-dark transition-all text-accent-blue"
           >
             <Minus size={18} />
           </button>
        </div>

        {/* Coordinate Overlay Box */}
        <div className="absolute top-4 left-4 z-[1000] glass p-2 px-3 border-l-2 border-l-accent-blue">
          <p className="label-tech text-[8px] opacity-70">Station Position</p>
          <p className="font-mono text-xs text-accent-blue font-bold tracking-tight">{lat.toFixed(6)}° N, {lng.toFixed(6)}° E</p>
        </div>

        {/* HUD Tech Elements */}
        <div className="absolute bottom-4 right-4 z-[1000] glass p-1 px-3">
          <p className="font-mono text-[8px] text-accent-blue uppercase tracking-[0.2em] animate-pulse">Sync: Operational</p>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] glass p-1 px-3">
          <p className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em]">Map_Ref: WGS-84 / L-Tile_v4</p>
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
