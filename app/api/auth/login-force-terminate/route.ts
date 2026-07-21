import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { submitPassword, fetchAndCacheAllData } from "@/lib/scrapers/login.scraper";
import { createSession } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const { username, password, sessionId } = await req.json();
        if (!username || !password) return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });

        const result = await submitPassword(sessionId || "", username, password, true);

        if (!result.success || !result.cookies) {
            return NextResponse.json({ success: false, error: result.error || "Login failed" }, { status: 401 });
        }

        const token = uuidv4();
        const regNo = result.regNo || username;

        await createSession(token, { regNo, name: result.name || "Student", cookies: result.cookies });

        fetchAndCacheAllData(result.cookies, regNo).catch((err) => { console.error("❌ Background fetch failed:", err.message); });

        return NextResponse.json({ success: true, data: { token, name: result.name || "Student", regNo, expiresIn: 172800 } });
    } catch {
        return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
    }
}