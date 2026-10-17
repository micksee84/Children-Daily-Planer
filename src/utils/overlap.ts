import { ActivityBlock, SchedulePlan } from '../types';

/**
 * Converts "HH:MM" string to minutes from 00:00.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

/**
 * Converts minutes from 00:00 to "HH:MM".
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function isOverlapping(
  startA: number,
  durationA: number,
  startB: number,
  durationB: number
): boolean {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Finds the nearest free slot at the target time, or within 1 row above or below.
 * If neither is free within one row, returns null ("no" state).
 */
export function findAvailableSlot(
  plan: SchedulePlan,
  targetTimeStr: string,
  durationMinutes: number,
  dayOfWeek?: ActivityBlock['dayOfWeek'],
  excludeBlockId?: string
): { timeStr: string } | null {
  const step = plan.timeIncrement || 30;
  const planStartMin = plan.timeStartHour * 60;
  const planEndMin = plan.timeEndHour * 60;

  // Filter existing blocks on this day
  const relevantBlocks = plan.blocks.filter((b) => {
    if (b.id === excludeBlockId) return false;
    if (plan.template === 'weekly') {
      const bDay = b.dayOfWeek || 'mon';
      const targetDay = dayOfWeek || 'mon';
      return bDay === targetDay;
    }
    return true;
  });

  const isSlotFree = (startMin: number): boolean => {
    if (startMin < planStartMin || startMin + durationMinutes > planEndMin) {
      return false;
    }
    return !relevantBlocks.some((b) => {
      const bStart = timeStringToMinutes(b.startTime || '08:00');
      const bDuration = b.durationMinutes || 30;
      return isOverlapping(startMin, durationMinutes, bStart, bDuration);
    });
  };

  // Target minute rounded to increment
  let targetMin = timeStringToMinutes(targetTimeStr);
  targetMin = Math.round(targetMin / step) * step;

  // 1. Direct target slot
  if (isSlotFree(targetMin)) {
    return { timeStr: minutesToTimeString(targetMin) };
  }

  // 2. Check 1 row below or 1 row above (nearest free slot)
  const slotBelow = targetMin + step;
  const slotAbove = targetMin - step;

  const belowOk = isSlotFree(slotBelow);
  const aboveOk = isSlotFree(slotAbove);

  if (belowOk && aboveOk) {
    return { timeStr: minutesToTimeString(slotBelow) };
  }
  if (belowOk) {
    return { timeStr: minutesToTimeString(slotBelow) };
  }
  if (aboveOk) {
    return { timeStr: minutesToTimeString(slotAbove) };
  }

  // Neither is free within one row -> return null (show ghost in "no" state)
  return null;
}
