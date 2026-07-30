"use client";
import { useState, useEffect } from "react";
import { getToken, updateName, clearSession } from "@/lib/session";

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const CACHE_VERSION = "v6";

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

            // ✅ If empty — show expired cache
            if (Array.isArray(result) && result.length === 0) {
                const expiredCache = getFromCache();
                if (expiredCache && Array.isArray(expiredCache.data) && (expiredCache.data as any[]).length > 0) {
                    setData(expiredCache.data as T);
                }
                return;
            }

            setData(result as T);
            saveToCache(result as T);
        } catch (err: any) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";

            // ✅ Session expired — auto logout
            if (message.includes("Session expired") || message.includes("Unauthorized")) {
                console.warn("⚠️ Session expired — logging out");
                clearSession();
                window.location.href = '/login';
                return;
            }

            // ✅ Other errors — show expired cache
            const expiredCache = getFromCache();
            if (expiredCache && Array.isArray(expiredCache.data) && (expiredCache.data as any[]).length > 0) {
                setData(expiredCache.data as T);
            }

            if (!data) setError(message);
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
            if (Array.isArray(cached.data) && (cached.data as any[]).length === 0) {
                fetchFresh(true);
                return;
            }

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