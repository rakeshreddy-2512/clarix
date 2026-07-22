"use client";
import { AttendanceCourse, AttendanceStatus } from "@/utils/types";

export interface AttendanceInfo {
    status: AttendanceStatus;
    canSkip: number;
    needToAttend: number;
    margin: number;
}

// ✅ Exact same formula as acadia.works
function calculateMargin(conducted: number, absent: number, percentage: number): number {
    if (conducted === 0) return 0;
    return percentage < 75
        ? Math.floor(3 * conducted - 4 * (conducted - absent)) * -1
        : Math.floor((conducted - absent) / 3 - absent);
}

function getAttendanceStatus(percentage: number): AttendanceStatus {
    if (percentage >= 90) return "excellent";
    if (percentage >= 75) return "safe";
    if (percentage >= 65) return "warning";
    return "danger";
}

export function useAttendance(course: AttendanceCourse): AttendanceInfo {
    const status = getAttendanceStatus(course.percentage);
    const margin = calculateMargin(course.totalClasses, course.absent, course.percentage);
    const canSkip = margin > 0 ? margin : 0;
    const needToAttend = margin < 0 ? Math.abs(margin) : 0;

    return { status, canSkip, needToAttend, margin };
}

export function useAttendanceSummary(courses: AttendanceCourse[]) {
    const totalCourses = courses.length;
    const safeCourses = courses.filter((c) => c.percentage >= 75).length;
    const dangerCourses = courses.filter((c) => c.percentage < 75).length;
    const avgPercentage =
        courses.length > 0
            ? Math.round(
                courses.reduce((sum, c) => sum + c.percentage, 0) / courses.length
            )
            : 0;
    const totalClasses = courses.reduce((sum, c) => sum + c.totalClasses, 0);
    const totalAttended = courses.reduce((sum, c) => sum + c.attended, 0);
    const totalAbsent = courses.reduce((sum, c) => sum + c.absent, 0);

    return {
        totalCourses,
        safeCourses,
        dangerCourses,
        avgPercentage,
        totalClasses,
        totalAttended,
        totalAbsent,
    };
}