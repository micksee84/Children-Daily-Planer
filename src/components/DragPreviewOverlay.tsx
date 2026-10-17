import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { BlockIcon } from './BlockIcon';
import { StarterBlockTemplate } from '../constants/starterBlocks';
import { ActivityBlock, CharacterKey, CharacterSticker } from '../types';
import { getCharacterByKey } from '../constants/characters';
import { Trash2 } from 'lucide-react';

export type ActiveDragItem =
  | { type: 'palette-block'; template: StarterBlockTemplate }
  | { type: 'planner-block'; block: ActivityBlock }
  | { type: 'palette-sticker'; characterKey: CharacterKey }
  | { type: 'planner-sticker'; sticker: CharacterSticker };

interface DragPreviewOverlayProps {
  activeItem: ActiveDragItem | null;
  isOutsidePage: boolean;
}

export const DragPreviewOverlay: React.FC<DragPreviewOverlayProps> = ({
  activeItem,
  isOutsidePage,
}) => {
  if (!activeItem) return null;

  const isExistingItem =
    activeItem.type === 'planner-block' || activeItem.type === 'planner-sticker';
  const showRemoveFeedback = isExistingItem && isOutsidePage;

  return (
    <DragOverlay dropAnimation={null}>
      <div
        className={`no-print pointer-events-none relative select-none transition-opacity duration-150 ${
          showRemoveFeedback ? 'opacity-40 cursor-no-drop' : 'opacity-100 cursor-grabbing'
        }`}
      >
        {/* If dragged outside page, show the ink pill label */}
        {showRemoveFeedback && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-[#2D2200] text-white px-3 py-1 rounded-full text-[12px] font-extrabold shadow-flat-ink flex items-center gap-1.5 font-['Nunito'] animate-pulse">
            <Trash2 size={13} strokeWidth={2.5} />
            <span>Let go to remove</span>
          </div>
        )}

        {/* SLIM BLOCK PREVIEW */}
        {(activeItem.type === 'palette-block' || activeItem.type === 'planner-block') && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#2D2200',
              borderWidth: '4px',
              borderRadius: '14px',
              boxShadow: '3px 3px 0 #2D2200',
              width: '240px',
            }}
            className="px-2.5 py-1.5 bg-white flex items-center justify-between border-[#2D2200] font-['Nunito']"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-0.5 rounded-[8px] border-[1.5px] border-[#2D2200] bg-white shrink-0">
                <BlockIcon
                  name={
                    activeItem.type === 'palette-block'
                      ? activeItem.template.iconName
                      : activeItem.block.iconName
                  }
                  size={24}
                  strokeWidth={2.75}
                  fill="#FFFFFF"
                />
              </div>
              <span className="font-bold text-[#2D2200] text-[15px] truncate">
                {activeItem.type === 'palette-block'
                  ? activeItem.template.label
                  : activeItem.block.label}
              </span>
            </div>

            {/* Checkbox preview */}
            <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#2D2200] bg-white shrink-0 ml-2" />
          </div>
        )}

        {/* STICKER PREVIEW */}
        {(activeItem.type === 'palette-sticker' || activeItem.type === 'planner-sticker') && (() => {
          const charKey =
            activeItem.type === 'palette-sticker'
              ? activeItem.characterKey
              : activeItem.sticker.characterKey;
          const char = getCharacterByKey(charKey);
          const size =
            activeItem.type === 'planner-sticker' ? activeItem.sticker.size : 80;

          return (
            <div
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: char.primaryColor,
                color: char.badgeTextColor,
              }}
              className="rounded-full border-[3px] border-[#2D2200] shadow-[3px_3px_0_#2D2200] flex flex-col items-center justify-center p-2 text-center"
            >
              <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 leading-none">
                Placeholder
              </span>
              <span className="font-extrabold text-[13px] leading-tight font-['Nunito']">
                {char.name}
              </span>
              <span className="text-[10px] font-semibold opacity-85 leading-tight">
                ({char.animal})
              </span>
            </div>
          );
        })()}
      </div>
    </DragOverlay>
  );
};
