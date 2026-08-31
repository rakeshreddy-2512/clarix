"use client";

import { motion } from "framer-motion";
import { Timetable, TimetableSlot } from "@/utils/types";
import { Clock, MapPin } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function SlotCard({ slot, index }: { slot: TimetableSlot; index: number }) {
    const isTheory = slot.type === "Theory";
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            style={{
                display: "flex", alignItems: "stretch", gap: 0,
                borderRadius: 14, overflow: "hidden",
                border: `1px solid ${isTheory ? "#bfdbfe" : "#ddd6fe"}`,
                background: "#ffffff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
        >
            {/* Left color bar */}
            <div style={{
                width: 5, flexShrink: 0,
                background: isTheory
                    ? "linear-gradient(180deg, #1d4ed8, #3b82f6)"
                    : "linear-gradient(180deg, #6d28d9, #8b5cf6)",
            }} />

            {/* Content */}
            <div style={{ flex: 1, padding: "14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{
                        fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                        padding: "2px 8px", borderRadius: 6,
                        background: isTheory ? "#dbeafe" : "#ede9fe",
                        color: isTheory ? "#1d4ed8" : "#6d28d9",
                    }}>
                        Slot {slot.slot}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color="#94a3b8" />
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{slot.time}</span>
                    </div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4, lineHeight: 1.3 }}>
                    {slot.title}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: isTheory ? "#1d4ed8" : "#6d28d9", marginBottom: 6 }}>
                    {slot.code}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} color="#94a3b8" />
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{slot.room}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function TimetableGrid({ timetable }: { timetable: Timetable }) {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    return (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 28 }}>
            {DAYS.map((day, dayIndex) => {
                const slots = timetable[day] || [];
                const isToday = day === today;

                return (
                    <motion.div key={day}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.06 }}>

                        {/* Day header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{
                                    fontSize: 17, fontWeight: 800,
                                    color: isToday ? "#1d4ed8" : "#0f172a",
                                }}>
                                    {day}
                                </span>
                                {isToday && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 700,
                                        padding: "3px 10px", borderRadius: 999,
                                        background: "#1d4ed8", color: "#ffffff",
                                    }}>
                                        Today
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
                                {slots.length} {slots.length === 1 ? "class" : "classes"}
                            </span>
                        </div>

                        {/* Slots */}
                        {slots.length === 0 ? (
                            <div style={{
                                padding: "16px", borderRadius: 12, textAlign: "center",
                                background: "#f8fafc", border: "1px solid #f1f5f9",
                                fontSize: 13, color: "#cbd5e1", fontWeight: 500,
                            }}>
                                No classes scheduled
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {slots.map((slot, i) => (
                                    <SlotCard key={`${slot.code}-${slot.slot}-${i}`} slot={slot} index={i} />
                                ))}
                            </div>
                        )}

                        {dayIndex < DAYS.length - 1 && (
                            <div style={{ height: 1, background: "#f1f5f9", marginTop: 24 }} />
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}