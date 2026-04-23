import type { PortRecord, ProjectRuntimeState, SavedProject } from '../shared/types';

const URL_PATTERN =
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)(?::\d{2,5})?(?:\/[^\s"'`)]*)?/gi;

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))];
}

export function normalizeHost(host?: string): string | undefined {
  if (!host) {
    return undefined;
  }

  const normalized = host.replace(/^\[/, '').replace(/\]$/, '');
  if (normalized === '*' || normalized === '0.0.0.0' || normalized === '::' || normalized === '::1') {
    return '127.0.0.1';
  }

  return normalized;
}

export function normalizeLocalUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hostname = normalizeHost(parsed.hostname) ?? parsed.hostname;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

export function extractUrlsFromText(text: string): string[] {
  return uniqueStrings(text.match(URL_PATTERN)?.map((value) => normalizeLocalUrl(value)) ?? []);
}

export function extractPortFromText(text?: string): number | undefined {
  if (!text) {
    return undefined;
  }

  const portMatch =
    text.match(/(?:--port(?:=|\s+)|-p\s+|PORT=|VITE_PORT=|APP_PORT=)(\d{2,5})/i) ??
    text.match(/\bport\s*[:=]\s*(\d{2,5})/i);

  if (!portMatch) {
    return undefined;
  }

  const port = Number(portMatch[1]);
  return Number.isFinite(port) ? port : undefined;
}

export function extractPortFromUrl(url?: string): number | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    return parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  } catch {
    return undefined;
  }
}

export function buildPortUrlCandidates(
  port?: number,
  host?: string,
  preferredUrl?: string,
): string[] {
  const normalizedHost = normalizeHost(host);
  const candidates: string[] = [];

  if (preferredUrl) {
    candidates.push(normalizeLocalUrl(preferredUrl));
  }

  if (port) {
    if (normalizedHost) {
      candidates.push(`http://${normalizedHost}:${port}`);
    }

    candidates.push(`http://127.0.0.1:${port}`);
    candidates.push(`http://localhost:${port}`);
  }

  return uniqueStrings(candidates);
}

export function getProjectUrlCandidates(
  project: SavedProject,
  runtime: ProjectRuntimeState,
  matchedPort?: PortRecord,
): string[] {
  const port = runtime.port ?? matchedPort?.port ?? project.preferredPort;
  return uniqueStrings([
    runtime.url,
    project.preferredUrl,
    matchedPort?.detectedUrl,
    ...buildPortUrlCandidates(port, matchedPort?.host, project.preferredUrl),
  ]);
}

