import React from 'react';
import { TrialRecord } from '../types/game';

interface KeyboardMapSummaryProps {
  trials: TrialRecord[];
  bestKey: string;
  showNumbersRow?: boolean;
}

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const SWEDISH_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const KeyboardMapSummary: React.FC<KeyboardMapSummaryProps> = ({
  trials,
  bestKey,
  showNumbersRow = false,
}) => {
  const trialByKey = new Map<string, TrialRecord>();
  for (const trial of trials) {
    trialByKey.set(trial.key, trial);
  }

  const rows = showNumbersRow ? [NUMBER_ROW, ...SWEDISH_ROWS] : SWEDISH_ROWS;

  return (
    <div className="rounded-lg border border-[#262B35] bg-[#111318] p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
        <span className="font-medium text-[#D1D5DB]">
          Träffade tangenter
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-xs bg-[#22C55E]" />
            Snabbast ({bestKey})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-xs bg-[#E5E7EB]" />
            Övriga
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 overflow-x-auto pb-1">
        {rows.map((row, rowIdx) => {
          const offsetClass =
            !showNumbersRow && rowIdx === 1
              ? 'pl-3'
              : !showNumbersRow && rowIdx === 2
                ? 'pl-7'
                : showNumbersRow && rowIdx === 2
                  ? 'pl-3'
                  : showNumbersRow && rowIdx === 3
                    ? 'pl-7'
                    : '';

          return (
            <div key={rowIdx} className={`flex items-center gap-1 ${offsetClass}`}>
              {row.map((keyLabel) => {
                const hit = trialByKey.get(keyLabel);
                const isBest = hit && hit.key === bestKey;

                return (
                  <div
                    key={keyLabel}
                    title={
                      hit
                        ? `${keyLabel}: ${hit.timeMs} ms (${hit.mistakes} feltryck)`
                        : keyLabel
                    }
                    className={`flex h-8 min-w-[28px] sm:min-w-[32px] flex-col items-center justify-center rounded border border-b-2 px-1 font-mono ${
                      isBest
                        ? 'border-[#16A34A] border-b-[#15803D] bg-[#166534] text-white'
                        : hit
                          ? 'border-[#D1D5DB] border-b-[#9CA3AF] bg-[#E5E7EB] text-[#111827]'
                          : 'border-[#2A303C] border-b-[#181B22] bg-[#1A1E26] text-[#6B7280]'
                    }`}
                  >
                    <span className="text-[11px] font-bold leading-none">{keyLabel}</span>
                    {hit && (
                      <span className="mt-0.5 text-[9px] font-medium leading-none opacity-90 tabular-nums">
                        {hit.timeMs}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
