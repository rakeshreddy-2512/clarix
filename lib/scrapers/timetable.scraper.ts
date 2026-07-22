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
    if (html.length < 500) throw new Error("Session expired — please login again");
    return html;
}