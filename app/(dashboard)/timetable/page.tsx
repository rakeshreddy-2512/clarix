"use client";

import { useState } from "react";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getTimetableApi } from "@/lib/api";
import { getProfileApi } from "@/lib/api";
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

function abbreviate(title: string): string {
    const words = title.split(" ");
    if (words.length <= 1) return title.substring(0, 3).toUpperCase();
    return words.map(w => w[0]).join("").toUpperCase().substring(0, 3);
}

function getAllTimeSlots(timetable: Timetable): string[] {
    const slots = new Set<string>();
    Object.values(timetable).forEach(daySlots => {
        daySlots.forEach(slot => slots.add(`${slot.startTime}-${slot.endTime}`));
    });
    return Array.from(slots).sort((a, b) => {
        const toMin = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return (h < 7 ? h + 12 : h) * 60 + m;
        };
        return toMin(a.split("-")[0]) - toMin(b.split("-")[0]);
    });
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
    const margin = 12;

    // Colors
    const headerBg: [number, number, number] = [29, 78, 216];
    const lightBg: [number, number, number] = [239, 246, 255];
    const borderColor: [number, number, number] = [191, 219, 254];
    const textDark: [number, number, number] = [15, 23, 42];
    const textGray: [number, number, number] = [100, 116, 139];
    const white: [number, number, number] = [255, 255, 255];

    // Header section
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageW, 28, "F");

    doc.setTextColor(...white);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CLARIX — Class Timetable", margin, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (profile?.name) doc.text(`Name: ${profile.name}`, margin, 19);
    if (profile?.regNo) doc.text(`Reg No: ${profile.regNo}`, margin + 70, 19);
    doc.text(`Batch: ${batch}`, margin + 140, 19);
    if (section) doc.text(`Section: ${section}`, margin + 170, 19);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageW - margin - 40, 19);

    // Build abbreviation map
    const abbrevMap: Record<string, string> = {};
    const fullFormMap: Record<string, string> = {};
    Object.values(timetable).forEach(daySlots => {
        daySlots.forEach(slot => {
            slot.courses.forEach(course => {
                if (!abbrevMap[course.title]) {
                    const abbr = abbreviate(course.title);
                    abbrevMap[course.title] = abbr;
                    fullFormMap[abbr] = course.title;
                }
            });
        });
    });

    // Table setup
    const allTimeSlots = getAllTimeSlots(timetable);
    const days = [1, 2, 3, 4, 5];
    const tableTop = 32;
    const colWidths = {
        time: 32,
        day: (pageW - margin * 2 - 32) / 5,
    };
    const rowHeight = (pageH - tableTop - 35) / (allTimeSlots.length + 1);

    // Draw table header row
    let x = margin;
    doc.setFillColor(...headerBg);
    doc.rect(x, tableTop, colWidths.time, rowHeight, "F");
    doc.setTextColor(...white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TIME", x + colWidths.time / 2, tableTop + rowHeight / 2 + 1, { align: "center" });
    x += colWidths.time;

    days.forEach(day => {
        doc.setFillColor(...headerBg);
        doc.rect(x, tableTop, colWidths.day, rowHeight, "F");
        doc.setTextColor(...white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Day ${day}`, x + colWidths.day / 2, tableTop + rowHeight / 2 + 1, { align: "center" });
        x += colWidths.day;
    });

    // Draw data rows
    allTimeSlots.forEach((timeSlot, rowIdx) => {
        const y = tableTop + (rowIdx + 1) * rowHeight;
        let x = margin;

        // Time column
        doc.setFillColor(...lightBg);
        doc.rect(x, y, colWidths.time, rowHeight, "F");
        doc.setDrawColor(...borderColor);
        doc.rect(x, y, colWidths.time, rowHeight, "S");
        doc.setTextColor(...textGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const [start, end] = timeSlot.split("-");
        doc.text(start, x + colWidths.time / 2, y + rowHeight / 2 - 1, { align: "center" });
        doc.text(end, x + colWidths.time / 2, y + rowHeight / 2 + 3, { align: "center" });
        x += colWidths.time;

        // Day columns
        days.forEach(day => {
            const daySlots = timetable[day] || [];
            const matchingSlot = daySlots.find(s => `${s.startTime}-${s.endTime}` === timeSlot);

            // Alternate row colors
            const rowBg = rowIdx % 2 === 0 ? white : [248, 250, 252] as [number, number, number];
            doc.setFillColor(...rowBg);
            doc.rect(x, y, colWidths.day, rowHeight, "F");
            doc.setDrawColor(...borderColor);
            doc.rect(x, y, colWidths.day, rowHeight, "S");

            if (matchingSlot && matchingSlot.courses.length > 0) {
                const course = matchingSlot.courses[0];
                const abbr = abbrevMap[course.title] || course.title.substring(0, 3).toUpperCase();
                const isPractical = course.type === "Practical";

                // Cell background for courses
                doc.setFillColor(isPractical ? 245 : 239, isPractical ? 243 : 246, isPractical ? 255 : 255);
                doc.rect(x + 1, y + 1, colWidths.day - 2, rowHeight - 2, "F");

                doc.setTextColor(...(isPractical ? [124, 58, 237] as [number, number, number] : textDark));
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text(abbr, x + colWidths.day / 2, y + rowHeight / 2 - 1, { align: "center" });

                doc.setFont("helvetica", "normal");
                doc.setFontSize(6);
                doc.setTextColor(...textGray);
                doc.text(course.room, x + colWidths.day / 2, y + rowHeight / 2 + 3, { align: "center" });
            }
            x += colWidths.day;
        });
    });

    // Full forms at bottom
    const fullForms = Object.entries(fullFormMap);
    if (fullForms.length > 0) {
        const bottomY = pageH - 28;
        doc.setFillColor(...lightBg);
        doc.rect(margin, bottomY, pageW - margin * 2, 24, "F");
        doc.setDrawColor(...borderColor);
        doc.rect(margin, bottomY, pageW - margin * 2, 24, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...textDark);
        doc.text("SUBJECT KEY:", margin + 3, bottomY + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...textGray);

        const itemsPerRow = 4;
        const colW = (pageW - margin * 2 - 30) / itemsPerRow;
        fullForms.forEach(([abbr, full], i) => {
            const col = i % itemsPerRow;
            const row = Math.floor(i / itemsPerRow);
            const fx = margin + 30 + col * colW;
            const fy = bottomY + 5 + row * 7;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text(`${abbr}:`, fx, fy);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...textGray);
            doc.text(full, fx + 10, fy);
        });
    }

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...textGray);
    doc.text("Generated by Clarix — SRM Academia Tracker", pageW / 2, pageH - 3, { align: "center" });

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
                        background: exporting ? "#e2e8f0" : "#1d4ed8",
                        color: exporting ? "#94a3b8" : "white",
                        border: "none", cursor: exporting ? "not-allowed" : "pointer",
                        fontSize: 13, fontWeight: 600,
                        boxShadow: exporting ? "none" : "0 2px 8px rgba(29,78,216,0.3)",
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
                            background: selectedDay === day ? "#1d4ed8" : "white",
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
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{slot.startTime}</p>
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
                                                    background: course.type === "Practical" || course.type === "Lab Based Theory" ? "#f5f3ff" : "#eff6ff",
                                                    color: course.type === "Practical" || course.type === "Lab Based Theory" ? "#7c3aed" : "#1d4ed8",
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