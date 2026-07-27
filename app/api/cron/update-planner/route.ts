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
        console.log(`🪄 Using cookies updated at: ${cookieData.updated_at}`);

        // ✅ Step 3 — Scrape planner from SRM portal
        console.log("🔄 Scraping planner from SRM...");
        const htmls = await scrapePlanner(cookies);
        const planner = parsePlanner(htmls);
        console.log(`📅 Planner parsed: ${Object.keys(planner.map).length} days`);

        if (Object.keys(planner.map).length === 0) {
            return NextResponse.json({ error: "Planner parsing failed — empty result" }, { status: 500 });
        }

        // ✅ Step 4 — Update planner_cache (1 row, 1 write for ALL users)
        const { error: cacheError } = await supabase
            .from("planner_cache")
            .upsert({
                id: 1,
                planner_map: planner.map,
                semester: planner.semester,
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });

        if (cacheError) {
            return NextResponse.json({ error: cacheError.message }, { status: 500 });
        }

        console.log(`✅ Planner cache updated — ${Object.keys(planner.map).length} days`);

        return NextResponse.json({
            success: true,
            plannerDays: Object.keys(planner.map).length,
            semester: planner.semester,
        });
    } catch (error) {
        console.error("Update planner cron error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}