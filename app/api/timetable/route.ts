import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeTimetable } from "@/lib/scrapers/timetable.scraper";
import { parseTimetable } from "@/lib/parsers/timetable.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

function secondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo, cookies } = auth.session;
        const cacheKey = `timetable:${regNo}`;
        const hashKey = `timetable:${regNo}:hash`;
        const ttl = secondsUntilMidnight();
        const cached = await getCachedData(cacheKey);

        if (cached) {
            (async () => {
                try {
                    const html = await scrapeTimetable(cookies);
                    const freshResult = parseTimetable(html);
                    const freshHash = hashData(freshResult);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshResult, ttl);
                        await cacheData(hashKey, freshHash, ttl);
                    }
                } catch (err) { console.error(`Background timetable sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        const html = await scrapeTimetable(cookies);
        const result = parseTimetable(html);
        const hash = hashData(result);
        await cacheData(cacheKey, result, ttl);
        await cacheData(hashKey, hash, ttl);
        return NextResponse.json({ success: true, data: result, source: "fresh" });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 });
    }
}