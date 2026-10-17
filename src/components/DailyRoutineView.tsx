import React from 'react';
import { ActivityBlock, SchedulePlan } from '../types';
import { ScheduleGrid, GridGhost } from './ScheduleGrid';
import { DAILY_COLUMN } from '../utils/grid';

interface DailyRoutineViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  ghost?: GridGhost | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  isPrintMode?: boolean;
}

/** Single-column day: a grid of equal rows with no time markers. */
export const DailyRoutineView: React.FC<DailyRoutineViewProps> = ({
  plan,
  selectedBlockId,
  ghost,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  isPrintMode = false,
}) => {
  return (
    <div className="w-full h-full p-3 relative">
      {plan.blocks.length === 0 && !ghost && !isPrintMode && (
        <div className="no-print absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
          <span className="font-['Nunito'] font-extrabold text-[16px] text-[#2D2200]/60 bg-white px-3 py-1 rounded-full">
            Drag activities here to build your day.
          </span>
          <span className="font-['Nunito'] text-[13px] text-[#2D2200]/60 bg-white px-3 mt-1 rounded-full">
            Each box is {plan.timeIncrement} minutes. Drag a block's bottom edge to make it longer.
          </span>
        </div>
      )}
      <ScheduleGrid
        plan={plan}
        column={DAILY_COLUMN}
        selectedBlockId={selectedBlockId}
        ghost={ghost}
        isPrintMode={isPrintMode}
        onSelectBlock={onSelectBlock}
        onUpdateBlock={onUpdateBlock}
        onDuplicateBlock={onDuplicateBlock}
        onDeleteBlock={onDeleteBlock}
      />
    </div>
  );
};
