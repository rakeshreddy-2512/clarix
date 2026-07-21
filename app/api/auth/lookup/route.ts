import { NextRequest, NextResponse } from "next/server";
import { lookupUser } from "@/lib/scrapers/login.scraper";

export async function POST(req: NextRequest) {
    try {
        const { sessionId, username } = await req.json();
        if (!sessionId || !username) return NextResponse.json({ success: false, error: "sessionId and username required" }, { status: 400 });
        const result = await lookupUser(sessionId, username);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch {
        return NextResponse.json({ success: false, error: "Lookup failed" }, { status: 500 });
    }
}