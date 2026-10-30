import React from 'react';
import { SchedulePlan } from '../types';
import { ROUTINES, Routine } from '../constants/routines';
import { Wand2 } from 'lucide-react';

interface RoutinePanelProps {
  plan: SchedulePlan;
  onApplyRoutine: (routine: Routine) => void;
}

/** Day and Week views: start from a ready-made routine instead of a blank page. */
export const RoutinePanel: React.FC<RoutinePanelProps> = ({ plan, onApplyRoutine }) => {
  const routines = ROUTINES.filter((r) => r.template === plan.template);
  if (routines.length === 0) return null;

  return (
    <div className="p-3 rounded-xl border-[1.5px] border-[#2D2200] bg-[#FAF8F0] space-y-2">
      <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#2D2200]">
        <Wand2 size={15} strokeWidth={2.5} />
        <span>Start from a routine</span>
      </div>
      <p className="text-[11px] text-[#2D2200]/70 leading-snug">
        Fills the page with a ready-made {plan.template === 'weekly' ? 'week' : 'day'}. Change anything after, or undo.
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {routines.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onApplyRoutine(r)}
            className="w-full text-left px-3 py-2 rounded-xl border-[1.5px] border-[#2D2200]/30 bg-white hover:border-[#2D2200] hover:-translate-y-0.5 transition-all focus-ink"
          >
            <span className="block text-[13px] font-extrabold text-[#2D2200] leading-tight">{r.name}</span>
            <span className="block text-[11px] text-[#2D2200]/70 leading-tight">{r.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
