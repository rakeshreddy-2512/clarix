function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("clarix_token");
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    const data = await response.json();

    // ✅ Only throw session expired on explicit 401
    if (response.status === 401) {
        throw new Error("Session expired");
    }
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
}

export async function prefetchApi(): Promise<string | null> {
    try {
        const response = await fetch("/api/auth/prefetch", { method: "POST", headers: { "Content-Type": "application/json" } });
        const data = await response.json();
        return data.sessionId || null;
    } catch { return null; }
}

export async function lookupApi(sessionId: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch("/api/auth/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, username }) });
        return await response.json();
    } catch { return { success: false, error: "Lookup failed" }; }
}

export async function loginApi(username: string, password: string, sessionId?: string | null): Promise<{ token: string; name: string; expiresIn: number }> {
    const fullUsername = username.trim().includes("@") ? username.trim() : `${username.trim()}@srmist.edu.in`;
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: fullUsername, password, sessionId }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    return data.data;
}

export async function loginForceTerminateApi(username: string, password: string, sessionId?: string | null): Promise<{ token: string; name: string; expiresIn: number }> {
    const fullUsername = username.trim().includes("@") ? username.trim() : `${username.trim()}@srmist.edu.in`;
    const response = await fetch("/api/auth/login-force-terminate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: fullUsername, password, sessionId }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    return data.data;
}

export async function logoutApi(): Promise<void> {
    await fetchWithAuth("/api/auth/logout", { method: "POST" });
}

export async function getAttendanceApi() {
    const data = await fetchWithAuth<{ success: boolean; data: unknown }>("/api/attendance");
    return data.data;
}

export async function getMarksApi() {
    const data = await fetchWithAuth<{ success: boolean; data: unknown }>("/api/marks");
    return data.data;
}

export async function getProfileApi() {
    const data = await fetchWithAuth<{ success: boolean; data: unknown }>("/api/profile");
    return data.data;
}

export async function getTimetableApi() {
    const data = await fetchWithAuth<{ success: boolean; data: unknown }>("/api/timetable");
    return data.data;
}

export async function getPlannerApi() {
    const data = await fetchWithAuth<{ success: boolean; data: unknown }>("/api/planner");
    return data.data;
}