import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ActivityBlock, CharacterSticker, SchedulePlan } from '../types';
import { CharacterStickerItem } from './CharacterStickerItem';

/** 0.25in at 96px per inch: the margin kept clear on every edge of the sheet. */
export const PAGE_MARGIN_PX = 24;
/** The one spacing used between the header, the planner frame and the footer. */
export const SECTION_GAP_PX = 16;
import { DailyRoutineView } from './DailyRoutineView';
import { WeeklyPlannerView } from './WeeklyPlannerView';
import { ChecklistView } from './ChecklistView';
import { FirstThenView } from './FirstThenView';

import { GridGhost } from './ScheduleGrid';

interface PageCanvasProps {
  plan: SchedulePlan;
  isGrayscale?: boolean;
  selectedBlockId: string | null;
  selectedStickerId: string | null;
  activeDropId?: string | null;
  ghost?: GridGhost | null;
  onSelectBlock: (block: ActivityBlock) => void;
  onSelectSticker: (id: string) => void;
  onDeselectAll: () => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateSticker: (id: string, updates: Partial<CharacterSticker>) => void;
  onDeleteSticker: (id: string) => void;
  onUpdatePlan: (updates: Partial<SchedulePlan>) => void;
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
      ghost = null,
      onSelectBlock,
      onSelectSticker,
      onDeselectAll,
      onUpdateBlock,
      onDuplicateBlock,
      onDeleteBlock,
      onUpdateSticker,
      onDeleteSticker,
      onUpdatePlan,
      onAddStep,
      onAssignToSlot,
      isPrintMode = false,
      scale = 1,
    },
    forwardedRef
  ) => {
    const isLandscape = plan.orientation === 'landscape';
    // The title shares the header row with the centred date, so long titles step down in size
    // to stay on their side of the page (Super Joyful is about 0.5em per character).
    const titleBase = isLandscape ? 44 : 40;
    const titleRoom = isLandscape ? 390 : 270;
    const titleChars = Math.max(1, (plan.title || 'My day').length);
    const titleSize = Math.max(18, Math.min(titleBase, Math.floor(titleRoom / (titleChars * 0.5))));
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
        id={isPrintMode ? undefined : "print-sheet"}
        onClick={onDeselectAll}
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          filter: isGrayscale ? 'grayscale(100%)' : 'none',
          backgroundColor: '#FFFFFF',
          color: '#2D2200',
        }}
        className={`print-page-container relative bg-white text-[#2D2200] shadow-[0_0_0_2px_rgba(45,34,0,0.2),0_12px_40px_rgba(45,34,0,0.12)] select-none flex flex-col overflow-hidden transition-all ${
          plan.dyslexiaFriendly ? 'font-dyslexia' : ''
        } ${isLandscape ? 'landscape' : ''}`}
      >
        {/* PAGE LAYOUT
            Every edge of the sheet keeps a 0.25in (24px) margin, and the header, planner
            and footer are spaced by the same 16px, so everything lines up on one grid. */}
        <div
          style={{ padding: `${PAGE_MARGIN_PX}px`, gap: `${SECTION_GAP_PX}px` }}
          className="w-full h-full flex flex-col relative"
        >
          {/* 1. HEADER ROW: title on the left margin, date badge centred on the page, name on
              the right margin. The two side columns share the leftover width equally, so the
              date stays centred whatever the title's length. */}
          <div
            className="shrink-0 grid items-center gap-4"
            style={{ gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' }}
          >
            <div className="justify-self-start min-w-0 z-10">
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
                  style={{ fontSize: `${titleSize}px` }}
                  className={`ink-sticker-title font-normal tracking-wide bg-transparent border-b-[2px] border-dashed border-[#2D2200] focus:outline-none w-full`}
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
                  style={{ fontSize: `${titleSize}px` }}
                  className={`ink-sticker-title font-normal tracking-wide whitespace-nowrap leading-none cursor-pointer no-print:hover:ring-2 no-print:hover:ring-dashed no-print:hover:ring-[#2D2200] rounded-lg`}
                >
                  {plan.title || "My day"}
                </h1>
              )}

            </div>

            <div className="justify-self-center z-10">
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
                  className="px-4 py-1 rounded-full bg-white border-[1.5px] border-[#2D2200] shadow-flat-ink font-['Nunito'] font-extrabold text-[13px] text-[#2D2200] focus:outline-none"
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
                    className="px-4 py-1 rounded-full bg-white border-[1.5px] border-[#2D2200] shadow-flat-ink flex items-center cursor-pointer no-print:hover:border-dashed"
                  >
                    <span className="font-['Nunito'] font-extrabold text-[13px] text-[#2D2200] tracking-wide">
                      {plan.dateRange}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Child Name: click to edit inline, or print as a write-on line */}
            <div className="justify-self-end flex items-end gap-2 min-w-0">
              <span className="font-['Nunito'] font-extrabold text-[16px] leading-none text-[#2D2200] shrink-0">
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
                  className={`${isLandscape ? 'w-56' : 'w-40'} h-[18px] cursor-pointer no-print:hover:border-dashed no-print:hover:border-[#2D2200]`}
                />
              )}
            </div>
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
                ghost={ghost}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                isPrintMode={isPrintMode}
              />
            )}

            {plan.template === 'weekly' && (
              <WeeklyPlannerView
                plan={plan}
                selectedBlockId={selectedBlockId}
                ghost={ghost}
                onSelectBlock={onSelectBlock}
                onUpdateBlock={onUpdateBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
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

          {/* 5. FOOTER: 1.5px rule above, the tagline on the left margin and the website on
              the right margin. A planner is always one page, so there is no page number. */}
          <div
            style={{
              borderTop: '1.5px solid #2D2200',
              letterSpacing: '0.02em',
            }}
            className="pt-2 flex items-center justify-between shrink-0 font-['Nunito'] font-bold text-[12px] leading-none text-[#2D2200]"
          >
            <span>Learn. Wonder. Shine.</span>
            <span>sunshinebrigade.ca</span>
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
