"use client";

import { motion } from "framer-motion";
import { AttendanceCourse } from "@/utils/types";
import { PredictorResult } from "@/hooks/usePredictor";

interface Props {
    course: AttendanceCourse;
    result: PredictorResult;
}

export default function PredictResult({ course, result }: Props) {
    const isExcellent = result.futurePercentage > 75;
    const isWarning = result.futurePercentage === 75;
    const isPositive = result.delta >= 0;

    const resultColor = isExcellent ? "#16a34a" : isWarning ? "#d97706" : "#dc2626";
    const resultBorder = isExcellent ? "#bbf7d0" : isWarning ? "#fde68a" : "#fecaca";
    const resultBg = isExcellent ? "#f0fdf4" : isWarning ? "#fffbeb" : "#fef2f2";

    const message = isExcellent
        ? "✅ Your attendance will be above 75% — you are safe!"
        : isWarning
            ? "⚠️ Your attendance will be exactly 75% — attend more to stay safe"
            : "❌ Your attendance will drop below 75% — attend classes urgently!";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
            {/* Main card — same design as all subjects */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: "14px 16px", borderRadius: 16,
                    background: "#ffffff",
                    border: `1px solid ${resultBorder}`,
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                        {course.title}
                    </p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                        {course.code} • {course.category}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                        {course.percentage}% →
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: resultColor }}>
                        {result.futurePercentage}%
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: "3px 8px", borderRadius: 8,
                        background: resultBg,
                        color: resultColor,
                        border: `1px solid ${resultBorder}`,
                    }}>
                        {isPositive ? "+" : ""}{result.delta}%
                    </span>
                </div>
            </motion.div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                    { label: "Future Classes", value: result.futureClasses, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
                    { label: "Total Classes", value: result.futureTotal, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                    { label: "Will Attend", value: result.futureAttended, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                    { label: "Will Absent", value: result.futureAbsent, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            padding: "12px 14px", borderRadius: 12,
                            background: stat.bg, border: `1px solid ${stat.border}`,
                            display: "flex", flexDirection: "column", alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>
                            {stat.value}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2, textAlign: "center" }}>
                            {stat.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Status message */}
            <div style={{
                padding: "12px 14px", borderRadius: 12, textAlign: "center",
                background: resultBg, border: `1px solid ${resultBorder}`,
                fontSize: 13, fontWeight: 600, color: resultColor,
            }}>
                {message}
            </div>
        </motion.div>
    );
}