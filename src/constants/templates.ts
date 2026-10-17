import { SchedulePlan, TemplateType } from '../types';

export const TEMPLATE_INFO: Record<
  TemplateType,
  { label: string; description: string; orientation: 'portrait' | 'landscape' }
> = {
  daily: {
    label: 'Daily Routine',
    description: 'Single vertical timeline with time slots and snap-in activities',
    orientation: 'portrait',
  },
  weekly: {
    label: 'Weekly Planner',
    description: 'Days of the week with time rows, ideal for kindergarten & school weeks',
    orientation: 'landscape',
  },
  checklist: {
    label: 'Routine Checklist',
    description: 'Ordered step-by-step checklist with big icons and colouring tick circles',
    orientation: 'portrait',
  },
  'first-then': {
    label: 'First–Then Board',
    description: 'Visual transition board with two clear side-by-side activity cards',
    orientation: 'landscape',
  },
};

export const createInitialPlan = (template: TemplateType = 'daily'): SchedulePlan => {
  const isLandscape = template === 'weekly' || template === 'first-then';
  const defaultTitle = 'My day';

  return {
    id: `plan-${Date.now()}`,
    name: defaultTitle,
    childName: '',
    title: defaultTitle,
    dateRange: 'Week of Oct 19 – 23',
    template,
    orientation: isLandscape ? 'landscape' : 'portrait',
    timeStartHour: 7,
    timeEndHour: 19,
    timeIncrement: 30,
    weekdaysOnly: true,
    showTimesOnBlocks: true,
    showCheckboxes: true,
    showHeaderSticker: true,
    headerCharacter: 'buddy',
    dyslexiaFriendly: false,
    blocks: [],
    stickers: [],
    updatedAt: Date.now(),
  };
};

export const getDefaultBlocksForTemplate = (template: TemplateType) => {
  if (template === 'daily') {
    return [
      {
        id: 'block-d-1',
        label: 'Wake up & stretch',
        iconName: 'Sun',
        category: 'morning' as const,
        startTime: '07:00',
        durationMinutes: 30,
        showCheckbox: true,
      },
      {
        id: 'block-d-2',
        label: 'Brush teeth & face',
        iconName: 'Sparkles',
        category: 'morning' as const,
        startTime: '07:30',
        durationMinutes: 30,
        showCheckbox: true,
      },
      {
        id: 'block-d-3',
        label: 'Warm breakfast',
        iconName: 'Utensils',
        category: 'morning' as const,
        startTime: '08:00',
        durationMinutes: 30,
        showCheckbox: true,
      },
      {
        id: 'block-d-4',
        label: 'Kindergarten & school',
        iconName: 'GraduationCap',
        category: 'learning' as const,
        startTime: '09:00',
        durationMinutes: 180,
        showCheckbox: true,
      },
      {
        id: 'block-d-5',
        label: 'Healthy snack & fruit',
        iconName: 'Apple',
        category: 'meals' as const,
        startTime: '12:30',
        durationMinutes: 30,
        showCheckbox: true,
      },
      {
        id: 'block-d-6',
        label: 'Outside playground fun',
        iconName: 'Trees',
        category: 'play' as const,
        startTime: '13:30',
        durationMinutes: 90,
        showCheckbox: true,
      },
      {
        id: 'block-d-7',
        label: 'Drawing & stories',
        iconName: 'Palette',
        category: 'learning' as const,
        startTime: '15:30',
        durationMinutes: 60,
        showCheckbox: true,
      },
      {
        id: 'block-d-8',
        label: 'Family dinner',
        iconName: 'Soup',
        category: 'meals' as const,
        startTime: '17:30',
        durationMinutes: 45,
        showCheckbox: true,
      },
      {
        id: 'block-d-9',
        label: 'Warm bath & pyjamas',
        iconName: 'Bath',
        category: 'winddown' as const,
        startTime: '18:15',
        durationMinutes: 45,
        showCheckbox: true,
      },
    ];
  }

  if (template === 'weekly') {
    return [
      {
        id: 'block-w-1',
        label: 'School time',
        iconName: 'GraduationCap',
        category: 'learning' as const,
        startTime: '09:00',
        durationMinutes: 180,
        dayOfWeek: 'mon' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-2',
        label: 'School time',
        iconName: 'GraduationCap',
        category: 'learning' as const,
        startTime: '09:00',
        durationMinutes: 180,
        dayOfWeek: 'tue' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-3',
        label: 'Library & books',
        iconName: 'BookOpen',
        category: 'learning' as const,
        startTime: '09:00',
        durationMinutes: 180,
        dayOfWeek: 'wed' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-4',
        label: 'School time',
        iconName: 'GraduationCap',
        category: 'learning' as const,
        startTime: '09:00',
        durationMinutes: 180,
        dayOfWeek: 'thu' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-5',
        label: 'Nature walk & play',
        iconName: 'Trees',
        category: 'play' as const,
        startTime: '09:00',
        durationMinutes: 180,
        dayOfWeek: 'fri' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-6',
        label: 'Swimming lesson',
        iconName: 'Waves',
        category: 'play' as const,
        startTime: '15:00',
        durationMinutes: 60,
        dayOfWeek: 'tue' as const,
        showCheckbox: true,
      },
      {
        id: 'block-w-7',
        label: 'Music & singing',
        iconName: 'Music',
        category: 'learning' as const,
        startTime: '15:00',
        durationMinutes: 60,
        dayOfWeek: 'thu' as const,
        showCheckbox: true,
      },
    ];
  }

  if (template === 'checklist') {
    return [
      {
        id: 'block-c-1',
        label: 'Make my bed nicely',
        iconName: 'Bed',
        category: 'morning' as const,
        durationMinutes: 15,
        slotIndex: 0,
        showCheckbox: true,
      },
      {
        id: 'block-c-2',
        label: 'Put on cosy clothes',
        iconName: 'Shirt',
        category: 'morning' as const,
        durationMinutes: 15,
        slotIndex: 1,
        showCheckbox: true,
      },
      {
        id: 'block-c-3',
        label: 'Brush teeth until sparkly',
        iconName: 'Sparkles',
        category: 'morning' as const,
        durationMinutes: 15,
        slotIndex: 2,
        showCheckbox: true,
      },
      {
        id: 'block-c-4',
        label: 'Eat yummy breakfast',
        iconName: 'Utensils',
        category: 'morning' as const,
        durationMinutes: 30,
        slotIndex: 3,
        showCheckbox: true,
      },
      {
        id: 'block-c-5',
        label: 'Pack backpack & water bottle',
        iconName: 'Backpack',
        category: 'morning' as const,
        durationMinutes: 15,
        slotIndex: 4,
        showCheckbox: true,
      },
      {
        id: 'block-c-6',
        label: 'Put on shoes & jacket',
        iconName: 'Footprints',
        category: 'morning' as const,
        durationMinutes: 10,
        slotIndex: 5,
        showCheckbox: true,
      },
    ];
  }

  // first-then
  return [
    {
      id: 'block-ft-1',
      label: 'Tidy up toys in bins',
      iconName: 'Broom',
      category: 'winddown' as const,
      durationMinutes: 20,
      isFirstThenSlot: 'first' as const,
      showCheckbox: true,
    },
    {
      id: 'block-ft-2',
      label: 'Outside playground fun',
      iconName: 'Bike',
      category: 'play' as const,
      durationMinutes: 45,
      isFirstThenSlot: 'then' as const,
      showCheckbox: true,
    },
  ];
};
