import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Navigation, Clock, Sparkles, Copy, Check, X, ChevronDown, ChevronUp, MapPin, Trash2, Undo2, Bookmark } from 'lucide-react';
import Compass from './components/Compass';
import AstroData from './components/AstroData';
import { getCelestialData, CelestialData } from './lib/astronomy';
import { cn } from './lib/utils';
import { BaziProfile, generateAIReportPrompt } from './lib/bazi';
import { Solar } from 'lunar-javascript';

import CelestialMapHUD from './components/CelestialMapHUD';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export default function App() {
  const [lat, setLat] = useState<number>(39.9042); // Beijing default
  const [lng, setLng] = useState<number>(116.4074);
  const [inputLat, setInputLat] = useState<string>('39.9042');
  const [inputLng, setInputLng] = useState<string>('116.4074');
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<CelestialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBaziModal, setShowBaziModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [markers, setMarkers] = useState<MapMarker[]>(() => {
    const saved = localStorage.getItem('celestial_markers');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastRemovedMarker, setLastRemovedMarker] = useState<MapMarker | null>(null);
  const [isMarkersCollapsed, setIsMarkersCollapsed] = useState(false);

  const [profile, setProfile] = useState<BaziProfile>(() => {
    const saved = localStorage.getItem('bazi_profile');
    if (saved) return JSON.parse(saved);
    // Mao Zedong's Bazi as default
    return {
      gender: '男',
      year: '癸巳',
      month: '甲子',
      day: '丁酉',
      hour: '甲辰',
      luckPillar: '未知',
      age: 0
    };
  });

  const [isTargetParamsCollapsed, setIsTargetParamsCollapsed] = useState(false);
  const [isBaziCollapsed, setIsBaziCollapsed] = useState(false);
  const [isClockCollapsed, setIsClockCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('bazi_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('celestial_markers', JSON.stringify(markers));
  }, [markers]);

  const addMarker = () => {
    const newMarker: MapMarker = {
      id: Date.now().toString(),
      lat,
      lng,
      timestamp: Date.now()
    };
    setMarkers(prev => [newMarker, ...prev]);
  };

  const removeMarker = (id: string) => {
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setLastRemovedMarker(marker);
      setMarkers(prev => prev.filter(m => m.id !== id));
    }
  };

  const undoRemove = () => {
    if (lastRemovedMarker) {
      setMarkers(prev => [lastRemovedMarker, ...prev]);
      setLastRemovedMarker(null);
    }
  };

  const handleGeneratePrompt = () => {
    // Explicitly parse the date as local to avoid UTC shifts
    const [y, m, d] = targetDate.split('-').map(Number);
    
    // Use Solar.fromYmdHms at noon to avoid boundary issues (like 23:00 day change)
    const solar = Solar.fromYmdHms(y, m, d, 12, 0, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    const yearGZ = eightChar.getYear();
    const monthGZ = eightChar.getMonth();
    const dayGZ = eightChar.getDay();

    const prompt = generateAIReportPrompt(profile, {
      year: y,
      month: m,
      day: d,
      nongli_str: `${yearGZ}年 ${monthGZ}月 ${dayGZ}日`,
      currentDayPillar: dayGZ
    });
    setGeneratedPrompt(prompt);
    setShowBaziModal(true);
  };

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                  <div 
                    className="flex justify-between items-center border-l-2 border-accent-blue pl-2 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsTargetParamsCollapsed(!isTargetParamsCollapsed)}
                  >
                    <p className="label-tech">Target Parameters</p>
                    {isTargetParamsCollapsed ? <ChevronDown size={14} className="text-accent-blue/50" /> : <ChevronUp size={14} className="text-accent-blue/50" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isTargetParamsCollapsed && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleApply} 
                        className="space-y-4 overflow-hidden pl-2"
                      >
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
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                <div className="glass p-5 space-y-4">
                  <div 
                    className="flex justify-between items-center border-l-2 border-yellow-500 pl-2 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsMarkersCollapsed(!isMarkersCollapsed)}
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark size={14} className="text-yellow-500" />
                      <p className="label-tech">Marked Sites</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {lastRemovedMarker && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); undoRemove(); }}
                           className="text-[9px] text-accent-blue hover:underline uppercase tracking-tighter flex items-center gap-1"
                         >
                           <Undo2 size={10} /> Undo
                         </button>
                       )}
                       {isMarkersCollapsed ? <ChevronDown size={14} className="opacity-50" /> : <ChevronUp size={14} className="opacity-50" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {!isMarkersCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden pl-2"
                      >
                        <button
                          onClick={addMarker}
                          className="w-full py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[9px] font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-bg-dark transition-all flex items-center justify-center gap-2 mb-2"
                        >
                          <Bookmark size={12} />
                          Mark Current Center
                        </button>

                        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {markers.length === 0 ? (
                            <p className="text-[9px] text-text-muted italic text-center py-2">No marked locations</p>
                          ) : markers.map((m) => (
                            <div 
                              key={m.id}
                              className="group flex items-center justify-between p-2 rounded border border-border-tech/40 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all"
                            >
                              <div 
                                className="flex flex-col gap-0.5 cursor-pointer flex-1"
                                onClick={() => {
                                  setLat(m.lat);
                                  setLng(m.lng);
                                  setInputLat(m.lat.toFixed(4));
                                  setInputLng(m.lng.toFixed(4));
                                }}
                              >
                                <span className="font-mono text-[10px] text-white">
                                  {m.lat.toFixed(4)}°, {m.lng.toFixed(4)}°
                                </span>
                                <span className="text-[8px] opacity-40 uppercase tracking-widest">
                                  {new Date(m.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <button
                                onClick={() => removeMarker(m.id)}
                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="glass p-5 space-y-4">
                  <div 
                    className="flex justify-between items-center border-l-2 border-amber-500 pl-2 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsBaziCollapsed(!isBaziCollapsed)}
                  >
                    <p className="label-tech">Bazi Profile</p>
                    {isBaziCollapsed ? <ChevronDown size={14} className="text-accent-blue/50" /> : <ChevronUp size={14} className="text-accent-blue/50" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isBaziCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden pl-2"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase opacity-40">Gender</label>
                            <select 
                              value={profile.gender}
                              onChange={(e) => setProfile({...profile, gender: e.target.value as any})}
                              className="bg-transparent w-full font-mono text-xs text-white outline-none border-b border-border-tech pb-1 appearance-none cursor-pointer"
                            >
                              <option value="男" className="bg-bg-dark">Male (男)</option>
                              <option value="女" className="bg-bg-dark">Female (女)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase opacity-40">Age</label>
                            <input 
                              type="number"
                              value={profile.age}
                              onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                              className="bg-transparent w-full font-mono text-xs text-white outline-none border-b border-border-tech pb-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] uppercase opacity-40">Target Date (预测日期)</label>
                            <input 
                              type="date"
                              value={targetDate}
                              onChange={(e) => setTargetDate(e.target.value)}
                              className="bg-transparent w-full font-mono text-xs text-white outline-none border-b border-border-tech pb-1 cursor-pointer"
                            />
                          </div>
                          {[
                            { label: 'Year (年)', key: 'year' },
                            { label: 'Month (月)', key: 'month' },
                            { label: 'Day (日)', key: 'day' },
                            { label: 'Hour (时)', key: 'hour' },
                            { label: 'Luck (大运)', key: 'luckPillar' },
                          ].map((field) => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[10px] uppercase opacity-40">{field.label}</label>
                              <input 
                                type="text"
                                value={(profile as any)[field.key]}
                                onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                                placeholder="e.g. 辛酉"
                                className="bg-transparent w-full font-mono text-xs text-white outline-none border-b border-border-tech pb-1"
                              />
                            </div>
                          ))}
                          <div className="flex items-end">
                            <button
                              onClick={handleGeneratePrompt}
                              className="w-full py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-[9px] font-bold uppercase tracking-widest hover:bg-accent-blue hover:text-bg-dark transition-all flex items-center justify-center gap-2"
                            >
                              <Sparkles size={12} />
                              Gen Prompt
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="glass p-5 space-y-3">
                  <div 
                    className="flex justify-between items-center border-l-2 border-purple-500 pl-2 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsClockCollapsed(!isClockCollapsed)}
                  >
                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-50 font-mono">Local Epoch</p>
                    {isClockCollapsed ? <ChevronDown size={14} className="text-accent-blue/50" /> : <ChevronUp size={14} className="text-accent-blue/50" />}
                  </div>

                  <AnimatePresence>
                    {!isClockCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex justify-between items-center overflow-hidden pl-2"
                      >
                        <div className="space-y-1">
                          <p className="text-3xl font-black font-mono text-accent-blue tracking-tighter">
                            {data.localTime.split(' ')[1]}
                          </p>
                          <div className="pt-1 mt-1 border-t border-border-tech/30">
                            {data.location.bazi.year && (
                              <p className="text-[11px] font-mono font-bold text-white/90 tracking-tight">
                                {data.location.bazi.year} {data.location.bazi.month} {data.location.bazi.day} {data.location.bazi.hour}时
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="p-2 bg-accent-blue/10 rounded-full border border-accent-blue/20">
                          <Clock size={24} className="text-accent-blue animate-pulse" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>


              </section>

              {/* Center Main: Integrated Map & Compass */}
              <section className="col-span-12 lg:col-span-9 space-y-6">
                <CelestialMapHUD 
                  lat={lat} 
                  lng={lng} 
                  markers={markers}
                  setLat={setLat}
                  setLng={setLng}
                  setInputLat={setInputLat}
                  setInputLng={setInputLng}
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
            {data && data.location.bazi.year && (
              <span className="text-accent-blue font-bold">
                BAZI: {data.location.bazi.year}年 {data.location.bazi.month}月 {data.location.bazi.day}日 {data.location.bazi.hour}时
              </span>
            )}
          </div>

          <span>SESSION_EPOCH: {new Date().toISOString()}</span>
        </footer>

        {/* Prompt Modal */}
        <AnimatePresence>
          {showBaziModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBaziModal(false)}
                className="absolute inset-0 bg-bg-dark/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass w-full max-w-2xl relative z-[10000] flex flex-col max-h-[85vh] border border-accent-blue/30 shadow-2xl shadow-accent-blue/20"
              >
                <div className="p-4 border-b border-border-tech flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-accent-blue" />
                    <h3 className="text-sm font-bold tracking-tight uppercase">AI Fortune Report Prompt</h3>
                  </div>
                  <button 
                    onClick={() => setShowBaziModal(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="bg-bg-dark/50 border border-border-tech p-4 rounded font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-white/80">
                    {generatedPrompt}
                  </div>
                </div>

                <div className="p-4 border-t border-border-tech flex justify-end gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-6 py-2 bg-accent-blue text-bg-dark text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
