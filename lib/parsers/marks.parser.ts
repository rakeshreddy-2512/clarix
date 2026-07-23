import * as cheerio from "cheerio";

export interface MarkCourse {
    code: string;
    title: string;
    type: string;
    tests: { name: string; max: number; scored: number }[];
}

function unescapeHtml(str: string): string {
    return str
        .replace(/\\x27/g, "'")
        .replace(/\\x22/g, '"')
        .replace(/\\\//g, "/")
        .replace(/\\-/g, "-")
        .replace(/\\/g, "");
}

function extractInnerHtml(html: string): string {
    const match = html.match(/pageSanitizer\.sanitize\('([\s\S]+?)'\)(?:\s*;|\s*\))/);
    if (match) return unescapeHtml(match[1]);
    return html;
}

export function parseMarks(html: string): MarkCourse[] {
    const contentHtml = extractInnerHtml(html);
    const $ = cheerio.load(contentHtml);
    const courses: MarkCourse[] = [];

    // ✅ Build title + category map from attendance table
    const titleMap: Record<string, string> = {};
    const categoryMap: Record<string, string> = {};

    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        const hasAttn = headerText.includes("attn");
        const hasSlot = headerText.includes("slot");
        const hasCourse = headerText.includes("course");
        const hasCategory = headerText.includes("category");
        const hasFaculty = headerText.includes("faculty");

        if (hasAttn && hasSlot && hasCourse && hasCategory && hasFaculty) {
            $(table).find("tr").slice(1).each((_, row) => {
                const cells = $(row).find("td");
                if (cells.length < 3) return;
                const code = $(cells[0]).contents().first().text().trim();
                const title = $(cells[1]).text().trim();
                const category = $(cells[2]).text().trim();
                if (code && title) {
                    titleMap[code] = title;
                    categoryMap[code] = category === "Practical" ? "Practical" : "Theory";
                }
            });
        }
    });

    // ✅ Find marks table
    let marksTable: any = null;
    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (headerText.includes("test performance") || headerText.includes("course type")) {
            marksTable = $(table);
        }
    });

    // ✅ Build marks map from marks table
    const marksMap: Record<string, { type: string; tests: { name: string; max: number; scored: number }[] }> = {};

    if (marksTable) {
        $(marksTable).find("tr").each((i, row) => {
            if (i === 0) return;
            const cells = $(row).find("td");
            if (cells.length < 3) return;
            const code = $(cells[0]).text().trim();
            const type = $(cells[1]).text().trim();
            const tests: { name: string; max: number; scored: number }[] = [];

            $(cells[2]).find("td").each((_, td) => {
                const strong = $(td).find("strong").text().trim();
                if (strong.includes("/")) {
                    const parts = strong.split("/");
                    const name = parts[0].trim();
                    const max = parseFloat(parts[1]) || 0;
                    const fullText = $(td).text().trim();
                    const scored = parseFloat(fullText.replace(strong, "").trim()) || 0;
                    tests.push({ name, max, scored });
                }
            });

            if (code) {
                marksMap[code] = {
                    type: type === "Practical" ? "Practical" : "Theory",
                    tests,
                };
            }
        });
    }

    // ✅ Merge — show ALL courses from attendance, with marks if available
    // First add courses that have marks
    Object.entries(marksMap).forEach(([code, data]) => {
        courses.push({
            code,
            title: titleMap[code] || code,
            type: data.type,
            tests: data.tests,
        });
    });

    // Then add courses from attendance that don't have marks yet
    Object.entries(titleMap).forEach(([code, title]) => {
        if (!marksMap[code]) {
            courses.push({
                code,
                title,
                type: categoryMap[code] || "Theory",
                tests: [], // ✅ Empty tests — marks not updated yet
            });
        }
    });

    console.log(`✅ Total marks parsed: ${courses.length} courses (${Object.keys(marksMap).length} with marks, ${Object.keys(titleMap).length - Object.keys(marksMap).length} without)`);
    return courses;
}