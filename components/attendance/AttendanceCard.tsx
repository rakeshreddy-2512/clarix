"use client";

import { motion } from "framer-motion";
import { AttendanceCourse } from "@/utils/types";
import { useAttendance } from "@/hooks/useAttendance";
import CircularProgress from "./CircularProgress";

interface Props { course: AttendanceCourse; index: number; }

export default function AttendanceCard({ course, index }: Props) {
    const { status, canSkip, needToAttend } = useAttendance(course);

    const statusConfig = {
        excellent: { bg: "#f0fdf4", border: "#86efac", badge: "#dcfce7", badgeBorder: "#86efac", badgeText: "#15803d", label: `Can skip ${canSkip}` },
        safe: { bg: "#f0eeff", border: "#c4b5fd", badge: "#f0eeff", badgeBorder: "#c4b5fd", badgeText: "#302b63", label: `Can skip ${canSkip}` },
        warning: { bg: "#fffbeb", border: "#fcd34d", badge: "#fef3c7", badgeBorder: "#fcd34d", badgeText: "#b45309", label: `Need ${needToAttend} more` },
        danger: { bg: "#fef2f2", border: "#fca5a5", badge: "#fee2e2", badgeBorder: "#fca5a5", badgeText: "#dc2626", label: `Attend ${needToAttend} classes` },
    }[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileTap={{ scale: 0.99 }}
            style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "18px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 16,
            }}
        >
            {/* Left */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Code + Slot */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{
                        fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                        padding: "3px 8px", borderRadius: 6,
                        background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                    }}>
                        {course.code}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: "3px 8px", borderRadius: 6,
                        background: "var(--bg-secondary)", color: "var(--text-muted)",
                    }}>
                        Slot {course.slot}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
                    marginBottom: 4, lineHeight: 1.3,
                }}>
                    {course.title}
                </h3>

                {/* Faculty */}
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, fontWeight: 500 }}>
                    {course.faculty}
                </p>

                {/* Present / Absent / Total stats */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 12,
                    padding: "6px 12px", borderRadius: 10,
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    marginBottom: 8,
                }}>
                    {[
                        { label: "Present", value: course.attended, color: "#15803d" },
                        { label: "Absent", value: course.absent, color: "#dc2626" },
                        { label: "Total", value: course.totalClasses, color: "#302b63" },
                    ].map((stat, i) => (
                        <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {i > 0 && <span style={{ color: "#e2e8f0", fontSize: 14 }}>|</span>}
                            <span style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Skip badge */}
                <div style={{ marginBottom: 4 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 10,
                        background: statusConfig.badge,
                        border: `1px solid ${statusConfig.badgeBorder}`,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: statusConfig.badgeText }}>
                            {statusConfig.label}
                        </span>
                        {(status === "excellent" || status === "safe") && canSkip > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: statusConfig.badgeText }}>
                                {canSkip === 1 ? "class" : "classes"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right — circular progress */}
            <div style={{ flexShrink: 0 }}>
                <CircularProgress percentage={course.percentage} status={status} size={80} />
            </div>
        </motion.div>
    );
}