import type { AppSnapshot, PortRecord, ProjectRuntimeState, QuickFilter, SavedProject } from '@shared/types';
import { ProjectTable } from '../components/ProjectTable';
import { SelectedProjectPanel } from '../components/SelectedProjectPanel';
import { buildRuntimeMap, filterProjects } from '../lib/selectors';

interface ProjectsPageProps {
  snapshot: AppSnapshot;
  searchQuery: string;
  quickFilter: QuickFilter;
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onToggleProject: (project: SavedProject, runtime?: ProjectRuntimeState) => void;
  onOpenLocalhost: (project: SavedProject) => void;
  onEditProject: (project: SavedProject) => void;
  onRemoveProject: (project: SavedProject) => void;
  onStopSelectedProject: (project: SavedProject, runtime?: ProjectRuntimeState, matchedPort?: PortRecord) => void;
  onRestartProject: (projectId: string) => void;
  onOpenFolder: (targetPath: string) => void;
  onOpenVSCode: (targetPath: string) => void;
}

export function ProjectsPage({
  snapshot,
  searchQuery,
  quickFilter,
  selectedProjectId,
  onSelectProject,
  onToggleProject,
  onOpenLocalhost,
  onEditProject,
  onRemoveProject,
  onStopSelectedProject,
  onRestartProject,
  onOpenFolder,
  onOpenVSCode,
}: ProjectsPageProps) {
  const runtimeMap = buildRuntimeMap(snapshot.runtimeStates);
  const filteredProjects = filterProjects(snapshot.projects, runtimeMap, searchQuery, quickFilter);
  const selectedProject = snapshot.projects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0];
  const selectedRuntime = selectedProject ? runtimeMap[selectedProject.id] : undefined;
  const selectedPort = selectedProject
    ? snapshot.ports.find((port) => port.matchedProjectId === selectedProject.id)
    : undefined;

  return (
    <div className="grid h-full gap-5 xl:grid-cols-[minmax(0,1.55fr)_390px]">
      <div className="min-h-0 overflow-auto pr-2">
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
  );
}

