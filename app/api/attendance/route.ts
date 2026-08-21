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
        const TTL = 0;

        const cached = await getCachedData(cacheKey);
        if (cached) {
            (async () => {
                try {
                    const html = await scrapeAttendanceAndMarks(cookies);
                    const freshAttendance = parseAttendance(html);
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
                        if (freshMarks.length > 0) {
                            await cacheData(`marks:${regNo}`, freshMarks, TTL);
                            await cacheData(`marks:${regNo}:hash`, hashData(freshMarks), TTL);
                        }
                    }
                } catch (err: any) {
                    if (err?.message === "SESSION_EXPIRED") {
                        console.log("⚠️ Session expired during background sync");
                    } else {
                        console.error(`Background attendance sync failed:`, err);
                    }
                }
            })();

            return NextResponse.json({ success: true, data: cached, source: "cache" });
        }

        try {
            const html = await scrapeAttendanceAndMarks(cookies);
            const attendance = parseAttendance(html);

            if (attendance.length > 0) {
                await cacheData(cacheKey, attendance, TTL);
                await cacheData(hashKey, hashData(attendance), TTL);
                return NextResponse.json({ success: true, data: attendance, source: "fresh" });
            }

            return NextResponse.json({
                success: false,
                error: "Academia is currently down. Please try again later.",
            }, { status: 503 });

        } catch (err: any) {
            if (err?.message === "SESSION_EXPIRED") {
                console.log("⚠️ Session expired — returning 503");
                return NextResponse.json({ success: false, error: "Academia is currently down. Please try again later." }, { status: 503 });
            }
            return NextResponse.json({ success: false, error: "Academia is currently down. Please try again later." }, { status: 503 });
        }
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
    }
}