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
          <div className="flex min-w-0 items-center">
            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  port.reachable
                    ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
                    : 'border-violet-500/20 bg-violet-500/12 text-violet-300'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {port.reachable ? `Reachable${port.latencyMs ? ` • ${port.latencyMs}ms` : ''}` : 'Listening'}
              </span>
              <p className="mt-1 text-xs text-slate-500">{port.source === 'managed' ? 'Managed by app' : 'External process'}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-slate-300">{formatClockTime(port.startedAt)}</div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenLocalhost(port.id)}
              disabled={!port.developerLike || !port.reachable}
              title={
                !port.developerLike
                  ? 'Only development/web listeners can be opened from Localhost Manager.'
                  : !port.reachable
                    ? 'This listener does not currently look like a browser-openable web app.'
                    : undefined
              }
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium ${
                port.developerLike && port.reachable
                  ? 'border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]'
                  : 'cursor-not-allowed border-white/6 bg-white/[0.02] text-slate-500'
              }`}
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>
            <button
              type="button"
              onClick={() => onStopPort(port)}
              disabled={!port.canStop}
              title={port.stopWarning}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium ${
                port.canStop
                  ? 'border-white/10 bg-white/[0.03] text-slate-100 hover:bg-red-500/14 hover:text-red-100'
                  : 'cursor-not-allowed border-white/6 bg-white/[0.02] text-slate-500'
              }`}
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
