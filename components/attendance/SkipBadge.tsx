"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { AttendanceStatus } from "@/utils/types";

interface SkipBadgeProps {
    canSkip: number;
    needToAttend: number;
    status: AttendanceStatus;
}

export default function SkipBadge({
    canSkip,
    needToAttend,
    status,
}: SkipBadgeProps) {
    if (status === "excellent") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    color: "#86efac",
                }}
            >
                <CheckCircle size={13} />
                <span>
                    Can skip{" "}
                    <strong className="text-green-300">{canSkip}</strong>{" "}
                    {canSkip === 1 ? "class" : "classes"} safely
                </span>
            </motion.div>
        );
    }

    if (status === "safe") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    color: "#93c5fd",
                }}
            >
                <CheckCircle size={13} />
                <span>
                    Can skip{" "}
                    <strong className="text-blue-300">{canSkip}</strong>{" "}
                    {canSkip === 1 ? "class" : "classes"}
                </span>
            </motion.div>
        );
    }

    if (status === "warning") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#fcd34d",
                }}
            >
                <AlertTriangle size={13} />
                <span>
                    Attend{" "}
                    <strong className="text-amber-300">{needToAttend}</strong>{" "}
                    more to reach 75%
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
            }}
        >
            <XCircle size={13} />
            <span>
                Attend{" "}
                <strong className="text-red-300">{needToAttend}</strong>{" "}
                more classes urgently!
            </span>
        </motion.div>
    );
}