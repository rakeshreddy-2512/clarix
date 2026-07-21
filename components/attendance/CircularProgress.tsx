"use client";

import { useEffect, useRef } from "react";
import { AttendanceStatus } from "@/utils/types";

const COLOR_MAP = {
    excellent: { stroke: "#16a34a", track: "#dcfce7" },
    safe: { stroke: "#302b63", track: "#f0eeff" },
    warning: { stroke: "#d97706", track: "#fef3c7" },
    danger: { stroke: "#dc2626", track: "#fee2e2" },
};

interface Props { percentage: number; status: AttendanceStatus; size?: number; }

export default function CircularProgress({ percentage, status, size = 80 }: Props) {
    const circleRef = useRef<SVGCircleElement>(null);
    const radius = (size - 14) / 2;
    const circumference = 2 * Math.PI * radius;
    const { stroke, track } = COLOR_MAP[status];

    useEffect(() => {
        if (!circleRef.current) return;
        const offset = circumference - (percentage / 100) * circumference;
        circleRef.current.style.strokeDashoffset = offset.toString();
    }, [percentage, circumference]);

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} className="ring-progress">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth="7" />
                <circle ref={circleRef} cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={stroke} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference}
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: size * 0.18, fontWeight: 800, color: stroke }}>
                    {percentage}%
                </span>
            </div>
        </div>
    );
}