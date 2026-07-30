import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("Authorization");
    if (auth !== "Bearer clarix-cron-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await redis.del("planner:shared");
    await redis.del("planner:shared:hash");
    return NextResponse.json({ success: true, message: "Planner cache cleared" });
}