import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getCachedData, cacheData } from "@/lib/redis";
import { scrapePlanner } from "@/lib/scrapers/planner.scraper";
import { parsePlanner } from "@/lib/parsers/planner.parser";

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { regNo } = auth.session;
        const { data, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("reg_number", regNo)
            .single();
        if (error && error.code !== "PGRST116") {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: data || null });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo, cookies } = auth.session;
        const body = await req.json();
        const { notifications_on, remind_1hr, remind_30min, remind_15min } = body;

        // Get timetable from Redis
        const timetableData = await getCachedData(`timetable:${regNo}`);

        // ✅ Get planner from Redis first
        let plannerMap: Record<string, any> = {};
        const plannerData = await getCachedData(`planner:shared`);

        if (plannerData && Object.keys((plannerData as any)?.map || {}).length > 0) {
            // Redis has planner
            plannerMap = (plannerData as any).map;
            console.log(`✅ Planner from Redis: ${Object.keys(plannerMap).length} days`);
        } else {
            // ✅ Redis empty — scrape planner directly from SRM
            console.log(`⚠️ Planner not in Redis — scraping directly...`);
            try {
                const htmls = await scrapePlanner(cookies);
                const freshPlanner = parsePlanner(htmls);
                plannerMap = freshPlanner.map;

                // Save to Redis for future use
                const secondsUntilMidnight = () => {
                    const now = new Date();
                    const midnight = new Date();
                    midnight.setHours(24, 0, 0, 0);
                    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
                };
                await cacheData(`planner:shared`, freshPlanner, secondsUntilMidnight());
                console.log(`✅ Planner scraped and cached: ${Object.keys(plannerMap).length} days`);
            } catch (err) {
                console.error("Failed to scrape planner:", err);
            }
        }

        const timetableJson = {
            timetable: (timetableData as any)?.timetable || timetableData,
            batch: (timetableData as any)?.batch || 1,
            plannerMap,
        };

        const updateData: any = {
            reg_number: regNo,
            notifications_on,
            remind_1hr: remind_1hr ?? true,
            remind_30min: remind_30min ?? true,
            remind_15min: remind_15min ?? true,
            timetable_json: timetableJson,
            updated_at: new Date().toISOString(),
        };

        if (!notifications_on) {
            updateData.telegram_chat_id = null;
        }

        const { error } = await supabase
            .from("user_notifications")
            .upsert(updateData, { onConflict: "reg_number" });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 });
    }
}