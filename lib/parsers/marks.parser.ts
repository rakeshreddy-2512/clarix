import * as cheerio from "cheerio";

export interface MarkCourse {
    code: string;
    title: string;
    type: string;
    tests: { name: string; max: number; scored: number }[];
}

function extractContent(html: string): string {
    if (html.includes("sanitize('")) {
        try {
            let a = html.split("sanitize('")[1].split("');function doa")[0];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            if (a.length > 100) return a;
        } catch { }
    }

    const innerMatch = html.match(/\.innerHTML\s*=\s*pageSanitizer\.sanitize\('([\s\S]+?)'\)/);
    if (innerMatch) {
        try {
            let a = innerMatch[1];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            return a;
        } catch { }
    }

    if (html.includes('zmlvalue="')) {
        try {
            let a = html.split('zmlvalue="')[1].split('"></div>')[0];
            a = a.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            return a;
        } catch { }
    }

    return html;
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

export function parseMarks(html: string): MarkCourse[] {
    const courses: MarkCourse[] = [];

    const extracted = extractContent(html);
    const decoded = decodeContent(extracted);
    const $ = cheerio.load(`<body>${decoded}</body>`);

    // Build title map from course list table
    const titleMap: Record<string, string> = {};
    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (headerText.includes("course code") && headerText.includes("course title") && headerText.includes("slot")) {
            $(table).find("tr").slice(1).each((_, row) => {
                const cells = $(row).find("td");
                if (cells.length < 2) return;
                const code = $(cells[0]).contents().first().text().trim().replace("Regular", "").trim();
                const title = $(cells[1]).text().trim();
                if (code && title) titleMap[code] = title;
            });
        }
    });

    // Find marks table
    let marksTable: any = null;
    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (
            headerText.includes("test performance") ||
            (headerText.includes("course code") && headerText.includes("course type"))
        ) {
            marksTable = $(table);
        }
    });

    // Fallback: 4th table (acadia.works uses index 3)
    if (!marksTable) {
        const tables = $("table");
        if (tables.length >= 4) marksTable = $(tables[3]);
    }

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

        // Parse nested test marks
        $(cells[2]).find("td, tr td").each((_, td) => {
            const strong = $(td).find("strong").text().trim();
            if (strong.includes("/")) {
                const parts = strong.split("/");
                const name = parts[0].trim();
                const max = parseFloat(parts[1]) || 0;
                const fullText = $(td).text().trim();
                const scoredText = fullText.replace(strong, "").trim();
                const scored = parseFloat(scoredText) || 0;
                if (name) tests.push({ name, max, scored });
            }
        });

        if (code && (type === "Theory" || type === "Practical") && tests.length > 0) {
            courses.push({ code, title, type, tests });
        }
    });

    console.log(`✅ Total marks parsed: ${courses.length} courses`);
    return courses;
}