export type TemplateType = 'daily' | 'weekly' | 'checklist' | 'first-then';
export type PageOrientation = 'portrait' | 'landscape';
export type CharacterKey = 'buddy' | 'finn' | 'ollie' | 'faye' | 'rusty' | 'hana';

export interface ActivityBlock {
  id: string;
  label: string;
  iconName: string;
  category: 'morning' | 'learning' | 'meals' | 'play' | 'winddown' | 'custom';
  startTime?: string; // "07:30", "08:00" etc.
  durationMinutes: number; // 15, 30, 45, 60, 90, 120
  dayOfWeek?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  showCheckbox?: boolean;
  notes?: string;
  slotIndex?: number; // for checklist or first-then ordering
  isFirstThenSlot?: 'first' | 'then';
}

export interface CharacterSticker {
  id: string;
  characterKey: CharacterKey;
  name: string;
  x: number; // percentage or px
  y: number;
  size: number; // in px
  rotation: number; // in degrees
  zIndex: number;
}

export interface SchedulePlan {
  id: string;
  name: string;
  childName: string;
  title: string;
  dateRange: string;
  template: TemplateType;
  orientation: PageOrientation;
  timeStartHour: number; // e.g. 7 for 7 AM
  timeEndHour: number; // e.g. 20 for 8 PM
  timeIncrement: 15 | 30 | 60;
  weekdaysOnly: boolean;
  showTimesOnBlocks: boolean;
  showCheckboxes: boolean;
  showHeaderSticker: boolean;
  headerCharacter: CharacterKey;
  dyslexiaFriendly: boolean;
  blocks: ActivityBlock[];
  stickers: CharacterSticker[];
  updatedAt: number;
}

export interface CharacterDefinition {
  key: CharacterKey;
  name: string;
  animal: string;
  primaryColor: string;
  badgeTextColor: string;
  description: string;
}
