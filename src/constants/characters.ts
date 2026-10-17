import { CharacterDefinition, CharacterKey } from '../types';

export const CHARACTER_PALETTE = {
  cream: '#F2F2E2',
  yellow: '#F2B800',
  blush: '#F49AA0',
  orange: '#EE7B22',
  green: '#5BAE3C',
  blue: '#009BD9',
  red: '#E52311',
  ink: '#2D2200',
  paper: '#FFFFFF',
  trace: '#B6B2A6',
};

export const CHARACTERS: CharacterDefinition[] = [
  {
    key: 'buddy',
    name: 'Buddy',
    animal: 'Bear',
    primaryColor: '#F2B800', // Sun yellow
    badgeTextColor: '#2D2200',
    description: 'A cozy, helpful bear friend',
  },
  {
    key: 'finn',
    name: 'Finn',
    animal: 'Fox',
    primaryColor: '#EE7B22', // Fox orange
    badgeTextColor: '#FFFFFF',
    description: 'An adventurous and clever fox',
  },
  {
    key: 'ollie',
    name: 'Ollie',
    animal: 'Owl',
    primaryColor: '#009BD9', // Sky blue
    badgeTextColor: '#FFFFFF',
    description: 'A thoughtful and curious little owl',
  },
  {
    key: 'faye',
    name: 'Faye',
    animal: 'Frog',
    primaryColor: '#5BAE3C', // Leaf green
    badgeTextColor: '#FFFFFF',
    description: 'A cheerful and energetic hopper',
  },
  {
    key: 'rusty',
    name: 'Rusty',
    animal: 'Raccoon',
    primaryColor: '#F49AA0', // Blush
    badgeTextColor: '#2D2200',
    description: 'A playful and imaginative friend',
  },
  {
    key: 'hana',
    name: 'Hana',
    animal: 'Hummingbird',
    primaryColor: '#E52311', // Brigade red
    badgeTextColor: '#FFFFFF',
    description: 'A bright and swift gentle explorer',
  },
];

export const getCharacterByKey = (key: CharacterKey): CharacterDefinition => {
  const found = CHARACTERS.find((c) => c.key === key);
  return found || CHARACTERS[0];
};
