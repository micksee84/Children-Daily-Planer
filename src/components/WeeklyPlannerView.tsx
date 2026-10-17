import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, SchedulePlan } from '../types';
import { ActivityBlockCard } from './ActivityBlockCard';
import { Plus } from 'lucide-react';

interface GhostInfo {
  timeStr: string;
  dayKey?: ActivityBlock['dayOfWeek'];
  isNoState?: boolean;
  label?: string;
  iconName?: string;
  duration?: number;
}

interface WeeklyPlannerViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  activeGhost?: GhostInfo | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onAddBlockToDay?: (day: ActivityBlock['dayOfWeek']) => void;
  isPrintMode?: boolean;
}

const ALL_DAYS: Array<{ key: NonNullable<ActivityBlock['dayOfWeek']>; label: string; short: string }> = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

const DayColumnDroppable: React.FC<{
  dayKey: ActivityBlock['dayOfWeek'];
  isPrintMode?: boolean;
  children: React.ReactNode;
}> = ({ dayKey, isPrintMode, children }) => {
  const { setNodeRef } = useDroppable({
    id: `weekly-day-${dayKey}`,
    data: {
      type: 'weekly-day',
      dayKey,
    },
    disabled: isPrintMode,
  });

  return (
    <div
      ref={setNodeRef}
      data-day={dayKey}
      className="weekly-day-column flex-1 p-1.5 space-y-[4px] overflow-y-auto relative min-h-[140px]"
    >
      {children}
    </div>
  );
};

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  selectedBlockId,
  activeGhost,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddBlockToDay,
  isPrintMode = false,
}) => {
  const days = plan.weekdaysOnly ? ALL_DAYS.slice(0, 5) : ALL_DAYS;

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-x-auto relative">
      {/* Light dashed hint when planner is completely empty */}
      {plan.blocks.length === 0 && !activeGhost && !isPrintMode && (
        <div className="no-print absolute inset-8 border-[2px] border-dashed border-[#B6B2A6] rounded-[20px] flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
          <span className="font-['Nunito'] font-extrabold text-[16px] text-[#B6B2A6]">
            Drag activities here to build your day.
          </span>
          <span className="font-['Nunito'] text-[13px] text-[#B6B2A6] mt-1">
            Drag onto any day of the week to plan your child's schedule.
          </span>
        </div>
      )}

      {/* Grid of days */}
      <div
        className="grid h-full gap-2 relative z-0"
        style={{
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
        }}
      >
        {days.map((day) => {
          const dayBlocks = plan.blocks
            .filter((b) => (b.dayOfWeek || 'mon') === day.key)
            .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

          const isGhostInThisDay = activeGhost && activeGhost.dayKey === day.key;

          return (
            <div
              key={day.key}
              className="flex flex-col h-full bg-white rounded-[16px] border-[2px] border-[#2D2200] overflow-hidden"
            >
              {/* Day Header with Ink Die-Cut style (24-36px) */}
              <div className="bg-white border-b-[2px] border-[#2D2200] py-1.5 px-1 text-center shrink-0">
                <h3 className="ink-die-cut text-[18px] sm:text-[22px] uppercase tracking-wide leading-none select-none">
                  {day.label}
                </h3>
              </div>

              {/* Day Column Droppable Zone */}
              <DayColumnDroppable dayKey={day.key} isPrintMode={isPrintMode}>
                {dayBlocks.map((block) => (
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
                    compact={true}
                    isPrintMode={isPrintMode}
                    enableDrag={true}
                  />
                ))}

                {/* Ghost landing indicator for this day */}
                {isGhostInThisDay && (
                  <div
                    className={`w-full rounded-[14px] px-2 py-1 flex items-center justify-between transition-all select-none ${
                      activeGhost.isNoState
                        ? 'border-[2px] border-dashed border-[#E52311] bg-red-50/50 text-[#E52311]'
                        : 'border-[2px] border-dashed border-[#B6B2A6] bg-[#B6B2A6]/10 text-[#2D2200]'
                    }`}
                    style={{ minHeight: '38px' }}
                  >
                    <span className="font-['Nunito'] font-bold text-[12px] truncate">
                      {activeGhost.isNoState ? 'No room here' : activeGhost.label || 'Drop here'}
                    </span>
                    <span className="font-['Nunito'] font-semibold text-[10px] opacity-75">
                      {activeGhost.timeStr}
                    </span>
                  </div>
                )}
              </DayColumnDroppable>
            </div>
          );
        })}
      </div>
    </div>
  );
};
