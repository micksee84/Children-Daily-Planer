import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, SchedulePlan } from '../types';
import { ActivityBlockCard } from './ActivityBlockCard';
import { Clock, Plus } from 'lucide-react';

interface GhostInfo {
  timeStr: string;
  dayKey?: ActivityBlock['dayOfWeek'];
  isNoState?: boolean;
  label?: string;
  iconName?: string;
  duration?: number;
}

interface DailyRoutineViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  activeGhost?: GhostInfo | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onAddBlockAtTime?: (timeStr: string) => void;
  isPrintMode?: boolean;
}

export const DailyRoutineView: React.FC<DailyRoutineViewProps> = ({
  plan,
  selectedBlockId,
  activeGhost,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddBlockAtTime,
  isPrintMode = false,
}) => {
  // Generate time slots based on plan range and increment
  const step = plan.timeIncrement || 30;
  const timeSlots: string[] = [];
  for (let m = plan.timeStartHour * 60; m < plan.timeEndHour * 60; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    timeSlots.push(`${h < 10 ? '0' : ''}${h}:${min < 10 ? '0' : ''}${min}`);
  }

  // Droppable container for pointer-based precise target calculation
  const { setNodeRef: setDailyColumnRef } = useDroppable({
    id: 'daily-column-droppable',
    data: {
      type: 'daily-column',
    },
    disabled: isPrintMode,
  });

  return (
    <div
      ref={setDailyColumnRef}
      className="w-full h-full flex flex-col p-3 sm:p-4 overflow-y-auto relative"
    >
      {/* Light dashed hint when empty (Trace colour #B6B2A6, editor only, never printed) */}
      {plan.blocks.length === 0 && !activeGhost && !isPrintMode && (
        <div className="no-print absolute inset-6 border-[2px] border-dashed border-[#B6B2A6] rounded-[20px] flex flex-col items-center justify-center p-6 text-center pointer-events-none z-0">
          <span className="font-['Nunito'] font-extrabold text-[16px] text-[#B6B2A6]">
            Drag activities here to build your day.
          </span>
          <span className="font-['Nunito'] text-[13px] text-[#B6B2A6] mt-1">
            Pick from the left palette or tap to add.
          </span>
        </div>
      )}

      {/* Grid of time rows with 4px gap */}
      <div className="space-y-[4px] relative z-10">
        {timeSlots.map((timeStr) => {
          const blocksAtThisSlot = plan.blocks.filter((b) => b.startTime === timeStr);
          const showGhostHere = activeGhost && activeGhost.timeStr === timeStr;

          return (
            <div
              key={timeStr}
              data-time={timeStr}
              className="daily-slot-row flex items-center gap-2 w-full"
            >
              {/* Left Time Label (printed or on-screen guide) */}
              <div className="w-12 shrink-0 text-right pr-1">
                <span className="font-['Nunito'] font-semibold text-[11px] text-[#2D2200]/70 select-none">
                  {timeStr}
                </span>
              </div>

              {/* Slot Area */}
              <div className="flex-1 min-w-0 relative">
                {/* Horizontal Trace dashed guide line */}
                <div
                  className="absolute top-1/2 left-0 right-0 -translate-y-1/2 -z-10 pointer-events-none"
                  style={{ borderTop: '1px dashed #B6B2A6' }}
                />

                {/* Render any block at this time */}
                {blocksAtThisSlot.map((block) => (
                  <ActivityBlockCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={onSelectBlock}
                    onUpdate={onUpdateBlock}
                    onDuplicate={onDuplicateBlock}
                    onDelete={onDeleteBlock}
                    showTime={plan.showTimesOnBlocks}
                    showCheckbox={plan.showCheckboxes}
                    isPrintMode={isPrintMode}
                    enableDrag={true}
                  />
                ))}

                {/* Ghost Drop Outline */}
                {showGhostHere && (
                  <div
                    className={`w-full rounded-[14px] px-2.5 py-1.5 flex items-center justify-between transition-all select-none ${
                      activeGhost.isNoState
                        ? 'border-[2px] border-dashed border-[#E52311] bg-red-50/50 text-[#E52311]'
                        : 'border-[2px] border-dashed border-[#B6B2A6] bg-[#B6B2A6]/10 text-[#2D2200]'
                    }`}
                    style={{ minHeight: '40px' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-['Nunito'] font-bold text-[14px] truncate">
                        {activeGhost.isNoState
                          ? 'No room here'
                          : activeGhost.label || 'Drop here'}
                      </span>
                    </div>
                    <span className="font-['Nunito'] font-semibold text-[11px] opacity-80 shrink-0">
                      {timeStr}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
