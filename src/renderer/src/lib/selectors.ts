import type {
  PortRecord,
  PortsFilter,
  ProjectRuntimeState,
  QuickFilter,
  SavedProject,
} from '@shared/types';

export function buildRuntimeMap(runtimeStates: ProjectRuntimeState[]): Record<string, ProjectRuntimeState> {
  return Object.fromEntries(runtimeStates.map((runtime) => [runtime.projectId, runtime]));
}

function matchesQuickFilter(status: ProjectRuntimeState['status'], quickFilter: QuickFilter): boolean {
  switch (quickFilter) {
    case 'running':
      return status === 'running' || status === 'starting' || status === 'external';
    case 'stopped':
      return status === 'stopped';
    case 'errors':
      return status === 'error';
    default:
      return true;
  }
}

export function filterProjects(
  projects: SavedProject[],
  runtimeMap: Record<string, ProjectRuntimeState>,
  searchQuery: string,
  quickFilter: QuickFilter,
): SavedProject[] {
  const query = searchQuery.trim().toLowerCase();
  return projects.filter((project) => {
    const runtime = runtimeMap[project.id];
    const matchesSearch =
      !query ||
      [project.name, project.rootPath, project.startCommand, project.stack, String(project.preferredPort ?? '')]
        .join(' ')
        .toLowerCase()
        .includes(query);

    return matchesSearch && matchesQuickFilter(runtime?.status ?? 'stopped', quickFilter);
  });
}

export function filterPorts(
  ports: PortRecord[],
  searchQuery: string,
  quickFilter: QuickFilter,
  portsFilter: PortsFilter,
): PortRecord[] {
  const query = searchQuery.trim().toLowerCase();
  return ports.filter((port) => {
    const matchesSearch =
      !query ||
      [port.port, port.pid, port.processName, port.command, port.cwd, port.detectedUrl]
        .join(' ')
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      quickFilter === 'running'
        ? port.state === 'listening'
        : quickFilter === 'stopped'
          ? port.state === 'stopped'
          : quickFilter === 'errors'
            ? false
            : true;

    const matchesSource =
      portsFilter === 'all' ? true : portsFilter === 'managed' ? port.source === 'managed' : port.source === 'external';

    return matchesSearch && matchesStatus && matchesSource;
  });
}

