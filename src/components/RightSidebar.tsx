import React from 'react';
import {
  ActivityBlock,
  CharacterSticker,
  SchedulePlan,
  TemplateType,
} from '../types';
import { CHARACTERS } from '../constants/characters';
import { AVAILABLE_ICONS } from '../constants/starterBlocks';
import { TEMPLATE_INFO } from '../constants/templates';
import { validateTimeRange } from '../utils/pageLimits';
import { BlockIcon } from './BlockIcon';
import {
  Settings,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Type,
  Layout,
} from 'lucide-react';

interface RightSidebarProps {
  plan: SchedulePlan;
  selectedBlock: ActivityBlock | null;
  selectedSticker: CharacterSticker | null;
  onUpdatePlan: (updates: Partial<SchedulePlan>) => void;
  onUpdateBlock: (id: string, updates: Partial<ActivityBlock>) => void;
  onDuplicateBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateSticker: (id: string, updates: Partial<CharacterSticker>) => void;
  onDeleteSticker: (id: string) => void;
  onChangeTemplate: (template: TemplateType) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  plan,
  selectedBlock,
  selectedSticker,
  onUpdatePlan,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onUpdateSticker,
  onDeleteSticker,
  onChangeTemplate,
}) => {
  return (
    <div className="w-80 h-full bg-white border-l-[1.5px] border-[#2D2200] flex flex-col shrink-0 overflow-y-auto font-['Nunito']">
      {/* Panel Header */}
      <div className="p-4 border-b-[1.5px] border-[#2D2200] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Settings size={18} strokeWidth={2.5} className="text-[#2D2200]" />
          <h2 className="font-extrabold text-[16px] text-[#2D2200]">
            {selectedBlock
              ? 'Activity Settings'
              : selectedSticker
              ? 'Sticker Settings'
              : 'Page Settings'}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* ========================================================= */}
        {/* CASE 1: SELECTED ACTIVITY BLOCK */}
        {/* ========================================================= */}
        {selectedBlock ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                Activity Name
              </label>
              <input
                type="text"
                value={selectedBlock.label}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, { label: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[14px] font-bold text-[#2D2200] focus-ink"
              />
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={selectedBlock.startTime || '08:00'}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, { startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
                />
              </div>

              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                  Duration (min)
                </label>
                <select
                  value={selectedBlock.durationMinutes}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      durationMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-2 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
            </div>

            {/* Day Selector (for Weekly Template) */}
            {plan.template === 'weekly' && (
              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                  Day of the Week
                </label>
                <select
                  value={selectedBlock.dayOfWeek || 'mon'}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      dayOfWeek: e.target.value as ActivityBlock['dayOfWeek'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
                >
                  <option value="mon">Monday</option>
                  <option value="tue">Tuesday</option>
                  <option value="wed">Wednesday</option>
                  <option value="thu">Thursday</option>
                  <option value="fri">Friday</option>
                  {!plan.weekdaysOnly && (
                    <>
                      <option value="sat">Saturday</option>
                      <option value="sun">Sunday</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Checkbox toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border-[1.5px] border-[#2D2200]/30 bg-[#FAF8F0]">
              <span className="text-[13px] font-bold text-[#2D2200]">
                Include Colouring Tick Circle
              </span>
              <input
                type="checkbox"
                checked={selectedBlock.showCheckbox !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    showCheckbox: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-[#2D2200] text-[#2D2200] accent-[#2D2200]"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1.5">
                Line Art Icon
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border-[1.5px] border-[#2D2200]/30 rounded-xl bg-white">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() =>
                      onUpdateBlock(selectedBlock.id, { iconName })
                    }
                    className={`p-1.5 rounded-lg border-[1.5px] flex items-center justify-center transition-all ${
                      selectedBlock.iconName === iconName
                        ? 'border-[#2D2200] bg-[#F2F2E2] shadow-flat-ink-sm scale-105'
                        : 'border-transparent hover:border-[#2D2200]/30'
                    }`}
                  >
                    <BlockIcon name={iconName} size={22} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Duplicate & Delete */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onDuplicateBlock(selectedBlock)}
                className="flex-1 py-2 px-3 rounded-full border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] text-[13px] font-bold shadow-flat-ink flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteBlock(selectedBlock.id)}
                className="py-2 px-4 rounded-full border-[1.5px] border-[#E52311] bg-white text-[#E52311] text-[13px] font-bold shadow-flat-ink flex items-center justify-center gap-1.5 hover:bg-red-50"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : selectedSticker ? (
          /* ========================================================= */
          /* CASE 2: SELECTED CHARACTER STICKER */
          /* ========================================================= */
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                Character
              </label>
              <select
                value={selectedSticker.characterKey}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, {
                    characterKey: e.target.value as CharacterSticker['characterKey'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[14px] font-bold text-[#2D2200] focus-ink"
              >
                {CHARACTERS.map((char) => (
                  <option key={char.key} value={char.key}>
                    {char.name} ({char.animal})
                  </option>
                ))}
              </select>
            </div>

            {/* Size Slider */}
            <div>
              <div className="flex justify-between text-[12px] font-bold text-[#2D2200] mb-1">
                <span>Sticker Size</span>
                <span>{selectedSticker.size}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="220"
                step="5"
                value={selectedSticker.size}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, {
                    size: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#2D2200]"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-[12px] font-bold text-[#2D2200] mb-1">
                <span>Tilt / Rotation</span>
                <span>{selectedSticker.rotation}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={selectedSticker.rotation}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, {
                    rotation: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#2D2200]"
              />
            </div>

            {/* Layering & Delete */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSticker(selectedSticker.id, {
                    zIndex: (selectedSticker.zIndex || 10) + 1,
                  })
                }
                className="flex-1 py-2 rounded-full border-[1.5px] border-[#2D2200] text-[13px] font-bold shadow-flat-ink flex items-center justify-center gap-1"
              >
                <Layers size={14} />
                <span>Bring Forward</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteSticker(selectedSticker.id)}
                className="py-2 px-4 rounded-full border-[1.5px] border-[#E52311] text-[#E52311] text-[13px] font-bold shadow-flat-ink flex items-center justify-center gap-1 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CASE 3: GENERAL PAGE SETTINGS */
          /* ========================================================= */
          <div className="space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1.5 flex items-center gap-1">
                <Layout size={14} /> Other layouts
              </label>
              {/* Day and Week live in the switch at the top of the page; these two turn the
                  current schedule into a different kind of sheet. */}
              <p className="text-[11px] text-[#2D2200]/70 leading-snug mb-1.5">
                Switch between Day and Week at the top. These turn this schedule into another kind of sheet.
              </p>
              <div className="space-y-1.5">
                {(['checklist', 'first-then'] as TemplateType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChangeTemplate(t)}
                    className={`w-full p-2.5 rounded-xl border-[1.5px] text-left transition-all flex items-center justify-between ${
                      plan.template === t
                        ? 'border-[#2D2200] bg-[#F2F2E2] shadow-flat-ink-sm font-extrabold text-[#2D2200]'
                        : 'border-[#2D2200]/30 hover:border-[#2D2200] bg-white text-[#2D2200]/80'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] leading-tight font-bold">
                        {TEMPLATE_INFO[t].label}
                      </div>
                      <div className="text-[11px] opacity-75 leading-tight">
                        {TEMPLATE_INFO[t].description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Child Name */}
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1 flex items-center gap-1">
                <Type size={14} /> Sticker Title
              </label>
              <input
                type="text"
                value={plan.title}
                onChange={(e) => onUpdatePlan({ title: e.target.value })}
                placeholder="e.g. Ava's School Week"
                className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[14px] font-bold text-[#2D2200] focus-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={plan.childName}
                  onChange={(e) => onUpdatePlan({ childName: e.target.value })}
                  placeholder="Or leave blank"
                  className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
                />
              </div>

              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date Range
                </label>
                <input
                  type="text"
                  value={plan.dateRange}
                  onChange={(e) => onUpdatePlan({ dateRange: e.target.value })}
                  placeholder="e.g. Oct 19 – 23"
                  className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
                />
              </div>
            </div>

            {/* Page Orientation */}
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                Page Orientation
              </label>
              <div className="flex rounded-full border-[1.5px] border-[#2D2200] p-1 bg-[#FAF8F0] shadow-flat-ink-sm">
                <button
                  type="button"
                  onClick={() => onUpdatePlan({ orientation: 'portrait' })}
                  className={`flex-1 py-1.5 rounded-full font-bold text-[13px] transition-all ${
                    plan.orientation === 'portrait'
                      ? 'bg-[#2D2200] text-white'
                      : 'text-[#2D2200]'
                  }`}
                >
                  Portrait (8.5 × 11")
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePlan({ orientation: 'landscape' })}
                  className={`flex-1 py-1.5 rounded-full font-bold text-[13px] transition-all ${
                    plan.orientation === 'landscape'
                      ? 'bg-[#2D2200] text-white'
                      : 'text-[#2D2200]'
                  }`}
                >
                  Landscape (11 × 8.5")
                </button>
              </div>
            </div>

            {/* Time Settings for Daily & Weekly */}
            {(plan.template === 'daily' || plan.template === 'weekly') && (() => {
              const validation = validateTimeRange(
                plan.timeStartHour,
                plan.timeEndHour,
                plan.timeIncrement,
                plan.orientation
              );

              return (
                <div className="p-3 rounded-xl border-[1.5px] border-[#2D2200]/30 bg-[#FAF8F0] space-y-3">
                  <div className="flex items-center justify-between text-[13px] font-extrabold text-[#2D2200]">
                    <div className="flex items-center gap-1">
                      <Clock size={15} />
                      <span>Time Settings</span>
                    </div>
                  </div>

                  {!validation.valid && (
                    <div className="p-2.5 bg-red-50 border border-[#E52311] rounded-xl text-[12px] font-bold text-[#E52311] space-y-1">
                      <p>That's too many time slots for one page. Try a shorter day or a bigger time step.</p>
                      {validation.suggestion && (
                        <p className="font-medium text-[#2D2200]">{validation.suggestion}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <label className="block font-bold text-[#2D2200]/70 mb-0.5">Start Hour</label>
                      <select
                        value={plan.timeStartHour}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const check = validateTimeRange(val, plan.timeEndHour, plan.timeIncrement, plan.orientation);
                          if (check.valid) {
                            onUpdatePlan({ timeStartHour: val });
                          } else {
                            onUpdatePlan({ timeStartHour: val });
                          }
                        }}
                        className="w-full p-1.5 rounded-lg border border-[#2D2200] bg-white font-bold"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 5).map((h) => (
                          <option key={h} value={h}>
                            {h}:00 {h < 12 ? 'AM' : 'PM'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#2D2200]/70 mb-0.5">End Hour</label>
                      <select
                        value={plan.timeEndHour}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdatePlan({ timeEndHour: val });
                        }}
                        className="w-full p-1.5 rounded-lg border border-[#2D2200] bg-white font-bold"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 12).map((h) => (
                          <option key={h} value={h}>
                            {h === 12 ? 12 : h - 12}:00 PM
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {plan.template === 'weekly' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[12px] font-bold text-[#2D2200]">
                        Weekdays Only (Mon–Fri)
                      </span>
                      <input
                        type="checkbox"
                        checked={plan.weekdaysOnly}
                        onChange={(e) =>
                          onUpdatePlan({ weekdaysOnly: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-[#2D2200]"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Header Sticker Toggle & Character */}
            <div className="p-3 rounded-xl border-[1.5px] border-[#2D2200]/30 bg-[#FAF8F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#2D2200] flex items-center gap-1.5">
                  <Sparkles size={15} />
                  <span>Header Character Sticker</span>
                </span>
                <input
                  type="checkbox"
                  checked={plan.showHeaderSticker}
                  onChange={(e) =>
                    onUpdatePlan({ showHeaderSticker: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#2D2200]"
                />
              </div>

              {plan.showHeaderSticker && (
                <div>
                  <label className="block text-[11px] font-bold text-[#2D2200]/70 mb-1">
                    Select Header Character
                  </label>
                  <select
                    value={plan.headerCharacter}
                    onChange={(e) =>
                      onUpdatePlan({
                        headerCharacter: e.target.value as CharacterSticker['characterKey'],
                      })
                    }
                    className="w-full p-1.5 rounded-lg border border-[#2D2200] bg-white text-[13px] font-bold text-[#2D2200]"
                  >
                    {CHARACTERS.map((char) => (
                      <option key={char.key} value={char.key}>
                        {char.name} the {char.animal}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* General Toggles */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl border-[1.5px] border-[#2D2200]/30">
                <span className="text-[13px] font-bold text-[#2D2200]">
                  Show Times on Blocks
                </span>
                <input
                  type="checkbox"
                  checked={plan.showTimesOnBlocks}
                  onChange={(e) =>
                    onUpdatePlan({ showTimesOnBlocks: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#2D2200]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border-[1.5px] border-[#2D2200]/30">
                <span className="text-[13px] font-bold text-[#2D2200]">
                  Show Colouring Tick Circles
                </span>
                <input
                  type="checkbox"
                  checked={plan.showCheckboxes}
                  onChange={(e) =>
                    onUpdatePlan({ showCheckboxes: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#2D2200]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border-[1.5px] border-[#2D2200]/30">
                <div>
                  <span className="block text-[13px] font-bold text-[#2D2200]">
                    Dyslexia-Friendly Font
                  </span>
                  <span className="block text-[11px] text-[#2D2200]/70">
                    High-legibility typeface
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={plan.dyslexiaFriendly}
                  onChange={(e) =>
                    onUpdatePlan({ dyslexiaFriendly: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#2D2200]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
