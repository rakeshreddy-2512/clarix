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
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                            Here's what you can do with Clarix
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 16, padding: "14px 16px",
                                    display: "flex", alignItems: "flex-start", gap: 14,
                                }}
                            >
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{feature.emoji}</span>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", marginBottom: 3 }}>
                                        {feature.title}
                                    </p>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, fontWeight: 500 }}>
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDone}
                        style={{
                            width: "100%", padding: "14px",
                            borderRadius: 14, border: "none",
                            background: "linear-gradient(135deg, #ff6f00, #ff9800)",
                            color: "#ffffff", fontSize: 15, fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(255,111,0,0.4)",
                        }}
                    >
                        Get Started 🚀
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function SessionExceededDialog({
    onConfirm, onCancel, loading,
}: {
    onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    background: "var(--card-bg)", borderRadius: 20, padding: 28,
                    maxWidth: 360, width: "100%",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                }}
            >
                <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: "#fef3c7", border: "1px solid #fde68a",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                    Session Limit Reached
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500, marginBottom: 24, lineHeight: 1.6 }}>
                    You have reached the maximum session limit.
                    Would you like to logout from all other sessions and continue?
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onCancel} disabled={loading}
                        style={{
                            flex: 1, padding: "12px", borderRadius: 12,
                            border: "1.5px solid #e2e8f0", background: "var(--card-bg)",
                            color: "var(--text-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm} disabled={loading}
                        style={{
                            flex: 1, padding: "12px", borderRadius: 12, border: "none",
                            background: loading ? "#e2e8f0" : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                            color: loading ? "#94a3b8" : "#ffffff",
                            fontSize: 14, fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: loading ? "none" : "0 4px 12px rgba(29,78,216,0.3)",
                        }}
                    >
                        {loading ? "Logging out..." : "Logout from All"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function LoadingOverlay() {
    const [stepIndex, setStepIndex] = useState(0);
    useState(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 2000);
        return () => clearInterval(interval);
    });
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "var(--card-bg)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 32,
            }}
        >
            <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
                <ClarixLogo />
            </motion.div>
            <div style={{ position: "relative", width: 56, height: 56 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "3px solid transparent",
                        borderTop: "3px solid #1d4ed8",
                        borderRight: "3px solid #3b82f6",
                    }}
                />
            </div>
            <div style={{ textAlign: "center" }}>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={stepIndex}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}
                    >
                        {LOADING_STEPS[stepIndex]}
                    </motion.p>
                </AnimatePresence>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>This may take a few seconds</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                {LOADING_STEPS.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ background: i === stepIndex ? "#1d4ed8" : "#e2e8f0", scale: i === stepIndex ? 1.3 : 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2e8f0" }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default function LoginForm() {
    const router = useRouter();
    const { login, loginWithForceTerminate, cancelSessionExceeded, prefetch, lookup, loading, error, sessionExceeded } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [onboarding, setOnboarding] = useState<{ show: boolean; username: string }>({ show: false, username: "" });

    useEffect(() => { prefetch(); }, []);

    // ✅ Check if first time login
    const checkOnboarding = (u: string) => {
        const key = `clarix_onboarded_${u.toLowerCase()}`;
        if (!localStorage.getItem(key)) {
            setOnboarding({ show: true, username: u.toLowerCase() });
            return true; // tell useAuth NOT to redirect yet
        }
        return false; // already onboarded → redirect immediately
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(username, password, checkOnboarding);
    };

    return (
        <>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input::placeholder { color: #94a3b8; }
            `}</style>

            {/* ✅ Onboarding modal */}
            <AnimatePresence>
                {onboarding.show && (
                    <OnboardingModal
                        username={onboarding.username}
                        onDone={() => {
                            setOnboarding({ show: false, username: "" });
                            router.push("/attendance");
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <AnimatePresence>
                {sessionExceeded && (
                    <SessionExceededDialog
                        onConfirm={() => loginWithForceTerminate(checkOnboarding)}
                        onCancel={cancelSessionExceeded}
                        loading={loading}
                    />
                )}
            </AnimatePresence>

            <div style={{
                minHeight: "100vh", background: "var(--bg-primary)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", padding: 24,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}
                >
                    <div style={{ marginBottom: 16 }}><ClarixLogo /></div>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>Academia Tracker</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                    style={{
                        width: "100%", maxWidth: 400, background: "var(--card-bg)",
                        border: "1px solid var(--border)", borderRadius: 24, padding: 32,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    }}
                >
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
                        Welcome 👋
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, fontWeight: 500 }}>
                        Sign in with your academia credentials
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 11, fontWeight: 700,
                                color: "var(--text-muted)", marginBottom: 8,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                NetID or College Email
                            </label>
                            <div style={{ position: "relative" }}>
                                <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    type="text" value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="NetID or Email" disabled={loading}
                                    style={{
                                        width: "100%", paddingLeft: 42, paddingRight: 16,
                                        paddingTop: 13, paddingBottom: 13,
                                        background: "var(--bg-primary)", border: "1.5px solid #e2e8f0",
                                        borderRadius: 12, color: "var(--text-primary)",
                                        fontSize: 14, fontWeight: 500,
                                        outline: "none", transition: "all 0.2s",
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1.5px solid #1d4ed8";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)";
                                        e.target.style.background = "#ffffff";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = "1.5px solid #e2e8f0";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "#f8fafc";
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: "block", fontSize: 11, fontWeight: 700,
                                color: "var(--text-muted)", marginBottom: 8,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password" disabled={loading}
                                    style={{
                                        width: "100%", paddingLeft: 42, paddingRight: 46,
                                        paddingTop: 13, paddingBottom: 13,
                                        background: "var(--bg-primary)", border: "1.5px solid #e2e8f0",
                                        borderRadius: 12, color: "var(--text-primary)",
                                        fontSize: 14, fontWeight: 500,
                                        outline: "none", transition: "all 0.2s",
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1.5px solid #1d4ed8";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)";
                                        e.target.style.background = "#ffffff";
                                        lookup(username);
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = "1.5px solid #e2e8f0";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "#f8fafc";
                                    }}
                                />
                                <button
                                    type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--text-muted)", display: "flex", alignItems: "center",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: "12px 14px", borderRadius: 10,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16,
                                }}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}
                        <motion.button
                            type="submit"
                            disabled={loading || !username || !password}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            style={{
                                width: "100%", padding: "14px",
                                background: (loading || !username || !password)
                                    ? "#e2e8f0"
                                    : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                border: "none", borderRadius: 12,
                                color: (loading || !username || !password) ? "#94a3b8" : "white",
                                fontSize: 15, fontWeight: 700,
                                cursor: (loading || !username || !password) ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: (loading || !username || !password)
                                    ? "none" : "0 4px 20px rgba(29,78,216,0.35)",
                                transition: "all 0.2s",
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: 16, height: 16, borderRadius: "50%",
                                        border: "2px solid rgba(0,0,0,0.1)",
                                        borderTop: "2px solid #64748b",
                                        animation: "spin 1s linear infinite",
                                    }} />
                                    Signing in...
                                </>
                            ) : (
                                <><Zap size={15} /> Sign In to Clarix</>
                            )}
                        </motion.button>
                    </form>
                    <p style={{
                        textAlign: "center", fontSize: 12, color: "var(--text-muted)",
                        marginTop: 20, lineHeight: 1.6, fontWeight: 500,
                    }}>
                        We never store your password.
                    </p>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    style={{ marginTop: 20, fontSize: 12, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                >
                    <Zap size={10} /> Powered by Clarix
                </motion.p>
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    By signing in you agree to our{" "}
                    <a href="/privacy" target="_blank" style={{ color: "#1d4ed8", fontWeight: 600 }}>Privacy Policy</a>
                </p>
            </div>
        </>
    );
}