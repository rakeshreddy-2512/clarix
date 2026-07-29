"use client";
import { useState, useEffect, useRef } from "react";
import { getToken, updateName } from "@/lib/session";

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const CACHE_VERSION = "v5";

export function useFetchWithCache<T>(
    fetchFn: () => Promise<T>,
    cacheKey: string,
    ttlMs: number = 10000
): FetchState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const retryCount = useRef(0);

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
            if (Array.isArray(data) && data.length === 0) return;

            localStorage.setItem(getStorageKey(), JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            if (cacheKey === "profile" && data && (data as any).name) {
                updateName((data as any).name);
                window.dispatchEvent(new Event("session-updated"));
            }
        } catch { }
    };

    const fetchFresh = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();

            // ✅ If result is empty array — retry after 3 seconds (max 3 retries)
            if (Array.isArray(result) && result.length === 0) {
                console.warn("⚠️ Empty result — retrying in 3 seconds...");
                if (showLoading) setLoading(false);
                if (retryCount.current < 3) {
                    retryCount.current += 1;
                    setTimeout(() => fetchFresh(showLoading), 3000);
                }
                return;
            }

            retryCount.current = 0;
            setData(result as T);
            saveToCache(result as T);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            if (!data) setError(message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const refetch = () => {
        try {
            localStorage.removeItem(getStorageKey());
        } catch { }
        retryCount.current = 0;
        fetchFresh(true);
    };

    useEffect(() => {
        const cached = getFromCache();

        if (cached) {
            if (Array.isArray(cached.data) && cached.data.length === 0) {
                fetchFresh(true);
                return;
            }

            setData(cached.data);
            setLoading(false);

            const age = Date.now() - cached.timestamp;
            if (age > ttlMs) {
                // ✅ Auto re-fetch after 3 seconds to get fresh data silently
                setTimeout(() => fetchFresh(false), 3000);
            }
        } else {
            fetchFresh(true);
        }
    }, [cacheKey]);

    return { data, loading, error, refetch };
}