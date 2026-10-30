import React from 'react';
import { ActivityBlock, SchedulePlan } from '../types';
import { ScheduleGrid, GridGhost } from './ScheduleGrid';

interface WeeklyPlannerViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  ghost?: GridGhost | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
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

/** One grid column per day. Rows line up across the week so equal times sit side by side. */
export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  selectedBlockId,
  ghost,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  isPrintMode = false,
}) => {
  const days = plan.weekdaysOnly ? ALL_DAYS.slice(0, 5) : ALL_DAYS;
  const useShort = days.length > 5;

  return (
    <div className="w-full h-full p-2.5 relative">
      {plan.blocks.length === 0 && !ghost && !isPrintMode && (
        <div className="no-print absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none z-10">
          <span className="font-['Nunito'] font-extrabold text-[16px] text-[#2D2200]/60 bg-white px-3 py-1 rounded-full">
            Drag activities onto any day, or start from a routine on the right.
          </span>
        </div>
      )}

      <div
        className="grid h-full gap-2"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => (
          <div key={day.key} className="flex flex-col h-full min-h-0 min-w-0">
            <div className="text-center shrink-0 pb-1.5">
              <h3 className="ink-die-cut text-[24px] leading-none select-none">
                {useShort ? day.short : day.label}
              </h3>
            </div>
            <div className="flex-1 min-h-0">
              <ScheduleGrid
                plan={plan}
                column={day.key}
                selectedBlockId={selectedBlockId}
                ghost={ghost}
                compact
                isPrintMode={isPrintMode}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
