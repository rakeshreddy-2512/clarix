import { AttendanceStatus } from "./types";

export function getAttendanceStatus(percentage: number): AttendanceStatus {
    if (percentage >= 90) return "excellent";
    if (percentage >= 75) return "safe";
    if (percentage >= 65) return "warning";
    return "danger";
}

export function getStatusColor(status: AttendanceStatus): string {
    switch (status) {
        case "excellent": return "#22c55e";
        case "safe": return "#3b82f6";
        case "warning": return "#f59e0b";
        case "danger": return "#ef4444";
    }
}

export function getStatusGlow(status: AttendanceStatus): string {
    switch (status) {
        case "excellent": return "glow-green";
        case "safe": return "glow-blue";
        case "warning": return "glow-amber";
        case "danger": return "glow-red";
    }
}

export function getStatusGradient(status: AttendanceStatus): string {
    switch (status) {
        case "excellent":
            return "from-emerald-900/40 to-emerald-950/20";
        case "safe":
            return "from-blue-900/40 to-blue-950/20";
        case "warning":
            return "from-amber-900/40 to-amber-950/20";
        case "danger":
            return "from-red-900/40 to-red-950/20";
    }
}

export function getStatusBorder(status: AttendanceStatus): string {
    switch (status) {
        case "excellent": return "rgba(34,197,94,0.25)";
        case "safe": return "rgba(59,130,246,0.25)";
        case "warning": return "rgba(245,158,11,0.25)";
        case "danger": return "rgba(239,68,68,0.25)";
    }
}

export function calculateSkip(
    attended: number,
    total: number
): number {
    const required = 75;
    return Math.max(
        0,
        Math.floor((attended * 100) / required - total)
    );
}

export function calculateNeedToAttend(
    attended: number,
    total: number
): number {
    const required = 75;
    const percentage = (attended / total) * 100;
    if (percentage >= required) return 0;
    return Math.ceil(
        (required * total - 100 * attended) / (100 - required)
    );
}

export function calculateFuturePercentage(
    attended: number,
    total: number,
    futureClasses: number,
    willAttend: boolean
): number {
    const futureTotal = total + futureClasses;
    const futureAttended = attended + (willAttend ? futureClasses : 0);
    return Math.round((futureAttended / futureTotal) * 100);
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}