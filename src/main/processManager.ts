import { randomUUID } from 'node:crypto';
import { execaCommand } from 'execa';
import kill from 'tree-kill';
import type { LogEntry, ProjectRuntimeState, SavedProject } from '../shared/types';
import { Notifications } from './notifications';
import { LOG_RETENTION_LIMIT, ProjectStore } from './projectStore';
import { extractPortFromText, extractPortFromUrl, extractUrlsFromText, normalizeLocalUrl } from './urlResolver';

type ManagedChildProcess = ReturnType<typeof execaCommand>;

interface ManagedProcessRecord {
  project: SavedProject;
  child?: ManagedChildProcess;
  state: ProjectRuntimeState;
  isStopping: boolean;
}

function cloneRuntimeState(state: ProjectRuntimeState): ProjectRuntimeState {
  return {
    ...state,
    healthHistory: [...state.healthHistory],
    logs: state.logs.map((entry) => ({ ...entry })),
  };
}

function killProcessTree(pid: number, signal: NodeJS.Signals | number): Promise<void> {
  return new Promise((resolve, reject) => {
    kill(pid, signal, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidAlive(pid?: number): boolean {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export class ProcessManager {
  private readonly records = new Map<string, ManagedProcessRecord>();

  constructor(
    private readonly store: ProjectStore,
    private readonly notifications: Notifications,
  ) {}

  private ensureRecord(project: SavedProject): ManagedProcessRecord {
    const existing = this.records.get(project.id);
    if (existing) {
      existing.project = project;
      return existing;
    }

    const nextRecord: ManagedProcessRecord = {
      project,
      isStopping: false,
      state: {
        projectId: project.id,
        status: 'stopped',
        port: project.preferredPort,
        url: project.preferredUrl,
        healthHistory: [],
        logs: this.store.getProjectLogs(project.id),
      },
    };
    this.records.set(project.id, nextRecord);
    return nextRecord;
  }

  private persistLogs(projectId: string, logs: LogEntry[]): void {
    this.store.setProjectLogs(projectId, logs.slice(-LOG_RETENTION_LIMIT));
  }

  appendSystemLog(projectId: string, message: string): void {
    this.appendLog(projectId, 'system', message);
  }

  private appendLog(projectId: string, stream: LogEntry['stream'], message: string): void {
    const record = this.records.get(projectId);
    if (!record) {
      return;
    }

    const logEntry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      stream,
      message,
    };

    record.state.logs = [...record.state.logs, logEntry].slice(-LOG_RETENTION_LIMIT);
    this.persistLogs(projectId, record.state.logs);
  }

  private handleOutput(projectId: string, stream: LogEntry['stream'], chunk: string): void {
    const record = this.records.get(projectId);
    if (!record) {
      return;
    }

    for (const line of chunk.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
      this.appendLog(projectId, stream, line);

      const [detectedUrl] = extractUrlsFromText(line);
      if (detectedUrl) {
        record.state.url = normalizeLocalUrl(detectedUrl);
        record.state.port =
          extractPortFromUrl(record.state.url) ??
          extractPortFromText(line) ??
          record.state.port;
        if (record.state.status === 'starting' || record.state.status === 'error') {
          record.state.status = 'running';
          this.notifications.projectReady(record.project.name, record.state.url);
        }
        continue;
      }

      const detectedPort = extractPortFromText(line);
      if (detectedPort) {
        record.state.port = detectedPort;
        if (record.state.status === 'starting') {
          record.state.status = 'running';
        }
      }
    }
  }

  getManagedStates(): ProjectRuntimeState[] {
    return [...this.records.values()].map((record) => cloneRuntimeState(record.state));
  }

  getRuntimeState(projectId: string): ProjectRuntimeState | undefined {
    const state = this.records.get(projectId)?.state;
    return state ? cloneRuntimeState(state) : undefined;
  }

  hasManagedRuntime(projectId: string): boolean {
    const record = this.records.get(projectId);
    return Boolean(record && ['running', 'starting'].includes(record.state.status));
  }

  isManagedPid(pid?: number): boolean {
    if (!pid) {
      return false;
    }

    return [...this.records.values()].some((record) => record.state.pid === pid);
  }

  async startProject(project: SavedProject): Promise<ProjectRuntimeState> {
    if (!project.startCommand.trim()) {
      throw new Error('This project does not have a start command yet.');
    }

    const record = this.ensureRecord(project);
    if (record.state.pid && isPidAlive(record.state.pid)) {
      return cloneRuntimeState(record.state);
    }

    record.isStopping = false;
    record.state = {
      ...record.state,
      status: 'starting',
      pid: undefined,
      startedAt: new Date().toISOString(),
      uptimeSeconds: 0,
      lastError: undefined,
      port: project.preferredPort ?? record.state.port,
      url: project.preferredUrl ?? record.state.url,
    };
    this.appendLog(project.id, 'system', `Starting project with "${project.startCommand}"`);

    const child = execaCommand(project.startCommand, {
      cwd: project.workingDirectory,
      shell: true,
      preferLocal: true,
      cleanup: false,
      env: {
        ...process.env,
        BROWSER: 'none',
        HOST: '127.0.0.1',
        ...(project.preferredPort ? { PORT: String(project.preferredPort) } : {}),
      },
    });

    record.child = child;
    if (child.pid) {
      record.state.pid = child.pid;
    }

    child.stdout?.on('data', (chunk) => this.handleOutput(project.id, 'stdout', chunk.toString()));
    child.stderr?.on('data', (chunk) => this.handleOutput(project.id, 'stderr', chunk.toString()));

    child.on('exit', (exitCode, signal) => {
      const current = this.records.get(project.id);
      if (!current) {
        return;
      }

      current.child = undefined;
      current.state.pid = undefined;
      current.state.uptimeSeconds = undefined;

      if (current.isStopping || signal === 'SIGTERM' || signal === 'SIGKILL' || exitCode === 0) {
        current.state.status = 'stopped';
        current.state.lastError = undefined;
        this.appendLog(project.id, 'system', 'Project stopped.');
        if (!current.isStopping) {
          this.notifications.projectStopped(project.name);
        }
      } else {
        current.state.status = 'error';
        current.state.lastError = `Process exited with code ${exitCode ?? 'unknown'}.`;
        this.appendLog(project.id, 'system', current.state.lastError);
        this.notifications.projectError(project.name, current.state.lastError);
      }
    });

    child.catch((error) => {
      const current = this.records.get(project.id);
      if (!current || current.isStopping) {
        return;
      }

      current.state.status = 'error';
      current.state.lastError = error.shortMessage ?? error.message;
      this.appendLog(project.id, 'system', `Failed to run: ${current.state.lastError}`);
      this.notifications.projectError(project.name, current.state.lastError ?? 'The process could not be started.');
    });

    return cloneRuntimeState(record.state);
  }

  async stopProject(projectId: string): Promise<ProjectRuntimeState> {
    const record = this.records.get(projectId);
    if (!record) {
      return {
        projectId,
        status: 'stopped',
        healthHistory: [],
        logs: this.store.getProjectLogs(projectId),
      };
    }

    const pid = record.state.pid;
    if (!pid || !isPidAlive(pid)) {
      record.state.status = 'stopped';
      record.state.pid = undefined;
      return cloneRuntimeState(record.state);
    }

    record.isStopping = true;
    this.appendLog(projectId, 'system', 'Stopping process tree...');

    try {
      await killProcessTree(pid, 'SIGTERM');
      const deadline = Date.now() + 5000;
      while (isPidAlive(pid) && Date.now() < deadline) {
        await sleep(150);
      }

      if (isPidAlive(pid)) {
        await killProcessTree(pid, 'SIGKILL');
      }
    } catch (error) {
      record.state.status = 'error';
      record.state.lastError = error instanceof Error ? error.message : 'Unable to stop the process tree.';
      this.appendLog(projectId, 'system', record.state.lastError);
      throw error;
    } finally {
      record.isStopping = false;
      record.child = undefined;
      record.state.status = 'stopped';
      record.state.pid = undefined;
      record.state.uptimeSeconds = undefined;
    }

    this.notifications.projectStopped(record.project.name);

    return cloneRuntimeState(record.state);
  }

  async restartProject(project: SavedProject): Promise<ProjectRuntimeState> {
    await this.stopProject(project.id);
    await sleep(250);
    return this.startProject(project);
  }

  async stopExternalPid(pid: number): Promise<void> {
    if (!pid || !isPidAlive(pid)) {
      return;
    }

    await killProcessTree(pid, 'SIGTERM');
    const deadline = Date.now() + 5000;
    while (isPidAlive(pid) && Date.now() < deadline) {
      await sleep(150);
    }

    if (isPidAlive(pid)) {
      await killProcessTree(pid, 'SIGKILL');
    }
  }

  clearLogs(projectId: string): void {
    const record = this.records.get(projectId);
    if (record) {
      record.state.logs = [];
    }
    this.store.clearProjectLogs(projectId);
  }

  forgetProject(projectId: string): void {
    this.records.delete(projectId);
  }

  async shutdown(): Promise<void> {
    await Promise.all(
      [...this.records.keys()].map(async (projectId) => {
        try {
          await this.stopProject(projectId);
        } catch {
          return;
        }
      }),
    );
  }
}
