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
function sanitizePlan(raw: unknown): SchedulePlan | null {
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
