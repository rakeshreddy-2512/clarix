const TOKEN_KEY = "trackemia_token";
const NAME_KEY = "trackemia_name";
const EXPIRY_KEY = "trackemia_expiry";

export function saveSession(token: string, name: string): void {
    if (typeof window === "undefined") return;
    const expiry = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry)) {
        clearSession();
        return null;
    }
    return localStorage.getItem(TOKEN_KEY);
}

export function getName(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(NAME_KEY);
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(EXPIRY_KEY);
}