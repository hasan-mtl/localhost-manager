import type { PortRecord } from '@shared/types';
import { ExternalLink, SquareTerminal, StopCircle } from 'lucide-react';
import { formatClockTime } from '../lib/format';

interface ActivePortsTableProps {
  ports: PortRecord[];
  onOpenLocalhost: (portId: string) => void;
  onStopPort: (port: PortRecord) => void;
}

export function ActivePortsTable({ ports, onOpenLocalhost, onStopPort }: ActivePortsTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
      <div className="grid grid-cols-[70px_minmax(0,1.4fr)_90px_120px_110px_180px] gap-4 border-b border-white/8 px-5 py-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        <span>Port</span>
        <span>Process</span>
        <span>PID</span>
        <span>Status</span>
        <span>Started</span>
        <span>Action</span>
      </div>
      {ports.map((port) => (
        <div
          key={port.id}
          className="grid grid-cols-[70px_minmax(0,1.4fr)_90px_120px_110px_180px] gap-4 border-b border-white/6 px-5 py-4 last:border-b-0"
        >
          <div className="flex items-center text-lg font-semibold text-blue-300">{port.port}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{port.processName ?? port.command ?? 'Unknown process'}</p>
            <p className="truncate text-xs text-slate-500">{port.command ?? port.cwd ?? 'Local listener'}</p>
          </div>
          <div className="flex items-center text-sm text-slate-300">{port.pid ?? '—'}</div>
          <div className="flex items-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                port.source === 'managed'
                  ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
                  : 'border-violet-500/20 bg-violet-500/12 text-violet-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {port.source === 'managed' ? 'Managed' : 'External'}
            </span>
          </div>
          <div className="flex items-center text-sm text-slate-300">{formatClockTime(port.startedAt)}</div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenLocalhost(port.id)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>
            <button
              type="button"
              onClick={() => onStopPort(port)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-100 hover:bg-red-500/14 hover:text-red-100"
            >
              <StopCircle className="h-4 w-4" />
              Stop
            </button>
          </div>
        </div>
      ))}
      {ports.length === 0 && (
        <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-slate-500">
          <SquareTerminal className="h-4 w-4" />
          No active listening ports match the current view.
        </div>
      )}
    </div>
  );
}

