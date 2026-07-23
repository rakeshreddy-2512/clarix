import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getCachedData } from "@/lib/redis";

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

        const { regNo } = auth.session;
        const body = await req.json();
        const { notifications_on, remind_1hr, remind_30min, remind_15min } = body;

        const timetableData = await getCachedData(`timetable:${regNo}`);
        const plannerData = await getCachedData(`planner:shared`);

        const timetableJson = {
            timetable: (timetableData as any)?.timetable || timetableData,
            batch: (timetableData as any)?.batch || 1,
            plannerMap: (plannerData as any)?.map || {},
        };

        // ✅ When toggling OFF — clear telegram_chat_id so user must reconnect
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
            updateData.telegram_chat_id = null; // ✅ disconnect Telegram
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