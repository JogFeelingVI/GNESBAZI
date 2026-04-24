import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Globe, Loader2, Navigation, Clock } from 'lucide-react';
import Compass from './components/Compass';
import MapControl from './components/MapControl';
import AstroData from './components/AstroData';
import { getCelestialData, CelestialData } from './lib/astronomy';
import { cn } from './lib/utils';

import CelestialMapHUD from './components/CelestialMapHUD';

export default function App() {
  const [lat, setLat] = useState<number>(39.9042); // Beijing default
  const [lng, setLng] = useState<number>(116.4074);
  const [inputLat, setInputLat] = useState<string>('39.9042');
  const [inputLng, setInputLng] = useState<string>('116.4074');
  const [data, setData] = useState<CelestialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateData = useCallback(() => {
    try {
      const celestial = getCelestialData(lat, lng);
      setData(celestial);
    } catch (error) {
      console.error("Failed to calculate celestial data:", error);
    }
  }, [lat, lng]);

  useEffect(() => {
    updateData();
    setIsLoading(false);
    const timer = setInterval(updateData, 1000);
    return () => clearInterval(timer);
  }, [updateData]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newLat = parseFloat(inputLat);
    const newLng = parseFloat(inputLng);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setLat(newLat);
      setLng(newLng);
    }
  };

  const useCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setInputLat(latitude.toString());
        setInputLng(longitude.toString());
        setIsLoading(false);
      }, (error) => {
        console.error(error);
        setIsLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-[#E0E0E0] p-4 md:p-6 lg:p-10 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-border-tech pb-6">
          <div className="space-y-1">
            <span className="label-tech opacity-50">Geospatial Observer v1.3.1</span>
            <h1 className="text-3xl font-light tracking-tighter">Celestial & Horizon Analytics</h1>
          </div>
          <div className="hidden md:flex space-x-10 text-right">
            <div>
              <p className="label-tech">Active Vector</p>
              <p className="font-mono text-sm text-accent-blue">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</p>
            </div>
            <div>
              <p className="label-tech">Timezone Profile</p>
              <p className="font-mono text-sm text-accent-blue truncate max-w-[140px] font-bold">{data?.timezone || 'SYNCING...'}</p>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center gap-4 text-text-muted"
            >
              <Loader2 className="animate-spin text-accent-blue" size={48} />
              <p className="font-mono text-xs tracking-widest uppercase animate-pulse">Syncing NASA Horizons...</p>
            </motion.div>
          ) : data && (
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Left Sidebar: Controls */}
              <section className="col-span-12 lg:col-span-3 space-y-6">
                <div className="glass p-5 space-y-6">
                  <p className="label-tech border-b border-border-tech pb-2">Target Parameters</p>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div className="space-y-1">
                      <label className="label-tech opacity-40">Latitude</label>
                      <input
                        type="text"
                        value={inputLat}
                        onChange={(e) => setInputLat(e.target.value)}
                        className="bg-transparent w-full font-mono text-white outline-none border-b border-border-tech focus:border-accent-blue pb-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="label-tech opacity-40">Longitude</label>
                      <input
                        type="text"
                        value={inputLng}
                        onChange={(e) => setInputLng(e.target.value)}
                        className="bg-transparent w-full font-mono text-white outline-none border-b border-border-tech focus:border-accent-blue pb-1"
                      />
                    </div>
                    <div className="flex gap-2">
                       <button
                         type="submit"
                         className="flex-1 py-3 bg-[#00D1FF15] border border-accent-blue text-accent-blue text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent-blue hover:text-bg-dark transition-all"
                       >
                         Recalculate
                       </button>
                       <button
                         type="button"
                         onClick={useCurrentLocation}
                         className="px-4 border border-border-tech hover:border-accent-blue transition-colors text-text-muted"
                       >
                         <Navigation size={16} />
                       </button>
                    </div>
                  </form>
                </div>

                <div className="bg-accent-blue p-5 rounded-lg flex justify-between items-center text-bg-dark shadow-xl shadow-accent-blue/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tighter">Site local epoch</p>
                    <p className="text-2xl font-black font-mono">{data.localTime.split(' ')[1]}</p>
                    <div className="pt-2 border-t border-bg-dark/10">
                      {data.location.bazi.year && (
                        <>
                          <p className="text-[10px] font-bold opacity-80">{data.location.bazi.year}年 {data.location.bazi.month}月 {data.location.bazi.day}日</p>
                          <p className="text-[10px] font-bold opacity-80">{data.location.bazi.hour}时</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Clock size={32} className="opacity-80" />
                </div>

                <div className="glass p-5 text-[10px] font-mono text-text-muted leading-relaxed uppercase space-y-3">
                   <div className="border-l-2 border-accent-blue pl-2">
                     <p>Observatory Status: Nominal</p>
                     <p>Ref_System: {data.timezone}</p>
                   </div>
                   <p className="opacity-50">Compass is locked to True North (0° Azimuth). Verify local magnetic declination for field use.</p>
                </div>
              </section>

              {/* Center Main: Integrated Map & Compass */}
              <section className="col-span-12 lg:col-span-9 space-y-6">
                <CelestialMapHUD 
                  lat={lat} 
                  lng={lng} 
                  sunAzimuth={data.sun.azimuth} 
                  moonAzimuth={data.moon.azimuth} 
                  magneticDeclination={data.location.magneticDeclination}
                />
                
                <AstroData data={data} />
              </section>
            </motion.main>
          )}
        </AnimatePresence>

        <footer className="pt-6 flex justify-between text-[10px] font-mono text-text-muted border-t border-border-tech">
          <div className="space-x-4">
            <span>REF_LINK: ESTABLISHED (WGS-84)</span>
            {data && data.location.bazi.year && (
              <span className="text-accent-blue font-bold">
                BAZI: {data.location.bazi.year}年 {data.location.bazi.month}月 {data.location.bazi.day}日 {data.location.bazi.hour}时
              </span>
            )}
          </div>
          <span>HUD_VERSION: 1.4.0-STABLE</span>
          <span>SESSION_EPOCH: {new Date().toISOString()}</span>
        </footer>
      </div>
    </div>
  );
}
