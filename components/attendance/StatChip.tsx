"use client";

import { motion } from "framer-motion";

interface StatChipProps {
    label: string;
    value: number;
    color?: string;
    delay?: number;
}

export default function StatChip({
    label,
    value,
    color = "#60a5fa",
    delay = 0,
}: StatChipProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl"
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            <span
                className="text-xl font-bold leading-none"
                style={{ color }}
            >
                {value}
            </span>
            <span className="text-xs text-slate-500 font-medium">
                {label}
            </span>
        </motion.div>
    );
}