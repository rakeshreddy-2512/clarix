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
        if (
            headerText.includes("attn") &&
            headerText.includes("slot") &&
            headerText.includes("course") &&
            headerText.includes("category") &&
            headerText.includes("faculty")
        ) {
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

    // Detect column indices from header row — same as acadia.works
    const headerCells = $inner(attendanceTable).find("tr:first-child td");
    const keys: string[] = [];
    headerCells.each((_, cell) => {
        keys.push($inner(cell).text().trim());
    });

    const conductedIndex = keys.findIndex(k => k.toLowerCase().includes("hours conducted") || k.toLowerCase().includes("conducted"));
    const absentIndex = keys.findIndex(k => k.toLowerCase().includes("hours absent") || k.toLowerCase().includes("absent"));
    const percentageIndex = keys.findIndex(k => k.toLowerCase().includes("attn") || k.toLowerCase().includes("%"));

    console.log(`📊 Column indices — conducted: ${conductedIndex}, absent: ${absentIndex}, percentage: ${percentageIndex}`);

    $inner(attendanceTable).find("tr").each((i, row) => {
        if (i === 0) return;
        const cells = $inner(row).find("td");
        if (cells.length < 7) return;

        const getText = (idx: number) => idx >= 0 && cells[idx] ? $inner(cells[idx]).text().trim() : "";

        const code = $inner(cells[0]).contents().first().text().trim();
        const title = getText(1);
        const category = getText(2);
        const faculty = getText(3);
        const slot = getText(4);
        const room = getText(5);

        // Use detected indices if available, fallback to fixed positions
        const conductedText = conductedIndex >= 0 ? getText(conductedIndex) : "";
        const absentText = absentIndex >= 0 ? getText(absentIndex) : "";
        const percentageText = percentageIndex >= 0
            ? ($inner(cells[percentageIndex]).find("font").text().trim() || getText(percentageIndex))
            : ($inner(cells[6]).find("font").text().trim() || getText(6));

        const conducted = parseInt(conductedText) || 0;
        const absent = parseInt(absentText) || 0;
        const attended = conducted - absent;
        const percentage = parseFloat(percentageText) || 0;

        if (!code || !title) return;

        courses.push({
            code, title, faculty,
            category: category === "Practical" ? "Practical" : "Theory",
            slot, room,
            totalClasses: conducted,
            attended,
            absent,
            percentage,
        });

        console.log(`  ✅ ${code} — ${title} — ${attended}/${conducted} — ${percentage}%`);
    });

    console.log(`✅ Total attendance parsed: ${courses.length} courses`);
    return courses;
}