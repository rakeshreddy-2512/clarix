"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ClarixLogo from "@/components/logo/ClarixLogo";

const LOADING_STEPS = [
    "Connecting...",
    "Verifying...",
    "Fetching...",
    "Setting up...",
];

const onboardingStars = `
    @keyframes twinkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
    @keyframes twinkle2 { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.1; transform: scale(0.6); } }
    @keyframes twinkle3 { 0%,100% { opacity: 0.8; transform: scale(1.1); } 50% { opacity: 0.2; transform: scale(0.7); } }
    .ob-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }
    .ob-s1 { width: 2px; height: 2px; top: 8%; left: 12%; animation: twinkle 2.1s ease-in-out infinite; }
    .ob-s2 { width: 3px; height: 3px; top: 15%; left: 75%; animation: twinkle2 1.8s ease-in-out infinite; }
    .ob-s3 { width: 2px; height: 2px; top: 30%; left: 45%; animation: twinkle3 2.4s ease-in-out infinite; }
    .ob-s4 { width: 2px; height: 2px; top: 55%; left: 88%; animation: twinkle 1.6s ease-in-out infinite; }
    .ob-s5 { width: 3px; height: 3px; top: 65%; left: 20%; animation: twinkle2 2.8s ease-in-out infinite; }
    .ob-s6 { width: 2px; height: 2px; top: 75%; left: 60%; animation: twinkle3 1.9s ease-in-out infinite; }
    .ob-s7 { width: 2px; height: 2px; top: 85%; left: 8%; animation: twinkle 2.3s ease-in-out infinite; }
    .ob-s8 { width: 3px; height: 3px; top: 92%; left: 80%; animation: twinkle2 2.0s ease-in-out infinite; }
    .ob-s9 { width: 2px; height: 2px; top: 20%; left: 55%; animation: twinkle3 2.6s ease-in-out infinite; }
    .ob-s10 { width: 2px; height: 2px; top: 40%; left: 95%; animation: twinkle 1.7s ease-in-out infinite; }
`;

const FEATURES = [
    {
        emoji: "📱",
        title: "Telegram Reminders",
        desc: "Get notified before your classes start. Enable in Profile → Notifications.",
    },
    {
        emoji: "📊",
        title: "Attendance Predictor",
        desc: "Know how many classes you can skip or need to attend. Available in Predict tab.",
    },
    {
        emoji: "📄",
        title: "Export Timetable",
        desc: "Download your full timetable as PDF or PNG. Available in Timetable tab.",
    },
];

function OnboardingModal({ username, onDone }: { username: string; onDone: () => void }) {
    const handleDone = () => {
        localStorage.setItem(`clarix_onboarded_${username}`, "true");
        onDone();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                background: "rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
            }}
        >
            <style>{onboardingStars}</style>
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                style={{
                    width: "100%", maxWidth: 380,
                    borderRadius: 28,
                    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div className="ob-star ob-s1" />
                <div className="ob-star ob-s2" />
                <div className="ob-star ob-s3" />
                <div className="ob-star ob-s4" />
                <div className="ob-star ob-s5" />
                <div className="ob-star ob-s6" />
                <div className="ob-star ob-s7" />
                <div className="ob-star ob-s8" />
                <div className="ob-star ob-s9" />
                <div className="ob-star ob-s10" />

                <button
                    onClick={handleDone}
                    style={{
                        position: "absolute", top: 16, right: 16,
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 8, width: 28, height: 28,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", zIndex: 1,
                    }}
                >
                    <X size={14} color="rgba(255,255,255,0.7)" />
                </button>

                <div style={{ padding: "32px 28px 28px", position: "relative", zIndex: 1 }}>
                    <div style={{ textAlign: "center", marginBottom: 28 }}>
                        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
                            <ClarixLogo />
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                            Welcome to Clarix! 🎉
                        </h2>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    style={{ marginTop: 20, fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                >
                    <Zap size={10} /> Powered by Clarix
                </motion.p>
                <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    By signing in you agree to our{" "}
                    <a href="/privacy" target="_blank" style={{ color: "#1d4ed8", fontWeight: 600 }}>Privacy Policy</a>
                </p>
            </div>
        </>
    );
}