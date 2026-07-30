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

        // ✅ Shared cache — same planner for ALL users
        const cacheKey = `planner:shared`;
        const hashKey = `planner:shared:hash`;
        const TTL = 86400; // 24 hours

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
                        await cacheData(cacheKey, freshPlanner, TTL);
                        await cacheData(hashKey, freshHash, TTL);
                    }
                } catch (err: any) {
                    if (err?.message === "SESSION_EXPIRED") {
                        console.log("⚠️ Session expired during background planner sync");
                    } else {
                        console.error(`Background planner sync failed:`, err);
                    }
                }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const { cookies } = auth.session;
            const htmls = await scrapePlanner(cookies);
            const planner = parsePlanner(htmls);
            const hash = hashData(planner);
            await cacheData(cacheKey, planner, TTL);
            await cacheData(hashKey, hash, TTL);
            return NextResponse.json({ success: true, data: planner, source: "fresh" });
        } catch (err: any) {
            if (err?.message === "SESSION_EXPIRED") {
                console.log("⚠️ Session expired — returning 401");
                return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
            }
            return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });
    }
}