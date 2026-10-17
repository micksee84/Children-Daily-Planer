import { ActivityBlock, SchedulePlan } from '../types';
import { minutesToTimeString, timeStringToMinutes } from './overlap';

/**
 * ============================================================================
 * SCHEDULE GRID
 * ============================================================================
 * The daily and weekly templates are a grid of equal rows. Each row is one
 * time step (plan.timeIncrement). A block covers as many rows as its duration
 * needs, so a 60-minute activity is twice as tall as a 30-minute one.
 *
 * There are no time markers on the sheet. Blocks show their own time range.
 * Every row is a drop target, so dropping snaps exactly to the row under the
 * pointer instead of being calculated from pixel positions.
 * ============================================================================
 */

/** Day key used for the single-column daily template. */
export const DAILY_COLUMN = 'daily';

export type GridColumnKey = NonNullable<ActivityBlock['dayOfWeek']> | typeof DAILY_COLUMN;

export interface GridPlacement {
  column: GridColumnKey;
  row: number; // 0-based start row
  span: number; // number of rows
}

export function getRowCount(plan: SchedulePlan): number {
  const minutes = Math.max(0, (plan.timeEndHour - plan.timeStartHour) * 60);
  return Math.max(1, Math.floor(minutes / plan.timeIncrement));
}

/** Rows a duration needs: rounded up to whole steps, at least one row. */
export function durationToSpan(plan: SchedulePlan, durationMinutes: number): number {
  return Math.max(1, Math.ceil((durationMinutes || plan.timeIncrement) / plan.timeIncrement));
}

export function spanToDuration(plan: SchedulePlan, span: number): number {
  return Math.max(1, span) * plan.timeIncrement;
}

export function rowToTime(plan: SchedulePlan, row: number): string {
  return minutesToTimeString(plan.timeStartHour * 60 + row * plan.timeIncrement);
}

export function timeToRow(plan: SchedulePlan, timeStr: string | undefined): number {
  const minutes = timeStringToMinutes(timeStr || minutesToTimeString(plan.timeStartHour * 60));
  return Math.round((minutes - plan.timeStartHour * 60) / plan.timeIncrement);
}

export function blockColumn(plan: SchedulePlan, block: ActivityBlock): GridColumnKey {
  return plan.template === 'weekly' ? block.dayOfWeek || 'mon' : DAILY_COLUMN;
}

/** Where a block sits on the grid, or null if it falls outside the visible day. */
export function getPlacement(plan: SchedulePlan, block: ActivityBlock): GridPlacement | null {
  const rows = getRowCount(plan);
  const row = timeToRow(plan, block.startTime);
  const span = durationToSpan(plan, block.durationMinutes);
  if (row < 0 || row >= rows) return null;
  return { column: blockColumn(plan, block), row, span: Math.min(span, rows - row) };
}

/** Rows already taken in one column, ignoring one block (the one being moved). */
export function getOccupiedRows(
  plan: SchedulePlan,
  column: GridColumnKey,
  excludeBlockId?: string
): boolean[] {
  const taken = new Array(getRowCount(plan)).fill(false);
  for (const block of plan.blocks) {
    if (block.id === excludeBlockId) continue;
    const p = getPlacement(plan, block);
    if (!p || p.column !== column) continue;
    for (let r = p.row; r < p.row + p.span && r < taken.length; r++) taken[r] = true;
  }
  return taken;
}

function fits(taken: boolean[], row: number, span: number): boolean {
  if (row < 0 || row + span > taken.length) return false;
  for (let r = row; r < row + span; r++) if (taken[r]) return false;
  return true;
}

/**
 * Finds the free start row closest to the one asked for. Searches outward
 * (same distance above and below, below first) so blocks tuck in next to
 * their neighbours instead of jumping around. Returns null when no gap is
 * big enough anywhere in the column.
 */
export function findNearestFreeRow(
  plan: SchedulePlan,
  column: GridColumnKey,
  targetRow: number,
  span: number,
  excludeBlockId?: string
): number | null {
  const taken = getOccupiedRows(plan, column, excludeBlockId);
  const rows = taken.length;
  if (span > rows) return null;
  const start = Math.max(0, Math.min(rows - span, targetRow));
  for (let d = 0; d < rows; d++) {
    if (fits(taken, start + d, span)) return start + d;
    if (d > 0 && fits(taken, start - d, span)) return start - d;
  }
  return null;
}

/** The longest a block can grow to before it hits the next block or the end of the day. */
export function getMaxSpan(plan: SchedulePlan, block: ActivityBlock): number {
  const p = getPlacement(plan, block);
  if (!p) return 1;
  const taken = getOccupiedRows(plan, p.column, block.id);
  let span = 1;
  while (p.row + span < taken.length && !taken[p.row + span]) span++;
  return span;
}

/** "8:00" style label without a leading zero, as parents write times. */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${m < 10 ? '0' : ''}${m}${suffix}`;
}

export function formatRange(plan: SchedulePlan, block: ActivityBlock): string {
  if (!block.startTime) return '';
  const start = timeStringToMinutes(block.startTime);
  const end = minutesToTimeString(start + (block.durationMinutes || plan.timeIncrement));
  return `${formatTime(block.startTime)} – ${formatTime(end)}`;
}

/** Droppable ids for grid rows: "cell|<column>|<row>" */
export function cellId(column: GridColumnKey, row: number): string {
  return `cell|${column}|${row}`;
}

export function parseCellId(id: string): { column: GridColumnKey; row: number } | null {
  const parts = id.split('|');
  if (parts.length !== 3 || parts[0] !== 'cell') return null;
  const row = parseInt(parts[2], 10);
  if (Number.isNaN(row)) return null;
  return { column: parts[1] as GridColumnKey, row };
}
