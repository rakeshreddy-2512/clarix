import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeAttendanceAndMarks } from "@/lib/scrapers/attendance.scraper";
import { parseAttendance } from "@/lib/parsers/attendance.parser";
import { parseMarks } from "@/lib/parsers/marks.parser";
import { getCachedData, cacheData } from "@/lib/redis";
import crypto from "crypto";

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { regNo, cookies } = auth.session;
        const cacheKey = `attendance:${regNo}`;
        const hashKey = `attendance:${regNo}:hash`;
        const cached = await getCachedData(cacheKey);

        if (cached) {
            (async () => {
                try {
                    const html = await scrapeAttendanceAndMarks(cookies);
                    const freshAttendance = parseAttendance(html);
                    const freshHash = hashData(freshAttendance);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshAttendance, 3000);
                        await cacheData(hashKey, freshHash, 3000);
                        const freshMarks = parseMarks(html);
                        await cacheData(`marks:${regNo}`, freshMarks, 86400);
                        await cacheData(`marks:${regNo}:hash`, hashData(freshMarks), 86400);
                    }
                } catch (err) { console.error(`Background attendance sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const html = await scrapeAttendanceAndMarks(cookies);
            const attendance = parseAttendance(html);
            const hash = hashData(attendance);
            await cacheData(cacheKey, attendance, 3000);
            await cacheData(hashKey, hash, 3000);
            return NextResponse.json({ success: true, data: attendance, source: "fresh" });
        } catch {
            return NextResponse.json({ success: true, data: [], message: "Attendance temporarily unavailable" });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
    }
}