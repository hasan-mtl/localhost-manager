import { FolderPlus, Radar } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onAddProject: () => void;
  onScanPorts: () => void;
}

export function EmptyState({ title, description, onAddProject, onScanPorts }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/12 text-blue-300">
        <Radar className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <FolderPlus className="h-4 w-4" />
          Add Project
        </button>
        <button
          type="button"
          onClick={onScanPorts}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06]"
        >
          Scan Ports
        </button>
      </div>
    </div>
  );
}

