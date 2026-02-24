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
  Music, Library, Plus, Moon, Menu, X, Play, Pause, Square, PlayCircle, XCircle, AlarmCheck, Sliders, Smartphone, Activity,
  LogIn, Send, LayoutGrid, List, Power, Monitor
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'image' | 'audio' | 'any'>('any');
  const [pickerTarget, setPickerTarget] = useState<{ section: string, prayer?: string, playlistId?: string } | null>(null);
  const router = useRouter();
  const logger = useLogger('admin');

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('key');
    if (key) {
      setMosqueKey(key);
    } else {
      // Fallback if no key in URL (might happen if user just logs in)
      const stored = localStorage.getItem('lastMosqueKey');
      if (stored) {
        setMosqueKey(stored);
        router.replace(`/?key=${stored}`);
      }
    }
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
        finance: data.finance?.accounts ? data.finance : {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Memuat Data...
    </div>
  );

  if (!config) return <div className="p-10 text-center text-red-500">Error loading config</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl z-50 transition-transform duration-300 transform
        lg:relative lg:translate-x-0 lg:shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.svg?v=3" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Smart Mosque</h1>
              <p className="text-xs text-slate-400 font-medium">Digital Signage System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={MapPin} label="Identitas & Lokasi" active={activeTab === 'identity'} onClick={() => { setActiveTab('identity'); setSidebarOpen(false); }} />
          <SidebarItem icon={Clock} label="Jadwal Sholat" active={activeTab === 'prayer'} onClick={() => { setActiveTab('prayer'); setSidebarOpen(false); }} />
          <SidebarItem icon={Smartphone} label="Integrasi WhatsApp" active={activeTab === 'wabot'} onClick={() => { setActiveTab('wabot'); setSidebarOpen(false); }} />
          <SidebarItem icon={Settings} label="Media & Fitur" active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setSidebarOpen(false); }} />
          <SidebarItem icon={Library} label="Galeri Media" active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }} />
          <SidebarItem icon={MessageSquare} label="Konten Informasi" active={activeTab === 'content'} onClick={() => { setActiveTab('content'); setSidebarOpen(false); }} />
          <SidebarItem icon={LayoutDashboard} label="Manajemen Device" active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setSidebarOpen(false); }} />
          <SidebarItem icon={Sliders} label="Advance Config" active={activeTab === 'advance'} onClick={() => { setActiveTab('advance'); setSidebarOpen(false); }} />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => router.push('/logs')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all duration-200 relative overflow-hidden group"
            >
              <Activity size={20} className="text-slate-400 group-hover:text-slate-600" />
              System Logs
              <ChevronRight size={14} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="px-4 py-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mosque Key</p>
            <p className="text-sm font-mono font-bold text-emerald-600 truncate">{mosqueKey}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header Bar - Redesigned */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {activeTab === 'dashboard' ? (
                  <span>
                    Selamat {new Date().getHours() < 12 ? 'Pagi' : new Date().getHours() < 15 ? 'Siang' : new Date().getHours() < 18 ? 'Sore' : 'Malam'},
                    <span className="text-emerald-600 block sm:inline sm:ml-2">{config?.mosqueInfo.name || 'Admin'}</span>
                  </span>
                ) : (
                  tabLabels[activeTab]
                )}
              </h2>
              {activeTab === 'dashboard' && (
                <p className="hidden sm:block text-xs text-slate-400 font-medium">Control Panel & Digital Signage Management</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-100 pr-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Perangkat</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">Online</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden xs:block">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Mosque Key</span>
                <span className="block text-sm font-mono font-black text-slate-700 bg-slate-100 px-2 rounded">{mosqueKey}</span>
              </div>
              <button
                onClick={() => fetchConfig()}
                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all border border-slate-100 hover:border-emerald-100"
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto pb-24"
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
        <div className="sticky bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 px-4 lg:px-8 flex flex-col sm:flex-row gap-4 justify-between items-center z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="text-xs lg:text-sm text-slate-500 text-center sm:text-left">
            {saving ? 'Menyimpan perubahan...' : 'Pastikan menyimpan setelah mengubah data.'}
          </div>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className={`
                    w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg font-semibold text-white shadow-lg shadow-emerald-200 transition-all
                    ${saving ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'}
                `}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Simpan Perubahan'}
          </button>
        </div>
      </main >
    </div >
  );
}

// --- Subcomponents ---

const tabLabels: Record<Tab, string> = {
  dashboard: 'Dashboard Overview',
  identity: 'Identitas & Lokasi Masjid',
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
      className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl shadow-emerald-900/10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Music className="w-24 h-24 transform rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Sedang Memutar</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Client Playback</p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-bold text-slate-100 mb-1 truncate pr-12">{status.title || 'Unknown Track'}</h4>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
            <span>{formatTime(status.currentTime)}</span>
            <span>{formatTime(status.duration)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleControl(status.isPlaying ? 'paused' : 'playing')}
            disabled={isPausing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {status.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {status.isPlaying ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => handleControl('stopped')}
            disabled={isStopping}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/80 hover:bg-rose-600 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Square size={16} fill="currentColor" stroke="none" />
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group ${active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'
        }`}
    >
      <Icon size={20} className={active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
      {label}
      {active && <motion.div layoutId="active-pill" className="absolute left-0 top-0 w-1 h-full bg-emerald-500 rounded-r" />}
      <ChevronRight size={14} className={`ml-auto transition-transform ${active ? 'opacity-100 text-emerald-400' : 'opacity-0 -translate-x-2'}`} />
    </button>
  );
}

function SectionCard({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 after:content-[''] after:h-px after:flex-1 after:bg-slate-100 after:ml-4">
        {title}
      </h3>
      {children}
    </div>
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-none transition-all font-bold text-sm ${isPaused ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
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
      {/* Mosque Info Card - Redesigned */}
      <div
        onClick={() => setActiveTab('identity')}
        className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <MapPin className="w-24 h-24 text-emerald-600 transform rotate-12 translate-x-4 -translate-y-4" />
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-emerald-600 transition-colors">Identitas Masjid</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola informasi dasar</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
            <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span className="line-clamp-2 leading-relaxed">{config.mosqueInfo.address || 'Belum ada alamat'}</span>
          </div>
        </div>
      </div>

      {/* Finance Card - Redesigned */}
      <div className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet className="w-24 h-24 text-blue-600 transform -rotate-12 translate-x-4 -translate-y-4" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">Kas Masjid</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Laporan Keuangan</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-1">Total Saldo</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            Rp {config.finance?.totalBalance?.toLocaleString('id-ID') || '0'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Pemasukan</div>
            <div className="font-bold text-slate-700">
              Rp {(config.finance?.accounts?.[0]?.income || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
            <div className="text-[10px] font-bold text-rose-600 uppercase mb-1">Pengeluaran</div>
            <div className="font-bold text-slate-700">
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
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-amber-500" />
              Running Text
            </h3>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="bg-slate-900 text-amber-400 p-3 rounded-xl font-mono text-sm overflow-hidden whitespace-nowrap">
            <div className="animate-marquee inline-block">
              {config.runningText?.[0] || "Selamat Datang di Masjid..."}
            </div>
          </div>
        </div>

        {/* Theme / Mode */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-slate-400 text-xs font-bold uppercase mb-2">Tema Saat Ini</div>
            <div className="text-xl font-bold mb-1 capitalize">{config.theme?.mode || 'default'}</div>
            <div className="text-sm text-slate-400 opacity-80">
              Background: {config.theme?.backgroundType === 'image' ? 'Gambar' : 'Warna Solid'}
            </div>
          </div>

          <div className="absolute bottom-0 right-0 p-4 opacity-10">
            <ImageIcon size={64} />
          </div>
        </div>

        {/* Playback Control on Dashboard */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
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

      <SectionCard title="Lokasi & Titik Koordinat">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
              Tentukan titik koordinat masjid untuk perhitungan waktu sholat yang akurat.
              Anda bisa mengisi manual atau klik langsung pada peta.
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
            <div className="mt-4 p-4 bg-amber-50 text-amber-700 text-xs rounded-lg flex items-start gap-2 border border-amber-100 italic">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span>Tip: Klik pada peta untuk mengambil titik koordinat secara otomatis.</span>
            </div>
          </div>

          <MapPicker
            lat={config.prayerTimes.coordinates.lat}
            lng={config.prayerTimes.coordinates.lng}
            onChange={(lat: number, lng: number) => {
              const newC = { lat, lng };
              setConfig({ ...config, prayerTimes: { ...config.prayerTimes, coordinates: newC } });
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}


function PrayerSection({ config, setConfig, onOpenPicker, onSave }: any) {
  return (
    <div className="space-y-6">
      <SectionCard title="Metode & Hisab">
        <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2 mb-6 border border-emerald-100">
          <MapPin size={16} /> Lokasi masjid telah diatur di menu <b>Identitas & Lokasi</b>.
        </div>
      </SectionCard>

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

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.adzan?.audioEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    adzan: { ...config.adzan, audioEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-700 block text-sm">Audio Adzan Otomatis</span>
                  <span className="text-[10px] text-slate-400">Putar suara Adzan saat masuk waktu sholat</span>
                </div>
              </div>
            </div>

            {config.adzan?.audioEnabled && (
              <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between truncate">
                  <div className="flex items-center gap-2 truncate">
                    <Music size={16} className="text-emerald-500" />
                    <span className="text-xs font-mono text-slate-600 truncate">
                      {config.adzan?.audioUrl ? config.adzan.audioUrl.split('/').pop() : 'Belum ada audio terpilih'}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenPicker('audio', { section: 'adzan-audio' })}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm ml-2 shrink-0"
                  >
                    PILIH
                  </button>
                </div>
              </div>
            )}
          </div>
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

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    <b>TIP:</b> Anda bisa menggunakan kode <b>{`{sholat}`}</b> untuk nama waktu dan <b>{`{jam}`}</b> untuk pukul otomatis di dalam template.
                  </p>
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
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-center ${waStatus.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : waStatus.status === 'CONNECTING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
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
  return (
    <div className="space-y-6">
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
              <span className="text-xs font-bold uppercase tracking-widest">Upload Baru</span>
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
              className="flex-1 aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group gap-2"
            >
              <Library size={32} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Pilih dari Galeri</span>
            </button>
          </div>
        </div>
      </SectionCard>
      <p className="text-sm text-slate-400 italic">Tip: Gunakan menu Galeri untuk mengelola file dan menambahkannya ke Slide.</p>
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
              <SectionCard title="Audio Global (Fallback)">
                <div className="flex flex-col gap-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <InputGroup
                        label="URL Audio Global"
                        value={config.audio.globalUrl || ''}
                        onChange={(v: string) => setConfig({ ...config, audio: { ...config.audio, globalUrl: v } })}
                        placeholder="http://..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        onOpenPicker('audio', { section: 'global-audio' });
                      }}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Pilih dari Galeri"
                    >
                      <Library size={20} className="text-slate-600" />
                    </button>
                    <button
                      onClick={() => onSave()}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold shadow-sm"
                    >
                      SIMPAN
                    </button>
                  </div>

                  {/* Remote Controls */}
                  <div className="pt-6 border-t border-slate-100">
                    <PlaybackRemoteControl config={config} setConfig={setConfig} onSave={onSave} status={audioStatus} />
                  </div>
                </div>
                {config.audio.globalUrl && (
                  <audio controls className="w-full mt-4 h-10 rounded-lg">
                    <source src={resolveUrl(config.audio.globalUrl, mosqueKey)} type="audio/mpeg" />
                  </audio>
                )}
              </SectionCard>

              <SectionCard title="Atur Playlist">
                <PlaylistManager
                  config={config}
                  setConfig={setConfig}
                  mosqueKey={mosqueKey}
                  onPickTrack={(playlistId) => {
                    onOpenPicker('audio', { section: 'playlist-track', playlistId });
                  }}
                />
              </SectionCard>

              <SectionCard title="Jadwal Putar">
                <ScheduleManager config={config} setConfig={setConfig} />
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

  const filteredGallery = gallery.filter(url => {
    const isAudio = url.toLowerCase().endsWith('.mp3');
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
                  const isAudio = url.toLowerCase().endsWith('.mp3');
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
                  const isAudio = url.toLowerCase().endsWith('.mp3');
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

  const handleUpload = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
      }

      const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.urls) {
        setConfig({
          ...config,
          gallery: [...gallery, ...data.urls]
        });
      }
    } catch (e) {
      alert('Gagal mengunggah');
    } finally {
      setUploading(false);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Manajemen Galeri Media">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {gallery.map((url: string, idx: number) => {
            const isAudio = url.toLowerCase().endsWith('.mp3');
            return (
              <div key={idx} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                {isAudio ? (
                  <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/30 p-2">
                    <Music size={40} />
                    <span className="text-[10px] mt-2 font-mono truncate w-full text-center px-1">
                      {url.split('/').pop()}
                    </span>
                  </div>
                ) : (
                  <img src={resolveUrl(url, mosqueKey)} className="flex-1 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Gallery item" />
                )}

                <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2 backdrop-blur-[2px]">
                  {!isAudio && (
                    <>
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
                        onClick={() => setConfig({
                          ...config,
                          mosqueInfo: { ...config.mosqueInfo, logoUrl: url }
                        })}
                        className="w-full py-1.5 bg-white text-slate-800 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition shadow-sm"
                      >
                        Gunakan sbg Logo
                      </button>
                    </>
                  )}
                  {isAudio && (
                    <button
                      onClick={() => setConfig({
                        ...config,
                        audio: { ...config.audio, url }
                      })}
                      className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
                    >
                      Set Audio Global
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const n = gallery.filter((_: any, i: number) => i !== idx);
                      const nS = config.sliderImages.filter((u: string) => u !== url);
                      setConfig({ ...config, gallery: n, sliderImages: nS });
                    }}
                    className="w-full py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition shadow-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
          <label className={`
            aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group gap-2
            ${uploading ? 'opacity-50 cursor-wait' : ''}
          `}>
            {uploading ? <RefreshCw size={32} className="animate-spin" /> : <UploadCloud size={32} className="group-hover:scale-110 transition-transform" />}
            <span className="text-xs font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Files'}</span>
            <input type="file" hidden accept="image/*,audio/mpeg" onChange={handleUpload} disabled={uploading} multiple />
          </label>
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
              <SectionCard title="Jadwal Kajian">
                <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <input type="checkbox" checked={config.kajian?.enabled} onChange={(e) =>
                    setConfig({ ...config, kajian: { ...(config.kajian || { schedule: [] }), enabled: e.target.checked } })
                  } className="w-5 h-5 accent-emerald-600" />
                  <span className="font-medium text-slate-700">Tampilkan Jadwal Kajian</span>
                </div>

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
                <SectionCard title="Ringkasan Kas">
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
              <SectionCard title="Jadwal Petugas Sholat Jum'at">
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

              <SectionCard title="Daftar Petugas (Marbot, Muadzin, Pengurus)">
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

  useEffect(() => {
    fetchDevices();
  }, [mosqueKey]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/devices?key=${mosqueKey}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDevices(data);
      } else {
        console.error("Failed to load devices:", data);
        setDevices([]);
      }
    } catch (e) {
      console.error(e);
      setDevices([]);
    }
    setLoading(false);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Hapus perangkat ini?')) return;
    await fetch(`/api/devices?deviceId=${id}&key=${mosqueKey}`, { method: 'DELETE' });
    fetchDevices();
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


  return (
    <SectionCard title="Daftar Perangkat Terhubung (TV/Client)">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Perangkat yang telah menginputkan <b>Mosque Key</b> Anda akan muncul di sini secara otomatis.
        </p>

        {loading ? (
          <div className="py-10 text-center text-slate-400 italic">Memuat daftar perangkat...</div>
        ) : devices.length === 0 ? (
          <div className="py-10 bg-slate-50 border border-dashed rounded-xl text-center text-slate-400">
            Belum ada perangkat yang terhubung.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {devices.map((d) => (
              <div key={d.device_id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{d.device_name || 'Generic TV Box'}</h4>
                    <p className="text-xs font-mono text-slate-400 truncate max-w-[200px]">{d.device_id}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-tighter">
                      Online • Aktif: {new Date(d.last_seen).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => remoteLogout()}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                    title="Reset Perangkat"
                  >
                    <RefreshCw size={14} className="animate-spin-slow" />
                    Reset
                  </button>
                  <button
                    onClick={() => deleteDevice(d.device_id)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                    title="Hapus dari Daftar"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
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
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm min-h-[100px]"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          step={step}
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

