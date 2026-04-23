export * from '../shared/types';

export interface PortInspectionRecord {
  pid: number;
  processName: string;
  port: number;
  host?: string;
  protocol: 'tcp';
  command?: string;
  cwd?: string;
  startedAt?: string;
}

