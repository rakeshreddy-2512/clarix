import * as cheerio from "cheerio";

export interface TimetableSlot {
    startTime: string;
    endTime: string;
    courses: {
        code: string;
        title: string;
        room: string;
        type: string;
        slot: string;
    }[];
}

export type Timetable = Record<number, TimetableSlot[]>;

export interface TimetableResult {
    timetable: Timetable;
    batch: number;
    section: string;
}

const BATCH1_SCHEDULE: Record<string, { day: number; startTime: string; endTime: string }[]> = {
    A: [
        { day: 1, startTime: "08:00", endTime: "09:40" },
        { day: 2, startTime: "04:00", endTime: "04:50" },
        { day: 3, startTime: "09:45", endTime: "10:35" },
    ],
    B: [
        { day: 2, startTime: "12:30", endTime: "02:15" },
        { day: 3, startTime: "11:35", endTime: "12:25" },
        { day: 4, startTime: "02:20", endTime: "03:10" },
    ],
    C: [
        { day: 3, startTime: "08:00", endTime: "09:40" },
        { day: 4, startTime: "04:00", endTime: "04:50" },
        { day: 5, startTime: "09:45", endTime: "10:35" },
    ],
    D: [
        { day: 3, startTime: "10:40", endTime: "11:30" },
        { day: 4, startTime: "12:30", endTime: "02:15" },
        { day: 5, startTime: "11:35", endTime: "12:25" },
    ],
    E: [
        { day: 4, startTime: "03:10", endTime: "04:00" },
        { day: 5, startTime: "08:00", endTime: "09:40" },
    ],
    F: [
        { day: 1, startTime: "09:45", endTime: "11:30" },
        { day: 5, startTime: "10:40", endTime: "11:30" },
    ],
    G: [
        { day: 1, startTime: "11:35", endTime: "12:25" },
        { day: 2, startTime: "02:20", endTime: "04:00" },
    ],
    P6: [{ day: 1, startTime: "12:30", endTime: "01:20" }],
    P7: [{ day: 1, startTime: "01:25", endTime: "02:15" }],
    P8: [{ day: 1, startTime: "02:20", endTime: "03:10" }],
    P9: [{ day: 1, startTime: "03:10", endTime: "04:00" }],
    P10: [{ day: 1, startTime: "04:00", endTime: "04:50" }],
    L11: [{ day: 1, startTime: "04:50", endTime: "05:30" }],
    L12: [{ day: 1, startTime: "05:30", endTime: "06:10" }],
    P11: [{ day: 2, startTime: "08:00", endTime: "08:50" }],
    P12: [{ day: 2, startTime: "08:50", endTime: "09:40" }],
    P13: [{ day: 2, startTime: "09:45", endTime: "10:35" }],
    P14: [{ day: 2, startTime: "10:40", endTime: "11:30" }],
    P15: [{ day: 2, startTime: "11:35", endTime: "12:25" }],
    L21: [{ day: 2, startTime: "04:50", endTime: "05:30" }],
    L22: [{ day: 2, startTime: "05:30", endTime: "06:10" }],
    P26: [{ day: 3, startTime: "12:30", endTime: "01:20" }],
    P27: [{ day: 3, startTime: "01:25", endTime: "02:15" }],
    P28: [{ day: 3, startTime: "02:20", endTime: "03:10" }],
    P29: [{ day: 3, startTime: "03:10", endTime: "04:00" }],
    P30: [{ day: 3, startTime: "04:00", endTime: "04:50" }],
    L31: [{ day: 3, startTime: "04:50", endTime: "05:30" }],
    L32: [{ day: 3, startTime: "05:30", endTime: "06:10" }],
    P31: [{ day: 4, startTime: "08:00", endTime: "08:50" }],
    P32: [{ day: 4, startTime: "08:50", endTime: "09:40" }],
    P33: [{ day: 4, startTime: "09:45", endTime: "10:35" }],
    P34: [{ day: 4, startTime: "10:40", endTime: "11:30" }],
    P35: [{ day: 4, startTime: "11:35", endTime: "12:25" }],
    L41: [{ day: 4, startTime: "04:50", endTime: "05:30" }],
    L42: [{ day: 4, startTime: "05:30", endTime: "06:10" }],
    P46: [{ day: 5, startTime: "12:30", endTime: "01:20" }],
    P47: [{ day: 5, startTime: "01:25", endTime: "02:15" }],
    P48: [{ day: 5, startTime: "02:20", endTime: "03:10" }],
    P49: [{ day: 5, startTime: "03:10", endTime: "04:00" }],
    P50: [{ day: 5, startTime: "04:00", endTime: "04:50" }],
    L51: [{ day: 5, startTime: "04:50", endTime: "05:30" }],
    L52: [{ day: 5, startTime: "05:30", endTime: "06:10" }],
};

const BATCH2_SCHEDULE: Record<string, { day: number; startTime: string; endTime: string }[]> = {
    A: [
        { day: 1, startTime: "12:30", endTime: "02:15" },
        { day: 2, startTime: "11:35", endTime: "12:25" },
        { day: 3, startTime: "02:20", endTime: "03:10" },
    ],
    B: [
        { day: 2, startTime: "08:00", endTime: "09:40" },
        { day: 4, startTime: "08:00", endTime: "09:40" },
    ],
    C: [
        { day: 3, startTime: "12:30", endTime: "02:15" },
        { day: 4, startTime: "11:35", endTime: "12:25" },
        { day: 5, startTime: "02:20", endTime: "03:10" },
    ],
    D: [
        { day: 1, startTime: "08:00", endTime: "09:40" },
        { day: 3, startTime: "03:10", endTime: "04:00" },
        { day: 5, startTime: "04:00", endTime: "04:50" },
    ],
    E: [
        { day: 4, startTime: "10:40", endTime: "11:30" },
        { day: 5, startTime: "12:30", endTime: "02:15" },
    ],
    F: [
        { day: 1, startTime: "02:20", endTime: "03:10" },
        { day: 5, startTime: "03:10", endTime: "04:00" },
    ],
    G: [
        { day: 1, startTime: "10:40", endTime: "11:30" },
        { day: 2, startTime: "11:35", endTime: "04:00" },
    ],
    P1: [{ day: 1, startTime: "08:00", endTime: "08:50" }],
    P2: [{ day: 1, startTime: "08:50", endTime: "09:40" }],
    P3: [{ day: 1, startTime: "09:45", endTime: "10:35" }],
    P4: [{ day: 1, startTime: "10:40", endTime: "11:30" }],
    P5: [{ day: 1, startTime: "11:35", endTime: "12:25" }],
    L11: [{ day: 1, startTime: "04:50", endTime: "05:30" }],
    L12: [{ day: 1, startTime: "05:30", endTime: "06:10" }],
    P16: [{ day: 2, startTime: "12:30", endTime: "01:20" }],
    P17: [{ day: 2, startTime: "01:25", endTime: "02:15" }],
    P18: [{ day: 2, startTime: "02:20", endTime: "03:10" }],
    P19: [{ day: 2, startTime: "03:10", endTime: "04:00" }],
    P20: [{ day: 2, startTime: "04:00", endTime: "04:50" }],
    L21: [{ day: 2, startTime: "04:50", endTime: "05:30" }],
    L22: [{ day: 2, startTime: "05:30", endTime: "06:10" }],
    P21: [{ day: 3, startTime: "08:00", endTime: "08:50" }],
    P22: [{ day: 3, startTime: "08:50", endTime: "09:40" }],
    P23: [{ day: 3, startTime: "09:45", endTime: "10:35" }],
    P24: [{ day: 3, startTime: "10:40", endTime: "11:30" }],
    P25: [{ day: 3, startTime: "11:35", endTime: "12:25" }],
    L31: [{ day: 3, startTime: "04:50", endTime: "05:30" }],
    L32: [{ day: 3, startTime: "05:30", endTime: "06:10" }],
    P36: [{ day: 4, startTime: "12:30", endTime: "01:20" }],
    P37: [{ day: 4, startTime: "01:25", endTime: "02:15" }],
    P38: [{ day: 4, startTime: "02:20", endTime: "03:10" }],
    P39: [{ day: 4, startTime: "03:10", endTime: "04:00" }],
    P40: [{ day: 4, startTime: "04:00", endTime: "04:50" }],
    L41: [{ day: 4, startTime: "04:50", endTime: "05:30" }],
    L42: [{ day: 4, startTime: "05:30", endTime: "06:10" }],
    P41: [{ day: 5, startTime: "08:00", endTime: "08:50" }],
    P42: [{ day: 5, startTime: "08:50", endTime: "09:40" }],
    P43: [{ day: 5, startTime: "09:45", endTime: "10:35" }],
    P44: [{ day: 5, startTime: "10:40", endTime: "11:30" }],
    P45: [{ day: 5, startTime: "11:35", endTime: "12:25" }],
    L51: [{ day: 5, startTime: "04:50", endTime: "05:30" }],
    L52: [{ day: 5, startTime: "05:30", endTime: "06:10" }],
};

export function parseTimetable(html: string): TimetableResult {
    const timetable: Timetable = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    const match = html.match(/pageSanitizer\.sanitize\('([\s\S]*?)'\)/);
    if (!match) {
        console.log("❌ No pageSanitizer content found");
        return { timetable, batch: 1, section: "" };
    }

    const unescaped = match[1]
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\//g, "/")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");

    const $ = cheerio.load(unescaped);

    // Detect batch
    let batch = 1;
    const bodyText = $.root().text();
    const batchMatch = bodyText.match(/Batch[:\s]+(\d)/i);
    if (batchMatch) {
        batch = parseInt(batchMatch[1]);
    }
    console.log(`👥 Detected batch: ${batch}`);

    // Detect section e.g. "I1 Section"
    let section = "";
    const sectionMatch = bodyText.match(/\(([A-Z]\d+\s*Section)\)/i);
    if (sectionMatch) {
        section = sectionMatch[1].trim();
    }
    console.log(`🏫 Detected section: ${section}`);

    const SLOT_SCHEDULE = batch === 2 ? BATCH2_SCHEDULE : BATCH1_SCHEDULE;

    const flat: {
        day: number;
        startTime: string;
        endTime: string;
        code: string;
        title: string;
        room: string;
        type: string;
        slot: string;
    }[] = [];

    $("table").each((i, table) => {
        const headers: string[] = [];
        $(table).find("tr:first-child td, tr:first-child th").each((_, th) => {
            headers.push($(th).text().trim().toLowerCase());
        });

        const hasSlot = headers.some(h => h.includes("slot"));
        const hasCourse = headers.some(h => h.includes("course"));
        if (!hasSlot || !hasCourse) return;

        console.log(`✅ Found timetable table at index ${i}`);

        $(table).find("tr").slice(1).each((_, row) => {
            const tds = $(row).find("td");
            if (tds.length < 8) return;

            const code = $(tds[1]).text().trim();
            const title = $(tds[2]).text().trim();
            const type = $(tds[6]).text().trim();
            const rawSlot = $(tds[8]).text().trim().toUpperCase();
            const room = $(tds[9]).text().trim() || "-";

            if (!code || !title || !rawSlot) return;

            const slots = rawSlot
                .replace(/\\/g, "")
                .split("-")
                .map(s => s.trim())
                .filter(s => s.length > 0);

            console.log(`  📚 ${code} — ${title} — Slots: ${slots.join(", ")} — Room: ${room}`);

            slots.forEach(slot => {
                const schedule = SLOT_SCHEDULE[slot];
                if (!schedule) {
                    console.log(`⚠️ No schedule for slot: ${slot}`);
                    return;
                }
                schedule.forEach(({ day, startTime, endTime }) => {
                    flat.push({ day, startTime, endTime, code, title, room, type, slot });
                });
            });
        });
    });

    flat.forEach(entry => {
        const daySlots = timetable[entry.day];
        const existing = daySlots.find(
            s => s.startTime === entry.startTime && s.endTime === entry.endTime
        );

        if (existing) {
            existing.courses.push({
                code: entry.code,
                title: entry.title,
                room: entry.room,
                type: entry.type,
                slot: entry.slot,
            });
        } else {
            daySlots.push({
                startTime: entry.startTime,
                endTime: entry.endTime,
                courses: [{
                    code: entry.code,
                    title: entry.title,
                    room: entry.room,
                    type: entry.type,
                    slot: entry.slot,
                }],
            });
        }
    });

    Object.keys(timetable).forEach(day => {
        const daySlots = timetable[Number(day)];

        daySlots.sort((a, b) => {
            const toMinutes = (t: string) => {
                const [h, m] = t.split(":").map(Number);
                const hour = h < 7 ? h + 12 : h;
                return hour * 60 + m;
            };
            return toMinutes(a.startTime) - toMinutes(b.startTime);
        });

        const merged: TimetableSlot[] = [];
        daySlots.forEach(slot => {
            const last = merged[merged.length - 1];
            const sameContent =
                last &&
                last.endTime === slot.startTime &&
                last.courses.length === slot.courses.length &&
                last.courses.every((c, i) => c.code === slot.courses[i]?.code);

            if (sameContent) {
                last.endTime = slot.endTime;
            } else {
                merged.push({ ...slot, courses: [...slot.courses] });
            }
        });

        timetable[Number(day)] = merged;
    });

    return { timetable, batch, section };
}