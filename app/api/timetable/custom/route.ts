import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { regNo } = auth.session;

        const { data, error } = await supabase
            .from("custom_timetable")
            .select("timetable_json, updated_at")
            .eq("reg_number", regNo)
            .single();

        if (error && error.code !== "PGRST116") {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data?.timetable_json || null });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch custom timetable" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { regNo } = auth.session;
        const { timetable } = await req.json();

        const { error } = await supabase
            .from("custom_timetable")
            .upsert({
                reg_number: regNo,
                timetable_json: timetable,
                updated_at: new Date().toISOString(),
            }, { onConflict: "reg_number" });

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to save custom timetable" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { regNo } = auth.session;

        const { error } = await supabase
            .from("custom_timetable")
            .delete()
            .eq("reg_number", regNo);

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to revert timetable" }, { status: 500 });
    }
}