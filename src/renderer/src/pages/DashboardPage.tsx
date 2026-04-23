import type { AppSnapshot, PortRecord, ProjectRuntimeState, QuickFilter, SavedProject } from '@shared/types';
import { ActivePortsTable } from '../components/ActivePortsTable';
import { EmptyState } from '../components/EmptyState';
import { ProjectTable } from '../components/ProjectTable';
import { SelectedProjectPanel } from '../components/SelectedProjectPanel';
import { SummaryCards } from '../components/SummaryCards';
import { buildRuntimeMap, filterPorts, filterProjects } from '../lib/selectors';

interface DashboardPageProps {
  snapshot: AppSnapshot;
  searchQuery: string;
  quickFilter: QuickFilter;
  selectedProjectId?: string;
  onAddProject: () => void;
  onScanPorts: () => void;
  onSelectProject: (projectId: string) => void;
  onToggleProject: (project: SavedProject, runtime?: ProjectRuntimeState) => void;
  onOpenLocalhost: (project: SavedProject) => void;
  onEditProject: (project: SavedProject) => void;
  onRemoveProject: (project: SavedProject) => void;
  onStopSelectedProject: (project: SavedProject, runtime?: ProjectRuntimeState, matchedPort?: PortRecord) => void;
  onRestartProject: (projectId: string) => void;
  onOpenFolder: (targetPath: string) => void;
  onOpenVSCode: (targetPath: string) => void;
  onOpenPortLocalhost: (portId: string) => void;
  onStopPort: (port: PortRecord) => void;
  counts: Record<QuickFilter, number>;
}

export function DashboardPage({
  snapshot,
  searchQuery,
  quickFilter,
  selectedProjectId,
  onAddProject,
  onScanPorts,
  onSelectProject,
  onToggleProject,
  onOpenLocalhost,
  onEditProject,
  onRemoveProject,
  onStopSelectedProject,
  onRestartProject,
  onOpenFolder,
  onOpenVSCode,
  onOpenPortLocalhost,
  onStopPort,
  counts,
}: DashboardPageProps) {
  const runtimeMap = buildRuntimeMap(snapshot.runtimeStates);
  const filteredProjects = filterProjects(snapshot.projects, runtimeMap, searchQuery, quickFilter);
  const filteredPorts = filterPorts(snapshot.ports, searchQuery, quickFilter, 'all').slice(0, 6);
  const selectedProject = snapshot.projects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0];
  const selectedRuntime = selectedProject ? runtimeMap[selectedProject.id] : undefined;
  const selectedPort = selectedProject
    ? snapshot.ports.find((port) => port.matchedProjectId === selectedProject.id)
    : undefined;

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto pr-2">
      <SummaryCards snapshot={snapshot} counts={counts} />

      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_390px]">
        <div className="flex min-h-0 flex-col gap-5">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Projects</h2>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                {filteredProjects.length} visible
              </span>
            </div>
            {snapshot.projects.length === 0 ? (
              <EmptyState
                title="Manage every localhost project from one desktop surface"
                description="Add a project folder to detect its stack, start command, and preferred port. Localhost Manager is already scanning machine ports in the background."
                onAddProject={onAddProject}
                onScanPorts={onScanPorts}
              />
            ) : (
              <ProjectTable
                projects={filteredProjects}
                runtimeMap={runtimeMap}
                selectedProjectId={selectedProject?.id}
                onSelectProject={onSelectProject}
                onToggleProject={onToggleProject}
                onOpenLocalhost={onOpenLocalhost}
                onEditProject={onEditProject}
                onRemoveProject={onRemoveProject}
              />
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Active Ports</h2>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                {filteredPorts.length} visible
              </span>
            </div>
            <ActivePortsTable ports={filteredPorts} onOpenLocalhost={onOpenPortLocalhost} onStopPort={onStopPort} />
          </section>
        </div>

        <SelectedProjectPanel
          project={selectedProject}
          runtime={selectedRuntime}
          matchedPort={selectedPort}
          onOpenLocalhost={(projectId) => {
            const project = snapshot.projects.find((entry) => entry.id === projectId);
            if (project) {
              onOpenLocalhost(project);
            }
          }}
          onStop={onStopSelectedProject}
          onRestart={onRestartProject}
          onOpenFolder={onOpenFolder}
          onOpenVSCode={onOpenVSCode}
        />
      </div>
    </div>
  );
}
