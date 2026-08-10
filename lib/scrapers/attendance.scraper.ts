import axios from "axios";

const ATTENDANCE_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance";
const FALLBACK_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24";

export async function scrapeAttendanceAndMarks(cookies: string): Promise<string> {
    console.log("Fetching attendance data...");

    // ✅ Try main URL 2 times
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await axios.request({
                method: "get",
                url: ATTENDANCE_URL,
                headers: {
                    Cookie: cookies,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Referer": "https://academia.srmist.edu.in/",
                },
            });
            const html = res.data as string;
            console.log(`📄 Attendance response: ${html.length} chars (attempt ${attempt})`);

            if (html.length < 10000 || html.includes("Error-msg")) {
                throw new Error("SESSION_EXPIRED");
            }
            return html;
        } catch (err: any) {
            if (err?.message === "SESSION_EXPIRED") throw err;
            console.log(`⚠️ My_Attendance failed — attempt ${attempt}/2`);
        }
    }

    // ✅ Fallback URL
    console.log("🔄 Trying fallback URL...");
    try {
        const res = await axios.request({
            method: "get",
            url: FALLBACK_URL,
            headers: {
                Cookie: cookies,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const html = res.data as string;
        console.log(`📄 Fallback response: ${html.length} chars`);

        if (html.length < 10000 || html.includes("Error-msg")) {
            throw new Error("SESSION_EXPIRED");
        }
        return html;
    } catch (err: any) {
        if (err?.message === "SESSION_EXPIRED") throw err;
        console.log("⚠️ Fallback failed:", err?.message);
        throw new Error("FETCH_FAILED");
    }
}