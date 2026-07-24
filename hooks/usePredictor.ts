"use client";
import { AttendanceCourse } from "@/utils/types";

export interface PlannerDay {
    date: string;
    dayOrder: number | null;
    note: string;
}

export interface PredictorResult {
    futureClasses: number;
    futureTotal: number;
    futureAttended: number;
    futureAbsent: number;
    futurePercentage: number;
    safe: boolean;
    delta: number;
}

const SLOT_DAY_ORDERS: Record<string, number[]> = {
    A: [1, 2, 3],
    B: [2, 3, 4],
    C: [3, 4, 5],
    D: [3, 4, 5],
    E: [4, 5],
    F: [1, 5],
    G: [1, 2],
    P6: [1], P7: [1], P8: [1], P9: [1], P10: [1],
    P11: [2], P12: [2], P13: [2], P14: [2], P15: [2],
    P26: [3], P27: [3], P28: [3], P29: [3], P30: [3],
    P31: [4], P32: [4], P33: [4], P34: [4], P35: [4],
    P46: [5], P47: [5], P48: [5], P49: [5], P50: [5],
    L11: [1], L12: [1],
    L21: [2], L22: [2],
    L31: [3], L32: [3],
    L41: [4], L42: [4],
    L51: [5], L52: [5],
};

const SLOT_DAY_ORDERS_BATCH2: Record<string, number[]> = {
    A: [1, 2, 3],
    B: [2, 3, 4],
    C: [3, 4, 5],
    D: [1, 3, 4, 5],
    E: [4, 5],
    F: [1, 5],
    G: [1, 2],
    P1: [1], P2: [1], P3: [1], P4: [1], P5: [1],
    P16: [2], P17: [2], P18: [2], P19: [2], P20: [2],
    P21: [3], P22: [3], P23: [3], P24: [3], P25: [3],
    P36: [4], P37: [4], P38: [4], P39: [4], P40: [4],
    P41: [5], P42: [5], P43: [5], P44: [5], P45: [5],
    L11: [1], L12: [1],
    L21: [2], L22: [2],
    L31: [3], L32: [3],
    L41: [4], L42: [4],
    L51: [5], L52: [5],
};

function countClassesInRange(
    slot: string,
    fromDate: string,
    toDate: string,
    plannerMap: Record<string, PlannerDay>,
    batch: number = 1
): number {
    const slotMap = batch === 2 ? SLOT_DAY_ORDERS_BATCH2 : SLOT_DAY_ORDERS;
    const dayOrders = slotMap[slot.toUpperCase()];
    if (!dayOrders) return 0;
    let count = 0;
    const current = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const plannerDay = plannerMap[dateStr];
        if (plannerDay?.dayOrder && dayOrders.includes(plannerDay.dayOrder)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}

export function usePredictor(
    course: AttendanceCourse | undefined,
    fromDate: string,
    toDate: string,
    willAttend: boolean,
    plannerMap?: Record<string, PlannerDay>,
    batch?: number
): PredictorResult | null {
    if (!course || !fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) return null;

    let futureClasses: number;
    if (plannerMap && Object.keys(plannerMap).length > 0 && course.slot) {
        futureClasses = countClassesInRange(
            course.slot,
            fromDate,
            toDate,
            plannerMap,
            batch || 1
        );
    } else {
        let businessDays = 0;
        const current = new Date(from);
        while (current <= to) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) businessDays++;
            current.setDate(current.getDate() + 1);
        }
        const classesPerWeek = course.category === "Practical" ? 1 : 3;
        const weeksApprox = businessDays / 5;
        futureClasses = Math.round(weeksApprox * classesPerWeek);
    }

    const futureTotal = course.totalClasses + futureClasses;
    const futureAttended = course.attended + (willAttend ? futureClasses : 0);
    const futureAbsent = futureTotal - futureAttended;

    // ✅ Handle division by zero when no classes held yet
    const futurePercentage = futureTotal > 0
        ? Math.round((futureAttended / futureTotal) * 100)
        : 0;

    // ✅ Use 0 as current percentage when no classes held yet
    const currentPercentage = course.totalClasses > 0 ? course.percentage : 0;

    return {
        futureClasses,
        futureTotal,
        futureAttended,
        futureAbsent,
        futurePercentage,
        safe: futurePercentage >= 75,
        delta: futurePercentage - currentPercentage,
    };
}