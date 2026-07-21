import axios from "axios";

const SRM_BASE = "https://academia.srmist.edu.in/srm_university/academia-academic-services/page";

// ✅ Correct URLs — acadia.works uses Unified_Time_Table per batch
const TIMETABLE_URLS = {
    batch1: `${SRM_BASE}/Unified_Time_Table_2025_Batch_1`,
    batch2: `${SRM_BASE}/Unified_Time_Table_2025_batch_2`,
    fallback: `${SRM_BASE}/My_Time_Table_2023_24`, // fallback if unified doesn't work
};

export async function scrapeTimetable(cookies: string, batch: number = 1): Promise<string> {
    console.log(`🔄 Fetching timetable data for batch ${batch}...`);

    const url = batch === 2 ? TIMETABLE_URLS.batch2 : TIMETABLE_URLS.batch1;

    try {
        const res = await axios.request({
            method: "get",
            url,
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
        console.log(`📄 Timetable response: ${html.length} chars`);

        if (html.length < 500) throw new Error("Response too small");
        if (html.includes("Error-msg")) throw new Error("Session expired — please login again");

        return html;
    } catch (err) {
        // Fallback to old URL if unified doesn't work
        console.log(`⚠️ Unified timetable failed, trying fallback URL...`);
        const res = await axios.request({
            method: "get",
            url: TIMETABLE_URLS.fallback,
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
        console.log(`📄 Fallback timetable response: ${html.length} chars`);
        if (html.length < 500) throw new Error("Session expired — please login again");
        return html;
    }
}