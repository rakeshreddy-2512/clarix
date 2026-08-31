"use client";

import { motion } from "framer-motion";
import { Student } from "@/utils/types";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { getTimetableApi } from "@/lib/api";
import { Hash, BookOpen, Building2, GraduationCap, LogOut, Users, Layers } from "lucide-react";

interface TimetableResult {
    timetable: Record<number, unknown[]>;
    batch: number;
    section: string;
}

const INFO_ROWS = [
    { icon: Hash, label: "Register No", key: "regNo" },
    { icon: BookOpen, label: "Program", key: "program" },
    { icon: Building2, label: "Department", key: "department" },
    { icon: GraduationCap, label: "Semester", key: "semester" },
    { icon: Users, label: "Section", key: "section" },
];

export default function ProfileCard({ student }: { student: Student }) {
    const { logout } = useAuth();
    const { data: timetableData } = useFetch<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>
    );

    const batch = timetableData?.batch;
    const section = timetableData?.section || student.section;

    const initials = student.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

    const enrichedStudent = {
        ...student,
        section: section || student.section,
    };

    return (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Avatar card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    borderRadius: 24, padding: "32px 20px",
                    textAlign: "center",
                    background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)",
                    boxShadow: "0 8px 32px rgba(15,12,41,0.4)",
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.3, delay: 0.1 }}
                    style={{
                        width: 80, height: 80, borderRadius: 20,
                        background: "rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                    }}
                >
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{initials}</span>
                </motion.div>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 6 }}>
                    {student.name}
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500, marginBottom: 16 }}>
                    {section || student.section || "CSE"}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "8px 16px", borderRadius: 999,
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.25)",
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Active Student</span>
                    </div>
                    {batch && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 999,
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.25)",
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Batch {batch}</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Info rows */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    borderRadius: 20, overflow: "hidden",
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
            >
                {INFO_ROWS.map(({ icon: Icon, label, key }, i) => {
                    const value = key === "section"
                        ? (section || enrichedStudent[key as keyof Student])
                        : enrichedStudent[key as keyof Student];
                    if (!value) return null;
                    return (
                        <div key={key}
                            style={{
                                display: "flex", alignItems: "center", gap: 14,
                                padding: "16px 18px",
                                borderBottom: i < INFO_ROWS.length - 1 ? "1px solid #f8fafc" : "none",
                            }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: "#f0eeff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon size={16} color="#302b63" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
                            </div>
                        </div>
                    );
                })}

                {/* Batch row */}
                {batch && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "16px 18px",
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "#f0eeff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Layers size={16} color="#302b63" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>Batch</p>
                            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{batch}</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Logout */}
            <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "16px", borderRadius: 16,
                    fontSize: 15, fontWeight: 700,
                    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
                    cursor: "pointer",
                }}
            >
                <LogOut size={16} />
                Sign Out
            </motion.button>
        </div>
    );
}