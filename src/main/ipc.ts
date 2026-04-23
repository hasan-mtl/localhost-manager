import { dialog, ipcMain } from 'electron';
import { cpus, freemem, loadavg, totalmem } from 'node:os';
import { execa } from 'execa';
import open, { openApp } from 'open';
import type { AppSnapshot, PortRecord, ProjectRuntimeState, SavedProject } from '../shared/types';
import { detectProject } from './projectDetector';
import { HealthMonitor } from './healthMonitor';
import { Notifications } from './notifications';
import { PortScanner } from './portScanner';
import { ProcessManager } from './processManager';
import { ProjectStore } from './projectStore';
import { getProjectUrlCandidates } from './urlResolver';

interface AppServices {
  healthMonitor: HealthMonitor;
  notifications: Notifications;
  portScanner: PortScanner;
  processManager: ProcessManager;
  store: ProjectStore;
}

function wrapResponse<T>(promiseFactory: () => Promise<T>) {
  return async () => {
    try {
      const data = await promiseFactory();
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      };
    }
  };
}

function computeSystemMetrics(runtimeStates: ProjectRuntimeState[]) {
  const load = loadavg();
  const cpuCount = Math.max(1, cpus().length);
  const cpuLoadPercent = Math.min(100, Math.round((load[0] / cpuCount) * 100));
  const memoryPercent = Math.round(((totalmem() - freemem()) / totalmem()) * 100);

  return {
    cpuLoadPercent,
    memoryPercent,
    loadAverage: load,
    activeManagedProjects: runtimeStates.filter((runtime) => ['running', 'starting'].includes(runtime.status)).length,
  };
}

async function buildSnapshot(services: AppServices): Promise<AppSnapshot> {
  const projects = services.store.getProjects();
  const settings = services.store.getSettings();
  const managedStates = services.processManager.getManagedStates();
  const scannedPorts = await services.portScanner.scanPorts(projects, managedStates, settings);
  const ports = await services.healthMonitor.evaluatePorts(scannedPorts);

  const runtimeStates = await Promise.all(
    projects.map(async (project) => {
      const managed = services.processManager.getRuntimeState(project.id);
      const matchedPort = ports.find((port) => port.matchedProjectId === project.id);
      const baseRuntime: ProjectRuntimeState =
        managed ??
        ({
          projectId: project.id,
          status: matchedPort ? 'external' : 'stopped',
          port: matchedPort?.port ?? project.preferredPort,
          url: matchedPort?.detectedUrl ?? project.preferredUrl,
          startedAt: matchedPort?.startedAt,
          healthHistory: [],
          logs: services.store.getProjectLogs(project.id),
        } satisfies ProjectRuntimeState);
      return services.healthMonitor.evaluateProjectRuntime(project, baseRuntime, matchedPort);
    }),
  );

  const selectedProjectId = services.store.getSelectedProjectId() ?? projects[0]?.id;
  if (selectedProjectId && !services.store.getSelectedProjectId()) {
    services.store.setSelectedProjectId(selectedProjectId);
  }

  return {
    projects,
    runtimeStates,
    ports,
    settings,
    selectedProjectId,
    system: computeSystemMetrics(runtimeStates),
    generatedAt: new Date().toISOString(),
  };
}

function getProjectOrThrow(store: ProjectStore, projectId: string): SavedProject {
  const project = store.getProject(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }
  return project;
}

async function openResolvedProjectUrl(
  services: AppServices,
  project: SavedProject,
  runtime: ProjectRuntimeState,
  matchedPort?: PortRecord,
): Promise<string> {
  let candidateUrls = getProjectUrlCandidates(project, runtime, matchedPort);
  if (candidateUrls.length === 0) {
    throw new Error('No localhost URL could be resolved for this project.');
  }

  let reachable = await services.healthMonitor.waitForReachableUrl(candidateUrls, 20000, 700);
  if (!reachable) {
    const refreshedSnapshot = await buildSnapshot(services);
    const refreshedRuntime = refreshedSnapshot.runtimeStates.find((entry) => entry.projectId === project.id) ?? runtime;
    const refreshedPort = refreshedSnapshot.ports.find((entry) => entry.matchedProjectId === project.id) ?? matchedPort;
    candidateUrls = getProjectUrlCandidates(project, refreshedRuntime, refreshedPort);
    reachable = await services.healthMonitor.waitForReachableUrl(candidateUrls, 12000, 700);
  }

  if (!reachable) {
    throw new Error('The project started, but no reachable localhost URL could be confirmed. Check the logs or update the preferred URL.');
  }

  const targetUrl = reachable;
  await open(targetUrl, { wait: false });
  services.processManager.appendSystemLog(project.id, `Opened localhost at ${targetUrl}`);
  return targetUrl;
}

async function openInVSCode(targetPath: string): Promise<void> {
  const cliAttempt = await execa('code', [targetPath], { reject: false });
  if (cliAttempt.exitCode === 0) {
    return;
  }

  try {
    await openApp('Visual Studio Code', {
      wait: false,
      arguments: [targetPath],
    });
    return;
  } catch {
    try {
      await openApp('Code', {
        wait: false,
        arguments: [targetPath],
      });
      return;
    } catch {
      throw new Error('VS Code could not be found. Install the "code" CLI or the Visual Studio Code app.');
    }
  }
}

export function registerIpcHandlers(services: AppServices): void {
  ipcMain.handle(
    'app:get-snapshot',
    async (_event, forceRefresh?: boolean) => {
      void forceRefresh;
      return wrapResponse(() => buildSnapshot(services))();
    },
  );

  ipcMain.handle(
    'project:pick-folder',
    wrapResponse(async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });

      return result.canceled ? null : result.filePaths[0] ?? null;
    }),
  );

  ipcMain.handle(
    'project:detect',
    async (_event, folderPath: string) => wrapResponse(() => detectProject(folderPath))(),
  );

  ipcMain.handle(
    'project:create',
    async (_event, draft: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>) =>
      wrapResponse(async () => {
        const saved = services.store.createProject(draft);
        services.store.setSelectedProjectId(saved.id);
        return saved;
      })(),
  );

  ipcMain.handle(
    'project:update',
    async (_event, project: SavedProject) =>
      wrapResponse(async () => {
        const saved = services.store.upsertProject(project);
        return saved;
      })(),
  );

  ipcMain.handle(
    'project:remove',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        await services.processManager.stopProject(projectId).catch(() => undefined);
        services.processManager.forgetProject(projectId);
        services.store.removeProject(projectId);
        return true;
      })(),
  );

  ipcMain.handle(
    'project:start',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        const project = getProjectOrThrow(services.store, projectId);
        const runtime = await services.processManager.startProject(project);
        services.processManager.appendSystemLog(projectId, 'Start requested from the dashboard.');
        if (services.store.getSettings().openBrowserOnStart) {
          const snapshot = await buildSnapshot(services);
          const matchedPort = snapshot.ports.find((port) => port.matchedProjectId === project.id);
          await openResolvedProjectUrl(services, project, runtime, matchedPort).catch(() => undefined);
        }
        return runtime;
      })(),
  );

  ipcMain.handle(
    'project:stop',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        services.processManager.appendSystemLog(projectId, 'Stop requested from the dashboard.');
        return services.processManager.stopProject(projectId);
      })(),
  );

  ipcMain.handle(
    'project:restart',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        const project = getProjectOrThrow(services.store, projectId);
        services.processManager.appendSystemLog(projectId, 'Restart requested from the dashboard.');
        return services.processManager.restartProject(project);
      })(),
  );

  ipcMain.handle(
    'project:open-localhost',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        const project = getProjectOrThrow(services.store, projectId);
        let snapshot = await buildSnapshot(services);
        let runtime = snapshot.runtimeStates.find((entry) => entry.projectId === project.id);
        let matchedPort = snapshot.ports.find((port) => port.matchedProjectId === project.id);

        if (!runtime || runtime.status === 'stopped' || runtime.status === 'error') {
          await services.processManager.startProject(project);
          snapshot = await buildSnapshot(services);
          runtime = snapshot.runtimeStates.find((entry) => entry.projectId === project.id);
          matchedPort = snapshot.ports.find((port) => port.matchedProjectId === project.id);
        }

        if (!runtime) {
          throw new Error('Runtime state could not be resolved.');
        }

        return openResolvedProjectUrl(services, project, runtime, matchedPort);
      })(),
  );

  ipcMain.handle(
    'ports:open-localhost',
    async (_event, portId: string) =>
      wrapResponse(async () => {
        const snapshot = await buildSnapshot(services);
        const port = snapshot.ports.find((entry) => entry.id === portId);
        if (!port) {
          throw new Error('Port could not be found.');
        }

        if (!port.developerLike) {
          throw new Error('This listener does not look like a local development web service, so Localhost Manager will not open it in the browser.');
        }

        if (!port.reachable || !port.detectedUrl) {
          throw new Error('This listening port does not currently look like a browser-openable localhost web app.');
        }

        const targetUrl = port.detectedUrl ?? `http://127.0.0.1:${port.port}`;
        await open(targetUrl, { wait: false });
        return targetUrl;
      })(),
  );

  ipcMain.handle(
    'ports:scan',
    wrapResponse(() => buildSnapshot(services)),
  );

  ipcMain.handle(
    'system:open-folder',
    async (_event, targetPath: string) =>
      wrapResponse(async () => {
        await open(targetPath, { wait: false });
        return true;
      })(),
  );

  ipcMain.handle(
    'system:open-vscode',
    async (_event, targetPath: string) =>
      wrapResponse(async () => {
        await openInVSCode(targetPath);
        return true;
      })(),
  );

  ipcMain.handle(
    'ports:stop-external',
    async (_event, portId: string) =>
      wrapResponse(async () => {
        const snapshot = await buildSnapshot(services);
        const port = snapshot.ports.find((entry) => entry.id === portId);
        if (!port?.pid) {
          throw new Error('This port does not have a stoppable process.');
        }

        if (!port.canStop) {
          throw new Error(port.stopWarning ?? 'This process cannot be stopped from Localhost Manager.');
        }

        if (services.processManager.isManagedPid(port.pid) && port.matchedProjectId) {
          await services.processManager.stopProject(port.matchedProjectId);
          return true;
        }

        await services.processManager.stopExternalPid(port.pid);
        return true;
      })(),
  );

  ipcMain.handle(
    'logs:clear',
    async (_event, projectId: string) =>
      wrapResponse(async () => {
        services.processManager.clearLogs(projectId);
        return true;
      })(),
  );

  ipcMain.handle(
    'settings:update',
    async (_event, settings) =>
      wrapResponse(async () => services.store.updateSettings(settings))(),
  );

  ipcMain.handle(
    'project:set-selected',
    async (_event, projectId?: string) =>
      wrapResponse(async () => {
        services.store.setSelectedProjectId(projectId);
        return true;
      })(),
  );
}
