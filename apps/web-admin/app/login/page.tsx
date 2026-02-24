'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, UserPlus, LogIn, Building2, ArrowRight, CheckCircle2, MoonStar } from 'lucide-react';

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
        } catch (err) {
            setError('Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/30 rounded-3xl p-10 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 mx-auto text-emerald-500">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Pendaftaran Berhasil!</h1>
                    <p className="text-zinc-400 mb-8">Gunakan kode di bawah ini untuk menghubungkan TV Masjid Anda.</p>

                    <div className="bg-black/50 border border-white/10 rounded-2xl p-6 mb-8">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Kode Unik Masjid Anda</p>
                        <p className="text-4xl font-black text-emerald-500 font-mono tracking-wider">{generatedKey}</p>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.setItem('lastMosqueKey', generatedKey);
                            router.push(`/?key=${generatedKey}`);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                    >
                        Masuk Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-zinc-950 text-white p-4 overflow-hidden">
            {/* High-End Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Inner Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>

                    <div className="flex flex-col items-center mb-10 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-3xl flex items-center justify-center mb-6 text-emerald-500 shadow-inner border border-white/5 rotate-3 hover:rotate-0 transition-transform duration-500">
                            {mode === 'login' ? <MoonStar size={36} strokeWidth={1.5} /> : <UserPlus size={36} strokeWidth={1.5} />}
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                            {mode === 'login' ? 'Selamat Datang' : 'Buat Akun'}
                        </h1>
                        <p className="text-zinc-500 text-sm mt-3 font-medium uppercase tracking-[0.2em]">Jam Digital Masjid Modern</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                    Nama Masjid / Takmir
                                </label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all font-medium placeholder:text-zinc-700 shadow-inner"
                                        placeholder="Masjid Al-Ikhlas"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                Email Address
                            </label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-emerald-500 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all font-medium placeholder:text-zinc-700 shadow-inner"
                                    placeholder="nama@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                Password
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-emerald-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all font-medium placeholder:text-zinc-700 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {mode === 'login' && (
                            <div className="flex items-center space-x-3 mt-4 ml-1">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 text-emerald-600 focus:ring-emerald-500 bg-black/40 cursor-pointer accent-emerald-500"
                                />
                                <label htmlFor="remember" className="text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer select-none">
                                    Simpan Sesi Login
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-in shake-in duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden group/btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_15px_30px_rgba(5,150,105,0.4)] active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {loading ? 'Memproses...' : (mode === 'login' ? <><LogIn size={20} /> Masuk ke Dashboard</> : <><UserPlus size={20} /> Daftar Sekarang</>)}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center relative">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-zinc-500 hover:text-emerald-500 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto group/toggle"
                        >
                            {mode === 'login' ? (
                                <>Belum punya akun? <span className="text-zinc-300 group-hover/toggle:text-emerald-400 transition-colors">Daftar gratis</span></>
                            ) : (
                                <>Sudah punya akun? <span className="text-zinc-300 group-hover/toggle:text-emerald-400 transition-colors">Login di sini</span></>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                    &copy; {new Date().getFullYear()} Smart Mosque System
                </p>
            </div>
        </div>
    );
}
