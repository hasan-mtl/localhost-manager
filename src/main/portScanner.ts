import { basename } from 'node:path';
import { homedir } from 'node:os';
import type { AppSettings, PortRecord, ProjectRuntimeState, SavedProject } from '../shared/types';
import type { PortInspectionRecord } from './types';
import { inspectLinuxListeningPorts } from './os/linux';
import { inspectMacListeningPorts } from './os/macos';
import { inspectWindowsListeningPorts } from './os/windows';
import { buildPortUrlCandidates } from './urlResolver';

function normalizePath(value?: string): string {
  return value?.replace(/\/+$/, '').toLowerCase() ?? '';
}

function isLikelyDevProcess(port: PortInspectionRecord): boolean {
  const haystack = `${port.processName} ${port.command ?? ''}`.toLowerCase();
  return [
    'node',
    'npm',
    'pnpm',
    'yarn',
    'bun',
    'next',
    'vite',
    'php',
    'artisan',
    'python',
    'uvicorn',
    'rails',
    'deno',
  ].some((token) => haystack.includes(token));
}

function isLocalBinding(host?: string): boolean {
  if (!host) {
    return false;
  }

  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0', '*', '::'].includes(host);
}

function canSafelyStopPort(
  record: PortInspectionRecord,
  matchedProjectId?: string,
  managedRuntime?: ProjectRuntimeState,
): { canStop: boolean; stopWarning?: string } {
  if (managedRuntime && ['running', 'starting'].includes(managedRuntime.status)) {
    return { canStop: true };
  }

  if (matchedProjectId) {
    return { canStop: true };
  }

  if (isLikelyDevProcess(record)) {
    return { canStop: true };
  }

  const normalizedHome = normalizePath(homedir());
  const normalizedCwd = normalizePath(record.cwd);
  if (normalizedCwd && normalizedCwd.startsWith(normalizedHome)) {
    return { canStop: true };
  }

  return {
    canStop: false,
    stopWarning: 'Stopping this listener is disabled because it does not look like a local development process.',
  };
}

function scoreProjectMatch(project: SavedProject, port: PortInspectionRecord, runtime?: ProjectRuntimeState): number {
  const projectPath = normalizePath(project.rootPath);
  const cwd = normalizePath(port.cwd);
  const command = port.command?.toLowerCase() ?? '';
  const projectName = basename(project.rootPath).toLowerCase();
  let score = 0;

  if (runtime?.pid && port.pid === runtime.pid) {
    score += 10;
  }

  if (project.preferredPort && project.preferredPort === port.port) {
    score += 4;
  }

  if (cwd && (cwd.startsWith(projectPath) || projectPath.startsWith(cwd))) {
    score += 6;
  }

  if (command.includes(projectPath) || command.includes(projectName)) {
    score += 3;
  }

  return score;
}

async function inspectPortsForPlatform(): Promise<PortInspectionRecord[]> {
  switch (process.platform) {
    case 'darwin':
      return inspectMacListeningPorts();
    case 'linux':
      return inspectLinuxListeningPorts();
    case 'win32':
      return inspectWindowsListeningPorts();
    default:
      return [];
  }
}

function scorePortPriority(port: PortRecord): number {
  const haystack = `${port.processName ?? ''} ${port.command ?? ''}`.toLowerCase();
  let score = 0;

  if (port.source === 'managed') {
    score += 6;
  }

  if (port.matchedProjectId) {
    score += 4;
  }

  if (port.canStop) {
    score += 1;
  }

  if (['node', 'npm', 'pnpm', 'yarn', 'bun', 'next', 'vite', 'php', 'artisan', 'python', 'uvicorn', 'rails', 'deno'].some((token) => haystack.includes(token))) {
    score += 3;
  }

  if (port.reachable) {
    score += 1;
  }

  return score;
}

export class PortScanner {
  async scanPorts(
    projects: SavedProject[],
    runtimeStates: ProjectRuntimeState[],
    settings: AppSettings,
  ): Promise<PortRecord[]> {
    const inspected = await inspectPortsForPlatform();
    const runtimeMap = new Map(runtimeStates.map((runtime) => [runtime.projectId, runtime]));
    const deduped = new Map<string, PortInspectionRecord>();

    for (const record of inspected) {
      if (!settings.showAllPorts && !isLocalBinding(record.host) && !isLikelyDevProcess(record)) {
        continue;
      }

      if (!settings.showAllPorts && !isLikelyDevProcess(record) && !isLocalBinding(record.host)) {
        continue;
      }

      deduped.set(`${record.pid}:${record.port}`, record);
    }

    return [...deduped.values()]
      .map<PortRecord>((record) => {
        const directRuntime = runtimeStates.find((runtime) => runtime.pid && runtime.pid === record.pid);
        let matchedProjectId = directRuntime?.projectId;

        if (!matchedProjectId) {
          let bestScore = 0;
          for (const project of projects) {
            const score = scoreProjectMatch(project, record, runtimeMap.get(project.id));
            if (score > bestScore) {
              bestScore = score;
              matchedProjectId = project.id;
            }
          }

          if (bestScore < 3) {
            matchedProjectId = undefined;
          }
        }

        const matchedManagedRuntime = matchedProjectId ? runtimeMap.get(matchedProjectId) : undefined;
        const source =
          matchedManagedRuntime && ['running', 'starting'].includes(matchedManagedRuntime.status)
            ? 'managed'
            : 'external';
        const safety = canSafelyStopPort(record, matchedProjectId, matchedManagedRuntime);
        const url = buildPortUrlCandidates(record.port, record.host)[0];
        return {
          id: `${record.pid}:${record.port}`,
          port: record.port,
          pid: record.pid,
          host: record.host,
          protocol: 'tcp',
          processName: record.processName,
          command: record.command,
          cwd: record.cwd,
          state: 'listening',
          source,
          matchedProjectId,
          detectedUrl: url,
          startedAt: record.startedAt,
          canStop: safety.canStop,
          stopWarning: safety.stopWarning,
        };
      })
      .sort((left, right) => {
        const scoreDelta = scorePortPriority(right) - scorePortPriority(left);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return left.port - right.port;
      });
  }
}
