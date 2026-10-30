import { SchedulePlan } from '../types';
import { DAILY_COLUMN, GridColumnKey, getOccupiedRows } from './grid';

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

// Smallest row that still fits a one-row block's icon and label.
export const MIN_ROW_HEIGHT_PX = 24;
export const ROW_GAP_PX = 4;

export const CHECKLIST_MAX_PORTRAIT = 10;
export const CHECKLIST_MAX_LANDSCAPE = 7;

/**
 * Returns available vertical space inside the schedule frame in pixels.
 */
export function getAvailableFrameHeight(orientation: 'portrait' | 'landscape'): number {
  // Measured from the page layout: Letter page minus the 0.25in margins, the one-row
  // header, the footer, the 16px gaps and the grid's own padding. Landscape also loses
  // the day-name row. Re-measure if the page layout changes.
  return orientation === 'landscape' ? 604 : 844;
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

  // Daily and weekly: a grid. The page is full when no column has a free row.
  const columns: GridColumnKey[] =
    plan.template === 'weekly'
      ? (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as GridColumnKey[]).slice(0, plan.weekdaysOnly ? 5 : 7)
      : [DAILY_COLUMN];
  let used = 0;
  let total = 0;
  for (const column of columns) {
    const taken = getOccupiedRows(plan, column);
    total += taken.length;
    used += taken.filter(Boolean).length;
  }
  return {
    usedCount: used,
    totalCapacity: total,
    isFull: used >= total,
    label: `${used} of ${total} spaces used`,
  };
}
