import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeProfile } from "@/lib/scrapers/profile.scraper";
import { parseProfile } from "@/lib/parsers/profile.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo, cookies } = auth.session;
        const cacheKey = `profile:${regNo}`;
        const hashKey = `profile:${regNo}:hash`;

        // ✅ Check cache first
        const cached = await getCachedData(cacheKey);
        if (cached) {
            // Background refresh
            (async () => {
                try {
                    const html = await scrapeProfile(cookies);
                    const freshProfile = parseProfile(html);
                    const freshHash = hashData(freshProfile);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshProfile, 2592000);
                        await cacheData(hashKey, freshHash, 2592000);
                    }
                } catch (err) {
                    console.error("Background profile sync failed:", err);
                }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        // No cache — fetch fresh
        try {
            const html = await scrapeProfile(cookies);
            const profile = parseProfile(html);
            const hash = hashData(profile);
            await cacheData(cacheKey, profile, 2592000);
            await cacheData(hashKey, hash, 2592000);
            return NextResponse.json({ success: true, data: profile, source: "fresh" });
        } catch (err) {
            console.error("Profile fetch failed:", err);
            // Return empty profile instead of 500
            return NextResponse.json({
                success: true,
                data: {
                    name: "", regNo, program: "", department: "",
                    semester: "", batch: "", section: "", email: ""
                },
                source: "empty"
            });
        }
    } catch (err) {
        console.error("Profile route error:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}