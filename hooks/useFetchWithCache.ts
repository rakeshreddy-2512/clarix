"use client";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/session";

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

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
        return `clarix_${cacheKey}_${token}`;
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
        // Clear cache and fetch fresh
        try {
            localStorage.removeItem(getStorageKey());
        } catch { }
        fetchFresh(true);
    };

    useEffect(() => {
        const cached = getFromCache();

        if (cached) {
            // Show cached data instantly
            setData(cached.data);
            setLoading(false);

            // Check if cache is older than TTL
            const age = Date.now() - cached.timestamp;
            if (age > ttlMs) {
                // Fetch fresh in background silently
                fetchFresh(false);
            }
        } else {
            // No cache — fetch fresh with loading
            fetchFresh(true);
        }
    }, [cacheKey]);

    return { data, loading, error, refetch };
}