"use client";

import { useState } from "react";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getTimetableApi } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";

interface Course {
    code: string; title: string; room: string; type: string; slot: string;
}
interface TimetableSlot {
    startTime: string; endTime: string; courses: Course[];
}
type Timetable = Record<number, TimetableSlot[]>;
interface TimetableResult {
    timetable: Timetable; batch: number; section: string;
}

export default function TimetablePage() {
    const [selectedDay, setSelectedDay] = useState(1);
    const { data, loading, error } = useFetchWithCache<TimetableResult>(
        getTimetableApi as () => Promise<TimetableResult>,
        "timetable",
        15 * 60 * 1000 // 15 minutes TTL like acadia.works
    );

    const timetable = data?.timetable ?? {};
    const slots = timetable[selectedDay] ?? [];

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <Header
                title="Timetable"
                subtitle={new Date().toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}
            />

            {data && (
                <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
                    {data.batch && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                            Batch {data.batch}
                        </span>
                    )}
                    {data.section && (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}>
                            {data.section}
                        </span>
                    )}
                </div>
            )}

            <div style={{ padding: "0 20px 24px" }}>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Day Order</p>
                <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3, 4, 5].map(day => (
                        <button key={day} onClick={() => setSelectedDay(day)} style={{
                            width: 40, height: 40, borderRadius: "50%", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            border: selectedDay === day ? "none" : "1px solid #e2e8f0",
                            background: selectedDay === day ? "#1d4ed8" : "white",
                            color: selectedDay === day ? "white" : "#0f172a",
                            transition: "all 0.2s",
                        }}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                </div>
            )}

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {slots.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                        No classes on Day Order {selectedDay}
                    </div>
                ) : (
                    slots.map((slot, index) => (
                        <div key={index} style={{
                            background: "white", borderRadius: 16, padding: "16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
                            display: "flex", alignItems: "flex-start", gap: 16,
                        }}>
                            <div style={{ textAlign: "center", minWidth: 56, paddingTop: 2 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{slot.startTime}</p>
                                <div style={{ width: 1, height: 16, background: "#e2e8f0", margin: "4px auto" }} />
                                <p style={{ fontSize: 11, color: "#94a3b8" }}>{slot.endTime}</p>
                            </div>
                            <div style={{ width: 1, alignSelf: "stretch", background: "#f1f5f9" }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                                {slot.courses.map((course, ci) => (
                                    <div key={ci}>
                                        {ci > 0 && (
                                            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", margin: "4px 0", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>or</div>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{course.title}</p>
                                                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{course.code}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <span style={{
                                                    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                                                    background: course.type === "Practical" || course.type === "Lab Based Theory" ? "#f5f3ff" : "#eff6ff",
                                                    color: course.type === "Practical" || course.type === "Lab Based Theory" ? "#7c3aed" : "#1d4ed8",
                                                }}>
                                                    {course.type === "Lab Based Theory" ? "Lab" : course.type}
                                                </span>
                                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: 500 }}>{course.room}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}