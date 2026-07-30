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
        throw new Error("SESSION_EXPIRED");
    }
}