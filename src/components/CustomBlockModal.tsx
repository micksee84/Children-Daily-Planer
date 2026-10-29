import React, { useRef, useState } from 'react';
import { useDismiss } from '../utils/useDismiss';
import { AVAILABLE_ICONS } from '../constants/starterBlocks';
import { BlockIcon } from './BlockIcon';
import { X, Check } from 'lucide-react';

interface CustomBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlock: (data: {
    label: string;
    iconName: string;
    duration: number;
    category: 'morning' | 'learning' | 'meals' | 'play' | 'winddown' | 'custom';
  }) => void;
}

export const CustomBlockModal: React.FC<CustomBlockModalProps> = ({
  isOpen,
  onClose,
  onCreateBlock,
}) => {
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState<'morning' | 'learning' | 'meals' | 'play' | 'winddown' | 'custom'>('custom');

  // Close by clicking outside the dialog or pressing Escape, as well as with the X.
  const dialogRef = useRef<HTMLDivElement>(null);
  useDismiss(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onCreateBlock({
      label: label.trim(),
      iconName: selectedIcon,
      duration,
      category,
    });
    setLabel('');
    setSelectedIcon('Star');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2200]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create your own activity"
        className="w-full max-w-md bg-white border-[3px] border-[#2D2200] rounded-[24px] shadow-flat-ink p-6 font-['Nunito'] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2F2E2] text-[#2D2200]"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <h3 className="font-extrabold text-[20px] text-[#2D2200] mb-1">
          Create Custom Activity
        </h3>
        <p className="text-[13px] text-[#2D2200]/70 mb-4">
          Make a unique card for your child's routine with a colouring line icon.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
              Activity Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Build Lego castle, Ballet practice"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[14px] font-bold text-[#2D2200] focus-ink"
            />
          </div>

          {/* Duration & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                Duration (min)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200] text-[13px] font-bold text-[#2D2200] focus-ink"
              >
                <option value="custom">Custom</option>
                <option value="morning">Morning</option>
                <option value="learning">Learning</option>
                <option value="meals">Meals</option>
                <option value="play">Play & Fun</option>
                <option value="winddown">Wind-down</option>
              </select>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#2D2200]/70 mb-1">
              Select Line Icon (White fill, Ink outline)
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border-[1.5px] border-[#2D2200]/30 rounded-xl bg-[#FAF8F0]">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-1.5 rounded-lg border-[1.5px] flex items-center justify-center transition-all bg-white ${
                    selectedIcon === iconName
                      ? 'border-[#2D2200] ring-2 ring-[#2D2200] scale-105 shadow-flat-ink-sm'
                      : 'border-[#2D2200]/20 hover:border-[#2D2200]'
                  }`}
                >
                  <BlockIcon name={iconName} size={22} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border-[1.5px] border-[#2D2200] text-[13px] font-bold shadow-flat-ink hover:bg-[#F2F2E2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim()}
              className="px-6 py-2 rounded-full bg-[#2D2200] text-white text-[13px] font-extrabold shadow-flat-ink disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Create Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
