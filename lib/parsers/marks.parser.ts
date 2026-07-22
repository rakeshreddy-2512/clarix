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

    const titleMap: Record<string, string> = {};
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
                if (cells.length < 2) return;
                const codeCell = $(cells[0]);
                const code = codeCell.contents().first().text().trim();
                const title = $(cells[1]).text().trim();
                if (code && title) titleMap[code] = title;
            });
        }
    });

    let marksTable: any = null;
    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (headerText.includes("test performance") || headerText.includes("course type")) {
            marksTable = $(table);
        }
    });

    if (!marksTable) {
        console.warn("⚠️ Could not find marks table");
        return courses;
    }

    $(marksTable).find("tr").each((i, row) => {
        if (i === 0) return;
        const cells = $(row).find("td");
        if (cells.length < 3) return;

        const code = $(cells[0]).text().trim();
        const type = $(cells[1]).text().trim();
        const title = titleMap[code] || code;

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

        if (code && tests.length > 0) {
            courses.push({
                code,
                title,
                type: type === "Practical" ? "Practical" : "Theory",
                tests,
            });
        }
    });

    console.log(`✅ Total marks parsed: ${courses.length} courses`);
    return courses;
}