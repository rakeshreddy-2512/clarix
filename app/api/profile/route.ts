import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeProfile } from "@/lib/scrapers/profile.scraper";
import { parseProfile } from "@/lib/parsers/profile.parser";

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { cookies } = auth.session;

        // ✅ No Redis cache — profile stored in localStorage only
        // localStorage TTL is 1 month so this endpoint is rarely called
        const html = await scrapeProfile(cookies);
        const profile = parseProfile(html);
        return NextResponse.json({ success: true, data: profile, source: "fresh" });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}