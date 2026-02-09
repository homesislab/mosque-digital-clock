'use client';

import { useState } from 'react';
import { Key, Monitor, CheckCircle2 } from 'lucide-react';

interface SetupOverlayProps {
    onComplete: (key: string) => void;
}

export function SetupOverlay({ onComplete }: SetupOverlayProps) {
    const [key, setKey] = useState('');
    const [serverUrl, setServerUrl] = useState('http://127.0.0.1:3001');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim().length >= 4 && serverUrl.trim().length > 5) {
            setIsSubmitting(true);
            // Give some visual feedback
            setTimeout(() => {
                localStorage.setItem('mosqueKey', key.trim());
                localStorage.setItem('serverUrl', serverUrl.trim().replace(/\/$/, '')); // Clear trailing slash
                onComplete(key.trim());
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 rotate-3">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-2">Setup Perangkat</h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        Masukkan konfigurasi untuk menghubungkan TV ini ke sistem pusat.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Server URL</label>
                            <div className="relative">
                                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={serverUrl}
                                    onChange={(e) => setServerUrl(e.target.value)}
                                    placeholder="http://127.0.0.1:3001"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-0 transition-all font-mono text-sm text-slate-900"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Kode Masjid</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="Contoh: masjid-al-falah"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-0 transition-all font-mono text-sm text-slate-900"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || key.trim().length < 4 || serverUrl.trim().length < 5}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 animate-pulse" />
                                    Menghubungkan...
                                </>
                            ) : (
                                'Simpan & Hubungkan'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 w-full">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Mosque Digital Clock v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
