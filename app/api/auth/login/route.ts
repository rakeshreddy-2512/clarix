import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { submitPassword, fetchAndCacheAllData } from "@/lib/scrapers/login.scraper";
import { createSession, redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const { username, password, sessionId } = await req.json();
        if (!username || !password) return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });

        // ✅ Rate limiting — prevent double clicks and simultaneous logins
        const normalizedUsername = username.toLowerCase().trim();
        const lockKey = `login:in_progress:${normalizedUsername}`;

        const existing = await redis.get(lockKey);
        if (existing) {
            return NextResponse.json({
                success: false,
                error: "Login already in progress. Please wait a moment and try again.",
            }, { status: 429 });
        }

        // Set lock with 15s TTL
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
            const regNo = result.regNo || username;

            await createSession(token, { regNo, name: result.name || "Student", cookies: result.cookies });

            // ✅ Wait for ALL data before responding
            await fetchAndCacheAllData(result.cookies, regNo);

            return NextResponse.json({ success: true, data: { token, name: result.name || "Student", regNo, expiresIn: 172800 } });

        } finally {
            // ✅ Always delete lock when done (success or failure)
            await redis.del(lockKey);
        }

    } catch {
        return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
    }
}