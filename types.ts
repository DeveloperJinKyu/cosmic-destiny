export type Gender = 'male' | 'female' | 'other';

export interface UserData {
  name: string;
  gender: Gender;
  birthDate: string;
  birthTime?: string;
  character: {
    hairStyle: string;
    eyeStyle: string;
    outfitStyle: string;
  };
}

export interface FortuneResult {
  wealth: string;
  love: string;
  health: string;
  advice: string;
}

export enum AppStep {
  LANDING = 0,
  FORTUNE_INPUT = 1,
  CHARACTER_INPUT = 2,
  RESULT = 3,
}

export interface OptionItem {
  id: string;
  label: string;
  emoji?: string;
}