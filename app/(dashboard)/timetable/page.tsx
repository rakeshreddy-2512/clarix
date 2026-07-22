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

    // Colors
    const lightOrange: [number, number, number] = [255, 213, 153]; // light orange for header + time slots
    const doRowOrange: [number, number, number] = [255, 235, 200]; // very light orange for DO column
    const black: [number, number, number] = [0, 0, 0];
    const white: [number, number, number] = [255, 255, 255];
    const lightGray: [number, number, number] = [248, 248, 248];
    const darkText: [number, number, number] = [30, 30, 30];
    const orangeText: [number, number, number] = [200, 90, 0];

    // ── Header ───────────────────────────────────────────────────────────────
    doc.setFillColor(...lightOrange);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.rect(0, 0, pageW, 22, "S");

    doc.setTextColor(...darkText);
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
    const rowH = (pageH - tableTop - 8) / totalRows;

    // ── Header row — DO + time slots ─────────────────────────────────────────
    // DO header cell
    doc.setFillColor(...lightOrange);
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableTop, doColW, rowH, "FD");
    doc.setTextColor(...darkText);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("DO", margin + doColW / 2, tableTop + rowH / 2 + 1, { align: "center" });

    // Time slot header cells
    allTimeSlots.forEach((slot, i) => {
        const x = margin + doColW + i * timeColW;
        const [start, end] = slot.split("-");
        doc.setFillColor(...lightOrange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.5);
        doc.rect(x, tableTop, timeColW, rowH, "FD");
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(start, x + timeColW / 2, tableTop + rowH / 2 - 1, { align: "center" });
        doc.text(end, x + timeColW / 2, tableTop + rowH / 2 + 3, { align: "center" });
    });

    // ── Day Order rows ────────────────────────────────────────────────────────
    days.forEach((day, dayIdx) => {
        const y = tableTop + (dayIdx + 1) * rowH;

        // DO cell
        doc.setFillColor(...doRowOrange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, doColW, rowH, "FD");
        doc.setTextColor(...orangeText);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(`DO ${day}`, margin + doColW / 2, y + rowH / 2 + 1, { align: "center" });

        // Subject cells
        allTimeSlots.forEach((slot, i) => {
            const x = margin + doColW + i * timeColW;
            const [start, end] = slot.split("-");
            const daySlots = timetable[day] || [];
            const matchingSlot = daySlots.find(s =>
                s.startTime === start && s.endTime === end
            );

            // Alternate row background
            const bg = dayIdx % 2 === 0 ? white : lightGray;
            doc.setFillColor(...bg);
            doc.setDrawColor(...black);
            doc.setLineWidth(0.5);
            doc.rect(x, y, timeColW, rowH, "FD");

            if (matchingSlot && matchingSlot.courses.length > 0) {
                const course = matchingSlot.courses[0];

                // Full subject name with word wrap
                doc.setTextColor(...darkText);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(6);

                const maxWidth = timeColW - 3;
                const lines = doc.splitTextToSize(course.title, maxWidth);
                const lineH = 3.5;
                const totalTextH = lines.length * lineH;
                const startY = y + (rowH - totalTextH) / 2 + lineH * 0.8;

                lines.forEach((line: string, li: number) => {
                    doc.text(line, x + timeColW / 2, startY + li * lineH, { align: "center" });
                });

                // Room below title
                doc.setFont("helvetica", "normal");
                doc.setFontSize(5);
                doc.setTextColor(100, 100, 100);
                doc.text(course.room, x + timeColW / 2, y + rowH - 2.5, { align: "center" });
            }
        });
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