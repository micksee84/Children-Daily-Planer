import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, CharacterSticker, SchedulePlan } from '../types';
import { SunshineLogo } from './SunshineLogo';
import { HeaderCharacterBadge, CharacterStickerItem } from './CharacterStickerItem';
import { DailyRoutineView } from './DailyRoutineView';
import { WeeklyPlannerView } from './WeeklyPlannerView';
import { ChecklistView } from './ChecklistView';
import { FirstThenView } from './FirstThenView';

interface GhostInfo {
  timeStr: string;
  dayKey?: ActivityBlock['dayOfWeek'];
  isNoState?: boolean;
  label?: string;
  iconName?: string;
  duration?: number;
}

interface PageCanvasProps {
  plan: SchedulePlan;
  isGrayscale?: boolean;
  selectedBlockId: string | null;
  selectedStickerId: string | null;
  activeDropId?: string | null;
  activeGhost?: GhostInfo | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onSelectSticker: (id: string) => void;
  onDeselectAll: () => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateSticker: (id: string, updates: Partial<CharacterSticker>) => void;
  onDeleteSticker: (id: string) => void;
  onUpdatePlan: (updates: Partial<SchedulePlan>) => void;
  onAddBlockAtTime?: (timeStr: string) => void;
  onAddBlockToDay?: (day: ActivityBlock['dayOfWeek']) => void;
  onAddStep?: () => void;
  onAssignToSlot?: (slot: 'first' | 'then') => void;
  isPrintMode?: boolean;
  scale?: number;
}

export const PageCanvas = React.forwardRef<HTMLDivElement, PageCanvasProps>(
  (
    {
      plan,
      isGrayscale = false,
      selectedBlockId,
      selectedStickerId,
      activeDropId = null,
      activeGhost = null,
      onSelectBlock,
      onSelectSticker,
      onDeselectAll,
      onUpdateBlock,
      onDuplicateBlock,
      onDeleteBlock,
      onUpdateSticker,
      onDeleteSticker,
      onUpdatePlan,
      onAddBlockAtTime,
      onAddBlockToDay,
      onAddStep,
      onAssignToSlot,
      isPrintMode = false,
      scale = 1,
    },
    forwardedRef
  ) => {
    const isLandscape = plan.orientation === 'landscape';
    const pageWidth = isLandscape ? 1056 : 816;
    const pageHeight = isLandscape ? 816 : 1056;

    // Inline editing state for Child Name
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(plan.childName);

    // Inline editing state for Page Title
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(plan.title);

    // Inline editing state for Date Range
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [dateInput, setDateInput] = useState(plan.dateRange);

    useEffect(() => {
      setNameInput(plan.childName);
    }, [plan.childName]);

    useEffect(() => {
      setTitleInput(plan.title);
    }, [plan.title]);

    useEffect(() => {
      setDateInput(plan.dateRange);
    }, [plan.dateRange]);

    const handleSaveName = () => {
      setIsEditingName(false);
      if (nameInput !== plan.childName) {
        onUpdatePlan({ childName: nameInput.trim() });
      }
    };

    const handleSaveTitle = () => {
      setIsEditingTitle(false);
      const trimmed = titleInput.trim();
      if (trimmed && trimmed !== plan.title) {
        onUpdatePlan({ title: trimmed, name: trimmed });
      } else {
        setTitleInput(plan.title);
      }
    };

    const handleSaveDate = () => {
      setIsEditingDate(false);
      if (dateInput !== plan.dateRange) {
        onUpdatePlan({ dateRange: dateInput.trim() });
      }
    };

    const { setNodeRef: setCanvasDroppableRef } = useDroppable({
      id: 'page-canvas',
      data: {
        type: 'page-canvas',
      },
      disabled: isPrintMode,
    });

    const setMergedRef = (el: HTMLDivElement | null) => {
      setCanvasDroppableRef(el);
      if (typeof forwardedRef === 'function') {
        forwardedRef(el);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    };

    return (
      <div
        ref={setMergedRef}
        id="print-sheet"
        onClick={onDeselectAll}
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          filter: isGrayscale ? 'grayscale(100%)' : 'none',
          backgroundColor: '#FFFFFF',
          color: '#2D2200',
        }}
        className={`print-page-container relative bg-white text-[#2D2200] shadow-[0_12px_40px_rgba(45,34,0,0.12)] border-[2px] border-[#2D2200]/20 select-none flex flex-col justify-between overflow-hidden transition-all ${
          plan.dyslexiaFriendly ? 'font-dyslexia' : ''
        } ${isLandscape ? 'landscape' : ''}`}
      >
        {/* INNER PAGE WRAPPER WITH PRECISE SPECIFIED ANATOMY MARGINS:
            44px top, 56px sides, 36px bottom, 20px internal gaps */}
        <div
          style={{
            padding: isLandscape ? '32px 48px 28px 48px' : '44px 56px 36px 56px',
            gap: '16px',
          }}
          className="w-full h-full flex flex-col justify-between relative"
        >
          {/* 1. TOP ROW:
              - Sunshine Brigade logo at left (28-32px tall, sb-logo.svg)
              - At right: "Name:" with inline edit or 1.5px write-on line */}
          <div className="flex items-center justify-between shrink-0 h-10">
            <SunshineLogo height={32} />

            {/* Child Name: Click to edit inline */}
            <div className="flex items-baseline gap-2">
              <span className="font-['Nunito'] font-extrabold text-[16px] text-[#2D2200]">
                Name:
              </span>
              {isEditingName && !isPrintMode ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="Type child's name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setNameInput(plan.childName);
                      setIsEditingName(false);
                    }
                  }}
                  className="font-['Nunito'] font-bold text-[18px] text-[#2D2200] border-b-[1.5px] border-[#2D2200] px-2 min-w-[120px] text-center focus:outline-none bg-transparent"
                />
              ) : plan.childName ? (
                <span
                  onClick={(e) => {
                    if (!isPrintMode) {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }
                  }}
                  title="Click to edit name"
                  className="font-['Nunito'] font-bold text-[18px] text-[#2D2200] border-b-[1.5px] border-[#2D2200] px-2 min-w-[120px] text-center cursor-pointer no-print:hover:border-dashed"
                >
                  {plan.childName}
                </span>
              ) : (
                <div
                  onClick={(e) => {
                    if (!isPrintMode) {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }
                  }}
                  title="Click to type child's name (or print as write-on line)"
                  style={{ borderBottom: '1.5px solid #2D2200' }}
                  className="w-36 sm:w-44 h-5 cursor-pointer no-print:hover:border-dashed no-print:hover:border-[#2D2200]"
                />
              )}
            </div>
          </div>

          {/* 2 & 3. TITLE BLOCK & OPTIONAL HEADER CHARACTER STICKER
              - Ink sticker title (~58px, or adapted for landscape) with inline edit
              - Date / week badge with inline edit
              - Character sticker (170–180px) overlapping top of schedule frame by ~64px */}
          <div className="relative shrink-0 flex items-start justify-between min-h-[90px]">
            <div className="flex flex-col items-start z-10 max-w-[620px]">
              {/* Title Sticker: Click to edit */}
              {isEditingTitle && !isPrintMode ? (
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleInput(plan.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className={`ink-sticker-title ${
                    isLandscape ? 'text-[44px]' : 'text-[54px]'
                  } font-normal tracking-wide bg-transparent border-b-[2px] border-dashed border-[#2D2200] focus:outline-none w-full`}
                />
              ) : (
                <h1
                  onClick={(e) => {
                    if (!isPrintMode) {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }
                  }}
                  title="Click to edit title"
                  className={`ink-sticker-title ${
                    isLandscape ? 'text-[44px]' : 'text-[54px]'
                  } font-normal tracking-wide cursor-pointer no-print:hover:ring-2 no-print:hover:ring-dashed no-print:hover:ring-[#2D2200] rounded-lg px-1`}
                >
                  {plan.title || "My day"}
                </h1>
              )}

              {/* Date / Week Range Badge: Click to edit */}
              {isEditingDate && !isPrintMode ? (
                <input
                  type="text"
                  autoFocus
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  onBlur={handleSaveDate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDate();
                    if (e.key === 'Escape') {
                      setDateInput(plan.dateRange);
                      setIsEditingDate(false);
                    }
                  }}
                  className="mt-1.5 px-4 py-1 rounded-full bg-white border-[1.5px] border-[#2D2200] shadow-flat-ink font-['Nunito'] font-extrabold text-[13px] text-[#2D2200] focus:outline-none"
                />
              ) : (
                plan.dateRange && (
                  <div
                    onClick={(e) => {
                      if (!isPrintMode) {
                        e.stopPropagation();
                        setIsEditingDate(true);
                      }
                    }}
                    title="Click to edit date badge"
                    className="mt-1.5 px-4 py-1 rounded-full bg-white border-[1.5px] border-[#2D2200] shadow-flat-ink flex items-center cursor-pointer no-print:hover:border-dashed"
                  >
                    <span className="font-['Nunito'] font-extrabold text-[13px] text-[#2D2200] tracking-wide">
                      {plan.dateRange}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Header Character Sticker (Overlaps top of schedule frame) */}
            {plan.showHeaderSticker && (
              <div
                style={{
                  marginTop: '-16px',
                  marginBottom: '-52px',
                  zIndex: 25,
                }}
                className="shrink-0 drop-shadow-md"
              >
                <HeaderCharacterBadge characterKey={plan.headerCharacter} />
              </div>
            )}
          </div>

          {/* 4. SCHEDULE FRAME:
              - 3px ink border, radius 20px, containing the timetable */}
          <div
            style={{
              borderColor: '#2D2200',
              borderRadius: '20px',
              borderWidth: '3px',
              backgroundColor: '#FFFFFF',
            }}
            className="flex-1 w-full bg-white overflow-hidden relative flex flex-col"
          >
            {/* Template Renderers */}
            {plan.template === 'daily' && (
              <DailyRoutineView
                plan={plan}
                selectedBlockId={selectedBlockId}
                activeGhost={activeGhost}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                onAddBlockAtTime={onAddBlockAtTime}
                isPrintMode={isPrintMode}
              />
            )}

            {plan.template === 'weekly' && (
              <WeeklyPlannerView
                plan={plan}
                selectedBlockId={selectedBlockId}
                activeGhost={activeGhost}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                onAddBlockToDay={onAddBlockToDay}
                isPrintMode={isPrintMode}
              />
            )}

            {plan.template === 'checklist' && (
              <ChecklistView
                plan={plan}
                selectedBlockId={selectedBlockId}
                activeDropId={activeDropId}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                onAddStep={onAddStep}
                isPrintMode={isPrintMode}
              />
            )}

            {plan.template === 'first-then' && (
              <FirstThenView
                plan={plan}
                selectedBlockId={selectedBlockId}
                activeDropId={activeDropId}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                onAssignToSlot={onAssignToSlot}
                isPrintMode={isPrintMode}
              />
            )}
          </div>

          {/* 5. FOOTER:
              - 1.5px rule above
              - Left: "Learn. Wonder. Shine."
              - Right: "sunshinebrigade.ca · Free for home and classroom use" */}
          <div
            style={{
              borderTop: '1.5px solid #2D2200',
              letterSpacing: '0.02em',
            }}
            className="pt-2 flex items-center justify-between shrink-0 font-['Nunito'] font-semibold text-[11px] sm:text-[12px] text-[#2D2200]"
          >
            <span className="font-extrabold tracking-wider">
              Learn. Wonder. Shine.
            </span>
            <span className="opacity-90">
              sunshinebrigade.ca · Free for home and classroom use
            </span>
          </div>

          {/* Freely Placed Character Stickers on the Canvas */}
          {plan.stickers.map((sticker) => (
            <CharacterStickerItem
              key={sticker.id}
              sticker={sticker}
              isSelected={selectedStickerId === sticker.id}
              onSelect={onSelectSticker}
              onUpdate={onUpdateSticker}
              onDelete={onDeleteSticker}
              isPrintMode={isPrintMode}
            />
          ))}
        </div>
      </div>
    );
  }
);

PageCanvas.displayName = 'PageCanvas';
