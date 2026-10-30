import { ActivityBlock, SchedulePlan } from '../types';
import { STARTER_BLOCKS } from './starterBlocks';

/**
 * Ready-made routines: a starting point a parent or teacher can print as is or change.
 * Each sets the page's hours and time step as well as its activities, so every block
 * lands on a whole row and the page always fits on one sheet. Activities use the same
 * names and icons as the left-hand list.
 */

type DayKey = NonNullable<ActivityBlock['dayOfWeek']>;

interface RoutineStep {
  /** A label from STARTER_BLOCKS; its icon and category come from there. */
  label: string;
  start: string; // "07:30"
  minutes: number;
  /** Week routines only: which days get this step (default Monday to Friday). */
  days?: DayKey[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  template: 'daily' | 'weekly';
  title: string;
  startHour: number;
  endHour: number;
  increment: 15 | 30 | 60;
  steps: RoutineStep[];
}

const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const ROUTINES: Routine[] = [
  {
    id: 'morning',
    name: 'Morning',
    description: 'Wake up to out the door, 7 to 9am',
    template: 'daily',
    title: 'My morning',
    startHour: 7,
    endHour: 9,
    increment: 15,
    steps: [
      { label: 'Wake up', start: '07:00', minutes: 15 },
      { label: 'Brush teeth', start: '07:15', minutes: 15 },
      { label: 'Wash face', start: '07:30', minutes: 15 },
      { label: 'Get dressed', start: '07:45', minutes: 15 },
      { label: 'Eat breakfast', start: '08:00', minutes: 30 },
      { label: 'Make bed', start: '08:30', minutes: 15 },
      { label: 'Pack backpack', start: '08:45', minutes: 15 },
    ],
  },
  {
    id: 'school-day',
    name: 'School day',
    description: 'The whole day, 7am to 7pm',
    template: 'daily',
    title: 'My school day',
    startHour: 7,
    endHour: 19,
    increment: 30,
    steps: [
      { label: 'Wake up', start: '07:00', minutes: 30 },
      { label: 'Eat breakfast', start: '07:30', minutes: 30 },
      { label: 'Pack backpack', start: '08:00', minutes: 30 },
      { label: 'School time', start: '08:30', minutes: 180 },
      { label: 'Healthy lunch', start: '11:30', minutes: 30 },
      { label: 'School time', start: '12:00', minutes: 180 },
      { label: 'Afternoon snack', start: '15:00', minutes: 30 },
      { label: 'Outside play', start: '15:30', minutes: 60 },
      { label: 'Family dinner', start: '17:30', minutes: 60 },
      { label: 'Bath time', start: '18:30', minutes: 30 },
    ],
  },
  {
    id: 'after-school',
    name: 'After school',
    description: 'Snack, play and dinner, 3 to 7pm',
    template: 'daily',
    title: 'After school',
    startHour: 15,
    endHour: 19,
    increment: 30,
    steps: [
      { label: 'Afternoon snack', start: '15:00', minutes: 30 },
      { label: 'Outside play', start: '15:30', minutes: 60 },
      { label: 'Reading books', start: '16:30', minutes: 30 },
      { label: 'Tidy up toys', start: '17:30', minutes: 30 },
      { label: 'Family dinner', start: '18:00', minutes: 60 },
    ],
  },
  {
    id: 'bedtime',
    name: 'Bedtime',
    description: 'Bath, story and lights out, 6 to 8pm',
    template: 'daily',
    title: 'Bedtime',
    startHour: 18,
    endHour: 20,
    increment: 15,
    steps: [
      { label: 'Tidy up toys', start: '18:00', minutes: 15 },
      { label: 'Bath time', start: '18:15', minutes: 30 },
      { label: 'Put on pyjamas', start: '18:45', minutes: 15 },
      { label: 'Brush teeth', start: '19:00', minutes: 15 },
      { label: 'Story time', start: '19:15', minutes: 30 },
      { label: 'Bedtime', start: '19:45', minutes: 15 },
    ],
  },
  {
    id: 'weekend',
    name: 'Weekend day',
    description: 'A slower day at home, 8am to 7pm',
    template: 'daily',
    title: 'My weekend',
    startHour: 8,
    endHour: 19,
    increment: 30,
    steps: [
      { label: 'Wake up', start: '08:00', minutes: 30 },
      { label: 'Eat breakfast', start: '08:30', minutes: 30 },
      { label: 'Art & crafts', start: '09:00', minutes: 60 },
      { label: 'Playground fun', start: '10:00', minutes: 90 },
      { label: 'Healthy lunch', start: '11:30', minutes: 30 },
      { label: 'Afternoon nap', start: '12:00', minutes: 60 },
      { label: 'Afternoon snack', start: '14:00', minutes: 30 },
      { label: 'Outside play', start: '14:30', minutes: 90 },
      { label: 'Reading books', start: '16:00', minutes: 30 },
      { label: 'Tidy up toys', start: '16:30', minutes: 30 },
      { label: 'Family dinner', start: '17:00', minutes: 60 },
      { label: 'Bath time', start: '18:00', minutes: 30 },
      { label: 'Story time', start: '18:30', minutes: 30 },
    ],
  },
  {
    id: 'school-week',
    name: 'School week',
    description: 'Monday to Friday with swimming and music',
    template: 'weekly',
    title: 'My week',
    startHour: 7,
    endHour: 19,
    increment: 60,
    steps: [
      { label: 'Wake up', start: '07:00', minutes: 60 },
      { label: 'Eat breakfast', start: '08:00', minutes: 60 },
      { label: 'School time', start: '09:00', minutes: 180 },
      { label: 'Healthy lunch', start: '12:00', minutes: 60 },
      { label: 'School time', start: '13:00', minutes: 120 },
      { label: 'Outside play', start: '15:00', minutes: 60, days: ['mon', 'wed', 'fri'] },
      { label: 'Swimming', start: '15:00', minutes: 60, days: ['tue'] },
      { label: 'Music practice', start: '15:00', minutes: 60, days: ['thu'] },
      { label: 'Family dinner', start: '17:00', minutes: 60 },
      { label: 'Bath time', start: '18:00', minutes: 60 },
    ],
  },
  {
    id: 'home-week',
    name: 'Week at home',
    description: 'Monday to Friday with no school',
    template: 'weekly',
    title: 'My week',
    startHour: 7,
    endHour: 19,
    increment: 60,
    steps: [
      { label: 'Wake up', start: '07:00', minutes: 60 },
      { label: 'Eat breakfast', start: '08:00', minutes: 60 },
      { label: 'Circle time', start: '09:00', minutes: 60 },
      { label: 'Art & crafts', start: '10:00', minutes: 60, days: ['mon', 'wed', 'fri'] },
      { label: 'Reading books', start: '10:00', minutes: 60, days: ['tue', 'thu'] },
      { label: 'Outside play', start: '11:00', minutes: 60 },
      { label: 'Healthy lunch', start: '12:00', minutes: 60 },
      { label: 'Afternoon nap', start: '13:00', minutes: 60 },
      { label: 'Free play', start: '14:00', minutes: 60 },
      { label: 'Afternoon snack', start: '15:00', minutes: 60 },
      { label: 'Family dinner', start: '17:00', minutes: 60 },
      { label: 'Bath time', start: '18:00', minutes: 60 },
    ],
  },
];

/** The page settings and activities a routine puts on the page. */
export function buildRoutine(routine: Routine): Pick<
  SchedulePlan,
  'timeStartHour' | 'timeEndHour' | 'timeIncrement' | 'title' | 'blocks'
> {
  const stamp = Date.now();
  let n = 0;
  const makeBlock = (step: RoutineStep, day?: DayKey): ActivityBlock => {
    const starter = STARTER_BLOCKS.find((b) => b.label === step.label);
    return {
      id: `block-${stamp}-${n++}-${Math.random().toString(36).substring(2, 6)}`,
      label: step.label,
      iconName: starter?.iconName ?? 'Star',
      category: starter?.category ?? 'custom',
      startTime: step.start,
      durationMinutes: step.minutes,
      dayOfWeek: day,
      showCheckbox: true,
    };
  };

  const blocks =
    routine.template === 'weekly'
      ? routine.steps.flatMap((step) => (step.days ?? WEEKDAYS).map((day) => makeBlock(step, day)))
      : routine.steps.map((step) => makeBlock(step));

  return {
    timeStartHour: routine.startHour,
    timeEndHour: routine.endHour,
    timeIncrement: routine.increment,
    title: routine.title,
    blocks,
  };
}
