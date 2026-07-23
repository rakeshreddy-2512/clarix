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
        const TTL = 120;

        const cached = await getCachedData(cacheKey);
        if (cached) {
            (async () => {
                try {
                    const html = await scrapeAttendanceAndMarks(cookies);
                    const freshAttendance = parseAttendance(html);

                    // ✅ Never overwrite cache with empty data
                    if (freshAttendance.length === 0) {
                        console.log("⚠️ Fresh attendance is empty — keeping cached data");
                        return;
                    }

                    const freshHash = hashData(freshAttendance);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshAttendance, TTL);
                        await cacheData(hashKey, freshHash, TTL);
                        const freshMarks = parseMarks(html);

                        // ✅ Never overwrite marks cache with empty data
                        if (freshMarks.length > 0) {
                            await cacheData(`marks:${regNo}`, freshMarks, TTL);
                            await cacheData(`marks:${regNo}:hash`, hashData(freshMarks), TTL);
                        }
                    }
                } catch (err) { console.error(`Background attendance sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const html = await scrapeAttendanceAndMarks(cookies);
            const attendance = parseAttendance(html);
            const hash = hashData(attendance);

            // ✅ Only cache if data is not empty
            if (attendance.length > 0) {
                await cacheData(cacheKey, attendance, TTL);
                await cacheData(hashKey, hash, TTL);
            }

            return NextResponse.json({ success: true, data: attendance, source: "fresh" });
        } catch {
            return NextResponse.json({ success: true, data: [], message: "Attendance temporarily unavailable" });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
    }
}