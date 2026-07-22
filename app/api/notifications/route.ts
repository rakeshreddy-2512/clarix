import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getCachedData } from "@/lib/redis";

// GET — fetch current notification settings
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
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// POST — update notification preferences + save timetable
export async function POST(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo } = auth.session;
        const body = await req.json();
        const { notifications_on, remind_1hr, remind_30min, remind_15min } = body;

        // Get timetable from Redis to save in Supabase
        const timetableData = await getCachedData(`timetable:${regNo}`);

        const { error } = await supabase
            .from("user_notifications")
            .upsert({
                reg_number: regNo,
                notifications_on,
                remind_1hr: remind_1hr ?? true,
                remind_30min: remind_30min ?? true,
                remind_15min: remind_15min ?? true,
                timetable_json: timetableData || null,
                updated_at: new Date().toISOString(),
            }, { onConflict: "reg_number" });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update notifications" }, { status: 500 });
    }
}