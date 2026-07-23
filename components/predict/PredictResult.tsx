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

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: "16px", borderRadius: 16,
                background: "#ffffff",
                border: `1px solid ${resultBorder}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", gap: 12,
            }}
        >
            {/* Course name and code */}
            <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    {course.title}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginTop: 2 }}>
                    {course.code} • {course.category}
                </p>
            </div>

            {/* Current → Predicted → Delta */}
            <div style={{
                padding: "12px 14px", borderRadius: 12,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{course.percentage}%</p>
                </div>

                <div style={{ fontSize: 20, color: "#94a3b8" }}>→</div>

                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Predicted</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: resultColor }}>{result.futurePercentage}%</p>
                </div>

                <div style={{
                    padding: "6px 12px", borderRadius: 10,
                    background: resultBg, border: `1px solid ${resultBorder}`,
                    textAlign: "center",
                }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delta</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: resultColor }}>
                        {isPositive ? "+" : ""}{result.delta}%
                    </p>
                </div>
            </div>
        </motion.div>
    );
}