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
        const TTL = 3600; // ✅ 1 hour

        const cached = await getCachedData(cacheKey);
        if (cached) {
            // ✅ Return cached data immediately, sync in background
            (async () => {
                try {
                    const html = await scrapeAttendanceAndMarks(cookies);
                    const freshMarks = parseMarks(html);

                    if (freshMarks.length === 0) {
                        console.log("⚠️ Fresh marks is empty — keeping cached data");
                        return;
                    }

                    const freshHash = hashData(freshMarks);
                    const cachedHash = await getCachedData<string>(hashKey);

                    if (freshHash !== cachedHash) {
                        await cacheData(cacheKey, freshMarks, TTL);
                        await cacheData(hashKey, freshHash, TTL);
                        const freshAttendance = parseAttendance(html);
                        if (freshAttendance.length > 0) {
                            await cacheData(`attendance:${regNo}`, freshAttendance, TTL);
                            await cacheData(`attendance:${regNo}:hash`, hashData(freshAttendance), TTL);
                        }
                    }
                } catch (err) { console.error(`Background marks sync failed:`, err); }
            })();

            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            let marks: any[] = [];

            for (let attempt = 1; attempt <= 2; attempt++) {
                const html = await scrapeAttendanceAndMarks(cookies);
                marks = parseMarks(html);
                if (marks.length > 0) break;
                console.log(`⚠️ Marks empty — attempt ${attempt}/2`);
            }

            if (marks.length > 0) {
                await cacheData(cacheKey, marks, TTL);
                await cacheData(hashKey, hashData(marks), TTL);
                return NextResponse.json({ success: true, data: marks, source: "fresh" });
            }

            return NextResponse.json({
                success: false,
                error: "SRM Academia is slow. Please try again.",
            }, { status: 503 });

        } catch {
            return NextResponse.json({ success: true, data: [], message: "Marks temporarily unavailable" });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch marks" }, { status: 500 });
    }
}