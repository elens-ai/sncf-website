import { getCMSCopy } from '../cms/runtime';
import React, { useEffect, useMemo } from 'react';
import { PillarState } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  pillars: PillarState[];
  onSelectPillar: (pillarIndex: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  pillars,
  onSelectPillar,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: {
      pillarIndex: number;
      pillar: PillarState;
      matchType: string;
      snippet: string;
    }[] = [];

    pillars.forEach((pillar, index) => {
      if (pillar.label.toLowerCase().includes(q)) {
        results.push({
          pillarIndex: index,
          pillar,
          matchType: 'Pillar Name',
          snippet: pillar.headline,
        });
      } else if (pillar.headline.toLowerCase().includes(q)) {
        results.push({
          pillarIndex: index,
          pillar,
          matchType: 'Headline',
          snippet: pillar.headline,
        });
      } else if (pillar.body.toLowerCase().includes(q)) {
        results.push({
          pillarIndex: index,
          pillar,
          matchType: 'Description',
          snippet: pillar.body,
        });
      } else {
        const matchingHighlight = pillar.keyHighlights.find((h) =>
          h.toLowerCase().includes(q)
        );
        if (matchingHighlight) {
          results.push({
            pillarIndex: index,
            pillar,
            matchType: 'Initiative',
            snippet: matchingHighlight,
          });
        }
      }
    });

    return results;
  }, [query, pillars]);

  if (!isOpen) return null;

  return (
    <div
      id="search-results-modal"
      role="dialog" aria-modal="true" aria-labelledby="search-results-title"
      onKeyDown={event => { if (event.key === "Escape") onClose(); }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="search-dialog-panel w-full max-w-xl bg-neutral-900 border border-white/20 rounded-2xl shadow-2xl p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span id="search-results-title" className="font-bold text-sm">{getCMSCopy("copy.SearchModal.ddb2ca828a96", "Search Results ")}{query ? `for "${query}"` : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 min-w-11 min-h-11 text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
          >{getCMSCopy("copy.SearchModal.52f878edb34f", "Esc")}</button>
        </div>

        <label className="block mt-4">
          <span className="sr-only">{getCMSCopy("copy.SearchModal.9d87aeddb779", "Search the foundation")}</span>
          <input autoFocus type="search" inputMode="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder={getCMSCopy("copy.SearchModal.62ebafd01583", "Search activities, projects and stories")} className="w-full min-h-12 rounded-xl border border-white/20 bg-neutral-950 px-4 py-3 text-base text-white outline-none focus:border-white/60" />
        </label>
        <div className="search-dialog-results mt-3 max-h-80 overflow-y-auto space-y-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((res, i) => (
              <button type="button"
                key={i}
                onClick={() => {
                  onSelectPillar(res.pillarIndex);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 hover:border-white/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white"
                      style={{ backgroundColor: res.pillar.accentA }}
                    >
                      {res.pillar.label}
                    </span>
                    <span className="text-xs text-neutral-400">{getCMSCopy("copy.SearchModal.31624ae223af", "Matched ")}{res.matchType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1 group-hover:text-amber-200 transition-colors">
                    {res.snippet}
                  </p>
                </div>
                <div className="text-neutral-400 group-hover:text-white pl-2">
                  →
                </div>
              </button>
            ))
          ) : query ? (
            <div className="text-center py-8 text-neutral-400 text-sm">{getCMSCopy("copy.SearchModal.27bffbe80ece", "No direct matches found for \"")}{query}{getCMSCopy("copy.SearchModal.b9500117371b", "\". Try searching \"blood\", \"education\", \"trees\", or \"health city\".")}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 py-2">
              {pillars.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPillar(idx);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left border border-neutral-700 hover:border-white/30 transition-all flex items-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: p.accentA }}
                  />
                  <span className="text-xs font-bold uppercase text-white">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
