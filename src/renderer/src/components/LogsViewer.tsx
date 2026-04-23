import { useEffect, useRef } from 'react';
import type { LogEntry, LogStream, SavedProject } from '@shared/types';

interface LogsViewerProps {
  project?: SavedProject;
  logs: LogEntry[];
  streamFilter: LogStream | 'all';
  autoScroll: boolean;
  onStreamFilterChange: (value: LogStream | 'all') => void;
  onAutoScrollChange: (value: boolean) => void;
  onClearLogs: () => void;
}

const streamStyles: Record<LogStream, string> = {
  stdout: 'text-slate-200',
  stderr: 'text-red-200',
  system: 'text-sky-200',
};

export function LogsViewer({
  project,
  logs,
  streamFilter,
  autoScroll,
  onStreamFilterChange,
  onAutoScrollChange,
  onClearLogs,
}: LogsViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibleLogs = streamFilter === 'all' ? logs : logs.filter((log) => log.stream === streamFilter);

  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [autoScroll, visibleLogs]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#08121f]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{project?.name ?? 'Select a project'}</h3>
          <p className="text-sm text-slate-500">
            Managed stdout, stderr, and system messages stay attached to the project.
            {visibleLogs.length > 0 ? ` Showing ${visibleLogs.length} lines.` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={streamFilter}
            onChange={(event) => onStreamFilterChange(event.target.value as LogStream | 'all')}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="all">All streams</option>
            <option value="stdout">Stdout</option>
            <option value="stderr">Stderr</option>
            <option value="system">System</option>
          </select>
          <button
            type="button"
            onClick={() => onAutoScrollChange(!autoScroll)}
            className={`rounded-2xl border px-3 py-2 text-sm ${
              autoScroll ? 'border-blue-400/20 bg-blue-500/12 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-300'
            }`}
          >
            Auto-scroll {autoScroll ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            disabled={!project}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="flex-1 overflow-auto px-5 py-4 font-mono text-sm">
        {visibleLogs.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No logs available for this project.</div>
        )}
        <div className="space-y-2">
          {visibleLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-[96px_72px_minmax(0,1fr)] gap-4 rounded-xl px-3 py-2 hover:bg-white/[0.03]">
              <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{log.stream}</span>
              <span className={`whitespace-pre-wrap break-words ${streamStyles[log.stream]}`}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
