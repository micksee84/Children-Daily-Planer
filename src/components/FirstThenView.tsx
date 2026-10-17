import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, SchedulePlan } from '../types';
import { ActivityBlockCard } from './ActivityBlockCard';
import { ArrowRight, Plus } from 'lucide-react';

interface FirstThenViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  activeDropId?: string | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onAssignToSlot?: (slot: 'first' | 'then') => void;
  isPrintMode?: boolean;
}

const FirstThenSlotDropZone: React.FC<{
  slot: 'first' | 'then';
  isOver: boolean;
  children: React.ReactNode;
}> = ({ slot, isOver, children }) => {
  const { setNodeRef } = useDroppable({
    id: `firstthen-${slot}`,
    data: {
      type: 'firstthen-slot',
      slot,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full min-h-[200px] rounded-[24px] border-[3px] border-[#2D2200] bg-white p-4 flex flex-col justify-center items-center shadow-flat-ink relative transition-all ${
        isOver ? 'ring-4 ring-[#B6B2A6] ring-dashed bg-[#B6B2A6]/10' : ''
      }`}
    >
      {isOver && (
        <div className="absolute inset-2 border-[2px] border-dashed border-[#B6B2A6] rounded-[18px] bg-white/80 z-20 flex items-center justify-center pointer-events-none">
          <span className="font-['Nunito'] font-extrabold text-[15px] text-[#2D2200]">
            Drop into {slot.toUpperCase()}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

export const FirstThenView: React.FC<FirstThenViewProps> = ({
  plan,
  selectedBlockId,
  activeDropId,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAssignToSlot,
  isPrintMode = false,
}) => {
  const firstBlock = plan.blocks.find((b) => b.isFirstThenSlot === 'first');
  const thenBlock = plan.blocks.find((b) => b.isFirstThenSlot === 'then');

  const isOverFirst = activeDropId === 'firstthen-first';
  const isOverThen = activeDropId === 'firstthen-then';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 relative">
      {/* Light dashed hint if both slots are empty */}
      {!firstBlock && !thenBlock && !activeDropId && !isPrintMode && (
        <div className="no-print absolute top-3 text-center">
          <span className="font-['Nunito'] font-bold text-[13px] text-[#B6B2A6]">
            Drag activities here to build your day.
          </span>
        </div>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
        {/* FIRST COLUMN */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <span className="ink-sticker-title text-[36px] sm:text-[42px] uppercase tracking-wide">
              FIRST
            </span>
          </div>

          <FirstThenSlotDropZone slot="first" isOver={isOverFirst}>
            {firstBlock ? (
              <ActivityBlockCard
                block={firstBlock}
                isSelected={selectedBlockId === firstBlock.id}
                onSelect={onSelectBlock}
                onUpdate={onUpdateBlock}
                onDuplicate={onDuplicateBlock}
                onDelete={onDeleteBlock}
                showTime={false}
                showCheckbox={true}
                isBigTemplate={true}
                isPrintMode={isPrintMode}
                className="w-full !p-5"
                enableDrag={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="font-['Nunito'] font-bold text-[16px] text-[#2D2200]">
                  No "First" activity
                </span>
                <span className="text-[12px] text-[#2D2200]/70 mt-1">
                  Drag an activity here
                </span>
                {!isPrintMode && onAssignToSlot && (
                  <button
                    type="button"
                    onClick={() => onAssignToSlot('first')}
                    className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] border-[#2D2200] font-bold text-[12px] shadow-flat-ink"
                  >
                    <Plus size={13} /> Add First
                  </button>
                )}
              </div>
            )}
          </FirstThenSlotDropZone>
        </div>

        {/* Center Transition Arrow badge */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border-[3px] border-[#2D2200] shadow-flat-ink items-center justify-center text-[#2D2200]">
          <ArrowRight size={24} strokeWidth={3} />
        </div>

        {/* THEN COLUMN */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <span className="ink-sticker-title text-[36px] sm:text-[42px] uppercase tracking-wide">
              THEN
            </span>
          </div>

          <FirstThenSlotDropZone slot="then" isOver={isOverThen}>
            {thenBlock ? (
              <ActivityBlockCard
                block={thenBlock}
                isSelected={selectedBlockId === thenBlock.id}
                onSelect={onSelectBlock}
                onUpdate={onUpdateBlock}
                onDuplicate={onDuplicateBlock}
                onDelete={onDeleteBlock}
                showTime={false}
                showCheckbox={true}
                isBigTemplate={true}
                isPrintMode={isPrintMode}
                className="w-full !p-5"
                enableDrag={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="font-['Nunito'] font-bold text-[16px] text-[#2D2200]">
                  No "Then" activity
                </span>
                <span className="text-[12px] text-[#2D2200]/70 mt-1">
                  Drag an activity here
                </span>
                {!isPrintMode && onAssignToSlot && (
                  <button
                    type="button"
                    onClick={() => onAssignToSlot('then')}
                    className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] border-[#2D2200] font-bold text-[12px] shadow-flat-ink"
                  >
                    <Plus size={13} /> Add Then
                  </button>
                )}
              </div>
            )}
          </FirstThenSlotDropZone>
        </div>
      </div>
    </div>
  );
};
