import React, { useEffect, useState } from 'react';
import { ActivityBlock, SchedulePlan } from '../types';
import { CopyPlus } from 'lucide-react';

export type DayKey = NonNullable<ActivityBlock['dayOfWeek']>;

export const WEEK_DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

interface CopyDayPanelProps {
  plan: SchedulePlan;
  onCopyDay: (from: DayKey, to: DayKey[]) => void;
}

/**
 * Week view: build one day, then copy it to the others. Copying replaces what is on the
 * chosen days, and the toast that follows can undo it.
 */
export const CopyDayPanel: React.FC<CopyDayPanelProps> = ({ plan, onCopyDay }) => {
  const days = plan.weekdaysOnly ? WEEK_DAYS.slice(0, 5) : WEEK_DAYS;
  const [from, setFrom] = useState<DayKey>('mon');
  const [targets, setTargets] = useState<DayKey[]>(days.filter((d) => d.key !== 'mon').map((d) => d.key));

  // Keep the choices valid when the week changes between 5 and 7 days.
  useEffect(() => {
    const keys = days.map((d) => d.key);
    if (!keys.includes(from)) setFrom('mon');
    setTargets((prev) => {
      const kept = prev.filter((k) => keys.includes(k) && k !== from);
      return kept.length ? kept : keys.filter((k) => k !== from);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.weekdaysOnly]);

  const toggle = (key: DayKey) =>
    setTargets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const fromCount = plan.blocks.filter((b) => (b.dayOfWeek ?? 'mon') === from).length;
  const chosen = targets.filter((k) => k !== from);

  return (
    <div className="p-3 rounded-xl border-[1.5px] border-[#2D2200] bg-[#FAF8F0] space-y-2.5">
      <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#2D2200]">
        <CopyPlus size={15} strokeWidth={2.5} />
        <span>Copy a day</span>
      </div>
      <p className="text-[11px] text-[#2D2200]/70 leading-snug">
        Plan one day, then copy it. The days you pick are replaced.
      </p>

      <label className="block text-[11px] font-bold text-[#2D2200]/70">
        Copy
        <select
          value={from}
          onChange={(e) => {
            const next = e.target.value as DayKey;
            setFrom(next);
            setTargets(days.map((d) => d.key).filter((k) => k !== next));
          }}
          className="mt-0.5 w-full p-1.5 rounded-lg border border-[#2D2200] bg-white text-[13px] font-bold text-[#2D2200]"
        >
          {days.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="block text-[11px] font-bold text-[#2D2200]/70 mb-1">To</span>
        <div className="flex flex-wrap gap-1.5">
          {days
            .filter((d) => d.key !== from)
            .map((d) => {
              const on = chosen.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(d.key)}
                  className={`px-2.5 py-1 rounded-full border-[1.5px] border-[#2D2200] text-[12px] font-extrabold transition-colors focus-ink ${
                    on ? 'bg-[#2D2200] text-white' : 'bg-white text-[#2D2200] hover:bg-[#F2F2E2]'
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
        </div>
      </div>

      <button
        type="button"
        disabled={fromCount === 0 || chosen.length === 0}
        onClick={() => onCopyDay(from, chosen)}
        className="w-full py-2 rounded-full bg-[#2D2200] text-white text-[13px] font-extrabold shadow-flat-ink hover:-translate-y-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        {fromCount === 0
          ? `${days.find((d) => d.key === from)?.label} is empty`
          : `Copy to ${chosen.length} ${chosen.length === 1 ? 'day' : 'days'}`}
      </button>
    </div>
  );
};
