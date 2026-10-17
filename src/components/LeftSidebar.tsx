import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { STARTER_BLOCKS, StarterBlockTemplate } from '../constants/starterBlocks';
import { CHARACTERS } from '../constants/characters';
import { BlockIcon } from './BlockIcon';
import { CharacterKey } from '../types';
import { Search, Plus, Sparkles, User, HelpCircle, GripVertical } from 'lucide-react';

interface LeftSidebarProps {
  onAddBlock: (template: StarterBlockTemplate) => void;
  onAddSticker: (charKey: CharacterKey) => void;
  onOpenCustomBlockModal: () => void;
  isPageFull?: boolean;
  onPageFullAttempt?: () => void;
}

const DraggableBlockItem: React.FC<{
  item: StarterBlockTemplate;
  index: number;
  onAdd: () => void;
  isPageFull?: boolean;
  onFullAttempt?: () => void;
}> = ({ item, index, onAdd, isPageFull, onFullAttempt }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-block-${index}-${item.label}`,
    data: {
      type: 'palette-block',
      template: item,
      isPageFull,
    },
    disabled: false,
  });

  const handleClick = () => {
    if (isPageFull) {
      onFullAttempt?.();
      return;
    }
    onAdd();
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      style={{ touchAction: 'none' }}
      className={`group p-2.5 rounded-[14px] border-[2px] border-[#2D2200] bg-white hover:bg-[#F8F7F4] flex items-center justify-between transition-all select-none shadow-flat-ink-sm ${
        isPageFull
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-grab active:cursor-grabbing active:scale-[0.98]'
      } ${isDragging ? 'opacity-30 border-dashed' : ''}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="text-[#2D2200]/40 group-hover:text-[#2D2200] transition-colors">
          <GripVertical size={16} strokeWidth={2.5} />
        </div>
        <div className="p-0.5 rounded-[8px] border-[1.5px] border-[#2D2200] bg-white shrink-0">
          <BlockIcon
            name={item.iconName}
            size={22}
            strokeWidth={2.5}
            fill="#FFFFFF"
          />
        </div>
        <span className="font-bold text-[14px] text-[#2D2200] truncate">
          {item.label}
        </span>
      </div>

      <button
        type="button"
        title={isPageFull ? 'Page is full' : 'Tap to add'}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="w-6 h-6 rounded-full border-[1.5px] border-[#2D2200] flex items-center justify-center text-[#2D2200] group-hover:bg-[#2D2200] group-hover:text-white transition-colors shrink-0"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const DraggableStickerItem: React.FC<{
  char: (typeof CHARACTERS)[0];
  onAdd: () => void;
}> = ({ char, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-sticker-${char.key}`,
    data: {
      type: 'palette-sticker',
      characterKey: char.key,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      style={{ touchAction: 'none' }}
      className={`flex flex-col items-center text-center p-3 rounded-[16px] border-[2px] border-[#2D2200] bg-white hover:bg-[#F8F7F4] shadow-flat-ink transition-transform hover:-translate-y-1 active:translate-y-0.5 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40 border-dashed' : ''
      }`}
    >
      {/* Character circular sticker preview */}
      <div
        style={{
          backgroundColor: char.primaryColor,
          color: char.badgeTextColor,
        }}
        className="w-16 h-16 rounded-full border-[2.5px] border-[#2D2200] shadow-flat-ink-sm flex flex-col items-center justify-center mb-2 relative"
      >
        <span className="text-[8px] font-bold uppercase tracking-tight opacity-80 leading-none">
          Sticker
        </span>
        <span className="font-extrabold text-[12px] leading-tight">
          {char.name}
        </span>
      </div>

      <span className="font-extrabold text-[14px] text-[#2D2200]">
        {char.name}
      </span>
      <span className="text-[11px] font-semibold text-[#2D2200]/70">
        {char.animal}
      </span>
      <span className="mt-1 text-[11px] font-bold text-[#2D2200] underline">
        + Drag or tap
      </span>
    </div>
  );
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddBlock,
  onAddSticker,
  onOpenCustomBlockModal,
  isPageFull = false,
  onPageFullAttempt,
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'characters'>('blocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'morning', label: 'Morning' },
    { key: 'learning', label: 'Learning' },
    { key: 'meals', label: 'Meals' },
    { key: 'play', label: 'Play' },
    { key: 'winddown', label: 'Wind-down' },
  ];

  const filteredBlocks = STARTER_BLOCKS.filter((block) => {
    const matchesCategory =
      selectedCategory === 'all' || block.category === selectedCategory;
    const matchesSearch =
      block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-80 h-full bg-white border-r-[1.5px] border-[#2D2200] flex flex-col shrink-0 overflow-hidden font-['Nunito']">
      {/* Sidebar Header & Tabs */}
      <div className="p-4 border-b-[1.5px] border-[#2D2200] bg-white">
        <div className="flex rounded-full border-[1.5px] border-[#2D2200] p-1 bg-[#F8F7F4] shadow-flat-ink-sm">
          <button
            type="button"
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 py-2 rounded-full font-extrabold text-[14px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'blocks'
                ? 'bg-[#2D2200] text-white shadow-sm'
                : 'text-[#2D2200] hover:text-[#2D2200]/80'
            }`}
          >
            <Sparkles size={15} />
            <span>Activities</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-2 rounded-full font-extrabold text-[14px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-[#2D2200] text-white shadow-sm'
                : 'text-[#2D2200] hover:text-[#2D2200]/80'
            }`}
          >
            <User size={15} />
            <span>Characters</span>
          </button>
        </div>
      </div>

      {/* ACTIVITIES TAB */}
      {activeTab === 'blocks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2200]/60"
              />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full border-[1.5px] border-[#2D2200] text-[14px] text-[#2D2200] placeholder-[#2D2200]/40 focus-ink"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1 rounded-full text-[12px] font-bold shrink-0 transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-[#2D2200] text-white'
                      : 'border-[1.5px] border-[#2D2200]/30 text-[#2D2200] hover:border-[#2D2200]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Custom Block Creator Button */}
            <button
              type="button"
              disabled={isPageFull}
              onClick={() => {
                if (isPageFull) {
                  onPageFullAttempt?.();
                  return;
                }
                onOpenCustomBlockModal();
              }}
              className={`w-full mt-1 py-2 px-3 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] text-[13px] font-extrabold shadow-flat-ink flex items-center justify-center gap-1.5 transition-all ${
                isPageFull
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Make a custom block</span>
            </button>
          </div>

          {/* Activity Cards List */}
          <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-2">
            <div className="text-[11px] font-bold text-[#2D2200]/60 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Drag onto planner or tap to add</span>
              {isPageFull && (
                <span className="text-[#E52311] font-bold">Page full</span>
              )}
            </div>

            {filteredBlocks.map((item, idx) => (
              <DraggableBlockItem
                key={`${item.label}-${idx}`}
                item={item}
                index={idx}
                isPageFull={isPageFull}
                onFullAttempt={onPageFullAttempt}
                onAdd={() => onAddBlock(item)}
              />
            ))}

            {filteredBlocks.length === 0 && (
              <div className="py-8 text-center text-[#2D2200]/70 text-[13px]">
                No activities found. Try another word or create a custom one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHARACTERS TAB */}
      {activeTab === 'characters' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-[#F8F7F4] rounded-[16px] border-[1.5px] border-[#2D2200]/30 text-[13px] text-[#2D2200] flex items-start gap-2">
            <HelpCircle size={16} className="shrink-0 mt-0.5 text-[#2D2200]" />
            <span>
              Characters are the <strong>only colour</strong> on the page. Drag them onto the schedule or tap to add.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CHARACTERS.map((char) => (
              <DraggableStickerItem
                key={char.key}
                char={char}
                onAdd={() => onAddSticker(char.key)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
