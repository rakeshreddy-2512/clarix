"use client";

import { useState, useEffect } from "react";
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

interface SubjectGrade {
    subject: string;
    credit: number;
    grade: number | null;
}

interface SemesterEntry {
    id: number;
    name: string;
    gpa: number | null;
    credits: number | null;
}

function getGPAColor(gpa: number) {
    if (gpa >= 8.5) return { color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
    if (gpa >= 7) return { color: "#302b63", bg: "#f0eeff", border: "#c4b5fd" };
    if (gpa >= 6) return { color: "#b45309", bg: "#fffbeb", border: "#fcd34d" };
    return { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
}

const inputStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    cursor: "pointer",
};

export default function GPAPage() {
    const [activeTab, setActiveTab] = useState<"gpa" | "cgpa">("gpa");
    const [regulationsData, setRegulationsData] = useState<Record<string, Record<string, Record<string, { subject: string; credit: number }[]>>>>({});
    const [regulations, setRegulations] = useState<string[]>([]);
    const [selectedRegulation, setSelectedRegulation] = useState("");
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [semesters, setSemesters] = useState<string[]>([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
    const [cgpaSemesters, setCgpaSemesters] = useState<SemesterEntry[]>([
        { id: 1, name: "Semester 1", gpa: null, credits: null },
    ]);

    useEffect(() => {
        fetch("/gpa-regulations.json")
            .then(r => r.json())
            .then(data => {
                setRegulationsData(data);
                const regs = Object.keys(data);
                setRegulations(regs);
                if (regs.length > 0) setSelectedRegulation(regs[0]);
            });
    }, []);

    useEffect(() => {
        if (!selectedRegulation || !regulationsData[selectedRegulation]) return;
        const b = Object.keys(regulationsData[selectedRegulation]);
        setBranches(b);
        setSelectedBranch("");
        setSemesters([]);
        setSelectedSemester("");
        setSubjectGrades([]);
    }, [selectedRegulation, regulationsData]);

    useEffect(() => {
        if (!selectedRegulation || !selectedBranch) return;
        const semList = Object.keys(regulationsData[selectedRegulation][selectedBranch] || {});
        setSemesters(semList);
        setSelectedSemester("");
        setSubjectGrades([]);
        const entries: SemesterEntry[] = semList.map((sem, i) => {
            const subjects = regulationsData[selectedRegulation][selectedBranch][sem] || [];
            const totalCredits = subjects.reduce((sum, s) => sum + s.credit, 0);
            return { id: i + 1, name: sem, gpa: null, credits: totalCredits };
        });
        setCgpaSemesters(entries);
    }, [selectedBranch, selectedRegulation, regulationsData]);

    useEffect(() => {
        if (!selectedRegulation || !selectedBranch || !selectedSemester) return;
        const subjects = regulationsData[selectedRegulation][selectedBranch][selectedSemester] || [];
        setSubjectGrades(subjects.map(s => ({ subject: s.subject, credit: s.credit, grade: null })));
    }, [selectedSemester, selectedBranch, selectedRegulation, regulationsData]);

    const validSubjects = subjectGrades.filter(s => s.grade !== null);
    const totalCredits = validSubjects.reduce((sum, s) => sum + s.credit, 0);
    const totalPoints = validSubjects.reduce((sum, s) => sum + s.credit * (s.grade as number), 0);
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : null;

    const validSems = cgpaSemesters.filter(s => s.gpa !== null && s.credits !== null && s.credits > 0);
    const cgpaTotalCredits = validSems.reduce((sum, s) => sum + (s.credits as number), 0);
    const cgpaTotalPoints = validSems.reduce((sum, s) => sum + (s.credits as number) * (s.gpa as number), 0);
    const cgpa = cgpaTotalCredits > 0 ? cgpaTotalPoints / cgpaTotalCredits : null;

    const gpaColors = gpa !== null ? getGPAColor(gpa) : { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" };
    const cgpaColors = cgpa !== null ? getGPAColor(cgpa) : { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" };

    const updateGrade = (index: number, grade: number | null) => {
        setSubjectGrades(prev => prev.map((s, i) => i === index ? { ...s, grade } : s));
    };

    const updateCgpaSem = (id: number, field: "gpa" | "credits", value: number | null) => {
        setCgpaSemesters(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addCgpaSem = () => {
        const next = cgpaSemesters.length + 1;
        setCgpaSemesters(prev => [...prev, { id: Date.now(), name: `Semester ${next}`, gpa: null, credits: null }]);
    };

    const removeCgpaSem = (id: number) => {
        if (cgpaSemesters.length > 1) setCgpaSemesters(prev => prev.filter(s => s.id !== id));
    };

    const SelectionPanel = ({ showSemester = false }: { showSemester?: boolean }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
            <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Regulation</label>
                <select value={selectedRegulation} onChange={e => setSelectedRegulation(e.target.value)} style={inputStyle}>
                    <option value="">Select Regulation</option>
                    {regulations.map(r => <option key={r} value={r}>{r} Regulation</option>)}
                </select>
            </div>
            <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Branch</label>
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={inputStyle} disabled={!selectedRegulation}>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
            {showSemester && selectedBranch && (
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Semester</label>
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} style={inputStyle}>
                        <option value="">Select Semester</option>
                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            )}
        </div>
    );

    return (
        <PageWrapper>
            <Header title="GPA Calculator" subtitle="Calculate your GPA & CGPA" />

            <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "center" }}>
                <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, gap: 3, background: "#f1f5f9", border: "1px solid var(--border)" }}>
                    {(["gpa", "cgpa"] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: "7px 24px", borderRadius: 9, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                            color: activeTab === tab ? "#302b63" : "#64748b",
                            background: activeTab === tab ? "#ffffff" : "transparent",
                            boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.2s",
                        }}>
                            {tab.toUpperCase()} Calculator
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto" }}>
                <AnimatePresence mode="wait">
                    {activeTab === "gpa" ? (
                        <motion.div key="gpa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                            <div style={{ padding: "24px 20px", borderRadius: 20, background: gpaColors.bg, border: `1px solid ${gpaColors.border}`, textAlign: "center" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: gpaColors.color, marginBottom: 8, opacity: 0.8 }}>YOUR GPA</p>
                                <p style={{ fontSize: 52, fontWeight: 900, color: gpaColors.color, lineHeight: 1 }}>
                                    {gpa !== null ? gpa.toFixed(2) : "—"}
                                </p>
                                <p style={{ fontSize: 13, color: gpaColors.color, marginTop: 8, opacity: 0.7 }}>
                                    {gpa === null ? "Select branch and semester to begin" :
                                        gpa >= 8.5 ? "Outstanding! 🎉" : gpa >= 7 ? "Great work! 👍" : gpa >= 6 ? "Keep pushing! 💪" : "Need improvement 📚"}
                                </p>
                            </div>

                            <SelectionPanel showSemester={true} />

                            {subjectGrades.map((sub, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px" }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{sub.subject}</p>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ background: "#f0eeff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#302b63", whiteSpace: "nowrap" }}>
                                            {sub.credit} Credits
                                        </div>
                                        <select value={sub.grade ?? ""} onChange={e => updateGrade(i, e.target.value === "" ? null : Number(e.target.value))} style={{ ...inputStyle, flex: 1 }}>
                                            <option value="">Select grade</option>
                                            {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                        </select>
                                    </div>
                                </motion.div>
                            ))}

                            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Grade Scale</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                    {GRADES.map(g => (
                                        <div key={g.value} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: "var(--bg-primary)", border: "1px solid #f1f5f9" }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{g.label.split(" — ")[0]}</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#302b63" }}>{g.value} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="cgpa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                            <div style={{ padding: "24px 20px", borderRadius: 20, background: cgpaColors.bg, border: `1px solid ${cgpaColors.border}`, textAlign: "center" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: cgpaColors.color, marginBottom: 8, opacity: 0.8 }}>YOUR CGPA</p>
                                <p style={{ fontSize: 52, fontWeight: 900, color: cgpaColors.color, lineHeight: 1 }}>
                                    {cgpa !== null ? cgpa.toFixed(2) : "—"}
                                </p>
                                <p style={{ fontSize: 13, color: cgpaColors.color, marginTop: 8, opacity: 0.7 }}>
                                    {cgpa === null ? "Select branch or enter semester GPA" :
                                        cgpa >= 8.5 ? "Top tech companies range! 🚀" : cgpa >= 7.5 ? "Product companies range! 🎯" : cgpa >= 6 ? "Service companies range! 👔" : "Keep working hard! 📚"}
                                </p>
                            </div>

                            <SelectionPanel showSemester={false} />

                            {cgpaSemesters.map((sem, i) => (
                                <motion.div key={sem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", minWidth: 70 }}>{sem.name}</span>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>GPA</label>
                                        <input type="number" min={0} max={10} step={0.01} placeholder="0.00"
                                            value={sem.gpa ?? ""}
                                            onChange={e => updateCgpaSem(sem.id, "gpa", e.target.value === "" ? null : Number(e.target.value))}
                                            style={inputStyle} />
                                    </div>
                                    {selectedBranch ? (
                                        <div style={{ background: "#f0eeff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#302b63", whiteSpace: "nowrap", marginTop: 18 }}>
                                            {sem.credits} Cr
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Credits</label>
                                            <input type="number" min={0} max={50} placeholder="0"
                                                value={sem.credits ?? ""}
                                                onChange={e => updateCgpaSem(sem.id, "credits", e.target.value === "" ? null : Number(e.target.value))}
                                                style={inputStyle} />
                                        </div>
                                    )}
                                    {!selectedBranch && (
                                        <button onClick={() => removeCgpaSem(sem.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, marginTop: 16 }}>
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}

                            {!selectedBranch && (
                                <button onClick={addCgpaSem} style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    padding: "14px", borderRadius: 14, border: "1.5px dashed #c4b5fd",
                                    background: "#f0eeff", color: "#302b63", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                }}>
                                    <Plus size={16} />
                                    Add Semester
                                </button>
                            )}

                            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>CGPA Requirements</p>
                                {[
                                    { label: "Top Tech Companies", range: "8.0 - 9.0+", color: "#15803d" },
                                    { label: "Product Companies", range: "7.5 - 8.5+", color: "#302b63" },
                                    { label: "Service Companies", range: "6.0 - 7.0+", color: "#b45309" },
                                    { label: "MS Abroad (Top US)", range: "8.5 - 9.5+", color: "#15803d" },
                                    { label: "Minimum Graduation", range: "5.0", color: "#dc2626" },
                                ].map(item => (
                                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
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