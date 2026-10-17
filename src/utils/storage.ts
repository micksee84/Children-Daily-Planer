import { SchedulePlan } from '../types';
import { createInitialPlan } from '../constants/templates';

const STORAGE_KEY_PLANS = 'sunshine_brigade_plans_v2';
const STORAGE_KEY_ACTIVE = 'sunshine_brigade_active_plan_id_v2';

export function loadSavedPlans(): { plans: SchedulePlan[]; activeId: string } {
  try {
    const rawPlans = localStorage.getItem(STORAGE_KEY_PLANS);
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);

    if (rawPlans) {
      const parsed = JSON.parse(rawPlans) as SchedulePlan[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const foundActive = activeId && parsed.find((p) => p.id === activeId);
        return {
          plans: parsed,
          activeId: foundActive ? activeId : parsed[0].id,
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
