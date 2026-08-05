"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import Header from "@/components/layout/Header";
import { Plus, Trash2 } from "lucide-react";

const GRADES = [
    { label: "O — Outstanding", value: 10 },
    { label: "A+ — Excellent", value: 9 },
    { label: "A — Very Good", value: 8 },
    { label: "B+ — Good", value: 7 },
    { label: "B — Above Average", value: 6 },
    { label: "C — Average", value: 5 },
    { label: "F — Fail", value: 0 },
];

interface Subject {
    id: number;
    credits: number;
    grade: number | null;
}

interface Semester {
    id: number;
    name: string;
    gpa: number | null;
    credits: number;
}

function getGPAColor(gpa: number) {
    if (gpa >= 8.5) return { color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
    if (gpa >= 7) return { color: "#302b63", bg: "#f0eeff", border: "#c4b5fd" };
    if (gpa >= 6) return { color: "#b45309", bg: "#fffbeb", border: "#fcd34d" };
    return { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
}

const emptySubject = (): Subject => ({ id: Date.now(), credits: 0, grade: null });
const emptySemester = (index: number): Semester => ({ id: Date.now(), name: `Semester ${index}`, gpa: null, credits: 0 });

export default function GPAPage() {
    const [activeTab, setActiveTab] = useState<"gpa" | "cgpa">("gpa");
    const [subjects, setSubjects] = useState<Subject[]>([emptySubject()]);
    const [semesters, setSemesters] = useState<Semester[]>([emptySemester(1)]);

    const validSubjects = subjects.filter(s => s.grade !== null && s.credits > 0);
    const totalCredits = validSubjects.reduce((sum, s) => sum + s.credits, 0);
    const totalPoints = validSubjects.reduce((sum, s) => sum + s.credits * (s.grade as number), 0);
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : null;

    const validSemesters = semesters.filter(s => s.gpa !== null && s.credits > 0);
    const totalSemCredits = validSemesters.reduce((sum, s) => sum + s.credits, 0);
    const totalSemPoints = validSemesters.reduce((sum, s) => sum + s.credits * (s.gpa as number), 0);
    const cgpa = totalSemCredits > 0 ? totalSemPoints / totalSemCredits : null;

    const addSubject = () => setSubjects([...subjects, emptySubject()]);
    const removeSubject = (id: number) => {
        if (subjects.length > 1) setSubjects(subjects.filter(s => s.id !== id));
    };
    const updateSubject = (id: number, field: keyof Subject, value: number | null) => {
        setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addSemester = () => setSemesters([...semesters, emptySemester(semesters.length + 1)]);
    const removeSemester = (id: number) => {
        if (semesters.length > 1) setSemesters(semesters.filter(s => s.id !== id));
    };
    const updateSemester = (id: number, field: keyof Semester, value: string | number | null) => {
        setSemesters(semesters.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const gpaColors = gpa !== null ? getGPAColor(gpa) : { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" };
    const cgpaColors = cgpa !== null ? getGPAColor(cgpa) : { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" };

    const inputStyle: React.CSSProperties = {
        background: "#f8fafc",
        border: "1.5px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 14,
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        width: "100%",
    };

    return (
        <PageWrapper>
            <Header title="GPA Calculator" subtitle="Calculate your GPA & CGPA" />

            {/* Tab Switch */}
            <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "center" }}>
                <div style={{
                    display: "inline-flex", padding: 4, borderRadius: 12,
                    gap: 3, background: "#f1f5f9", border: "1px solid #e2e8f0",
                }}>
                    {(["gpa", "cgpa"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "7px 24px", borderRadius: 9,
                                fontSize: 13, fontWeight: 600, border: "none",
                                cursor: "pointer",
                                color: activeTab === tab ? "#302b63" : "#64748b",
                                background: activeTab === tab ? "#ffffff" : "transparent",
                                boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.2s",
                            }}
                        >
                            {tab.toUpperCase()} Calculator
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto" }}>
                <AnimatePresence mode="wait">
                    {activeTab === "gpa" ? (
                        <motion.div
                            key="gpa"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "flex", flexDirection: "column", gap: 12 }}
                        >
                            {/* GPA Result */}
                            <div style={{
                                padding: "24px 20px", borderRadius: 20,
                                background: gpaColors.bg,
                                border: `1px solid ${gpaColors.border}`,
                                textAlign: "center",
                            }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: gpaColors.color, marginBottom: 8, opacity: 0.8 }}>
                                    YOUR GPA
                                </p>
                                <p style={{ fontSize: 52, fontWeight: 900, color: gpaColors.color, lineHeight: 1 }}>
                                    {gpa !== null ? gpa.toFixed(2) : "—"}
                                </p>
                                <p style={{ fontSize: 13, color: gpaColors.color, marginTop: 8, opacity: 0.7 }}>
                                    {gpa === null ? "Add subjects with credits and grades" :
                                        gpa >= 8.5 ? "Outstanding! 🎉" :
                                            gpa >= 7 ? "Great work! 👍" :
                                                gpa >= 6 ? "Keep pushing! 💪" : "Need improvement 📚"}
                                </p>
                            </div>

                            {/* Subjects */}
                            {subjects.map((subject, i) => (
                                <motion.div
                                    key={subject.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 16,
                                        padding: "14px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", minWidth: 24 }}>{i + 1}.</span>

                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Credits</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={6}
                                            placeholder="0"
                                            value={subject.credits === 0 ? "" : subject.credits}
                                            onChange={(e) => updateSubject(subject.id, "credits", Number(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Grade</label>
                                        <select
                                            value={subject.grade ?? ""}
                                            onChange={(e) => updateSubject(subject.id, "grade", e.target.value === "" ? null : Number(e.target.value))}
                                            style={{ ...inputStyle, cursor: "pointer" }}
                                        >
                                            <option value="">Select grade</option>
                                            {GRADES.map(g => (
                                                <option key={g.value} value={g.value}>{g.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => removeSubject(subject.id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, marginTop: 16 }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}

                            <button
                                onClick={addSubject}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    padding: "14px", borderRadius: 14,
                                    border: "1.5px dashed #c4b5fd",
                                    background: "#f0eeff", color: "#302b63",
                                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                <Plus size={16} />
                                Add Subject
                            </button>

                            {/* Grade Reference */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Grade Scale</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                    {GRADES.map(g => (
                                        <div key={g.value} style={{
                                            display: "flex", justifyContent: "space-between",
                                            padding: "6px 10px", borderRadius: 8,
                                            background: "#f8fafc", border: "1px solid #f1f5f9",
                                        }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{g.label.split(" — ")[0]}</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#302b63" }}>{g.value} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cgpa"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "flex", flexDirection: "column", gap: 12 }}
                        >
                            {/* CGPA Result */}
                            <div style={{
                                padding: "24px 20px", borderRadius: 20,
                                background: cgpaColors.bg,
                                border: `1px solid ${cgpaColors.border}`,
                                textAlign: "center",
                            }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: cgpaColors.color, marginBottom: 8, opacity: 0.8 }}>
                                    YOUR CGPA
                                </p>
                                <p style={{ fontSize: 52, fontWeight: 900, color: cgpaColors.color, lineHeight: 1 }}>
                                    {cgpa !== null ? cgpa.toFixed(2) : "—"}
                                </p>
                                <p style={{ fontSize: 13, color: cgpaColors.color, marginTop: 8, opacity: 0.7 }}>
                                    {cgpa === null ? "Add semesters with GPA and credits" :
                                        cgpa >= 8.5 ? "Top tech companies range! 🚀" :
                                            cgpa >= 7.5 ? "Product companies range! 💼" :
                                                cgpa >= 6 ? "Service companies range! 👔" : "Keep working hard! 📚"}
                                </p>
                            </div>

                            {/* Semesters */}
                            {semesters.map((sem, i) => (
                                <motion.div
                                    key={sem.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 16,
                                        padding: "14px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", minWidth: 70 }}>Sem {i + 1}</span>

                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>GPA</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            step={0.01}
                                            placeholder="0.00"
                                            value={sem.gpa ?? ""}
                                            onChange={(e) => updateSemester(sem.id, "gpa", e.target.value === "" ? null : Number(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Credits</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            placeholder="0"
                                            value={sem.credits === 0 ? "" : sem.credits}
                                            onChange={(e) => updateSemester(sem.id, "credits", Number(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>

                                    <button
                                        onClick={() => removeSemester(sem.id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, marginTop: 16 }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}

                            <button
                                onClick={addSemester}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    padding: "14px", borderRadius: 14,
                                    border: "1.5px dashed #c4b5fd",
                                    background: "#f0eeff", color: "#302b63",
                                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                <Plus size={16} />
                                Add Semester
                            </button>

                            {/* CGPA Reference */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>CGPA Requirements</p>
                                {[
                                    { label: "Top Tech Companies", range: "8.0 - 9.0+", color: "#15803d" },
                                    { label: "Product Companies", range: "7.5 - 8.5+", color: "#302b63" },
                                    { label: "Service Companies", range: "6.0 - 7.0+", color: "#b45309" },
                                    { label: "MS Abroad (Top US)", range: "8.5 - 9.5+", color: "#15803d" },
                                    { label: "Minimum Graduation", range: "5.0", color: "#dc2626" },
                                ].map(item => (
                                    <div key={item.label} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "8px 0", borderBottom: "1px solid #f1f5f9",
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{item.label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.range}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div style={{ height: 120 }} />
        </PageWrapper>
    );
}