import * as cheerio from "cheerio";

export interface AttendanceCourse {
    code: string;
    title: string;
    faculty: string;
    category: string;
    slot: string;
    room: string;
    totalClasses: number;
    attended: number;
    absent: number;
    percentage: number;
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
    if (match) {
        console.log("✅ Found pageSanitizer content");
        return unescapeHtml(match[1]);
    }
    const innerMatch = html.match(/\.innerHTML\s*=\s*pageSanitizer\.sanitize\('([\s\S]+?)'\)/);
    if (innerMatch) {
        console.log("✅ Found innerHTML content");
        return unescapeHtml(innerMatch[1]);
    }
    console.log("⚠️ Could not find pageSanitizer content, using raw HTML");
    return html;
}

export function parseAttendance(html: string): AttendanceCourse[] {
    const courses: AttendanceCourse[] = [];
    const scriptContent = extractInnerHtml(html);
    const contentHtml = scriptContent !== html ? scriptContent : html;
    const $inner = cheerio.load(contentHtml);
    let attendanceTable: any = null;

    $inner("table").each((_, table) => {
        const headerText = $inner(table).find("tr:first-child").text().toLowerCase();
        const hasAttn = headerText.includes("attn");
        const hasSlot = headerText.includes("slot");
        const hasCourse = headerText.includes("course");
        const hasCategory = headerText.includes("category");
        const hasFaculty = headerText.includes("faculty");
        if (hasAttn && hasSlot && hasCourse && hasCategory && hasFaculty) {
            attendanceTable = $inner(table);
        }
    });

    if (!attendanceTable) {
        console.warn("⚠️ Could not find attendance table");
        $inner("table").each((i, table) => {
            console.log(`  Table ${i} header: ${$inner(table).find("tr:first-child").text().trim().substring(0, 80)}`);
        });
        return courses;
    }

    $inner(attendanceTable).find("tr").each((i, row) => {
        if (i === 0) return;
        const cells = $inner(row).find("td");
        if (cells.length < 7) return;
        const getText = (idx: number) => $inner(cells[idx]).text().trim();
        const code = $inner(cells[0]).contents().first().text().trim();
        const title = getText(1);
        const category = getText(2);
        const faculty = getText(3);
        const slot = getText(4);
        const room = getText(5);
        const percentageText = $inner(cells[6]).find("font").text().trim() || getText(6);
        const percentage = parseFloat(percentageText) || 0;
        if (!code || !title) return;
        courses.push({
            code, title, faculty,
            category: category === "Practical" ? "Practical" : "Theory",
            slot, room, totalClasses: 0, attended: 0, absent: 0, percentage,
        });
    });

    console.log(`✅ Total attendance parsed: ${courses.length} courses`);
    return courses;
}