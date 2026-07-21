"use client";

import { AttendanceCourse, AttendanceStatus } from "@/utils/types";
import {
    getAttendanceStatus,
    calculateSkip,
    calculateNeedToAttend,
} from "@/utils/helpers";

export interface AttendanceInfo {
    status: AttendanceStatus;
    canSkip: number;
    needToAttend: number;
}

export function useAttendance(course: AttendanceCourse): AttendanceInfo {
    const status = getAttendanceStatus(course.percentage);
    const canSkip = calculateSkip(course.attended, course.totalClasses);
    const needToAttend = calculateNeedToAttend(
        course.attended,
        course.totalClasses
    );

    return { status, canSkip, needToAttend };
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