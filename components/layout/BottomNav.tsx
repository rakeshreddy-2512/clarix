"use client";

import { useState } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import dynamic from "next/dynamic";
const SupportModal = dynamic(() => import("@/components/support/SupportModal"), { ssr: false });
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, BarChart3, TrendingUp, CalendarDays, User, Calendar, Menu, X, Calculator, Sun, Moon } from "lucide-react";

const NAV = [
    { to: "/attendance", icon: CalendarCheck2, label: "Attendance" },
    { to: "/marks", icon: BarChart3, label: "Marks" },
    { to: "/predict", icon: TrendingUp, label: "Predict" },
    { to: "/timetable", icon: CalendarDays, label: "Timetable" },
    { to: "/calendar", icon: Calendar, label: "Calendar" },
    { to: "/gpa", icon: Calculator, label: "GPA/CGPA" },
    { to: "/profile", icon: User, label: "Profile" },
];

const logoStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
    @keyframes float-logo { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    @keyframes twinkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
    @keyframes twinkle2 { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.1; transform: scale(0.6); } }
    @keyframes twinkle3 { 0%,100% { opacity: 0.8; transform: scale(1.1); } 50% { opacity: 0.2; transform: scale(0.7); } }
    .clarix-logo-letter { font-family: 'Dancing Script', cursive; font-size: 30px; font-weight: 700; color: #fff; animation: float-logo 2.5s ease-in-out infinite; line-height: 1; display: inline-block; }
    .star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }
    .star-1 { width: 2px; height: 2px; top: 10%; left: 15%; animation: twinkle 2.1s ease-in-out infinite; }
    .star-2 { width: 3px; height: 3px; top: 20%; left: 70%; animation: twinkle2 1.8s ease-in-out infinite; }
    .star-3 { width: 2px; height: 2px; top: 35%; left: 40%; animation: twinkle3 2.4s ease-in-out infinite; }
    .star-4 { width: 2px; height: 2px; top: 50%; left: 85%; animation: twinkle 1.6s ease-in-out infinite; }
    .star-5 { width: 3px; height: 3px; top: 60%; left: 25%; animation: twinkle2 2.8s ease-in-out infinite; }
    .star-6 { width: 2px; height: 2px; top: 70%; left: 55%; animation: twinkle3 1.9s ease-in-out infinite; }
    .star-7 { width: 2px; height: 2px; top: 80%; left: 10%; animation: twinkle 2.3s ease-in-out infinite; }
    .star-8 { width: 3px; height: 3px; top: 90%; left: 75%; animation: twinkle2 2.0s ease-in-out infinite; }
    .star-9 { width: 2px; height: 2px; top: 15%; left: 50%; animation: twinkle3 2.6s ease-in-out infinite; }
    .star-10 { width: 2px; height: 2px; top: 45%; left: 92%; animation: twinkle 1.7s ease-in-out infinite; }
    .star-11 { width: 3px; height: 3px; top: 25%; left: 30%; animation: twinkle2 2.2s ease-in-out infinite; }
    .star-12 { width: 2px; height: 2px; top: 75%; left: 60%; animation: twinkle3 1.5s ease-in-out infinite; }
`;

export default function BottomNav() {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isDark, toggle } = useDarkMode();
    const [supportOpen, setSupportOpen] = useState(false);

    return (
        <>
            <style>{logoStyles}</style>
            <AnimatePresence>{supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}</AnimatePresence>

            {/* MOBILE bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-4 md:hidden">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className="flex items-center justify-around px-4 rounded-3xl"
                    style={{
                        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 -2px 20px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.4)",
                        width: "100%",
                        maxWidth: "500px",
                        position: "relative",
                        overflow: "hidden",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                    }}
                >
                    <div className="star star-1" />
                    <div className="star star-2" />
                    <div className="star star-3" />
                    <div className="star star-4" />
                    <div className="star star-5" />
                    <div className="star star-6" />

                    {NAV.filter(n => n.to !== "/gpa").map(({ to, icon: Icon, label }) => {
                        const isActive = pathname === to;
                        return (
                            <Link key={to} href={to} className="flex-1" style={{ position: "relative", zIndex: 1 }}>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex flex-col items-center gap-1 py-1 rounded-2xl relative"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill-mobile"
                                            className="absolute inset-0 rounded-2xl"
                                            style={{
                                                background: "rgba(255,255,255,0.15)",
                                                border: "1px solid rgba(255,255,255,0.2)",
                                            }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                        />
                                    )}
                                    <motion.div
                                        animate={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.4)" }}
                                        transition={{ duration: 0.15 }}
                                        style={{ position: "relative", zIndex: 1 }}
                                    >
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                    </motion.div>
                                    <motion.span
                                        animate={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.4)" }}
                                        style={{
                                            fontSize: "10px",
                                            fontWeight: isActive ? 700 : 500,
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        {label}
                                    </motion.span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </motion.div>
            </nav>

            {/* DESKTOP sidebar */}
            <div className="hidden md:block">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{
                        position: "fixed",
                        top: 20,
                        right: sidebarOpen ? 236 : 20,
                        zIndex: 100,
                        width: 36, height: 36, borderRadius: 10,
                        background: "#000000", border: "1px solid #333333",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                        transition: "right 0.35s cubic-bezier(0.4,0,0.2,1)",
                    }}
                >
                    {sidebarOpen ? <X size={16} color="#ffffff" /> : <Menu size={16} color="#ffffff" />}
                </button>

                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.nav
                            initial={{ x: 220, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 220, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
                            style={{
                                position: "fixed",
                                right: 0, top: 0, bottom: 0,
                                width: 220,
                                background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)",
                                borderLeft: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "-2px 0 20px rgba(0,0,0,0.4)",
                                padding: "28px 12px",
                                zIndex: 50,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                            }}
                        >
                            <div className="star star-1" />
                            <div className="star star-2" />
                            <div className="star star-3" />
                            <div className="star star-4" />
                            <div className="star star-5" />
                            <div className="star star-6" />
                            <div className="star star-7" />
                            <div className="star star-8" />
                            <div className="star star-9" />
                            <div className="star star-10" />
                            <div className="star star-11" />
                            <div className="star star-12" />

                            {/* Logo */}
                            <div style={{ padding: "0 12px 32px", position: "relative", zIndex: 1 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: "#000",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    marginBottom: 10,
                                }}>
                                    <span className="clarix-logo-letter">C</span>
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>Clarix</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Academia</p>
                            </div>

                            {/* Nav items */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative", zIndex: 1 }}>
                                {NAV.map(({ to, icon: Icon, label }) => {
                                    const isActive = pathname === to;
                                    return (
                                        <Link key={to} href={to} onClick={() => setSidebarOpen(false)}>
                                            <motion.div
                                                whileHover={{ x: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 12,
                                                    padding: "11px 14px", borderRadius: 12,
                                                    background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                                                    border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                                                    cursor: "pointer", transition: "all 0.15s",
                                                }}
                                            >
                                                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#ffffff" : "rgba(255,255,255,0.6)"} />
                                                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)" }}>
                                                    {label}
                                                </span>
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Dark mode + Donate */}
                            <div style={{ marginTop: "auto", paddingTop: 16, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                                <button onClick={toggle} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "11px 14px", borderRadius: 12,
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    cursor: "pointer", width: "100%", transition: "all 0.15s",
                                }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: 6,
                                        background: isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {isDark ? <Sun size={14} color="#ffffff" /> : <Moon size={14} color="#ffffff" />}
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
                                        {isDark ? "Light Mode" : "Dark Mode"}
                                    </span>
                                </button>
                                <button onClick={() => setSupportOpen(true)} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "11px 14px", borderRadius: 12,
                                    background: "linear-gradient(135deg, rgba(255,95,95,0.2), rgba(255,152,0,0.2))",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    cursor: "pointer", width: "100%", transition: "all 0.15s",
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>Donate</span>
                                </button>
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}