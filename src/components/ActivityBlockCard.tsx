import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ActivityBlock } from '../types';
import { BlockIcon } from './BlockIcon';
import { Copy, Trash2, GripHorizontal } from 'lucide-react';

interface ActivityBlockCardProps {
  block: ActivityBlock;
  isSelected?: boolean;
  onSelect?: (block: ActivityBlock) => void;
  onUpdate?: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicate?: (block: ActivityBlock) => void;
  onDelete?: (id: string) => void;
  showTime?: boolean;
  showCheckbox?: boolean;
  isPrintMode?: boolean;
  /** Narrow columns (weekly planner): label and time stack instead of sitting side by side. */
  compact?: boolean;
  /** Checklist and First–Then templates use large blocks and 20pt words. */
  isBigTemplate?: boolean;
  style?: React.CSSProperties;
  className?: string;
  enableDrag?: boolean;
  /** Grid templates: the card fills its grid area exactly. */
  fillCell?: boolean;
  /** Grid templates: how many rows the block covers. */
  span?: number;
  /** Grid templates: pre-formatted time range, e.g. "8am – 8:30am". */
  timeLabel?: string;
  /** Grid templates: starts a row-snapping resize from the bottom handle. */
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  isResizing?: boolean;
}

export const ActivityBlockCard: React.FC<ActivityBlockCardProps> = ({
  block,
  isSelected = false,
  onSelect,
  onDuplicate,
  onDelete,
  showTime = true,
  showCheckbox = true,
  isPrintMode = false,
  compact = false,
  isBigTemplate = false,
  style = {},
  className = '',
  enableDrag = true,
  fillCell = false,
  span = 1,
  timeLabel,
  onResizeStart,
  isResizing = false,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `planner-block-${block.id}`,
    data: {
      type: 'planner-block',
      block,
      span,
    },
    disabled: isPrintMode || !enableDrag || isResizing,
  });

  const shouldShowCheckbox = showCheckbox && block.showCheckbox !== false && !(compact && span < 2);
  const shownTime = showTime ? timeLabel || '' : '';

  // Sizes step up as a block covers more rows, so long activities read bigger.
  const tall = span >= 2;
  const labelSize = isBigTemplate ? 20 : compact ? (tall ? 14 : 13) : tall ? 17 : 15;
  const iconSize = isBigTemplate ? 32 : compact ? 16 : tall ? 22 : 18;
  const stackText = compact && tall;

  return (
    <div
      ref={setNodeRef}
      {...(enableDrag && !isPrintMode ? listeners : {})}
      {...(enableDrag && !isPrintMode ? attributes : {})}
      onClick={(e) => {
        if (!isPrintMode && onSelect) {
          e.stopPropagation();
          onSelect(block);
        }
      }}
      data-block-id={block.id}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#2D2200',
        borderStyle: 'solid',
        borderWidth: isBigTemplate ? '4px' : '3px',
        borderRadius: isBigTemplate ? '16px' : '12px',
        touchAction: 'none',
        minHeight: fillCell ? 0 : isBigTemplate ? '64px' : '40px',
        height: fillCell ? '100%' : undefined,
        ...style,
      }}
      className={`group relative flex justify-between bg-white select-none cursor-grab active:cursor-grabbing w-full overflow-visible ${
        stackText ? 'items-start pt-1' : 'items-center'
      } ${compact ? 'px-1.5' : 'px-2.5'} ${
        isSelected && !isPrintMode ? 'shadow-flat-ink' : ''
      } ${isDragging ? 'opacity-30' : ''} ${className}`}
    >
      {/* Icon + label (+ stacked time in narrow columns) */}
      <div className={`flex gap-1.5 flex-1 min-w-0 pointer-events-none ${stackText ? 'items-start' : 'items-center'}`}>
        <div className="shrink-0 flex items-center justify-center">
          <BlockIcon name={block.iconName} size={iconSize} strokeWidth={2.5} fill="#FFFFFF" />
        </div>
        <div className="min-w-0 flex flex-col">
          <span
            className="font-['Nunito'] font-bold text-[#2D2200] leading-tight overflow-hidden break-words"
            style={{
              fontSize: `${labelSize}px`,
              // One line in one-row blocks, up to two in taller ones. No ellipsis.
              maxHeight: `${(tall ? 2 : 1) * labelSize * 1.25}px`,
            }}
            title={block.label}
          >
            {block.label}
          </span>
          {stackText && shownTime && (
            <span className="font-['Nunito'] font-semibold text-[10px] text-[#2D2200]/75 leading-tight whitespace-nowrap overflow-hidden">
              {shownTime}
            </span>
          )}
        </div>
      </div>

      {/* Time range (wide columns) + tick circle */}
      <div className="flex items-center gap-1.5 shrink-0 ml-1.5 pointer-events-none">
        {!stackText && !compact && shownTime && (
          <span className="font-['Nunito'] font-semibold text-[11px] text-[#2D2200]/75 whitespace-nowrap">
            {shownTime}
          </span>
        )}
        {shouldShowCheckbox && (
          <div
            title="Tick or colour when done"
            className="rounded-full border-[2px] border-[#2D2200] bg-white shrink-0"
            style={{ width: compact ? 13 : 16, height: compact ? 13 : 16 }}
          />
        )}
      </div>

      {/* Selected: duplicate / delete */}
      {isSelected && !isPrintMode && !isDragging && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="no-print absolute -top-3.5 right-2 z-30 flex items-center gap-0.5 bg-white border-[1.5px] border-[#2D2200] rounded-full px-1.5 py-0.5 shadow-flat-ink text-[#2D2200] cursor-default"
        >
          {onDuplicate && (
            <button
              type="button"
              aria-label="Duplicate block"
              title="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block);
              }}
              className="p-1 hover:bg-[#F2F2E2] rounded-full cursor-pointer"
            >
              <Copy size={12} strokeWidth={2.5} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete block"
              title="Delete (or drag off the page)"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              className="p-1 hover:bg-[#F2F2E2] rounded-full cursor-pointer"
            >
              <Trash2 size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Bottom handle (selected blocks only): drag to change how many rows the block covers.
          It hangs below the block so grabbing the block itself always moves it. */}
      {onResizeStart && !isPrintMode && !isDragging && (isSelected || isResizing) && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart(e);
          }}
          onClick={(e) => e.stopPropagation()}
          title="Drag to change how long this lasts"
          aria-label="Resize block"
          role="slider"
          className="no-print absolute left-1/2 -translate-x-1/2 z-30 h-[14px] w-12 rounded-full bg-[#2D2200] text-white flex items-center justify-center cursor-ns-resize"
          style={{ top: 'calc(100% - 2px)' }}
        >
          <GripHorizontal size={11} strokeWidth={2.75} />
        </div>
      )}
    </div>
  );
};
