import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, SchedulePlan } from '../types';
import { ActivityBlockCard } from './ActivityBlockCard';
import { Plus } from 'lucide-react';

interface ChecklistViewProps {
  plan: SchedulePlan;
  selectedBlockId: string | null;
  activeDropId?: string | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onAddStep?: () => void;
  isPrintMode?: boolean;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  plan,
  selectedBlockId,
  activeDropId,
  onSelectBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddStep,
  isPrintMode = false,
}) => {
  const blocks = [...plan.blocks].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
  const isOverChecklist = activeDropId === 'checklist-dropzone';

  const { setNodeRef } = useDroppable({
    id: 'checklist-dropzone',
    data: {
      type: 'checklist-dropzone',
    },
    disabled: isPrintMode,
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto relative"
    >
      {/* Light dashed hint when empty (Trace colour #B6B2A6, editor only, never printed) */}
      {blocks.length === 0 && !isOverChecklist && !isPrintMode && (
        <div className="no-print absolute inset-8 border-[2px] border-dashed border-[#B6B2A6] rounded-[20px] flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
          <span className="font-['Nunito'] font-extrabold text-[16px] text-[#B6B2A6]">
            Drag activities here to build your day.
          </span>
          <span className="font-['Nunito'] text-[13px] text-[#B6B2A6] mt-1">
            Add tasks for your child to tick off with crayons.
          </span>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 relative z-0">
        {blocks.map((block, idx) => (
          <div key={block.id} className="flex items-center gap-3">
            {/* Step number badge (white circle with 3px ink outline, 3px flat shadow) */}
            <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-[3px] border-[#2D2200] shadow-flat-ink flex items-center justify-center font-extrabold text-[#2D2200] text-[16px] sm:text-[20px] font-['Nunito']">
              {idx + 1}
            </div>

            {/* Block card with 20pt text for checklist */}
            <div className="flex-1">
              <ActivityBlockCard
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={onSelectBlock}
                onUpdate={onUpdateBlock}
                onDuplicate={onDuplicateBlock}
                onDelete={onDeleteBlock}
                showTime={false}
                showCheckbox={true}
                isBigTemplate={true}
                isPrintMode={isPrintMode}
                enableDrag={true}
              />
            </div>
          </div>
        ))}

        {/* Dashed drop outline when dragging over */}
        {isOverChecklist && (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white border-[3px] border-dashed border-[#B6B2A6] flex items-center justify-center font-extrabold text-[#B6B2A6]">
              {blocks.length + 1}
            </div>
            <div className="flex-1 h-14 border-[3px] border-dashed border-[#B6B2A6] bg-[#B6B2A6]/10 rounded-[14px] flex items-center justify-center font-bold text-[14px] text-[#2D2200]">
              Drop step here
            </div>
          </div>
        )}

        {!isPrintMode && onAddStep && (
          <div className="pt-2 flex justify-center no-print">
            <button
              type="button"
              onClick={onAddStep}
              className="flex items-center gap-2 px-5 py-2 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] text-[13px] font-bold shadow-flat-ink hover:-translate-y-0.5 transition-transform font-['Nunito']"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add checklist step</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
