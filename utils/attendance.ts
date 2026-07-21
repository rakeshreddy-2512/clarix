import { AttendanceCourse } from "./types";

export function calculateSkip(attended: number, total: number): number {
    if (total === 0) return 0;
    return Math.max(0, Math.floor((attended * 100) / 75 - total));
}

export function calculateNeedToAttend(attended: number, total: number): number {
    if (total === 0) return 0;
    const percentage = (attended / total) * 100;
    if (percentage >= 75) return 0;
    return Math.ceil((75 * total - 100 * attended) / 25);
}

export function getAttendanceStatus(percentage: number) {
    if (percentage >= 90) return "excellent";
    if (percentage >= 75) return "safe";
    if (percentage >= 65) return "warning";
    return "danger";
}

export function filterByCategory(courses: AttendanceCourse[], category: string) {
    return courses.filter(c => c.category === category);
}

export function getAttendanceSummary(courses: AttendanceCourse[]) {
    const totalCourses = courses.length;
    const safeCourses = courses.filter(c => c.percentage >= 75).length;
    const dangerCourses = courses.filter(c => c.percentage < 75).length;
    const avgPercentage = courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.percentage, 0) / courses.length)
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