import type { QuickFilter } from '@shared/types';
import { quickFilterOptions } from '../lib/constants';

interface QuickFiltersProps {
  counts: Record<QuickFilter, number>;
  current: QuickFilter;
  onChange: (nextFilter: QuickFilter) => void;
}

export function QuickFilters({ counts, current, onChange }: QuickFiltersProps) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Quick Filters</p>
      {quickFilterOptions.map((option) => {
        const active = option.key === current;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              active
                ? 'border-blue-400/30 bg-blue-500/14 text-white'
                : 'border-white/6 bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-slate-300">{counts[option.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

