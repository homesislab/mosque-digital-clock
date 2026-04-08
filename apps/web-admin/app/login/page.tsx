'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, UserPlus, LogIn, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

type Mode = 'login' | 'register' | 'success';

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login' ? { email, password, rememberMe } : { email, password, name };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                if (mode === 'register') {
                    setGeneratedKey(data.mosqueKey);
                    setMode('success');
                } else {
                    localStorage.setItem('lastMosqueKey', data.mosqueKey);
                    router.push(`/?key=${data.mosqueKey}`);
                    router.refresh();
                }
            } else {
                setError(data.message || 'Terjadi kesalahan');
            }
        } catch {
            setError('Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 mx-auto text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h1>
                    <p className="text-slate-500 text-sm mb-8">Gunakan kode di bawah ini untuk menghubungkan TV Masjid Anda.</p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kode Unik Masjid Anda</p>
                        <p className="text-3xl font-black text-amber-500 font-mono tracking-wider">{generatedKey}</p>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.setItem('lastMosqueKey', generatedKey);
                            router.push(`/?key=${generatedKey}`);
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        Masuk Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-100">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1a2744] flex-col items-center justify-center p-12 text-white">
                <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-8 border border-amber-400/30">
                    <span className="text-5xl">🕌</span>
                </div>
                <h1 className="text-4xl font-black mb-3 text-center leading-tight">
                    Smart Mosque
                </h1>
                <p className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-8">Digital Signage System</p>
                <p className="text-slate-400 text-center text-sm leading-relaxed max-w-sm">
                    Sistem manajemen jadwal sholat dan media digital terintegrasi untuk masjid modern.
                </p>

                <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                    {[
                        { label: 'Jadwal Sholat', icon: '🕐' },
                        { label: 'Audio Otomatis', icon: '🔊' },
                        { label: 'Notifikasi WA', icon: '📲' },
                        { label: 'Multi Device', icon: '📺' },
                    ].map((f) => (
                        <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                            <span className="text-xl">{f.icon}</span>
                            <span className="text-xs font-semibold text-slate-300">{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Logo for mobile */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#1a2744] rounded-xl flex items-center justify-center text-xl">🕌</div>
                        <div>
                            <h1 className="font-black text-slate-800 text-lg leading-none">Smart Mosque</h1>
                            <p className="text-xs text-slate-400">Digital Signage System</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <div className="mb-7">
                            <h2 className="text-2xl font-black text-slate-800 mb-1">
                                {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {mode === 'login' ? 'Masuk ke panel admin masjid Anda.' : 'Daftarkan masjid Anda secara gratis.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'register' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                                        Nama Masjid / Takmir
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors placeholder:text-slate-300"
                                            placeholder="Masjid Al-Ikhlas"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors placeholder:text-slate-300"
                                        placeholder="nama@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors placeholder:text-slate-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {mode === 'login' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                                    />
                                    <label htmlFor="remember" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                                        Simpan Sesi Login
                                    </label>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? 'Memproses...' : (
                                    mode === 'login'
                                        ? <><LogIn size={17} /> Masuk ke Dashboard</>
                                        : <><UserPlus size={17} /> Daftar Sekarang</>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-xs font-semibold text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                {mode === 'login'
                                    ? <>Belum punya akun? <span className="text-slate-700 hover:text-amber-500">Daftar gratis</span></>
                                    : <>Sudah punya akun? <span className="text-slate-700 hover:text-amber-500">Login di sini</span></>
                                }
                            </button>
                        </div>
                    </div>

                    <p className="text-center mt-6 text-[10px] text-slate-400 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} Smart Mosque System
                    </p>
                </div>
            </div>
        </div>
    );
}
