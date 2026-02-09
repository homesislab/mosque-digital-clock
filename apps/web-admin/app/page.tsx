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
  Music, Library, Plus
} from 'lucide-react';

// Dynamic import for MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('./components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center rounded-xl font-medium text-slate-400">Memuat Peta...</div>
});

type Tab = 'dashboard' | 'identity' | 'prayer' | 'slideshow' | 'audio' | 'gallery' | 'content' | 'finance';

export default function AdminDashboard() {
  const [config, setConfig] = useState<MosqueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config');
      if (res.status === 401) {
        router.push('/login');
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
    router.push('/login');
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      // Optional: Add toast notification
    } catch (error) {
      alert('Gagal menyimpan');
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-emerald-200 shadow-md">
            M
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Admin Panel</h1>
            <p className="text-xs text-slate-400 font-medium">Masjid Digital Clock</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={MapPin} label="Identitas & Lokasi" active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} />
          <SidebarItem icon={Clock} label="Jadwal Sholat" active={activeTab === 'prayer'} onClick={() => setActiveTab('prayer')} />
          <SidebarItem icon={ImageIcon} label="Manajemen Slide" active={activeTab === 'slideshow'} onClick={() => setActiveTab('slideshow')} />
          <SidebarItem icon={Music} label="Manajemen MP3" active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} />
          <SidebarItem icon={Library} label="Galeri Media" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
          <SidebarItem icon={MessageSquare} label="Konten Informasi" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <SidebarItem icon={Wallet} label="Keuangan & Petugas" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {tabLabels[activeTab]}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">v1.2.0</span>
            <button onClick={() => fetchConfig()} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all" title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-slate-50/50">
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
              {activeTab === 'identity' && <IdentitySection config={config} setConfig={setConfig} updateConfig={updateConfig} />}
              {activeTab === 'prayer' && <PrayerSection config={config} setConfig={setConfig} />}
              {activeTab === 'slideshow' && <SlideshowSection config={config} setConfig={setConfig} />}
              {activeTab === 'audio' && <AudioSection config={config} setConfig={setConfig} />}
              {activeTab === 'gallery' && <GallerySection config={config} setConfig={setConfig} updateConfig={updateConfig} />}
              {activeTab === 'content' && <ContentSection config={config} setConfig={setConfig} />}
              {activeTab === 'finance' && <FinanceSection config={config} setConfig={setConfig} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Save Bar */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 px-8 flex justify-between items-center z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="text-sm text-slate-500">
            {saving ? 'Menyimpan perubahan...' : 'Pastikan menyimpan setelah mengubah data.'}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
                    flex items-center gap-2 px-8 py-2.5 rounded-lg font-semibold text-white shadow-lg shadow-emerald-200 transition-all
                    ${saving ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'}
                `}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Simpan Perubahan'}
          </button>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
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

const SectionCard = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 ${className}`}>
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 after:content-[''] after:h-px after:flex-1 after:bg-slate-100 after:ml-4">
      {title}
    </h3>
    {children}
  </div>
);

const DashboardOverview = ({ config, setActiveTab }: { config: MosqueConfig, setActiveTab: (t: Tab) => void }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Saldo Kas"
        val={`Rp ${config.finance.balance.toLocaleString('id-ID')}`}
        sub={`Update: ${config.finance.lastUpdated}`}
        icon={Wallet}
        color="green"
        onClick={() => setActiveTab('finance')}
      />
      <StatCard
        title="Gambar Slider"
        val={`${config.sliderImages.length} Foto`}
        sub="Rotasi per 10 detik"
        icon={ImageIcon}
        color="blue"
        onClick={() => setActiveTab('slideshow')}
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

const StatCard = ({ title, val, sub, icon: Icon, color, onClick }: any) => {
  const colors: any = {
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <button onClick={onClick} className={`text-left p-6 rounded-xl border transition-all hover:shadow-md ${colors[color]} bg-white`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors[color].split(' ')[0]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-1">{val}</div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
      <div className="text-xs text-slate-400 mt-2">{sub}</div>
    </button>
  )
}

const IdentitySection = ({ config, setConfig, updateConfig }: any) => (
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
              <img src={config.mosqueInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <span className="text-4xl">🕌</span>
            )}
          </div>
          <label className="cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
            <input type="file" hidden accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('file', file);
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              const data = await res.json();
              if (data.success) {
                const url = data.url; // Use relative path from API
                updateConfig('mosqueInfo', 'logoUrl', url);
                const currentGallery = config.gallery || [];
                if (!currentGallery.includes(url)) {
                  setConfig({ ...config, mosqueInfo: { ...config.mosqueInfo, logoUrl: url }, gallery: [...currentGallery, url] });
                }
              }
            }} />
            Choose Logo
          </label>
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

const PrayerSection = ({ config, setConfig }: any) => (
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
      </SectionCard>
    </div>
  </div>
);

const SlideshowSection = ({ config, setConfig }: any) => (
  <div className="space-y-6">
    <SectionCard title="Pengaturan Slide Show">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {config.sliderImages.map((url: string, idx: number) => (
          <div key={idx} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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
        <button
          onClick={() => { /* Open gallery or just upload? Let's keep it simple: Upload for now but also link to gallery */ }}
          className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer group gap-2"
        >
          <Plus size={32} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Tambah Slide</span>
          <input type="file" hidden accept="image/*" className="hidden" /> {/* Placeholder logic if needed */}
        </button>
      </div>
      <p className="text-sm text-slate-400 italic">Tip: Gunakan menu Galeri untuk mengelola file dan menambahkannya ke Slide.</p>
    </SectionCard>
  </div>
);

const AudioSection = ({ config, setConfig }: any) => (
  <div className="space-y-6">
    <SectionCard title="Manajemen Audio Murottal">
      <div className="flex gap-4 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={config.audio.enabled} onChange={(e) =>
              setConfig({ ...config, audio: { ...config.audio, enabled: e.target.checked } })
            } className="w-5 h-5 accent-emerald-600" />
            <span className="font-medium text-slate-700">Auto Play Sebelum Azan</span>
          </div>
          {config.audio.enabled && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <InputGroup label="URL Audio (MP3/Stream)" value={config.audio.url} onChange={(v: string) => {
                setConfig({ ...config, audio: { ...config.audio, url: v } });
              }} />
              <InputGroup label="Durasi Putar (Menit)" value={config.audio.playBeforeMinutes} type="number" onChange={(v: string) => {
                setConfig({ ...config, audio: { ...config.audio, playBeforeMinutes: parseInt(v) } });
              }} />
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  </div>
);

const GallerySection = ({ config, setConfig, updateConfig }: any) => {
  const gallery = config.gallery || [];

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      const url = data.url; // Relative path e.g. /uploads/xxx.jpg
      setConfig({
        ...config,
        gallery: [...gallery, url]
      });
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Manajemen Galeri Media">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {gallery.map((url: string, idx: number) => (
            <div key={idx} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
              <img src={url} className="flex-1 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Gallery item" />

              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                <button
                  onClick={() => {
                    if (!config.sliderImages.includes(url)) {
                      setConfig({ ...config, sliderImages: [...config.sliderImages, url] });
                    }
                  }}
                  className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  Jadikan Slide
                </button>
                <button
                  onClick={() => updateConfig('mosqueInfo', 'logoUrl', url)}
                  className="w-full py-1.5 bg-white text-slate-800 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition"
                >
                  Gunakan sbg Logo
                </button>
                <button
                  onClick={() => {
                    const n = gallery.filter((_: any, i: number) => i !== idx);
                    const nS = config.sliderImages.filter((u: string) => u !== url);
                    setConfig({ ...config, gallery: n, sliderImages: nS });
                  }}
                  className="w-full py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer group gap-2">
            <UploadCloud size={32} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Upload File</span>
            <input type="file" hidden accept="image/*" onChange={handleUpload} />
          </label>
        </div>
      </SectionCard>
    </div>
  );
};

const ContentSection = ({ config, setConfig }: any) => (
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
            Hapus
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
);

const FinanceSection = ({ config, setConfig }: any) => (
  <div className="space-y-6">
    <SectionCard title="Petugas Jumat">
      <div className="space-y-4">
        {config.officers.map((off: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="w-1/3">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Role</label>
              <input className="w-full p-2 border rounded font-medium text-slate-700 bg-white" value={off.role} onChange={(e) => {
                const n = [...config.officers]; n[idx].role = e.target.value; setConfig({ ...config, officers: n });
              }} placeholder="Khatib/Imam..." />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nama Petugas</label>
              <input className="w-full p-2 border rounded font-medium text-slate-700 bg-white" value={off.name} onChange={(e) => {
                const n = [...config.officers]; n[idx].name = e.target.value; setConfig({ ...config, officers: n });
              }} placeholder="Nama Lengkap..." />
            </div>
            <button onClick={() => {
              const n = config.officers.filter((_: any, i: number) => i !== idx);
              setConfig({ ...config, officers: n });
            }} className="text-red-400 hover:text-red-600 p-2"><LogOut size={16} className="rotate-90" /></button>
          </div>
        ))}
        <button onClick={() => setConfig({ ...config, officers: [...config.officers, { role: '', name: '' }] })} className="text-emerald-600 text-sm font-semibold hover:underline">+ Tambah Petugas</button>
      </div>
    </SectionCard>

    <SectionCard title="Laporan Kas">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputGroup label="Saldo Akhir" value={config.finance.balance} type="number" onChange={(v: string) =>
          setConfig({ ...config, finance: { ...config.finance, balance: parseInt(v) } })
        } />
        <InputGroup label="Pemasukan (Minggu Ini)" value={config.finance.income} type="number" onChange={(v: string) =>
          setConfig({ ...config, finance: { ...config.finance, income: parseInt(v) } })
        } />
        <InputGroup label="Pengeluaran (Minggu Ini)" value={config.finance.expense} type="number" onChange={(v: string) =>
          setConfig({ ...config, finance: { ...config.finance, expense: parseInt(v) } })
        } />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <InputGroup label="Tanggal Update Data" value={config.finance.lastUpdated} type="date" onChange={(v: string) =>
          setConfig({ ...config, finance: { ...config.finance, lastUpdated: v } })
        } />
      </div>
    </SectionCard>
  </div>
);

// --- Helpers ---

const InputGroup = ({ label, value, onChange, type = 'text', step }: any) => (
  <div className="w-full">
    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
    {type === 'textarea' ? (
      <textarea className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm min-h-[100px]" value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input
        type={type}
        step={step}
        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

const tabLabels: Record<Tab, string> = {
  dashboard: 'Dashboard Overview',
  identity: 'Identitas & Lokasi Masjid',
  prayer: 'Konfigurasi Jadwal Sholat',
  slideshow: 'Manajemen Slide Show',
  audio: 'Manajemen Audio MP3',
  gallery: 'Galeri Media',
  content: 'Konten Informasi',
  finance: 'Keuangan & Petugas',
};
