import type { PageKey, PortsFilter, QuickFilter } from '@shared/types';

export const pageTitles: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  ports: 'Running Ports',
  logs: 'Logs',
  settings: 'Settings',
};

export const quickFilterOptions: Array<{ key: QuickFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'running', label: 'Running' },
  { key: 'stopped', label: 'Stopped' },
  { key: 'errors', label: 'Errors' },
];

export const portsFilterOptions: Array<{ key: PortsFilter; label: string }> = [
  { key: 'all', label: 'All Ports' },
  { key: 'managed', label: 'Managed' },
  { key: 'external', label: 'External' },
];

