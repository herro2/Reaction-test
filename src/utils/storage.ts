import { KEY_POOLS, KeyPoolMode, LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'ms_teknis_reaction_leaderboard_v1';

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.bestTimeMs !== b.bestTimeMs) return a.bestTimeMs - b.bestTimeMs;
    if (a.totalMistakes !== b.totalMistakes) return a.totalMistakes - b.totalMistakes;
    if (a.avgTimeMs !== b.avgTimeMs) return a.avgTimeMs - b.avgTimeMs;
    return a.createdAt - b.createdAt;
  });
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortLeaderboard(parsed);
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = sortLeaderboard(entries);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
  return sorted;
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const current = loadLeaderboard();
  return saveLeaderboard([...current, entry]);
}

export function clearLeaderboard(): LeaderboardEntry[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return [];
}

export function pickDistinctRoundKeys(mode: KeyPoolMode, count: number): string[] {
  const pool = [...KEY_POOLS[mode]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
