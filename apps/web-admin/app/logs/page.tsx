
'use client';

import { useState, useEffect } from 'react';
import { LogEntry } from '@mosque-digital-clock/shared-types';
import {
    Activity, Search, RotateCcw, Filter,
    Download, Trash2, Smartphone, Monitor
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [search, setSearch] = useState('');

    const router = useRouter();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logs?limit=200');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
        const matchesSource = filterSource === 'all' || log.source === filterSource;
        const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
            JSON.stringify(log.metadata).toLowerCase().includes(search.toLowerCase());
        return matchesLevel && matchesSource && matchesSearch;
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'info': return 'text-blue-600 bg-blue-50';
            case 'warn': return 'text-amber-600 bg-amber-50';
            case 'error': return 'text-red-600 bg-red-50';
            case 'success': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="text-emerald-600" />
                            System Logs
                        </h1>
                        <p className="text-slate-500 text-sm">Monitor aktivitas sistem dari Client dan Admin.</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 shadow-sm"
                    >
                        <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm shadow-emerald-200"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari logs..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="all">Semua Level</option>
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                            <option value="success">Success</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                        >
                            <option value="all">Semua Sumber</option>
                            <option value="client">Client (TV)</option>
                            <option value="admin">Admin Panel</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Waktu</th>
                                    <th className="px-6 py-3">Level</th>
                                    <th className="px-6 py-3">Sumber</th>
                                    <th className="px-6 py-3">Pesan</th>
                                    <th className="px-6 py-3">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            Tidak ada logs yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                    {log.source === 'client' ? <Monitor size={14} /> : <Smartphone size={14} />}
                                                    <span className="capitalize">{log.source}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-800 font-medium">
                                                {log.message}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 font-mono text-xs truncate max-w-xs">
                                                {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
                        <span>Menampilkan {filteredLogs.length} dari {logs.length} logs</span>
                        <span>Auto-limit: 200 entries</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
