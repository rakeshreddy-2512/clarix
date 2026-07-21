export interface Student {
    name: string;
    regNo: string;
    program: string;
    department: string;
    semester: string;
    batch: string;
    section: string;
    email: string;
}

export interface AttendanceCourse {
    code: string;
    title: string;
    faculty: string;
    category: "Theory" | "Practical";
    slot: string;
    room: string;
    totalClasses: number;
    attended: number;
    absent: number;
    percentage: number;
}

export interface MarkTest {
    name: string;
    max: number;
    scored: number;
}

export interface MarkCourse {
    code: string;
    title: string;
    type: "Theory" | "Practical";
    tests: MarkTest[];
}

export interface TimetableSlot {
    slot: string;
    time: string;
    code: string;
    title: string;
    room: string;
    type: "Theory" | "Practical";
}

export interface Timetable {
    [day: string]: TimetableSlot[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export type AttendanceStatus = "excellent" | "safe" | "warning" | "danger";