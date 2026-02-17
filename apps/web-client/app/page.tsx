'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeDisplay } from './components/TimeDisplay';
import { PrayerTimes } from './components/PrayerTimes';
import { RunningText } from './components/RunningText';
import { fetchConfig, DEFAULT_CONFIG, resolveUrl, getApiBaseUrl } from './lib/constants';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { getPrayerTimes } from './lib/prayer-times';
import { calculateAppState, AppState } from './lib/logic';
import { IqamahOverlay } from './components/IqamahOverlay';
import { SholatOverlay } from './components/SholatOverlay';
import { InfoSlider } from './components/InfoSlider';
import { AudioPlayer } from './components/AudioPlayer';
import { getPasaran } from './lib/javanese-date';
import { SetupOverlay } from './components/SetupOverlay';
import { ImsakOverlay } from './components/ImsakOverlay';
import { AdzanOverlay } from './components/AdzanOverlay';
import { sendWabotNotification } from './lib/wabot';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [mosqueKey, setMosqueKey] = useState<string | null>(null);
  const [config, setConfig] = useState<MosqueConfig>(DEFAULT_CONFIG);
  const [appState, setAppState] = useState<AppState>('NORMAL');
  const [nextEvent, setNextEvent] = useState({ name: '', seconds: 0, activeAudioUrl: '', activePlaylistId: '', shouldPlayAudio: false });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isManualStopped, setIsManualStopped] = useState(false);


  // Mounted state to prevent hydration mismatch for time-dependent rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMosqueKey(localStorage.getItem('mosqueKey'));
  }, []);

  // Load Config
  const loadConfig = useCallback(async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('mosqueKey')) {
      try {
        const data = await fetchConfig();

        // If offline, do nothing and keep last state
        if (data as any === 'OFFLINE') {
          console.warn("Connection to server failed, retrying in background...");
          return;
        }

        if (!data) {
          // Device unauthorized or key removed - FULL CLEAR
          console.log("Unauthorized detected, clearing everything...");
          localStorage.clear();
          setMosqueKey(null);
          return;
        }
        setConfig(data);
      } catch (error) {
        console.warn("Config load check failed (Normal if server is down/restarting)");
      }
    }
  }, []);

  useEffect(() => {
    if (mosqueKey) {
      loadConfig();
      const configInterval = setInterval(loadConfig, 5000);
      return () => clearInterval(configInterval);
    }
  }, [mosqueKey, loadConfig]);

  // Main Logic Loop (Tick)
  useEffect(() => {
    if (!mosqueKey) return;

    const tick = () => {
      const now = new Date();
      setCurrentTime(now);

      const prayerTimes = getPrayerTimes(config);
      const result = calculateAppState(config, prayerTimes, now);

      setAppState(result.state);
      setNextEvent({
        name: result.nextPrayerName,
        seconds: result.secondsRemaining,
        activeAudioUrl: result.activeAudioUrl,
        activePlaylistId: result.activePlaylistId || '',
        shouldPlayAudio: result.shouldPlayAudio
      });

      // Reset manual stop if audio URL/Playlist changes (new event)
      if (result.activeAudioUrl !== nextEvent.activeAudioUrl || result.activePlaylistId !== nextEvent.activePlaylistId) {
        setIsManualStopped(false);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [config, mosqueKey, nextEvent.activeAudioUrl, nextEvent.activePlaylistId]);

  // Wabot Notification Trigger
  const lastNotifiedPrayer = useRef<string | null>(null);
  useEffect(() => {
    // Trigger on ADZAN or IMSAK
    if ((appState === 'ADZAN' || appState === 'IMSAK') && nextEvent.name && nextEvent.name !== lastNotifiedPrayer.current) {

      // Prevent double trigger (and separate Adzan vs Imsak if names are same)
      // Note: nextEvent.name for IMSAK is usually "Subuh" (based on logic.ts)
      // So we might want to differentiate the "event" name for the ref
      const eventKey = `${appState}-${nextEvent.name}`;

      if (lastNotifiedPrayer.current !== eventKey) {
        lastNotifiedPrayer.current = eventKey;

        // Determine notification label
        const notificationName = appState === 'IMSAK' ? 'Imsak' : nextEvent.name;

        sendWabotNotification(config, notificationName, new Date());
      }
    }
  }, [appState, nextEvent.name, config]);

  if (!mounted) return <div className="bg-slate-900 w-screen h-screen"></div>;

  if (!mosqueKey) {
    return <SetupOverlay onComplete={(key) => setMosqueKey(key)} />;
  }

  const { name, address } = config.mosqueInfo;
  const adv = config.advancedDisplay;

  // Date Formatting (Safe for Hydration)
  const dayName = currentTime.toLocaleDateString('id-ID', { weekday: 'long' });
  const pasaran = getPasaran(currentTime);
  const fullDate = currentTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dateStr = `${dayName} ${pasaran}, ${fullDate}`;

  let hijriStr = "";
  try {
    const rawHijri = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(currentTime);
    hijriStr = rawHijri.includes('H') ? rawHijri : `${rawHijri} H`;
  } catch (e) {
    hijriStr = "";
  }



  return (
    <main
      className="w-screen h-screen relative bg-zinc-100 overflow-hidden font-sans text-slate-900 selection:bg-orange-500/30"
    >
      <div className="bg-noise fixed inset-0 pointer-events-none z-50 opacity-50 mix-blend-overlay"></div>


      <IqamahOverlay
        isVisible={appState === 'IQAMAH'}
        prayerName={nextEvent.name}
        secondsRemaining={nextEvent.seconds}
      />
      <AdzanOverlay
        isVisible={appState === 'ADZAN'}
        prayerName={nextEvent.name}
      />
      <ImsakOverlay
        isVisible={appState === 'IMSAK'}
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
        <div
          className="w-full bg-white/90 backdrop-blur-xl shadow-lg rounded-b-[2rem] px-2 lg:px-8 border-b-4 border-orange-500/20 mx-auto max-w-[98%] lg:max-w-[95%] mt-0 relative z-30"
          style={{ opacity: adv?.headerOpacity ?? 1 }}
        >
          <div className="flex w-full items-center justify-between h-16 lg:h-20 px-1">
            {adv?.customCss && <style>{adv.customCss}</style>}

            {/* 1. Clock (Left) */}
            {adv?.showClock !== false && (
              <div className="w-[25%] flex justify-center items-center h-full sm:pr-2 lg:pr-6 whitespace-nowrap">
                <TimeDisplay
                  className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tighter text-slate-900 font-mono tabular-nums leading-none drop-shadow-sm"
                  style={{ color: adv?.clockTextColor }}
                />
              </div>
            )}

            {/* Separator - Desktop Only */}
            <div className="hidden lg:block h-10 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent mx-auto flex-shrink-0"></div>

            {/* 2. Mosque Info (Center) */}
            {/* 2. Mosque Info (Center) */}
            <div className="flex-1 flex flex-row justify-center items-center h-full px-1 gap-3 lg:gap-4 overflow-hidden">
              {adv?.showLogo !== false && (config.mosqueInfo.logoUrl ? (
                <img
                  src={resolveUrl(config.mosqueInfo.logoUrl)}
                  alt="Logo"
                  className="h-[50px] sm:h-[8vh] w-auto object-contain drop-shadow-md"
                />
              ) : (
                <span className="text-2xl lg:text-4xl">🕌</span>
              ))}

              <div className="flex flex-col items-start justify-center text-left min-w-0">
                <h1
                  className="text-sm sm:text-lg lg:text-2xl font-bold uppercase tracking-tight lg:tracking-wide text-slate-800 line-clamp-1 leading-tight truncate"
                  style={{ color: adv?.headerTextColor }}
                >
                  {name}
                </h1>
                <p
                  className="block text-[10px] sm:text-xs lg:text-sm text-slate-600 font-medium tracking-wide line-clamp-1 mt-0.5 truncate"
                  style={{ color: adv?.headerTextColor ? adv?.headerTextColor + 'cc' : undefined }}
                >
                  {address}
                </p>
              </div>
            </div>

            {/* Separator - Desktop Only */}
            <div className="hidden lg:block h-10 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent mx-auto flex-shrink-0"></div>

            {/* 3. Date (Right) */}
            {adv?.showDate !== false && (
              <div className="w-[25%] flex flex-col items-end justify-center h-full pr-1 lg:pr-4">
                <div
                  className="text-[10px] sm:text-base lg:text-3xl font-bold text-slate-800 font-mono mb-1 leading-none tracking-tight whitespace-nowrap"
                  style={{ color: adv?.dateTextColor }}
                >
                  {hijriStr}
                </div>
                <div
                  className="text-[8px] sm:text-xs lg:text-lg text-slate-500 font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: adv?.dateTextColor ? adv?.dateTextColor + 'cc' : undefined }}
                >
                  {dateStr.replace(/\s+,/, ',')} {/* Fix potential space before comma */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ZONE (Light Glass Theme) */}
        <div className="w-full flex flex-col relative z-30 mt-auto">


          {/* Prayer Times Strip - Floating White Card Look */}
          {adv?.showPrayerTimes !== false && (
            <div className="w-[98%] mx-auto bg-white/90 backdrop-blur-xl rounded-t-[1.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] overflow-hidden border-t-4 border-orange-500/20 h-auto lg:h-24">
              <PrayerTimes
                config={config}
                nextPrayer={nextEvent.name}
                secondsRemaining={nextEvent.seconds}
              />
            </div>
          )}

          {/* Running Text - Bottom Bar */}
          {/* Can be black for high contrast or stay white. Let's try dark for contrast as typical in these designs */}
          {adv?.showRunningText !== false && (
            <div className="w-full bg-slate-900 text-white h-12 flex items-center shadow-inner relative z-40">
              <div className="bg-orange-600 h-full px-8 flex items-center justify-center text-white font-bold uppercase tracking-widest text-sm shadow-md z-50 skew-x-6 -ml-4 pl-8">
                <span className="-skew-x-6">Info Terkini</span>
              </div>
              <div className="flex-1 relative h-full overflow-hidden">
                <RunningText
                  texts={config.runningText}
                  color={adv?.runningTextColor}
                  bgColor={adv?.runningTextBgColor}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      <AudioPlayer
        url={resolveUrl(nextEvent.activeAudioUrl)}
        playlist={config.audio?.playlists?.find(p => p.id === nextEvent.activePlaylistId)}
        isPlaying={nextEvent.shouldPlayAudio && !isManualStopped}
        onStop={() => setIsManualStopped(true)}
      />
    </main>
  );
}
