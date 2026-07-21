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

function extractContent(html: string): string {
    // Pattern 1: pageSanitizer.sanitize('...')
    if (html.includes("sanitize('")) {
        try {
            let a = html.split("sanitize('")[1].split("');function doa")[0];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            if (a.length > 100) {
                console.log("✅ Found pageSanitizer content");
                return a;
            }
        } catch { }
    }

    // Pattern 2: innerHTML = pageSanitizer.sanitize('...')
    const innerMatch = html.match(/\.innerHTML\s*=\s*pageSanitizer\.sanitize\('([\s\S]+?)'\)/);
    if (innerMatch) {
        try {
            let a = innerMatch[1];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            console.log("✅ Found innerHTML content");
            return a;
        } catch { }
    }

    // Pattern 3: zmlvalue attribute
    if (html.includes('zmlvalue="')) {
        try {
            let a = html.split('zmlvalue="')[1].split('"></div>')[0];
            a = a.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            console.log("✅ Found zmlvalue content");
            return a;
        } catch { }
    }

    // Pattern 4: resp.HTML
    if ((html as any).HTML) {
        console.log("✅ Found resp.HTML content");
        return (html as any).HTML;
    }

    console.log("⚠️ No known pattern found, using raw HTML");
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

export function parseAttendance(html: string): AttendanceCourse[] {
    const courses: AttendanceCourse[] = [];

    const extracted = extractContent(html);
    const decoded = decodeContent(extracted);
    const $ = cheerio.load(`<body>${decoded}</body>`);

    let attendanceTable: any = null;

    $("table").each((_, table) => {
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (
            headerText.includes("attn") &&
            headerText.includes("slot") &&
            headerText.includes("course") &&
            headerText.includes("category") &&
            headerText.includes("faculty")
        ) {
            attendanceTable = $(table);
        }
    });

    if (!attendanceTable) {
        console.warn("⚠️ Could not find attendance table");
        $("table").each((i, table) => {
            console.log(`  Table ${i} header: ${$(table).find("tr:first-child").text().trim().substring(0, 80)}`);
        });
        return courses;
    }

    // Get column indices dynamically
    const headerRow = $(attendanceTable).find("tr:first-child");
    const headers = headerRow.find("td, th").map((_, el) => $(el).text().trim().toLowerCase()).get();

    const codeIndex = headers.findIndex(h => h.includes("course code"));
    const titleIndex = headers.findIndex(h => h.includes("course title"));
    const categoryIndex = headers.findIndex(h => h.includes("category"));
    const facultyIndex = headers.findIndex(h => h.includes("faculty"));
    const slotIndex = headers.findIndex(h => h.includes("slot"));
    const roomIndex = headers.findIndex(h => h.includes("room"));
    const conductedIndex = headers.findIndex(h => h.includes("conducted") || h.includes("hours con"));
    const absentIndex = headers.findIndex(h => h.includes("absent") || h.includes("hours abs"));
    const percentageIndex = headers.findIndex(h => h.includes("attn") || h.includes("%"));

    $(attendanceTable).find("tr").each((i, row) => {
        if (i === 0) return;
        const cells = $(row).find("td");
        if (cells.length < 5) return;

        const getText = (idx: number) => idx >= 0 && cells[idx] ? $(cells[idx]).text().trim() : "";

        const code = codeIndex >= 0
            ? $(cells[codeIndex]).contents().first().text().trim().replace("Regular", "").trim()
            : $(cells[0]).contents().first().text().trim();

        const title = getText(titleIndex >= 0 ? titleIndex : 1);
        const category = getText(categoryIndex >= 0 ? categoryIndex : 2);
        const faculty = getText(facultyIndex >= 0 ? facultyIndex : 3).split(" (")[0];
        const slot = getText(slotIndex >= 0 ? slotIndex : 4);
        const room = getText(roomIndex >= 0 ? roomIndex : 5);
        const conducted = parseInt(getText(conductedIndex >= 0 ? conductedIndex : -1)) || 0;
        const absent = parseInt(getText(absentIndex >= 0 ? absentIndex : -1)) || 0;
        const attended = conducted - absent;

        const percentageCell = percentageIndex >= 0 ? cells[percentageIndex] : null;
        const percentageText = percentageCell
            ? ($(percentageCell).find("font").text().trim() || $(percentageCell).text().trim())
            : "0";
        const percentage = parseFloat(percentageText) || 0;

        if (!code || !title) return;

        courses.push({
            code,
            title,
            faculty,
            category: category === "Practical" ? "Practical" : "Theory",
            slot,
            room,
            totalClasses: conducted,
            attended,
            absent,
            percentage,
        });
    });

    console.log(`✅ Total attendance parsed: ${courses.length} courses`);
    return courses;
}