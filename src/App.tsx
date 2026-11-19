import { useCallback, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ReactionArena } from './components/ReactionArena';
import { KeyPoolMode, LeaderboardEntry } from './types/game';
import {
  addLeaderboardEntry,
  clearLeaderboard,
  loadLeaderboard,
} from './utils/storage';

export default function App() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => loadLeaderboard());
  const [lastSavedEntryId, setLastSavedEntryId] = useState<string | null>(null);
  const [mode, setMode] = useState<KeyPoolMode>('letters_az');
  const [muted, setMuted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleRoundComplete = useCallback((entry: LeaderboardEntry): number => {
    const updated = addLeaderboardEntry(entry);
    setEntries(updated);
    setLastSavedEntryId(entry.id);
    const rank = updated.findIndex((item) => item.id === entry.id) + 1;
    return rank > 0 ? rank : updated.length;
  }, []);

  const handleClearLeaderboard = useCallback(() => {
    const cleared = clearLeaderboard();
    setEntries(cleared);
    setLastSavedEntryId(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115] text-[#E5E7EB]">
      {/* Top Bar: 3-zone contract */}
      <header className="border-b border-[#222731] bg-[#16191F]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-5 py-3">
          {/* Zone 1: Brand mark */}
          <a
            href="#testet"
            className="inline-flex items-center whitespace-nowrap shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#60A5FA]"
          >
            {!logoError ? (
              <span className="inline-flex items-center rounded-md bg-white/95 px-2 py-1">
                <img
                  src="./assets/aistudio/image_745b88ba.png"
                  alt="MS Teknis"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-7 w-auto object-contain"
                />
              </span>
            ) : (
              <span className="text-base font-bold tracking-tight text-white">
                MS Teknis
              </span>
            )}
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Huvudnavigering"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9CA3AF]"
          >
            <a
              href="#testet"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Testet
            </a>
            <a
              href="#regler"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Regler
            </a>
            <a
              href="#topplista"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Topplista
            </a>
          </nav>

          {/* Zone 3: 1 primary action control */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-pressed={!muted}
              className="inline-flex items-center gap-2 rounded-md border border-[#2E3440] bg-[#1C2028] px-3 py-1.5 text-xs font-medium text-[#D1D5DB] transition-colors hover:border-[#3E4656] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden="true" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-[#D1D5DB]" aria-hidden="true" />
              )}
              <span>{muted ? 'Ljud: Av' : 'Ljud: På'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <ReactionArena
              mode={mode}
              onModeChange={setMode}
              muted={muted}
              onRoundComplete={handleRoundComplete}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <LeaderboardPanel
              entries={entries}
              lastSavedEntryId={lastSavedEntryId}
              onClear={handleClearLeaderboard}
            />
          </div>
        </div>
      </main>

      {/* Clean Attribution Footer */}
      <footer className="border-t border-[#222731] bg-[#16191F]">
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2.5">
            {!logoError ? (
              <span className="inline-flex items-center rounded bg-white/95 px-1.5 py-0.5">
                <img
                  src="./assets/aistudio/image_745b88ba.png"
                  alt="MS Teknis logotyp"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-5 w-auto object-contain"
                />
              </span>
            ) : (
              <span className="font-semibold text-white">MS Teknis</span>
            )}
            <span aria-hidden="true">·</span>
            <span>Skapat av MS Teknis</span>
          </div>
          <div>
            <span>Reaktionstest för tangentbord</span>
            <span aria-hidden="true"> · </span>
            <span>© {new Date().getFullYear()} MS Teknis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
