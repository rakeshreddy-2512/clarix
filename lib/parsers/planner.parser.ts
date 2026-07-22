import * as cheerio from "cheerio";

export interface PlannerDay {
    date: string;
    dayOrder: number | null;
    note: string;
}

export type PlannerMap = Record<string, PlannerDay>;

const MONTHS: Record<string, number> = {
    "jan": 0, "feb": 1, "mar": 2, "apr": 3,
    "may": 4, "jun": 5, "jul": 6, "aug": 7,
    "sep": 8, "oct": 9, "nov": 10, "dec": 11,
};

function parseSinglePlanner(html: string): { map: PlannerMap; semester: string } {
    const plannerMap: PlannerMap = {};

    let decoded = "";
    const zmlMatch = html.match(/zmlvalue="([\s\S]*?)"><\/div>/);
    if (zmlMatch) {
        decoded = zmlMatch[1]
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&#34;/g, '"');
    } else {
        const sanitizerMatch = html.match(/pageSanitizer\.sanitize\('([\s\S]*?)'\)/);
        if (sanitizerMatch) {
            decoded = sanitizerMatch[1]
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\//g, "/")
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\\\/g, "\\");
        } else {
            return { map: plannerMap, semester: "" };
        }
    }

    const $ = cheerio.load(decoded);

    let semester = "";
    $("h2, h3").each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes("Planner") || text.includes("planner")) {
            semester = text;
        }
    });
    console.log(`📅 Planner: ${semester}`);

    const yearMatch = semester.match(/(\d{4})\s*[-–]\s*(\d{2,4})/);
    let year1 = new Date().getFullYear();
    let year2 = year1 + 1;
    if (yearMatch) {
        year1 = parseInt(yearMatch[1]);
        const y2str = yearMatch[2];
        year2 = y2str.length === 2
            ? parseInt(String(year1).substring(0, 2) + y2str)
            : parseInt(y2str);
    }

    const isEven = semester.toUpperCase().includes("EVEN");
    const isOdd = semester.toUpperCase().includes("ODD");

    let table = $("table.planner_table");
    if (!table.length) {
        $("table").each((_, t) => {
            const headers = $(t).find("th").text().toLowerCase();
            if (headers.includes("do") || headers.includes("day")) {
                table = $(t) as any;
                return false;
            }
        });
    }

    if (!table.length) {
        console.log("❌ No planner table found");
        return { map: plannerMap, semester };
    }

    const monthNames: string[] = [];
    table.find("th").each((_, th) => {
        const text = $(th).text().trim().toLowerCase();
        for (const key of Object.keys(MONTHS)) {
            if (text.startsWith(key)) {
                monthNames.push(key);
                break;
            }
        }
    });
    console.log(`📅 Months found: ${monthNames.join(", ")}`);

    table.find("tr").each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length < 4) return;

        const groupSize = 5;
        const numGroups = Math.floor(tds.length / groupSize);

        for (let g = 0; g < numGroups && g < monthNames.length; g++) {
            const base = g * groupSize;
            const dt = $(tds[base]).text().trim();
            const doText = $(tds[base + 3]).text().trim();
            const noteText = $(tds[base + 2]).find("strong").text().trim();

            if (!dt || isNaN(parseInt(dt))) continue;

            const day = parseInt(dt);
            const monthName = monthNames[g];
            const monthNum = MONTHS[monthName];

            let dateYear: number;
            if (isEven) {
                dateYear = year2;
            } else if (isOdd) {
                dateYear = monthNum >= 6 ? year1 : year2;
            } else {
                dateYear = monthNum >= 6 ? year1 : year2;
            }

            const dateStr = `${dateYear}-${String(monthNum + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayOrderNum = parseInt(doText);
            const dayOrder = doText === "-" || doText === "" || isNaN(dayOrderNum) ? null : dayOrderNum;

            plannerMap[dateStr] = { date: dateStr, dayOrder, note: noteText };
        }
    });

    console.log(`✅ Planner parsed: ${Object.keys(plannerMap).length} days`);
    return { map: plannerMap, semester };
}

export function parsePlanner(htmls: string[]): { map: PlannerMap; semester: string; year: number } {
    const mergedMap: PlannerMap = {};
    let semester = "";

    for (const html of htmls) {
        const { map, semester: sem } = parseSinglePlanner(html);
        Object.assign(mergedMap, map);
        if (sem) semester = sem;
    }

    const year = new Date().getFullYear();
    return { map: mergedMap, semester, year };
}