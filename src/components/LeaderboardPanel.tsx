import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { KEY_POOL_LABELS, KeyPoolMode, LeaderboardEntry } from '../types/game';
import { Keycap } from './Keycap';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  lastSavedEntryId: string | null;
  onClear: () => void;
}

type FilterOption = 'all' | KeyPoolMode;

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  lastSavedEntryId,
  onClear,
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((item) => item.mode === filter);
  }, [entries, filter]);

  const filterButtons: { id: FilterOption; label: string }[] = [
    { id: 'all', label: 'Alla' },
    { id: 'letters_az', label: 'A–Z' },
    { id: 'swedish_ao', label: 'A–Ö' },
    { id: 'alphanumeric', label: 'A–Z + 0–9' },
  ];

  return (
    <section
      id="topplista"
      aria-labelledby="leaderboard-heading"
      className="flex h-full flex-col rounded-xl border border-[#262B35] bg-[#16191F] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="leaderboard-heading"
            className="text-lg font-semibold tracking-tight text-[#F3F4F6]"
          >
            Topplista
          </h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {entries.length === 0
              ? 'Inga rundor sparade ännu'
              : `${entries.length} ${entries.length === 1 ? 'runda' : 'rundor'} · Sorterat på snabbast tid`}
          </p>
        </div>

        {entries.length > 0 && (
          <div className="shrink-0">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2E3440] bg-[#1C2028] px-2.5 py-1.5 text-xs font-medium text-[#D1D5DB] transition-colors hover:border-[#3E4656] hover:text-white whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Rensa
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setConfirmClear(false);
                  }}
                  className="rounded-md bg-[#991B1B] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#B91C1C] whitespace-nowrap cursor-pointer"
                >
                  Bekräfta
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-md border border-[#2E3440] bg-[#1C2028] px-2.5 py-1.5 text-xs font-medium text-[#D1D5DB] transition-colors hover:text-white whitespace-nowrap cursor-pointer"
                >
                  Avbryt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode filter */}
      <div
        role="group"
        aria-label="Filtrera topplista efter tangentläge"
        className="mt-4 flex items-center gap-1 rounded-lg border border-[#222731] bg-[#101217] p-1"
      >
        {filterButtons.map((btn) => {
          const active = filter === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#232833] text-white'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="mt-4 flex-1 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-[#262B35] bg-[#12151A] px-5 py-8 text-center">
            <p className="text-sm font-medium text-[#D1D5DB]">
              {entries.length === 0
                ? 'Topplistan är tom'
                : 'Inga resultat för detta val'}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#6B7280]">
              {entries.length === 0
                ? 'Skriv in ditt namn och kör en runda för att lägga till din tid.'
                : 'Välj Alla eller spela en runda i det valda läget.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#242934] text-[11px] font-medium text-[#9CA3AF]">
                  <th className="py-2 pr-2 w-8">#</th>
                  <th className="py-2 px-2">Spelare</th>
                  <th className="py-2 px-2 text-center">Tangent</th>
                  <th className="py-2 pl-2 text-right">Snabbast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20242E]">
                {filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isHighlighted = entry.id === lastSavedEntryId;

                  const rankStyle =
                    rank === 1
                      ? 'text-[#EAB308] font-bold'
                      : rank === 2
                        ? 'text-[#D1D5DB] font-semibold'
                        : rank === 3
                          ? 'text-[#D97706] font-semibold'
                          : 'text-[#6B7280]';

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-[#18251E]'
                          : 'hover:bg-[#1B1F27]'
                      }`}
                    >
                      <td className={`py-2.5 pr-2 font-mono text-xs tabular-nums ${rankStyle}`}>
                        {rank}
                      </td>
                      <td className="py-2.5 px-2 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate max-w-[140px] sm:max-w-[170px] text-sm font-medium text-[#F3F4F6]">
                            {entry.playerName}
                          </span>
                          {isHighlighted && (
                            <span className="text-[11px] font-medium text-[#4ADE80] shrink-0">
                              Senaste
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#6B7280] tabular-nums">
                          Snitt {entry.avgTimeMs} ms
                          <span aria-hidden="true"> · </span>
                          {entry.totalMistakes} fel
                          {filter === 'all' && (
                            <>
                              <span aria-hidden="true"> · </span>
                              {KEY_POOL_LABELS[entry.mode].split(' ')[0]}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Keycap label={entry.bestKey} size="sm" variant="default" />
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono text-sm font-semibold text-[#F3F4F6] tabular-nums whitespace-nowrap">
                        {entry.bestTimeMs} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
