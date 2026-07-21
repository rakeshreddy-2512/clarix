import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapePlanner } from "@/lib/scrapers/planner.scraper";
import { parsePlanner } from "@/lib/parsers/planner.parser";
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

        // ✅ Shared cache — same planner for ALL users
        const cacheKey = `planner:shared`;
        const hashKey = `planner:shared:hash`;
        const ttl = secondsUntilMidnight();
        const cached = await getCachedData(cacheKey);

        if (cached) {
            (async () => {
                try {
                    const { cookies } = auth.session;
                    const htmls = await scrapePlanner(cookies);
                    const freshPlanner = parsePlanner(htmls);
                    const freshHash = hashData(freshPlanner);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        console.log(`🔄 Planner changed, updating shared cache...`);
                        await cacheData(cacheKey, freshPlanner, ttl);
                        await cacheData(hashKey, freshHash, ttl);
                    }
                } catch (err) { console.error(`Background planner sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        const { cookies } = auth.session;
        const htmls = await scrapePlanner(cookies);
        const planner = parsePlanner(htmls);
        const hash = hashData(planner);
        await cacheData(cacheKey, planner, ttl);
        await cacheData(hashKey, hash, ttl);
        return NextResponse.json({ success: true, data: planner, source: "fresh" });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });
    }
}