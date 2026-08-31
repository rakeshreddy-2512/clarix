"use client";
import { motion } from "framer-motion";
interface TabSwitchProps {
    tabs: string[];
    active: string;
    onChange: (tab: string) => void;
    layoutId?: string;
}
export default function TabSwitch({ tabs, active, onChange, layoutId = "tab" }: TabSwitchProps) {
    return (
        <div style={{
            display: "inline-flex",
            padding: 4,
            borderRadius: 12,
            gap: 3,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
        }}>
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    style={{
                        padding: "7px 18px",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        color: active === tab ? "#1d4ed8" : "#64748b",
                        background: "transparent",
                        zIndex: 1,
                    }}
                >
                    {active === tab && (
                        <motion.div
                            layoutId={layoutId}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 9,
                                background: "var(--card-bg)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                zIndex: -1,
                            }}
                            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                    )}
                    {tab}
                </button>
            ))}
        </div>
    );
}