"use client";

import { motion } from "framer-motion";
import { getName } from "@/lib/session";

interface HeaderProps {
    title: string;
    subtitle?: string;
    showGreeting?: boolean;
}

export default function Header({ title, subtitle, showGreeting = false }: HeaderProps) {
    const name = getName();
    const firstName = name?.split(" ")[0] || "Student";

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ padding: "24px 20px 20px" }}
            className="md:pl-16"
        >
            {showGreeting && (
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>
                    Good to see you, {firstName} 👋
                </p>
            )}
            <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
            }}>
                {title}
            </h1>
            {subtitle && (
                <p style={{ fontSize: 15, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}