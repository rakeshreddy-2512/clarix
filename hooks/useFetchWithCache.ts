"use client";
import { useState, useEffect } from "react";
import { getToken, updateName, clearSession } from "@/lib/session";

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const CACHE_VERSION = "v9";

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

    // ✅ Check if data is empty — arrays or planner object
    const isEmpty = (data: unknown): boolean => {
        if (Array.isArray(data) && data.length === 0) return true;
        // ✅ Only check planner object — NOT arrays (arrays have .map method too)
        if (!Array.isArray(data) && data && typeof data === 'object' && 'map' in data) {
            const map = (data as any).map;
            if (!map || Object.keys(map).length === 0) return true;
        }
        return false;
    };

    const getFromCache = (): { data: T; timestamp: number } | null => {
        try {
            const stored = localStorage.getItem(getStorageKey());
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            if (isEmpty(parsed.data)) return null;
            return parsed;
        } catch {
            return null;
        }
    };

    const saveToCache = (data: T) => {
        try {
            if (isEmpty(data)) return;

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

            if (isEmpty(result)) {
                const expiredCache = getFromCache();
                if (expiredCache && !isEmpty(expiredCache.data)) {
                    setData(expiredCache.data as T);
                }
                return;
            }

            setData(result as T);
            saveToCache(result as T);
        } catch (err: any) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";

            // ✅ Only logout on explicit "Session expired" (from 401 status)
            if (message === "Session expired") {
                console.warn("⚠️ Session expired — logging out");
                clearSession();
                window.location.href = '/login';
                return;
            }

            // ✅ Other errors — show expired cache
            const expiredCache = getFromCache();
            if (expiredCache && !isEmpty(expiredCache.data)) {
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