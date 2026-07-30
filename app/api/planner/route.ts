import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapePlanner } from "@/lib/scrapers/planner.scraper";
import { parsePlanner } from "@/lib/parsers/planner.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

async function getServiceCookies(): Promise<string | null> {
    try {
        const { data } = await supabase
            .from("service_cookies")
            .select("cookies_encrypted")
            .eq("id", 1)
            .single();
        if (data?.cookies_encrypted) return decrypt(data.cookies_encrypted);
        return null;
    } catch {
        return null;
    }
}

async function fetchFreshPlanner(cookies: string) {
    const htmls = await scrapePlanner(cookies);
    const planner = parsePlanner(htmls);
    return planner;
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const cacheKey = `planner:shared`;
        const hashKey = `planner:shared:hash`;
        const TTL = 86400; // 24 hours

        const cached = await getCachedData<any>(cacheKey);

        // ✅ Only use cache if it has actual data
        if (cached && Object.keys(cached.map || {}).length > 0) {
            (async () => {
                try {
                    const { cookies } = auth.session;
                    const freshPlanner = await fetchFreshPlanner(cookies);
                    if (Object.keys(freshPlanner.map || {}).length === 0) return;
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

        // ✅ Cache empty or 0 days — try user cookies first
        console.log("⚠️ Planner cache empty — fetching fresh...");
        try {
            const { cookies } = auth.session;
            const planner = await fetchFreshPlanner(cookies);
            if (Object.keys(planner.map || {}).length > 0) {
                await cacheData(cacheKey, planner, TTL);
                await cacheData(hashKey, hashData(planner), TTL);
                console.log(`✅ Planner loaded from user cookies — ${Object.keys(planner.map).length} days`);
                return NextResponse.json({ success: true, data: planner, source: "fresh" });
            }
        } catch (err: any) {
            if (err?.message !== "SESSION_EXPIRED") {
                console.error("Planner scrape with user cookies failed:", err);
            }
            console.log("⚠️ User cookies failed — trying service cookies...");
        }

        // ✅ User cookies failed — try service cookies from Supabase
        try {
            const serviceCookies = await getServiceCookies();
            if (serviceCookies) {
                const planner = await fetchFreshPlanner(serviceCookies);
                if (Object.keys(planner.map || {}).length > 0) {
                    await cacheData(cacheKey, planner, TTL);
                    await cacheData(hashKey, hashData(planner), TTL);
                    console.log(`✅ Planner loaded from service cookies — ${Object.keys(planner.map).length} days`);
                    return NextResponse.json({ success: true, data: planner, source: "service" });
                }
            }
        } catch (err: any) {
            console.error("Planner scrape with service cookies failed:", err);
        }

        return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });

    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch planner" }, { status: 500 });
    }
}