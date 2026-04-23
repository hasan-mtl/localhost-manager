import { performance } from 'node:perf_hooks';
import type { PortRecord, ProjectRuntimeState, SavedProject } from '../shared/types';
import { buildPortUrlCandidates, extractPortFromUrl, getProjectUrlCandidates, uniqueStrings } from './urlResolver';

const HISTORY_LIMIT = 40;

function withTimeout(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref();
  return controller.signal;
}

export class HealthMonitor {
  private readonly history = new Map<string, number[]>();

  getHistory(key: string, fallback: number[]): number[] {
    return this.history.get(key) ?? fallback;
  }

  private updateHistory(key: string, sample: number | null, fallback: number[]): number[] {
    const current = this.history.get(key) ?? fallback;
    const next = [...current, sample ?? 0].slice(-HISTORY_LIMIT);
    this.history.set(key, next);
    return next;
  }

  async pingUrl(url: string, timeoutMs = 1200): Promise<number | null> {
    try {
      const startedAt = performance.now();
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: withTimeout(timeoutMs),
        cache: 'no-store',
      });
      const latency = Math.round(performance.now() - startedAt);
      return response.status < 500 ? latency : null;
    } catch {
      return null;
    }
  }

  async resolveReachableUrl(
    urls: string[],
    timeoutMs = 1500,
  ): Promise<{ url?: string; latencyMs?: number }> {
    const candidates = uniqueStrings(urls);

    for (const candidate of candidates) {
      const latency = await this.pingUrl(candidate, timeoutMs);
      if (latency !== null) {
        return {
          url: candidate,
          latencyMs: latency,
        };
      }
    }

    return {};
  }

  async evaluateProjectRuntime(
    project: SavedProject,
    runtime: ProjectRuntimeState,
    matchedPort?: PortRecord,
  ): Promise<ProjectRuntimeState> {
    const historyKey = `project:${project.id}`;
    const candidates = getProjectUrlCandidates(project, runtime, matchedPort);
    const resolution = await this.resolveReachableUrl(candidates, 1200);
    const reachableUrl = resolution.url;
    const reachableLatency = resolution.latencyMs ?? null;

    const nextStatus =
      reachableUrl !== undefined
        ? runtime.status === 'external'
          ? 'external'
          : 'running'
        : matchedPort && ['running', 'starting'].includes(runtime.status)
          ? 'running'
        : matchedPort && runtime.status === 'stopped'
          ? 'external'
        : runtime.status;

    return {
      ...runtime,
      status: nextStatus,
      url: reachableUrl ?? runtime.url ?? matchedPort?.detectedUrl,
      port:
        extractPortFromUrl(reachableUrl ?? runtime.url ?? matchedPort?.detectedUrl) ??
        matchedPort?.port ??
        runtime.port ??
        project.preferredPort,
      uptimeSeconds: runtime.startedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(runtime.startedAt).getTime()) / 1000))
        : undefined,
      healthHistory: this.updateHistory(historyKey, reachableLatency, runtime.healthHistory),
    };
  }

  async evaluatePorts(ports: PortRecord[]): Promise<PortRecord[]> {
    return Promise.all(
      ports.map(async (port) => {
        const candidates = uniqueStrings([
          port.detectedUrl,
          ...buildPortUrlCandidates(port.port, port.host, port.detectedUrl),
        ]);
        const resolution = await this.resolveReachableUrl(candidates, 800);
        return {
          ...port,
          detectedUrl: resolution.url ?? port.detectedUrl ?? candidates[0],
          reachable: Boolean(resolution.url),
          latencyMs: resolution.latencyMs,
        };
      }),
    );
  }

  async waitForReachableUrl(urls: string[], timeoutMs = 30000, intervalMs = 750): Promise<string | null> {
    const candidates = uniqueStrings(urls);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      for (const candidate of candidates) {
        const latency = await this.pingUrl(candidate, 1500);
        if (latency !== null) {
          return candidate;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return null;
  }
}
