import React from 'react';
import { Sun, Moon, Sunrise, Sunset, Compass, MapPin } from 'lucide-react';
import { CelestialData } from '../lib/astronomy';

interface AstroDataProps {
  data: CelestialData;
}

const AstroData: React.FC<AstroDataProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Solar Schedule */}
      <div className="glass p-4 bg-gradient-to-br from-surface-dark to-bg-dark">
        <p className="label-tech mb-3">Solar Perspective</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted flex items-center gap-1"><Sunrise size={12}/> Sunrise</span>
            <span className="font-mono text-white text-sm">{data.sun.sunrise}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted flex items-center gap-1"><Sunset size={12}/> Sunset</span>
            <span className="font-mono text-white text-sm">{data.sun.sunset}</span>
          </div>
          <div className="pt-2">
            <p className="label-tech mb-1">Solar Altitude</p>
            <p className="font-mono text-2xl font-bold text-amber-400 leading-none">{data.sun.altitude.toFixed(2)}°</p>
          </div>
        </div>
      </div>

      {/* Lunar Status */}
      <div className="glass p-4 bg-gradient-to-br from-surface-dark to-bg-dark">
        <p className="label-tech mb-3">Lunar Telemetry</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted flex items-center gap-1"><Moon size={12}/> Phase</span>
            <span className="font-mono text-white text-sm">{(data.moon.phase * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted">Illumination</span>
            <span className="font-mono text-white text-sm">{(data.moon.phase > 0.5 ? (1 - data.moon.phase) * 200 : data.moon.phase * 200).toFixed(0)}%</span>
          </div>
          <div className="pt-2">
            <p className="label-tech mb-1">Moon Altitude</p>
            <p className="font-mono text-2xl font-bold text-blue-400 leading-none">{data.moon.altitude.toFixed(2)}°</p>
          </div>
        </div>
      </div>

      {/* Geographic Data */}
      <div className="glass p-4 bg-gradient-to-br from-surface-dark to-bg-dark md:col-span-2 lg:col-span-1">
        <p className="label-tech mb-3">Geographic Reference</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted flex items-center gap-1"><Compass size={12}/> Magnetic North</span>
            <span className="font-mono text-white text-sm">
              {data.location.magneticDeclination > 0 ? '+' : ''}{data.location.magneticDeclination.toFixed(2)}°
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-border-tech pb-2">
            <span className="text-xs text-text-muted flex items-center gap-1"><MapPin size={12}/> Declination</span>
            <span className="font-mono text-teal-400 text-sm font-bold">
              {Math.abs(data.location.magneticDeclination).toFixed(1)}° {data.location.magneticDeclination >= 0 ? 'E' : 'W'}
            </span>
          </div>
          <div className="pt-2">
            <p className="label-tech mb-1">True North Offset</p>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 bg-border-tech rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-400" 
                  style={{ width: `${Math.min(Math.abs(data.location.magneticDeclination) * 2, 100)}%`, marginLeft: data.location.magneticDeclination < 0 ? 'auto' : '0' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstroData;
