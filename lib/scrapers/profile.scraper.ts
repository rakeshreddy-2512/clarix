import axios from "axios";

const TIMETABLE_URL = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24";

export async function scrapeProfile(cookies: string): Promise<string> {
    console.log("🔄 Fetching profile data...");
    const res = await axios.request({
        method: "get",
        url: TIMETABLE_URL,
        headers: {
            Cookie: cookies,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://academia.srmist.edu.in/",
        },
    });
    const html = res.data as string;
    if (html.length < 500 || html.includes("Error-msg")) throw new Error("Session expired — please login again");
    return html;
}
