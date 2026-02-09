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
    const [generatedKey, setGeneratedKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login' ? { email, password } : { email, password, name };

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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 text-amber-500 rotate-3">
                        {mode === 'login' ? <Lock size={32} /> : <UserPlus size={32} />}
                    </div>
                    <h1 className="text-3xl font-bold">{mode === 'login' ? 'Selamat Datang' : 'Buat Akun SaaS'}</h1>
                    <p className="text-zinc-500 text-sm mt-2">Jam Digital Masjid Modern</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                                Nama Masjid / Takmir
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                                    placeholder="Masjid Al-Ikhlas"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                                placeholder="nama@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Memproses...' : (mode === 'login' ? <><LogIn size={18} /> Masuk</> : <><UserPlus size={18} /> Daftar Sekarang</>)}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        {mode === 'login' ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Login di sini'}
                    </button>
                </div>
            </div>
        </div>
    );
}
