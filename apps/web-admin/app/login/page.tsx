'use client';

import { useState, useEffect } from 'react';
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
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    // Handle OAuth callback errors
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get('error');
        if (oauthError) {
            const errorMessages: Record<string, string> = {
                'google_access_denied': 'Anda menolak akses. Silakan coba lagi.',
                'state_mismatch': 'Sesi keamanan expired. Silakan coba lagi.',
                'no_authorization_code': 'Gagal mendapat kode otorisasi dari Google.',
                'token_exchange_failed': 'Gagal menukar token dengan Google.',
                'user_info_failed': 'Gagal mengambil informasi pengguna dari Google.',
                'no_email': 'Email tidak ditemukan di akun Google Anda.',
                'callback_error': 'Terjadi kesalahan saat memproses login Google.',
            };
            setError(errorMessages[oauthError] || 'Terjadi kesalahan saat login dengan Google.');
            // Clear the error from URL
            window.history.replaceState({}, document.title, '/login');
        }
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            setError('');
            
            // Get Google auth URL
            const res = await fetch('/api/auth/google');
            if (!res.ok) {
                setError('Google OAuth tidak tersedia. Hubungi administrator.');
                return;
            }
            
            const { url } = await res.json();
            if (url) {
                // Redirect to Google OAuth
                window.location.href = url;
            }
        } catch (err) {
            setError('Gagal menghubungkan ke Google. Coba lagi.');
            console.error('Google login error:', err);
        } finally {
            setGoogleLoading(false);
        }
    };

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
                    if (!data.mosqueKey) {
                        setError('Akun belum memiliki masjid');
                        return;
                    }
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
                        <p className="text-3xl font-black text-emerald-500 font-mono tracking-wider">{generatedKey}</p>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.setItem('lastMosqueKey', generatedKey);
                            router.push(`/?key=${generatedKey}`);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
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
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 border border-emerald-400/30">
                    <span className="text-5xl">🕌</span>
                </div>
                <h1 className="text-4xl font-black mb-3 text-center leading-tight">
                    Smart Mosque
                </h1>
                <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-8">Digital Signage System</p>
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
                                            className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors placeholder:text-slate-300"
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
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors placeholder:text-slate-300"
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
                                        className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors placeholder:text-slate-300"
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
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
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
                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? 'Memproses...' : (
                                    mode === 'login'
                                        ? <><LogIn size={17} /> Masuk ke Dashboard</>
                                        : <><UserPlus size={17} /> Daftar Sekarang</>
                                )}
                            </button>
                        </form>

                        {/* Google Sign-In Divider */}
                        <div className="relative mt-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-white text-slate-400 font-medium">atau</span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full mt-4 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            {googleLoading ? 'Menghubungkan...' : (mode === 'login' ? 'Masuk' : 'Daftar') + ' dengan Google'}
                        </button>
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-xs font-semibold text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                {mode === 'login'
                                    ? <>Belum punya akun? <span className="text-slate-700 hover:text-emerald-500">Daftar gratis</span></>
                                    : <>Sudah punya akun? <span className="text-slate-700 hover:text-emerald-500">Login di sini</span></>
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
