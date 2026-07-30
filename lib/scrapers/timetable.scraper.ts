import axios from "axios";

const TIMETABLE_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24";

export async function scrapeTimetable(cookies: string): Promise<string> {
    console.log("🔄 Fetching timetable data...");
    const res = await axios.request({
        method: "get",
        url: TIMETABLE_URL,
        headers: {
            Cookie: cookies,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const html = res.data as string;
    console.log(`📄 Timetable response: ${html.length} chars`);

    // ✅ 8337 chars = session expired redirect page
    if (html.length < 10000) throw new Error("SESSION_EXPIRED");
    return html;
}