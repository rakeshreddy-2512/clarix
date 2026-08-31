"use client";
import { motion } from "framer-motion";
import { AttendanceCourse } from "@/utils/types";
import { PredictorResult } from "@/hooks/usePredictor";

interface Props {
    course: AttendanceCourse;
    result: PredictorResult;
}

// ✅ Calculate how many classes needed to reach 75%
function classesNeededFor75(attended: number, total: number): number {
    // Need attended/total >= 0.75
    // attended + x >= 0.75 * (total + x)
    // attended + x >= 0.75*total + 0.75x
    // 0.25x >= 0.75*total - attended
    // x >= (0.75*total - attended) / 0.25
    const needed = Math.ceil((0.75 * total - attended) / 0.25);
    return needed > 0 ? needed : 0;
}

// ✅ Calculate how many classes can be skipped
function classesCanSkip(attended: number, total: number): number {
    const canSkip = Math.floor((attended - 0.75 * total) / 0.75);
    return canSkip > 0 ? canSkip : 0;
}

export default function PredictResult({ course, result }: Props) {
    const isExcellent = result.futurePercentage > 75;
    const isWarning = result.futurePercentage === 75;
    const isDanger = result.futurePercentage < 75;
    const isPositive = result.delta >= 0;

    const resultColor = isExcellent ? "#16a34a" : isWarning ? "#d97706" : "#dc2626";
    const resultBorder = isExcellent ? "#bbf7d0" : isWarning ? "#fde68a" : "#fecaca";
    const resultBg = isExcellent ? "#f0fdf4" : isWarning ? "#fffbeb" : "#fef2f2";

    // ✅ Calculate margin based on predicted values
    const needed = isDanger ? classesNeededFor75(result.futureAttended, result.futureTotal) : 0;
    const canSkip = (isExcellent || isWarning) ? classesCanSkip(result.futureAttended, result.futureTotal) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: "16px", borderRadius: 16,
                background: "var(--card-bg)",
                border: `1px solid ${resultBorder}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", gap: 12,
            }}
        >
            {/* Course name and code */}
            <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {course.title}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>
                    {course.code} • {course.category}
                </p>
            </div>

            {/* Current → Predicted → Delta */}
            <div style={{
                padding: "12px 14px", borderRadius: 12,
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{course.percentage}%</p>
                </div>
                <div style={{ fontSize: 20, color: "var(--text-muted)" }}>→</div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Predicted</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: resultColor }}>{result.futurePercentage}%</p>
                </div>
                <div style={{
                    padding: "6px 12px", borderRadius: 10,
                    background: resultBg, border: `1px solid ${resultBorder}`,
                    textAlign: "center",
                }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delta</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: resultColor }}>
                        {isPositive ? "+" : ""}{Number.isInteger(result.delta) ? result.delta : result.delta.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* ✅ Classes needed or can skip */}
            <div style={{
                padding: "10px 14px", borderRadius: 12,
                background: resultBg, border: `1px solid ${resultBorder}`,
                display: "flex", alignItems: "center", gap: 8,
            }}>
                <span style={{ fontSize: 16 }}>
                    {isDanger ? "⚠️" : isWarning ? "✅" : "🎉"}
                </span>
                <p style={{ fontSize: 13, fontWeight: 700, color: resultColor }}>
                    {isDanger
                        ? `Attend ${needed} more ${needed === 1 ? "class" : "classes"} to reach 75%`
                        : isWarning
                        ? "You're exactly at 75% — don't miss any class"
                        : `You can skip ${canSkip} more ${canSkip === 1 ? "class" : "classes"}`
                    }
                </p>
            </div>
        </motion.div>
    );
}