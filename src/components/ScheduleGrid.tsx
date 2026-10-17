import React, { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, SchedulePlan } from '../types';
import { ActivityBlockCard } from './ActivityBlockCard';
import {
  GridColumnKey,
  cellId,
  formatRange,
  formatTime,
  getMaxSpan,
  getPlacement,
  getRowCount,
  rowToTime,
  spanToDuration,
} from '../utils/grid';

export interface GridGhost {
  column: GridColumnKey;
  row: number;
  span: number;
  ok: boolean;
  label?: string;
}

export const ROW_GAP_PX = 4;

interface ScheduleGridProps {
  plan: SchedulePlan;
  column: GridColumnKey;
  selectedBlockId: string | null;
  ghost?: GridGhost | null;
  compact?: boolean;
  isPrintMode?: boolean;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
}

/** One row of the grid. It is both the faint guide box and the drop target. */
const GridCell: React.FC<{ column: GridColumnKey; row: number; disabled: boolean }> = ({
  column,
  row,
  disabled,
}) => {
  const { setNodeRef } = useDroppable({
    id: cellId(column, row),
    data: { type: 'grid-cell', column, row },
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ gridRow: `${row + 1} / span 1`, gridColumn: 1 }}
      className="grid-cell rounded-[10px] border-[1.5px] border-dashed border-[#B6B2A6]"
    />
  );
};

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  plan,
  column,
  selectedBlockId,
  ghost,
  compact = false,
  isPrintMode = false,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
}) => {
  const rows = getRowCount(plan);
  const gridRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ id: string; span: number } | null>(null);

  const columnBlocks = plan.blocks
    .map((block) => ({ block, placement: getPlacement(plan, block) }))
    .filter((b) => b.placement && b.placement.column === column);

  const startResize = (block: ActivityBlock, startSpan: number) => (e: React.PointerEvent) => {
    const grid = gridRef.current;
    if (!grid) return;
    // Screen pixels per row, including the gap. Works at any zoom because it is measured.
    const rowStep = grid.getBoundingClientRect().height / rows;
    const maxSpan = getMaxSpan(plan, block);
    const startY = e.clientY;
    let current = startSpan;
    setResizing({ id: block.id, span: startSpan });

    const onMove = (ev: PointerEvent) => {
      const next = Math.max(1, Math.min(maxSpan, startSpan + Math.round((ev.clientY - startY) / rowStep)));
      if (next !== current) {
        current = next;
        setResizing({ id: block.id, span: next });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizing(null);
      if (current !== startSpan) {
        onUpdateBlock(block.id, { durationMinutes: spanToDuration(plan, current) });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const showGhost = ghost && ghost.column === column && !isPrintMode;

  return (
    <div
      ref={gridRef}
      className="schedule-grid w-full h-full grid relative"
      style={{
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gridTemplateColumns: 'minmax(0, 1fr)',
        rowGap: `${ROW_GAP_PX}px`,
      }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <GridCell key={r} column={column} row={r} disabled={isPrintMode} />
      ))}

      {columnBlocks.map(({ block, placement }) => {
        const isResizingThis = resizing?.id === block.id;
        const span = isResizingThis ? resizing!.span : placement!.span;
        const shownBlock = isResizingThis
          ? { ...block, durationMinutes: spanToDuration(plan, span) }
          : block;
        return (
          <div
            key={block.id}
            style={{ gridRow: `${placement!.row + 1} / span ${span}`, gridColumn: 1, zIndex: 2 }}
            className="min-h-0"
          >
            <ActivityBlockCard
              block={shownBlock}
              span={span}
              fillCell
              compact={compact}
              timeLabel={formatRange(plan, shownBlock)}
              isSelected={selectedBlockId === block.id}
              onSelect={onSelectBlock}
              onDuplicate={onDuplicateBlock}
              onDelete={onDeleteBlock}
              showTime={plan.showTimesOnBlocks}
              showCheckbox={plan.showCheckboxes}
              isPrintMode={isPrintMode}
              onResizeStart={startResize(block, placement!.span)}
              isResizing={isResizingThis}
            />
          </div>
        );
      })}

      {showGhost && (
        <div
          style={{ gridRow: `${ghost!.row + 1} / span ${ghost!.span}`, gridColumn: 1, zIndex: 3 }}
          className={`no-print pointer-events-none rounded-[12px] border-[2.5px] border-dashed flex items-center justify-between px-2.5 min-h-0 overflow-hidden ${
            ghost!.ok ? 'border-[#2D2200] bg-[#2D2200]/5' : 'border-[#E52311] bg-[#E52311]/5'
          }`}
        >
          <span className="font-['Nunito'] font-bold text-[12px] text-[#2D2200] truncate">
            {ghost!.ok ? ghost!.label || 'Drop here' : 'No room here'}
          </span>
          {ghost!.ok && !compact && (
            <span className="font-['Nunito'] font-semibold text-[11px] text-[#2D2200]/70 whitespace-nowrap">
              {formatTime(rowToTime(plan, ghost!.row))}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
