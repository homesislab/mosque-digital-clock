'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { fetchConfig, DEFAULT_CONFIG } from './constants';

// ─── In-memory cache ────────────────────────────────────────────────────
const CACHE_TTL_MS = 30_000; // 30-second cache TTL — matches poll interval

interface CacheEntry {
    data: MosqueConfig;
    fetchedAt: number; // timestamp
}

// Module-level cache shared across all hook instances (singleton)
const configCache: Map<string, CacheEntry> = new Map();

// Latest fetch promise per key to de-duplicate concurrent fetches
const inFlight: Map<string, Promise<MosqueConfig>> = new Map();

function isCacheValid(entry: CacheEntry | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

async function fetchConfigCached(key: string): Promise<MosqueConfig> {
    const cached = configCache.get(key);
    if (isCacheValid(cached)) {
        return cached!.data;
    }

    // Deduplicate concurrent requests for the same key
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fetchConfig().then(data => {
        if (data && data !== ('OFFLINE' as any) && data !== null) {
            configCache.set(key, { data, fetchedAt: Date.now() });
        }
        inFlight.delete(key);
        return data;
    }).catch(err => {
        inFlight.delete(key);
        throw err;
    });

    inFlight.set(key, promise);
    return promise;
}

/**
 * Force-invalidate the config cache for a specific key.
 * Call this after admin saves config to ensure next poll gets fresh data.
 */
export function invalidateConfigCache(key: string) {
    configCache.delete(key);
}

// ─── Hook ────────────────────────────────────────────────────────────────

interface UseConfigResult {
    config: MosqueConfig;
    isLoading: boolean;
    isOffline: boolean;
    lastUpdated: number | null;
    refresh: () => void;
}

/**
 * useConfig: Fetches and caches mosque config with automatic background refresh.
 *
 * - Cache TTL: 30 seconds (HTTP request fired only on stale cache)
 * - Poll interval: 5 seconds (cheap cache check)
 * - De-duplicates concurrent fetches
 * - Returns lastUpdated timestamp for display
 */
export function useConfig(mosqueKey: string | null): UseConfigResult {
    const [config, setConfig] = useState<MosqueConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize config from localStorage immediately on mount
    useEffect(() => {
        if (!mosqueKey) return;
        try {
            const cachedStr = localStorage.getItem(`offlineConfig_${mosqueKey}`);
            if (cachedStr) {
                const cachedConfig = JSON.parse(cachedStr);
                setConfig(cachedConfig);
                // We don't set isOffline=true here yet, we wait for the first network attempt
            }
        } catch (e) {
            console.warn('Failed to parse offline config from localStorage', e);
        }
    }, [mosqueKey]);

    const load = useCallback(async (forceRefresh = false) => {
        if (!mosqueKey) return;

        if (forceRefresh) {
            invalidateConfigCache(mosqueKey);
        }

        try {
            const data = await fetchConfigCached(mosqueKey);

            if ((data as any) === 'OFFLINE') {
                setIsOffline(true);
                return;
            }

            if (!data) {
                // Unauthorized — caller should handle logout
                return;
            }

            // Save to localStorage for offline usage
            try {
                localStorage.setItem(`offlineConfig_${mosqueKey}`, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to save offline config to localStorage', e);
            }

            setConfig(data);
            setIsOffline(false);
            setLastUpdated(Date.now());
        } catch (err) {
            setIsOffline(true);
            console.warn('[useConfig] Load failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [mosqueKey]);

    // Initial load + polling
    useEffect(() => {
        if (!mosqueKey) return;

        setIsLoading(true);
        load();

        intervalRef.current = setInterval(() => load(), 30_000); // poll every 30s (matches cache TTL)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [mosqueKey, load]);

    return {
        config,
        isLoading,
        isOffline,
        lastUpdated,
        refresh: () => load(true),
    };
}
