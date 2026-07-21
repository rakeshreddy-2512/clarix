import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SESSION_EXPIRY = 172800;

export async function createSession(token: string, data: { regNo: string; name: string; cookies: string }): Promise<void> {
    await redis.set(`session:${token}`, JSON.stringify(data), { ex: SESSION_EXPIRY });
}

export async function getSession(token: string): Promise<{ regNo: string; name: string; cookies: string } | null> {
    const data = await redis.get<string>(`session:${token}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
}

export async function deleteSession(token: string): Promise<void> {
    await redis.del(`session:${token}`);
}

export async function cacheData(key: string, data: unknown, expiry: number = 1800): Promise<void> {
    const value = typeof data === "string" ? data : JSON.stringify(data);
    await redis.set(`cache:${key}`, value, { ex: expiry });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
    const data = await redis.get<string>(`cache:${key}`);
    if (!data) return null;
    if (typeof data !== "string") return data as T;
    try {
        return JSON.parse(data) as T;
    } catch {
        return data as unknown as T;
    }
}

export async function clearCache(key: string): Promise<void> {
    await redis.del(`cache:${key}`);
}
