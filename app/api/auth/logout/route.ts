import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/redis";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (auth?.token) await deleteSession(auth.token);
        return NextResponse.json({ success: true, data: { message: "Logged out successfully" } });
    } catch {
        return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 });
    }
}