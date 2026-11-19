import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  GameState,
  KEY_POOL_LABELS,
  KeyPoolMode,
  LeaderboardEntry,
  TRIALS_PER_ROUND,
  TrialRecord,
} from '../types/game';
import {
  playEarlyWarning,
  playErrorBuzz,
  playGoSignal,
  playRoundComplete,
  playSuccessChime,
} from '../utils/sound';
import { pickDistinctRoundKeys } from '../utils/storage';
import { KeyboardMapSummary } from './KeyboardMapSummary';
import { Keycap } from './Keycap';

interface ReactionArenaProps {
  mode: KeyPoolMode;
  onModeChange: (mode: KeyPoolMode) => void;
  muted: boolean;
  onRoundComplete: (entry: LeaderboardEntry) => number;
}

const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'Escape',
  'NumLock',
  'ScrollLock',
  'Fn',
  'ContextMenu',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

export const ReactionArena: React.FC<ReactionArenaProps> = ({
  mode,
  onModeChange,
  muted,
  onRoundComplete,
}) => {
  const [gameState, setGameState] = useState<GameState>('NAME_ENTRY');
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');

  const [roundKeys, setRoundKeys] = useState<string[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [currentMistakes, setCurrentMistakes] = useState(0);
  const [wrongKeyNotice, setWrongKeyNotice] = useState<string | null>(null);
  const [earlyPressedKey, setEarlyPressedKey] = useState<string | null>(null);
  const [shakeTick, setShakeTick] = useState(0);

  const [completedEntry, setCompletedEntry] = useState<LeaderboardEntry | null>(null);
  const [completedRank, setCompletedRank] = useState<number | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const waitTimeoutRef = useRef<number | null>(null);
  const goTimestampRef = useRef<number>(0);
  const stateEnteredAtRef = useRef<number>(0);

  const clearWaitTimeout = useCallback(() => {
    if (waitTimeoutRef.current !== null) {
      window.clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearWaitTimeout();
    };
  }, [clearWaitTimeout]);

  const beginWaitingPhase = useCallback(() => {
    clearWaitTimeout();
    setWrongKeyNotice(null);
    setEarlyPressedKey(null);
    setCurrentMistakes(0);
    setGameState('WAITING');
    stateEnteredAtRef.current = performance.now();

    const randomDelayMs = 1400 + Math.floor(Math.random() * 2600);
    waitTimeoutRef.current = window.setTimeout(() => {
      goTimestampRef.current = performance.now();
      stateEnteredAtRef.current = goTimestampRef.current;
      setGameState('ACTIVE');
      playGoSignal(muted);
    }, randomDelayMs);
  }, [clearWaitTimeout, muted]);

  const handleStartRound = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = playerName.trim();
      if (!trimmed) {
        setNameError('Skriv in ditt namn innan du startar.');
        nameInputRef.current?.focus();
        return;
      }

      setNameError('');
      const keys = pickDistinctRoundKeys(mode, TRIALS_PER_ROUND);
      setRoundKeys(keys);
      setTrialIndex(0);
      setTrials([]);
      setCompletedEntry(null);
      setCompletedRank(null);
      setPlayerName(trimmed);
      beginWaitingPhase();
    },
    [beginWaitingPhase, mode, playerName]
  );

  const handleNextPlayer = useCallback(() => {
    clearWaitTimeout();
    setPlayerName('');
    setNameError('');
    setRoundKeys([]);
    setTrialIndex(0);
    setTrials([]);
    setCurrentMistakes(0);
    setWrongKeyNotice(null);
    setEarlyPressedKey(null);
    setCompletedEntry(null);
    setCompletedRank(null);
    setGameState('NAME_ENTRY');
    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 30);
  }, [clearWaitTimeout]);

  const advanceTrialOrFinish = useCallback(() => {
    if (trialIndex + 1 < TRIALS_PER_ROUND) {
      setTrialIndex((prev) => prev + 1);
      beginWaitingPhase();
    } else {
      const fastest = trials.reduce((best, curr) =>
        curr.timeMs < best.timeMs ? curr : best
      );
      const totalMs = trials.reduce((sum, t) => sum + t.timeMs, 0);
      const totalMistakes = trials.reduce((sum, t) => sum + t.mistakes, 0);

      const entry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerName: playerName.trim(),
        bestTimeMs: fastest.timeMs,
        bestKey: fastest.key,
        avgTimeMs: Math.round(totalMs / trials.length),
        totalMistakes,
        mode,
        trials: [...trials],
        createdAt: Date.now(),
      };

      const rank = onRoundComplete(entry);
      setCompletedEntry(entry);
      setCompletedRank(rank);
      setGameState('ROUND_SUMMARY');
      stateEnteredAtRef.current = performance.now();
      playRoundComplete(muted);
    }
  }, [beginWaitingPhase, mode, muted, onRoundComplete, playerName, trialIndex, trials]);

  useEffect(() => {
    if (gameState === 'NAME_ENTRY') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (MODIFIER_KEYS.has(e.key)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = performance.now();

      if (gameState === 'WAITING') {
        e.preventDefault();
        clearWaitTimeout();
        const label = e.key === ' ' ? 'Mellanslag' : e.key.toUpperCase();
        setEarlyPressedKey(label);
        setGameState('TOO_EARLY');
        stateEnteredAtRef.current = now;
        playEarlyWarning(muted);
        return;
      }

      if (gameState === 'ACTIVE') {
        e.preventDefault();
        const targetKey = roundKeys[trialIndex];
        const pressedNormalized = e.key.length === 1 ? e.key.toUpperCase() : e.key;

        if (e.key === ' ') {
          return;
        }

        if (pressedNormalized === targetKey) {
          const elapsed = Math.max(1, Math.round(now - goTimestampRef.current));
          const record: TrialRecord = {
            trialNumber: trialIndex + 1,
            key: targetKey,
            timeMs: elapsed,
            mistakes: currentMistakes,
          };

          setTrials((prev) => [...prev, record]);
          setWrongKeyNotice(null);
          setGameState('TRIAL_DONE');
          stateEnteredAtRef.current = now;
          playSuccessChime(muted);
        } else {
          setCurrentMistakes((prev) => prev + 1);
          setWrongKeyNotice(
            pressedNormalized.length === 1 ? pressedNormalized : e.key
          );
          setShakeTick((prev) => prev + 1);
          playErrorBuzz(muted);
        }
        return;
      }

      if (gameState === 'TOO_EARLY') {
        if (now - stateEnteredAtRef.current < 220) return;
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          beginWaitingPhase();
        }
        return;
      }

      if (gameState === 'TRIAL_DONE') {
        if (now - stateEnteredAtRef.current < 220) return;
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          advanceTrialOrFinish();
        }
        return;
      }

      if (gameState === 'ROUND_SUMMARY') {
        if (now - stateEnteredAtRef.current < 350) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNextPlayer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    advanceTrialOrFinish,
    beginWaitingPhase,
    clearWaitTimeout,
    currentMistakes,
    gameState,
    handleNextPlayer,
    muted,
    roundKeys,
    trialIndex,
  ]);

  const currentTargetKey = roundKeys[trialIndex] ?? '';
  const lastTrial = trials[trials.length - 1];

  return (
    <section
      id="testet"
      aria-label="Reaktionstest för tangentbord"
      className="flex flex-col"
    >
      {/* State 1: NAME_ENTRY */}
      {gameState === 'NAME_ENTRY' && (
        <div className="rounded-xl border border-[#262B35] bg-[#16191F] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
            <span>MS Teknis</span>
            <span>3 tangenter per runda</span>
          </div>

          <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4F6] [text-wrap:balance]">
            Reaktionstest för tangentbord
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#9CA3AF]">
            När rutan blir grön visas en tangent som du ska trycka på så snabbt
            du kan. Skriv in ditt namn för att börja — din snabbaste tid och
            tangent sparas på topplistan.
          </p>

          <form onSubmit={handleStartRound} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="player-name-input"
                className="block text-xs font-medium text-[#D1D5DB]"
              >
                Namn
              </label>
              <div className="mt-1.5 flex flex-col sm:flex-row gap-2.5">
                <input
                  ref={nameInputRef}
                  id="player-name-input"
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  maxLength={24}
                  autoFocus
                  autoComplete="off"
                  placeholder="Skriv ditt namn..."
                  className="flex-1 rounded-lg border border-[#2E3440] bg-[#101217] px-3.5 py-2.5 text-sm text-[#F3F4F6] placeholder:text-[#6B7280] transition-colors focus:border-[#60A5FA] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  Starta runda
                </button>
              </div>
              {nameError && (
                <p role="alert" className="mt-2 text-xs text-[#F87171]">
                  {nameError}
                </p>
              )}
            </div>

            {/* Key pool selector */}
            <div className="border-t border-[#222731] pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <span className="text-xs font-medium text-[#9CA3AF]">
                  Tangentomfång
                </span>

                <div
                  role="group"
                  aria-label="Tangentomfång"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#222731] bg-[#101217] p-1 self-start sm:self-auto"
                >
                  {(['letters_az', 'swedish_ao', 'alphanumeric'] as KeyPoolMode[]).map(
                    (modeOption) => {
                      const active = mode === modeOption;
                      return (
                        <button
                          key={modeOption}
                          type="button"
                          onClick={() => onModeChange(modeOption)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-[#232833] text-white'
                              : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                          }`}
                        >
                          {KEY_POOL_LABELS[modeOption]}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* State 2: WAITING (Matte Red Stage) */}
      {gameState === 'WAITING' && (
        <div className="flex min-h-[360px] flex-col justify-between rounded-xl border border-[#7F1D1D] bg-[#6B1B1B] p-6 text-white select-none">
          <div className="flex items-center justify-between gap-4 text-xs text-red-200">
            <span>
              {playerName} · Försök {trialIndex + 1} av {TRIALS_PER_ROUND}
            </span>
            <button
              type="button"
              onClick={handleNextPlayer}
              className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-medium text-red-100 transition-colors hover:bg-black/40 whitespace-nowrap cursor-pointer"
            >
              Avbryt
            </button>
          </div>

          <div className="my-auto flex flex-col items-center py-8 text-center">
            <Clock className="mb-3 h-7 w-7 text-red-200" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Vänta på grönt...
            </h2>
            <p className="mt-2 max-w-md text-sm text-red-100/90">
              Tryck inte på någon tangent förrän rutan blir grön och bokstaven
              visas.
            </p>
          </div>

          <div className="text-center text-xs text-red-200/80">
            {KEY_POOL_LABELS[mode]}
          </div>
        </div>
      )}

      {/* State 3: ACTIVE (Matte Green Stage) */}
      {gameState === 'ACTIVE' && (
        <div className="flex min-h-[360px] flex-col justify-between rounded-xl border border-[#15803D] bg-[#166534] p-6 text-white select-none">
          <div className="flex items-center justify-between gap-4 text-xs text-emerald-100">
            <span>
              {playerName} · Försök {trialIndex + 1} av {TRIALS_PER_ROUND}
            </span>
            <button
              type="button"
              onClick={handleNextPlayer}
              className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-medium text-emerald-100 transition-colors hover:bg-black/40 whitespace-nowrap cursor-pointer"
            >
              Avbryt
            </button>
          </div>

          <div
            key={shakeTick}
            className={`my-auto flex flex-col items-center py-6 text-center ${
              shakeTick > 0 ? 'animate-key-shake' : ''
            }`}
          >
            <span className="mb-3 text-xs font-semibold tracking-wide text-emerald-100">
              Tryck på tangenten
            </span>

            <Keycap label={currentTargetKey} size="xl" variant="active" />

            {wrongKeyNotice ? (
              <p
                role="status"
                className="mt-4 rounded-md bg-[#7F1D1D] px-3 py-1.5 text-xs font-medium text-white"
              >
                Fel tangent ({wrongKeyNotice}) — tryck på {currentTargetKey} ({currentMistakes} fel)
              </p>
            ) : (
              <p className="mt-4 text-xs text-emerald-100/90">
                Hitta <span className="font-mono font-bold">{currentTargetKey}</span> på
                tangentbordet
              </p>
            )}
          </div>

          <div className="text-center text-xs text-emerald-100/70">
            Timern stoppas när rätt tangent trycks ned
          </div>
        </div>
      )}

      {/* State 4: TOO_EARLY */}
      {gameState === 'TOO_EARLY' && (
        <div className="flex min-h-[360px] flex-col justify-between rounded-xl border border-[#92400E] bg-[#78350F] p-6 text-white">
          <div className="flex items-center justify-between gap-4 text-xs text-amber-200">
            <span>
              {playerName} · Försök {trialIndex + 1} av {TRIALS_PER_ROUND}
            </span>
            <button
              type="button"
              onClick={handleNextPlayer}
              className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-medium text-amber-100 transition-colors hover:bg-black/40 whitespace-nowrap cursor-pointer"
            >
              Avbryt
            </button>
          </div>

          <div className="my-auto flex flex-col items-center py-8 text-center">
            <AlertTriangle className="mb-3 h-7 w-7 text-amber-200" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              För tidigt
            </h2>
            <p className="mt-2 max-w-md text-sm text-amber-100">
              {earlyPressedKey
                ? `Du tryckte på "${earlyPressedKey}" innan signalen blev grön.`
                : 'Du tryckte innan signalen blev grön.'}
            </p>
            <button
              type="button"
              onClick={beginWaitingPhase}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-white whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Försök igen
            </button>
          </div>

          <div className="text-center text-xs text-amber-200/80">
            Mellanslag eller Enter för att försöka igen
          </div>
        </div>
      )}

      {/* State 5: TRIAL_DONE */}
      {gameState === 'TRIAL_DONE' && lastTrial && (
        <div className="flex min-h-[360px] flex-col justify-between rounded-xl border border-[#262B35] bg-[#16191F] p-6 text-[#F3F4F6]">
          <div className="flex items-center justify-between gap-4 text-xs text-[#9CA3AF]">
            <span>
              {playerName} · Försök {lastTrial.trialNumber} av {TRIALS_PER_ROUND} klart
            </span>
            <button
              type="button"
              onClick={handleNextPlayer}
              className="rounded-md border border-[#2E3440] bg-[#1C2028] px-2.5 py-1 text-xs font-medium text-[#D1D5DB] transition-colors hover:text-white whitespace-nowrap cursor-pointer"
            >
              Avbryt
            </button>
          </div>

          <div className="my-auto flex flex-col items-center py-6 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#4ADE80]">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Rätt tangent</span>
            </div>

            <div className="flex items-center gap-3.5">
              <Keycap label={lastTrial.key} size="md" variant="default" />
              <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-white">
                {lastTrial.timeMs} ms
              </span>
            </div>

            <p className="mt-3 text-xs text-[#9CA3AF] tabular-nums">
              {lastTrial.mistakes === 0
                ? '0 feltryck'
                : `${lastTrial.mistakes} feltryck`}
            </p>

            <button
              type="button"
              onClick={advanceTrialOrFinish}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-white whitespace-nowrap cursor-pointer"
            >
              {trialIndex + 1 < TRIALS_PER_ROUND
                ? 'Nästa försök'
                : 'Visa resultat'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="text-center text-xs text-[#6B7280]">
            Tryck Mellanslag eller Enter för att fortsätta
          </div>
        </div>
      )}

      {/* State 6: ROUND_SUMMARY */}
      {gameState === 'ROUND_SUMMARY' && completedEntry && (
        <div className="rounded-xl border border-[#262B35] bg-[#16191F] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
            <span className="font-medium text-[#4ADE80]">
              Resultat sparat på topplistan
            </span>
            <span>
              {completedEntry.playerName}
              {completedRank !== null && ` · Plats #${completedRank}`}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-6 border-b border-[#222731] pb-5">
            <div>
              <p className="text-xs text-[#9CA3AF]">Snabbaste tid</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {completedEntry.bestTimeMs} ms
                </span>
                <Keycap label={completedEntry.bestKey} size="sm" variant="default" />
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm">
              <div>
                <div className="text-xs text-[#9CA3AF]">Snittid</div>
                <div className="mt-0.5 font-mono text-base font-semibold text-[#F3F4F6] tabular-nums">
                  {completedEntry.avgTimeMs} ms
                </div>
              </div>
              <div className="h-7 w-px bg-[#262B35]" aria-hidden="true" />
              <div>
                <div className="text-xs text-[#9CA3AF]">Feltryck</div>
                <div className="mt-0.5 font-mono text-base font-semibold text-[#F3F4F6] tabular-nums">
                  {completedEntry.totalMistakes}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {completedEntry.trials.map((t) => {
              const isBest =
                t.key === completedEntry.bestKey &&
                t.timeMs === completedEntry.bestTimeMs;
              return (
                <div
                  key={t.trialNumber}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isBest
                      ? 'border-[#166534] bg-[#14231B]'
                      : 'border-[#242934] bg-[#111318]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Keycap label={t.key} size="sm" variant="default" />
                    <div>
                      <div className="text-xs font-medium text-[#E5E7EB]">
                        Försök {t.trialNumber}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {t.mistakes} fel
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#F3F4F6] tabular-nums">
                    {t.timeMs} ms
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <KeyboardMapSummary
              trials={completedEntry.trials}
              bestKey={completedEntry.bestKey}
              showNumbersRow={completedEntry.mode === 'alphanumeric'}
            />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#222731] pt-4">
            <p className="text-xs text-[#9CA3AF]">
              Nästa spelare måste skriva sitt namn innan rundan startar.
            </p>
            <button
              type="button"
              onClick={handleNextPlayer}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Nästa spelare
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Plain, concise rules row (non-flashy) */}
      <div
        id="regler"
        className="mt-4 rounded-xl border border-[#262B35] bg-[#16191F] px-5 py-4 text-xs leading-relaxed text-[#9CA3AF]"
      >
        <span className="font-semibold text-[#E5E7EB]">Regler: </span>
        Skriv in ditt namn och starta rundan. Vänta tills rutan blir grön och
        tryck på den visade tangenten så snabbt som möjligt. Fel tangent låter
        klockan fortsätta ticka. Efter 3 försök sparas din snabbaste tid och
        tangent på topplistan, och nästa person får skriva in sitt namn.
      </div>
    </section>
  );
};
