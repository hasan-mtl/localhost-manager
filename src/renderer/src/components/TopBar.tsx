import type { RefObject } from 'react';
import { LoaderCircle, Plus, RefreshCcw } from 'lucide-react';
import { formatRelativeFreshness } from '../lib/format';
import { SearchBar } from './SearchBar';

interface TopBarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onScanPorts: () => void;
  onAddProject: () => void;
  searchRef: RefObject<HTMLInputElement>;
  refreshing: boolean;
  generatedAt?: string;
}

export function TopBar({
  title,
  searchQuery,
  onSearchChange,
  onScanPorts,
  onAddProject,
  searchRef,
  refreshing,
  generatedAt,
}: TopBarProps) {
  return (
    <header className="border-b border-white/8 px-8 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[42px] font-semibold tracking-[-0.04em] text-white">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>See every local project, port, and localhost URL in one view.</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 md:block" />
            <span>{formatRelativeFreshness(generatedAt)}</span>
            {refreshing && (
              <>
                <span className="hidden h-1 w-1 rounded-full bg-slate-600 md:block" />
                <span className="inline-flex items-center gap-2 text-blue-300">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Refreshing
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 xl:max-w-3xl">
          <SearchBar ref={searchRef} value={searchQuery} onChange={onSearchChange} />
          <button
            type="button"
            onClick={onScanPorts}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Scan Ports
          </button>
          <button
            type="button"
            onClick={onAddProject}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </div>
      </div>
    </header>
  );
}
