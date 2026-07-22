"use client";

import { useState } from "react";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getTimetableApi, getProfileApi } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import { Download } from "lucide-react";

interface Course {
    code: string; title: string; room: string; type: string; slot: string;
}
interface TimetableSlot {
    startTime: string; endTime: string; courses: Course[];
}
type Timetable = Record<number, TimetableSlot[]>;
interface TimetableResult {
    timetable: Timetable; batch: number; section: string;
}
interface Student {
    name: string; regNo: string; batch: string; section: string;
}

// ✅ Generate consistent random color from subject name
function randomSubjectColor(seed: string): [number, number, number] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 0.7;
    const l = 0.45;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}

function abbreviate(title: string): string {
    const words = title.split(" ").filter(w => w.length > 0);
    if (words.length <= 1) return title.substring(0, 3).toUpperCase();
    return words.map(w => w[0]).join("").toUpperCase().substring(0, 3);
}

function toMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return (h < 7 ? h + 12 : h) * 60 + m;
}

async function exportTimetablePDF(
    timetable: Timetable,
    batch: number,
    section: string,
    profile: Student | null
) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageW = 297;
    const pageH = 210;
    const margin = 10;

    const orange: [number, number, number] = [255, 111, 0];
    const black: [number, number, number] = [0, 0, 0];
    const white: [number, number, number] = [255, 255, 255];
    const lightOrange: [number, number, number] = [255, 243, 224];

    // ── Header ───────────────────────────────────────────────────────────────
    doc.setFillColor(...orange);
    doc.rect(0, 0, pageW, 22, "F");

    doc.setTextColor(...white);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("CLARIX — Class Timetable", margin, 9);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const parts: string[] = [];
    if (profile?.name) parts.push(`Name: ${profile.name}`);
    if (profile?.regNo) parts.push(`Reg No: ${profile.regNo}`);
    parts.push(`Batch: ${batch}`);
    if (section) parts.push(`Section: ${section}`);
    parts.push(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(parts.join("     "), margin, 17);

    // ── Build subject maps ────────────────────────────────────────────────────
    const subjectColorMap: Record<string, [number, number, number]> = {};
    const subjectAbbrevMap: Record<string, string> = {};
    const abbrevFullMap: Record<string, string> = {};

    Object.values(timetable).forEach(daySlots => {
        daySlots.forEach(slot => {
            slot.courses.forEach(course => {
                if (!subjectColorMap[course.title]) {
                    // ✅ Random color based on subject name — consistent per subject
                    subjectColorMap[course.title] = randomSubjectColor(course.title);
                    const abbr = abbreviate(course.title);
                    subjectAbbrevMap[course.title] = abbr;
                    abbrevFullMap[abbr] = course.title;
                }
            });
        });
    });

    // ── Collect unique time slots sorted chronologically ──────────────────────
    const timeSlotSet = new Set<string>();
    Object.values(timetable).forEach(daySlots => {
        daySlots.forEach(slot => timeSlotSet.add(`${slot.startTime}-${slot.endTime}`));
    });

    const allTimeSlots = Array.from(timeSlotSet).sort((a, b) =>
        toMinutes(a.split("-")[0]) - toMinutes(b.split("-")[0])
    );

    const days = [1, 2, 3, 4, 5];

    // ── Table dimensions ──────────────────────────────────────────────────────
    const tableTop = 25;
    const doColW = 12;
    const timeColW = (pageW - margin * 2 - doColW) / allTimeSlots.length;
    const totalRows = days.length + 1;
    const bottomKeyH = 25;
    const rowH = (pageH - tableTop - bottomKeyH - 5) / totalRows;

    // ── Header row — time slots ───────────────────────────────────────────────
    doc.setFillColor(...orange);
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableTop, doColW, rowH, "FD");
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("DO", margin + doColW / 2, tableTop + rowH / 2 + 1, { align: "center" });

    allTimeSlots.forEach((slot, i) => {
        const x = margin + doColW + i * timeColW;
        const [start, end] = slot.split("-");
        doc.setFillColor(...orange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.5);
        doc.rect(x, tableTop, timeColW, rowH, "FD");
        doc.setTextColor(...white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(start, x + timeColW / 2, tableTop + rowH / 2 - 1, { align: "center" });
        doc.text(end, x + timeColW / 2, tableTop + rowH / 2 + 3, { align: "center" });
    });

    // ── Day Order rows ────────────────────────────────────────────────────────
    days.forEach((day, dayIdx) => {
        const y = tableTop + (dayIdx + 1) * rowH;

        doc.setFillColor(...lightOrange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, doColW, rowH, "FD");
        doc.setTextColor(...orange);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(`DO ${day}`, margin + doColW / 2, y + rowH / 2 + 1, { align: "center" });

        allTimeSlots.forEach((slot, i) => {
            const x = margin + doColW + i * timeColW;
            const [start, end] = slot.split("-");
            const daySlots = timetable[day] || [];
            const matchingSlot = daySlots.find(s =>
                s.startTime === start && s.endTime === end
            );

            doc.setFillColor(...white);
            doc.setDrawColor(...black);
            doc.setLineWidth(0.5);
            doc.rect(x, y, timeColW, rowH, "FD");

            if (matchingSlot && matchingSlot.courses.length > 0) {
                const course = matchingSlot.courses[0];
                const color = subjectColorMap[course.title] || [100, 100, 100];
                const abbr = subjectAbbrevMap[course.title] || course.title.substring(0, 3).toUpperCase();

                doc.setFillColor(...color);
                doc.rect(x + 0.8, y + 0.8, timeColW - 1.6, rowH - 1.6, "F");

                doc.setTextColor(...white);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.text(abbr, x + timeColW / 2, y + rowH / 2 - 1.5, { align: "center" });

                doc.setFont("helvetica", "normal");
                doc.setFontSize(5.5);
                doc.text(course.room, x + timeColW / 2, y + rowH / 2 + 3, { align: "center" });
            }
        });
    });

    // ── Subject Key ───────────────────────────────────────────────────────────
    const keyTop = tableTop + totalRows * rowH + 3;
    doc.setFillColor(...lightOrange);
    doc.setDrawColor(...black);
    doc.setLineWidth(0.4);
    doc.rect(margin, keyTop, pageW - margin * 2, bottomKeyH - 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...black);
    doc.text("SUBJECT KEY:", margin + 3, keyTop + 5);

    const entries = Object.entries(abbrevFullMap);
    const itemsPerRow = Math.min(entries.length, 5);
    const colW = (pageW - margin * 2 - 35) / itemsPerRow;

    entries.forEach(([abbr, full], i) => {
        const col = i % itemsPerRow;
        const row = Math.floor(i / itemsPerRow);
        const fx = margin + 35 + col * colW;
        const fy = keyTop + 5 + row * 7;

        const color = Object.entries(subjectColorMap).find(([title]) =>
            subjectAbbrevMap[title] === abbr
        )?.[1] || black;

        doc.setFillColor(...color);
        doc.circle(fx - 3, fy - 1.5, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...black);
        doc.text(`${abbr}:`, fx, fy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(full, fx + 9, fy);
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Clarix — SRM Academia Tracker", pageW / 2, pageH - 1, { align: "center" });

    doc.save(`timetable-${profile?.regNo || "clarix"}.pdf`);
}

export default function TimetablePage() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [exporting, setExporting] = useState(false);

    const { data, loading } = useFetchWithCache<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>,
        "timetable",
        15 * 60 * 1000
    );

    const { data: profileData } = useFetchWithCache<Student>(
        getProfileApi as () => Promise<Student>,
        "profile",
        30 * 24 * 60 * 60 * 1000
    );

    const timetable = data?.timetable ?? {};
    const slots = timetable[selectedDay] ?? [];

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportTimetablePDF(
                data.timetable,
                data.batch,
                data.section,
                profileData as Student | null
            );
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 0" }}>
                <Header
                    title="Timetable"
                    subtitle={new Date().toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                    })}
                />
                <button
                    onClick={handleExport}
                    disabled={exporting || !data}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 12,
                        background: exporting ? "#e2e8f0" : "#ff6f00",
                        color: exporting ? "#94a3b8" : "white",
                        border: "none", cursor: exporting ? "not-allowed" : "pointer",
                        fontSize: 13, fontWeight: 600,
                        boxShadow: exporting ? "none" : "0 2px 8px rgba(255,111,0,0.4)",
                        transition: "all 0.2s",
                        marginTop: 8,
                        whiteSpace: "nowrap",
                    }}
                >
                    <Download size={14} />
                    {exporting ? "Exporting..." : "Export PDF"}
                </button>
            </div>

            {data && (
                <div style={{ padding: "12px 20px 16px", display: "flex", gap: 8 }}>
                    {data.batch && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                            Batch {data.batch}
                        </span>
                    )}
                    {data.section && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}>
                            {data.section}
                        </span>
                    )}
                </div>
            )}

            <div style={{ padding: "0 20px 24px" }}>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Day Order</p>
                <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3, 4, 5].map(day => (
                        <button key={day} onClick={() => setSelectedDay(day)} style={{
                            width: 40, height: 40, borderRadius: "50%", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            border: selectedDay === day ? "none" : "1px solid #e2e8f0",
                            background: selectedDay === day ? "#ff6f00" : "white",
                            color: selectedDay === day ? "white" : "#0f172a",
                            transition: "all 0.2s",
                        }}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {slots.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                        No classes on Day Order {selectedDay}
                    </div>
                ) : (
                    slots.map((slot, index) => (
                        <div key={index} style={{
                            background: "white", borderRadius: 16, padding: "16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
                            display: "flex", alignItems: "flex-start", gap: 16,
                        }}>
                            <div style={{ textAlign: "center", minWidth: 56, paddingTop: 2 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#ff6f00" }}>{slot.startTime}</p>
                                <div style={{ width: 1, height: 16, background: "#e2e8f0", margin: "4px auto" }} />
                                <p style={{ fontSize: 11, color: "#94a3b8" }}>{slot.endTime}</p>
                            </div>
                            <div style={{ width: 1, alignSelf: "stretch", background: "#f1f5f9" }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                                {slot.courses.map((course, ci) => (
                                    <div key={ci}>
                                        {ci > 0 && (
                                            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", margin: "4px 0", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>or</div>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{course.title}</p>
                                                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{course.code}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <span style={{
                                                    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                                                    background: course.type === "Practical" || course.type === "Lab Based Theory" ? "#f5f3ff" : "#fff3e0",
                                                    color: course.type === "Practical" || course.type === "Lab Based Theory" ? "#7c3aed" : "#ff6f00",
                                                }}>
                                                    {course.type === "Lab Based Theory" ? "Lab" : course.type}
                                                </span>
                                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: 500 }}>{course.room}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}