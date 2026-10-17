import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CharacterKey, CharacterSticker } from '../types';
import { getCharacterByKey } from '../constants/characters';
import { Trash2, RotateCw } from 'lucide-react';

interface CharacterStickerItemProps {
  sticker: CharacterSticker;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CharacterSticker>) => void;
  onDelete: (id: string) => void;
  isPrintMode?: boolean;
}

export const CharacterStickerItem: React.FC<CharacterStickerItemProps> = ({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isPrintMode = false,
}) => {
  const char = getCharacterByKey(sticker.characterKey);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `planner-sticker-${sticker.id}`,
    data: {
      type: 'planner-sticker',
      sticker,
    },
    disabled: isPrintMode,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isPrintMode ? {} : listeners)}
      {...(isPrintMode ? {} : attributes)}
      onClick={(e) => {
        if (!isPrintMode) {
          e.stopPropagation();
          onSelect(sticker.id);
        }
      }}
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.size}px`,
        height: `${sticker.size}px`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        zIndex: sticker.zIndex,
        touchAction: 'none',
      }}
      className={`group select-none cursor-grab active:cursor-grabbing ${
        isSelected && !isPrintMode ? 'ring-3 ring-[#2D2200] ring-offset-2' : ''
      } ${isDragging ? 'opacity-30 border-dashed' : ''} rounded-full transition-shadow`}
    >
      {/* The Character Sticker Circle */}
      <div
        className="w-full h-full rounded-full flex flex-col items-center justify-center text-center p-2 border-[3px] border-[#2D2200] shadow-[3px_3px_0_#2D2200] transition-transform overflow-hidden relative pointer-events-none"
        style={{
          backgroundColor: char.primaryColor,
          color: char.badgeTextColor,
        }}
      >
        <div className="absolute top-1 left-2 w-1/2 h-1/4 rounded-full bg-white/20 blur-[1px] pointer-events-none" />

        <div className="w-full h-full rounded-full flex flex-col items-center justify-center border border-dashed border-[#2D2200]/40 p-1">
          <span className="text-[10px] font-bold tracking-tight uppercase opacity-90 leading-none">
            Placeholder
          </span>
          <span className="font-extrabold text-[13px] md:text-[14px] leading-tight font-['Nunito']">
            {char.name}
          </span>
          <span className="text-[10px] font-semibold opacity-85 leading-tight">
            ({char.animal})
          </span>
        </div>
      </div>

      {/* Editor Controls if Selected and not printing */}
      {isSelected && !isPrintMode && !isDragging && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border-[1.5px] border-[#2D2200] rounded-full px-2 py-0.5 shadow-flat-ink text-[#2D2200] z-30 cursor-default"
        >
          <button
            type="button"
            aria-label="Rotate sticker"
            title="Rotate"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(sticker.id, {
                rotation: (sticker.rotation + 15) % 360,
              });
            }}
            className="p-1 hover:bg-[#F2F2E2] rounded-full active:scale-95 cursor-pointer"
          >
            <RotateCw size={13} strokeWidth={2.5} />
          </button>
          <div className="w-[1px] h-3 bg-[#2D2200]/30" />
          <button
            type="button"
            aria-label="Delete sticker"
            title="Delete (or drag off page)"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sticker.id);
            }}
            className="p-1 hover:bg-red-50 text-[#E52311] rounded-full active:scale-95 cursor-pointer"
          >
            <Trash2 size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export const HeaderCharacterBadge: React.FC<{
  characterKey: CharacterKey;
  onClick?: () => void;
}> = ({ characterKey, onClick }) => {
  const char = getCharacterByKey(characterKey);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: char.primaryColor,
        color: char.badgeTextColor,
      }}
      className="w-[172px] h-[172px] rounded-full border-[4px] border-[#2D2200] shadow-flat-ink flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none relative shrink-0 transition-transform hover:scale-105"
    >
      <div className="absolute top-2 left-4 w-1/2 h-1/4 rounded-full bg-white/25 pointer-events-none" />
      <div className="w-full h-full rounded-full border border-dashed border-[#2D2200]/40 flex flex-col items-center justify-center">
        <span className="text-[12px] font-bold uppercase tracking-wider opacity-90 leading-tight">
          Placeholder
        </span>
        <span className="font-extrabold text-[22px] tracking-tight leading-none my-1 font-['Nunito']">
          {char.name}
        </span>
        <span className="text-[14px] font-bold opacity-90 leading-tight">
          ({char.animal})
        </span>
      </div>
    </div>
  );
};
