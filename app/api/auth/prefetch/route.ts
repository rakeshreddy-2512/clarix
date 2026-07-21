import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prefetchSession } from "@/lib/scrapers/login.scraper";

export async function POST(req: NextRequest) {
    try {
        const sessionId = uuidv4();
        await prefetchSession(sessionId);
        return NextResponse.json({ success: true, sessionId });
    } catch {
        return NextResponse.json({ success: false, error: "Prefetch failed" }, { status: 500 });
    }
}