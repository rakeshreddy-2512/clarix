"use client";
import { useState, useEffect } from "react";
import { getToken, updateName } from "@/lib/session";

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// ✅ Increment this when parsers/scrapers change to invalidate old cache
const CACHE_VERSION = "v3";

export function useFetchWithCache<T>(
    fetchFn: () => Promise<T>,
    cacheKey: string,
    ttlMs: number = 10000
): FetchState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getStorageKey = () => {
        const token = getToken();
        return `clarix_${CACHE_VERSION}_${cacheKey}_${token}`;
    };

    const getFromCache = (): { data: T; timestamp: number } | null => {
        try {
            const stored = localStorage.getItem(getStorageKey());
            if (!stored) return null;
            return JSON.parse(stored);
        } catch {
            return null;
        }
    };

    const saveToCache = (data: T) => {
        try {
            localStorage.setItem(getStorageKey(), JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            // ✅ If this is profile data, update the name in session
            if (cacheKey === "profile" && data && (data as any).name) {
                updateName((data as any).name);
                window.dispatchEvent(new Event("session-updated"));
            }
        } catch {
            // localStorage might be full
        }
    };

    const fetchFresh = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result as T);
            saveToCache(result as T);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            setError(message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const refetch = () => {
        try {
            localStorage.removeItem(getStorageKey());
        } catch { }
        fetchFresh(true);
    };

    useEffect(() => {
        const cached = getFromCache();

        if (cached) {
            setData(cached.data);
            setLoading(false);

            const age = Date.now() - cached.timestamp;
            if (age > ttlMs) {
                fetchFresh(false);
            }
        } else {
            fetchFresh(true);
        }
    }, [cacheKey]);

    return { data, loading, error, refetch };
}