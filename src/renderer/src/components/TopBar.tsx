import type { RefObject } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface TopBarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onScanPorts: () => void;
  onAddProject: () => void;
  searchRef: RefObject<HTMLInputElement>;
}

export function TopBar({
  title,
  searchQuery,
  onSearchChange,
  onScanPorts,
  onAddProject,
  searchRef,
}: TopBarProps) {
  return (
    <header className="border-b border-white/8 px-8 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[42px] font-semibold tracking-[-0.04em] text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">See every local project, port, and localhost URL in one view.</p>
        </div>
        <div className="flex flex-1 items-center gap-3 xl:max-w-3xl">
          <SearchBar ref={searchRef} value={searchQuery} onChange={onSearchChange} />
          <button
            type="button"
            onClick={onScanPorts}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <RefreshCcw className="h-4 w-4" />
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

