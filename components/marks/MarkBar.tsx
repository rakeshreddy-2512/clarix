"use client";

import { motion } from "framer-motion";

interface MarkBarProps {
    name: string;
    scored: number;
    max: number;
    delay?: number;
}

export default function MarkBar({
    name,
    scored,
    max,
    delay = 0,
}: MarkBarProps) {
    const percentage = max > 0 ? (scored / max) * 100 : 0;

    const getColor = () => {
        if (percentage >= 80) return "#22c55e";
        if (percentage >= 60) return "#3b82f6";
        if (percentage >= 40) return "#f59e0b";
        return "#ef4444";
    };

    const getGlow = () => {
        if (percentage >= 80) return "rgba(34,197,94,0.4)";
        if (percentage >= 60) return "rgba(59,130,246,0.4)";
        if (percentage >= 40) return "rgba(245,158,11,0.4)";
        return "rgba(239,68,68,0.4)";
    };

    const color = getColor();
    const glow = getGlow();

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="mb-3"
        >
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400">
                    {name}
                </span>
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs font-bold"
                        style={{ color }}
                    >
                        {scored}
                    </span>
                    <span className="text-xs text-slate-600">/ {max}</span>
                </div>
            </div>

            {/* Bar track */}
            <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        delay: delay + 0.2,
                        duration: 0.8,
                        ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                        boxShadow: `0 0 8px ${glow}`,
                    }}
                />
            </div>
        </motion.div>
    );
}
