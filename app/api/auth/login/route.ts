import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { submitPassword, fetchAndCacheAllData } from "@/lib/scrapers/login.scraper";
import { createSession, redis, getCachedData } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const { username, password, sessionId } = await req.json();
        if (!username || !password) return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });

        // ✅ Rate limiting — 15s lock per username
        const normalizedUsername = username.toLowerCase().trim();
        const lockKey = `login:in_progress:${normalizedUsername}`;

        const existing = await redis.get(lockKey);
        if (existing) {
            return NextResponse.json({
                success: false,
                error: "Login already in progress. Please wait a moment and try again.",
            }, { status: 429 });
        }

        await redis.set(lockKey, "1", { ex: 15 });

        try {
            const result = await submitPassword(sessionId || "", username, password, false);

            if (result.sessionExceeded) {
                return NextResponse.json({ success: false, error: "SESSION_EXCEEDED", message: "Session limit reached" }, { status: 409 });
            }

            if (!result.success || !result.cookies) {
                return NextResponse.json({ success: false, error: result.error || "Invalid credentials" }, { status: 401 });
            }

            const token = uuidv4();
            const regNo = result.regNo || username.split("@")[0].toUpperCase();

            // ✅ Check if we already have cached profile (repeat login)
            const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${regNo}`);
            const displayName = cachedProfile?.name || result.name || username.split("@")[0].toUpperCase();
            const displayRegNo = cachedProfile?.regNo || regNo;

            await createSession(token, {
                regNo: displayRegNo,
                name: displayName,
                cookies: result.cookies,
            });

            // ✅ Fire background fetch — don't await
            // User navigates to dashboard while data loads in background
            fetchAndCacheAllData(result.cookies, displayRegNo).catch((err) => {
                console.error("❌ Background fetch failed:", err.message);
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