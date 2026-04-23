import type { ProjectRuntimeState, SavedProject } from '@shared/types';
import { Pencil, Power, Trash2 } from 'lucide-react';
import { formatPathSnippet, stackLabel } from '../lib/format';
import { StatusBadge } from './StatusBadge';
import { ToggleAction } from './ToggleAction';

interface ProjectTableProps {
  projects: SavedProject[];
  runtimeMap: Record<string, ProjectRuntimeState>;
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onToggleProject: (project: SavedProject, runtime?: ProjectRuntimeState) => void;
  onOpenLocalhost: (project: SavedProject) => void;
  onEditProject?: (project: SavedProject) => void;
  onRemoveProject?: (project: SavedProject) => void;
}

const stackAccent: Record<SavedProject['stack'], string> = {
  nextjs: 'bg-white/10 text-white',
  react: 'bg-cyan-500/16 text-cyan-200',
  vite: 'bg-violet-500/16 text-violet-200',
  node: 'bg-emerald-500/16 text-emerald-200',
  laravel: 'bg-red-500/16 text-red-200',
  custom: 'bg-amber-500/16 text-amber-200',
  unknown: 'bg-slate-500/16 text-slate-200',
};

function stackMark(stack: SavedProject['stack']): string {
  switch (stack) {
    case 'nextjs':
      return 'N';
    case 'react':
      return 'R';
    case 'vite':
      return 'V';
    case 'node':
      return 'JS';
    case 'laravel':
      return 'L';
    case 'custom':
      return 'C';
    default:
      return '?';
  }
}

export function ProjectTable({
  projects,
  runtimeMap,
  selectedProjectId,
  onSelectProject,
  onToggleProject,
  onOpenLocalhost,
  onEditProject,
  onRemoveProject,
}: ProjectTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
      <div className="grid grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.35fr)_120px_70px_210px] gap-4 border-b border-white/8 px-5 py-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        <span>Project</span>
        <span>Stack</span>
        <span>Path</span>
        <span>Status</span>
        <span>Port</span>
        <span>Actions</span>
      </div>
      {projects.map((project) => {
        const runtime = runtimeMap[project.id];
        const isActive = project.id === selectedProjectId;
        const isRunning = runtime?.status === 'running' || runtime?.status === 'starting' || runtime?.status === 'external';

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(project.id)}
            onDoubleClick={() => onOpenLocalhost(project)}
            className={`grid w-full grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.35fr)_120px_70px_210px] gap-4 border-b border-white/6 px-5 py-4 text-left transition last:border-b-0 ${
              isActive ? 'bg-blue-600/10' : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${stackAccent[project.stack]}`}>
                {stackMark(project.stack)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                <p className="truncate text-xs text-slate-500">{project.startCommand || 'No start command set'}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-slate-300">{stackLabel(project.stack)}</div>
            <div className="flex items-center truncate text-sm text-slate-400">{formatPathSnippet(project.rootPath)}</div>
            <div className="flex items-center">
              <StatusBadge status={runtime?.status ?? 'stopped'} />
            </div>
            <div className="flex items-center text-sm font-medium text-slate-200">
              {runtime?.port ?? project.preferredPort ?? '—'}
            </div>
            <div className="flex items-center justify-end gap-2">
              <ToggleAction enabled={isRunning} onClick={() => onToggleProject(project, runtime)} />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLocalhost(project);
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/[0.08]"
              >
                Open Localhost
              </button>
              {onEditProject && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditProject(project);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:bg-white/[0.08]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onRemoveProject && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveProject(project);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:bg-red-500/14 hover:text-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </button>
        );
      })}
      {projects.length === 0 && (
        <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-slate-500">
          <Power className="h-4 w-4" />
          No projects match the current filters.
        </div>
      )}
    </div>
  );
}
