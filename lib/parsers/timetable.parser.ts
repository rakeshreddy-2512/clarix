import * as cheerio from "cheerio";

export interface TimetableCourse {
    code: string;
    title: string;
    room: string;
    type: string;
    slot: string;
}

export interface TimetableSlot {
    startTime: string;
    endTime: string;
    courses: TimetableCourse[];
}

export interface TimetableResult {
    timetable: Record<number, TimetableSlot[]>;
    batch: number;
    section: string;
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

// Time slots for each period
const BATCH1_TIMES: Record<string, { start: string; end: string }> = {
    "A": { start: "08:00", end: "08:50" },
    "B": { start: "08:50", end: "09:40" },
    "C": { start: "09:50", end: "10:40" },
    "D": { start: "10:45", end: "11:35" },
    "E": { start: "11:40", end: "12:30" },
    "F": { start: "12:30", end: "13:20" },
    "G": { start: "13:20", end: "14:10" },
    "H": { start: "14:10", end: "15:00" },
    "L11": { start: "08:00", end: "08:50" },
    "L12": { start: "08:50", end: "09:40" },
    "L21": { start: "09:50", end: "10:40" },
    "L22": { start: "10:45", end: "11:35" },
    "L31": { start: "11:40", end: "12:30" },
    "L32": { start: "12:30", end: "13:20" },
    "L41": { start: "13:20", end: "14:10" },
    "L42": { start: "14:10", end: "15:00" },
    "L51": { start: "15:05", end: "15:55" },
    "L52": { start: "15:55", end: "16:45" },
    "L61": { start: "16:50", end: "17:40" },
    "L62": { start: "17:40", end: "18:30" },
    "P11": { start: "08:00", end: "08:50" },
    "P12": { start: "08:50", end: "09:40" },
    "P21": { start: "09:50", end: "10:40" },
    "P22": { start: "10:45", end: "11:35" },
    "P31": { start: "11:40", end: "12:30" },
    "P32": { start: "12:30", end: "13:20" },
    "P41": { start: "13:20", end: "14:10" },
    "P42": { start: "14:10", end: "15:00" },
    "P46": { start: "13:20", end: "14:10" },
    "P47": { start: "14:10", end: "15:00" },
    "P48": { start: "15:05", end: "15:55" },
    "P51": { start: "15:05", end: "15:55" },
    "P52": { start: "15:55", end: "16:45" },
    "P61": { start: "16:50", end: "17:40" },
    "P62": { start: "17:40", end: "18:30" },
};

function getSlotTime(slot: string): { start: string; end: string } {
    const cleanSlot = slot.trim().toUpperCase();
    if (BATCH1_TIMES[cleanSlot]) return BATCH1_TIMES[cleanSlot];
    // Try first part if combined slot like "A-B"
    const firstSlot = cleanSlot.split("-")[0].trim();
    if (BATCH1_TIMES[firstSlot]) return BATCH1_TIMES[firstSlot];
    return { start: "00:00", end: "00:00" };
}

export function parseTimetable(html: string): TimetableResult {
    const result: TimetableResult = { timetable: { 1: [], 2: [], 3: [], 4: [], 5: [] }, batch: 1, section: "" };

    const extracted = extractContent(html);
    const decoded = decodeContent(extracted);
    const $ = cheerio.load(`<body>${decoded}</body>`);

    // Detect batch
    const bodyText = decoded.toLowerCase();
    if (bodyText.includes("batch 2") || bodyText.includes("batch-2") || bodyText.includes("batch2")) {
        result.batch = 2;
        console.log("👥 Detected batch: 2");
    } else {
        result.batch = 1;
        console.log("👥 Detected batch: 1");
    }

    // Detect section
    const sectionPatterns = [
        /\(([A-Z0-9]+)\s+Section\)/i,
        /Section[:\s]+([A-Z0-9]+)/i,
        /([A-Z]\d+)\s+Section/i,
    ];
    for (const pattern of sectionPatterns) {
        const match = decoded.match(pattern);
        if (match) {
            result.section = `${match[1]} Section`;
            console.log(`🏫 Detected section: ${result.section}`);
            break;
        }
    }

    // Find timetable table — look for table with slot/day order headers
    let timetableTable: any = null;
    let timetableTableIndex = -1;

    $("table").each((i, table) => {
        const text = $(table).text().toLowerCase();
        const headerText = $(table).find("tr:first-child").text().toLowerCase();
        if (
            (headerText.includes("slot") || text.includes("slot")) &&
            (headerText.includes("course code") || text.includes("course code")) &&
            (headerText.includes("room") || text.includes("room no"))
        ) {
            timetableTable = $(table);
            timetableTableIndex = i;
            console.log(`✅ Found timetable table at index ${i}`);
        }
    });

    if (!timetableTable) {
        // Fallback: try table at index 1 (acadia.works approach)
        const tables = $("table");
        if (tables.length > 1) {
            timetableTable = $(tables[1]);
            timetableTableIndex = 1;
            console.log(`✅ Using fallback timetable table at index 1`);
        }
    }

    if (!timetableTable) {
        console.warn("❌ Could not find timetable table");
        return result;
    }

    // Get header row to find column indices
    const headerRow = $(timetableTable).find("tr").first();
    const headers = $(headerRow).find("td, th").map((_, el) => $(el).text().trim().toLowerCase()).get();

    const codeIndex = headers.findIndex(h => h.includes("course code"));
    const titleIndex = headers.findIndex(h => h.includes("course title"));
    const slotIndex = headers.findIndex(h => h === "slot" || h.includes("slot"));
    const roomIndex = headers.findIndex(h => h.includes("room"));
    const categoryIndex = headers.findIndex(h => h.includes("category"));
    const typeIndex = headers.findIndex(h => h.includes("type") || h.includes("course type"));

    // Parse each course row
    const coursesBySlot: Record<string, TimetableCourse> = {};

    $(timetableTable).find("tr").each((i, row) => {
        if (i === 0) return; // skip header

        const cells = $(row).find("td");
        if (cells.length < 4) return;

        const getText = (idx: number) => idx >= 0 && cells[idx] ? $(cells[idx]).text().trim() : "";

        const code = codeIndex >= 0
            ? $(cells[codeIndex]).contents().first().text().trim()
            : $(cells[0]).contents().first().text().trim();

        const title = getText(titleIndex >= 0 ? titleIndex : 1);
        const slotText = getText(slotIndex >= 0 ? slotIndex : 4);
        const room = getText(roomIndex >= 0 ? roomIndex : 5);
        const category = getText(categoryIndex >= 0 ? categoryIndex : 3);
        const typeText = getText(typeIndex >= 0 ? typeIndex : -1);

        if (!code || !title || !slotText) return;

        const isLab = slotText.match(/^[LP]/i) || category.toLowerCase().includes("practical") || typeText.toLowerCase().includes("practical");
        const type = isLab ? "Practical" : "Theory";

        // Split multiple slots (e.g., "A-B" or "P46, P47, P48")
        const slots = slotText.split(/[-,]/).map(s => s.trim()).filter(Boolean);

        console.log(`  📚 ${code} — ${title} — Slots: ${slots.join(", ")} — Room: ${room}`);

        slots.forEach(slot => {
            coursesBySlot[slot] = { code, title, room, type, slot };
        });
    });

    // Now map courses to day order timetable
    // Use unified timetable mapping (Day Order 1-5 × slots)
    const DAY_ORDER_SLOTS: Record<number, string[][]> = {
        1: [["A"], ["B"], ["C"], ["D"], ["E"], ["F", "G"], ["H"]],
        2: [["B"], ["C"], ["D"], ["E"], ["F"], ["G", "H"], ["A"]],
        3: [["C"], ["D"], ["E"], ["F"], ["G"], ["A", "B"], ["H"]],
        4: [["D"], ["E"], ["F"], ["G"], ["H"], ["B", "C"], ["A"]],
        5: [["E"], ["F"], ["G"], ["H"], ["A"], ["C", "D"], ["B"]],
    };

    // Build timetable for each day order
    for (let day = 1; day <= 5; day++) {
        const daySlots = DAY_ORDER_SLOTS[day];
        const dayTimetable: TimetableSlot[] = [];

        daySlots.forEach(slotGroup => {
            const coursesInSlot: TimetableCourse[] = [];
            slotGroup.forEach(slot => {
                if (coursesBySlot[slot]) {
                    coursesInSlot.push(coursesBySlot[slot]);
                }
            });

            if (coursesInSlot.length > 0) {
                const time = getSlotTime(slotGroup[0]);
                dayTimetable.push({
                    startTime: time.start,
                    endTime: time.end,
                    courses: coursesInSlot,
                });
            }
        });

        // Add lab/practical slots
        Object.keys(coursesBySlot).forEach(slot => {
            if (slot.match(/^[LP]\d+/i)) {
                const course = coursesBySlot[slot];
                const time = getSlotTime(slot);

                // Check if this lab slot belongs to this day
                const slotNum = parseInt(slot.replace(/[^0-9]/g, ""));
                const dayLabSlots: Record<number, number[]> = {
                    1: [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62],
                    2: [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62],
                    3: [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62],
                    4: [11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62],
                    5: [46, 47, 48, 51, 52, 61, 62],
                };

                const alreadyAdded = dayTimetable.some(s =>
                    s.courses.some(c => c.code === course.code) &&
                    s.startTime === time.start
                );

                if (!alreadyAdded && time.start !== "00:00") {
                    dayTimetable.push({
                        startTime: time.start,
                        endTime: time.end,
                        courses: [course],
                    });
                }
            }
        });

        // Sort by start time
        dayTimetable.sort((a, b) => a.startTime.localeCompare(b.startTime));
        result.timetable[day] = dayTimetable;
    }

    return result;
}