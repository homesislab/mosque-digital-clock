'use client';

import { useState, useEffect } from 'react';
import { TimeDisplay } from './components/TimeDisplay';
import { PrayerTimes } from './components/PrayerTimes';
import { RunningText } from './components/RunningText';
import { fetchConfig, DEFAULT_CONFIG, resolveUrl } from './lib/constants';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { getPrayerTimes } from './lib/prayer-times';
import { calculateAppState, AppState } from './lib/logic';
import { IqamahOverlay } from './components/IqamahOverlay';
import { SholatOverlay } from './components/SholatOverlay';
import { InfoSlider } from './components/InfoSlider';
import { AudioPlayer } from './components/AudioPlayer';
import { getPasaran } from './lib/javanese-date';

export default function Home() {
  const [config, setConfig] = useState<MosqueConfig>(DEFAULT_CONFIG);
  const [appState, setAppState] = useState<AppState>('NORMAL');
  const [nextEvent, setNextEvent] = useState<{ name: string; seconds: number }>({ name: '', seconds: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mounted state to prevent hydration mismatch for time-dependent rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Load Config
  useEffect(() => {
    const loadConfig = async () => {
      const data = await fetchConfig();
      setConfig(data);
    };

    loadConfig();
    const configInterval = setInterval(loadConfig, 30000);
    return () => clearInterval(configInterval);
  }, []);

  // Main Logic Loop (Tick)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now);

      const prayerTimes = getPrayerTimes(config);
      const result = calculateAppState(config, prayerTimes, now);

      setAppState(result.state);
      setNextEvent({ name: result.nextPrayerName, seconds: result.secondsRemaining });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [config]);

  const { name, address } = config.mosqueInfo;

  // Date Formatting (Safe for Hydration)
  let dateStr = "";
  let hijriStr = "";

  if (mounted) {
    const dayName = currentTime.toLocaleDateString('id-ID', { weekday: 'long' });
    const pasaran = getPasaran(currentTime);
    const fullDate = currentTime.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    dateStr = `${dayName} ${pasaran}, ${fullDate}`;

    try {
      hijriStr = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(currentTime) + ' H';
    } catch (e) {
      hijriStr = "";
    }
  }

  return (
    <main className="w-screen h-screen relative bg-zinc-100 overflow-hidden font-sans text-slate-900 selection:bg-orange-500/30">
      <div className="bg-noise fixed inset-0 pointer-events-none z-50 opacity-50 mix-blend-overlay"></div>

      <IqamahOverlay
        isVisible={appState === 'IQAMAH'}
        prayerName={nextEvent.name}
        secondsRemaining={nextEvent.seconds}
      />
      <SholatOverlay isVisible={appState === 'SHOLAT'} />

      {/* Layer 1: Background Slider */}
      <div className="absolute inset-0 z-0">
        <InfoSlider config={config} />
        {/* Light Overlay for readability */}
        <div className="absolute inset-0 bg-white/10 z-10" />
      </div>

      {/* Layer 2: Content Grid */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-0">

        {/* HEADER ZONE (Light Glass Theme) */}
        {/* Full width white bar with rounded bottom corners */}
        <div className="w-full bg-white/90 backdrop-blur-xl shadow-lg rounded-b-[2rem] px-8 border-b-4 border-orange-500/20 mx-auto max-w-[95%] mt-0 relative z-30">
          <div className="grid grid-cols-12 gap-0 items-center h-20">

            {/* 1. Clock (Left) */}
            <div className="col-span-3 flex justify-center items-center h-full pr-6">
              <TimeDisplay className="text-6xl font-bold tracking-tighter text-slate-900 font-mono tabular-nums leading-none drop-shadow-sm" />
            </div>

            {/* Separator */}
            <div className="col-span-1 h-10 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent mx-auto"></div>

            {/* 2. Mosque Info (Center) */}
            <div className="col-span-4 flex flex-col justify-center items-center h-full text-center">
              <div className="flex items-center gap-3 mb-0">
                {config.mosqueInfo.logoUrl ? (
                  <img src={resolveUrl(config.mosqueInfo.logoUrl)} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                ) : (
                  <span className="text-xl">🕌</span>
                )}
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-800 line-clamp-1">
                  {name}
                </h1>
              </div>
              <p className="text-sm text-slate-600 font-medium tracking-wide line-clamp-1">
                {address}
              </p>
            </div>

            {/* Separator */}
            <div className="col-span-1 h-10 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent mx-auto"></div>

            {/* 3. Date (Right) */}
            <div className="col-span-3 flex flex-col items-center justify-center h-full pl-6">
              <div className="text-xl font-bold text-slate-900 font-mono mb-0">{hijriStr}</div>
              <div className="text-sm text-slate-500 font-semibold uppercase tracking-widest">{dateStr}</div>
            </div>
          </div>
        </div>

        {/* FOOTER ZONE (Light Glass Theme) */}
        <div className="w-full flex flex-col relative z-30 mt-auto">

          {/* Prayer Times Strip - Floating White Card Look */}
          <div className="w-[98%] mx-auto bg-white/90 backdrop-blur-xl rounded-t-[1.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] overflow-hidden border-t-4 border-orange-500/20 h-24">
            <PrayerTimes
              config={config}
              nextPrayer={nextEvent.name}
              secondsRemaining={nextEvent.seconds}
            />
          </div>

          {/* Running Text - Bottom Bar */}
          {/* Can be black for high contrast or stay white. Let's try dark for contrast as typical in these designs */}
          <div className="w-full bg-slate-900 text-white h-12 flex items-center shadow-inner relative z-40">
            <div className="bg-orange-600 h-full px-8 flex items-center justify-center text-white font-bold uppercase tracking-widest text-sm shadow-md z-50 skew-x-6 -ml-4 pl-8">
              <span className="-skew-x-6">Info Terkini</span>
            </div>
            <div className="flex-1 relative h-full overflow-hidden">
              <RunningText />
            </div>
          </div>
        </div>

      </div>

      <AudioPlayer
        url={config.audio?.url}
        isPlaying={appState === 'NORMAL' && (nextEvent as any).shouldPlayAudio}
      />
    </main>
  );
}
