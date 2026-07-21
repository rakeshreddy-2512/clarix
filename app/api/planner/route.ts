import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapePlanner } from "@/lib/scrapers/planner.scraper";
import { parsePlanner } from "@/lib/parsers/planner.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const cacheKey = `planner:shared`;
        const hashKey = `planner:shared:hash`;
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
                        await cacheData(cacheKey, freshPlanner, 86400);
                        await cacheData(hashKey, freshHash, 86400);
                    }
                } catch (err) { console.error(`Background planner sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        const { cookies } = auth.session;
        const htmls = await scrapePlanner(cookies);
        const planner = parsePlanner(htmls);
        const hash = hashData(planner);
        await cacheData(cacheKey, planner, 900); // 15 min
        await cacheData(hashKey, hash, 900);
        return NextResponse.json({ success: true, data: planner, source: "fresh" });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });
    }
}