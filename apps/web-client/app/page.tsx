'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TimeDisplay } from './components/TimeDisplay';
import { PrayerTimes } from './components/PrayerTimes';
import { RunningText } from './components/RunningText';
import { resolveUrl, getApiBaseUrl } from './lib/constants';
import { useConfig } from './lib/useConfig';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { getPrayerTimes } from './lib/prayer-times';
import { usePrayerSchedule } from './lib/usePrayerSchedule';
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
import { useLogger } from './lib/useLogger';
import { AudioUnlockOverlay } from './components/AudioUnlockOverlay';
import { LogoutConfirmation } from './components/LogoutConfirmation';
import { LogOut, Download, WifiOff } from 'lucide-react';
import { usePWAInstall } from './lib/usePWAInstall';
import { useSyncAssets } from './lib/useSyncAssets';
import { RefreshCw } from 'lucide-react';



export default function Home() {
  const [mosqueKey, setMosqueKey] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('NORMAL');
  const [nextEvent, setNextEvent] = useState({ name: '', seconds: 0, activeAudioUrl: '', activePlaylistId: '', shouldPlayAudio: false, eventTime: undefined as Date | undefined });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isManualStopped, setIsManualStopped] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoClickRef = useRef(0);
  const sequenceRef = useRef<string[]>([]);
  const logger = useLogger('client');
  const { isInstallable, install } = usePWAInstall();

  // Mounted state to prevent hydration mismatch for time-dependent rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMosqueKey(localStorage.getItem('mosqueKey'));
  }, []);

  // ── Config with caching (30s TTL, poll every 5s) ──────────────────────
  const { config, isOffline, refresh } = useConfig(mosqueKey);
  const { status: syncStatus, progress: syncProgress } = useSyncAssets(config);

  // Jadwal solat harian: ambil langsung dari pusat waktu shalat (Kemenag/myQuran),
  // dengan fallback cache offline lalu perhitungan lokal (adhan).
  const { schedule: prayerSchedule, source: prayerSource } = usePrayerSchedule(config);
  const prayerScheduleRef = useRef(prayerSchedule);
  useEffect(() => { prayerScheduleRef.current = prayerSchedule; }, [prayerSchedule]);

  // Listen for SSE external trigger to refresh config immediately
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[Page] SSE: Triggering immediate config refresh');
      refresh();
    };
    window.addEventListener('config-refresh-needed', handleRefresh);
    return () => window.removeEventListener('config-refresh-needed', handleRefresh);
  }, [refresh]);

  // Handle unauthorized / key cleared
  useEffect(() => {
    if (mosqueKey && config === null) {
      console.log('Unauthorized detected, clearing everything...');
      localStorage.clear();
      setMosqueKey(null);
    }
  }, [config, mosqueKey]);

  const hasLoggedStart = useRef(false);

  // Main Logic Loop (Tick)
  useEffect(() => {
    if (!mosqueKey) return;

    if (!hasLoggedStart.current) {
      const deviceId = localStorage.getItem('deviceId') || 'unknown-device';
      logger.info(`Client Started: ${deviceId}`, { deviceId, mosqueKey });
      hasLoggedStart.current = true;
    }

    const tick = () => {
      let now = new Date();
      if (config.display?.timeOffset) {
        now = new Date(now.getTime() + config.display.timeOffset * 1000);
      }
      setCurrentTime(now);

      const prayerTimes = prayerScheduleRef.current ?? getPrayerTimes(config, now);
      const result = calculateAppState(config, prayerTimes, now);

      // Log state changes (only when state changes)
      setAppState(prev => {
        if (result.state !== prev) {
          logger.info(`State changed to ${result.state}`, { nextPrayer: result.nextPrayerName });
        }
        return result.state;
      });

      setNextEvent(prev => {
        // Only update if audio-relevant fields changed.
        // NOTE: secondsRemaining intentionally EXCLUDED — it changes every second
        // and would cause AudioPlayer to re-render/restart audio unnecessarily.
        if (
          prev.name === result.nextPrayerName &&
          prev.activeAudioUrl === result.activeAudioUrl &&
          prev.activePlaylistId === (result.activePlaylistId || '') &&
          prev.shouldPlayAudio === result.shouldPlayAudio
        ) {
          // Only update seconds without creating a new object — avoids AudioPlayer re-render
          if (prev.seconds !== result.secondsRemaining) {
            return { ...prev, seconds: result.secondsRemaining };
          }
          return prev; // same reference = no re-render
        }
        return {
          name: result.nextPrayerName,
          seconds: result.secondsRemaining,
          activeAudioUrl: result.activeAudioUrl,
          activePlaylistId: result.activePlaylistId || '',
          shouldPlayAudio: result.shouldPlayAudio,
          eventTime: result.eventTime
        };
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [config, mosqueKey]);

  // Reset manual stop when audio changes
  useEffect(() => {
    setIsManualStopped(false);
  }, [nextEvent.activeAudioUrl, nextEvent.activePlaylistId]);

  // Wabot Notification Trigger - DISABLED (Moved to Backend Worker)
  /*
  const lastNotifiedPrayer = useRef<string | null>(null);
  useEffect(() => {
    // Trigger on ADZAN or IMSAK
    if ((appState === 'ADZAN' || appState === 'IMSAK') && nextEvent.name && nextEvent.eventTime) {
      const eventKey = `${appState}-${nextEvent.name}-${nextEvent.eventTime.getTime()}`;

      if (lastNotifiedPrayer.current !== eventKey) {
        lastNotifiedPrayer.current = eventKey;
        // Determine notification label
        const notificationName = appState === 'IMSAK' ? 'Imsak' : nextEvent.name;

        console.log(`[Wabot] Triggering notification: ${notificationName} for time: ${nextEvent.eventTime}`);
        sendWabotNotification(config, notificationName, nextEvent.eventTime);
      }
    }
  }, [appState, nextEvent.name, nextEvent.eventTime, config]);
  */

  const handleUnlockAudio = useCallback(() => {
    setIsAudioBlocked(false);
    // After user interaction, future plays will be unlocked
    // We can try to play a silent sound or just let the next event trigger it
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setMosqueKey(null);
    setShowLogoutConfirm(false);
    logger.info('User manually logged out the client');
  }, [logger]);

  // Logout Triggers: Keyboard & Remote Sequence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Classical Keyboard: Ctrl+Shift+L
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setShowLogoutConfirm(true);
      }

      // 2. Remote D-Pad Sequence: Up, Up, Down, Down
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        sequenceRef.current = [...sequenceRef.current, key].slice(-4);
        const seq = sequenceRef.current.join(',');
        if (seq === 'ArrowUp,ArrowUp,ArrowDown,ArrowDown') {
          setShowLogoutConfirm(true);
          sequenceRef.current = []; // Reset
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // ── Stable memoized props for child components ──────────────────────
  // Prevents InfoSlider / PrayerTimes / AudioPlayer re-rendering every second
  // due to the 1s clock tick or nextEvent.seconds update.
  const infoSliderMuted = useMemo(
    () => appState !== 'NORMAL' || (nextEvent.shouldPlayAudio && !isManualStopped),
    [appState, nextEvent.shouldPlayAudio, isManualStopped]
  );

  const activePlaylist = useMemo(
    () => config.audio?.playlists?.find(p => p.id === nextEvent.activePlaylistId),
    [config.audio?.playlists, nextEvent.activePlaylistId]
  );

  const audioUrl = useMemo(
    () => resolveUrl(nextEvent.activeAudioUrl),
    [nextEvent.activeAudioUrl]
  );

  const audioIsPlaying = nextEvent.shouldPlayAudio && !isManualStopped;

  const handleAudioStop = useCallback(() => setIsManualStopped(true), []);
  const handleAudioBlocked = useCallback((blocked: boolean) => setIsAudioBlocked(blocked), []);
  const handleAudioCommand = useCallback((cmd: string) => {
    if (cmd === 'logout') handleLogout();
  }, [handleLogout]);

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
      className="w-screen h-screen relative bg-zinc-900 overflow-hidden font-sans text-white selection:bg-emerald-500/30"
      role="application"
      aria-label="Mosque Digital Clock Display"
    >
      <div className="bg-noise fixed inset-0 pointer-events-none z-50 opacity-30 mix-blend-overlay"></div>

      {/* Offline indicator */}
      {isOffline && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-full shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={14} />
          Offline
        </div>
      )}

      {/* Sync Status indicator */}
      {syncStatus !== 'sync' && (
        <div
          className="fixed top-20 right-6 z-[100] flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-2 rounded-full shadow-2xl transition-all duration-500"
          role="status"
        >
          <RefreshCw size={12} className="animate-spin" />
          {syncStatus === 'syncing' ? `Menyingkronkan (${syncProgress}%)` : 'Perlu Sinkronisasi'}
        </div>
      )}

      <IqamahOverlay isVisible={appState === 'IQAMAH'} prayerName={nextEvent.name} secondsRemaining={nextEvent.seconds} />
      <AdzanOverlay isVisible={appState === 'ADZAN'} prayerName={nextEvent.name} />
      <ImsakOverlay isVisible={appState === 'IMSAK'} secondsRemaining={nextEvent.seconds} />
      <SholatOverlay isVisible={appState === 'SHOLAT'} />

      {/* Layer 1: Background Assets (Minimalis Premium) */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Fallback Premium Makkah Image (Always there, sets the mood) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full opacity-60 scale-105 transition-all duration-1000"
          style={{ backgroundImage: "url('/bg-makkah.jpg')" }}
        />
        {/* Fullscreen Slider sits on top seamlessly! */}
        <div className="absolute inset-0 z-10 transition-opacity">
          <InfoSlider
            config={config}
            isMuted={infoSliderMuted}
          />
        </div>
        {/* Heavy Vignette & Gradient to ensure text readability from Bottom */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80 z-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 z-20 pointer-events-none" />
      </div>

      {/* Layer 2: Main UI Content Grid */}
      <div className="absolute inset-0 z-30 flex flex-col justify-between p-0 pointer-events-none">

        {/* TOP AREA: Hidden Navigation/Control Bar */}
        <div className="w-full flex-none flex justify-between p-6 absolute top-0 inset-x-0 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-50">
          <button onClick={() => setShowLogoutConfirm(true)} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:text-emerald-400 border border-white/10 shadow-lg pointer-events-auto">
            <LogOut size={24} />
          </button>
          {isInstallable && (
            <button onClick={install} className="p-3 bg-emerald-600/80 backdrop-blur-md rounded-full text-white hover:bg-emerald-500 shadow-lg animate-pulse pointer-events-auto">
              <Download size={24} />
            </button>
          )}
        </div>

        {/* TOP HEADER AREA: Floating Light Bar */}
        <div className="w-full flex-none pt-2 lg:pt-4 px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-start z-40 relative pointer-events-none">

          {/* 1. Header Bar Mengapung (Slate-50) */}
          <div
            className="w-full max-w-[1700px] flex flex-col sm:flex-row items-center justify-between text-slate-900 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl px-8 py-5 pointer-events-auto transform transition-all"
            style={{ 
              backgroundColor: `rgba(248, 250, 252, ${adv?.headerOpacity ?? 0.95})`,
              backdropFilter: adv?.headerBlur ? `blur(${adv.headerBlur}px)` : 'blur(12px)'
            }}
            onClick={() => {
// ... existing logic
// Note: I will only replace the div style part to be safe, but since I'm using replace_file_content with a range, I'll be careful.
              logoClickRef.current += 1;
              if (logoClickRef.current >= 5) {
                setShowLogoutConfirm(true);
                logoClickRef.current = 0;
              }
              setTimeout(() => { logoClickRef.current = 0; }, 2000);
            }}
          >
            {/* LEFT: Giant Clock */}
            {adv?.showClock !== false && (
              <div className="flex-1 w-full pl-2 lg:pl-6 flex justify-start mb-4 sm:mb-0">
                <TimeDisplay
                  time={currentTime}
                  clockWeight={adv?.clockWeight}
                  glowColor={adv?.glowColor}
                  className="text-[3.5rem] lg:text-[4.5rem] font-bold tracking-tight font-mono tabular-nums leading-none text-slate-900 drop-shadow-sm"
                  style={{ color: adv?.clockTextColor ? adv.clockTextColor : undefined }}
                />
              </div>
            )}

            {/* CENTER: Mosque Identity (Clean) */}
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 sm:mb-0">
              {adv?.showLogo !== false && (config.mosqueInfo.logoUrl ? (
                <img src={resolveUrl(config.mosqueInfo.logoUrl)} className="h-10 sm:h-14 w-auto drop-shadow-sm transition-transform duration-300 hover:scale-105" alt="Mosque Logo" />
              ) : (
                <span className="text-3xl sm:text-5xl drop-shadow-sm">🕌</span>
              ))}
              <div className="flex flex-col text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-slate-900" style={{ color: adv?.headerTextColor ? adv.headerTextColor : undefined }}>
                  {name}
                </h1>
                <p className="text-[10px] sm:text-[13px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                  {address}
                </p>
              </div>
            </div>

            {/* RIGHT: Minimalist Date */}
            {adv?.showDate !== false && (
              <div className="flex-1 w-full pr-2 lg:pr-6 flex flex-col items-end justify-center mt-1 sm:mt-0">
                <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-700 font-sans tracking-wide mb-1" style={{ color: adv?.dateTextColor ? adv.dateTextColor : undefined }}>
                  {hijriStr}
                </div>
                <div className="text-[10px] sm:text-xs lg:text-[13px] font-semibold text-slate-500 uppercase tracking-widest" style={{ color: adv?.headerTextColor ? adv.headerTextColor : undefined }}>
                  {dateStr.replace(/\s+,/, ',')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE AREA: Empty flexible space so Fullscreen Slideshow behind shines through! */}
        <div className="flex-1 w-full pointer-events-none" />

        {/* BOTTOM AREA: Prayer Cards & Thin Status Bar */}
        <div className="w-full flex flex-col relative z-30 pb-4 sm:pb-6 px-4 sm:px-8 gap-4 sm:gap-6">

          {/* Modern Prayer Times Grid */}
          {adv?.showPrayerTimes !== false && (
            <div className="w-full h-auto">
              <PrayerTimes config={config} nextPrayer={nextEvent.name} secondsRemaining={nextEvent.seconds} />
            </div>
          )}

          {/* Minimalist Translucent Running Text */}
          {adv?.showRunningText !== false && (
            <div className="w-[98%] mx-auto mb-2 bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 flex items-center h-10 sm:h-12 shadow-2xl">
              <div className="bg-emerald-600/90 h-full px-5 flex items-center justify-center text-white font-semibold uppercase tracking-[0.25em] text-[10px] sm:text-xs min-w-max">
                INFO TERKINI
              </div>
              <div className="flex-1 relative h-full">
                <RunningText texts={config.runningText} color={adv?.runningTextColor} speed={adv?.runningTextSpeed} bgColor="transparent" />
              </div>
            </div>
          )}
        </div>
      </div>

      <AudioPlayer
        url={audioUrl}
        playlist={activePlaylist}
        isPlaying={audioIsPlaying}
        onStop={handleAudioStop}
        onBlocked={handleAudioBlocked}
        playbackState={config.audio?.playbackState}
        onCommand={handleAudioCommand}
      />

      <AudioUnlockOverlay isVisible={isAudioBlocked} onUnlock={handleUnlockAudio} />
      {showLogoutConfirm && <LogoutConfirmation onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />}

    </main>
  );
}
