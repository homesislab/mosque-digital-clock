'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, Bell, Search, Play, Plus, Minus, Check, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_MEDIA = [
  { id: '1', title: 'Syaikh Mishary - Surah Al-Mulk - 20:12', duration: '20:12' },
  { id: '2', title: 'Tarhim Makkah - 05:30', duration: '05:30' },
  { id: '3', title: 'Syaikh Abdul Basit - Surah Ar-Rahman - 15:45', duration: '15:45' },
  { id: '4', title: 'Sholawat Tarhim Traditional - 04:20', duration: '04:20' },
  { id: '5', title: 'Mishary Rashid Al-Afasy - Ayatul Kursi - 02:30', duration: '02:30' },
];

export default function MobileAudioScheduler() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [offsetMinutes, setOffsetMinutes] = useState(10);
  const [activeTab, setActiveTab] = useState('Subuh');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState('1');

  const tabs = ['Subuh', 'Dzuhur', 'Asar', 'Maghrib', 'Isya'];

  const filteredMedia = useMemo(() => {
    return MOCK_MEDIA.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative font-sans text-slate-800 shadow-xl overflow-hidden border-x border-slate-200">
      
      {/* 1. Header */}
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <button className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-slate-900 absolute left-1/2 -translate-x-1/2">
          Jadwal Tarhim
        </h1>
        <div className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
            Device: <span className="text-emerald-600">mosque-5788tuii</span>
          </span>
        </div>
      </header>

      {/* 2. Prayer Time Tabs */}
      <nav className="bg-white border-b border-slate-200 shrink-0 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto p-3 gap-2 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-500 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.4)]'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        
        {/* 3. Master Toggle Switch */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-4 p-5 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex justify-between items-center group active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Music size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 tracking-tight">Status Audio {activeTab}</h2>
              <p className="text-[11px] text-slate-400 font-medium">Aktifkan pemutaran otomatis sebelum adzan</p>
            </div>
          </div>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-500 ease-in-out cursor-pointer ${
              isEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-200'
            }`}
          >
            <motion.span
              layout
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md ${
                isEnabled ? 'translate-x-[1.65rem]' : 'translate-x-1'
              }`}
            />
          </button>
        </motion.div>

        {/* Wrapper for disabled state */}
        <div className={`transition-all duration-500 ease-in-out ${!isEnabled ? 'opacity-40 pointer-events-none grayscale-[0.8] scale-[0.98]' : 'opacity-100'}`}>
          
          {/* 4. Visual Timeline Area */}
          <section className="m-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Visualisasi Timeline</h3>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-emerald-200" />)}
              </div>
            </div>
            
            <div className="p-4 relative pt-16 pb-12 overflow-x-auto no-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Adzan Bell & Vertical Line Indicator */}
              <div className="absolute top-4 right-[25%] flex flex-col items-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Bell size={24} className="text-emerald-500 mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                </motion.div>
                <div className="relative z-10">
                  <span className="text-[9px] font-black tracking-widest text-white bg-emerald-500 px-3 py-1 rounded-lg whitespace-nowrap shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-400">
                    ADZAN
                  </span>
                </div>
                <div className="w-1 h-48 bg-gradient-to-b from-emerald-500/80 to-transparent mt-1 absolute top-10 z-0 rounded-full" />
              </div>

              {/* Timeline Track Container */}
              <div className="relative mt-16 w-[180%] min-w-[500px] -ml-6">
                
                {/* Horizontal Axis */}
                <div className="absolute top-8 w-full h-1 bg-slate-100 rounded-full" />
                
                {/* Ticks and Labels */}
                <div className="absolute top-8 w-full flex justify-between px-10">
                  {[-20, -15, -10, -5, '0', '+5', '+10'].map((tick, i) => (
                    <div key={i} className="flex flex-col items-center relative -ml-4">
                      <div className={`w-0.5 transition-all ${
                        tick === '0' 
                          ? 'bg-emerald-500 h-5 -mt-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                          : 'bg-slate-300 h-2 mt-px'
                        }`} 
                      />
                      <span className={`text-[10px] mt-3 font-bold tracking-tighter ${tick === '0' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {tick === '0' ? 'Adzan' : tick}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Draggable Block (Tarhim) */}
                <motion.div 
                  animate={{ x: -1 * (offsetMinutes * 5) }}
                  className="absolute top-0 w-[42%] right-[25%] mr-1 flex flex-col items-center z-10"
                >
                  
                  {/* Floating Number Input */}
                  <div className="bg-white border border-slate-200 rounded-2xl flex items-center shadow-[0_4px_15px_-5px_rgba(0,0,0,0.1)] mb-3 overflow-hidden">
                    <button 
                      onClick={() => setOffsetMinutes(Math.max(1, offsetMinutes - 1))}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors border-r border-slate-50"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <div className="px-4 py-1 font-black text-xs text-slate-800 w-10 text-center bg-white">
                      {offsetMinutes}
                    </div>
                    <button 
                      onClick={() => setOffsetMinutes(offsetMinutes + 1)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors border-l border-slate-50"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>

                  {/* The Green Block */}
                  <div className="w-full relative group">
                    <div className="absolute inset-x-0 -bottom-1 h-1.5 bg-emerald-700/30 rounded-xl blur-[2px]" />
                    <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 w-full rounded-2xl text-white text-[10px] font-black py-3 px-4 shadow-lg border-b-4 border-emerald-700/50 cursor-grab active:cursor-grabbing flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
                      <div className="flex gap-0.5 opacity-40 shrink-0">
                        {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-3 bg-white rounded-full" />)}
                      </div>
                      <span className="truncate tracking-wider uppercase">[=== Tarhim (Al Mulk) ===]</span>
                      <div className="flex gap-0.5 opacity-40 shrink-0">
                        {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-3 bg-white rounded-full" />)}
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* 5. Read-Only Info Box */}
            <div className="px-5 pb-5">
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">
                    Iqamah {activeTab}: <span className="text-emerald-600">15 Menit</span>
                  </p>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  (Diambil dari Konfigurasi Existing)
                </p>
              </div>
            </div>
          </section>

          {/* 6. Templates & Media Section */}
          <section className="m-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Templates & Media</h3>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Template Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Terapkan Template</label>
                <div className="relative">
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none shadow-sm transition-all">
                    <option>Mode Harian Normal</option>
                    <option>Mode Ramadhan</option>
                    <option>Jumat Khusus</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronLeft size={16} className="-rotate-90" />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Judul Audio..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 font-bold placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Media List */}
              <div className="space-y-3 mt-2 min-h-[120px]">
                <AnimatePresence mode="popLayout">
                  {filteredMedia.length > 0 ? (
                    filteredMedia.map((media) => {
                      const isSelected = selectedMediaId === media.id;
                      return (
                        <motion.div
                          layout
                          key={media.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedMediaId(media.id)}
                          className={`flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.2)]' 
                              : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          {isSelected && (
                            <motion.div 
                              layoutId="media-glow"
                              className="absolute inset-0 bg-emerald-400/5 pointer-events-none"
                            />
                          )}
                          <div className="flex items-center gap-4 overflow-hidden relative z-10">
                            <button className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                              isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Play size={16} fill={isSelected ? "white" : "currentColor"} className="ml-0.5" />
                            </button>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                {media.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{media.duration}</span>
                            </div>
                          </div>
                          <button className={`shrink-0 text-[9px] font-black px-4 py-2 rounded-xl transition-all ${
                            isSelected 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-emerald-500 hover:text-emerald-600'
                          }`}>
                            {isSelected ? 'TERPILIH' : 'PILIH'}
                          </button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                      <Music size={32} className="opacity-20 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Tidak ada hasil</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload Button */}
              <button className="w-full mt-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 hover:shadow-inner transition-all active:scale-[0.98]">
                <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Plus size={16} /> 
                </div>
                Unggah Media Lokal
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* 7. Sticky Footer */}
      <footer className="absolute bottom-0 w-full left-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-5 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <button className={`w-full p-4.5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.96] flex items-center justify-center gap-3 text-sm tracking-tight ${
          isEnabled 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/40' 
            : 'bg-slate-400 cursor-not-allowed opacity-80'
        }`}>
          {isEnabled && <Check size={18} strokeWidth={3} />}
          Simpan Konfigurasi {activeTab}
        </button>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 1.25rem);
        }
      `}} />
    </div>
  );
}
