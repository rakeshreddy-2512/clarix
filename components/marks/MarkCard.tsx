"use client";

import { motion } from "framer-motion";
import { MarkCourse } from "@/utils/types";

interface Props { course: MarkCourse; index: number; }

export default function MarkCard({ course, index }: Props) {
    const totalScored = course.tests.reduce((sum, t) => sum + t.scored, 0);
    const totalMax = course.tests.reduce((sum, t) => sum + t.max, 0);
    const overallPct = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

    const fmt = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: "20px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                            fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                            padding: "3px 8px", borderRadius: 6,
                            background: "#f1f5f9", color: "#475569",
                        }}>
                            {course.code}
                        </span>
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                            background: course.type === "Theory" ? "#f0eeff" : "#f5f3ff",
                            color: course.type === "Theory" ? "#302b63" : "#6d28d9",
                        }}>
                            {course.type}
                        </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{course.title}</h3>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>
                        {fmt(totalScored)}
                    </span>
                    <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
                        {" / "}{fmt(totalMax)}
                    </span>
                </div>
            </div>

            {/* Test bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {course.tests.map((test, i) => {
                    const pct = test.max > 0 ? (test.scored / test.max) * 100 : 0;
                    return (
                        <div key={test.name}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                                    {test.name}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                    {fmt(test.scored)}
                                    <span style={{ color: "#0f172a", fontWeight: 700 }}>
                                        {" / "}{fmt(test.max)}
                                    </span>
                                </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ delay: index * 0.05 + i * 0.04 + 0.2, duration: 0.8, ease: "easeOut" }}
                                    style={{
                                        height: "100%", borderRadius: 999,
                                        background: pct >= 70 ? "#302b63" : pct >= 40 ? "#6d5fd8" : "#c4b5fd",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Overall */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Overall</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#302b63" }}>{overallPct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "#f0eeff", overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                        transition={{ delay: index * 0.05 + 0.5, duration: 1, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 999, background: "#302b63" }}
                    />
                </div>
            </div>
        </motion.div>
    );
}