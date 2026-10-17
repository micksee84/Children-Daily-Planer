/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragMoveEvent,
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
import { findAvailableSlot, minutesToTimeString, timeStringToMinutes } from './utils/overlap';
import { getPlanCapacityInfo } from './utils/pageLimits';
import { HeaderNav } from './components/HeaderNav';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { PageCanvas } from './components/PageCanvas';
import { CustomBlockModal } from './components/CustomBlockModal';
import { Toast, ToastMessage } from './components/Toast';
import { DragPreviewOverlay, ActiveDragItem } from './components/DragPreviewOverlay';
import confetti from 'canvas-confetti';
import { Menu, SlidersHorizontal } from 'lucide-react';

interface GhostInfo {
  timeStr: string;
  dayKey?: ActivityBlock['dayOfWeek'];
  isNoState?: boolean;
  label?: string;
  iconName?: string;
  duration?: number;
}

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
  const [activeGhost, setActiveGhost] = useState<GhostInfo | null>(null);
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

    const defaultDuration = currentPlan.timeIncrement || template.defaultDuration;
    const available = findAvailableSlot(currentPlan, '08:00', defaultDuration);
    if (!available) {
      setToast({
        id: `toast-${Date.now()}`,
        message: 'No room there. Try another time.',
        duration: 3500,
      });
      return;
    }

    const newBlock = createBlockFromTemplate(template, available.timeStr);
    newBlock.durationMinutes = defaultDuration;
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

    const available = findAvailableSlot(currentPlan, '08:00', data.duration);
    const newBlock: ActivityBlock = {
      id: `block-${Date.now()}`,
      label: data.label,
      iconName: data.iconName,
      category: data.category,
      startTime: available ? available.timeStr : '08:00',
      durationMinutes: data.duration,
      dayOfWeek: 'mon',
      showCheckbox: true,
    };
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

    const available = findAvailableSlot(
      currentPlan,
      block.startTime || '08:00',
      block.durationMinutes || 30,
      block.dayOfWeek
    );

    const duplicated: ActivityBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: `${block.label} (copy)`,
      startTime: available ? available.timeStr : block.startTime,
    };
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
          orientation: isLandscape ? 'landscape' : 'portrait',
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
      orientation: isLandscape ? 'landscape' : 'portrait',
      blocks: preservedBlocks,
    });
  };

  // Schedule Plan CRUD
  const handleSelectPlan = (id: string) => {
    setPlansState((prev) => ({ ...prev, activeId: id }));
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  };

  const handleCreateNewPlan = () => {
    const newPlan = createInitialPlan('daily');
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
  // DND-KIT DRAG & DROP WITH PRECISE POINTER Y SNAPPING
  // =========================================================
  const calculateDropTimeFromPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      duration: number,
      excludeBlockId?: string
    ): GhostInfo | null => {
      // Find element under pointer
      const elements = document.elementsFromPoint(clientX, clientY);

      // Check for daily slot row or daily column
      const dailyRowEl = elements.find((el) => el.hasAttribute('data-time'));
      const dailyColEl = elements.find((el) => el.classList.contains('daily-slot-row') || el.closest('#print-sheet'));
      const weeklyColEl = elements.find((el) => el.hasAttribute('data-day') || el.closest('[data-day]'));

      let targetTimeStr = '08:00';
      let dayKey: ActivityBlock['dayOfWeek'] = 'mon';

      if (currentPlan.template === 'weekly' && weeklyColEl) {
        const col = weeklyColEl.hasAttribute('data-day')
          ? weeklyColEl
          : (weeklyColEl.closest('[data-day]') as HTMLElement);
        dayKey = (col?.getAttribute('data-day') as ActivityBlock['dayOfWeek']) || 'mon';

        const rect = col.getBoundingClientRect();
        const pointerOffsetY = (clientY - rect.top) / zoom;
        const colHeight = rect.height / zoom;

        const totalMinutes = (currentPlan.timeEndHour - currentPlan.timeStartHour) * 60;
        const rows = Math.max(1, Math.round(totalMinutes / currentPlan.timeIncrement));
        const rowHeight = Math.max(40, colHeight / rows);

        const rowIndex = Math.max(0, Math.min(rows - 1, Math.floor(pointerOffsetY / rowHeight)));
        const minutes = currentPlan.timeStartHour * 60 + rowIndex * currentPlan.timeIncrement;
        targetTimeStr = minutesToTimeString(minutes);
      } else if (dailyRowEl) {
        targetTimeStr = dailyRowEl.getAttribute('data-time') || '08:00';
      } else if (dailyColEl && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pointerOffsetY = (clientY - rect.top) / zoom;
        const totalMinutes = (currentPlan.timeEndHour - currentPlan.timeStartHour) * 60;
        const rows = Math.max(1, Math.round(totalMinutes / currentPlan.timeIncrement));
        const estimatedRowHeight = 44;
        const rowIndex = Math.max(0, Math.min(rows - 1, Math.floor((pointerOffsetY - 180) / estimatedRowHeight)));
        const minutes = currentPlan.timeStartHour * 60 + rowIndex * currentPlan.timeIncrement;
        targetTimeStr = minutesToTimeString(minutes);
      }

      // Check slot with findAvailableSlot (nearest free slot above/below or null for 'no' state)
      const slot = findAvailableSlot(currentPlan, targetTimeStr, duration, dayKey, excludeBlockId);

      if (!slot || capacityInfo.isFull) {
        return {
          timeStr: targetTimeStr,
          dayKey,
          isNoState: true,
          label: 'No room here',
          duration,
        };
      }

      return {
        timeStr: slot.timeStr,
        dayKey,
        isNoState: false,
        label: activeDragItem?.type === 'palette-block' ? activeDragItem.template.label : activeDragItem?.type === 'planner-block' ? activeDragItem.block.label : 'Drop activity',
        duration,
      };
    },
    [currentPlan, zoom, capacityInfo.isFull, activeDragItem]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDragItem | undefined;
    if (data) {
      setActiveDragItem(data);
      setIsOutsidePage(false);
      setActiveDropId(null);
      setActiveGhost(null);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!event.over) {
      setIsOutsidePage(true);
      setActiveGhost(null);
      return;
    }

    setIsOutsidePage(false);
    const activeData = activeDragItem;
    if (!activeData) return;

    // Pointer-based time snapping for blocks
    if (activeData.type === 'palette-block' || activeData.type === 'planner-block') {
      const duration =
        activeData.type === 'palette-block'
          ? currentPlan.timeIncrement || activeData.template.defaultDuration
          : activeData.block.durationMinutes;

      const excludeId = activeData.type === 'planner-block' ? activeData.block.id : undefined;

      // Extract pointer event position from touch / mouse
      const pointerEvent = (window.event as MouseEvent | TouchEvent | undefined);
      let clientX = 0;
      let clientY = 0;
      if (pointerEvent && 'clientX' in pointerEvent) {
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
      } else if (pointerEvent && 'touches' in pointerEvent && pointerEvent.touches.length > 0) {
        clientX = pointerEvent.touches[0].clientX;
        clientY = pointerEvent.touches[0].clientY;
      }

      if (clientX && clientY) {
        const ghost = calculateDropTimeFromPointer(clientX, clientY, duration, excludeId);
        setActiveGhost(ghost);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      setActiveDropId(String(event.over.id));
      setIsOutsidePage(false);
    } else {
      setActiveDropId(null);
      setActiveGhost(null);
      setIsOutsidePage(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeData = active.data.current as ActiveDragItem | undefined;

    // Reset overlay and ghost outlines
    setActiveDragItem(null);
    setActiveDropId(null);
    setActiveGhost(null);
    setIsOutsidePage(false);

    if (!activeData) return;

    // 1. DRAGGING OFF THE PLANNER TO DELETE
    if (!over) {
      if (activeData.type === 'planner-block') {
        handleDeleteBlock(activeData.block.id);
      } else if (activeData.type === 'planner-sticker') {
        handleDeleteSticker(activeData.sticker.id);
      }
      return;
    }

    const overId = String(over.id);

    // 2. CREATING A NEW BLOCK FROM PALETTE
    if (activeData.type === 'palette-block') {
      if (capacityInfo.isFull) {
        setToast({
          id: `toast-${Date.now()}`,
          message: 'This page is full. Remove a block or change the time range.',
          duration: 4000,
        });
        return;
      }

      const template = activeData.template;
      const duration = currentPlan.timeIncrement || template.defaultDuration;

      // Use activeGhost time if available and valid
      if (activeGhost && !activeGhost.isNoState) {
        const newBlock = createBlockFromTemplate(
          template,
          activeGhost.timeStr,
          activeGhost.dayKey
        );
        newBlock.durationMinutes = duration;
        updateCurrentPlan({
          blocks: [...currentPlan.blocks, newBlock],
        });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
        return;
      }

      if (activeGhost && activeGhost.isNoState) {
        setToast({
          id: `toast-${Date.now()}`,
          message: 'No room there. Try another time.',
          duration: 3500,
        });
        return;
      }

      // Drop on Checklist
      if (overId === 'checklist-dropzone') {
        const nextIdx = currentPlan.blocks.length;
        const newBlock = createBlockFromTemplate(template);
        newBlock.slotIndex = nextIdx;
        updateCurrentPlan({
          blocks: [...currentPlan.blocks, newBlock],
        });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
        return;
      }

      // Drop on First-Then board
      if (overId === 'firstthen-first' || overId === 'firstthen-then') {
        const slot: 'first' | 'then' = overId === 'firstthen-first' ? 'first' : 'then';
        const newBlock = createBlockFromTemplate(template);
        newBlock.isFirstThenSlot = slot;
        const otherBlocks = currentPlan.blocks.filter((b) => b.isFirstThenSlot !== slot);
        updateCurrentPlan({
          blocks: [...otherBlocks, newBlock],
        });
        setSelectedBlockId(newBlock.id);
        setSelectedStickerId(null);
        return;
      }

      // Fallback drop on page canvas
      const slot = findAvailableSlot(currentPlan, '08:00', duration);
      if (!slot) {
        setToast({
          id: `toast-${Date.now()}`,
          message: 'No room there. Try another time.',
          duration: 3500,
        });
        return;
      }
      const newBlock = createBlockFromTemplate(template, slot.timeStr);
      newBlock.durationMinutes = duration;
      updateCurrentPlan({
        blocks: [...currentPlan.blocks, newBlock],
      });
      setSelectedBlockId(newBlock.id);
      setSelectedStickerId(null);
      return;
    }

    // 3. MOVING AN EXISTING BLOCK ON THE PLANNER
    if (activeData.type === 'planner-block') {
      const block = activeData.block;

      if (activeGhost && !activeGhost.isNoState) {
        handleUpdateBlock(block.id, {
          startTime: activeGhost.timeStr,
          dayOfWeek: activeGhost.dayKey || block.dayOfWeek,
        });
        setSelectedBlockId(block.id);
        return;
      }

      if (activeGhost && activeGhost.isNoState) {
        setToast({
          id: `toast-${Date.now()}`,
          message: 'No room there. Try another time.',
          duration: 3500,
        });
        return;
      }

      // Moved to First-Then slot
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
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-screen h-screen flex flex-col bg-[#F8F7F4] text-[#2D2200] overflow-hidden">
        {/* Top Header Navigation */}
        <HeaderNav
          plans={plansState.plans}
          currentPlan={currentPlan}
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
            className="flex-1 h-full overflow-auto bg-[#ECEAE4] flex items-center justify-center p-4 sm:p-8 relative"
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
                activeGhost={activeGhost}
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
                onAddBlockAtTime={(timeStr) => {
                  if (capacityInfo.isFull) {
                    setToast({
                      id: `toast-${Date.now()}`,
                      message: 'This page is full. Remove a block or change the time range.',
                      duration: 4000,
                    });
                    return;
                  }
                  const newBlock = createBlockFromTemplate(
                    {
                      label: 'New activity',
                      iconName: 'Star',
                      category: 'custom',
                      defaultDuration: currentPlan.timeIncrement || 30,
                    },
                    timeStr
                  );
                  updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
                  setSelectedBlockId(newBlock.id);
                }}
                onAddBlockToDay={(day) => {
                  if (capacityInfo.isFull) {
                    setToast({
                      id: `toast-${Date.now()}`,
                      message: 'This page is full. Remove a block or change the time range.',
                      duration: 4000,
                    });
                    return;
                  }
                  const newBlock = createBlockFromTemplate(
                    {
                      label: 'New activity',
                      iconName: 'Star',
                      category: 'custom',
                      defaultDuration: 60,
                    },
                    '09:00',
                    day
                  );
                  updateCurrentPlan({ blocks: [...currentPlan.blocks, newBlock] });
                  setSelectedBlockId(newBlock.id);
                }}
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
  );
}
