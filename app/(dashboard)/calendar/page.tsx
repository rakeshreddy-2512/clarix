"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { getPlannerApi } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";

interface PlannerDay {
    date: string;
    dayOrder: number | null;
    note: string;
}

interface PlannerData {
    map: Record<string, PlannerDay>;
    semester: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DO_COLORS: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    2: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
    3: { bg: "#fefce8", color: "#a16207", border: "#fde047" },
    4: { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
    5: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

export default function CalendarPage() {
    const { data, loading } = useFetch<PlannerData>(
        getPlannerApi as () => Promise<PlannerData>
    );

    const [selectedMonth, setSelectedMonth] = useState<string>("");

    const today = new Date().toISOString().substring(0, 7);

    const months = data ? [...new Set(
        Object.keys(data.map).map(d => d.substring(0, 7))
    )].sort() : [];

    // Auto-select current month if available, otherwise last month in planner
    const activeMonth = selectedMonth || (months.includes(today) ? today : months[months.length - 1] || "");

    if (loading) return <LoadingScreen />;

    const currentMonthDays = data
        ? Object.values(data.map)
            .filter(d => d.date.startsWith(activeMonth))
            .sort((a, b) => a.date.localeCompare(b.date))
        : [];

    return (
        <PageWrapper>
            <Header title="Calendar" subtitle={data?.semester || "Academic Planner"} />

            {/* Month selector */}
            <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
                <div style={{ display: "flex", gap: 8, width: "max-content" }}>
                    {months.map(m => {
                        const [y, mo] = m.split("-");
                        const label = `${MONTH_NAMES[parseInt(mo) - 1].substring(0, 3)} '${y.slice(2)}`;
                        return (
                            <button
                                key={m}
                                onClick={() => setSelectedMonth(m)}
                                style={{
                                    padding: "6px 14px", borderRadius: 20, fontSize: 13,
                                    fontWeight: 600, cursor: "pointer",
                                    background: activeMonth === m ? "#1d4ed8" : "#f1f5f9",
                                    color: activeMonth === m ? "#fff" : "#64748b",
                                    border: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div style={{ padding: "0 20px 100px" }}>
                <div style={{
                    borderRadius: 16, overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                    {/* Table header */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "60px 60px 1fr 80px",
                        background: "#1d4ed8",
                        padding: "12px 16px",
                    }}>
                        {["Date", "Day", "Event", "Day Order"].map(h => (
                            <div key={h} style={{
                                fontSize: 12, fontWeight: 700,
                                color: "#ffffff", textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Table rows */}
                    {currentMonthDays.map((day, i) => {
                        const date = new Date(day.date + "T00:00:00");
                        const dayOfWeek = DAY_NAMES[date.getDay()];
                        const dateNum = date.getDate();
                        const todayStr = new Date().toISOString().split("T")[0];
                        const isToday = day.date === todayStr;
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const doColors = day.dayOrder ? DO_COLORS[day.dayOrder] : null;
                        const isHoliday = !day.dayOrder && day.note;

                        return (
                            <div
                                key={day.date}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "60px 60px 1fr 80px",
                                    padding: "12px 16px",
                                    alignItems: "center",
                                    background: isToday
                                        ? "#eff6ff"
                                        : i % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    borderTop: "1px solid #f1f5f9",
                                    borderLeft: isToday ? "3px solid #1d4ed8" : "3px solid transparent",
                                }}
                            >
                                {/* Date */}
                                <div style={{
                                    fontSize: 14, fontWeight: isToday ? 800 : 600,
                                    color: isToday ? "#1d4ed8" : isWeekend ? "#94a3b8" : "#0f172a",
                                }}>
                                    {String(dateNum).padStart(2, "0")}
                                </div>

                                {/* Day */}
                                <div style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: isWeekend ? "#94a3b8" : "#64748b",
                                }}>
                                    {dayOfWeek}
                                </div>

                                {/* Event */}
                                <div style={{
                                    fontSize: 13, fontWeight: day.note ? 600 : 400,
                                    color: isHoliday ? "#dc2626" : day.note ? "#0f172a" : "#94a3b8",
                                }}>
                                    {day.note || (isWeekend ? "Weekend" : day.dayOrder ? "Regular Classes" : "-")}
                                </div>

                                {/* Day Order */}
                                <div>
                                    {day.dayOrder ? (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            padding: "3px 10px", borderRadius: 20,
                                            background: doColors?.bg,
                                            color: doColors?.color,
                                            border: `1px solid ${doColors?.border}`,
                                        }}>
                                            DO {day.dayOrder}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageWrapper>
    );
}