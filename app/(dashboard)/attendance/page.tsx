"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import TabSwitch from "@/components/ui/TabSwitch";
import AttendanceCard from "@/components/attendance/AttendanceCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getAttendanceApi, getTimetableApi } from "@/lib/api";
import { AttendanceCourse } from "@/utils/types";
import { useAttendanceSummary } from "@/hooks/useAttendance";

interface TimetableCourse {
    code: string;
    title: string;
    room: string;
    type: string;
    slot: string;
}

interface TimetableSlotEntry {
    startTime: string;
    endTime: string;
    courses: TimetableCourse[];
}

interface TimetableResult {
    timetable: Record<number, TimetableSlotEntry[]>;
    batch: number;
    section: string;
}

function getTimetableSubjects(timetable: Record<number, TimetableSlotEntry[]>): AttendanceCourse[] {
    const seen = new Set<string>();
    const subjects: AttendanceCourse[] = [];
    Object.values(timetable).forEach(slots => {
        slots.forEach(slot => {
            slot.courses.forEach(course => {
                if (course.code && !seen.has(course.code)) {
                    seen.add(course.code);
                    subjects.push({
                        code: course.code,
                        title: course.title,
                        faculty: "—",
                        category: course.type === "Practical" ? "Practical" : "Theory",
                        slot: course.slot || "—",
                        room: course.room || "—",
                        totalClasses: 0,
                        attended: 0,
                        absent: 0,
                        percentage: 0,
                    });
                }
            });
        });
    });
    return subjects;
}

export default function AttendancePage() {
    const [activeTab, setActiveTab] = useState("Theory");
    const { data, loading, error } = useFetchWithCache<AttendanceCourse[]>(
        getAttendanceApi as () => Promise<AttendanceCourse[]>,
        "attendance",
        10000
    );
    const { data: timetableData, loading: timetableLoading } = useFetchWithCache<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>,
        "timetable",
        3600000
    );

    const isDown = !!error && !data;
    const fallbackCourses = isDown && timetableData?.timetable
        ? getTimetableSubjects(timetableData.timetable)
        : [];

    const courses = data || fallbackCourses;
    const filtered = courses.filter((c) => c.category === activeTab);
    const summary = useAttendanceSummary(data || []);

    if (loading || (isDown && timetableLoading)) return <LoadingScreen />;

    return (
        <PageWrapper>
            <Header title="Attendance" subtitle={`${courses.length} courses this semester`} showGreeting />

            {isDown && (
                <div style={{ margin: "0 20px 16px", padding: "12px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fcd34d", color: "#b45309", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                    ⚠️ Academia is currently down. Showing subjects from your timetable. Refresh when back online.
                </div>
            )}

            {(data && courses.length > 0) && (
                <div style={{ padding: "0 20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                        { label: "Average", value: `${summary.avgPercentage}%`, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
                        { label: "Safe", value: String(summary.safeCourses), color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
                        { label: "At Risk", value: String(summary.dangerCourses), color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                                padding: "14px 12px", borderRadius: 16, textAlign: "center",
                                background: stat.bg, border: `1px solid ${stat.border}`,
                            }}
                        >
                            <p style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: stat.color, opacity: 0.8, marginTop: 2 }}>{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            <div style={{ padding: "0 20px 16px" }}>
                <TabSwitch
                    tabs={["Theory", "Practical"]}
                    active={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 15 }}
                        >
                            No {activeTab.toLowerCase()} courses found
                        </motion.div>
                    ) : (
                        filtered.map((course, i) => (
                            <motion.div
                                key={course.code}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <AttendanceCard course={course} index={i} />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            <div style={{ height: 120 }} />
        </PageWrapper>
    );
}