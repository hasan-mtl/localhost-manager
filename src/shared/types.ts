export const stackValues = [
  'nextjs',
  'react',
  'vite',
  'node',
  'laravel',
  'custom',
  'unknown',
] as const;

export type StackType = (typeof stackValues)[number];

export const packageManagerValues = [
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'composer',
  'custom',
  'unknown',
] as const;

export type PackageManagerType = (typeof packageManagerValues)[number];

export type ProjectStatus = 'running' | 'starting' | 'stopped' | 'error' | 'external';
export type LogStream = 'stdout' | 'stderr' | 'system';
export type PageKey = 'dashboard' | 'projects' | 'ports' | 'logs' | 'settings';
export type QuickFilter = 'all' | 'running' | 'stopped' | 'errors';
export type PortsFilter = 'all' | 'managed' | 'external';

export interface SavedProject {
  id: string;
  name: string;
  rootPath: string;
  workingDirectory: string;
  stack: StackType;
  packageManager: PackageManagerType;
  startCommand: string;
  preferredPort?: number;
  preferredUrl?: string;
  autoDetectPort: boolean;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  stream: LogStream;
  message: string;
}

export interface ProjectRuntimeState {
  projectId: string;
  status: ProjectStatus;
  pid?: number;
  port?: number;
  url?: string;
  startedAt?: string;
  uptimeSeconds?: number;
  lastError?: string;
  healthHistory: number[];
  logs: LogEntry[];
}

export interface PortRecord {
  id: string;
  port: number;
  pid?: number;
  host?: string;
  protocol: 'tcp';
  processName?: string;
  command?: string;
  cwd?: string;
  state: 'listening' | 'stopped' | 'unknown';
  source: 'managed' | 'external';
  matchedProjectId?: string;
  detectedUrl?: string;
  startedAt?: string;
  reachable?: boolean;
  latencyMs?: number;
  canStop: boolean;
  stopWarning?: string;
}

export interface AppSettings {
  scanIntervalMs: number;
  defaultScanPaths: string[];
  showAllPorts: boolean;
  openBrowserOnStart: boolean;
  confirmBeforeStoppingExternal: boolean;
}

export interface SystemMetrics {
  cpuLoadPercent: number;
  memoryPercent: number;
  loadAverage: number[];
  activeManagedProjects: number;
}

export interface DetectedProjectDraft {
  name: string;
  rootPath: string;
  workingDirectory: string;
  stack: StackType;
  packageManager: PackageManagerType;
  startCommand: string;
  preferredPort?: number;
  preferredUrl?: string;
  autoDetectPort: boolean;
  enabled: boolean;
  notes?: string;
  warnings: string[];
}

export interface AppSnapshot {
  projects: SavedProject[];
  runtimeStates: ProjectRuntimeState[];
  ports: PortRecord[];
  settings: AppSettings;
  selectedProjectId?: string;
  system: SystemMetrics;
  generatedAt: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface LocalhostManagerApi {
  getAppSnapshot: (forceRefresh?: boolean) => Promise<ApiResponse<AppSnapshot>>;
  pickProjectFolder: () => Promise<ApiResponse<string | null>>;
  detectProject: (folderPath: string) => Promise<ApiResponse<DetectedProjectDraft>>;
  createProject: (
    draft: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<ApiResponse<SavedProject>>;
  updateProject: (project: SavedProject) => Promise<ApiResponse<SavedProject>>;
  removeProject: (projectId: string) => Promise<ApiResponse<boolean>>;
  startProject: (projectId: string) => Promise<ApiResponse<ProjectRuntimeState>>;
  stopProject: (projectId: string) => Promise<ApiResponse<ProjectRuntimeState>>;
  restartProject: (projectId: string) => Promise<ApiResponse<ProjectRuntimeState>>;
  openProjectLocalhost: (projectId: string) => Promise<ApiResponse<string>>;
  openPortLocalhost: (portId: string) => Promise<ApiResponse<string>>;
  scanPorts: () => Promise<ApiResponse<AppSnapshot>>;
  openFolder: (targetPath: string) => Promise<ApiResponse<boolean>>;
  openInVSCode: (targetPath: string) => Promise<ApiResponse<boolean>>;
  stopExternalPort: (portId: string) => Promise<ApiResponse<boolean>>;
  clearLogs: (projectId: string) => Promise<ApiResponse<boolean>>;
  updateSettings: (settings: AppSettings) => Promise<ApiResponse<AppSettings>>;
  setSelectedProject: (projectId?: string) => Promise<ApiResponse<boolean>>;
}
