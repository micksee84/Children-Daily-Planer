import React, { useRef, useState } from 'react';
import { useDismiss } from '../utils/useDismiss';
import { SchedulePlan } from '../types';
import {
  Printer,
  Download,
  Undo2,
  Redo2,
  Eye,
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Edit2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HardDriveDownload,
  FolderInput,
} from 'lucide-react';

export type PlannerView = 'day' | 'week';

const VIEWS: Array<{ key: PlannerView; label: string; hint: string }> = [
  { key: 'day', label: 'Day', hint: 'Plan one day, from wake up to bedtime' },
  { key: 'week', label: 'Week', hint: 'Plan the whole week on one landscape page' },
];

interface HeaderNavProps {
  plans: SchedulePlan[];
  currentPlan: SchedulePlan;
  /** Which tab is showing; null for the Checklist and First–Then layouts. */
  plannerView: PlannerView | null;
  onSwitchView: (view: PlannerView) => void;
  onSelectPlan: (id: string) => void;
  onCreateNewPlan: () => void;
  onDuplicatePlan: () => void;
  onRenamePlan: (newName: string) => void;
  onDeletePlan: () => void;
  onSaveBackup: () => void;
  onOpenBackup: (file: File) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isGrayscale: boolean;
  onToggleGrayscale: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  isExportingPdf: boolean;
  capacityLabel?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  plans,
  currentPlan,
  plannerView,
  onSwitchView,
  onSelectPlan,
  onCreateNewPlan,
  onDuplicatePlan,
  onRenamePlan,
  onDeletePlan,
  onSaveBackup,
  onOpenBackup,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isGrayscale,
  onToggleGrayscale,
  zoom,
  onZoomChange,
  onPrint,
  onDownloadPdf,
  isExportingPdf,
  capacityLabel,
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(currentPlan.name);
  // The saved-schedules menu closes by clicking outside it or pressing Escape.
  const planMenuRef = useRef<HTMLDivElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  useDismiss(planMenuRef, isPlanDropdownOpen, () => setIsPlanDropdownOpen(false));

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRenamePlan(tempName.trim());
      setIsRenaming(false);
    }
  };

  return (
    <header className="no-print h-16 bg-white border-b-[1.5px] border-[#2D2200] px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 font-['Nunito'] select-none">
      {/* Left: Brand & Schedule Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <h1 className="m-0 flex items-center gap-4 sm:gap-6 shrink-0 font-normal">
          <picture className="shrink-0">
            <source media="(min-width: 640px)" srcSet={`${import.meta.env.BASE_URL}sb-logo-header.svg`} />
            <img
              src={`${import.meta.env.BASE_URL}sb-logo-icon.svg`}
              alt="Sunshine Brigade"
              draggable={false}
              className="h-8 sm:h-[31px] w-auto select-none"
              loading="eager"
            />
          </picture>
          <span className="hidden min-[1600px]:block h-6 w-[1.5px] bg-[#2D2200]/20" aria-hidden="true" />
          {/* App name: plain Super Joyful in ink, no sticker outline or shadow (never under 24px),
              matching the worksheet builder */}
          <span className="hidden min-[1600px]:block font-joyful font-normal text-[24px] leading-none text-[#2D2200] whitespace-nowrap">
            My planner
          </span>
        </h1>

        {/* Day / Week switch: each view keeps its own schedule */}
        <div
          role="tablist"
          aria-label="Planner view"
          className="flex items-center p-1 rounded-full border-[1.5px] border-[#2D2200] bg-[#F2F2E2] shrink-0"
        >
          {VIEWS.map((v) => {
            const active = plannerView === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={active}
                title={v.hint}
                onClick={() => onSwitchView(v.key)}
                className={`px-3.5 sm:px-4 py-1 rounded-full text-[13px] sm:text-[14px] font-extrabold transition-all focus-ink ${
                  active
                    ? 'bg-[#2D2200] text-white shadow-flat-ink'
                    : 'text-[#2D2200] hover:bg-white'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block h-6 w-[1.5px] bg-[#2D2200]/20" />

        {/* Schedule Selector & Manager */}
        <div ref={planMenuRef} className="relative hidden sm:block">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  if (tempName.trim()) onRenamePlan(tempName.trim());
                  setIsRenaming(false);
                }}
                className="px-3 py-1 text-[14px] font-bold border-[1.5px] border-[#2D2200] rounded-full focus-ink"
              />
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] text-[13px] font-extrabold shadow-flat-ink hover:-translate-y-0.5 transition-all"
              >
                <FolderOpen size={14} strokeWidth={2.5} />
                <span className="max-w-[140px] truncate">{currentPlan.name}</span>
              </button>

              <button
                type="button"
                aria-label="Rename schedule"
                title="Rename schedule"
                onClick={() => {
                  setTempName(currentPlan.name);
                  setIsRenaming(true);
                }}
                className="p-1.5 rounded-full hover:bg-[#F2F2E2] text-[#2D2200]"
              >
                <Edit2 size={13} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Schedule Dropdown */}
          {isPlanDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border-[2px] border-[#2D2200] rounded-2xl shadow-flat-ink p-2 z-50">
              <div className="text-[11px] font-extrabold text-[#2D2200]/60 uppercase tracking-wider px-2 py-1">
                Saved Schedules
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPlan(p.id);
                      setIsPlanDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold flex items-center justify-between ${
                      p.id === currentPlan.id
                        ? 'bg-[#2D2200] text-white'
                        : 'hover:bg-[#F2F2E2] text-[#2D2200]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="border-t-[1.5px] border-[#2D2200]/20 my-1 pt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onCreateNewPlan();
                    setIsPlanDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold hover:bg-[#F2F2E2] text-[#2D2200] flex items-center gap-2"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>New Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDuplicatePlan();
                    setIsPlanDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold hover:bg-[#F2F2E2] text-[#2D2200] flex items-center gap-2"
                >
                  <Copy size={14} strokeWidth={2.5} />
                  <span>Duplicate Current</span>
                </button>

                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePlan();
                      setIsPlanDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold hover:bg-red-50 text-[#E52311] flex items-center gap-2"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                    <span>Delete Schedule</span>
                  </button>
                )}
              </div>

              {/* Back up and restore: schedules only live in this browser */}
              <div className="border-t-[1.5px] border-[#2D2200]/20 mt-1 pt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSaveBackup();
                    setIsPlanDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold hover:bg-[#F2F2E2] text-[#2D2200] flex items-center gap-2"
                >
                  <HardDriveDownload size={14} strokeWidth={2.5} />
                  <span>Save a backup file</span>
                </button>
                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-bold hover:bg-[#F2F2E2] text-[#2D2200] flex items-center gap-2"
                >
                  <FolderInput size={14} strokeWidth={2.5} />
                  <span>Open a backup file</span>
                </button>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) {
                      onOpenBackup(file);
                      setIsPlanDropdownOpen(false);
                    }
                  }}
                />
                <p className="px-3 pb-1 text-[11px] leading-snug text-[#2D2200]/60">
                  Your schedules are saved in this browser only. Keep a backup to move them or keep them safe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Space Usage Counter */}
        {capacityLabel && (
          <div className="hidden min-[1440px]:flex items-center px-3 py-1 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[12px] font-extrabold text-[#2D2200] shadow-flat-ink-sm whitespace-nowrap">
            <span>{capacityLabel}</span>
          </div>
        )}
      </div>

      {/* Center: Undo / Redo & Zoom Controls (wide screens; the Day/Week switch takes the room below) */}
      <div className="hidden xl:flex items-center gap-2">
        <div className="flex items-center bg-[#FAF8F0] border-[1.5px] border-[#2D2200] rounded-full p-0.5 shadow-flat-ink-sm">
          <button
            type="button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            className={`p-1.5 rounded-full transition-colors ${
              canUndo
                ? 'text-[#2D2200] hover:bg-white active:scale-95'
                : 'text-[#2D2200]/30 cursor-not-allowed'
            }`}
          >
            <Undo2 size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={onRedo}
            className={`p-1.5 rounded-full transition-colors ${
              canRedo
                ? 'text-[#2D2200] hover:bg-white active:scale-95'
                : 'text-[#2D2200]/30 cursor-not-allowed'
            }`}
          >
            <Redo2 size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Greyscale preview toggle */}
        <button
          type="button"
          onClick={onToggleGrayscale}
          title="Preview black-and-white printout"
          className={`px-3 py-1.5 rounded-full border-[1.5px] border-[#2D2200] text-[12px] font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-flat-ink-sm ${
            isGrayscale
              ? 'bg-[#2D2200] text-white'
              : 'bg-white text-[#2D2200] hover:bg-[#F2F2E2]'
          }`}
        >
          <Eye size={14} strokeWidth={2.5} />
          <span>{isGrayscale ? 'Greyscale ON' : 'B&W Preview'}</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center bg-[#FAF8F0] border-[1.5px] border-[#2D2200] rounded-full p-0.5 shadow-flat-ink-sm">
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.1))}
            className="p-1.5 text-[#2D2200] hover:bg-white rounded-full"
          >
            <ZoomOut size={14} strokeWidth={2.5} />
          </button>
          <span className="text-[12px] font-extrabold px-1 text-[#2D2200] w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => onZoomChange(Math.min(1.3, zoom + 0.1))}
            className="p-1.5 text-[#2D2200] hover:bg-white rounded-full"
          >
            <ZoomIn size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Fit to screen"
            title="Fit to view"
            onClick={() => onZoomChange(0.75)}
            className="p-1.5 text-[#2D2200] hover:bg-white rounded-full"
          >
            <Maximize2 size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Right: Print & Download PDF Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Secondary Button: Download PDF */}
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isExportingPdf}
          className="px-4 sm:px-5 py-2 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] font-extrabold text-[13px] sm:text-[14px] shadow-flat-ink hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          <Download size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
          <span className="sm:hidden">{isExportingPdf ? '…' : 'PDF'}</span>
        </button>

        {/* Primary Button: Print */}
        <button
          type="button"
          onClick={onPrint}
          className="px-5 sm:px-6 min-h-[44px] rounded-full bg-[#2D2200] text-white font-extrabold text-[14px] sm:text-[15px] shadow-flat-ink hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer size={18} strokeWidth={2.5} />
          <span>Print</span>
        </button>
      </div>
    </header>
  );
};
