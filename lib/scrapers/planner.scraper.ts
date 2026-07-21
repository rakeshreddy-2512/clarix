import axios from "axios";

const PLANNERS = [
    "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_2025_26_EVEN",
    "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_2026_27_ODD",
];

export async function scrapePlanner(cookies: string): Promise<string[]> {
    console.log("🔄 Fetching planner data...");
    const results: string[] = [];
    for (const url of PLANNERS) {
        try {
            const res = await axios.get(url, {
                headers: {
                    Cookie: cookies,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
            });
            const html = res.data as string;
            if (html.length > 1000) results.push(html);
        } catch {
            console.log(`❌ Failed to fetch ${url}`);
        }
    }
    return results;
}