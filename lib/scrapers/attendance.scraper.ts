import axios from "axios";

const ATTENDANCE_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance";

export async function scrapeAttendanceAndMarks(cookies: string): Promise<string> {
    console.log("Fetching attendance data...");

    // ✅ Retry main URL up to 2 times
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

            if (html.length < 5000 || html.includes("Error-msg")) {
                throw new Error("Invalid response");
            }
            return html;
        } catch {
            console.log(`⚠️ My_Attendance failed — attempt ${attempt}/2`);
            if (attempt === 2) throw new Error("Session expired — please login again");
        }
    }

    throw new Error("Session expired — please login again");
}