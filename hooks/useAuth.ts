"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSession, getToken, getName, clearSession, isLoggedIn } from "@/lib/session";
import { loginApi, loginForceTerminateApi, logoutApi, prefetchApi, lookupApi } from "@/lib/api";

let globalPrefetchDone = false;
let globalSessionId: string | null = null;
let globalLookupDone = false;

export function useAuth() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sessionExceeded, setSessionExceeded] = useState(false);
    const [pendingCredentials, setPendingCredentials] = useState<{ username: string; password: string } | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        setAuthenticated(isLoggedIn());
        setName(getName());
        const handleSessionUpdate = () => { setName(getName()); };
        window.addEventListener("session-updated", handleSessionUpdate);
        return () => window.removeEventListener("session-updated", handleSessionUpdate);
    }, []);

    async function prefetch() {
        if (globalPrefetchDone) { console.log("⏭️ Prefetch already done, skipping"); return; }
        globalPrefetchDone = true;
        console.log("🔄 Prefetching SRM session...");
        const sessionId = await prefetchApi();
        if (sessionId) {
            globalSessionId = sessionId;
            console.log("✅ Prefetch done, sessionId:", sessionId);
        } else {
            globalPrefetchDone = false;
        }
    }

    async function lookup(username: string) {
        if (globalLookupDone) return;
        if (!username) return;
        globalLookupDone = true;
        const sessionId = globalSessionId;
        if (!sessionId) { console.log("⚠️ No sessionId yet, skipping lookup"); globalLookupDone = false; return; }
        console.log("🔍 Looking up user:", username);
        const result = await lookupApi(sessionId, username);
        if (!result.success) {
            console.log("⚠️ Lookup failed:", result.error);
            globalSessionId = null;
            globalLookupDone = false;
        } else {
            console.log("✅ Lookup done");
        }
    }

    async function login(username: string, password: string, onSuccess?: (username: string) => boolean) {
        setLoading(true);
        setError("");
        setSessionExceeded(false);
        try {
            const result = await loginApi(username, password, globalSessionId);
            if (result.token) {
                saveSession(result.token, result.name);
                setAuthenticated(true);
                setName(result.name);
                globalPrefetchDone = false;
                globalSessionId = null;
                globalLookupDone = false;
                // ✅ Check onboarding before redirect
                const shouldWait = onSuccess?.(username);
                if (!shouldWait) router.push("/attendance");
            } else {
                setError("Login failed — no token received");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            if (message === "SESSION_EXCEEDED") {
                setSessionExceeded(true);
                setPendingCredentials({ username, password });
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function loginWithForceTerminate(onSuccess?: (username: string) => boolean) {
        if (!pendingCredentials) return;
        setLoading(true);
        setError("");
        setSessionExceeded(false);
        try {
            const result = await loginForceTerminateApi(
                pendingCredentials.username,
                pendingCredentials.password,
                globalSessionId
            );
            if (result.token) {
                saveSession(result.token, result.name);
                setAuthenticated(true);
                setName(result.name);
                globalPrefetchDone = false;
                globalSessionId = null;
                globalLookupDone = false;
                // ✅ Check onboarding before redirect
                const shouldWait = onSuccess?.(pendingCredentials.username);
                if (!shouldWait) router.push("/attendance");
            } else {
                setError("Login failed — no token received");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
        } finally {
            setLoading(false);
            setPendingCredentials(null);
        }
    }

    function cancelSessionExceeded() {
        setSessionExceeded(false);
        setPendingCredentials(null);
        setLoading(false);
    }

    async function logout() {
        try { await logoutApi(); } catch { }
        finally {
            clearSession();
            setAuthenticated(false);
            setName(null);
            globalPrefetchDone = false;
            globalSessionId = null;
            globalLookupDone = false;
            router.push("/login");
        }
    }

    return {
        login, loginWithForceTerminate, cancelSessionExceeded,
        logout, prefetch, lookup,
        loading, error, sessionExceeded,
        name, authenticated, token: getToken(),
    };
}