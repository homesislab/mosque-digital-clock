'use client';

import { LogOut, X, AlertTriangle } from 'lucide-react';

interface LogoutConfirmationProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full relative overflow-hidden text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-2">Logout Client?</h3>
                <p className="text-slate-500 mb-8 font-medium">
                    Anda akan keluar dari konfigurasi masjid saat ini dan harus melakukan setup ulang perangkat.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-rose-700 active:scale-95 transition-all"
                    >
                        <LogOut size={20} />
                        Ya, Keluar
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        <X size={20} />
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
}
