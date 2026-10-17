import { ActivityBlock } from '../types';

export interface StarterBlockTemplate {
  label: string;
  iconName: string;
  category: 'morning' | 'learning' | 'meals' | 'play' | 'winddown' | 'custom';
  defaultDuration: number;
}

export const STARTER_BLOCKS: StarterBlockTemplate[] = [
  // Morning
  { label: 'Wake up', iconName: 'Sun', category: 'morning', defaultDuration: 15 },
  { label: 'Brush teeth', iconName: 'Sparkles', category: 'morning', defaultDuration: 15 },
  { label: 'Wash face', iconName: 'Droplet', category: 'morning', defaultDuration: 15 },
  { label: 'Get dressed', iconName: 'Shirt', category: 'morning', defaultDuration: 15 },
  { label: 'Make bed', iconName: 'Bed', category: 'morning', defaultDuration: 15 },
  { label: 'Eat breakfast', iconName: 'Utensils', category: 'morning', defaultDuration: 30 },
  { label: 'Pack backpack', iconName: 'Backpack', category: 'morning', defaultDuration: 15 },

  // School & Learning
  { label: 'School time', iconName: 'GraduationCap', category: 'learning', defaultDuration: 180 },
  { label: 'Reading books', iconName: 'BookOpen', category: 'learning', defaultDuration: 30 },
  { label: 'Homework', iconName: 'Pencil', category: 'learning', defaultDuration: 30 },
  { label: 'Music practice', iconName: 'Music', category: 'learning', defaultDuration: 30 },
  { label: 'Art & crafts', iconName: 'Palette', category: 'learning', defaultDuration: 45 },
  { label: 'Circle time', iconName: 'Users', category: 'learning', defaultDuration: 30 },

  // Meals & Snacks
  { label: 'Morning snack', iconName: 'Apple', category: 'meals', defaultDuration: 15 },
  { label: 'Healthy lunch', iconName: 'UtensilsCrossed', category: 'meals', defaultDuration: 30 },
  { label: 'Afternoon snack', iconName: 'Cookie', category: 'meals', defaultDuration: 15 },
  { label: 'Family dinner', iconName: 'Soup', category: 'meals', defaultDuration: 45 },
  { label: 'Drink water', iconName: 'GlassWater', category: 'meals', defaultDuration: 15 },

  // Play & Activities
  { label: 'Outside play', iconName: 'Trees', category: 'play', defaultDuration: 60 },
  { label: 'Playground fun', iconName: 'Bike', category: 'play', defaultDuration: 60 },
  { label: 'Screen time', iconName: 'Tv', category: 'play', defaultDuration: 30 },
  { label: 'Free play', iconName: 'Gamepad2', category: 'play', defaultDuration: 45 },
  { label: 'Sports & exercise', iconName: 'Trophy', category: 'play', defaultDuration: 45 },
  { label: 'Care for pets', iconName: 'HeartHandshake', category: 'play', defaultDuration: 20 },
  { label: 'Swimming', iconName: 'Waves', category: 'play', defaultDuration: 60 },

  // Wind-down
  { label: 'Tidy up toys', iconName: 'Broom', category: 'winddown', defaultDuration: 20 },
  { label: 'Afternoon nap', iconName: 'CloudMoon', category: 'winddown', defaultDuration: 60 },
  { label: 'Bath time', iconName: 'Bath', category: 'winddown', defaultDuration: 30 },
  { label: 'Put on pyjamas', iconName: 'Moon', category: 'winddown', defaultDuration: 15 },
  { label: 'Story time', iconName: 'BookHeart', category: 'winddown', defaultDuration: 20 },
  { label: 'Bedtime', iconName: 'BedDouble', category: 'winddown', defaultDuration: 30 },
];

export const AVAILABLE_ICONS: string[] = [
  'Sun',
  'Sparkles',
  'Droplet',
  'Shirt',
  'Bed',
  'Utensils',
  'Backpack',
  'GraduationCap',
  'BookOpen',
  'Pencil',
  'Music',
  'Palette',
  'Users',
  'Apple',
  'UtensilsCrossed',
  'Cookie',
  'Soup',
  'GlassWater',
  'Trees',
  'Bike',
  'Tv',
  'Gamepad2',
  'Trophy',
  'HeartHandshake',
  'Waves',
  'Broom',
  'CloudMoon',
  'Bath',
  'Moon',
  'BookHeart',
  'BedDouble',
  'Smile',
  'Star',
  'Heart',
  'Car',
  'Compass',
  'Clock',
  'Footprints',
  'CheckCircle2',
];

export const createBlockFromTemplate = (
  template: StarterBlockTemplate,
  startTime?: string,
  dayOfWeek?: ActivityBlock['dayOfWeek']
): ActivityBlock => {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    label: template.label,
    iconName: template.iconName,
    category: template.category,
    startTime: startTime || '08:00',
    durationMinutes: template.defaultDuration,
    dayOfWeek: dayOfWeek || 'mon',
    showCheckbox: true,
  };
};
