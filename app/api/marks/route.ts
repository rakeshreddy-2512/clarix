import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { scrapeAttendanceAndMarks } from "@/lib/scrapers/attendance.scraper";
import { parseMarks } from "@/lib/parsers/marks.parser";
import { parseAttendance } from "@/lib/parsers/attendance.parser";
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
        const cacheKey = `marks:${regNo}`;
        const hashKey = `marks:${regNo}:hash`;
        const cached = await getCachedData(cacheKey);

        if (cached) {
            (async () => {
                try {
                    const html = await scrapeAttendanceAndMarks(cookies);
                    const freshMarks = parseMarks(html);
                    const freshHash = hashData(freshMarks);
                    const cachedHash = await getCachedData<string>(hashKey);
                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshMarks, 86400);
                        await cacheData(hashKey, freshHash, 86400);
                        const freshAttendance = parseAttendance(html);
                        await cacheData(`attendance:${regNo}`, freshAttendance, 3000);
                        await cacheData(`attendance:${regNo}:hash`, hashData(freshAttendance), 3000);
                    }
                } catch (err) { console.error(`Background marks sync failed:`, err); }
            })();
            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const html = await scrapeAttendanceAndMarks(cookies);
            const marks = parseMarks(html);
            const hash = hashData(marks);
            await cacheData(cacheKey, marks, 900); // 15 min
            await cacheData(hashKey, hash, 900);
            return NextResponse.json({ success: true, data: marks, source: "fresh" });
        } catch {
            return NextResponse.json({ success: true, data: [], message: "Marks temporarily unavailable" });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch marks" }, { status: 500 });
    }
}