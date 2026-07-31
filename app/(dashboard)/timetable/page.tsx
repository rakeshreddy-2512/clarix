"use client";
import { useState, useEffect, useRef } from "react";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getTimetableApi, getProfileApi, getPlannerApi } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import { Download, ChevronDown } from "lucide-react";

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

function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const y = istNow.getFullYear();
    const m = String(istNow.getMonth() + 1).padStart(2, "0");
    const d = String(istNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

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
        if (slotStart < courseEnd && slotEnd > courseStart) covered.push(i);
    });
    return covered;
}

async function drawTimetable(doc: any, timetable: Timetable, batch: number, section: string, profile: Student | null) {
    const pageW = 297, pageH = 210, margin = 5;
    const lightOrange: [number, number, number] = [255, 213, 153];
    const doRowOrange: [number, number, number] = [255, 235, 200];
    const black: [number, number, number] = [0, 0, 0];
    const white: [number, number, number] = [255, 255, 255];
    const lightGray: [number, number, number] = [248, 248, 248];
    const darkText: [number, number, number] = [30, 30, 30];
    const orangeText: [number, number, number] = [200, 90, 0];
    const grayText: [number, number, number] = [100, 100, 100];

    doc.setFillColor(...lightOrange); doc.rect(0, 0, pageW, 20, "F");
    doc.setDrawColor(...black); doc.setLineWidth(0.4); doc.rect(0, 0, pageW, 20, "S");
    doc.setTextColor(...darkText); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("CLARIX — Class Timetable", margin + 2, 8);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    const parts: string[] = [];
    if (profile?.name) parts.push(`Name: ${profile.name}`);
    if (profile?.regNo) parts.push(`Reg No: ${profile.regNo}`);
    parts.push(`Batch: ${batch}`);
    if (section) parts.push(`Section: ${section}`);
    parts.push(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(parts.join("     "), margin + 2, 15);

    const tableTop = 22, doColW = 10;
    const slotColW = (pageW - margin * 2 - doColW) / SRM_SLOTS.length;
    const days = [1, 2, 3, 4, 5];
    const rowH = (pageH - tableTop - 5) / (days.length + 1);

    doc.setFillColor(...lightOrange); doc.setDrawColor(...black); doc.setLineWidth(0.4);
    doc.rect(margin, tableTop, doColW, rowH, "FD");
    doc.setTextColor(...darkText); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    doc.text("DO", margin + doColW / 2, tableTop + rowH / 2 + 1, { align: "center" });

    SRM_SLOTS.forEach((slot, i) => {
        const x = margin + doColW + i * slotColW;
        doc.setFillColor(...lightOrange); doc.setDrawColor(...black); doc.setLineWidth(0.4);
        doc.rect(x, tableTop, slotColW, rowH, "FD");
        doc.setTextColor(...darkText); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
        doc.text(slot.label, x + slotColW / 2, tableTop + rowH / 2 - 2, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(5);
        doc.text(`${slot.start}-${slot.end}`, x + slotColW / 2, tableTop + rowH / 2 + 2, { align: "center" });
    });

    days.forEach((day, dayIdx) => {
        const y = tableTop + (dayIdx + 1) * rowH;
        doc.setFillColor(...doRowOrange); doc.setDrawColor(...black); doc.setLineWidth(0.4);
        doc.rect(margin, y, doColW, rowH, "FD");
        doc.setTextColor(...orangeText); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
        doc.text(`DO ${day}`, margin + doColW / 2, y + rowH / 2 + 1, { align: "center" });
        const bg = dayIdx % 2 === 0 ? white : lightGray;
        SRM_SLOTS.forEach((_, i) => {
            const x = margin + doColW + i * slotColW;
            doc.setFillColor(...bg); doc.setDrawColor(...black); doc.setLineWidth(0.4);
            doc.rect(x, y, slotColW, rowH, "FD");
        });
        const daySlots = timetable[day] || [];
        const filledSlots = new Set<number>();
        daySlots.forEach(slot => {
            if (!slot.courses.length) return;
            const course = slot.courses[0];
            const coveredIndices = getCoveredSlots(slot.startTime, slot.endTime);
            if (coveredIndices.length === 0 || coveredIndices.some(i => filledSlots.has(i))) return;
            coveredIndices.forEach(i => filledSlots.add(i));
            const cellX = margin + doColW + coveredIndices[0] * slotColW;
            const cellW = (coveredIndices[coveredIndices.length - 1] - coveredIndices[0] + 1) * slotColW;
            doc.setFillColor(...bg); doc.setDrawColor(...black); doc.setLineWidth(0.4);
            doc.rect(cellX, y, cellW, rowH, "FD");
            doc.setFillColor(245, 245, 245); doc.rect(cellX + 0.5, y + 0.5, cellW - 1, rowH - 1, "F");
            doc.setTextColor(...darkText); doc.setFont("helvetica", "bold"); doc.setFontSize(5.5);
            const lines = doc.splitTextToSize(course.title, cellW - 3);
            const lineH = 3, totalTextH = lines.length * lineH;
            const startY = y + (rowH - totalTextH) / 2 - 1;
            lines.forEach((line: string, li: number) => doc.text(line, cellX + cellW / 2, startY + li * lineH, { align: "center" }));
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...grayText);
            doc.text(course.room, cellX + cellW / 2, y + rowH - 2.5, { align: "center" });
        });
    });
    doc.setFont("helvetica", "normal"); doc.setFontSize(5); doc.setTextColor(150, 150, 150);
    doc.text("Generated by Clarix — SRM Academia Tracker", pageW / 2, pageH - 1, { align: "center" });
}

async function exportTimetablePDF(timetable: Timetable, batch: number, section: string, profile: Student | null) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    await drawTimetable(doc, timetable, batch, section, profile);
    doc.save(`timetable-${profile?.regNo || "clarix"}.pdf`);
}

// ✅ JPEG — draw directly to canvas
async function exportTimetableJPEG(timetable: Timetable, batch: number, section: string, profile: Student | null) {
    const scale = 4;
    const pageW = 297 * scale, pageH = 210 * scale, margin = 5 * scale;
    const canvas = document.createElement("canvas");
    canvas.width = pageW; canvas.height = pageH;
    const ctx = canvas.getContext("2d")!;

    const drawRect = (x: number, y: number, w: number, h: number, fill: string) => {
        ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 0.4 * scale; ctx.strokeRect(x, y, w, h);
    };

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, pageW, pageH);

    // Header
    drawRect(0, 0, pageW, 20 * scale, "#ffd599");
    ctx.fillStyle = "#1e1e1e";
    ctx.font = `bold ${Math.round(13 * scale * 0.35)}px Helvetica`;
    ctx.textAlign = "left";
    ctx.fillText("CLARIX — Class Timetable", margin + 2 * scale, 9 * scale);
    ctx.font = `${Math.round(7 * scale * 0.35)}px Helvetica`;
    const parts: string[] = [];
    if (profile?.name) parts.push(`Name: ${profile.name}`);
    if (profile?.regNo) parts.push(`Reg No: ${profile.regNo}`);
    parts.push(`Batch: ${batch}`);
    if (section) parts.push(`Section: ${section}`);
    parts.push(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    ctx.fillText(parts.join("     "), margin + 2 * scale, 16 * scale);

    const tableTop = 22 * scale, doColW = 10 * scale;
    const slotColW = (pageW - margin * 2 - doColW) / SRM_SLOTS.length;
    const days = [1, 2, 3, 4, 5];
    const rowH = (pageH - tableTop - 5 * scale) / (days.length + 1);
    const fs = (n: number) => `${Math.round(n * scale * 0.35)}px`;

    // DO header
    drawRect(margin, tableTop, doColW, rowH, "#ffd599");
    ctx.fillStyle = "#1e1e1e"; ctx.font = `bold ${fs(6)}`; ctx.textAlign = "center";
    ctx.fillText("DO", margin + doColW / 2, tableTop + rowH / 2 + 2 * scale);

    // Slot headers
    SRM_SLOTS.forEach((slot, i) => {
        const x = margin + doColW + i * slotColW;
        drawRect(x, tableTop, slotColW, rowH, "#ffd599");
        ctx.fillStyle = "#1e1e1e"; ctx.font = `bold ${fs(5.5)}`; ctx.textAlign = "center";
        ctx.fillText(slot.label, x + slotColW / 2, tableTop + rowH / 2 - 1 * scale);
        ctx.font = fs(5);
        ctx.fillText(`${slot.start}-${slot.end}`, x + slotColW / 2, tableTop + rowH / 2 + 3 * scale);
    });

    // Day rows
    days.forEach((day, dayIdx) => {
        const y = tableTop + (dayIdx + 1) * rowH;
        drawRect(margin, y, doColW, rowH, "#ffebb8");
        ctx.fillStyle = "#c85a00"; ctx.font = `bold ${fs(6.5)}`; ctx.textAlign = "center";
        ctx.fillText(`DO ${day}`, margin + doColW / 2, y + rowH / 2 + 2 * scale);

        const bg = dayIdx % 2 === 0 ? "#ffffff" : "#f8f8f8";
        SRM_SLOTS.forEach((_, i) => drawRect(margin + doColW + i * slotColW, y, slotColW, rowH, bg));

        const daySlots = timetable[day] || [];
        const filledSlots = new Set<number>();
        daySlots.forEach(slot => {
            if (!slot.courses.length) return;
            const course = slot.courses[0];
            const coveredIndices = getCoveredSlots(slot.startTime, slot.endTime);
            if (coveredIndices.length === 0 || coveredIndices.some(i => filledSlots.has(i))) return;
            coveredIndices.forEach(i => filledSlots.add(i));
            const cellX = margin + doColW + coveredIndices[0] * slotColW;
            const cellW = (coveredIndices[coveredIndices.length - 1] - coveredIndices[0] + 1) * slotColW;
            drawRect(cellX, y, cellW, rowH, bg);
            ctx.fillStyle = "#f5f5f5";
            ctx.fillRect(cellX + 0.5 * scale, y + 0.5 * scale, cellW - 1 * scale, rowH - 1 * scale);

            // Title with wrapping
            ctx.fillStyle = "#1e1e1e"; ctx.font = `bold ${fs(5.5)}`; ctx.textAlign = "center";
            const words = course.title.split(" ");
            const linesArr: string[] = [];
            let current = "";
            words.forEach(word => {
                const test = current ? `${current} ${word}` : word;
                if (ctx.measureText(test).width > cellW - 4 * scale && current) {
                    linesArr.push(current); current = word;
                } else { current = test; }
            });
            if (current) linesArr.push(current);
            const lineH = parseInt(fs(5.5)) * 1.3;
            const totalH = linesArr.length * lineH;
            const startY = y + (rowH - totalH) / 2 + parseInt(fs(5.5));
            linesArr.forEach((line, li) => ctx.fillText(line, cellX + cellW / 2, startY + li * lineH));

            // Room
            ctx.fillStyle = "#646464"; ctx.font = fs(5);
            ctx.fillText(course.room, cellX + cellW / 2, y + rowH - 2.5 * scale);
        });
    });

    // Footer
    ctx.fillStyle = "#969696"; ctx.font = fs(5); ctx.textAlign = "center";
    ctx.fillText("Generated by Clarix — SRM Academia Tracker", pageW / 2, pageH - 1 * scale);

    // ✅ Download
    const link = document.createElement("a");
    link.download = `timetable-${profile?.regNo || "clarix"}.jpeg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
}

export default function TimetablePage() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data, loading } = useFetchWithCache<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>,
        "timetable", 15 * 60 * 1000
    );
    const { data: profileData } = useFetchWithCache<Student>(
        getProfileApi as () => Promise<Student>,
        "profile", 30 * 24 * 60 * 60 * 1000
    );
    const { data: plannerData } = useFetchWithCache<PlannerData>(
        getPlannerApi as () => Promise<PlannerData>,
        "planner", 15 * 60 * 1000
    );

    useEffect(() => {
        if (plannerData?.map) {
            const todayDayOrder = plannerData.map[getTodayIST()]?.dayOrder;
            if (todayDayOrder) setSelectedDay(todayDayOrder);
        }
    }, [plannerData]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const timetable = data?.timetable ?? {};
    const slots = timetable[selectedDay] ?? [];

    const handleExport = async (format: "pdf" | "jpeg") => {
        if (!data) return;
        setShowMenu(false);
        setExporting(true);
        try {
            if (format === "pdf") {
                await exportTimetablePDF(data.timetable, data.batch, data.section, profileData as Student | null);
            } else {
                await exportTimetableJPEG(data.timetable, data.batch, data.section, profileData as Student | null);
            }
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <LoadingScreen />;
    const todayDayOrder = plannerData?.map?.[getTodayIST()]?.dayOrder;

    return (
        <PageWrapper>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 0" }}>
                <Header
                    title="Timetable"
                    subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                />
                <div ref={menuRef} style={{ position: "relative", marginTop: 8 }}>
                    <button
                        onClick={() => setShowMenu(prev => !prev)}
                        disabled={exporting || !data}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 12,
                            background: exporting ? "#e2e8f0" : "#ff6f00",
                            color: exporting ? "#94a3b8" : "white",
                            border: "none", cursor: exporting ? "not-allowed" : "pointer",
                            fontSize: 13, fontWeight: 600,
                            boxShadow: exporting ? "none" : "0 2px 8px rgba(255,111,0,0.4)",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                    >
                        <Download size={14} />
                        {exporting ? "Exporting..." : "Export"}
                        <ChevronDown size={13} style={{ marginLeft: 2 }} />
                    </button>
                    {showMenu && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 8px)", right: 0,
                            background: "white", borderRadius: 12,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                            border: "1px solid #e2e8f0", overflow: "hidden", zIndex: 100, minWidth: 140,
                        }}>
                            {(["pdf", "jpeg"] as const).map((fmt, idx) => (
                                <button
                                    key={fmt}
                                    onClick={() => handleExport(fmt)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        width: "100%", padding: "12px 16px",
                                        background: "none", border: "none",
                                        cursor: "pointer", fontSize: 13, fontWeight: 600,
                                        color: "#0f172a", textAlign: "left",
                                        borderBottom: idx === 0 ? "1px solid #f1f5f9" : "none",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#fff3e0")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                >
                                    {fmt === "pdf" ? "📄 PDF" : "🖼️ JPEG"}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
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
                            transition: "all 0.2s", position: "relative",
                        }}>
                            {day}
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