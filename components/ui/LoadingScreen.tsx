"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
    return (
        <div style={{
            position: "fixed", inset: 0, background: "var(--bg-primary)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                @keyframes float-logo { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .clarix-loading-letter { font-family: 'Dancing Script', cursive; font-size: 32px; font-weight: 700; color: #fff; animation: float-logo 2.5s ease-in-out infinite; line-height: 1; display: inline-block; }
            `}</style>

            <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: "#000",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24,
                }}
            >
                <span className="clarix-loading-letter">C</span>
            </motion.div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Clarix
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500, marginBottom: 32 }}>
                Loading your academics...
            </p>

            <div style={{ width: 160, height: 4, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    style={{
                        height: "100%", width: "50%", borderRadius: 999,
                        background: "linear-gradient(90deg, #0f0c29, #302b63)",
                    }}
                />
            </div>
        </div>
    );
}