export type GameState =
  | 'NAME_ENTRY'
  | 'WAITING'
  | 'ACTIVE'
  | 'TOO_EARLY'
  | 'TRIAL_DONE'
  | 'ROUND_SUMMARY';

export type KeyPoolMode = 'letters_az' | 'swedish_ao' | 'alphanumeric';

export interface TrialRecord {
  trialNumber: number;
  key: string;
  timeMs: number;
  mistakes: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  bestTimeMs: number;
  bestKey: string;
  avgTimeMs: number;
  totalMistakes: number;
  mode: KeyPoolMode;
  trials: TrialRecord[];
  createdAt: number;
}

export const TRIALS_PER_ROUND = 3;

export const KEY_POOL_LABELS: Record<KeyPoolMode, string> = {
  letters_az: 'A–Z (Standard)',
  swedish_ao: 'A–Ö (Svenska)',
  alphanumeric: 'A–Z + 0–9',
};

export const KEY_POOLS: Record<KeyPoolMode, string[]> = {
  letters_az: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  swedish_ao: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split(''),
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
};
