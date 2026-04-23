import type { AppSnapshot, LogStream } from '@shared/types';
import { LogsViewer } from '../components/LogsViewer';

interface LogsPageProps {
  snapshot: AppSnapshot;
  logsProjectId?: string;
  streamFilter: LogStream | 'all';
  autoScroll: boolean;
  onProjectChange: (projectId?: string) => void;
  onStreamFilterChange: (value: LogStream | 'all') => void;
  onAutoScrollChange: (value: boolean) => void;
  onClearLogs: (projectId: string) => void;
}

export function LogsPage({
  snapshot,
  logsProjectId,
  streamFilter,
  autoScroll,
  onProjectChange,
  onStreamFilterChange,
  onAutoScrollChange,
  onClearLogs,
}: LogsPageProps) {
  const project = snapshot.projects.find((entry) => entry.id === logsProjectId) ?? snapshot.projects[0];
  const runtime = snapshot.runtimeStates.find((entry) => entry.projectId === project?.id);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden pr-2">
      <div className="flex items-center gap-3">
        <select
          value={project?.id ?? ''}
          onChange={(event) => onProjectChange(event.target.value || undefined)}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:outline-none"
        >
          {snapshot.projects.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </div>
      <LogsViewer
        project={project}
        logs={runtime?.logs ?? []}
        streamFilter={streamFilter}
        autoScroll={autoScroll}
        onStreamFilterChange={onStreamFilterChange}
        onAutoScrollChange={onAutoScrollChange}
        onClearLogs={() => project && onClearLogs(project.id)}
      />
    </div>
  );
}

