import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";
import { scrapePlanner } from "@/lib/scrapers/planner.scraper";
import { parsePlanner } from "@/lib/parsers/planner.parser";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // ✅ Step 1 — Read encrypted cookies from Supabase
        const { data: cookieData, error: cookieError } = await supabase
            .from("service_cookies")
            .select("cookies_encrypted, updated_at")
            .eq("id", 1)
            .single();

        if (cookieError || !cookieData) {
            return NextResponse.json({ error: "No cookies available — no user has logged in yet" }, { status: 400 });
        }

        // ✅ Step 2 — Decrypt cookies
        const cookies = decrypt(cookieData.cookies_encrypted);
        console.log(`🍪 Using cookies updated at: ${cookieData.updated_at}`);

        // ✅ Step 3 — Scrape planner from SRM portal
        console.log("🔄 Scraping planner from SRM...");
        const htmls = await scrapePlanner(cookies);
        const planner = parsePlanner(htmls);
        console.log(`📅 Planner parsed: ${Object.keys(planner.map).length} days`);

        if (Object.keys(planner.map).length === 0) {
            return NextResponse.json({ error: "Planner parsing failed — empty result" }, { status: 500 });
        }

        // ✅ Step 4 — Update plannerMap for ALL users with notifications enabled
        const { data: users, error: usersError } = await supabase
            .from("user_notifications")
            .select("reg_number, timetable_json")
            .eq("notifications_on", true)
            .not("telegram_chat_id", "is", null);

        if (usersError) {
            return NextResponse.json({ error: usersError.message }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ success: true, message: "No users to update" });
        }

        // ✅ Step 5 — Update each user's plannerMap
        let updated = 0;
        for (const user of users) {
            const updatedJson = {
                ...user.timetable_json,
                plannerMap: planner.map,
            };

            await supabase
                .from("user_notifications")
                .update({
                    timetable_json: updatedJson,
                    updated_at: new Date().toISOString(),
                })
                .eq("reg_number", user.reg_number);

            updated++;
        }

        console.log(`✅ Updated planner for ${updated} users`);
        return NextResponse.json({
            success: true,
            updated,
            plannerDays: Object.keys(planner.map).length,
            semester: planner.semester,
        });

    } catch (error) {
        console.error("Update planner cron error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}