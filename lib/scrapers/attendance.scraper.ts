import axios from "axios";

const ATTENDANCE_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance";
const FALLBACK_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24";

export async function scrapeAttendanceAndMarks(cookies: string): Promise<string> {
    console.log("Fetching attendance data...");
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
        console.log(`📄 Attendance response: ${html.length} chars`);
        if (html.length < 500 || html.includes("Error-msg")) throw new Error("Invalid response");
        return html;
    } catch {
        console.log("⚠️ My_Attendance failed, using fallback...");
        const res = await axios.request({
            method: "get",
            url: FALLBACK_URL,
            headers: {
                Cookie: cookies,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const html = res.data as string;
        if (html.length < 500 || html.includes("Error-msg")) throw new Error("Session expired — please login again");
        return html;
    }
}