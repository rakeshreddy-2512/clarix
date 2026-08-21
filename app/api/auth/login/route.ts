import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { submitPassword, fetchAndCacheAllData } from "@/lib/scrapers/login.scraper";
import { createSession, redis, getCachedData } from "@/lib/redis";
import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
    try {
        const { username, password, sessionId } = await req.json();
        if (!username || !password) return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });

        const normalizedUsername = username.toLowerCase().trim();
        const lockKey = `login:in_progress:${normalizedUsername}`;

        const existing = await redis.get(lockKey);
        if (existing) {
            const ttl = await redis.ttl(lockKey);
            return NextResponse.json({
                success: false,
                error: `Login already in progress. Please wait ${ttl} seconds and try again.`,
            }, { status: 429 });
        }   

        await redis.set(lockKey, "1", { ex: 15 });

        try {
            const result = await submitPassword(sessionId || "", username, password, false);

            if (result.sessionExceeded) {
                return NextResponse.json({ success: false, error: "SESSION_EXCEEDED", message: "Session limit reached" }, { status: 409 });
            }

            if (!result.success || !result.cookies) {
                const isDown = result.error?.includes("failed") || result.error?.includes("network") || result.error?.includes("timeout");
return NextResponse.json({ success: false, error: isDown ? "Academia is currently down. Please try again later." : result.error || "Invalid credentials" }, { status: 401 });
            }

            const token = uuidv4();
            const regNo = result.regNo || username.split("@")[0].toUpperCase();

            const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${regNo}`);
            const displayName = cachedProfile?.name || result.name || username.split("@")[0].toUpperCase();
            const displayRegNo = cachedProfile?.regNo || regNo;

            await createSession(token, {
                regNo: displayRegNo,
                name: displayName,
                cookies: result.cookies,
            });

            // ✅ Save encrypted cookies to Supabase for midnight planner cron
            const encryptedCookies = encrypt(result.cookies);
            (async () => {
                try {
                    await supabase.from("service_cookies").upsert({
                        id: 1,
                        cookies_encrypted: encryptedCookies,
                        updated_at: new Date().toISOString(),
                    });
                    console.log("✅ Cookies saved to Supabase");
                } catch (err: unknown) {
                    console.error("❌ Failed to save cookies to Supabase:", err);
                }
            })();

            // ✅ Fire background fetch
            fetchAndCacheAllData(result.cookies, displayRegNo).catch((err: unknown) => {
                console.error("❌ Background fetch failed:", err instanceof Error ? err.message : err);
            });

            return NextResponse.json({
                success: true,
                data: {
                    token,
                    name: displayName,
                    regNo: displayRegNo,
                    expiresIn: 172800,
                },
            });

        } finally {
            await redis.del(lockKey);
        }

    } catch {
        return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
    }
}