'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, RefreshCw, LogOut, LayoutDashboard, MapPin,
  Clock, Image as ImageIcon, MessageSquare, Users,
  Wallet, Settings, ChevronRight, UploadCloud,
  Music, Library, Plus, Moon, Menu, X, Play, XCircle, AlarmCheck, Sliders
} from 'lucide-react';

// Dynamic import for MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('./components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center rounded-xl font-medium text-slate-400">Memuat Peta...</div>
});

import AdvancedConfigSection from './components/AdvancedConfigSection';

type Tab = 'dashboard' | 'identity' | 'prayer' | 'media' | 'gallery' | 'content' | 'devices' | 'advance';

export default function AdminDashboard() {
  const [mosqueKey, setMosqueKey] = useState<string>('');
  const [config, setConfig] = useState<MosqueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'image' | 'audio' | 'any'>('any');
  const [pickerTarget, setPickerTarget] = useState<{ section: string, prayer?: string } | null>(null);
  const router = useRouter();

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

  const handleSave = async () => {
    if (!config || !mosqueKey) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/config?key=${mosqueKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      // Optional: Add toast notification
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Gagal menyimpan: ${error.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const updateConfig = (section: keyof MosqueConfig, key: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      [section]: {
        ...config[section as keyof MosqueConfig],
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
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-emerald-200 shadow-md">
              M
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">SaaS Admin</h1>
              <p className="text-xs text-slate-400 font-medium">Mosque Digital Clock</p>
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
          <SidebarItem icon={Settings} label="Media & Fitur" active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setSidebarOpen(false); }} />
          <SidebarItem icon={Library} label="Galeri Media" active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }} />
          <SidebarItem icon={MessageSquare} label="Konten Informasi" active={activeTab === 'content'} onClick={() => { setActiveTab('content'); setSidebarOpen(false); }} />
          <SidebarItem icon={LayoutDashboard} label="Manajemen Device" active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setSidebarOpen(false); }} />
          <SidebarItem icon={Sliders} label="Advance Config" active={activeTab === 'advance'} onClick={() => { setActiveTab('advance'); setSidebarOpen(false); }} />
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
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 truncate">
              {tabLabels[activeTab]}
            </h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Aktif di TV</span>
              <span className="text-xs font-mono font-black text-emerald-500">{mosqueKey}</span>
            </div>
            <span className="hidden xs:inline-block text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">SaaS v2.0</span>
            <button onClick={() => fetchConfig()} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all" title="Refresh">
              <RefreshCw size={18} />
            </button>
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
              {activeTab === 'dashboard' && <DashboardOverview config={config} setActiveTab={setActiveTab} />}
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
                  onPickIqamahAudio={() => {
                    setPickerType('audio');
                    setPickerTarget({ section: 'iqamah-audio' });
                    setPickerOpen(true);
                  }}
                />
              )}
              {activeTab === 'media' && (
                <MediaConfigSection
                  config={config}
                  setConfig={setConfig}
                  mosqueKey={mosqueKey}
                  onPickSlide={() => {
                    setPickerType('image');
                    setPickerTarget({ section: 'slideshow' });
                    setPickerOpen(true);
                  }}
                  onPickAudio={(prayer?: string) => {
                    const target = prayer === 'imsak' ? 'ramadhan-audio' : 'audio';
                    setPickerType('audio');
                    setPickerTarget({ section: target, prayer });
                    setPickerOpen(true);
                  }}
                />
              )}
              {activeTab === 'gallery' && <GallerySection config={config} setConfig={setConfig} updateConfig={updateConfig} mosqueKey={mosqueKey} />}
              {activeTab === 'content' && (
                <ContentSection
                  config={config}
                  setConfig={setConfig}
                  onPickAudio={(target: string) => {
                    setPickerType('audio');
                    setPickerTarget({ section: 'ramadhan-audio', prayer: target });
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
              } else if (pickerTarget?.section === 'audio') {
                if (pickerTarget.prayer) {
                  const prayer = pickerTarget.prayer;
                  const currentSchedule = (config.audio.customSchedule as any) || {};
                  const prayerSchedule = currentSchedule[prayer] || { url: '', playMode: 'before', offsetMinutes: 10, enabled: false };
                  setConfig({
                    ...config,
                    audio: {
                      ...config.audio,
                      customSchedule: {
                        ...currentSchedule,
                        [prayer]: { ...prayerSchedule, url, enabled: true }
                      } as any
                    }
                  });
                } else {
                  setConfig({ ...config, audio: { ...config.audio, url } });
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
            onClick={handleSave}
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
  media: 'Media & Fitur Unggulan',
  gallery: 'Galeri Media',
  content: 'Konten Informasi',
  devices: 'Manajemen Perangkat TV',
  advance: 'Advanced Configuration (Tampilan)',
};

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

function DashboardOverview({ config, setActiveTab }: { config: MosqueConfig, setActiveTab: (t: Tab) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Saldo Kas"
          val={`Rp ${(config.finance.totalBalance || 0).toLocaleString('id-ID')}`}
          sub={`Update: ${config.finance.lastUpdated}`}
          icon={Wallet}
          color="green"
          onClick={() => setActiveTab('content')}
        />
        <StatCard
          title="Gambar Slider"
          val={`${config.sliderImages.length} Foto`}
          sub="Rotasi per 10 detik"
          icon={ImageIcon}
          color="blue"
          onClick={() => setActiveTab('media')}
        />
        <StatCard
          title="Info Berjalan"
          val={`${config.runningText.length} Pesan`}
          sub="Tampil di footer"
          icon={MessageSquare}
          color="orange"
          onClick={() => setActiveTab('content')}
        />
      </div>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl shadow-emerald-200">
        <h3 className="text-2xl font-bold mb-2">Selamat Datang, Admin!</h3>
        <p className="opacity-90 max-w-2xl">
          Gunakan panel navigasi di sebelah kiri untuk mengatur seluruh konfigurasi Jam Digital Masjid.
          Semua perubahan akan langsung tersimpan dan tersinkronisasi.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, val, sub, icon: Icon, color, onClick }: any) {
  const colors: any = {
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border ${colors[color]} hover:shadow-md transition-all text-left group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <ChevronRight size={16} className="opacity-30 group-hover:opacity-100 transition-opacity" />
      </div>
      <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{title}</h4>
      <div className="text-2xl font-black mb-1">{val}</div>
      <div className="text-[10px] opacity-60 font-medium">{sub}</div>
    </button>
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


function PrayerSection({ config, setConfig, onPickIqamahAudio }: any) {
  return (
    <div className="space-y-6">
      <SectionCard title="Metode & Hisab">
        <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2 mb-6 border border-emerald-100">
          <MapPin size={16} /> Lokasi masjid telah diatur di menu <b>Identitas & Lokasi</b>.
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Koreksi Waktu (Menit)">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(config.prayerTimes.adjustments).map(([k, v]) => (
              <InputGroup key={k} label={`Koreksi ${k}`} value={v} type="number" onChange={(val: string) => {
                const n = { ...config.prayerTimes.adjustments, [k]: parseInt(val) };
                setConfig({ ...config, prayerTimes: { ...config.prayerTimes, adjustments: n } });
              }} />
            ))}
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
                  <button onClick={onPickIqamahAudio} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm ml-2 shrink-0">
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

function AudioSection({ config, setConfig, onPickAudio, mosqueKey }: any) {
  const [uploading, setUploading] = useState<string | null>(null);

  const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'] as const;

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, prayer?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadId = prayer || 'default';
    setUploading(uploadId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        const url = data.url;
        if (prayer) {
          const currentSchedule = config.audio.customSchedule || {};
          const prayerSchedule = currentSchedule[prayer] || { url: '', playMode: 'before', offsetMinutes: 10, enabled: false };

          setConfig({
            ...config,
            audio: {
              ...config.audio,
              customSchedule: {
                ...currentSchedule,
                [prayer]: { ...prayerSchedule, url, enabled: true }
              }
            },
            gallery: config.gallery?.includes(url) ? config.gallery : [...(config.gallery || []), url]
          });
        } else {
          setConfig({
            ...config,
            audio: { ...config.audio, url },
            gallery: config.gallery?.includes(url) ? config.gallery : [...(config.gallery || []), url]
          });
        }
      } else {
        alert('Gagal mengunggah audio: ' + data.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(null);
    }
  };

  const updateSchedule = (prayer: string, field: string, value: any) => {
    const currentSchedule = config.audio.customSchedule || {};
    const prayerSchedule = currentSchedule[prayer] || { url: '', playMode: 'before', offsetMinutes: 10, enabled: false };

    setConfig({
      ...config,
      audio: {
        ...config.audio,
        customSchedule: {
          ...currentSchedule,
          [prayer]: { ...prayerSchedule, [field]: value }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Audio Murottal (Global)">
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={config.audio.enabled} onChange={(e) =>
                setConfig({ ...config, audio: { ...config.audio, enabled: e.target.checked } })
              } className="w-5 h-5 accent-emerald-600" />
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">Aktifkan Audio Global</span>
                <span className="text-xs text-slate-400 italic">Audio ini akan diputar sebagai fallback jika tidak ada jadwal kustom.</span>
              </div>
            </div>
            {config.audio.enabled && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <InputGroup label="URL Audio Global (MP3/Stream)" value={config.audio.url} onChange={(v: string) => {
                      setConfig({ ...config, audio: { ...config.audio, url: v } });
                    }} />
                  </div>
                  <label className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all shadow-sm
                    ${uploading === 'default' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    {uploading === 'default' ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                    <input type="file" hidden accept="audio/mpeg" onChange={(e) => handleAudioUpload(e)} disabled={uploading === 'default'} />
                  </label>
                  <button
                    onClick={() => onPickAudio()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Library size={16} />
                  </button>
                </div>
                {config.audio.url && (
                  <audio controls className="w-full mt-2 h-10 rounded-lg">
                    <source src={resolveUrl(config.audio.url, mosqueKey)} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                <InputGroup label="Default Durasi Putar (Menit)" value={config.audio.playBeforeMinutes} type="number" onChange={(v: string) => {
                  setConfig({ ...config, audio: { ...config.audio, playBeforeMinutes: parseInt(v) } });
                }} />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Jadwal Audio Kustom (Per Waktu Sholat)">
        <div className="space-y-6">
          <p className="text-sm text-slate-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
            Anda dapat mengatur audio berbeda untuk setiap waktu sholat. Pilihan <b>Mode Putar</b> menentukan apakah audio diputar sebelum, saat (tepat waktu), atau sesudah adzan.
          </p>

          <div className="space-y-4">
            {prayers.map((prayer) => {
              const schedule = config.audio.customSchedule?.[prayer] || { url: '', playMode: 'before', offsetMinutes: 10, enabled: false };
              return (
                <div key={prayer} className={`p-6 rounded-2xl border-2 transition-all ${schedule.enabled ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase ${schedule.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {prayer[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 capitalize leading-tight">{prayer}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Audio Kustom</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => updateSchedule(prayer, 'enabled', true)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${schedule.enabled ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        ON
                      </button>
                      <button
                        onClick={() => updateSchedule(prayer, 'enabled', false)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!schedule.enabled ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {schedule.enabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <InputGroup label="URL Audio" value={schedule.url} onChange={(v: string) => updateSchedule(prayer, 'url', v)} placeholder="http://..." />
                        </div>
                        <label className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all shadow-sm
                          ${uploading === prayer ? 'opacity-50 cursor-not-allowed' : ''}
                        `}>
                          {uploading === prayer ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                          <input type="file" hidden accept="audio/mpeg" onChange={(e) => handleAudioUpload(e, prayer)} disabled={uploading === prayer} />
                        </label>
                        <button
                          onClick={() => onPickAudio(prayer)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <Library size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mode Putar</label>
                          <select
                            value={schedule.playMode}
                            onChange={(e) => updateSchedule(prayer, 'playMode', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all text-sm font-medium"
                          >
                            <option value="before">Sebelum Adzan (Countdown)</option>
                            <option value="at">Tepat Waktu Adzan</option>
                            <option value="after">Sesudah Adzan (Dzikir/Ba'da)</option>
                          </select>
                        </div>
                        <InputGroup
                          label="Offset Waktu (Menit)"
                          value={schedule.offsetMinutes}
                          type="number"
                          onChange={(v: string) => updateSchedule(prayer, 'offsetMinutes', parseInt(v))}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function MediaConfigSection({ config, setConfig, onPickSlide, onPickAudio, mosqueKey }: any) {
  const [subTab, setSubTab] = useState<'slideshow' | 'audio' | 'ramadhan' | 'simulation'>('slideshow');
  const [simPrayer, setSimPrayer] = useState('Subuh');
  const [simMode, setSimMode] = useState<'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'NORMAL'>('ADZAN');

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit mb-6">
        {[
          { id: 'slideshow', label: 'Slide Show', icon: <ImageIcon size={16} /> },
          { id: 'audio', label: 'Audio MP3', icon: <Music size={16} /> },
          { id: 'ramadhan', label: 'Fitur Ramadhan', icon: <Moon size={16} /> },
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
              onPickSlide={onPickSlide}
              mosqueKey={mosqueKey}
            />
          )}

          {subTab === 'audio' && (
            <AudioSection
              config={config}
              setConfig={setConfig}
              onPickAudio={onPickAudio}
              mosqueKey={mosqueKey}
            />
          )}

          {subTab === 'ramadhan' && (
            <div className="space-y-6">
              <SectionCard title="Mode Khusus Ramadhan">
                <div className="flex items-center gap-3 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <input
                    type="checkbox"
                    checked={!!config.ramadhan?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      ramadhan: { ...(config.ramadhan || { imsakOffset: 10 }), enabled: e.target.checked }
                    })}
                    className="w-5 h-5 accent-amber-600"
                  />
                  <div>
                    <span className="font-bold text-amber-900 block">Aktifkan Mode Ramadhan</span>
                    <span className="text-xs text-amber-700 italic">Menampilkan notifikasi Imsak dan fitur khusus Ramadhan lainnya.</span>
                  </div>
                </div>

                {config.ramadhan?.enabled && (
                  <div className="space-y-6 pt-2">
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-amber-500" />
                        Pengaturan Waktu Imsak
                      </h4>
                      <div className="max-w-xs">
                        <InputGroup
                          label="Imsak (Menit Sebelum Subuh)"
                          value={config.ramadhan?.imsakOffset || 10}
                          type="number"
                          onChange={(v: string) => setConfig({
                            ...config,
                            ramadhan: { ...(config.ramadhan || { enabled: false, imsakOffset: 10 }), imsakOffset: parseInt(v) }
                          })}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-3 italic">Standar Imsak di Indonesia umumnya adalah 10 menit sebelum waktu Subuh.</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Music size={18} className="text-emerald-500" />
                        Audio Khusus Imsak
                      </h4>
                      <div className="flex items-center gap-3 mb-6">
                        <input
                          type="checkbox"
                          checked={!!config.ramadhan?.imsakAudioEnabled}
                          onChange={(e) => setConfig({
                            ...config,
                            ramadhan: { ...(config.ramadhan || { enabled: false, imsakOffset: 10 }), imsakAudioEnabled: e.target.checked }
                          })}
                          className="w-5 h-5 accent-emerald-600"
                        />
                        <span className="font-medium text-slate-700 text-sm">Putar audio pengingat Imsak (Opsional)</span>
                      </div>

                      {config.ramadhan?.imsakAudioEnabled && (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <InputGroup
                                label="URL Audio Imsak"
                                value={config.ramadhan?.imsakAudioUrl || ''}
                                onChange={(v: string) => setConfig({
                                  ...config,
                                  ramadhan: { ...(config.ramadhan || { enabled: false, imsakOffset: 10 }), imsakAudioUrl: v }
                                })}
                                placeholder="http://..."
                              />
                            </div>
                            <button
                              onClick={() => onPickAudio('imsak')}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                            >
                              <Library size={16} /> Pilih dari Galeri
                            </button>
                          </div>
                          <div className="max-w-xs">
                            <InputGroup
                              label="Durasi Putar (Menit Sebelum Imsak)"
                              value={config.ramadhan?.imsakAudioDuration || 30}
                              type="number"
                              onChange={(v: string) => setConfig({
                                ...config,
                                ramadhan: { ...(config.ramadhan || { enabled: false, imsakOffset: 10 }), imsakAudioDuration: parseInt(v) }
                              })}
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-4 italic">Audio akan berhenti otomatis saat memasuki waktu Imsak.</p>
                    </div>
                  </div>
                )}
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
                      onClick={() => setConfig({ ...config, simulation: null as any })}
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
                          onClick={() => setSimPrayer(p)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${simPrayer === p
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
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

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (simMode === 'NORMAL') {
                        setConfig({ ...config, simulation: null as any });
                      } else {
                        setConfig({
                          ...config,
                          simulation: {
                            isSimulating: true,
                            prayerName: simPrayer,
                            state: simMode,
                            startTime: Date.now()
                          }
                        });
                      }
                    }}
                    className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${simMode === 'NORMAL'
                      ? 'bg-slate-500 hover:bg-slate-600 text-white shadow-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                      }`}
                  >
                    {simMode === 'NORMAL' ? <XCircle size={20} /> : <Play size={20} />}
                    {simMode === 'NORMAL' ? 'HENTIKAN SIMULASI' : `MULAI SIMULASI ${simPrayer.toUpperCase()} (${simMode})`}
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
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredGallery.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <Library size={48} className="mb-4 opacity-20" />
              <p>Belum ada file {type !== 'any' ? (type === 'image' ? 'gambar' : 'audio') : ''} di galeri.</p>
            </div>
          ) : (
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
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const url = data.url;
        setConfig({
          ...config,
          gallery: [...gallery, url]
        });
      }
    } catch (e) {
      alert('Gagal mengunggah');
    } finally {
      setUploading(false);
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
            <span className="text-xs font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input type="file" hidden accept="image/*,audio/mpeg" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}


function ContentSection({ config, setConfig, onPickAudio, mosqueKey }: any) {
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
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{d.device_name || 'Generic TV Box'}</h4>
                    <p className="text-xs font-mono text-slate-400">{d.device_id}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-1">
                      Terakhir Aktif: {new Date(d.last_seen).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteDevice(d.device_id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} className="rotate-180" />
                </button>
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

function InputGroup({ label, value, onChange, type = 'text', step }: any) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm min-h-[100px]"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          step={step}
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

