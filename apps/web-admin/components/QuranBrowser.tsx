'use client';

import { useState, useEffect, useCallback } from 'react';

interface Edition {
    identifier: string;
    name: string;
    englishName: string;
    language: string;
    surahCount: number;
}

interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
}

interface LocalFile {
    filename: string;
    url: string;
    size: number;
    edition: string;
    surahNumber: number;
    surahName: string;
}

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error' | 'cached';

interface DownloadState {
    status: DownloadStatus;
    error?: string;
    url?: string;
}

interface QuranBrowserProps {
    mosqueKey: string;
    onAddToPlaylist: (tracks: { id: string; title: string; url: string }[]) => void;
}

const POPULAR_RECITERS = [
    'ar.alafasy',
    'ar.husary',
    'ar.abdurrahmaansudais',
    'ar.misharyrashidalafasy',
    'ar.saudalshuraim',
];

export function QuranBrowser({ mosqueKey, onAddToPlaylist }: QuranBrowserProps) {
    const [editions, setEditions] = useState<Edition[]>([]);
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
    const [selectedEdition, setSelectedEdition] = useState('ar.alafasy');
    const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
    const [downloadStates, setDownloadStates] = useState<Record<number, DownloadState>>({});
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedForPlaylist, setSelectedForPlaylist] = useState<Set<string>>(new Set());
    const [playlistName, setPlaylistName] = useState('Murrotal Al-Quran');
    const [activeTab, setActiveTab] = useState<'browse' | 'library'>('browse');
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [libraryEdition, setLibraryEdition] = useState('');  // separate from Browse's selectedEdition

    // Load editions & surahs
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/quran/editions').then(r => r.json()),
            fetch('/api/quran/surahs').then(r => r.json()),
        ]).then(([edData, sData]) => {
            if (edData.success) setEditions(edData.data);
            if (sData.success) setSurahs(sData.data);
        }).finally(() => setLoading(false));
    }, []);

    const refreshLibrary = useCallback(() => {
        // Fetch ALL files (no edition filter) so library shows everything downloaded
        fetch(`/api/quran/files?key=${mosqueKey}`)
            .then(r => r.json())
            .then(d => { if (d.success) setLocalFiles(d.data); });
    }, [mosqueKey]);

    useEffect(() => { refreshLibrary(); }, [refreshLibrary]);

    // Mark already-downloaded surahs
    useEffect(() => {
        const edFiles = localFiles.filter(f => f.edition === selectedEdition);
        const doneNumbers = new Set(edFiles.map(f => f.surahNumber));
        setDownloadStates(prev => {
            const next = { ...prev };
            doneNumbers.forEach(n => {
                if (!next[n] || next[n].status === 'idle') {
                    next[n] = { status: 'cached', url: localFiles.find(f => f.surahNumber === n && f.edition === selectedEdition)?.url };
                }
            });
            return next;
        });
    }, [localFiles, selectedEdition]);

    const toggleSurah = (n: number) => {
        setSelectedSurahs(prev => {
            const next = new Set(prev);
            next.has(n) ? next.delete(n) : next.add(n);
            return next;
        });
    };

    const selectAll = () => setSelectedSurahs(new Set(surahs.map(s => s.number)));
    const selectNone = () => setSelectedSurahs(new Set());
    const selectJuz30 = () => {
        // Juz 30: Surah 78-114
        setSelectedSurahs(new Set(surahs.filter(s => s.number >= 78).map(s => s.number)));
    };

    const downloadSelected = async () => {
        if (selectedSurahs.size === 0) return;
        setIsDownloading(true);

        const toDownload = [...selectedSurahs].filter(n => {
            const st = downloadStates[n]?.status;
            return st !== 'done' && st !== 'cached' && st !== 'downloading';
        });

        // Set all to downloading
        setDownloadStates(prev => {
            const next = { ...prev };
            toDownload.forEach(n => { next[n] = { status: 'downloading' }; });
            return next;
        });

        // Parallel download with concurrency limit of 3
        const CONCURRENCY = 3;
        const queue = [...toDownload];
        const results: Promise<void>[] = [];

        const runNext = async () => {
            while (queue.length > 0) {
                const surahNum = queue.shift()!;
                const surah = surahs.find(s => s.number === surahNum);
                if (!surah) continue;

                try {
                    const res = await fetch('/api/quran/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mosqueKey,
                            edition: selectedEdition,
                            surahNumber: surahNum,
                            surahName: surah.name,
                            surahEnglishName: surah.englishName,
                            bitrate: 128,
                        }),
                    });
                    const data = await res.json();
                    setDownloadStates(prev => ({
                        ...prev,
                        [surahNum]: data.success
                            ? { status: data.cached ? 'cached' : 'done', url: data.url }
                            : { status: 'error', error: data.message },
                    }));
                } catch (e: any) {
                    setDownloadStates(prev => ({
                        ...prev,
                        [surahNum]: { status: 'error', error: e.message },
                    }));
                }
            }
        };

        for (let i = 0; i < Math.min(CONCURRENCY, toDownload.length); i++) {
            results.push(runNext());
        }

        await Promise.all(results);
        setIsDownloading(false);
        refreshLibrary();
    };

    const deleteFile = async (file: LocalFile) => {
        if (!confirm(`Hapus ${file.filename}?`)) return;
        await fetch(`/api/quran/files?key=${mosqueKey}&edition=${file.edition}&filename=${file.filename}`, {
            method: 'DELETE',
        });
        refreshLibrary();
        // Reset download state
        setDownloadStates(prev => ({ ...prev, [file.surahNumber]: { status: 'idle' } }));
    };

    const addSelectedToPlaylist = () => {
        const tracks = localFiles
            .filter(f => selectedForPlaylist.has(f.url))
            .sort((a, b) => a.surahNumber - b.surahNumber)
            .map(f => ({
                id: `quran-${f.edition}-${f.surahNumber}`,
                title: `${String(f.surahNumber).padStart(3, '0')}. ${f.surahName}`,
                url: f.url,
            }));
        if (tracks.length === 0) return;
        onAddToPlaylist(tracks);
        setSelectedForPlaylist(new Set());
    };

    const filteredSurahs = surahs.filter(s =>
        s.englishName.toLowerCase().includes(filterText.toLowerCase()) ||
        String(s.number).includes(filterText)
    );

    const currentEdition = editions.find(e => e.identifier === selectedEdition);

    // Library: get unique editions from downloaded files, auto-select first
    const downloadedEditions = [...new Set(localFiles.map(f => f.edition))];
    const activeLibraryEdition = libraryEdition && downloadedEditions.includes(libraryEdition)
        ? libraryEdition
        : downloadedEditions[0] || selectedEdition;
    const editionFiles = localFiles.filter(f => f.edition === activeLibraryEdition);
    const totalSize = editionFiles.reduce((sum, f) => sum + f.size, 0);

    const statusIcon = (status?: DownloadStatus) => {
        if (status === 'done' || status === 'cached') return '✅';
        if (status === 'downloading') return '⏳';
        if (status === 'error') return '❌';
        return '';
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">🕌 Murrotal Al-Quran</h3>
                    <p className="text-xs text-slate-400">Download dari AlQuran Cloud CDN → simpan lokal</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'browse' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        📥 Browse & Download
                    </button>
                    <button
                        onClick={() => { setActiveTab('library'); refreshLibrary(); }}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        📚 Library ({localFiles.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <div className="animate-spin mr-3 text-xl">⏳</div>
                    Memuat data dari AlQuran Cloud...
                </div>
            ) : activeTab === 'browse' ? (
                <div className="flex flex-col gap-4">
                    {/* Reciter selector */}
                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Reciter / Qari</label>
                            <select
                                value={selectedEdition}
                                onChange={e => {
                                    setSelectedEdition(e.target.value);
                                    setSelectedSurahs(new Set());
                                    setDownloadStates({});
                                }}
                                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
                            >
                                {editions.filter(e => POPULAR_RECITERS.includes(e.identifier)).length > 0 && (
                                    <optgroup label="— Populer (Quran Lengkap) —">
                                        {editions.filter(e => POPULAR_RECITERS.includes(e.identifier)).map(e => (
                                            <option key={e.identifier} value={e.identifier}>
                                                {e.englishName} ({e.surahCount}/114)
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                <optgroup label="— Semua Reciter —">
                                    {editions.filter(e => !POPULAR_RECITERS.includes(e.identifier)).map(e => (
                                        <option key={e.identifier} value={e.identifier}>
                                            {e.englishName} ({e.surahCount}/114)
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            {currentEdition && currentEdition.surahCount < 114 && (
                                <p className="text-xs text-yellow-400 mt-1">
                                    ⚠️ Reciter ini hanya memiliki {currentEdition.surahCount} surah di CDN
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col justify-end gap-1">
                            <span className="text-xs text-slate-400">Bitrate</span>
                            <span className="bg-slate-700 text-emerald-400 font-mono font-bold px-3 py-2 rounded-lg text-sm border border-slate-600">128 kbps</span>
                        </div>
                    </div>

                    {/* Quick select */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-slate-400">Pilih cepat:</span>
                        <button onClick={selectAll} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">Semua (114)</button>
                        <button onClick={selectJuz30} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">Juz 30</button>
                        <button onClick={selectNone} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs">Reset</button>
                        <input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            placeholder="Cari surah..."
                            className="ml-auto px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 w-40"
                        />
                    </div>

                    {/* Surah list */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-72 overflow-y-auto pr-1">
                        {filteredSurahs.map(surah => {
                            const st = downloadStates[surah.number];
                            const isSelected = selectedSurahs.has(surah.number);
                            const isDone = st?.status === 'done' || st?.status === 'cached';
                            const isErr = st?.status === 'error';
                            const isLoading = st?.status === 'downloading';

                            return (
                                <button
                                    key={surah.number}
                                    onClick={() => !isDone && toggleSurah(surah.number)}
                                    disabled={isLoading}
                                    className={`
                                        flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all border
                                        ${isDone ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300 cursor-default' : ''}
                                        ${isErr ? 'bg-red-900/30 border-red-700/50 text-red-300' : ''}
                                        ${isLoading ? 'bg-blue-900/30 border-blue-700/50 text-blue-300 animate-pulse' : ''}
                                        ${!isDone && !isErr && !isLoading && isSelected ? 'bg-emerald-700/40 border-emerald-600 text-white' : ''}
                                        ${!isDone && !isErr && !isLoading && !isSelected ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500' : ''}
                                    `}
                                >
                                    <span className="text-[10px] font-mono text-slate-500 w-7 flex-shrink-0">{String(surah.number).padStart(3, '0')}</span>
                                    <span className="truncate font-medium">{surah.englishName}</span>
                                    <span className="ml-auto flex-shrink-0">{statusIcon(st?.status)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Download bar */}
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <span className="text-sm text-slate-300">
                            {selectedSurahs.size} surah dipilih
                            {Object.values(downloadStates).filter(s => s.status === 'done' || s.status === 'cached').length > 0 &&
                                ` · ${Object.values(downloadStates).filter(s => s.status === 'done' || s.status === 'cached').length} selesai`}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            {isDownloading && (
                                <span className="text-xs text-blue-400 animate-pulse">
                                    ⏳ {Object.values(downloadStates).filter(s => s.status === 'downloading').length} sedang download...
                                </span>
                            )}
                            <button
                                onClick={downloadSelected}
                                disabled={selectedSurahs.size === 0 || isDownloading}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all"
                            >
                                {isDownloading ? 'Downloading...' : `⬇️ Download ${selectedSurahs.size > 0 ? `(${selectedSurahs.size})` : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Library Tab */
                <div className="flex flex-col gap-4">
                    {/* Edition filter in library - only show editions that have files */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                        {downloadedEditions.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Belum ada file yang didownload</span>
                        ) : (
                            <select
                                value={activeLibraryEdition}
                                onChange={e => setLibraryEdition(e.target.value)}
                                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
                            >
                                {downloadedEditions.map(ed => {
                                    const meta = editions.find(e => e.identifier === ed);
                                    const count = localFiles.filter(f => f.edition === ed).length;
                                    return (
                                        <option key={ed} value={ed}>
                                            {meta?.englishName || ed} ({count} file)
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                        <span className="text-xs text-slate-400">
                            {editionFiles.length} file · {(totalSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => setSelectedForPlaylist(new Set(editionFiles.map(f => f.url)))}
                                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                            >
                                Pilih Semua
                            </button>
                            <button
                                onClick={() => setSelectedForPlaylist(new Set())}
                                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {editionFiles.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            Belum ada file untuk reciter ini.<br />
                            <button onClick={() => setActiveTab('browse')} className="text-emerald-400 hover:underline mt-2">
                                → Download sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                            {editionFiles.map(file => (
                                <div
                                    key={file.url}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer
                                        ${selectedForPlaylist.has(file.url) ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'}`}
                                    onClick={() => setSelectedForPlaylist(prev => {
                                        const next = new Set(prev);
                                        next.has(file.url) ? next.delete(file.url) : next.add(file.url);
                                        return next;
                                    })}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedForPlaylist.has(file.url)}
                                        readOnly
                                        className="accent-emerald-500"
                                    />
                                    <span className="text-[10px] font-mono text-slate-500 w-7">{String(file.surahNumber).padStart(3, '0')}</span>
                                    <span className="text-sm text-white font-medium flex-1 truncate">{file.surahName}</span>
                                    <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteFile(file); }}
                                        className="text-red-400/60 hover:text-red-400 text-xs px-1.5 py-0.5 rounded"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add to playlist */}
                    {selectedForPlaylist.size > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-900/20 rounded-xl border border-emerald-700/50">
                            <input
                                type="text"
                                value={playlistName}
                                onChange={e => setPlaylistName(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white"
                                placeholder="Nama playlist..."
                            />
                            <button
                                onClick={addSelectedToPlaylist}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm whitespace-nowrap"
                            >
                                ➕ Buat Playlist ({selectedForPlaylist.size})
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
