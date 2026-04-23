import { execa } from 'execa';
import type { PortInspectionRecord } from '../types';

interface PsRecord {
  command?: string;
  startedAt?: string;
}

function parsePortBinding(binding: string): { host?: string; port?: number } {
  const match = binding.match(/^(.*):(\d{2,5})$/);
  if (!match) {
    return {};
  }

  return {
    host: match[1].replace(/^\[/, '').replace(/\]$/, ''),
    port: Number(match[2]),
  };
}

function parseLsof(stdout: string): PortInspectionRecord[] {
  const records: PortInspectionRecord[] = [];
  const lines = stdout.split('\n').filter(Boolean);
  let current: Partial<PortInspectionRecord> & { listening?: boolean } = {};

  const flush = (): void => {
    if (current.pid && current.processName && current.port && current.listening) {
      records.push({
        pid: current.pid,
        processName: current.processName,
        port: current.port,
        host: current.host,
        protocol: 'tcp',
      });
    }
  };

  for (const line of lines) {
    const key = line[0];
    const value = line.slice(1);

    if (key === 'p') {
      flush();
      current = { pid: Number(value), listening: false };
      continue;
    }

    if (key === 'c') {
      current.processName = value;
      continue;
    }

    if (key === 'n') {
      const { host, port } = parsePortBinding(value);
      current.host = host;
      current.port = port;
      continue;
    }

    if (key === 'T' && value === 'ST=LISTEN') {
      current.listening = true;
    }
  }

  flush();
  return records;
}

async function loadPsDetails(pids: number[]): Promise<Map<number, PsRecord>> {
  if (pids.length === 0) {
    return new Map();
  }

  const result = await execa(
    'ps',
    ['-p', pids.join(','), '-o', 'pid=', '-o', 'etimes=', '-o', 'command='],
    { reject: false },
  );
  const map = new Map<number, PsRecord>();

  for (const line of result.stdout.split('\n').filter(Boolean)) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!match) {
      continue;
    }

    const pid = Number(match[1]);
    const elapsedSeconds = Number(match[2]);
    map.set(pid, {
      command: match[3],
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
    });
  }

  return map;
}

async function loadWorkingDirectory(pid: number): Promise<string | undefined> {
  const result = await execa('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
    reject: false,
  });
  const cwdLine = result.stdout
    .split('\n')
    .find((line) => line.startsWith('n') && !line.startsWith('node:'));
  return cwdLine ? cwdLine.slice(1) : undefined;
}

export async function inspectMacListeningPorts(): Promise<PortInspectionRecord[]> {
  const result = await execa('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-FpcPnT'], {
    reject: false,
  });

  if (!result.stdout.trim()) {
    return [];
  }

  const baseRecords = parseLsof(result.stdout);
  const uniquePids = [...new Set(baseRecords.map((record) => record.pid))];
  const psMap = await loadPsDetails(uniquePids);
  const cwdEntries = await Promise.all(uniquePids.map(async (pid) => [pid, await loadWorkingDirectory(pid)] as const));
  const cwdMap = new Map<number, string | undefined>(cwdEntries);

  return baseRecords.map((record) => ({
    ...record,
    command: psMap.get(record.pid)?.command,
    startedAt: psMap.get(record.pid)?.startedAt,
    cwd: cwdMap.get(record.pid),
  }));
}

