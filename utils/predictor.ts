export function calculateFuturePercentage(
    attended: number,
    total: number,
    futureClasses: number,
    willAttend: boolean
): number {
    if (total === 0 && futureClasses === 0) return 0;
    const futureTotal = total + futureClasses;
    const futureAttended = attended + (willAttend ? futureClasses : 0);
    return Math.round((futureAttended / futureTotal) * 100);
}

export function classesNeededToReach(
    attended: number,
    total: number,
    targetPercentage: number
): number {
    if (total === 0) return 0;
    const current = (attended / total) * 100;
    if (current >= targetPercentage) return 0;
    return Math.ceil((targetPercentage * total - 100 * attended) / (100 - targetPercentage));
}

export function classesCanSkip(
    attended: number,
    total: number,
    targetPercentage: number = 75
): number {
    if (total === 0) return 0;
    return Math.max(0, Math.floor((attended * 100) / targetPercentage - total));
}