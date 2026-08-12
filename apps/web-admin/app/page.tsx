'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MosqueConfig, AudioActiveStatus } from '@mosque-digital-clock/shared-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, RefreshCw, LogOut, LayoutDashboard, MapPin,
  Clock, Image as ImageIcon, MessageSquare, Users,
  Wallet, Settings, Settings2, ChevronRight, UploadCloud,
  Music, Library, Plus, Moon, Sun, Menu, X, Play, Pause, Square, PlayCircle, XCircle, AlarmCheck, Sliders, Smartphone, Activity, Calendar,
  LogIn, Send, LayoutGrid, List, Power, Monitor, Video, Volume2, VolumeX, Search, Check, Bell, Plus
} from 'lucide-react';
import { useLogger } from './hooks/useLogger';
import { PrayerTimesCard } from '@/components/PrayerTimesCard';

// Dynamic import for MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('./components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center rounded-xl font-medium text-slate-400">Memuat Peta...</div>
});

import AdvancedConfigSection from './components/AdvancedConfigSection';
import PlaylistManager from './components/PlaylistManager';
import ScheduleManager from './components/ScheduleManager';
import { QuranBrowser } from '@/components/QuranBrowser';
// InputGroup is defined locally in AdvancedConfigSection usually, OR I need to check where it is.
// Actually, looking at line 500 of page.tsx, InputGroup is used but I don't see it defined in page.tsx in the views I had.
// Wait, at line 21, `import AdvancedConfigSection from ...`.
// Let me check if InputGroup is exported or local.

// I see `InputGroup` usage in `IdentitySection` (line 500).
// If it is used there, it must be defined in `page.tsx` or imported.
// I will check lines 1300+ of `page.tsx` later to see helper components.
// For now, I will just add the imports.

type Tab = 'dashboard' | 'identity' | 'prayer' | 'wabot' | 'media' | 'gallery' | 'content' | 'devices' | 'advance';

export default function AdminDashboard() {
  const [mosqueKey, setMosqueKey] = useState<string>('');
  const [audioStatus, setAudioStatus] = useState<AudioActiveStatus | null>(null);

  const [config, setConfig] = useState<MosqueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('admin-theme') as 'light' | 'dark') || 'light';
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } catch { /* ignore */ }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('admin-theme', next); } catch { /* ignore */ }
      return next;
    });
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'image' | 'audio' | 'any'>('any');
  const [pickerTarget, setPickerTarget] = useState<{ section: string, prayer?: string, playlistId?: string } | null>(null);
  const router = useRouter();
  const logger = useLogger('admin');

  useEffect(() => {
    const checkAuthAndKey = async () => {
      const key = new URLSearchParams(window.location.search).get('key');
      if (key) {
        setMosqueKey(key);
        localStorage.setItem('lastMosqueKey', key);
      } else {
        // Fallback if no key in URL
        const stored = localStorage.getItem('lastMosqueKey');
        if (stored) {
          setMosqueKey(stored);
          router.replace(`/?key=${stored}`);
        } else {
          // If no stored key, try to fetch the default key from the server
          try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
              const data = await res.json();
              if (data.mosqueKey) {
                localStorage.setItem('lastMosqueKey', data.mosqueKey);
                setMosqueKey(data.mosqueKey);
                router.replace(`/?key=${data.mosqueKey}`);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to fetch user mosque key:', e);
          }
          // If all fails, redirect to login
          router.push('/login');
        }
      }
    };
    
    checkAuthAndKey();
  }, [router]);

  useEffect(() => {
    if (mosqueKey) {
      fetchConfig();
    }
  }, [mosqueKey]);

  // Audio Status Polling
  useEffect(() => {
    if (!mosqueKey) return;

    const pollAudioStatus = async () => {
      try {
        const res = await fetch(`/api/audio/active-status?key=${mosqueKey}`);
        const data = await res.json();
        setAudioStatus(data.isPlaying ? data : null);
      } catch (err) {
        console.error('Failed to poll audio status', err);
      }
    };

    pollAudioStatus();
    const interval = setInterval(pollAudioStatus, 5000);
    return () => clearInterval(interval);
  }, [mosqueKey]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/config?key=${mosqueKey}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        alert('Anda tidak memiliki akses ke masjid ini.');
        return;
      }
      const data = await res.json();
      // Normalize data: ensure fields exist and URLs are relative
      const normalized: MosqueConfig = {
        ...data,
        gallery: data.gallery || [],
        sliderImages: (data.sliderImages || []).map((url: string) =>
          url.startsWith('http') ? '/' + url.split('/').slice(3).join('/') : url
        ),
        mosqueInfo: {
          ...data.mosqueInfo,
          logoUrl: data.mosqueInfo.logoUrl?.startsWith('http')
            ? '/' + data.mosqueInfo.logoUrl.split('/').slice(3).join('/')
            : data.mosqueInfo.logoUrl
        },
        jumat: Array.isArray(data.jumat) ? data.jumat : (data.jumat ? [{ ...data.jumat }] : []),
        finance: data.finance?.accounts ? {
          ...data.finance,
          enabled: data.finance.enabled !== undefined ? data.finance.enabled : true
        } : {
          enabled: true,
          totalBalance: data.finance?.balance || 0,
          lastUpdated: data.finance?.lastUpdated || new Date().toISOString().split('T')[0],
          accounts: data.finance?.balance !== undefined ? [
            {
              name: 'Kas Utama',
              balance: data.finance.balance || 0,
              income: data.finance.income || 0,
              expense: data.finance.expense || 0
            }
          ] : []
        }
      };
      setConfig(normalized);
    } catch (error) {
      console.error('Failed to fetch config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('lastMosqueKey');
    router.push('/login');
  };

  const handleSave = async (configOverride?: MosqueConfig) => {
    const configToSave = configOverride || config;
    if (!configToSave || !mosqueKey) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/config?key=${mosqueKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      // Optional: Add toast notification
      logger.success('Configuration saved manually', { timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Gagal menyimpan: ${error.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const updateConfig = (section: keyof MosqueConfig, key: string, value: any) => {
    if (!config) return;

    // Check if section is 'simulation' or any other nested object that might be undefined
    const currentSection = config[section as keyof MosqueConfig] || {};

    setConfig({
      ...config,
      [section]: {
        ...currentSection,
        [key]: value,
      },
    });
  };

  if (loading && !config) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-400">
      <RefreshCw className="animate-spin mr-2" size={18} /> Memuat Data...
    </div>
  );

  if (!config) return <div className="p-10 text-center text-red-500">Error loading config</div>;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 app-sidebar flex flex-col z-50 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 brand-glow">
              <img src="/logo.svg?v=3" alt="Logo" className="w-7 h-7 rounded-lg" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-sm leading-tight tracking-tight">Smart Mosque</h1>
              <p className="text-[10px] text-emerald-300/80 font-semibold uppercase tracking-widest">Digital Signage</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={MapPin} label="Identitas Masjid" active={activeTab === 'identity'} onClick={() => { setActiveTab('identity'); setSidebarOpen(false); }} />
          <SidebarItem icon={Clock} label="Jadwal Sholat" active={activeTab === 'prayer'} onClick={() => { setActiveTab('prayer'); setSidebarOpen(false); }} />
          <SidebarItem icon={Smartphone} label="Integrasi WhatsApp" active={activeTab === 'wabot'} onClick={() => { setActiveTab('wabot'); setSidebarOpen(false); }} />
          <SidebarItem icon={Settings} label="Media & Fitur" active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setSidebarOpen(false); }} />
          <SidebarItem icon={Library} label="Galeri Media" active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }} />
          <SidebarItem icon={MessageSquare} label="Konten Informasi" active={activeTab === 'content'} onClick={() => { setActiveTab('content'); setSidebarOpen(false); }} />
          <SidebarItem icon={Monitor} label="Manajemen Device" active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setSidebarOpen(false); }} />
          <SidebarItem icon={Sliders} label="Advance Config" active={activeTab === 'advance'} onClick={() => { setActiveTab('advance'); setSidebarOpen(false); }} />
          <div className="pt-3 mt-3 border-t border-white/10">
            <button
              onClick={() => router.push('/logs')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Activity size={18} />
              System Logs
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2.5 bg-white/5 rounded-lg mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Mosque Key</p>
            <p className="text-sm font-mono font-bold text-emerald-400 truncate">{mosqueKey}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-rose-400 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                {activeTab === 'dashboard' ? (
                  <span>
                    Selamat {new Date().getHours() < 12 ? 'Pagi' : new Date().getHours() < 15 ? 'Siang' : new Date().getHours() < 18 ? 'Sore' : 'Malam'},
                    <span className="text-emerald-500 ml-1.5">{config?.mosqueInfo.name || 'Admin'}</span>
                  </span>
                ) : (
                  tabLabels[activeTab]
                )}
              </h2>
              {activeTab === 'dashboard' && (
                <p className="hidden sm:block text-[11px] text-slate-400">Control Panel & Digital Signage</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-4 mr-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-700">Online</span>
              </div>
            </div>

            <div className="hidden xs:flex flex-col items-end">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Mosque Key</span>
              <span className="block text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{mosqueKey}</span>
            </div>
            <button
              onClick={() => fetchConfig()}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Emergency Stop Bar — persistent across ALL tabs when audio is playing */}
        <AnimatePresence>
          {audioStatus && audioStatus.isPlaying && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
            >
              <div className="bg-slate-900 border-b border-emerald-800/50 px-4 lg:px-8 py-2.5 flex items-center gap-3">
                {/* Pulse indicator */}
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Sedang Memutar</p>
                  <p className="text-sm text-white truncate font-semibold">{audioStatus.title || 'Audio Aktif'}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      const newConfig = { ...config, audio: { ...config.audio, playbackState: 'paused' as const } };
                      await handleSave(newConfig);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition"
                  >
                    <Pause size={13} fill="currentColor" /> Pause
                  </button>
                  <button
                    onClick={async () => {
                      const newConfig = { ...config, audio: { ...config.audio, playbackState: 'stopped' as const } };
                      await handleSave(newConfig);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-rose-900/50 active:scale-95"
                  >
                    <Square size={13} fill="currentColor" stroke="none" /> STOP AUDIO
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-6xl mx-auto pb-24"
            >
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Prayer Times (Tall) */}
                  <div className="lg:col-span-1 h-full">
                    {config && <PrayerTimesCard config={config} mosqueKey={mosqueKey} />}
                  </div>

                  {/* Right Column: Stats Grid */}
                  <div className="lg:col-span-2 space-y-6">
                    {audioStatus && <LiveAudioWidget status={audioStatus} updateConfig={updateConfig} config={config} />}
                    <DashboardOverview config={config} setActiveTab={setActiveTab} updateConfig={updateConfig} onSave={handleSave} status={audioStatus} />
                  </div>
                </div>
              )}
              {activeTab === 'identity' && (
                <IdentitySection
                  config={config}
                  setConfig={setConfig}
                  updateConfig={updateConfig}
                  mosqueKey={mosqueKey}
                  onPickLogo={() => {
                    setPickerType('image');
                    setPickerTarget({ section: 'logo' });
                    setPickerOpen(true);
                  }}
                />
              )}
              {activeTab === 'prayer' && (
                <PrayerSection
                  config={config}
                  setConfig={setConfig}
                  onSave={handleSave}
                  onOpenPicker={(type: any, target: any) => {
                    setPickerType(type);
                    setPickerTarget(target);
                    setPickerOpen(true);
                  }}
                />
              )}
              {activeTab === 'wabot' && (
                <div className="space-y-6">
                  <SectionCard title="Integrasi WhatsApp">
                    <WabotConfigSection config={config} setConfig={setConfig} mosqueKey={mosqueKey} />
                  </SectionCard>
                </div>
              )}
              {activeTab === 'media' && (
                <MediaConfigSection
                  config={config}
                  setConfig={setConfig}
                  mosqueKey={mosqueKey}
                  onSave={handleSave}
                  audioStatus={audioStatus}
                  onOpenPicker={(type: any, target: any) => {
                    setPickerType(type);
                    setPickerTarget(target);
                    setPickerOpen(true);
                  }}
                />
              )}
              {activeTab === 'gallery' && <GallerySection config={config} setConfig={setConfig} updateConfig={updateConfig} mosqueKey={mosqueKey} />}
              {activeTab === 'content' && (
                <ContentSection
                  config={config}
                  setConfig={setConfig}
                  onOpenPicker={(type: any, target: any) => {
                    setPickerType(type);
                    setPickerTarget(target);
                    setPickerOpen(true);
                  }}
                  mosqueKey={mosqueKey}
                />
              )}
              {activeTab === 'devices' && <DevicesSection mosqueKey={mosqueKey} />}
              {activeTab === 'advance' && <AdvancedConfigSection config={config} setConfig={setConfig} />}
            </motion.div>
          </AnimatePresence>

          <MediaPickerModal
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            gallery={config.gallery}
            mosqueKey={mosqueKey}
            type={pickerType}
            onSelect={(url) => {
              if (pickerTarget?.section === 'logo') {
                setConfig({ ...config, mosqueInfo: { ...config.mosqueInfo, logoUrl: url } });
              } else if (pickerTarget?.section === 'slideshow') {
                if (!config.sliderImages.includes(url)) {
                  setConfig({ ...config, sliderImages: [...config.sliderImages, url] });
                }
              } else if (pickerTarget?.section === 'global-audio') {
                setConfig({ ...config, audio: { ...config.audio, globalUrl: url } });
              } else if (pickerTarget?.section === 'playlist-track') {
                const playlistId = pickerTarget.playlistId;
                const playlist = config.audio.playlists.find(p => p.id === playlistId);
                if (playlist) {
                  const newTrack = {
                    id: `track-${Date.now()}`,
                    title: url.split('/').pop() || 'Unknown',
                    url: url
                  };
                  const newPlaylists = config.audio.playlists.map(p =>
                    p.id === playlistId ? { ...p, tracks: [...p.tracks, newTrack] } : p
                  );
                  setConfig({ ...config, audio: { ...config.audio, playlists: newPlaylists } });
                }
              } else if (pickerTarget?.section === 'ramadhan-audio') {
                setConfig({
                  ...config,
                  ramadhan: {
                    enabled: config.ramadhan?.enabled || false,
                    imsakOffset: config.ramadhan?.imsakOffset || 10,
                    ...config.ramadhan,
                    imsakAudioUrl: url,
                    imsakAudioEnabled: true
                  }
                });
              } else if (pickerTarget?.section === 'iqamah-audio') {
                setConfig({
                  ...config,
                  iqamah: {
                    ...config.iqamah,
                    audioUrl: url,
                    audioEnabled: true
                  }
                });
              } else if (pickerTarget?.section === 'adzan-audio') {
                setConfig({
                  ...config,
                  adzan: {
                    ...config.adzan,
                    audioUrl: url,
                    audioEnabled: true
                  }
                });
              }
            }}
          />
        </div>

        {/* Floating Save Bar */}
        <div className="sticky bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 lg:px-6 py-3 flex flex-col sm:flex-row gap-3 justify-between items-center z-30">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            {saving ? 'Menyimpan perubahan...' : 'Pastikan menyimpan setelah mengubah data.'}
          </div>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className={`
                    w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white text-sm transition-all duration-200
                    ${saving ? 'bg-slate-300 cursor-wait' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'}
                `}
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </main >
    </div >
  );
}

// --- Subcomponents ---

const tabLabels: Record<Tab, string> = {
  dashboard: 'Dashboard Overview',
  identity: 'Identitas Masjid',
  prayer: 'Konfigurasi Jadwal Sholat',
  wabot: 'Integrasi WhatsApp',
  media: 'Media & Fitur Unggulan',
  gallery: 'Galeri Media',
  content: 'Konten Informasi',
  devices: 'Manajemen Perangkat TV',
  advance: 'Advanced Configuration (Tampilan)',
};

function LiveAudioWidget({ status, updateConfig, config }: { status: AudioActiveStatus, updateConfig: any, config: MosqueConfig }) {
  const [isStopping, setIsStopping] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentProgress = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  const handleControl = async (targetState: 'playing' | 'paused' | 'stopped') => {
    if (targetState === 'stopped') setIsStopping(true);
    if (targetState === 'paused' || targetState === 'playing') setIsPausing(true);

    try {
      await updateConfig({
        ...config,
        audio: {
          ...config.audio,
          playbackState: targetState
        }
      });
    } catch (err) {
      console.error('Failed to update playback state', err);
    } finally {
      setIsStopping(false);
      setIsPausing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2744] rounded-2xl p-5 text-white border border-slate-700 shadow-sm relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Sedang Memutar</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Client Playback</p>
          </div>
        </div>

        <div className="mb-5">
          <h4 className="text-base font-bold text-slate-100 mb-1 truncate pr-12">{status.title || 'Unknown Track'}</h4>
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2">
            <span>{formatTime(status.currentTime)}</span>
            <span>{formatTime(status.duration)}</span>
          </div>
          <div className="h-1 w-full bg-slate-700 rounded-full mt-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleControl(status.isPlaying ? 'paused' : 'playing')}
            disabled={isPausing}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            {status.isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {status.isPlaying ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => handleControl('stopped')}
            disabled={isStopping}
            className="flex items-center gap-2 px-3 py-2 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Square size={14} fill="currentColor" stroke="none" />
            Stop
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
        active
          ? 'nav-active text-white border-l-[3px] border-emerald-300 pl-[9px]'
          : 'text-slate-300/80 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent'
      }`}
    >
      <Icon size={18} className={`shrink-0 ${active ? 'text-emerald-200' : 'text-emerald-300/60'}`} />
      <span className={active ? 'font-semibold' : ''}>{label}</span>
    </button>
  );
}

function SectionCard({ title, children, className = '', headerAction }: { title: string, children: React.ReactNode, className?: string, headerAction?: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 md:p-6 mb-5 ${className}`}>
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{label}</span>
      <div className="relative inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
      </div>
    </label>
  );
}


function PlaybackRemoteControl({ config, setConfig, onSave, status, className = "" }: { config: MosqueConfig, setConfig: any, onSave: any, status?: AudioActiveStatus | null, className?: string }) {
  if (!config?.audio) return null;

  const handleStateChange = (state: 'playing' | 'paused' | 'stopped') => {
    const newConfig = { ...config, audio: { ...config.audio, playbackState: state } };
    setConfig(newConfig);
    onSave(newConfig);
  };

  // Logic for highlights: prioritize real-time status if available
  const isPlaying = status ? status.isPlaying : config.audio.playbackState === 'playing';
  const isPaused = status ? (!status.isPlaying && status.currentTime > 0) : config.audio.playbackState === 'paused';
  const isStopped = status ? (!status.isPlaying && status.currentTime === 0) : config.audio.playbackState === 'stopped';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12} className={status?.isPlaying ? 'text-emerald-500' : 'text-slate-300'} />
          Remote Control Playback (Client)
        </p>
        {status && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status.isPlaying ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            {status.isPlaying ? 'LIVE' : 'IDLE'}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleStateChange('playing')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-none transition-all font-bold text-sm ${isPlaying ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          <Play size={16} fill={isPlaying ? "currentColor" : "none"} />
          PLAY
        </button>
        <button
          onClick={() => handleStateChange('paused')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-none transition-all font-bold text-sm ${isPaused ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          <Pause size={16} fill={isPaused ? "currentColor" : "none"} />
          PAUSE
        </button>
        <button
          onClick={() => handleStateChange('stopped')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-none transition-all font-bold text-sm ${isStopped ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          <Square size={16} fill={isStopped ? "currentColor" : "none"} />
          STOP
        </button>
      </div>
    </div>
  );
}


function DashboardOverview({ config, setActiveTab, updateConfig, onSave, status }: { config: MosqueConfig, setActiveTab: (tab: Tab) => void, updateConfig: any, onSave: any, status?: AudioActiveStatus | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Health Bar — ringkasan status (flat, klik untuk lompat ke menu) */}
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
          <button onClick={() => setActiveTab('media')} className="flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status?.isPlaying ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Audio</div>
              <div className={`text-sm font-bold ${status?.isPlaying ? 'text-emerald-600' : 'text-slate-600'}`}>{status?.isPlaying ? 'LIVE' : 'IDLE'}</div>
            </div>
          </button>
          <button onClick={() => setActiveTab('prayer')} className="flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><MapPin size={18} /></div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Kota Jadwal</div>
              <div className="text-sm font-bold text-slate-700 truncate">{config?.prayerTimes?.cityName || config?.prayerTimes?.cityId || '—'}</div>
            </div>
          </button>
          <button onClick={() => setActiveTab('media')} className="flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><ImageIcon size={18} /></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Slide Aktif</div>
              <div className="text-sm font-bold text-slate-700">{(config?.sliderImages?.length || 0)}</div>
            </div>
          </button>
          <button onClick={() => setActiveTab('gallery')} className="flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center"><Library size={18} /></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Item Galeri</div>
              <div className="text-sm font-bold text-slate-700">{(config?.gallery?.length || 0)}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Mosque Info Card */}
      <div
        onClick={() => setActiveTab('identity')}
        className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Identitas Masjid</h3>
            <p className="text-xs text-slate-400">Kelola informasi dasar</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-emerald-400 transition-colors" />
        </div>

        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg flex gap-2">
          <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{config.mosqueInfo.address || 'Belum ada alamat'}</span>
        </div>
      </div>

      {/* Finance Card */}
      <div className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Kas Masjid</h3>
            <p className="text-xs text-slate-400">Laporan Keuangan</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1">Total Saldo</div>
          <div className="text-2xl font-black text-slate-800">
            Rp {config.finance?.totalBalance?.toLocaleString('id-ID') || '0'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">Pemasukan</div>
            <div className="font-bold text-slate-700 text-sm">
              Rp {(config.finance?.accounts?.[0]?.income || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
            <div className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">Pengeluaran</div>
            <div className="font-bold text-slate-700 text-sm">
              Rp {(config.finance?.accounts?.[0]?.expense || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Other Stats - Redesigned */}
      <div className="space-y-6">
      {/* Running Text Preview */}
      <div
        onClick={() => setActiveTab('content')}
        className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-500" />
            Running Text
          </h3>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
        <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-xs overflow-hidden whitespace-nowrap">
          <div className="animate-marquee inline-block">
            {config.runningText?.[0] || "Selamat Datang di Masjid..."}
          </div>
        </div>
      </div>

        {/* Theme / Mode */}
        <div className="bg-[#1a2744] rounded-xl p-5 text-white">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Tema Saat Ini</div>
          <div className="text-lg font-bold mb-0.5 capitalize">{config.theme?.mode || 'default'}</div>
          <div className="text-xs text-slate-500">
            Background: {config.theme?.backgroundType === 'image' ? 'Gambar' : 'Warna Solid'}
          </div>
        </div>

        {/* Playback Control on Dashboard */}
        <div className="md:col-span-2 bg-white rounded-xl p-5 border border-slate-200">
          <PlaybackRemoteControl config={config} setConfig={updateConfig} onSave={onSave} status={status} />
        </div>
      </div>
    </div>
  );
}


function IdentitySection({ config, setConfig, updateConfig, onPickLogo, mosqueKey }: any) {
  return (
    <div className="space-y-6">
      <SectionCard title="Identitas Masjid">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-4">
            <InputGroup label="Nama Masjid" value={config.mosqueInfo.name} onChange={(v: string) => updateConfig('mosqueInfo', 'name', v)} />
            <InputGroup label="Alamat Lengkap" value={config.mosqueInfo.address} onChange={(v: string) => updateConfig('mosqueInfo', 'address', v)} type="textarea" />
          </div>

          {/* Logo Upload */}
          <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 bg-white rounded-lg border border-slate-200 shadow-sm mb-4 flex items-center justify-center overflow-hidden p-2">
              {config.mosqueInfo.logoUrl ? (
                <img src={resolveUrl(config.mosqueInfo.logoUrl, mosqueKey)} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <span className="text-4xl">🕌</span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold cursor-pointer hover:bg-emerald-100 transition shadow-sm group">
                <UploadCloud size={18} className="group-hover:scale-110 transition-transform" />
                Upload Logo
                <input type="file" hidden accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
                  const data = await res.json();
                  if (data.success) {
                    const url = data.url;
                    setConfig({
                      ...config,
                      mosqueInfo: { ...config.mosqueInfo, logoUrl: url },
                      gallery: config.gallery?.includes(url) ? config.gallery : [...(config.gallery || []), url]
                    });
                  }
                }} />
              </label>
              <button
                onClick={onPickLogo}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition shadow-sm"
              >
                <Library size={18} />
                Pilih dari Galeri
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Max 2MB (PNG/Transparent)</p>
          </div>
        </div>
      </SectionCard>


    </div>
  );
}


function CityPicker({ config, setConfig, onSave }: any) {
  const MYQURAN_BASE = 'https://api.myquran.com/v2';
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<{ id: string; lokasi: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [jadwal, setJadwal] = useState<any | null>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [jadwalErr, setJadwalErr] = useState('');

  const cityId = config?.prayerTimes?.cityId || '';
  const cityName = config?.prayerTimes?.cityName || '';

  const searchCity = async () => {
    const kw = keyword.trim();
    if (kw.length < 3) { setSearchErr('Ketik minimal 3 huruf nama kota.'); return; }
    setSearching(true); setSearchErr(''); setResults([]);
    try {
      const res = await fetch(`${MYQURAN_BASE}/sholat/kota/cari/${encodeURIComponent(kw)}`);
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      setResults(data);
      if (data.length === 0) setSearchErr('Kota tidak ditemukan. Coba kata kunci lain.');
    } catch {
      setSearchErr('Gagal memuat daftar kota. Periksa koneksi internet perangkat ini.');
    } finally {
      setSearching(false);
    }
  };

  const selectCity = (c: { id: string; lokasi: string }) => {
    const next = { ...config, prayerTimes: { ...config.prayerTimes, cityId: c.id, cityName: c.lokasi } };
    setConfig(next);
    onSave?.(next);
    setResults([]);
    setKeyword('');
    setJadwal(null);
  };

  const loadPreview = async () => {
    if (!cityId) { setJadwalErr('Pilih kota terlebih dahulu.'); return; }
    setLoadingJadwal(true); setJadwalErr(''); setJadwal(null);
    try {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const url = `${MYQURAN_BASE}/sholat/jadwal/${cityId}/${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
      const res = await fetch(url);
      const json = await res.json();
      const j = json?.data?.jadwal;
      if (!j) { setJadwalErr('Jadwal tidak tersedia untuk kota ini.'); return; }
      setJadwal(j);
    } catch {
      setJadwalErr('Gagal memuat jadwal. Periksa koneksi internet perangkat ini.');
    } finally {
      setLoadingJadwal(false);
    }
  };

  const jadwalRows: [string, string][] = jadwal ? [
    ['Imsak', jadwal.imsak], ['Subuh', jadwal.subuh], ['Terbit', jadwal.terbit],
    ['Dzuhur', jadwal.dzuhur], ['Ashar', jadwal.ashar], ['Maghrib', jadwal.maghrib], ['Isya', jadwal.isya],
  ] : [];

  return (
    <SectionCard title="Kota Jadwal Sholat (Sumber Pusat / myQuran)">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <MapPin size={16} className="text-emerald-600 shrink-0" />
          <div className="text-sm">
            <span className="text-slate-500">Kota aktif: </span>
            <b className="text-emerald-700">{cityName || 'Belum dipilih'}</b>
            {cityId && <span className="text-slate-400 font-mono ml-2">#{cityId}</span>}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cari Kota / Kabupaten</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchCity(); }}
                placeholder="Contoh: Jakarta, Bandung, Surabaya..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <button
              onClick={searchCity}
              disabled={searching}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold disabled:opacity-50"
            >
              {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Cari
            </button>
          </div>
          {searchErr && <p className="text-xs text-rose-500 mt-2">{searchErr}</p>}
        </div>

        {results.length > 0 && (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-auto">
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCity(c)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left hover:bg-emerald-50 transition"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <MapPin size={14} className="text-emerald-500" /> {c.lokasi}
                </span>
                {config?.prayerTimes?.cityId === c.id
                  ? <Check size={16} className="text-emerald-600" />
                  : <ChevronRight size={16} className="text-slate-300" />}
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Preview Jadwal Hari Ini
            </p>
            <button
              onClick={loadPreview}
              disabled={loadingJadwal || !cityId}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingJadwal ? 'animate-spin' : ''} />
              Muat Jadwal
            </button>
          </div>
          {jadwalErr && <p className="text-xs text-rose-500">{jadwalErr}</p>}
          {jadwalRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {jadwalRows.map(([label, time]) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</div>
                  <div className="text-sm font-bold text-slate-700 tabular-nums">{time || '--:--'}</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 italic mt-2">Sumber: api.myquran.com (jadwal Kemenag). Pemilihan kota & preview butuh internet pada perangkat admin.</p>
        </div>
      </div>
    </SectionCard>
  );
}

function PrayerSection({ config, setConfig, onOpenPicker, onSave }: any) {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCityFromCoordinates = async (lat: number, lng: number) => {
    let nextConfig = { ...config, prayerTimes: { ...config.prayerTimes, coordinates: { lat, lng } } };
    setIsSyncing(true);
    // Optimistically update coordinates first
    setConfig(nextConfig);
    
    try {
      // 1. Reverse Geocoding via Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      let city = data.address?.city || data.address?.county || data.address?.town || data.address?.village || '';
      
      if (city) {
        city = city.replace(/Kota |Kabupaten |Kab\. /gi, '').trim();
        
        // 2. Search City in MyQuran API
        const searchRes = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`);
        const searchData = await searchRes.json();
        
        if (searchData.status && searchData.data && searchData.data.length > 0) {
          nextConfig.prayerTimes.cityId = searchData.data[0].id;
          nextConfig.prayerTimes.cityName = searchData.data[0].lokasi;
        }
      }
    } catch (err) {
      console.error('Failed to auto-sync city', err);
    } finally {
      setIsSyncing(false);
      setConfig(nextConfig);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Lokasi & Titik Koordinat (Sinkronisasi Kota Otomatis)">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
              Titik koordinat ini digunakan untuk <b>mencari kota secara otomatis</b> pada jadwal Kemenag (MyQuran), 
              dan sebagai cadangan (fallback) hisab lokal jika sistem gagal menghubungi server pusat.
            </p>
            <InputGroup
              label="Latitude (Lintang)"
              value={config.prayerTimes.coordinates.lat}
              onChange={(v: string) => {
                const newC = { ...config.prayerTimes.coordinates, lat: parseFloat(v) };
                setConfig({ ...config, prayerTimes: { ...config.prayerTimes, coordinates: newC } });
              }}
              type="number"
              step="0.000001"
            />
            <InputGroup
              label="Longitude (Bujur)"
              value={config.prayerTimes.coordinates.lng}
              onChange={(v: string) => {
                const newC = { ...config.prayerTimes.coordinates, lng: parseFloat(v) };
                setConfig({ ...config, prayerTimes: { ...config.prayerTimes, coordinates: newC } });
              }}
              type="number"
              step="0.000001"
            />
            <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-start gap-2 border border-emerald-100 italic">
              {isSyncing ? (
                <>
                  <RefreshCw size={16} className="mt-0.5 flex-shrink-0 animate-spin" />
                  <span>Sedang menyesuaikan kota dengan titik koordinat...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Tip: Klik pada peta untuk mengambil titik koordinat dan otomatis menyesuaikan Kota Jadwal Sholat di bawah.</span>
                </>
              )}
            </div>
          </div>

          <MapPicker
            lat={config.prayerTimes.coordinates.lat}
            lng={config.prayerTimes.coordinates.lng}
            onChange={syncCityFromCoordinates}
          />
        </div>
      </SectionCard>

      <CityPicker config={config} setConfig={setConfig} onSave={onSave} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Koreksi Jam Global (Detik)">
          <div className="space-y-4">
            <InputGroup
              label="Koreksi Detik (+/-)"
              value={config.display?.timeOffset || 0}
              type="number"
              onChange={(v: string) => {
                setConfig({
                  ...config,
                  display: { ...config.display, timeOffset: parseInt(v) }
                });
              }}
              placeholder="Contoh: 5 atau -5"
            />
            <p className="text-[10px] text-slate-500 italic">
              Gunakan ini untuk menyesuaikan jam master jika waktu server tidak tepat.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Koreksi Waktu Sholat (Menit)">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.prayerTimes.adjustments).map(([k, v]) => (
                <InputGroup key={k} label={`Koreksi ${k}`} value={v} type="number" onChange={(val: string) => {
                  const n = { ...config.prayerTimes.adjustments, [k]: parseInt(val) };
                  setConfig({ ...config, prayerTimes: { ...config.prayerTimes, adjustments: n } });
                }} />
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onSave()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-semibold shadow-sm"
              >
                <Save size={16} />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Durasi Fase Sholat">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="Durasi Adzan (Menit)"
              value={config.adzan?.duration || 4}
              type="number"
              onChange={(v: string) => {
                setConfig({
                  ...config,
                  adzan: { ...config.adzan, duration: parseInt(v) }
                });
              }}
            />
            <InputGroup
              label="Durasi Sholat (Layar Blank)"
              value={config.sholat?.duration || 10}
              type="number"
              onChange={(v: string) => {
                setConfig({
                  ...config,
                  sholat: { ...config.sholat, duration: parseInt(v) }
                });
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">
            <strong>Durasi Sholat:</strong> Waktu layar gelap/tenang setelah Iqamah selesai.
          </p>


        </SectionCard>

        <SectionCard title="Countdown Iqamah">
          <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input type="checkbox" checked={config.iqamah.enabled} onChange={(e) =>
              setConfig({ ...config, iqamah: { ...config.iqamah, enabled: e.target.checked } })
            } className="w-5 h-5 accent-emerald-600" />
            <span className="font-medium text-slate-700">Aktifkan Hitung Mundur</span>
          </div>
          {config.iqamah.enabled && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
              {Object.entries(config.iqamah.waitTime).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">{k}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-full p-2 border rounded-lg text-center font-bold text-slate-700" value={v as number}
                      onChange={(e) => {
                        const n = { ...config.iqamah.waitTime, [k]: parseInt(e.target.value) };
                        setConfig({ ...config, iqamah: { ...config.iqamah, waitTime: n } });
                      }} />
                    <span className="text-xs text-slate-400">mnt</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.iqamah.audioEnabled}
                  onChange={(e) => setConfig({ ...config, iqamah: { ...config.iqamah, audioEnabled: e.target.checked } })}
                  className="w-5 h-5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-700 block text-sm">Audio Pengingat Sholat</span>
                  <span className="text-[10px] text-slate-400">Putar audio pengingat saat detik-detik akhir Iqamah (sholat akan dimulai)</span>
                </div>
              </div>
            </div>

            {config.iqamah.audioEnabled && (
              <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between truncate">
                  <div className="flex items-center gap-2 truncate">
                    <Music size={16} className="text-emerald-500" />
                    <span className="text-xs font-mono text-slate-600 truncate">
                      {config.iqamah.audioUrl ? config.iqamah.audioUrl.split('/').pop() : 'Belum ada audio terpilih'}
                    </span>
                  </div>
                  <button onClick={() => onOpenPicker('audio', { section: 'iqamah-audio' })} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm ml-2 shrink-0">
                    PILIH
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>


      </div>



    </div>
  );
}

function WabotConfigSection({ config, setConfig, mosqueKey }: { config: MosqueConfig, setConfig: any, mosqueKey: string }) {
  const [waStatus, setWaStatus] = useState({ status: 'DISCONNECTED', qr: null as string | null, groups: [] as { id: string, name: string }[] });
  const [showGroups, setShowGroups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testTargetNumber, setTestTargetNumber] = useState<string>(config.wabot?.targetNumber || '');

  const wabotConfig = config.wabot || { enabled: false, targetNumber: '' };

  useEffect(() => {
    const fetchWaStatus = async () => {
      try {
        const res = await fetch(`/api/wa/status?key=${mosqueKey}`);
        const data = await res.json();
        setWaStatus(data);
      } catch (e) {
        console.error('Failed to fetch WA status', e);
      }
    };

    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 bg-green-50 p-3 rounded-lg border border-green-100">
        <input type="checkbox" checked={wabotConfig.enabled} onChange={async (e) => {
          const isChecked = e.target.checked;
          setConfig({ ...config, wabot: { ...wabotConfig, enabled: isChecked } });
          if (isChecked) {
            try {
              await fetch(`/api/wa/status?key=${mosqueKey}`, { method: 'POST' });
            } catch (err) {
              console.error('Failed to trigger WA service auto-start', err);
            }
          }
        }} className="w-5 h-5 accent-emerald-600" />
        <div>
          <span className="font-medium text-green-800">Aktifkan Notifikasi WhatsApp (Lokal)</span>
          <p className="text-xs text-green-600">Kirim pesan otomatis ke grup/nomor melalui library WhatsApp lokal.</p>
        </div>
      </div>

      {wabotConfig.enabled && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: CONFIGURATION */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                  <MessageSquare size={16} /> Pengaturan Pesan
                </h4>

                <div className="flex flex-col gap-2">
                  <InputGroup
                    label="WhatsApp Target ID (Grup/Nomor)"
                    value={wabotConfig.targetNumber || ''}
                    onChange={(v: string) => setConfig({ ...config, wabot: { ...wabotConfig, targetNumber: v } })}
                    placeholder="628xxx atau ID Group"
                  />
                  {waStatus.status === 'CONNECTED' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowGroups(!showGroups)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded"
                      >
                        {showGroups ? 'Sembunyikan Daftar Grup' : 'Lihat Daftar Grup (ID Grup)'}
                        <ChevronRight size={12} className={`transition-transform ${showGroups ? 'rotate-90' : ''}`} />
                      </button>

                      {showGroups && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1">
                          {waStatus.groups.length > 0 ? (
                            waStatus.groups.map(g => (
                              <div key={g.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all text-[10px]">
                                <span className="font-bold text-slate-700 truncate">{g.name}</span>
                                <button
                                  onClick={() => {
                                    setConfig({ ...config, wabot: { ...wabotConfig, targetNumber: g.id } });
                                    navigator.clipboard.writeText(g.id);
                                  }}
                                  className="shrink-0 text-emerald-600 font-mono hover:underline"
                                >
                                  Salin ID
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 text-center py-2 italic">Tidak ada grup ditemukan.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <InputGroup
                  label="Template Pesan"
                  value={wabotConfig.messageTemplate || 'Waktu sholat {sholat} telah tiba.'}
                  onChange={(v: string) => setConfig({ ...config, wabot: { ...wabotConfig, messageTemplate: v } })}
                  type="textarea"
                />

                {/* Per-Prayer Config */}
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlarmCheck size={14} className="text-emerald-500" />
                    Kustomisasi Per Waktu Sholat
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {['imsak', 'subuh', 'dzuhur', 'jumat', 'ashar', 'maghrib', 'isya'].map((pKey) => {
                      const pConfig = wabotConfig.prayerNotifications?.[pKey] || { enabled: true };
                      const pNames: any = { imsak: 'Imsak', subuh: 'Subuh', dzuhur: 'Dzuhur', jumat: 'Sholat Jumat', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya' };
                      const updatePConfig = (patch: object) => {
                        const newNotify = { ...(wabotConfig.prayerNotifications || {}), [pKey]: { ...pConfig, ...patch } };
                        setConfig({ ...config, wabot: { ...wabotConfig, prayerNotifications: newNotify } });
                      };
                      return (
                        <div key={pKey} className={`group bg-slate-50/50 border rounded-xl p-3 transition-all ${pConfig.enabled ? 'border-slate-200 hover:border-emerald-200 hover:bg-white' : 'border-slate-100 opacity-60'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center">
                                <input 
                                  type="checkbox" 
                                  id={`notify-${pKey}`}
                                  checked={pConfig.enabled}
                                  onChange={(e) => updatePConfig({ enabled: e.target.checked })}
                                  className="w-4 h-4 accent-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                              </div>
                              <label htmlFor={`notify-${pKey}`} className={`text-[11px] font-bold cursor-pointer select-none ${pConfig.enabled ? 'text-slate-700' : 'text-slate-400'}`}>
                                {pNames[pKey]}
                              </label>
                            </div>
                            {!pConfig.enabled && <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">OFF</span>}
                          </div>
                          
                          {pConfig.enabled && (
                            <div className="mt-2 pl-7 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                              {/* Pesan Adzan */}
                              <textarea
                                value={pConfig.template || ''}
                                onChange={(e) => updatePConfig({ template: e.target.value })}
                                placeholder="Template pesan waktu adzan (opsional, pakai global jika kosong)"
                                className="w-full p-2 text-[10px] bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[44px] resize-none font-medium text-slate-600"
                              />

                              {/* ── Reminder Sub-section ── */}
                              <div className="border border-dashed border-amber-300/60 rounded-lg p-2.5 bg-amber-50/30 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`reminder-${pKey}`}
                                    checked={pConfig.reminderEnabled ?? false}
                                    onChange={(e) => updatePConfig({ reminderEnabled: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                                  />
                                  <label htmlFor={`reminder-${pKey}`} className="text-[10px] font-bold text-amber-700 cursor-pointer select-none flex items-center gap-1">
                                    ⏰ Kirim Reminder Sebelum Adzan
                                  </label>
                                </div>

                                {pConfig.reminderEnabled && (
                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="flex items-center gap-2">
                                      <label className="text-[9px] font-bold text-amber-600 uppercase tracking-wider whitespace-nowrap">Menit sebelum:</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={pConfig.reminderMinutes ?? 10}
                                        onChange={(e) => updatePConfig({ reminderMinutes: parseInt(e.target.value) || 10 })}
                                        className="w-16 px-2 py-1 text-[10px] font-bold bg-white border border-amber-200 rounded-md focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none text-center text-amber-800"
                                      />
                                      <span className="text-[9px] text-amber-500 font-medium">mnt sebelum adzan</span>
                                    </div>
                                    <textarea
                                      value={pConfig.reminderTemplate || ''}
                                      onChange={(e) => updatePConfig({ reminderTemplate: e.target.value })}
                                      placeholder={`⏰ Reminder: Waktu {sholat} akan tiba dalam {menit} menit ({jam}). Segera bersiap!`}
                                      className="w-full p-2 text-[10px] bg-white border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none min-h-[52px] resize-none font-medium text-amber-800 placeholder:text-amber-300"
                                    />
                                    <p className="text-[9px] text-amber-500 italic">Variabel: {'{sholat}'} = nama sholat, {'{jam}'} = waktu adzan, {'{menit}'} = menit sebelum</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    <b>TIP:</b> Gunakan <b>{`{sholat}`}</b> untuk nama waktu, <b>{`{jam}`}</b> untuk pukul otomatis di template pesan. Untuk <b>template reminder</b>, tambahkan <b>{`{menit}`}</b> untuk jumlah menit sebelum adzan.
                  </p>
                </div>

                {/* ── Custom Notifications ── */}
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell size={14} className="text-indigo-500" />
                    Notifikasi Kustom
                  </h5>
                  <p className="text-[10px] text-slate-500 mb-3 italic">
                    Atur notifikasi WA tambahan. Bisa jam tetap (misal: 08:00) atau relatif ke waktu sholat (misal: 30 menit sebelum Dzuhur).
                  </p>
                  {(wabotConfig.customNotifications || []).map((cn: any, idx: number) => (
                    <div key={cn.id || idx} className="border border-indigo-200 rounded-xl p-3 mb-3 bg-indigo-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={cn.enabled}
                            onChange={(e) => {
                              const list = [...(wabotConfig.customNotifications || [])];
                              list[idx] = { ...list[idx], enabled: e.target.checked };
                              setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                            }}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer" />
                          <span className="text-[11px] font-bold text-slate-700">{cn.message ? cn.message.substring(0, 30) + (cn.message.length > 30 ? '...' : '') : 'Notifikasi Baru'}</span>
                        </div>
                        <button onClick={() => {
                          const list = [...(wabotConfig.customNotifications || [])];
                          list.splice(idx, 1);
                          setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                        }} className="text-rose-400 hover:text-rose-600 text-[10px] font-bold">HAPUS</button>
                      </div>
                      {cn.enabled && (
                        <div className="space-y-3 pl-6 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipe:</label>
                            <select value={cn.type || 'fixed'}
                              onChange={(e) => {
                                const list = [...(wabotConfig.customNotifications || [])];
                                list[idx] = { ...list[idx], type: e.target.value };
                                setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                              }}
                              className="text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-400">
                              <option value="fixed">Jam Tetap</option>
                              <option value="prayer_relative">Relatif Sholat</option>
                            </select>
                          </div>
                          {cn.type === 'fixed' ? (
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jam:</label>
                              <input type="time" value={cn.time || ''}
                                onChange={(e) => {
                                  const list = [...(wabotConfig.customNotifications || [])];
                                  list[idx] = { ...list[idx], time: e.target.value };
                                  setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                                }}
                                className="text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-400" />
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sholat:</label>
                              <select value={cn.prayer || 'subuh'}
                                onChange={(e) => {
                                  const list = [...(wabotConfig.customNotifications || [])];
                                  list[idx] = { ...list[idx], prayer: e.target.value };
                                  setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                                }}
                                className="text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-400">
                                <option value="subuh">Subuh</option>
                                <option value="dzuhur">Dzuhur</option>
                                <option value="ashar">Ashar</option>
                                <option value="maghrib">Maghrib</option>
                                <option value="isya">Isya</option>
                                <option value="jumat">Jumat</option>
                                <option value="imsak">Imsak</option>
                              </select>
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Offset:</label>
                              <input type="number" value={cn.offsetMinutes ?? 0}
                                onChange={(e) => {
                                  const list = [...(wabotConfig.customNotifications || [])];
                                  list[idx] = { ...list[idx], offsetMinutes: parseInt(e.target.value) || 0 };
                                  setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                                }}
                                className="w-16 text-[10px] border border-slate-200 rounded-md px-2 py-1 text-center focus:ring-1 focus:ring-indigo-400" />
                              <span className="text-[10px] text-slate-400">menit</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hari:</label>
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, di) => (
                              <label key={di} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-pointer">
                                <input type="checkbox" checked={!cn.days || cn.days.includes(di)}
                                  onChange={(e) => {
                                    const list = [...(wabotConfig.customNotifications || [])];
                                    let days = list[idx].days ? [...list[idx].days] : [0,1,2,3,4,5,6];
                                    if (e.target.checked) {
                                      if (!days.includes(di)) days.push(di);
                                    } else {
                                      days = days.filter((d: number) => d !== di);
                                    }
                                    list[idx] = { ...list[idx], days };
                                    setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                                  }}
                                  className="w-3 h-3 accent-indigo-500" />
                                {day}
                              </label>
                            ))}
                          </div>
                          <textarea value={cn.message || ''}
                            onChange={(e) => {
                              const list = [...(wabotConfig.customNotifications || [])];
                              list[idx] = { ...list[idx], message: e.target.value };
                              setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                            }}
                            placeholder="Pesan notifikasi..."
                            className="w-full p-2 text-[10px] bg-white border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none min-h-[44px] resize-none font-medium text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    const list = [...(wabotConfig.customNotifications || [])];
                    list.push({
                      id: 'notif_' + Date.now(),
                      enabled: true,
                      message: '',
                      type: 'fixed',
                      time: '08:00',
                      days: [0,1,2,3,4,5,6]
                    });
                    setConfig({ ...config, wabot: { ...wabotConfig, customNotifications: list } });
                  }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold w-full justify-center">
                    <Plus size={16} />
                    Tambah Notifikasi
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONNECTION STATUS / QR */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-5 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2 border-b border-white/10 pb-3">
                  <PlayCircle size={18} /> Status Koneksi WhatsApp
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-center ${waStatus.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : waStatus.status === 'CONNECTING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {waStatus.status}
                      </span>
                    </div>

                    {waStatus.status === 'DISCONNECTED' && !loading && (
                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch(`/api/wa/status?key=${mosqueKey}`, { method: 'POST' });
                            const data = await res.json();
                            if (data.success) {
                              setWaStatus({ ...waStatus, status: 'CONNECTING' });
                            } else {
                              alert('Gagal memulai service: ' + data.error);
                            }
                          } catch (e) { alert('Err: Failed to trigger WA'); }
                          setLoading(false);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                      >
                        <Power size={14} /> Hubungkan WhatsApp
                      </button>
                    )}

                    {!loading && (waStatus.status === 'CONNECTING' || waStatus.status === 'CONNECTED' || waStatus.status === 'DISCONNECTED') && (
                      <button
                        onClick={async () => {
                          if (!confirm('Apakah Anda yakin ingin mereset sesi WhatsApp? Anda perlu scan ulang kode QR.')) return;
                          setLoading(true);
                          try {
                            const res = await fetch(`/api/wa/reset?key=${mosqueKey}`, { method: 'POST' });
                            const data = await res.json();
                            if (data.success) {
                              setWaStatus({ ...waStatus, status: 'DISCONNECTED', qr: null });
                              alert('Sesi WhatsApp berhasil direset.');
                            } else {
                              alert('Gagal mereset sesi: ' + data.error);
                            }
                          } catch (e) { alert('Err: Failed to reset WA'); }
                          setLoading(false);
                        }}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        title="Reset Koneksi (Hapus Sesi)"
                      >
                        <RefreshCw size={14} /> Reset
                      </button>
                    )}

                    {loading && <div className="text-emerald-400 text-[10px] font-bold animate-pulse">Memuat...</div>}
                  </div>

                  {waStatus.qr && waStatus.status !== 'CONNECTED' && (
                    <div className="p-6 bg-white rounded-xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                      <p className="text-slate-900 text-xs font-bold text-center">Scan QR Code ini dengan WhatsApp Anda</p>
                      <div className="p-2 bg-white border-4 border-slate-100 rounded-2xl shadow-inner">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waStatus.qr)}`}
                          alt="WA QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-slate-500 text-[10px] text-center italic font-medium px-4">
                        Buka WhatsApp {'>'} Perangkat Tertaut {'>'} Tautkan Perangkat.
                      </p>
                    </div>
                  )}

                  {waStatus.status === 'CONNECTED' && (
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-emerald-400 text-xs font-bold">Terhubung ke WhatsApp. Siap mengirim notifikasi.</p>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Uji Coba Target Manual</label>
                      <input
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                        value={testTargetNumber}
                        onChange={(e) => setTestTargetNumber(e.target.value)}
                        placeholder="628xxx atau ID Group"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        const btn = document.getElementById('btn-test-wabot') as HTMLButtonElement;
                        if (btn) { btn.innerText = 'Mengirim...'; btn.disabled = true; }
                        try {
                          const res = await fetch('/api/wabot/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              to: testTargetNumber || wabotConfig.targetNumber,
                              message: "Uji coba pengiriman pesan dari Smart Mosque Admin (Lokal)."
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert('Sukses terkirim!');
                          } else {
                            alert('Gagal: ' + data.message);
                          }
                        } catch (e: any) { alert('Err: ' + e.message); }
                        if (btn) { btn.innerText = 'Kirim Pesan Uji Coba'; btn.disabled = false; }
                      }}
                      id="btn-test-wabot"
                      disabled={waStatus.status !== 'CONNECTED'}
                      className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm transition-all mt-4 flex items-center justify-center gap-2 group disabled:opacity-20"
                    >
                      <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Kirim Pesan Uji Coba
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function SlideshowSection({ config, setConfig, onPickSlide, mosqueKey }: any) {
  const updateVideoStreaming = (key: string, value: any) => {
    setConfig({
        ...config,
        videoStreaming: {
            ...(config.videoStreaming || { enabled: false, url: '', showInSlideshow: false, durationMinutes: 2 }),
            [key]: value
        }
    });
  };

  const isStreamingApp = config.videoStreaming?.enabled ?? false;

  return (
    <div className="space-y-6">
      
      {/* Mode Selector */}
      <SectionCard title="Mode Konten Visual (Latar Layar Tengah)">
        <p className="text-sm text-slate-500 mb-4">Pilih jenis konten utama yang akan mengisi ruang layar TV ketika tidak ada jadwal sholat.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
               onClick={() => updateVideoStreaming('enabled', false)}
               className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${!isStreamingApp ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
            >
               <div className={`p-3 rounded-lg ${!isStreamingApp ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                   <ImageIcon size={24} />
               </div>
               <div className="text-left">
                   <h3 className={`font-bold ${!isStreamingApp ? 'text-emerald-700' : 'text-slate-700'}`}>Gambar Slide Show</h3>
                   <p className="text-xs text-slate-500 mt-0.5">Tampilkan rotasi poster kegiatan panti/mosque</p>
               </div>
            </button>

            <button 
               onClick={() => updateVideoStreaming('enabled', true)}
               className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isStreamingApp ? 'border-red-500 bg-red-50/50' : 'border-slate-200 bg-white hover:border-red-200'}`}
            >
               <div className={`p-3 rounded-lg ${isStreamingApp ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                   <Video size={24} />
               </div>
               <div className="text-left">
                   <h3 className={`font-bold ${isStreamingApp ? 'text-red-700' : 'text-slate-700'}`}>Live Streaming</h3>
                   <p className="text-xs text-slate-500 mt-0.5">Tampilkan video streaming (misal: YouTube Live)</p>
               </div>
            </button>
        </div>
      </SectionCard>

      {!isStreamingApp && (
        <SectionCard title="Pengaturan Slide Show">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {config.sliderImages.map((url: string, idx: number) => (
              <div key={idx} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={resolveUrl(url, mosqueKey)} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <button
                  onClick={() => {
                    const n = config.sliderImages.filter((_: any, i: number) => i !== idx);
                    setConfig({ ...config, sliderImages: n });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <LogOut size={12} className="rotate-180" />
                </button>
                <div className="absolute bottom-0 left-0 w-full bg-black/50 text-white text-[10px] p-1 truncate px-2 backdrop-blur-sm">
                  Urutan #{idx + 1}
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <label className="flex-1 aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group gap-2">
                <UploadCloud size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest text-center">Upload Baru</span>
                <input type="file" hidden accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success) setConfig({ ...config, sliderImages: [...config.sliderImages, data.url], gallery: [...(config.gallery || []), data.url] });
                  }
                }} />
              </label>
              <button
                onClick={onPickSlide}
                className="flex-1 aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group gap-2 px-2 text-center"
              >
                <Library size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Pilih dari Galeri</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic">Tip: Gunakan menu Galeri untuk mengelola file dan menambahkannya ke list rotasi Slide.</p>
        </SectionCard>
      )}

      {isStreamingApp && (
        <SectionCard title="Detail Live Streaming (YouTube)">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">YouTube Embed URL</label>
                    <input
                        type="text"
                        value={config.videoStreaming?.url || ''}
                        onChange={(e) => updateVideoStreaming('url', e.target.value)}
                        placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Get embedded URL from YouTube live stream share options (use /embed/ format)</p>
                </div>
                <div>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                           type="checkbox" 
                           className="w-5 h-5 rounded text-red-500 focus:ring-red-500" 
                           checked={config.videoStreaming?.showInSlideshow ?? false} 
                           onChange={(e) => updateVideoStreaming('showInSlideshow', e.target.checked)} 
                        />
                        <div>
                           <span className="text-sm font-bold text-slate-700 block">Gabungkan dengan Slide Show?</span>
                           <span className="text-xs text-slate-500 block">Jika dicentang, live streaming tidak memonopoli layar terus menerus, tetapi akan diselingi rotasi gambar slide.</span>
                        </div>
                    </label>
                </div>
                {(config.videoStreaming?.showInSlideshow ?? false) && (
                   <div>
                       <label className="block text-sm font-semibold text-slate-600 mb-2">Durasi Tampil (Menit)</label>
                       <input
                           type="number"
                           min="1"
                           max="60"
                           value={config.videoStreaming?.durationMinutes || 2}
                           onChange={(e) => updateVideoStreaming('durationMinutes', parseInt(e.target.value) || 2)}
                           className="w-full sm:w-1/3 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                       />
                       <p className="text-xs text-slate-500 mt-1">Lama durasi streaming diputar sebelum bergiliran dengan gambar slide.</p>
                   </div>
                )}
            </div>
        </SectionCard>
      )}

    </div>
  );

}



function MediaConfigSection({ config, setConfig, onOpenPicker, mosqueKey, onSave, audioStatus }: any) {
  const [subTab, setSubTab] = useState<'slideshow' | 'audio' | 'ramadhan' | 'simulation'>('slideshow');
  const [simPrayer, setSimPrayer] = useState('Subuh');
  const [simMode, setSimMode] = useState<'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'NORMAL' | 'IMSAK' | 'PLAYLIST'>('ADZAN');
  const [simScheduleId, setSimScheduleId] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-6">
        {[
          { id: 'slideshow', label: 'Slide Show', icon: <ImageIcon size={16} /> },
          { id: 'audio', label: 'Audio MP3', icon: <Music size={16} /> },
          // Removed Ramadhan feature as requested
          { id: 'simulation', label: 'Simulasi Waktu', icon: <AlarmCheck size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${subTab === t.id
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {subTab === 'slideshow' && (
            <SlideshowSection
              config={config}
              setConfig={setConfig}
              onPickSlide={() => onOpenPicker('image', { section: 'slideshow' })}
              mosqueKey={mosqueKey}
            />
          )}

          {subTab === 'audio' && (
            <div className="space-y-8">
              <SectionCard title="Remote Control Playback">
                <PlaybackRemoteControl config={config} setConfig={setConfig} onSave={onSave} status={audioStatus} />
              </SectionCard>

              <SectionCard title="Playlist & Jadwal Putar Audio">
                <PlaylistManager
                  config={config}
                  setConfig={setConfig}
                  mosqueKey={mosqueKey}
                  onPickTrack={(playlistId) => {
                    onOpenPicker('audio', { section: 'playlist-track', playlistId });
                  }}
                />
              </SectionCard>
            </div>
          )}

          {subTab === 'simulation' && (
            <SectionCard title="Simulasi Waktu Sholat">
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-lg text-emerald-800 text-sm border border-emerald-100 flex items-center gap-3">
                  <AlarmCheck size={20} className="shrink-0" />
                  <div>
                    <h3 className="font-bold">Simulasi Kondisi</h3>
                    <p>Paksa client untuk masuk ke kondisi waktu sholat tertentu (Adzan/Iqamah/Sholat). Berguna untuk testing audio dan tampilan tanpa menunggu waktu sholat asli.</p>
                  </div>
                </div>

                {config.simulation?.isSimulating && (
                  <div className="p-4 bg-orange-100 rounded-lg text-orange-800 text-sm border border-orange-200 flex items-center justify-between animate-pulse">
                    <div className="font-bold flex items-center gap-2">
                      <span>⚠️ SEDANG SIMULASI: {config.simulation.prayerName} ({config.simulation.state})</span>
                    </div>
                    <button
                      onClick={() => {
                        const newConfig = { ...config, simulation: null as any };
                        setConfig(newConfig);
                        onSave(newConfig);
                      }}
                      className="bg-white text-orange-700 px-3 py-1 rounded shadow text-xs font-bold hover:bg-orange-50"
                    >
                      HENTIKAN
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Prayer */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">1. Pilih Waktu Sholat</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Jumat'].map(p => (
                        <button
                          key={p}
                          disabled={simMode === 'PLAYLIST' || simMode === 'IMSAK'}
                          onClick={() => setSimPrayer(p)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${simPrayer === p
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            } ${(simMode === 'PLAYLIST' || simMode === 'IMSAK') ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Phase */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">2. Pilih Kondisi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'ADZAN', label: 'Adzan / Masuk Waktu' },
                        { id: 'IQAMAH', label: 'Iqamah (Countdown)' },
                        { id: 'SHOLAT', label: 'Sholat (Blank/Mode)' },
                        { id: 'PLAYLIST', label: 'Jadwal Audio (MP3)' },
                        { id: 'NORMAL', label: 'Normal (Reset)' },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSimMode(m.id as any)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${simMode === m.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {simMode === 'PLAYLIST' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Pilih Jadwal yang diuji</label>
                    <select
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                      value={simScheduleId}
                      onChange={(e) => setSimScheduleId(e.target.value)}
                    >
                      <option value="">-- Pilih Jadwal --</option>
                      {(config.audio?.schedules || []).filter((s: any) => s.enabled).map((s: any) => {
                        const playlist = config.audio.playlists.find((p: any) => p.id === s.playlistId);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.type === 'prayer_relative' ? `${s.prayer?.toUpperCase()} (${s.offsetMinutes}m ${s.trigger})` : s.time} - {playlist?.name || 'Unknown Playlist'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      let newConfig;
                      if (simMode === 'NORMAL') {
                        newConfig = { ...config, simulation: null as any };
                      } else {
                        const schedule = config.audio?.schedules?.find((s: any) => s.id === simScheduleId);
                        newConfig = {
                          ...config,
                          simulation: {
                            isSimulating: true,
                            prayerName: simMode === 'PLAYLIST' ? '' : simMode === 'IMSAK' ? 'Subuh' : simPrayer,
                            state: simMode,
                            activePlaylistId: simMode === 'PLAYLIST' ? schedule?.playlistId : undefined,
                            startTime: Date.now()
                          }
                        };
                      }
                      setConfig(newConfig);
                      onSave(newConfig);
                    }}
                    className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${simMode === 'NORMAL'
                      ? 'bg-slate-500 hover:bg-slate-600 text-white shadow-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                      }`}
                  >
                    {simMode === 'NORMAL' ? <XCircle size={20} /> : <Play size={20} />}
                    {simMode === 'NORMAL'
                      ? 'HENTIKAN SIMULASI'
                      : simMode === 'PLAYLIST'
                        ? 'MULAI SIMULASI JADWAL AUDIO'
                        : simMode === 'IMSAK'
                          ? 'MULAI SIMULASI IMSAK'
                          : `MULAI SIMULASI ${simPrayer.toUpperCase()} (${simMode})`
                    }
                  </button>
                </div>

              </div>
            </SectionCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  gallery,
  mosqueKey,
  type = 'any'
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  gallery: string[];
  mosqueKey: string;
  type?: 'image' | 'audio' | 'any'
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!isOpen) return null;

  const AUDIO_EXTS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.opus', '.wma'];
  const isAudioUrl = (url: string) => AUDIO_EXTS.some(ext => url.toLowerCase().endsWith(ext));

  const filteredGallery = gallery.filter(url => {
    const isAudio = isAudioUrl(url);
    if (type === 'image') return !isAudio;
    if (type === 'audio') return isAudio;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Pilih dari Galeri</h3>
            <p className="text-sm text-slate-400">Pilih file yang sudah Anda unggah sebelumnya.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <Plus className="rotate-45" size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredGallery.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <Library size={48} className="mb-4 opacity-20" />
              <p>Belum ada file {type !== 'any' ? (type === 'image' ? 'gambar' : 'audio') : ''} di galeri.</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredGallery.map((url, idx) => {
                  const isAudio = isAudioUrl(url);
                  return (
                    <button
                      key={idx}
                      onClick={() => { onSelect(url); onClose(); }}
                      className="group relative aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all text-left"
                    >
                      {isAudio ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-emerald-600 bg-emerald-50/30">
                          <Music size={32} />
                          <span className="text-[10px] mt-2 font-mono truncate w-full text-center px-1">
                            {url.split('/').pop()}
                          </span>
                        </div>
                      ) : (
                        <img src={resolveUrl(url, mosqueKey)} className="w-full h-full object-cover" alt="Gallery item" />
                      )}
                      <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-emerald-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Pilih</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGallery.map((url, idx) => {
                  const isAudio = isAudioUrl(url);
                  const fileName = url.split('/').pop();
                  return (
                    <button
                      key={idx}
                      onClick={() => { onSelect(url); onClose(); }}
                      className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-sm transition-all group"
                    >
                      <div className={`p-2 rounded-lg ${isAudio ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isAudio ? <Music size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-emerald-700 break-all whitespace-normal overflow-visible">
                          {fileName}
                        </p>
                      </div>
                      <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        PILIH
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
        </div>
      </div>
    </div>
  );
}


function GallerySection({ config, setConfig, updateConfig, mosqueKey }: any) {
  const gallery = config.gallery || [];
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<{ name: string; progress: number; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([]);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.opus', '.wma'];
  const isAudio = (url: string) => AUDIO_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));
  const imageItems = gallery.filter((url: string) => !isAudio(url));
  const audioItems = gallery.filter((url: string) => isAudio(url));

  const togglePreview = (url: string) => {
    if (playingUrl === url) {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      setPlayingUrl(null);
    } else {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      // @ts-ignore - Assuming resolveUrl is globally available since it was used in the previous implementation
      const resolved = typeof resolveUrl === 'function' ? resolveUrl(url, mosqueKey) : url.startsWith('/') ? url : '/' + url;
      const audio = new window.Audio(resolved);
      audio.onended = () => setPlayingUrl(null);
      audio.play();
      setPreviewAudio(audio);
      setPlayingUrl(url);
    }
  };

  const processFiles = async (fileArr: File[]) => {
    if (!fileArr || fileArr.length === 0) return;
    setUploading(true);
    setUploadItems(fileArr.map((f) => ({ name: f.name, progress: 0, status: 'pending' as const })));
    try {
      const { uploadFileChunked } = await import('./lib/upload-utils');
      const newUrls: string[] = [];

      for (let i = 0; i < fileArr.length; i++) {
        setUploadItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it)));
        try {
          const url = await uploadFileChunked(fileArr[i], mosqueKey, (progress) => {
            setUploadItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, progress } : it)));
          });
          if (url) newUrls.push(url);
          setUploadItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, progress: 100, status: 'done' } : it)));
        } catch (itemErr: any) {
          setUploadItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'error' } : it)));
          throw itemErr;
        }
      }

      if (newUrls.length > 0) {
        setConfig({
          ...config,
          gallery: [...gallery, ...newUrls]
        });
      }
    } catch (err: any) {
      alert(`Gagal mengunggah: ${err.message}`);
    } finally {
      setUploading(false);
      // Biarkan status 100%/Gagal terlihat sejenak, lalu bersihkan daftar.
      setTimeout(() => setUploadItems([]), 2000);
    }
  };

  const handleUpload = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files) as File[]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length > 0) {
      processFiles(Array.from(dropped) as File[]);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Manajemen Galeri Media">
        {/* Upload Action */}
        <div className="mb-8">
          <label
            onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={handleDrop}
            className={`
            w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center transition-all cursor-pointer group gap-2
            ${dragOver ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-300 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50'}
            ${uploading ? 'opacity-50 cursor-wait' : ''}
          `}>
            {uploading ? <RefreshCw size={40} className="animate-spin" /> : <UploadCloud size={40} className={`transition-transform ${dragOver ? 'scale-110' : 'group-hover:scale-110'}`} />}
            <span className="text-sm font-bold uppercase tracking-widest text-center px-2">{uploading ? 'Sedang Mengunggah...' : dragOver ? 'Lepaskan file untuk mengunggah' : 'Klik atau tarik & lepas file ke sini'}</span>
            <input type="file" hidden accept="image/*,audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus,.wma" onChange={handleUpload} disabled={uploading} multiple />
          </label>

          {/* Per-item upload progress */}
          {uploadItems.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadItems.map((it, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{it.name}</span>
                    <span className={`text-[11px] font-mono tabular-nums shrink-0 ${it.status === 'error' ? 'text-red-500' : it.status === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {it.status === 'error' ? 'Gagal' : it.status === 'done' ? 'Selesai' : it.status === 'pending' ? 'Menunggu' : `${it.progress}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${it.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IMAGE GALLERY */}
        <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-emerald-500" /> Galeri Gambar ({imageItems.length})
            </h4>
            {imageItems.length === 0 ? (
                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">Belum ada gambar yang diunggah</div>
            ) : (
                <div className="flex flex-col sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {imageItems.map((url: string, idx: number) => {
                    const resolvedUrl = typeof resolveUrl === 'function' ? resolveUrl(url, mosqueKey) : url;
                    const fileName = url.split('/').pop() || 'image';
                    return (
                      <div key={idx} className="group relative sm:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                        
                        {/* --- MOBILE LIST VIEW --- */}
                        <div className="flex flex-col gap-3 p-3 sm:hidden bg-white h-full w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                              <img src={resolvedUrl} className="w-full h-full object-cover" alt="Gallery item" />
                            </div>
                            <span className="text-xs font-mono font-bold truncate flex-1 text-slate-700">
                              {fileName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                             <a
                               href={resolvedUrl} target="_blank" rel="noopener noreferrer"
                               className="flex-1 py-2 flex items-center justify-center gap-1.5 text-white text-[10px] font-bold rounded-lg transition shadow-sm border-none bg-blue-500 hover:bg-blue-600"
                             >
                               Preview
                             </a>
                            <button
                              onClick={() => {
                                if (!config.sliderImages.includes(url)) {
                                  setConfig({ ...config, sliderImages: [...config.sliderImages, url] });
                                }
                              }}
                              className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
                            >
                              Jadikan Slide
                            </button>
                            <button
                              onClick={() => {
                                const n = gallery.filter((u: string) => u !== url);
                                const nS = config.sliderImages.filter((u: string) => u !== url);
                                setConfig({ ...config, gallery: n, sliderImages: nS });
                              }}
                              className="px-3 py-2 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600 transition shadow-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        {/* --- DESKTOP GRID VIEW --- */}
                        <div className="hidden sm:flex flex-col h-full w-full relative">
                          <img src={resolvedUrl} className="flex-1 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Gallery item" />
                          <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2 backdrop-blur-[2px]">
                             <a
                               href={resolvedUrl} target="_blank" rel="noopener noreferrer"
                               className="w-full py-1.5 flex items-center justify-center gap-2 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition shadow-sm"
                             >
                               Preview
                             </a>
                             <button
                               onClick={() => {
                                 if (!config.sliderImages.includes(url)) {
                                   setConfig({ ...config, sliderImages: [...config.sliderImages, url] });
                                 }
                               }}
                               className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
                             >
                               Jadikan Slide
                             </button>
                             <button
                               onClick={() => {
                                 const n = gallery.filter((u: string) => u !== url);
                                 const nS = config.sliderImages.filter((u: string) => u !== url);
                                 setConfig({ ...config, gallery: n, sliderImages: nS });
                               }}
                               className="w-full py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600 transition shadow-sm"
                             >
                               Hapus
                             </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            )}
        </div>

        {/* AUDIO GALLERY */}
        <div>
            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Music size={18} className="text-emerald-500" /> Galeri Audio ({audioItems.length})
            </h4>
            {audioItems.length === 0 ? (
                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">Belum ada audio (MTQ/Tarhim) yang diunggah</div>
            ) : (
                <div className="flex flex-col sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {audioItems.map((url: string, idx: number) => {
                      const isPlaying = playingUrl === url;
                      const fileName = url.split('/').pop();
                      return (
                        <div key={idx} className={`group relative sm:aspect-square rounded-xl overflow-hidden border shadow-sm flex flex-col transition-colors ${isPlaying ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100'}`}>
                          
                          {/* --- MOBILE LIST VIEW --- */}
                          <div className="flex flex-col gap-3 p-3 sm:hidden">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${isPlaying ? 'bg-emerald-200 text-emerald-600' : 'bg-emerald-200 text-emerald-600'}`}>
                                <Music size={20} className={isPlaying ? 'animate-pulse' : ''} />
                              </div>
                              <span className={`text-xs font-mono font-bold truncate flex-1 ${isPlaying ? 'text-emerald-700' : 'text-emerald-700'}`}>
                                {fileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => togglePreview(url)}
                                className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-white text-[10px] font-bold rounded-lg transition shadow-sm border-none ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                              >
                                {isPlaying ? <Square size={13} fill="currentColor" stroke="none"/> : <Play size={13} fill="currentColor" />} 
                                {isPlaying ? 'STOP' : 'TEST'}
                              </button>

                              {!isPlaying && (
                                <button
                                  onClick={() => {
                                    if (playingUrl === url && previewAudio) {
                                         previewAudio.pause();
                                         setPlayingUrl(null);
                                    }
                                    const n = gallery.filter((u: string) => u !== url);
                                    setConfig({ ...config, gallery: n });
                                  }}
                                  className="px-3 py-2 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600 transition shadow-sm"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>

                          {/* --- DESKTOP GRID VIEW --- */}
                          <div className="hidden sm:flex flex-col justify-center items-center p-2 h-full w-full relative">
                            <Music size={40} className={`mb-2 ${isPlaying ? 'animate-pulse text-emerald-500' : 'text-emerald-500'}`} />
                            <span className={`text-[10px] font-mono truncate w-full text-center px-1 font-bold ${isPlaying ? 'text-emerald-600' : 'text-emerald-600'}`}>
                              {fileName}
                            </span>

                            <div className={`absolute inset-0 bg-slate-900/85 transition-opacity flex flex-col items-center justify-center p-3 gap-2 backdrop-blur-[2px] ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                               <button
                                 onClick={() => togglePreview(url)}
                                 className={`w-full py-2 flex items-center justify-center gap-2 text-white text-[10px] font-bold rounded-lg transition shadow-sm border-none ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                               >
                                 {isPlaying ? <Square size={13} fill="currentColor" stroke="none"/> : <Play size={13} fill="currentColor" />} 
                                 {isPlaying ? 'STOP TEST' : 'TEST PLAY'}
                               </button>

                               {!isPlaying && (
                                 <button
                                   onClick={() => {
                                     if (playingUrl === url && previewAudio) {
                                          previewAudio.pause();
                                          setPlayingUrl(null);
                                     }
                                     const n = gallery.filter((u: string) => u !== url);
                                     setConfig({ ...config, gallery: n });
                                   }}
                                   className="w-full py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg hover:bg-rose-600 transition shadow-sm"
                                 >
                                   Hapus
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>
                      )
                  })}
                </div>
            )}
        </div>
      </SectionCard>
    </div>
  );
}


function ContentSection({ config, setConfig, onOpenPicker, mosqueKey }: any) {
  const [subTab, setSubTab] = useState<'info' | 'finance' | 'officers'>('info');

  const updateKajian = (idx: number, field: string, val: any) => {
    const n = [...(config.kajian?.schedule || [])];
    n[idx] = { ...n[idx], [field]: val };
    setConfig({ ...config, kajian: { ...config.kajian, schedule: n } });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-6">
        {[
          { id: 'info', label: 'Berita & Kajian', icon: <MessageSquare size={16} /> },
          { id: 'finance', label: 'Keuangan', icon: <Wallet size={16} /> },
          { id: 'officers', label: 'Petugas', icon: <Users size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${subTab === t.id
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {subTab === 'info' && (
            <div className="space-y-6">
              <SectionCard 
                title="Jadwal Kajian"
                headerAction={
                  <ToggleSwitch 
                    label="Tampilkan di Digital Clock" 
                    checked={config.kajian?.enabled} 
                    onChange={(v) => setConfig({ ...config, kajian: { ...(config.kajian || { schedule: [] }), enabled: v } })}
                  />
                }
              >

                {config.kajian?.enabled && (
                  <div className="space-y-4">
                    {(config.kajian?.schedule || []).map((kj: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 relative group">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hari</label>
                          <select
                            value={kj.day}
                            onChange={(e) => updateKajian(idx, 'day', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
                          >
                            <option value="">Pilih Hari</option>
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu</label>
                          {(() => {
                            const STANDARD_TIMES = [
                              "Ba'da Subuh", "Ba'da Dzuhur", "Ba'da Ashar", "Ba'da Maghrib", "Ba'da Isya",
                              "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
                              "13:00", "14:00", "15:30", "16:00", "16:30", "17:00",
                              "18:30", "19:00", "19:30", "20:00"
                            ];
                            const isCustom = kj.time && !STANDARD_TIMES.includes(kj.time);

                            return (
                              <div className="flex flex-col gap-2">
                                <select
                                  value={isCustom ? 'custom' : kj.time}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      // Only switch to custom mode, don't change value yet if it was empty, 
                                      // or keep current value if it's already custom
                                      if (!kj.time) updateKajian(idx, 'time', ' '); // Space to trigger custom mode
                                      else if (!isCustom) updateKajian(idx, 'time', ''); // Reset if switching from standard
                                    } else {
                                      updateKajian(idx, 'time', val);
                                    }
                                  }}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
                                >
                                  <option value="">Pilih Waktu</option>
                                  <optgroup label="Waktu Sholat">
                                    <option value="Ba'da Subuh">Ba'da Subuh</option>
                                    <option value="Ba'da Dzuhur">Ba'da Dzuhur</option>
                                    <option value="Ba'da Ashar">Ba'da Ashar</option>
                                    <option value="Ba'da Maghrib">Ba'da Maghrib</option>
                                    <option value="Ba'da Isya">Ba'da Isya</option>
                                  </optgroup>
                                  <optgroup label="Jam Pagi">
                                    <option value="05:00">05:00</option>
                                    <option value="06:00">06:00</option>
                                    <option value="07:00">07:00</option>
                                    <option value="08:00">08:00</option>
                                    <option value="09:00">09:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="11:00">11:00</option>
                                  </optgroup>
                                  <optgroup label="Jam Siang/Sore">
                                    <option value="13:00">13:00</option>
                                    <option value="14:00">14:00</option>
                                    <option value="15:30">15:30</option>
                                    <option value="16:00">16:00</option>
                                    <option value="16:30">16:30</option>
                                    <option value="17:00">17:00</option>
                                  </optgroup>
                                  <optgroup label="Jam Malam">
                                    <option value="18:30">18:30</option>
                                    <option value="19:00">19:00</option>
                                    <option value="19:30">19:30</option>
                                    <option value="20:00">20:00</option>
                                  </optgroup>
                                  <option value="custom" className="font-bold text-emerald-600">+ Custom / Lainnya...</option>
                                </select>
                                {(isCustom || kj.time === ' ') && (
                                  <input
                                    type="text"
                                    value={kj.time === ' ' ? '' : kj.time}
                                    onChange={(e) => updateKajian(idx, 'time', e.target.value)}
                                    placeholder="Ketik waktu... (misal: 08:45)"
                                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium animate-in fade-in slide-in-from-top-1"
                                    autoFocus
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <InputGroup label="Tema" value={kj.title} onChange={(v: string) => updateKajian(idx, 'title', v)} placeholder="Tafsir Al-Quran" />
                        <InputGroup label="Pemateri" value={kj.speaker} onChange={(v: string) => updateKajian(idx, 'speaker', v)} placeholder="Ust. Fulan" />

                        {/* Image Upload for Kajian Poster */}
                        <div className="md:col-span-4">
                          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Poster / Gambar (Opsional)</label>
                          <div className="flex items-center gap-4">
                            {kj.imageUrl && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group/img">
                                <img src={resolveUrl(kj.imageUrl, mosqueKey)} alt="Poster" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => updateKajian(idx, 'imageUrl', '')}
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <LogOut size={12} />
                                </button>
                              </div>
                            )}
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-medium transition-colors">
                              <UploadCloud size={16} />
                              {kj.imageUrl ? 'Ganti Poster' : 'Upload Poster'}
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
                                    const data = await res.json();
                                    if (data.success) {
                                      updateKajian(idx, 'imageUrl', data.url);
                                    }
                                  } catch (err) {
                                    alert('Gagal upload poster');
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const n = (config.kajian?.schedule || []).filter((_: any, i: number) => i !== idx);
                            setConfig({ ...config, kajian: { ...config.kajian, schedule: n } });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <LogOut size={12} className="rotate-180" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setConfig({
                        ...config,
                        kajian: {
                          ...(config.kajian || { enabled: true }),
                          schedule: [...(config.kajian?.schedule || []), { day: '', time: '', title: '', speaker: '' }]
                        }
                      })}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Tambah Jadwal Kajian
                    </button>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Running Text Information">
                <div className="space-y-3">
                  {config.runningText.map((txt: string, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <input
                        className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm"
                        value={txt}
                        onChange={(e) => {
                          const n = [...config.runningText];
                          n[idx] = e.target.value;
                          setConfig({ ...config, runningText: n });
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = config.runningText.filter((_: any, i: number) => i !== idx);
                          setConfig({ ...config, runningText: n });
                        }}
                        className="text-red-500 p-3 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                      >
                        <LogOut size={16} className="rotate-180" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setConfig({ ...config, runningText: [...config.runningText, ''] })}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <div className="bg-emerald-100 p-1 rounded-md"><MessageSquare size={16} /></div>
                    Tambah Info Baru
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {subTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard 
                  title="Ringkasan Kas"
                  headerAction={
                    <ToggleSwitch 
                      label="Tampilkan di Slideshow" 
                      checked={config.finance.enabled !== false} 
                      onChange={(v) => setConfig({ ...config, finance: { ...config.finance, enabled: v } })}
                    />
                  }
                >
                  <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100">
                    <span className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Total Seluruh Saldo</span>
                    <h3 className="text-4xl font-black mt-1">Rp {(config.finance.totalBalance || 0).toLocaleString('id-ID')}</h3>
                    <div className="mt-6 pt-6 border-t border-emerald-500/50 flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">Update Terakhir</span>
                        <input
                          type="date"
                          className="bg-emerald-700/50 border border-emerald-400/30 rounded-lg p-1.5 text-xs font-bold focus:ring-2 focus:ring-white outline-none"
                          value={config.finance.lastUpdated}
                          onChange={(e) => setConfig({ ...config, finance: { ...config.finance, lastUpdated: e.target.value } })}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">Jumlah Akun/Kas</span>
                        <span className="text-xl font-bold">{config.finance.accounts?.length || 0} Akun</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Tips Pengelolaan">
                  <div className="h-full flex flex-col justify-center space-y-4 text-slate-500 text-sm italic p-4">
                    <p>• Rincian kas akan ditampilkan di layar TV Client secara transparan.</p>
                    <p>• Gunakan fitur "Tambah Akun" untuk memisahkan dana (misal: Anak Yatim, Pembangunan).</p>
                    <p>• Pastikan Saldo Akhir adalah sisa uang yang ada di rekening/brankas.</p>
                  </div>
                </SectionCard>
              </div>

              <SectionCard title="Detail Per Akun (Funds)">
                <div className="space-y-4">
                  {(config.finance.accounts || []).map((acc: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 relative group shadow-sm hover:shadow-md transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                          <InputGroup
                            label="Nama Akun/Dana"
                            value={acc.name}
                            onChange={(v: string) => {
                              const n = [...config.finance.accounts];
                              n[idx].name = v;
                              setConfig({ ...config, finance: { ...config.finance, accounts: n } });
                            }}
                            placeholder="Contoh: Kas Masjid"
                          />
                        </div>
                        <InputGroup
                          label="Saldo Akhir"
                          type="number"
                          value={acc.balance}
                          onChange={(v: string) => {
                            const n = [...config.finance.accounts];
                            n[idx].balance = parseInt(v) || 0;
                            const total = n.reduce((acc: number, curr: any) => acc + (curr.balance || 0), 0);
                            setConfig({ ...config, finance: { ...config.finance, accounts: n, totalBalance: total } });
                          }}
                        />
                        <InputGroup
                          label="Pemasukan (Bulan ini)"
                          type="number"
                          value={acc.income}
                          onChange={(v: string) => {
                            const n = [...config.finance.accounts];
                            n[idx].income = parseInt(v) || 0;
                            setConfig({ ...config, finance: { ...config.finance, accounts: n } });
                          }}
                        />
                        <InputGroup
                          label="Pengeluaran (Bulan ini)"
                          type="number"
                          value={acc.expense}
                          onChange={(v: string) => {
                            const n = [...config.finance.accounts];
                            n[idx].expense = parseInt(v) || 0;
                            setConfig({ ...config, finance: { ...config.finance, accounts: n } });
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const n = config.finance.accounts.filter((_: any, i: number) => i !== idx);
                          const total = n.reduce((acc: number, curr: any) => acc + (curr.balance || 0), 0);
                          setConfig({ ...config, finance: { ...config.finance, accounts: n, totalBalance: total } });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <LogOut size={14} className="rotate-180" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const newAccounts = [...(config.finance.accounts || []), { name: '', balance: 0, income: 0, expense: 0 }];
                      setConfig({ ...config, finance: { ...config.finance, accounts: newAccounts } });
                    }}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Tambah Akun / Alokasi Dana
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {subTab === 'officers' && (
            <div className="space-y-6">
              <SectionCard 
                title="Jadwal Petugas Sholat Jum'at"
                headerAction={
                  <ToggleSwitch 
                    label="Tampilkan di Slideshow" 
                    checked={config.jumatEnabled !== false} 
                    onChange={(v) => setConfig({ ...config, jumatEnabled: v })}
                  />
                }
              >
                <div className="space-y-4">
                  {(config.jumat || []).length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                      Belum ada jadwal petugas Jum'at. Klik "Tambah Jadwal" untuk memulai.
                    </div>
                  ) : (
                    (config.jumat || []).map((jm: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 relative group shadow-sm hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <InputGroup
                            label="Tanggal"
                            type="date"
                            value={jm.date || ''}
                            onChange={(v: string) => {
                              const n = [...config.jumat];
                              n[idx] = { ...n[idx], date: v };
                              setConfig({ ...config, jumat: n });
                            }}
                          />
                          <InputGroup label="Khotib" value={jm.khotib} onChange={(v: string) => {
                            const n = [...config.jumat]; n[idx] = { ...n[idx], khotib: v }; setConfig({ ...config, jumat: n });
                          }} />
                          <InputGroup label="Imam" value={jm.imam} onChange={(v: string) => {
                            const n = [...config.jumat]; n[idx] = { ...n[idx], imam: v }; setConfig({ ...config, jumat: n });
                          }} />
                          <InputGroup label="Muadzin" value={jm.muadzin} onChange={(v: string) => {
                            const n = [...config.jumat]; n[idx] = { ...n[idx], muadzin: v }; setConfig({ ...config, jumat: n });
                          }} />
                        </div>
                        <button
                          onClick={() => {
                            const n = config.jumat.filter((_: any, i: number) => i !== idx);
                            setConfig({ ...config, jumat: n });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <LogOut size={12} className="rotate-180" />
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    onClick={() => setConfig({
                      ...config,
                      jumat: [...(config.jumat || []), { khotib: '', imam: '', muadzin: '', date: new Date().toISOString().split('T')[0] }]
                    })}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Tambah Jadwal Petugas Jum'at
                  </button>
                </div>
              </SectionCard>

              <SectionCard 
                title="Daftar Petugas (Marbot, Muadzin, Pengurus)"
                headerAction={
                  <ToggleSwitch 
                    label="Tampilkan di Slideshow" 
                    checked={config.officersEnabled !== false} 
                    onChange={(v) => setConfig({ ...config, officersEnabled: v })}
                  />
                }
              >
                <div className="space-y-4">
                  {config.officers.map((off: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-widest">Jabatan / Peran</label>
                        <input className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-700 bg-white" value={off.role} onChange={(e) => {
                          const n = [...config.officers]; n[idx].role = e.target.value; setConfig({ ...config, officers: n });
                        }} placeholder="Contoh: Bilal, Muadzin..." />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-widest">Nama Lengkap</label>
                        <input className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-700 bg-white" value={off.name} onChange={(e) => {
                          const n = [...config.officers]; n[idx].name = e.target.value; setConfig({ ...config, officers: n });
                        }} placeholder="Masukkan nama..." />
                      </div>
                      <button
                        onClick={() => {
                          const n = config.officers.filter((_: any, i: number) => i !== idx);
                          setConfig({ ...config, officers: n });
                        }}
                        className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        <LogOut size={16} className="rotate-180" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setConfig({ ...config, officers: [...config.officers, { role: '', name: '' }] })}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Tambah Petugas Baru
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


function DevicesSection({ mosqueKey }: { mosqueKey: string }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncReports, setSyncReports] = useState<Record<string, any>>({});
  const [expandedSync, setExpandedSync] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchSyncReports();
    const interval = setInterval(() => { fetchDevices(); fetchSyncReports(); }, 15000);
    return () => clearInterval(interval);
  }, [mosqueKey]);

  const fetchSyncReports = async () => {
    try {
      const res = await fetch(`/api/audio/sync-status?key=${mosqueKey}`);
      const data = await res.json();
      const map: Record<string, any> = {};
      (Array.isArray(data) ? data : []).forEach((r: any) => { if (r?.deviceId) map[r.deviceId] = r; });
      setSyncReports(map);
    } catch (e) {
      // best effort
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/devices?key=${mosqueKey}`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDevices([]);
    }
    setLoading(false);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Hapus perangkat ini dari daftar? Perangkat bisa mendaftarkan diri kembali.')) return;
    await fetch(`/api/devices?deviceId=${id}&key=${mosqueKey}`, { method: 'DELETE' });
    fetchDevices();
  };

  const saveRename = async (device: any) => {
    if (!editName.trim()) return;
    setSavingId(device.device_id);
    try {
      await fetch('/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.device_id, deviceName: editName.trim(), key: mosqueKey })
      });
      setDevices(prev => prev.map(d => d.device_id === device.device_id ? { ...d, device_name: editName.trim() } : d));
    } catch (e) {
      alert('Gagal menyimpan nama perangkat.');
    }
    setSavingId(null);
    setEditingId(null);
  };

  const remoteLogout = async () => {
    if (!confirm('Reset semua perangkat TV yang terhubung? Perangkat akan keluar dari sistem dan harus disetup ulang.')) return;
    try {
      await fetch(`/api/audio/remote-logout?key=${mosqueKey}`, { method: 'POST' });
      alert('Perintah reset telah dikirim. Perangkat akan keluar dalam beberapa detik.');
    } catch (e) {
      alert('Gagal mengirim perintah reset.');
    }
  };

  const getRelativeTime = (lastSeen: string) => {
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'baru saja';
    if (diffSec < 60) return `${diffSec} detik lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} jam lalu`;
    return `${Math.floor(diffHr / 24)} hari lalu`;
  };

  const isOnline = (lastSeen: string) => (Date.now() - new Date(lastSeen).getTime()) < 2 * 60 * 1000;
  const onlineCount = devices.filter(d => isOnline(d.last_seen)).length;

  return (
    <SectionCard title="Daftar Perangkat Terhubung (TV/Client)">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Perangkat yang menginputkan <b>Mosque Key</b> Anda akan muncul otomatis.
          </p>
          {devices.length > 0 && (
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${onlineCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {onlineCount}/{devices.length} Online
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 italic flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" /> Memuat daftar perangkat...
          </div>
        ) : devices.length === 0 ? (
          <div className="py-14 bg-slate-50 border-2 border-dashed rounded-2xl text-center text-slate-400 flex flex-col items-center gap-2">
            <Monitor size={36} className="opacity-30" />
            <p className="font-medium">Belum ada perangkat terhubung</p>
            <p className="text-xs">Buka Web Client di TV, masukkan Mosque Key untuk menautkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {devices.map((d) => {
              const online = isOnline(d.last_seen);
              const isEditing = editingId === d.device_id;
              const isSaving = savingId === d.device_id;
              const sync = syncReports[d.device_id];
              return (
                <div key={d.device_id} className={`bg-white border rounded-2xl hover:shadow-sm transition-all ${online ? 'border-emerald-100' : 'border-slate-200'}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Status icon */}
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${online ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Monitor size={22} className={online ? 'text-emerald-600' : 'text-slate-400'} />
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>

                  {/* Info + Rename */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-400 outline-none"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRename(d); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                        <button onClick={() => saveRename(d)} disabled={isSaving} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                          {isSaving ? '...' : 'Simpan'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 truncate">{d.device_name || 'TV Device'}</h4>
                        <button
                          onClick={() => { setEditingId(d.device_id); setEditName(d.device_name || ''); }}
                          className="shrink-0 text-[10px] font-bold text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition"
                        >
                          Ganti Nama
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{d.device_id}</p>
                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-tight ${online ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {online ? '● Online' : '○ Offline'} — {getRelativeTime(d.last_seen)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={remoteLogout}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                      title="Reset perangkat (logout paksa)"
                    >
                      <RefreshCw size={13} /> Reset
                    </button>
                    <button
                      onClick={() => deleteDevice(d.device_id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
                      title="Hapus dari daftar"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
                {sync && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 rounded-b-2xl">
                    <button
                      onClick={() => setExpandedSync(expandedSync === d.device_id ? null : d.device_id)}
                      className="w-full flex items-center justify-between text-left gap-2"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-600 min-w-0">
                        <Music size={13} className={sync.complete ? 'text-emerald-500' : 'text-amber-500'} />
                        <span className="truncate">Audio tersinkron: {sync.syncedFiles}/{sync.totalFiles} file</span>
                        <span className="text-slate-400 font-normal">({formatBytes(sync.totalBytes)})</span>
                        {!sync.complete && <span className="text-amber-600 font-semibold shrink-0">• belum lengkap</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">v{sync.version} • {getRelativeTime(new Date(sync.updatedAt).toISOString())} {expandedSync === d.device_id ? '▲' : '▼'}</span>
                    </button>
                    {expandedSync === d.device_id && (
                      <ul className="mt-2 space-y-1 max-h-52 overflow-auto">
                        {(sync.files || []).map((f: any, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white border border-slate-100">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.ok ? (f.local ? 'bg-emerald-500' : 'bg-sky-400') : 'bg-rose-400'}`} title={f.ok ? (f.local ? 'Tersimpan lokal' : 'Tersimpan (cache CDN)') : 'Gagal'} />
                            <span className="flex-1 truncate text-slate-600" title={f.url}>{f.title || (f.url || '').split('/').pop()}</span>
                            <span className="text-slate-400 tabular-nums shrink-0">{f.ok ? (f.local ? formatBytes(f.sizeBytes) : 'cache') : 'gagal'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}



function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function resolveUrl(url: string | undefined, mosqueKey: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/') && !url.startsWith(`/uploads/${mosqueKey}/`)) {
    return url.replace('/uploads/', `/uploads/${mosqueKey}/`);
  }
  return url;
}

function InputGroup({ label, value, onChange, type = 'text', step, placeholder }: any) {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none text-slate-800 text-sm shadow-sm hover:border-slate-300 min-h-[100px]"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          step={step}
          className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none text-slate-800 text-sm shadow-sm hover:border-slate-300"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

