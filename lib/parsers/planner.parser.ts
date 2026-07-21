import * as cheerio from "cheerio";

export interface PlannerDay {
    date: string;
    dayOrder: number | null;
    note: string;
}

export interface PlannerData {
    map: Record<string, PlannerDay>;
    semester: string;
}

function extractContent(html: string): { content: string; isZml: boolean } {
    if (html.includes("sanitize('")) {
        try {
            let a = html.split("sanitize('")[1].split("');function doa")[0];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            if (a.length > 100) {
                console.log("✅ Found pageSanitizer planner content");
                return { content: a, isZml: false };
            }
        } catch { }
    }

    if (html.includes('zmlvalue="')) {
        try {
            let a = html.split('zmlvalue="')[1].split('"></div>')[0];
            a = a.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            console.log("✅ Found zmlvalue planner content");
            return { content: a, isZml: true };
        } catch { }
    }

    const innerMatch = html.match(/\.innerHTML\s*=\s*pageSanitizer\.sanitize\('([\s\S]+?)'\)/);
    if (innerMatch) {
        try {
            let a = innerMatch[1];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            return { content: a, isZml: false };
        } catch { }
    }

    console.log("⚠️ No known pattern found for planner, using raw HTML");
    return { content: html, isZml: false };
}

function decodeContent(html: string): string {
    return html
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\-/g, "-")
        .replace(/\\"/g, '"')
        .replace(/\\\//g, "/")
        .replace(/"(?=\w+=)/g, '" ');
}

function parseMonthYear(monthStr: string, year: number): string {
    const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        january: 0, february: 1, march: 2, april: 3, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const key = monthStr.toLowerCase().trim();
    const monthNum = months[key];
    if (monthNum === undefined) return "";
    return `${year}-${String(monthNum + 1).padStart(2, "0")}`;
}

function parseTable($: any, tbody: any, baseYear: number, result: PlannerData) {
    const monthHeader = $("th", tbody);
    const trs = $("tr", tbody);

    const monthPositions: { month: string; colIndex: number }[] = [];
    monthHeader.each((i: number, th: any) => {
        const text = $(th).text().trim();
        if (text.match(/^[A-Za-z]+$/)) {
            monthPositions.push({ month: text, colIndex: i });
        }
    });

    let currentYear = baseYear;
    let prevMonth = -1;

    trs.each((_: number, row: any) => {
        const tds = $("td", row);
        if (tds.length === 0) return;

        for (let i = 0; i < tds.length; i += 5) {
            const date = $(tds[i]).text().trim();
            const event = $(tds[i + 2])?.text().trim() || "";
            const dayOrderText = $(tds[i + 3])?.text().trim() || "";

            if (!date || !date.match(/^\d{1,2}$/)) continue;

            const groupIndex = Math.floor(i / 5);
            const monthInfo = monthPositions[groupIndex];
            if (!monthInfo) continue;

            const monthStr = parseMonthYear(monthInfo.month, currentYear);
            if (!monthStr) continue;

            const monthNum = parseInt(monthStr.split("-")[1]) - 1;
            if (prevMonth > monthNum && monthNum < 6) currentYear++;
            prevMonth = monthNum;

            const fullDate = `${currentYear}-${String(monthNum + 1).padStart(2, "0")}-${date.padStart(2, "0")}`;

            let dayOrder: number | null = null;
            const doMatch = dayOrderText.match(/\d+/);
            if (doMatch) dayOrder = parseInt(doMatch[0]);

            result.map[fullDate] = { date: fullDate, dayOrder, note: event || "" };
        }
    });
}

export function parsePlanner(htmls: string[]): PlannerData {
    const result: PlannerData = { map: {}, semester: "" };

    for (const html of htmls) {
        if (!html || html.length < 500) continue;

        const { content, isZml } = extractContent(html);
        const decoded = decodeContent(content);
        const $ = cheerio.load(`<body>${decoded}</body>`);

        if (!result.semester) {
            if (html.includes("EVEN") || decoded.includes("EVEN")) result.semester = "Even Semester";
            else if (html.includes("ODD") || decoded.includes("ODD")) result.semester = "Odd Semester";
            else result.semester = "Current Semester";
        }

        const yearMatch = decoded.match(/20\d{2}/);
        const baseYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

        const tbodys = $(".mainDiv tbody");
        const tbody = isZml ? tbodys.eq(0) : tbodys.eq(1);

        if (tbody.length === 0) {
            $("table tbody").each((_: number, tbodyEl: any) => {
                const text = $(tbodyEl).text();
                if (text.match(/\d{1,2}/) && (text.toLowerCase().includes("day") || text.toLowerCase().includes("order"))) {
                    parseTable($, $(tbodyEl), baseYear, result);
                }
            });
        } else {
            parseTable($, tbody, baseYear, result);
        }
    }

    console.log(`✅ Planner parsed: ${Object.keys(result.map).length} days`);
    return result;
}