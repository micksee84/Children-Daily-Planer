import { SchedulePlan, TemplateType } from '../types';
import { createInitialPlan } from '../constants/templates';

const STORAGE_KEY_PLANS = 'sunshine_brigade_plans_v2';
const STORAGE_KEY_ACTIVE = 'sunshine_brigade_active_plan_id_v2';

const TEMPLATES: TemplateType[] = ['daily', 'weekly', 'checklist', 'first-then'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Check a plan read back from this browser before using it, as the worksheet builder
 * does. Anything missing or the wrong type falls back to the starter plan's value, and
 * blocks or stickers that are not usable are dropped, so an old or damaged save opens
 * instead of crashing the planner. Returns null when there is nothing to recover.
 */
export function sanitizePlan(raw: unknown): SchedulePlan | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  const template = TEMPLATES.includes(raw.template as TemplateType)
    ? (raw.template as TemplateType)
    : 'daily';
  const base = createInitialPlan(template);
  const plan = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof SchedulePlan)[]) {
    if (key === 'blocks' || key === 'stickers') continue;
    if (key in raw && typeof raw[key] === typeof base[key]) plan[key] = raw[key];
  }
  const hasId = (item: unknown) => isRecord(item) && typeof item.id === 'string';
  plan.blocks = Array.isArray(raw.blocks) ? raw.blocks.filter(hasId) : [];
  plan.stickers = Array.isArray(raw.stickers) ? raw.stickers.filter(hasId) : [];
  return plan as unknown as SchedulePlan;
}

export function loadSavedPlans(): { plans: SchedulePlan[]; activeId: string } {
  try {
    const rawPlans = localStorage.getItem(STORAGE_KEY_PLANS);
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);

    if (rawPlans) {
      const parsed: unknown = JSON.parse(rawPlans);
      const plans = Array.isArray(parsed)
        ? parsed.map(sanitizePlan).filter((p): p is SchedulePlan => p !== null)
        : [];
      if (plans.length > 0) {
        const foundActive = activeId && plans.find((p) => p.id === activeId);
        return {
          plans,
          activeId: foundActive ? activeId : plans[0].id,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load plans from localStorage', err);
  }

  // Fallback initial starter plan
  const defaultPlan = createInitialPlan('daily');
  return {
    plans: [defaultPlan],
    activeId: defaultPlan.id,
  };
}

export function savePlansToStorage(plans: SchedulePlan[], activeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    localStorage.setItem(STORAGE_KEY_ACTIVE, activeId);
  } catch (err) {
    console.error('Failed to save plans to localStorage', err);
  }
}

/* ---------------- Back up and restore ----------------
   Schedules only live in this browser, so clearing it loses them. A backup file holds
   every schedule; opening one adds them back next to what is already here. */

const BACKUP_KIND = 'sunshine-brigade-planner-backup';

export function downloadBackup(plans: SchedulePlan[]): void {
  const data = { kind: BACKUP_KIND, version: 1, savedAt: new Date().toISOString(), plans };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const day = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Sunshine-Brigade-planner-backup-${day}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Reads a backup file and returns its schedules, each checked like a saved plan and given
 * a fresh id so it never replaces one already here. Throws if the file is not a backup.
 */
export function readBackup(text: string, existing: SchedulePlan[]): SchedulePlan[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('not-json');
  }
  const list = isRecord(parsed) && Array.isArray(parsed.plans) ? parsed.plans : Array.isArray(parsed) ? parsed : null;
  if (!list) throw new Error('not-backup');

  const names = new Set(existing.map((p) => p.name));
  const plans = list
    .map(sanitizePlan)
    .filter((p): p is SchedulePlan => p !== null)
    .map((p, i) => {
      let name = p.name || 'My schedule';
      if (names.has(name)) name = `${name} (restored)`;
      names.add(name);
      return { ...p, id: `plan-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`, name };
    });
  if (plans.length === 0) throw new Error('empty');
  return plans;
}
