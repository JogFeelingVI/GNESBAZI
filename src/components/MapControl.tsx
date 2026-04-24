import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

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

interface MapControlProps {
  lat: number;
  lng: number;
}

const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapControl: React.FC<MapControlProps> = ({ lat, lng }) => {
  return (
    <div className="h-[280px] w-full rounded-lg overflow-hidden border border-border-tech relative">
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full grayscale contrast-125"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
        <RecenterMap lat={lat} lng={lng} />
      </MapContainer>
      {/* HUD overlay for map */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-bg-dark border border-border-tech p-1">
        <p className="font-mono text-[8px] text-accent-blue uppercase">GEO_REF_SURFACE_NAV</p>
      </div>
    </div>
  );
};

export default MapControl;
