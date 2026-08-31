"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttendanceCourse } from "@/utils/types";
import { usePredictor, PlannerDay } from "@/hooks/usePredictor";
import { useFetch } from "@/hooks/useFetch";
import { getPlannerApi } from "@/lib/api";
import PredictResult from "./PredictResult";
import { TrendingUp } from "lucide-react";

interface PlannerData {
    map: Record<string, PlannerDay>;
    semester: string;
}

const SLOT_DAY_ORDERS: Record<string, number[]> = {
    A: [1, 2, 3], B: [2, 3, 4], C: [3, 4, 5],
    D: [3, 4, 5], E: [4, 5], F: [1, 5], G: [1, 2],
    P6: [1], P7: [1], P8: [1], P9: [1], P10: [1],
    P11: [2], P12: [2], P13: [2], P14: [2], P15: [2],
    P26: [3], P27: [3], P28: [3], P29: [3], P30: [3],
    P31: [4], P32: [4], P33: [4], P34: [4], P35: [4],
    P46: [5], P47: [5], P48: [5], P49: [5], P50: [5],
    L11: [1], L12: [1], L21: [2], L22: [2],
    L31: [3], L32: [3], L41: [4], L42: [4], L51: [5], L52: [5],
};

const SLOT_DAY_ORDERS_BATCH2: Record<string, number[]> = {
    A: [1, 2, 3], B: [2, 3, 4], C: [3, 4, 5],
    D: [1, 3, 4, 5], E: [4, 5], F: [1, 5], G: [1, 2],
    P1: [1], P2: [1], P3: [1], P4: [1], P5: [1],
    P16: [2], P17: [2], P18: [2], P19: [2], P20: [2],
    P21: [3], P22: [3], P23: [3], P24: [3], P25: [3],
    P36: [4], P37: [4], P38: [4], P39: [4], P40: [4],
    P41: [5], P42: [5], P43: [5], P44: [5], P45: [5],
    L11: [1], L12: [1], L21: [2], L22: [2],
    L31: [3], L32: [3], L41: [4], L42: [4], L51: [5], L52: [5],
};

function localDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function countFutureClasses(
    slot: string,
    fromDate: string,
    toDate: string,
    plannerMap: Record<string, PlannerDay>,
    category: string,
    batch: number = 1
): number {
    const slotMap = batch === 2 ? SLOT_DAY_ORDERS_BATCH2 : SLOT_DAY_ORDERS;
    if (Object.keys(plannerMap).length > 0 && slot) {
        const slots = slot.split(",").map(s => s.trim().toUpperCase());
        const dayOrdersSet = new Set<number>();
        slots.forEach(s => {
            (slotMap[s] || []).forEach(d => dayOrdersSet.add(d));
        });
        const dayOrders = Array.from(dayOrdersSet);
        let count = 0;
        const current = parseLocalDate(fromDate);
        const end = parseLocalDate(toDate);
        while (current <= end) {
            const dateStr = localDateStr(current);
            const plannerDay = plannerMap[dateStr];
            if (plannerDay?.dayOrder && dayOrders.includes(plannerDay.dayOrder)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    } else {
        let businessDays = 0;
        const current = parseLocalDate(fromDate);
        const end = parseLocalDate(toDate);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) businessDays++;
            current.setDate(current.getDate() + 1);
        }
        const classesPerWeek = category === "Practical" ? 1 : 3;
        return Math.round((businessDays / 5) * classesPerWeek);
    }
}

export default function PredictorForm({ courses, batch = 1 }: { courses: AttendanceCourse[]; batch?: number }) {
    const [selectedCourse, setSelectedCourse] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [willAttend, setWillAttend] = useState(true);
    const [showResult, setShowResult] = useState(false);

    const { data: plannerData } = useFetch<PlannerData>(
        getPlannerApi as () => Promise<PlannerData>
    );

    const plannerMap = plannerData?.map || {};
    const isAllSubjects = selectedCourse === "ALL";
    const course = courses.find((c) => c.code === selectedCourse);
    const result = usePredictor(
        isAllSubjects ? undefined : course,
        fromDate,
        toDate,
        willAttend,
        plannerMap,
        batch
    );

    const allSubjectsResults = isAllSubjects && fromDate && toDate
        ? courses.map(c => {
            const from = parseLocalDate(fromDate);
            const to = parseLocalDate(toDate);
            if (from > to) return null;

            const futureClasses = countFutureClasses(
                c.slot || "",
                fromDate,
                toDate,
                plannerMap,
                c.category,
                batch
            );

            const currentPercentage = c.totalClasses > 0 ? c.percentage : 0;

            if (futureClasses === 0) {
                return { course: c, futurePercentage: currentPercentage, delta: 0, futureClasses: 0, currentPercentage };
            }

            const futureTotal = c.totalClasses + futureClasses;
            const futureAttendedTotal = c.attended + (willAttend ? futureClasses : 0);
            const futurePercentage = futureTotal > 0
                ? Math.round((futureAttendedTotal / futureTotal) * 100)
                : 0;
            const delta = Math.round((futurePercentage - currentPercentage) * 100) / 100;

            return { course: c, futurePercentage, delta, futureClasses, currentPercentage };
        }).filter(Boolean)
        : [];

    const inputStyle: React.CSSProperties = {
        background: "var(--bg-primary)",
        border: "1.5px solid #e2e8f0",
        borderRadius: 12,
        color: "var(--text-primary)",
        padding: "13px 16px",
        fontSize: 14,
        width: "100%",
        outline: "none",
        fontWeight: 500,
        transition: "all 0.2s",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 700,
        color: "var(--text-muted)", marginBottom: 8,
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    };

    return (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Course selector */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <label style={labelStyle}>Select Course</label>
                <select
                    value={selectedCourse}
                    onChange={(e) => { setSelectedCourse(e.target.value); setShowResult(false); }}
                    style={{ ...inputStyle, cursor: "pointer" }}
                >
                    <option value="">Choose a course...</option>
                    <option value="ALL">📊 All Subjects</option>
                    {courses.map((c) => (
                        <option key={`${c.code}-${c.category}`} value={c.code}>
                            {c.title} ({c.category})
                        </option>
                    ))}
                </select>
            </motion.div>

            {/* Date range */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
                <div>
                    <label style={labelStyle}>From Date</label>
                    <input type="date" value={fromDate}
                        onChange={(e) => { setFromDate(e.target.value); setShowResult(false); }}
                        style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>To Date</label>
                    <input type="date" value={toDate}
                        onChange={(e) => { setToDate(e.target.value); setShowResult(false); }}
                        style={inputStyle} />
                </div>
            </motion.div>

            {/* Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 18px", borderRadius: 16,
                    background: "var(--card-bg)", border: "1px solid var(--border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
            >
                <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Will you attend?</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
                        Toggle to see impact
                    </p>
                </div>
                <button
                    onClick={() => { setWillAttend(!willAttend); setShowResult(false); }}
                    style={{
                        width: 48, height: 26, borderRadius: 999,
                        border: "none", cursor: "pointer",
                        background: willAttend ? "#1d4ed8" : "#e2e8f0",
                        position: "relative", transition: "background 0.2s",
                        flexShrink: 0,
                    }}
                >
                    <motion.div
                        animate={{ x: willAttend ? 24 : 2 }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        style={{
                            position: "absolute", top: 3,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "var(--card-bg)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                    />
                </button>
            </motion.div>

            {/* Predict button */}
            <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { if (!selectedCourse || !fromDate || !toDate) return; setShowResult(true); }}
                disabled={!selectedCourse || !fromDate || !toDate}
                style={{
                    width: "100%", padding: "15px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    borderRadius: 14, border: "none",
                    fontSize: 15, fontWeight: 700,
                    background: (!selectedCourse || !fromDate || !toDate)
                        ? "#f1f5f9"
                        : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                    color: (!selectedCourse || !fromDate || !toDate) ? "#94a3b8" : "#ffffff",
                    cursor: (!selectedCourse || !fromDate || !toDate) ? "not-allowed" : "pointer",
                    boxShadow: (!selectedCourse || !fromDate || !toDate)
                        ? "none"
                        : "0 4px 20px rgba(29,78,216,0.35)",
                }}
            >
                <TrendingUp size={17} />
                {isAllSubjects ? "Predict All Subjects" : "Predict Attendance"}
            </motion.button>

            {/* ✅ Note about optional classes */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    fontSize: 12, color: "#92400e", fontWeight: 500,
                    lineHeight: 1.6,
                }}
            >
                ⚠️ <b>Note:</b> If any subject has an optional class within your selected date range, use <b>single subject prediction</b> for more accurate results instead of All Subjects.
            </motion.div>

            {/* Single course result */}
            {showResult && !isAllSubjects && course && result && (
                <PredictResult course={course} result={result} />
            )}

            {/* All subjects result */}
            {showResult && isAllSubjects && (
                <AnimatePresence>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                            Prediction for all {courses.length} subjects:
                        </p>
                        {allSubjectsResults.map((item, i) => {
                            if (!item) return null;
                            const { course: c, futurePercentage, delta, currentPercentage } = item;
                            const isExcellent = futurePercentage > 75;
                            const isWarning = futurePercentage === 75;
                            const resultColor = isExcellent ? "#16a34a" : isWarning ? "#d97706" : "#dc2626";
                            const resultBorder = isExcellent ? "#bbf7d0" : isWarning ? "#fde68a" : "#fecaca";
                            const resultBg = isExcellent ? "#f0fdf4" : isWarning ? "#fffbeb" : "#fef2f2";
                            const isPositive = delta >= 0;

                            return (
                                <motion.div
                                    key={`${c.code}-${c.category}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{
                                        padding: "16px", borderRadius: 16,
                                        background: "var(--card-bg)",
                                        border: `1px solid ${resultBorder}`,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                        display: "flex", flexDirection: "column", gap: 12,
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                                            {c.title}
                                        </p>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                                            {c.code} • {c.category}
                                        </p>
                                    </div>

                                    <div style={{
                                        padding: "12px 14px", borderRadius: 12,
                                        background: "var(--bg-primary)", border: "1px solid var(--border)",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                    }}>
                                        <div style={{ textAlign: "center" }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</p>
                                            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{currentPercentage}%</p>
                                        </div>

                                        <div style={{ fontSize: 20, color: "var(--text-muted)" }}>→</div>

                                        <div style={{ textAlign: "center" }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Predicted</p>
                                            <p style={{ fontSize: 24, fontWeight: 800, color: resultColor }}>{futurePercentage}%</p>
                                        </div>

                                        <div style={{
                                            padding: "6px 12px", borderRadius: 10,
                                            background: resultBg, border: `1px solid ${resultBorder}`,
                                            textAlign: "center",
                                        }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delta</p>
                                            <p style={{ fontSize: 16, fontWeight: 800, color: resultColor }}>
                                                {isPositive ? "+" : ""}{Number.isInteger(delta) ? delta : delta.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}