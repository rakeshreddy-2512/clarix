"use client";
import { useState, useEffect } from "react";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getTimetableApi, getProfileApi, getPlannerApi } from "@/lib/api";
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
interface PlannerDay {
    date: string; dayOrder: number | null; note: string;
}
interface PlannerData {
    map: Record<string, PlannerDay>; semester: string;
}

// ✅ Get today's date in IST
function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const y = istNow.getFullYear();
    const m = String(istNow.getMonth() + 1).padStart(2, "0");
    const d = String(istNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// ✅ 12 Fixed SRM time slots
const SRM_SLOTS = [
    { label: "Slot 1",  start: "08:00", end: "08:50" },
    { label: "Slot 2",  start: "08:50", end: "09:40" },
    { label: "Slot 3",  start: "09:45", end: "10:35" },
    { label: "Slot 4",  start: "10:40", end: "11:30" },
    { label: "Slot 5",  start: "11:35", end: "12:25" },
    { label: "Slot 6",  start: "12:30", end: "01:20" },
    { label: "Slot 7",  start: "01:25", end: "02:15" },
    { label: "Slot 8",  start: "02:20", end: "03:10" },
    { label: "Slot 9",  start: "03:10", end: "04:00" },
    { label: "Slot 10", start: "04:00", end: "04:50" },
    { label: "Slot 11", start: "04:50", end: "05:30" },
    { label: "Slot 12", start: "05:30", end: "06:10" },
];

function getCoveredSlots(startTime: string, endTime: string): number[] {
    const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return (h < 7 ? h + 12 : h) * 60 + m;
    };
    const courseStart = toMin(startTime);
    const courseEnd = toMin(endTime);
    const covered: number[] = [];
    SRM_SLOTS.forEach((slot, i) => {
        const slotStart = toMin(slot.start);
        const slotEnd = toMin(slot.end);
        if (slotStart < courseEnd && slotEnd > courseStart) {
            covered.push(i);
        }
    });
    return covered;
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
    const margin = 5;
    const lightOrange: [number, number, number] = [255, 213, 153];
    const doRowOrange: [number, number, number] = [255, 235, 200];
    const black: [number, number, number] = [0, 0, 0];
    const white: [number, number, number] = [255, 255, 255];
    const lightGray: [number, number, number] = [248, 248, 248];
    const darkText: [number, number, number] = [30, 30, 30];
    const orangeText: [number, number, number] = [200, 90, 0];
    const grayText: [number, number, number] = [100, 100, 100];

    doc.setFillColor(...lightOrange);
    doc.rect(0, 0, pageW, 20, "F");
    doc.setDrawColor(...black);
    doc.setLineWidth(0.4);
    doc.rect(0, 0, pageW, 20, "S");
    doc.setTextColor(...darkText);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("CLARIX — Class Timetable", margin + 2, 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const parts: string[] = [];
    if (profile?.name) parts.push(`Name: ${profile.name}`);
    if (profile?.regNo) parts.push(`Reg No: ${profile.regNo}`);
    parts.push(`Batch: ${batch}`);
    if (section) parts.push(`Section: ${section}`);
    parts.push(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(parts.join("     "), margin + 2, 15);

    const tableTop = 22;
    const doColW = 10;
    const slotColW = (pageW - margin * 2 - doColW) / SRM_SLOTS.length;
    const days = [1, 2, 3, 4, 5];
    const totalRows = days.length + 1;
    const rowH = (pageH - tableTop - 5) / totalRows;

    doc.setFillColor(...lightOrange);
    doc.setDrawColor(...black);
    doc.setLineWidth(0.4);
    doc.rect(margin, tableTop, doColW, rowH, "FD");
    doc.setTextColor(...darkText);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("DO", margin + doColW / 2, tableTop + rowH / 2 + 1, { align: "center" });

    SRM_SLOTS.forEach((slot, i) => {
        const x = margin + doColW + i * slotColW;
        doc.setFillColor(...lightOrange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.4);
        doc.rect(x, tableTop, slotColW, rowH, "FD");
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.text(slot.label, x + slotColW / 2, tableTop + rowH / 2 - 2, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5);
        doc.text(`${slot.start}-${slot.end}`, x + slotColW / 2, tableTop + rowH / 2 + 2, { align: "center" });
    });

    days.forEach((day, dayIdx) => {
        const y = tableTop + (dayIdx + 1) * rowH;
        doc.setFillColor(...doRowOrange);
        doc.setDrawColor(...black);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, doColW, rowH, "FD");
        doc.setTextColor(...orangeText);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text(`DO ${day}`, margin + doColW / 2, y + rowH / 2 + 1, { align: "center" });

        const bg = dayIdx % 2 === 0 ? white : lightGray;
        SRM_SLOTS.forEach((_, i) => {
            const x = margin + doColW + i * slotColW;
            doc.setFillColor(...bg);
            doc.setDrawColor(...black);
            doc.setLineWidth(0.4);
            doc.rect(x, y, slotColW, rowH, "FD");
        });

        const daySlots = timetable[day] || [];
        const filledSlots = new Set<number>();
        daySlots.forEach(slot => {
            if (!slot.courses.length) return;
            const course = slot.courses[0];
            const coveredIndices = getCoveredSlots(slot.startTime, slot.endTime);
            if (coveredIndices.length === 0) return;
            if (coveredIndices.some(i => filledSlots.has(i))) return;
            coveredIndices.forEach(i => filledSlots.add(i));
            const firstIdx = coveredIndices[0];
            const lastIdx = coveredIndices[coveredIndices.length - 1];
            const cellX = margin + doColW + firstIdx * slotColW;
            const cellW = (lastIdx - firstIdx + 1) * slotColW;
            doc.setFillColor(...bg);
            doc.setDrawColor(...black);
            doc.setLineWidth(0.4);
            doc.rect(cellX, y, cellW, rowH, "FD");
            doc.setFillColor(245, 245, 245);
            doc.rect(cellX + 0.5, y + 0.5, cellW - 1, rowH - 1, "F");
            doc.setTextColor(...darkText);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(5.5);
            const maxWidth = cellW - 3;
            const lines = doc.splitTextToSize(course.title, maxWidth);
            const lineH = 3;
            const totalTextH = lines.length * lineH;
            const startY = y + (rowH - totalTextH) / 2 - 1;
            lines.forEach((line: string, li: number) => {
                doc.text(line, cellX + cellW / 2, startY + li * lineH, { align: "center" });
            });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...grayText);
            doc.text(course.room, cellX + cellW / 2, y + rowH - 2.5, { align: "center" });
        });
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
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

    const { data: plannerData } = useFetchWithCache<PlannerData>(
        getPlannerApi as () => Promise<PlannerData>,
        "planner",
        15 * 60 * 1000
    );

    // ✅ Auto-select today's day order
    useEffect(() => {
        if (plannerData?.map) {
            const today = getTodayIST();
            const todayDayOrder = plannerData.map[today]?.dayOrder;
            if (todayDayOrder) {
                setSelectedDay(todayDayOrder);
            }
        }
    }, [plannerData]);

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

    // ✅ Get today's day order for badge
    const todayDayOrder = plannerData?.map?.[getTodayIST()]?.dayOrder;

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
                    {/* ✅ Today's day order badge */}
                    {todayDayOrder && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#fff3e0", color: "#ff6f00", border: "1px solid #ffcc80" }}>
                            Today: DO {todayDayOrder}
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
                            position: "relative",
                        }}>
                            {day}
                            {/* ✅ Today indicator dot */}
                            {todayDayOrder === day && (
                                <span style={{
                                    position: "absolute", top: 2, right: 2,
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: selectedDay === day ? "white" : "#ff6f00",
                                }} />
                            )}
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