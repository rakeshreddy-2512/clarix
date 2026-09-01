import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeTimetable } from "@/lib/scrapers/timetable.scraper";
import { parseTimetable } from "@/lib/parsers/timetable.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo, cookies } = auth.session;
        const cacheKey = `timetable:${regNo}`;
        const hashKey = `timetable:${regNo}:hash`;
        const TTL = 3600;

        // Check for custom timetable in Supabase
        const { data: customTimetable } = await supabase
            .from("custom_timetable")
            .select("timetable_json")
            .eq("reg_number", regNo)
            .single();

        // If custom timetable exists, return it directly
        if (customTimetable?.timetable_json) {
            return NextResponse.json({ success: true, data: { timetable: customTimetable.timetable_json, batch: 1, section: "" }, source: "custom" });
        }

        const cached = await getCachedData(cacheKey);
        if (cached) {
            (async () => {
                try {
                    const html = await scrapeTimetable(cookies);
                    const freshResult = parseTimetable(html);
                    const freshHash = hashData(freshResult);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshResult, TTL);
                        await cacheData(hashKey, freshHash, TTL);
                    }
                } catch (err: any) {
                    if (err?.message === "SESSION_EXPIRED") {
                        console.log("⚠️ Session expired during background timetable sync");
                    } else {
                        console.error(`Background timetable sync failed:`, err);
                    }
                }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const html = await scrapeTimetable(cookies);
            const result = parseTimetable(html);
            const hash = hashData(result);
            await cacheData(cacheKey, result, TTL);
            await cacheData(hashKey, hash, TTL);
            return NextResponse.json({ success: true, data: result, source: "fresh" });
        } catch (err: any) {
            if (err?.message === "SESSION_EXPIRED") {
                console.log("⚠️ Session expired — returning 401");
                return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
            }
            return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 });
    }
}