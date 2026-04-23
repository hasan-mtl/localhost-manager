import type { ProjectStatus } from '@shared/types';
import { statusLabel } from '../lib/format';

interface StatusBadgeProps {
  status: ProjectStatus;
}

const palette: Record<ProjectStatus, string> = {
  running: 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300',
  starting: 'border-sky-500/20 bg-sky-500/12 text-sky-300',
  stopped: 'border-slate-400/10 bg-slate-400/8 text-slate-300',
  error: 'border-red-500/20 bg-red-500/12 text-red-300',
  external: 'border-violet-500/20 bg-violet-500/12 text-violet-300',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${palette[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

