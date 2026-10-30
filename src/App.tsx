/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import {
  ActivityBlock,
  CharacterKey,
  CharacterSticker,
  SchedulePlan,
  TemplateType,
} from './types';
import { StarterBlockTemplate, createBlockFromTemplate } from './constants/starterBlocks';
import { createInitialPlan } from './constants/templates';
import { loadSavedPlans, savePlansToStorage } from './utils/storage';
import { exportPageToPdf } from './utils/pdfExport';
import {
  DAILY_COLUMN,
  GridColumnKey,
  durationToSpan,
  findNearestFreeRow,
  getPlacement,
  parseCellId,
  rowToTime,
  spanToDuration,
} from './utils/grid';
import { GridGhost } from './components/ScheduleGrid';
import { getPlanCapacityInfo, validateTimeRange } from './utils/pageLimits';
import { HeaderNav, PlannerView } from './components/HeaderNav';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { PageCanvas } from './components/PageCanvas';
import { CustomBlockModal } from './components/CustomBlockModal';
import { Toast, ToastMessage } from './components/Toast';
import { DragPreviewOverlay, ActiveDragItem } from './components/DragPreviewOverlay';
import confetti from 'canvas-confetti';
import { Menu, SlidersHorizontal } from 'lucide-react';


export default function App() {
  const [plansState, setPlansState] = useState<{
    plans: SchedulePlan[];
    activeId: string;
  }>(() => loadSavedPlans());

  // Active plan
  const currentPlan =
    plansState.plans.find((p) => p.id === plansState.activeId) ||
    plansState.plans[0] ||
    createInitialPlan('daily');

  // History stack for undo / redo
  const [history, setHistory] = useState<SchedulePlan[]>([currentPlan]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Selection
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Editor states
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.72);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Drag and drop states
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<GridGhost | null>(null);
  // Which row of a block the pointer grabbed, so the block keeps that offset while dragging.
  const grabOffsetRows = useRef<number>(0);
  const [isOutsidePage, setIsOutsidePage] = useState<boolean>(false);

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Mobile sidebar drawers
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Capacity calculation
  const capacityInfo = getPlanCapacityInfo(currentPlan);

  // dnd-kit sensors: Pointer and Touch with 6px activation distance so taps still select
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 6,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // Auto-save to localStorage whenever plans change
  useEffect(() => {
    savePlansToStorage(plansState.plans, plansState.activeId);
  }, [plansState]);

  // Push updated plan to state & undo history (clean separated updates, no nested setters)
  const updateCurrentPlan = useCallback(
    (updates: Partial<SchedulePlan>, recordHistory: boolean = true) => {
      const nextPlan: SchedulePlan = {
        ...currentPlan,
        ...updates,
        updatedAt: Date.now(),
      };

      if (recordHistory) {
        setHistory((prev) => {
          const trimmed = prev.slice(0, historyIndex + 1);
          return [...trimmed, nextPlan];
        });
        setHistoryIndex((prevIdx) => prevIdx + 1);
      }

      setPlansState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === prev.activeId ? nextPlan : p)),
      }));
    },
    [currentPlan, historyIndex]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevPlan = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setPlansState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === prev.activeId ? prevPlan : p)),
      }));
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextPlan = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setPlansState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === prev.activeId ? nextPlan : p)),
      }));
    }
  }, [historyIndex, history]);

  // Block deletion with toast & undo
  const handleDeleteBlock = useCallback(
    (id: string) => {
      const blockToDelete = currentPlan.blocks.find((b) => b.id === id);
      if (!blockToDelete) return;

      const nextBlocks = currentPlan.blocks.filter((b) => b.id !== id);
      updateCurrentPlan({ blocks: nextBlocks });
      if (selectedBlockId === id) setSelectedBlockId(null);

      // Show toast with Undo button
      setToast({
        id: `toast-${Date.now()}`,
        message: 'Block removed',
        onUndo: () => {
          updateCurrentPlan({
            blocks: [...currentPlan.blocks],
          });
        },
      });
    },
    [currentPlan.blocks, selectedBlockId, updateCurrentPlan]
  );

  // Sticker deletion with toast & undo
  const handleDeleteSticker = useCallback(
    (id: string) => {
      const stickerToDelete = currentPlan.stickers.find((s) => s.id === id);
      if (!stickerToDelete) return;

      const nextStickers = currentPlan.stickers.filter((s) => s.id !== id);
      updateCurrentPlan({ stickers: nextStickers });
      if (selectedStickerId === id) setSelectedStickerId(null);

      setToast({
        id: `toast-${Date.now()}`,
        message: 'Sticker removed',
        onUndo: () => {
          updateCurrentPlan({
            stickers: [...currentPlan.stickers],
          });
        },
      });
    },
    [currentPlan.stickers, selectedStickerId, updateCurrentPlan]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape closes the block or sticker settings by deselecting, like clicking the page
      if (!isInput && e.key === 'Escape' && (selectedBlockId || selectedStickerId)) {
        setSelectedBlockId(null);
        setSelectedStickerId(null);
        return;
      }

      // Delete block or sticker
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedBlockId) {
          e.preventDefault();
          handleDeleteBlock(selectedBlockId);
        } else if (selectedStickerId) {
          e.preventDefault();
          handleDeleteSticker(selectedStickerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedBlockId, selectedStickerId, handleDeleteBlock, handleDeleteSticker]);

  const isGridTemplate = currentPlan.template === 'daily' || currentPlan.template === 'weekly';

  const showFullToast = () =>
    setToast({
      id: `toast-${Date.now()}`,
      message: 'This page is full. Remove a block or change the time range.',
      duration: 4000,
    });

  /**
   * Finds a spot for a new block on the grid: the requested row (or the top of
   * the day), at the requested length, falling back to one row if a longer
   * block will not fit anywhere. Returns null when the column is full.
   */
  const findGridSpot = (
    column: GridColumnKey,
    preferredRow: number,
    durationMinutes: number,
    excludeBlockId?: string
  ): { row: number; span: number } | null => {
    const wanted = durationToSpan(currentPlan, durationMinutes);
    for (const span of wanted > 1 ? [wanted, 1] : [1]) {
      const row = findNearestFreeRow(currentPlan, column, preferredRow, span, excludeBlockId);
      if (row !== null) return { row, span };
    }
    return null;
  };

  const columnForNewBlock = (): GridColumnKey =>
    currentPlan.template === 'weekly' ? 'mon' : DAILY_COLUMN;

  const toBlockPosition = (column: GridColumnKey, row: number, span: number) => ({
    startTime: rowToTime(currentPlan, row),
    durationMinutes: spanToDuration(currentPlan, span),
    dayOfWeek: column === DAILY_COLUMN ? undefined : (column as ActivityBlock['dayOfWeek']),
  });

  // Block management
  const handleAddBlockFromTemplate = (template: StarterBlockTemplate) => {
    if (capacityInfo.isFull) {
      setToast({
        id: `toast-${Date.now()}`,
        message: 'This page is full. Remove a block or change the time range.',
        duration: 4000,
      });
      return;
    }

    const newBlock = createBlockFromTemplate(template);
    if (isGridTemplate) {
      const column = columnForNewBlock();
      const spot = findGridSpot(column, 0, template.defaultDuration);
      if (!spot) {
        showFullToast();
        return;
      }
      Object.assign(newBlock, toBlockPosition(column, spot.row, spot.span));
    } else if (currentPlan.template === 'checklist') {
      newBlock.slotIndex = currentPlan.blocks.length;
    }
    updateCurrentPlan({
      blocks: [...currentPlan.blocks, newBlock],
    });
    setSelectedBlockId(newBlock.id);
    setSelectedStickerId(null);
  };

  const handleCreateCustomBlock = (data: {
    label: string;
    iconName: string;
    duration: number;
    category: ActivityBlock['category'];
  }) => {
    if (capacityInfo.isFull) {
      setToast({
        id: `toast-${Date.now()}`,
        message: 'This page is full. Remove a block or change the time range.',
        duration: 4000,
      });
      return;
    }

    const newBlock: ActivityBlock = {
      id: `block-${Date.now()}`,
      label: data.label,
      iconName: data.iconName,
      category: data.category,
      durationMinutes: data.duration,
      showCheckbox: true,
    };
    if (isGridTemplate) {
      const column = columnForNewBlock();
      const spot = findGridSpot(column, 0, data.duration);
      if (!spot) {
        showFullToast();
        return;
      }
      Object.assign(newBlock, toBlockPosition(column, spot.row, spot.span));
    } else if (currentPlan.template === 'checklist') {
      newBlock.slotIndex = currentPlan.blocks.length;
    }
    updateCurrentPlan({
      blocks: [...currentPlan.blocks, newBlock],
    });
    setSelectedBlockId(newBlock.id);
    setSelectedStickerId(null);
  };

  const handleUpdateBlock = (id: string, updates: Partial<ActivityBlock>) => {
    const nextBlocks = currentPlan.blocks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    updateCurrentPlan({ blocks: nextBlocks });
  };

  const handleDuplicateBlock = (block: ActivityBlock) => {
    if (capacityInfo.isFull) {
      setToast({
        id: `toast-${Date.now()}`,
        message: 'This page is full. Remove a block or change the time range.',
        duration: 4000,
      });
      return;
    }

    const duplicated: ActivityBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    if (isGridTemplate) {
      // Place the copy right after the original, or the nearest free gap.
      const placement = getPlacement(currentPlan, block);
      const column = placement?.column ?? columnForNewBlock();
      const after = placement ? placement.row + placement.span : 0;
      const spot = findGridSpot(column, after, block.durationMinutes);
      if (!spot) {
        showFullToast();
        return;
      }
      Object.assign(duplicated, toBlockPosition(column, spot.row, spot.span));
    } else if (currentPlan.template === 'checklist') {
      duplicated.slotIndex = currentPlan.blocks.length;
    }
    updateCurrentPlan({
      blocks: [...currentPlan.blocks, duplicated],
    });
    setSelectedBlockId(duplicated.id);
  };

  // Sticker management
  const handleAddSticker = (charKey: CharacterKey) => {
    const newSticker: CharacterSticker = {
      id: `sticker-${Date.now()}`,
      characterKey: charKey,
      name: charKey.charAt(0).toUpperCase() + charKey.slice(1),
      x: 50,
      y: 45,
      size: 90,
      rotation: 0,
      zIndex: 15,
    };
    updateCurrentPlan({
      stickers: [...currentPlan.stickers, newSticker],
    });
    setSelectedStickerId(newSticker.id);
    setSelectedBlockId(null);
  };

  const handleUpdateSticker = (id: string, updates: Partial<CharacterSticker>) => {
    const nextStickers = currentPlan.stickers.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateCurrentPlan({ stickers: nextStickers });
  };

  // Template change with clear confirmation
  const handleChangeTemplate = (newTemplate: TemplateType) => {
    if (newTemplate === currentPlan.template) return;

    const isLandscape = newTemplate === 'weekly' || newTemplate === 'first-then';
    // The weekly page is landscape and shorter, so a 30-minute grid may not fit.
    // Step up to a bigger time step rather than squashing rows too small to read.
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const fittedIncrement = ([currentPlan.timeIncrement, 30, 60] as const).find(
      (inc) =>
        inc >= currentPlan.timeIncrement &&
        validateTimeRange(currentPlan.timeStartHour, currentPlan.timeEndHour, inc, orientation).valid
    ) ?? 60;

    // If blocks exist, check compatibility or ask confirmation
    if (currentPlan.blocks.length > 0) {
      const willClear =
        newTemplate === 'first-then' ||
        currentPlan.template === 'first-then' ||
        newTemplate === 'checklist' ||
        currentPlan.template === 'checklist';

      if (willClear) {
        const confirmed = window.confirm('Switching will clear your blocks. Continue?');
        if (!confirmed) return;

        updateCurrentPlan({
          template: newTemplate,
          orientation,
          timeIncrement: fittedIncrement,
          blocks: [],
        });
        return;
      }
    }

    // Keep existing blocks if switching between daily and weekly
    const preservedBlocks = currentPlan.blocks.map((b) => ({
      ...b,
      dayOfWeek: b.dayOfWeek || 'mon',
    }));

    updateCurrentPlan({
      template: newTemplate,
      orientation,
      timeIncrement: fittedIncrement,
      blocks: preservedBlocks,
    });
  };

  // Schedule Plan CRUD
  const handleSelectPlan = (id: string) => {
    const target = plansState.plans.find((p) => p.id === id);
    setPlansState((prev) => ({ ...prev, activeId: id }));
    // Undo history belongs to one schedule, so start it fresh for the one just opened.
    if (target) {
      setHistory([target]);
      setHistoryIndex(0);
    }
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  };

  // Day / Week switch. Each view keeps its own schedule, like tabs: switching opens the
  // most recently edited schedule of that kind (or starts a new one) and never converts
  // or clears the schedule you came from.
  // Checklist and First–Then layouts sit outside the switch, so neither tab is active for them.
  const plannerView: PlannerView | null =
    currentPlan.template === 'weekly' ? 'week' : currentPlan.template === 'daily' ? 'day' : null;

  const handleSwitchView = useCallback(
    (view: PlannerView) => {
      const template: TemplateType = view === 'week' ? 'weekly' : 'daily';
      if (currentPlan.template === template) return;

      const existing = [...plansState.plans]
        .filter((p) => p.template === template)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      const target = existing ?? createInitialPlan(template);

      setPlansState((prev) => ({
        plans: existing ? prev.plans : [...prev.plans, target],
        activeId: target.id,
      }));
      setHistory([target]);
      setHistoryIndex(0);
      setSelectedBlockId(null);
      setSelectedStickerId(null);
    },
    [currentPlan.template, plansState.plans]
  );

  // Links can open a view directly: ?view=week or ?view=day (used by the website's tool cards).
  useEffect(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get('view');
      if (requested === 'week' || requested === 'day') handleSwitchView(requested);
    } catch {
      // Ignore a malformed URL and open the last schedule as usual.
    }
    // Run once on first load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNewPlan = () => {
    // A new schedule matches the view you're in, so "New" in Week view makes a week.
    const newPlan = createInitialPlan(currentPlan.template === 'weekly' ? 'weekly' : 'daily');
    setPlansState((prev) => ({
      plans: [...prev.plans, newPlan],
      activeId: newPlan.id,
    }));
    setHistory([newPlan]);
    setHistoryIndex(0);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  };

  const handleDuplicatePlan = () => {
    const duplicatedPlan: SchedulePlan = {
      ...currentPlan,
      id: `plan-${Date.now()}`,
      name: `${currentPlan.name} (Copy)`,
      updatedAt: Date.now(),
    };
    setPlansState((prev) => ({
      plans: [...prev.plans, duplicatedPlan],
      activeId: duplicatedPlan.id,
    }));
    setHistory([duplicatedPlan]);
    setHistoryIndex(0);
  };

  const handleRenamePlan = (newName: string) => {
    updateCurrentPlan({ name: newName });
  };

  const handleDeletePlan = () => {
    if (plansState.plans.length <= 1) return;
    const remaining = plansState.plans.filter((p) => p.id !== currentPlan.id);
    setPlansState({
      plans: remaining,
      activeId: remaining[0].id,
    });
  };

  // =========================================================
  // DRAG & DROP ON THE GRID
  // Every grid row is its own drop target (see ScheduleGrid), so the row
  // under the pointer is known exactly. No pixel maths, so zoom never matters.
  // =========================================================

  /** Rows the dragged item needs, and which block (if any) is being moved. */
  const describeDrag = (item: ActivityBlock | null, paletteDuration?: number) => ({
    span: durationToSpan(currentPlan, item ? item.durationMinutes : paletteDuration || currentPlan.timeIncrement),
    excludeId: item?.id,
  });

  /** Where the dragged item would land if dropped on this droppable. */
  const computeGhost = (overId: string | null, dragItem: ActiveDragItem | null): GridGhost | null => {
    if (!overId || !dragItem || !isGridTemplate) return null;
    if (dragItem.type !== 'palette-block' && dragItem.type !== 'planner-block') return null;
    const cell = parseCellId(overId);
    if (!cell) return null;

    const isNew = dragItem.type === 'palette-block';
    const label = isNew ? dragItem.template.label : dragItem.block.label;
    if (isNew && capacityInfo.isFull) {
      return { column: cell.column, row: cell.row, span: 1, ok: false, label };
    }

    const { span, excludeId } = isNew
      ? describeDrag(null, dragItem.template.defaultDuration)
      : describeDrag(dragItem.block);
    const target = Math.max(0, cell.row - (isNew ? 0 : grabOffsetRows.current));
    const spot = isNew
      ? findGridSpot(cell.column, target, spanToDuration(currentPlan, span))
      : (() => {
          const row = findNearestFreeRow(currentPlan, cell.column, target, span, excludeId);
          return row === null ? null : { row, span };
        })();

    if (!spot) return { column: cell.column, row: target, span, ok: false, label };
    return { column: cell.column, row: spot.row, span: spot.span, ok: true, label };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDragItem | undefined;
    if (!data) return;
    setActiveDragItem(data);
    setIsOutsidePage(false);
    setActiveDropId(null);
    setGhost(null);
    grabOffsetRows.current = 0;

    // Remember which row of a multi-row block was grabbed, so dragging by the
    // middle of a 2-hour block does not shift it down by an hour.
    if (data.type === 'planner-block') {
      const el =
        typeof document !== 'undefined'
          ? document.querySelector(`#print-sheet [data-block-id="${data.block.id}"]`)
          : null;
      const rect = el ? el.getBoundingClientRect() : event.active.rect.current.initial;
      const span = durationToSpan(currentPlan, data.block.durationMinutes);
      const ev = event.activatorEvent as PointerEvent | TouchEvent | null;
      const clientY =
        ev && 'touches' in ev && ev.touches.length ? ev.touches[0].clientY : (ev as PointerEvent | null)?.clientY;
      if (rect && typeof clientY === 'number' && span > 1) {
        const rowHeight = rect.height / span;
        grabOffsetRows.current = Math.max(0, Math.min(span - 1, Math.floor((clientY - rect.top) / rowHeight)));
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      const overId = String(event.over.id);
      setActiveDropId(overId);
      setIsOutsidePage(false);
      setGhost(computeGhost(overId, activeDragItem));
    } else {
      setActiveDropId(null);
      setGhost(null);
      setIsOutsidePage(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeData = active.data.current as ActiveDragItem | undefined;
    const overId = over ? String(over.id) : null;
    const landing = computeGhost(overId, activeData || null);

    setActiveDragItem(null);
    setActiveDropId(null);
    setGhost(null);
    setIsOutsidePage(false);

    if (!activeData) return;

    // 1. DRAGGED OFF THE PAGE: delete (with undo toast)
    if (!over) {
      if (activeData.type === 'planner-block') {
        handleDeleteBlock(activeData.block.id);
      } else if (activeData.type === 'planner-sticker') {
        handleDeleteSticker(activeData.sticker.id);
      }
      return;
    }

    // 2. NEW BLOCK FROM THE PALETTE
    if (activeData.type === 'palette-block') {
      const template = activeData.template;

      if (isGridTemplate) {
        if (capacityInfo.isFull) {
          showFullToast();
          return;
        }
        // Dropped on the page but not on a row: put it in the first free gap.
        const spot = landing
          ? landing.ok
            ? { column: landing.column, row: landing.row, span: landing.span }
            : null
          : (() => {
              const column = columnForNewBlock();
              const found = findGridSpot(column, 0, template.defaultDuration);
              return found ? { column, ...found } : null;
            })();
        if (!spot) {
          setToast({ id: `toast-${Date.now()}`, message: 'No room there. Try another spot.', duration: 3500 });
          return;
        }
        const newBlock = createBlockFromTemplate(template);
        Object.assign(newBlock, toBlockPosition(spot.column, spot.row, spot.span));
        updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
        return;
      }

      if (capacityInfo.isFull) {
        showFullToast();
        return;
      }

      if (overId === 'checklist-dropzone' || currentPlan.template === 'checklist') {
        const newBlock = createBlockFromTemplate(template);
        newBlock.slotIndex = currentPlan.blocks.length;
        updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
        return;
      }

      if (overId === 'firstthen-first' || overId === 'firstthen-then') {
        const slot: 'first' | 'then' = overId === 'firstthen-first' ? 'first' : 'then';
        const newBlock = createBlockFromTemplate(template);
        newBlock.isFirstThenSlot = slot;
        const otherBlocks = currentPlan.blocks.filter((b) => b.isFirstThenSlot !== slot);
        updateCurrentPlan({ blocks: [...otherBlocks, newBlock] });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
      }
      return;
    }

    // 3. MOVING A BLOCK THAT IS ALREADY ON THE PAGE
    if (activeData.type === 'planner-block') {
      const block = activeData.block;

      if (isGridTemplate) {
        if (landing?.ok) {
          handleUpdateBlock(block.id, {
            startTime: rowToTime(currentPlan, landing.row),
            dayOfWeek: landing.column === DAILY_COLUMN ? block.dayOfWeek : (landing.column as ActivityBlock['dayOfWeek']),
          });
        } else if (landing && !landing.ok) {
          setToast({ id: `toast-${Date.now()}`, message: 'No room there. Try another spot.', duration: 3500 });
        }
        // Dropped on the page but not on a row: it simply stays where it was.
        setSelectedBlockId(block.id);
        return;
      }

      if (overId === 'firstthen-first' || overId === 'firstthen-then') {
        const targetSlot: 'first' | 'then' = overId === 'firstthen-first' ? 'first' : 'then';
        const otherBlocks = currentPlan.blocks.filter(
          (b) => b.id !== block.id && b.isFirstThenSlot !== targetSlot
        );
        const updated: ActivityBlock = { ...block, isFirstThenSlot: targetSlot };
        updateCurrentPlan({ blocks: [...otherBlocks, updated] });
        setSelectedBlockId(block.id);
        return;
      }
    }

    // 4. CREATING STICKER FROM PALETTE
    if (activeData.type === 'palette-sticker') {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const unscaledWidth = canvasRef.current.offsetWidth || 816;
        const unscaledHeight = canvasRef.current.offsetHeight || 1056;

        // Default drop near center or pointer
        const newSticker: CharacterSticker = {
          id: `sticker-${Date.now()}`,
          characterKey: activeData.characterKey,
          name: activeData.characterKey.charAt(0).toUpperCase() + activeData.characterKey.slice(1),
          x: 50,
          y: 45,
          size: 90,
          rotation: 0,
          zIndex: 15,
        };
        updateCurrentPlan({
          stickers: [...currentPlan.stickers, newSticker],
        });
        setSelectedStickerId(newSticker.id);
      }
      return;
    }

    // 5. MOVING STICKER ON PLANNER (Uses delta divided by zoom, clamped inside page)
    if (activeData.type === 'planner-sticker') {
      if (canvasRef.current) {
        const unscaledWidth = canvasRef.current.offsetWidth || 816;
        const unscaledHeight = canvasRef.current.offsetHeight || 1056;

        const deltaXPct = ((delta.x / zoom) / unscaledWidth) * 100;
        const deltaYPct = ((delta.y / zoom) / unscaledHeight) * 100;

        const newX = Math.max(8, Math.min(92, activeData.sticker.x + deltaXPct));
        const newY = Math.max(8, Math.min(92, activeData.sticker.y + deltaYPct));

        handleUpdateSticker(activeData.sticker.id, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
        setSelectedStickerId(activeData.sticker.id);
      }
    }
  };

  // Print & PDF Export
  const handlePrint = () => {
    setSelectedBlockId(null);
    setSelectedStickerId(null);

    // When the planner is embedded in another site (e.g. the Framer /interactive
    // page), browsers print the parent page instead of the planner. Open the
    // planner in its own tab and print from there. Plans live in localStorage on
    // this origin, so the new tab shows the same schedule.
    let isEmbedded = false;
    try {
      isEmbedded = window.self !== window.top;
    } catch {
      isEmbedded = true;
    }
    if (isEmbedded) {
      const url = new URL(window.location.href);
      url.hash = 'print';
      window.open(url.toString(), '_blank', 'noopener');
      return;
    }

    window.print();
  };

  // Auto-print when opened via the embedded "Print" flow above.
  useEffect(() => {
    if (window.location.hash !== '#print') return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    const fontsReady = (document as any).fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => setTimeout(() => window.print(), 400));
  }, []);

  const handleDownloadPdf = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExportingPdf(true);
      setSelectedBlockId(null);
      setSelectedStickerId(null);
      const isLandscape = currentPlan.orientation === 'landscape';
      const cleanName = (currentPlan.name || 'My_day').replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportPageToPdf(
        canvasRef.current,
        `${cleanName}-SunshineBrigade.pdf`,
        isLandscape
      );

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F2B800', '#009BD9', '#EE7B22', '#5BAE3C', '#2D2200'],
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const selectedBlock =
    currentPlan.blocks.find((b) => b.id === selectedBlockId) || null;
  const selectedSticker =
    currentPlan.stickers.find((s) => s.id === selectedStickerId) || null;

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-screen h-screen flex flex-col bg-[#F2F2E2] text-[#2D2200] overflow-hidden">
        {/* Top Header Navigation */}
        <HeaderNav
          plans={plansState.plans}
          currentPlan={currentPlan}
          plannerView={plannerView}
          onSwitchView={handleSwitchView}
          capacityLabel={capacityInfo.label}
          onSelectPlan={handleSelectPlan}
          onCreateNewPlan={handleCreateNewPlan}
          onDuplicatePlan={handleDuplicatePlan}
          onRenamePlan={handleRenamePlan}
          onDeletePlan={handleDeletePlan}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          isGrayscale={isGrayscale}
          onToggleGrayscale={() => setIsGrayscale(!isGrayscale)}
          zoom={zoom}
          onZoomChange={setZoom}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          isExportingPdf={isExportingPdf}
        />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar (Activity & Character Palette) */}
          <div
            className={`${
              showLeftSidebar ? 'block' : 'hidden md:block'
            } z-20 shrink-0 h-full`}
          >
            <LeftSidebar
              onAddBlock={handleAddBlockFromTemplate}
              onAddSticker={handleAddSticker}
              onOpenCustomBlockModal={() => setIsCustomModalOpen(true)}
              isPageFull={capacityInfo.isFull}
              onPageFullAttempt={() => {
                setToast({
                  id: `toast-${Date.now()}`,
                  message: 'This page is full. Remove a block or change the time range.',
                  duration: 4000,
                });
              }}
            />
          </div>

          {/* Center: Live Page Preview */}
          <main
            onClick={() => {
              setSelectedBlockId(null);
              setSelectedStickerId(null);
            }}
            className="flex-1 h-full overflow-auto bg-[#EAE6D6] flex items-center justify-center p-4 sm:p-8 relative"
          >
            {/* Quick Drawer toggles for smaller screens */}
            <div className="md:hidden absolute top-3 left-3 z-30 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                className="p-2 bg-white rounded-full border-[1.5px] border-[#2D2200] shadow-flat-ink text-[#2D2200]"
              >
                <Menu size={18} />
              </button>
            </div>

            <div className="md:hidden absolute top-3 right-3 z-30 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="p-2 bg-white rounded-full border-[1.5px] border-[#2D2200] shadow-flat-ink text-[#2D2200]"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            {/* Scaled Printable Canvas Container */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shrink-0 my-auto"
            >
              <PageCanvas
                ref={canvasRef}
                plan={currentPlan}
                isGrayscale={isGrayscale}
                selectedBlockId={selectedBlockId}
                selectedStickerId={selectedStickerId}
                activeDropId={activeDropId}
                ghost={ghost}
                onSelectBlock={(b) => {
                  setSelectedBlockId(b.id);
                  setSelectedStickerId(null);
                }}
                onSelectSticker={(id) => {
                  setSelectedStickerId(id);
                  setSelectedBlockId(null);
                }}
                onDeselectAll={() => {
                  setSelectedBlockId(null);
                  setSelectedStickerId(null);
                }}
                onUpdateBlock={handleUpdateBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onDeleteBlock={handleDeleteBlock}
                onUpdateSticker={handleUpdateSticker}
                onDeleteSticker={handleDeleteSticker}
                onUpdatePlan={updateCurrentPlan}
                onAddStep={() => {
                  if (capacityInfo.isFull) {
                    setToast({
                      id: `toast-${Date.now()}`,
                      message: 'This page is full. Remove a block or change the time range.',
                      duration: 4000,
                    });
                    return;
                  }
                  const nextIndex = currentPlan.blocks.length;
                  const newBlock: ActivityBlock = {
                    id: `block-${Date.now()}`,
                    label: 'Next step',
                    iconName: 'CheckCircle2',
                    category: 'custom',
                    durationMinutes: 15,
                    slotIndex: nextIndex,
                    showCheckbox: true,
                  };
                  updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
                  setSelectedBlockId(newBlock.id);
                }}
                onAssignToSlot={(slot) => {
                  const newBlock: ActivityBlock = {
                    id: `block-${Date.now()}`,
                    label: slot === 'first' ? 'First activity' : 'Then reward',
                    iconName: slot === 'first' ? 'Broom' : 'Star',
                    category: 'custom',
                    durationMinutes: 30,
                    isFirstThenSlot: slot,
                    showCheckbox: true,
                  };
                  updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
                  setSelectedBlockId(newBlock.id);
                }}
              />
            </div>
          </main>

          {/* Right Sidebar (Settings Inspector) */}
          <div
            className={`${
              showRightSidebar ? 'block' : 'hidden md:block'
            } z-20 shrink-0 h-full`}
          >
            <RightSidebar
              plan={currentPlan}
              selectedBlock={selectedBlock}
              selectedSticker={selectedSticker}
              onUpdatePlan={updateCurrentPlan}
              onUpdateBlock={handleUpdateBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onUpdateSticker={handleUpdateSticker}
              onDeleteSticker={handleDeleteSticker}
              onChangeTemplate={handleChangeTemplate}
            />
          </div>
        </div>

        {/* Modal for Creating Custom Blocks */}
        <CustomBlockModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onCreateBlock={handleCreateCustomBlock}
        />

        {/* Toast for Block/Sticker removal & limits with Undo button */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Drag Preview Overlay with 40% fade and 'Let go to remove' label */}
        <DragPreviewOverlay
          activeItem={activeDragItem}
          isOutsidePage={isOutsidePage}
        />
      </div>
    </DndContext>

    {/* PRINT COPY: a clean, un-zoomed copy of the sheet that only exists in print.
        The editor (sidebars, zoomed preview, scroll panels) is hidden entirely when
        printing, so the browser prints exactly one Letter page. */}
    {typeof document !== 'undefined' &&
      createPortal(
        <div className="print-root" aria-hidden="true">
          <style>{`@page { size: letter ${currentPlan.orientation}; margin: 0; }`}</style>
          <PageCanvas
            plan={currentPlan}
            isGrayscale={false}
            selectedBlockId={null}
            selectedStickerId={null}
            onSelectBlock={() => {}}
            onSelectSticker={() => {}}
            onDeselectAll={() => {}}
            onUpdateBlock={() => {}}
            onDuplicateBlock={() => {}}
            onDeleteBlock={() => {}}
            onUpdateSticker={() => {}}
            onDeleteSticker={() => {}}
            onUpdatePlan={() => {}}
            isPrintMode
          />
        </div>,
        document.body
      )}
    </>
  );
}
