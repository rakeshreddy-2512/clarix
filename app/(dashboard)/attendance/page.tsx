"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import TabSwitch from "@/components/ui/TabSwitch";
import AttendanceCard from "@/components/attendance/AttendanceCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetch } from "@/hooks/useFetch";
import { getAttendanceApi } from "@/lib/api";
import { AttendanceCourse } from "@/utils/types";
import { useAttendanceSummary } from "@/hooks/useAttendance";

export default function AttendancePage() {
    const [activeTab, setActiveTab] = useState("Theory");
    const { data, loading, error } = useFetch<AttendanceCourse[]>(
        getAttendanceApi as () => Promise<AttendanceCourse[]>
    );

    const courses = data || [];
    const filtered = courses.filter((c) => c.category === activeTab);
    const summary = useAttendanceSummary(courses);

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <Header title="Attendance" subtitle={`${courses.length} courses this semester`} showGreeting />

            {courses.length > 0 && (
                <div style={{ padding: "0 20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                        { label: "Average", value: `${summary.avgPercentage}%`, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "Safe", value: String(summary.safeCourses), color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
                        { label: "At Risk", value: String(summary.dangerCourses), color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                    ].map((stat, i) => (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center",
                                padding: "18px 8px", borderRadius: 16,
                                background: stat.bg, border: `1px solid ${stat.border}`,
                            }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                            <span style={{ fontSize: 12, color: stat.color, opacity: 0.7, marginTop: 4, fontWeight: 600 }}>{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            <div style={{ padding: "0 20px 20px" }}>
                <TabSwitch tabs={["Theory", "Practical"]} active={activeTab} onChange={setActiveTab} layoutId="attend-tab" />
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, textAlign: "center" }}>
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
                                No {activeTab} courses found
                            </div>
                        ) : (
                            filtered.map((course, i) => (
                                <AttendanceCard key={`${course.code}-${i}`} course={course} index={i} />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </PageWrapper>
    );
}