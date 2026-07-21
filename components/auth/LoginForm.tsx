"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LOADING_STEPS = [
    "Connecting to SRM Academia...",
    "Verifying your credentials...",
    "Fetching your academic data...",
    "Setting up your dashboard...",
];

function SessionExceededDialog({
    onConfirm,
    onCancel,
    loading,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    background: "#ffffff", borderRadius: 20,
                    padding: 28, maxWidth: 360, width: "100%",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                }}
            >
                <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: "#fef3c7", border: "1px solid #fde68a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                    Session Limit Reached
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 24, lineHeight: 1.6 }}>
                    You have reached the maximum session limit on SRM portal.
                    Would you like to logout from all other sessions and continue?
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "12px",
                            borderRadius: 12, border: "1.5px solid #e2e8f0",
                            background: "#ffffff", color: "#64748b",
                            fontSize: 14, fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "12px",
                            borderRadius: 12, border: "none",
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "#ffffff",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 32,
            }}
        >
            <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: "#000",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >
                <span className="clarix-logo-loading">C</span>
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
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        style={{ color: "#0f172a", fontSize: 16, fontWeight: 600 }}
                    >
                        {LOADING_STEPS[stepIndex]}
                    </motion.p>
                </AnimatePresence>
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
                    This may take a few seconds
                </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                {LOADING_STEPS.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            background: i === stepIndex ? "#1d4ed8" : "#e2e8f0",
                            scale: i === stepIndex ? 1.3 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2e8f0" }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default function LoginForm() {
    const { login, loginWithForceTerminate, cancelSessionExceeded, prefetch, lookup, loading, error, sessionExceeded } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Fire prefetch immediately when login page loads
    useEffect(() => {
        prefetch();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(username, password);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                @keyframes float-logo { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .clarix-logo-letter { font-family: 'Dancing Script', cursive; font-size: 38px; font-weight: 700; color: #fff; animation: float-logo 2.5s ease-in-out infinite; line-height: 1; display: inline-block; }
                .clarix-logo-loading { font-family: 'Dancing Script', cursive; font-size: 42px; font-weight: 700; color: #fff; animation: float-logo 2.5s ease-in-out infinite; line-height: 1; display: inline-block; }
                input::placeholder { color: #94a3b8; }
            `}</style>

            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <AnimatePresence>
                {sessionExceeded && (
                    <SessionExceededDialog
                        onConfirm={loginWithForceTerminate}
                        onCancel={cancelSessionExceeded}
                        loading={loading}
                    />
                )}
            </AnimatePresence>

            <div style={{
                minHeight: "100vh", background: "#f8fafc",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 24,
            }}>
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        style={{
                            width: 80, height: 80, borderRadius: 24,
                            background: "#000",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <span className="clarix-logo-letter">C</span>
                    </motion.div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 4 }}>
                        Clarix
                    </h1>
                    <p style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>
                        SRM Academia Tracker
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    style={{
                        width: "100%", maxWidth: 400,
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 24, padding: 32,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    }}
                >
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>
                        Welcome 👋
                    </h2>
                    <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28, fontWeight: 500 }}>
                        Sign in with your SRM Academia credentials
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 11, fontWeight: 700,
                                color: "#64748b", marginBottom: 8,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                NetID or College Email
                            </label>
                            <div style={{ position: "relative" }}>
                                <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="NetID or Email"
                                    disabled={loading}
                                    style={{
                                        width: "100%", paddingLeft: 42, paddingRight: 16,
                                        paddingTop: 13, paddingBottom: 13,
                                        background: "#f8fafc", border: "1.5px solid #e2e8f0",
                                        borderRadius: 12, color: "#0f172a",
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

                        {/* Password */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                display: "block", fontSize: 11, fontWeight: 700,
                                color: "#64748b", marginBottom: 8,
                                textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    disabled={loading}
                                    style={{
                                        width: "100%", paddingLeft: 42, paddingRight: 46,
                                        paddingTop: 13, paddingBottom: 13,
                                        background: "#f8fafc", border: "1.5px solid #e2e8f0",
                                        borderRadius: 12, color: "#0f172a",
                                        fontSize: 14, fontWeight: 500,
                                        outline: "none", transition: "all 0.2s",
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1.5px solid #1d4ed8";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)";
                                        e.target.style.background = "#ffffff";
                                        // 🔥 LOOKUP — trigger Step 3 when user clicks password field
                                        lookup(username);
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.border = "1.5px solid #e2e8f0";
                                        e.target.style.boxShadow = "none";
                                        e.target.style.background = "#f8fafc";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: 14,
                                        top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none",
                                        cursor: "pointer", color: "#94a3b8",
                                        display: "flex", alignItems: "center",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: "12px 14px", borderRadius: 10,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    color: "#dc2626", fontSize: 13, fontWeight: 600,
                                    marginBottom: 16,
                                }}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        {/* Submit */}
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
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 8,
                                boxShadow: (loading || !username || !password)
                                    ? "none"
                                    : "0 4px 20px rgba(29,78,216,0.35)",
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
                                <>
                                    <Zap size={15} />
                                    Sign In to Clarix
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p style={{
                        textAlign: "center", fontSize: 12, color: "#94a3b8",
                        marginTop: 20, lineHeight: 1.6, fontWeight: 500,
                    }}>
                        Uses your SRM Academia credentials securely.
                        <br />We never store your password.
                    </p>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginTop: 20, fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                >
                    <Zap size={10} /> Powered by Clarix
                </motion.p>
            </div>
        </>
    );
}