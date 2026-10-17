import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ActivityBlock } from '../types';
import { BlockIcon } from './BlockIcon';
import { Clock, Copy, Trash2, GripVertical } from 'lucide-react';

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
  compact?: boolean;
  isBigTemplate?: boolean; // Checklist or First-Then (uses 20pt text)
  style?: React.CSSProperties;
  className?: string;
  allowDurationResize?: boolean;
  enableDrag?: boolean;
  rowHeightPx?: number;
}

export const ActivityBlockCard: React.FC<ActivityBlockCardProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  showTime = true,
  showCheckbox = true,
  isPrintMode = false,
  compact = false,
  isBigTemplate = false,
  style = {},
  className = '',
  allowDurationResize = true,
  enableDrag = true,
  rowHeightPx,
}) => {
  const resizeStartY = useRef<number | null>(null);
  const initialDuration = useRef<number>(block.durationMinutes);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `planner-block-${block.id}`,
    data: {
      type: 'planner-block',
      block,
    },
    disabled: isPrintMode || !enableDrag,
  });

  const handleResizeStart = (e: React.PointerEvent) => {
    if (isPrintMode || !onUpdate) return;
    e.stopPropagation();
    e.preventDefault();
    resizeStartY.current = e.clientY;
    initialDuration.current = block.durationMinutes;

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (resizeStartY.current === null) return;
      const deltaY = moveEv.clientY - resizeStartY.current;
      const deltaSteps = Math.round(deltaY / 20);
      const newDuration = Math.max(15, Math.min(240, initialDuration.current + deltaSteps * 15));
      onUpdate(block.id, { durationMinutes: newDuration });
    };

    const handlePointerUp = () => {
      resizeStartY.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const shouldShowCheckbox = showCheckbox && block.showCheckbox !== false;

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
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#2D2200',
        borderWidth: '4px',
        borderRadius: '14px',
        touchAction: 'none',
        minHeight: isBigTemplate ? '64px' : '40px',
        height: rowHeightPx ? `${rowHeightPx}px` : undefined,
        ...style,
      }}
      className={`group relative flex items-center justify-between bg-white transition-all select-none cursor-grab active:cursor-grabbing px-2.5 py-1.5 w-full ${
        isSelected && !isPrintMode ? 'ring-3 ring-[#2D2200] ring-offset-2 shadow-flat-ink' : ''
      } ${isDragging ? 'opacity-30 border-dashed' : ''} ${className}`}
    >
      {/* Single-Row Layout: Icon (24px) on left + Label + Time on right */}
      <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
        {/* Child colourable Line Icon (24px) */}
        <div className="shrink-0 p-0.5 rounded-[8px] border-[1.5px] border-[#2D2200] bg-white flex items-center justify-center">
          <BlockIcon
            name={block.iconName}
            size={isBigTemplate ? 32 : 24}
            strokeWidth={2.75}
            fill="#FFFFFF"
          />
        </div>

        {/* Activity Label: Nunito 700, 16pt (20pt in big templates) */}
        <span
          className={`font-bold text-[#2D2200] tracking-tight truncate leading-tight font-['Nunito'] ${
            isBigTemplate ? 'text-[20px]' : 'text-[16px]'
          }`}
          title={block.label}
        >
          {block.label}
        </span>
      </div>

      {/* Right Side: Time (Nunito 600, 11pt) + Checkbox (18px circle) */}
      <div className="flex items-center gap-2 shrink-0 ml-2 pointer-events-none">
        {showTime && block.startTime && (
          <div className="flex items-center gap-1 text-[#2D2200]/75 font-['Nunito'] font-semibold text-[11px] whitespace-nowrap">
            <Clock size={11} strokeWidth={2.2} />
            <span>{block.startTime}</span>
          </div>
        )}

        {shouldShowCheckbox && (
          <div
            title="Tick or colour when completed"
            className="w-[18px] h-[18px] rounded-full border-[2px] border-[#2D2200] bg-white flex items-center justify-center shrink-0"
          >
            <div className="w-[6px] h-[6px] rounded-full border border-dashed border-[#B6B2A6]" />
          </div>
        )}
      </div>

      {/* Hover/Selection Actions in Editor */}
      {isSelected && !isPrintMode && !isDragging && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="no-print absolute -top-4 right-3 z-30 flex items-center gap-1 bg-white border-[1.5px] border-[#2D2200] rounded-full px-2 py-0.5 shadow-flat-ink text-[#2D2200] cursor-default"
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
              className="p-1 hover:bg-[#F2F2E2] rounded-full active:scale-95 cursor-pointer"
            >
              <Copy size={13} strokeWidth={2.5} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete block"
              title="Delete (or drag off page)"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              className="p-1 hover:bg-red-50 text-[#E52311] rounded-full active:scale-95 cursor-pointer"
            >
              <Trash2 size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Resize handle at bottom edge if duration resizing allowed */}
      {allowDurationResize && !isPrintMode && isSelected && !isDragging && (
        <div
          onPointerDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
          title="Drag down to lengthen duration"
          className="no-print absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-14 h-4.5 rounded-full bg-white border-[1.5px] border-[#2D2200] flex items-center justify-center cursor-ns-resize shadow-flat-ink text-[#2D2200] z-20 hover:scale-105"
        >
          <GripVertical size={11} className="rotate-90" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
};
