import * as cheerio from "cheerio";

export interface Student {
    name: string;
    regNo: string;
    program: string;
    department: string;
    semester: string;
    batch: string;
    section: string;
    email: string;
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

export function parseProfile(html: string): Student {
    const contentHtml = extractInnerHtml(html);
    const $ = cheerio.load(contentHtml);

    const student: Student = {
        name: "",
        regNo: "",
        program: "",
        department: "",
        semester: "",
        batch: "",
        section: "",
        email: "",
    };

    $("table tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
            const key = $(cells[0]).text().trim().toLowerCase();
            const value = $(cells[1]).find("strong").text().trim() ||
                $(cells[1]).text().trim();

            if (key.includes("name") && !key.includes("faculty")) {
                student.name = value;
            } else if (key.includes("registration")) {
                student.regNo = value;
            } else if (key.includes("program")) {
                student.program = value;
            } else if (key.includes("department")) {
                student.department = value;
            } else if (key.includes("specialization")) {
                student.section = value;
            } else if (key.includes("semester")) {
                student.semester = $(cells[1]).find("strong").first().text().trim();
            } else if (key.includes("batch")) {
                student.batch = value;
            } else if (key.includes("email")) {
                student.email = value;
            }
        }
    });

    if (!student.regNo) {
        const regMatch = contentHtml.match(/RA\d{13}/);
        if (regMatch) student.regNo = regMatch[0];
    }

    if (!student.name) {
        const nameMatch = contentHtml.match(/Name:\s*<\/td><td[^>]*><strong>([^<]+)<\/strong>/i);
        if (nameMatch) student.name = nameMatch[1].trim();
    }

    console.log(`✅ Profile parsed: ${student.name} — ${student.regNo}`);
    return student;
}