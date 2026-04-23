import type { PortRecord, ProjectRuntimeState, SavedProject } from '@shared/types';
import { ExternalLink, FolderOpen, RotateCcw, SquareTerminal, StopCircle } from 'lucide-react';
import { formatDateTime, formatUptime, stackLabel } from '../lib/format';
import { StatusBadge } from './StatusBadge';

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <div className="h-28 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]" />;
  }

  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-cyan-500/6 to-transparent p-3">
      <svg viewBox="0 0 100 100" className="h-24 w-full">
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#2d73ff" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#sparkline-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

interface SelectedProjectPanelProps {
  project?: SavedProject;
  runtime?: ProjectRuntimeState;
  matchedPort?: PortRecord;
  onOpenLocalhost: (projectId: string) => void;
  onStop: (project: SavedProject, runtime?: ProjectRuntimeState, matchedPort?: PortRecord) => void;
  onRestart: (projectId: string) => void;
  onOpenFolder: (targetPath: string) => void;
  onOpenVSCode: (targetPath: string) => void;
}

export function SelectedProjectPanel({
  project,
  runtime,
  matchedPort,
  onOpenLocalhost,
  onStop,
  onRestart,
  onOpenFolder,
  onOpenVSCode,
}: SelectedProjectPanelProps) {
  if (!project) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Selected Project</p>
        <div className="mt-10 text-center">
          <h3 className="text-xl font-semibold text-white">Choose a project</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Select a saved project to inspect its runtime health, logs, localhost URL, and folder actions.
          </p>
        </div>
      </div>
    );
  }

  const runtimeStatus = runtime?.status ?? 'stopped';
  const runtimePort = runtime?.port ?? matchedPort?.port ?? project.preferredPort;
  const runtimeUrl = runtime?.url ?? matchedPort?.detectedUrl ?? project.preferredUrl;
  const canStop = ['running', 'starting', 'external'].includes(runtimeStatus);

  return (
    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Selected Project</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{project.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={runtimeStatus} />
            {runtimeUrl && <span className="text-sm text-blue-300">{runtimeUrl}</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 border-t border-white/8 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Local Directory</span>
          <span className="max-w-[60%] truncate text-right text-slate-200">{project.rootPath}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Detected Stack</span>
          <span className="text-slate-200">{stackLabel(project.stack)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Last Started</span>
          <span className="text-slate-200">{formatDateTime(runtime?.startedAt ?? matchedPort?.startedAt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Uptime</span>
          <span className="text-slate-200">{formatUptime(runtime?.uptimeSeconds)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Port</span>
          <span className="text-slate-200">{runtimePort ?? '—'}</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Health Activity</p>
          <p className="text-xs text-slate-500">Recent latency samples</p>
        </div>
        <Sparkline values={runtime?.healthHistory ?? []} />
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => onOpenLocalhost(project.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <ExternalLink className="h-4 w-4" />
          Open Localhost
        </button>
        <button
          type="button"
          disabled={!canStop}
          onClick={() => onStop(project, runtime, matchedPort)}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white ${
            canStop ? 'bg-red-600 hover:bg-red-500' : 'cursor-not-allowed bg-red-900/30 text-red-200/60'
          }`}
        >
          <StopCircle className="h-4 w-4" />
          Stop Server
        </button>
        <button
          type="button"
          disabled={!runtime}
          onClick={() => onRestart(project.id)}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold ${
            runtime ? 'bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]' : 'cursor-not-allowed bg-white/[0.02] text-slate-500'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
        <button
          type="button"
          onClick={() => onOpenFolder(project.rootPath)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
        >
          <FolderOpen className="h-4 w-4" />
          Open Folder
        </button>
        <button
          type="button"
          onClick={() => onOpenVSCode(project.rootPath)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
        >
          <SquareTerminal className="h-4 w-4" />
          Open in VS Code
        </button>
      </div>
    </div>
  );
}

