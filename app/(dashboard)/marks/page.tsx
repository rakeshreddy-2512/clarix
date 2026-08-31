"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Calculator } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import TabSwitch from "@/components/ui/TabSwitch";
import MarkCard from "@/components/marks/MarkCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getMarksApi } from "@/lib/api";
import { MarkCourse } from "@/utils/types";

export default function MarksPage() {
    const [activeTab, setActiveTab] = useState("Theory");
    const { data, loading, error } = useFetchWithCache<MarkCourse[]>(
        getMarksApi as () => Promise<MarkCourse[]>,
        "marks",
        10000 // 10 seconds TTL
    );

    const courses = data || [];
    const filtered = courses.filter((c) => c.type === activeTab);
    const totalScored = courses.reduce((sum, c) => sum + c.tests.reduce((s, t) => s + t.scored, 0), 0);
    const totalMax = courses.reduce((sum, c) => sum + c.tests.reduce((s, t) => s + t.max, 0), 0);
    const overallPct = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <Header title="Internal Marks" subtitle="Your test performance this semester" />

            <div style={{ padding: "0 20px 16px" }}>
                <TabSwitch tabs={["Theory", "Practical"]} active={activeTab} onChange={setActiveTab} layoutId="marks-tab" />
            </div>

            <div style={{ padding: "0 20px 16px" }} className="md:hidden">
                <Link href="/gpa">
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "12px", borderRadius: 14,
                        background: "#f0eeff", border: "1.5px solid #c4b5fd",
                        color: "#302b63", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}>
                        <Calculator size={16} />
                        GPA / CGPA Calculator
                    </div>
                </Link>
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                </div>
            )}

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                        style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {filtered.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                                No {activeTab} marks found
                            </div>
                        ) : (
                            filtered.map((course, i) => <MarkCard key={course.code} course={course} index={i} />)
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {courses.length > 0 && (
                <div style={{ padding: "32px 20px 16px", display: "flex", justifyContent: "center" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            width: 240, height: 240, borderRadius: 24,
                            background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)",
                            boxShadow: "0 8px 32px rgba(15,12,41,0.4)",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Overall Performance</p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontSize: 42, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
                                {totalScored.toFixed(1)}
                            </span>
                            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                                / {totalMax}
                            </span>
                        </div>
                        <span style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{overallPct}%</span>
                        <div style={{ width: "80%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                                style={{ height: "100%", borderRadius: 999, background: "var(--card-bg)" }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </PageWrapper>
    );
}