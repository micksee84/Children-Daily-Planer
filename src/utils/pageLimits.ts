import { SchedulePlan } from '../types';

/**
 * ============================================================================
 * PAGE CAPACITY & SINGLE-PAGE CONSTRAINTS
 * ============================================================================
 * [FUTURE MULTI-PAGE SUPPORT NOTE]:
 * To extend the planner to multi-page routines (e.g. 2-page weekly spread,
 * bedtime booklet, or multi-day classroom binders), pagination can be added
 * here by splitting `plan.blocks` across `pages: SchedulePlanPage[]`, rendering
 * a list of `<PageCanvas>` nodes with `break-after: page;` in print styles.
 * For now, all content is strictly constrained to exactly one US Letter page.
 * ============================================================================
 */

export const MIN_ROW_HEIGHT_PX = 40;
export const ROW_GAP_PX = 4;

export const CHECKLIST_MAX_PORTRAIT = 10;
export const CHECKLIST_MAX_LANDSCAPE = 7;

/**
 * Returns available vertical space inside the schedule frame in pixels.
 */
export function getAvailableFrameHeight(orientation: 'portrait' | 'landscape'): number {
  if (orientation === 'landscape') {
    // 816px total - margins (60px) - top row (36px) - title (70px) - footer (30px) - internal padding (24px)
    return 596;
  }
  // 1056px total - margins (80px) - top row (40px) - title (90px) - footer (36px) - internal padding (24px)
  return 786;
}

/**
 * Validates if a startHour, endHour, and timeIncrement combination fits on the page.
 */
export function validateTimeRange(
  startHour: number,
  endHour: number,
  increment: 15 | 30 | 60,
  orientation: 'portrait' | 'landscape'
): {
  valid: boolean;
  rows: number;
  rowHeight: number;
  suggestion?: string;
} {
  const totalMinutes = Math.max(0, (endHour - startHour) * 60);
  const rows = Math.max(1, Math.round(totalMinutes / increment));
  const availableHeight = getAvailableFrameHeight(orientation);
  const totalGaps = (rows - 1) * ROW_GAP_PX;
  const rowHeight = (availableHeight - totalGaps) / rows;

  if (rowHeight < MIN_ROW_HEIGHT_PX) {
    const suggestedIncrement = increment === 15 ? 30 : 60;
    const maxPossibleHours = Math.floor(
      (availableHeight / (MIN_ROW_HEIGHT_PX + ROW_GAP_PX)) * (increment / 60)
    );
    const suggestedEnd = Math.min(22, startHour + maxPossibleHours);

    return {
      valid: false,
      rows,
      rowHeight,
      suggestion: `That's too many time slots for one page. Try changing end time to ${suggestedEnd}:00 or using a ${suggestedIncrement}-min time step.`,
    };
  }

  return {
    valid: true,
    rows,
    rowHeight,
  };
}

/**
 * Calculates current slot capacity and usage for the planner.
 */
export function getPlanCapacityInfo(plan: SchedulePlan): {
  usedCount: number;
  totalCapacity: number;
  isFull: boolean;
  label: string;
} {
  if (plan.template === 'checklist') {
    const maxSteps =
      plan.orientation === 'landscape' ? CHECKLIST_MAX_LANDSCAPE : CHECKLIST_MAX_PORTRAIT;
    const used = plan.blocks.length;
    return {
      usedCount: used,
      totalCapacity: maxSteps,
      isFull: used >= maxSteps,
      label: `${used} of ${maxSteps} steps used`,
    };
  }

  if (plan.template === 'first-then') {
    const firstUsed = plan.blocks.some((b) => b.isFirstThenSlot === 'first') ? 1 : 0;
    const thenUsed = plan.blocks.some((b) => b.isFirstThenSlot === 'then') ? 1 : 0;
    const used = firstUsed + thenUsed;
    return {
      usedCount: used,
      totalCapacity: 2,
      isFull: used >= 2,
      label: `${used} of 2 slots used`,
    };
  }

  if (plan.template === 'daily') {
    const totalMinutes = Math.max(0, (plan.timeEndHour - plan.timeStartHour) * 60);
    const totalSlots = Math.max(1, Math.floor(totalMinutes / plan.timeIncrement));

    // Calculate how many slots are covered by current blocks
    let coveredMinutes = 0;
    plan.blocks.forEach((b) => {
      coveredMinutes += b.durationMinutes || plan.timeIncrement;
    });
    const usedSlots = Math.min(totalSlots, Math.ceil(coveredMinutes / plan.timeIncrement));

    return {
      usedCount: usedSlots,
      totalCapacity: totalSlots,
      isFull: usedSlots >= totalSlots,
      label: `${usedSlots} of ${totalSlots} spaces used`,
    };
  }

  // Weekly Planner: per-day or average
  const totalDays = plan.weekdaysOnly ? 5 : 7;
  const minutesPerDay = Math.max(0, (plan.timeEndHour - plan.timeStartHour) * 60);
  const slotsPerDay = Math.max(1, Math.floor(minutesPerDay / plan.timeIncrement));
  const totalSlotsAllDays = slotsPerDay * totalDays;

  let totalCoveredMinutes = 0;
  plan.blocks.forEach((b) => {
    totalCoveredMinutes += b.durationMinutes || plan.timeIncrement;
  });
  const usedSlotsTotal = Math.min(
    totalSlotsAllDays,
    Math.ceil(totalCoveredMinutes / plan.timeIncrement)
  );

  return {
    usedCount: usedSlotsTotal,
    totalCapacity: totalSlotsAllDays,
    isFull: usedSlotsTotal >= totalSlotsAllDays,
    label: `${usedSlotsTotal} of ${totalSlotsAllDays} slots used`,
  };
}
