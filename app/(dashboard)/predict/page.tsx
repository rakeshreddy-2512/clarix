"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import PredictorForm from "@/components/predict/PredictorForm";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetch } from "@/hooks/useFetch";
import { getAttendanceApi, getTimetableApi } from "@/lib/api";
import { AttendanceCourse } from "@/utils/types";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface TimetableCourse {
    code: string;
    title: string;
    room: string;
    type: string;
    slot: string;
}

interface TimetableSlot {
    startTime: string;
    endTime: string;
    courses: TimetableCourse[];
}

interface TimetableResult {
    timetable: Record<number, TimetableSlot[]>;
    batch: number;
    section: string;
}

export default function PredictPage() {
    const { data, loading, error } = useFetch<AttendanceCourse[]>(
        getAttendanceApi as () => Promise<AttendanceCourse[]>
    );

    const { data: timetableData } = useFetch<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>
    );

    // ✅ Build slot map from timetable — code → slot
    const timetableSlotMap: Record<string, string> = {};
    if (timetableData?.timetable) {
        Object.values(timetableData.timetable).forEach((slots) => {
            slots.forEach((slot) => {
                slot.courses.forEach((c) => {
                    if (c.code && c.slot && c.slot !== "LAB") {
                        // For courses with multiple slots (P46, P47, P48)
                        // store all slots comma separated
                        if (timetableSlotMap[c.code]) {
                            if (!timetableSlotMap[c.code].includes(c.slot)) {
                                timetableSlotMap[c.code] += `,${c.slot}`;
                            }
                        } else {
                            timetableSlotMap[c.code] = c.slot;
                        }
                    }
                });
            });
        });
    }

    // ✅ Merge correct slot from timetable into attendance courses
    const courses = (data || []).map(c => {
        if (c.slot === "LAB" && timetableSlotMap[c.code]) {
            return { ...c, slot: timetableSlotMap[c.code] };
        }
        return c;
    });

    const batch = timetableData?.batch || 1;

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <div style={{ padding: "24px 20px 20px" }}>
                <motion.h1
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}
                >
                    Predictor
                </motion.h1>
                <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>
                    See your future attendance
                </p>
            </div>

            <div style={{ padding: "0 20px 20px" }}>
                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: "14px 16px", borderRadius: 12, fontSize: 14,
                        background: "var(--bg-primary)", border: "1px solid var(--border)",
                        color: "var(--text-muted)", fontWeight: 500,
                    }}>
                    Select a course or all subjects, pick a date range and toggle whether you will attend.
                </motion.div>
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                </div>
            )}

            {courses.length === 0 && !loading && !error && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <TrendingUp size={32} style={{ margin: "0 auto 12px", color: "#e2e8f0" }} />
                    <p style={{ fontSize: 15, color: "var(--text-muted)" }}>No courses found to predict</p>
                </div>
            )}

            {courses.length > 0 && <PredictorForm courses={courses} batch={batch} />}
        </PageWrapper>
    );
}