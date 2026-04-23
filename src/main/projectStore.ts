import Store from 'electron-store';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { z } from 'zod';
import {
  type AppSettings,
  type LogEntry,
  type SavedProject,
  packageManagerValues,
  stackValues,
} from '../shared/types';

const logEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  stream: z.enum(['stdout', 'stderr', 'system']),
  message: z.string(),
});

const savedProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootPath: z.string(),
  workingDirectory: z.string(),
  stack: z.enum(stackValues),
  packageManager: z.enum(packageManagerValues),
  startCommand: z.string(),
  preferredPort: z.number().optional(),
  preferredUrl: z.string().optional(),
  autoDetectPort: z.boolean(),
  enabled: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const settingsSchema = z.object({
  scanIntervalMs: z.number().min(1000).max(30000),
  defaultScanPaths: z.array(z.string()),
  showAllPorts: z.boolean(),
  openBrowserOnStart: z.boolean(),
  confirmBeforeStoppingExternal: z.boolean(),
});

const persistedStateSchema = z.object({
  projects: z.array(savedProjectSchema),
  settings: settingsSchema,
  selectedProjectId: z.string().optional(),
  logsByProject: z.record(z.array(logEntrySchema)),
});

type PersistedState = z.infer<typeof persistedStateSchema>;

export const LOG_RETENTION_LIMIT = 1000;

export const defaultSettings: AppSettings = {
  scanIntervalMs: 3000,
  defaultScanPaths: [`${homedir()}/Sites`, `${homedir()}/Development`],
  showAllPorts: false,
  openBrowserOnStart: false,
  confirmBeforeStoppingExternal: true,
};

export class ProjectStore {
  private readonly store: Store<PersistedState>;

  constructor() {
    this.store = new Store<PersistedState>({
      name: 'localhost-manager',
      defaults: {
        projects: [],
        settings: defaultSettings,
        logsByProject: {},
      },
    });

    this.repair();
  }

  private repair(): void {
    const repaired = persistedStateSchema.safeParse({
      projects: this.store.get('projects'),
      settings: this.store.get('settings'),
      selectedProjectId: this.store.get('selectedProjectId'),
      logsByProject: this.store.get('logsByProject'),
    });

    if (repaired.success) {
      return;
    }

    this.store.set({
      projects: [],
      settings: defaultSettings,
      selectedProjectId: undefined,
      logsByProject: {},
    });
  }

  getProjects(): SavedProject[] {
    return savedProjectSchema
      .array()
      .parse(this.store.get('projects'))
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  getProject(projectId: string): SavedProject | undefined {
    return this.getProjects().find((project) => project.id === projectId);
  }

  createProject(project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>): SavedProject {
    const timestamp = new Date().toISOString();
    const nextProject: SavedProject = {
      ...project,
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.upsertProject(nextProject);
    return nextProject;
  }

  upsertProject(project: SavedProject): SavedProject {
    const now = new Date().toISOString();
    const validated = savedProjectSchema.parse({
      ...project,
      updatedAt: now,
    });
    const existing = this.getProjects();
    const nextProjects = existing.filter((entry) => entry.id !== validated.id);
    nextProjects.push(validated);
    this.store.set('projects', nextProjects);
    return validated;
  }

  removeProject(projectId: string): void {
    const nextProjects = this.getProjects().filter((project) => project.id !== projectId);
    const logsByProject = this.getLogsByProject();
    delete logsByProject[projectId];
    this.store.set('projects', nextProjects);
    this.store.set('logsByProject', logsByProject);
    if (this.getSelectedProjectId() === projectId) {
      this.store.delete('selectedProjectId');
    }
  }

  getSettings(): AppSettings {
    return settingsSchema.parse(this.store.get('settings'));
  }

  updateSettings(nextSettings: AppSettings): AppSettings {
    const validated = settingsSchema.parse(nextSettings);
    this.store.set('settings', validated);
    return validated;
  }

  getSelectedProjectId(): string | undefined {
    const projectId = this.store.get('selectedProjectId');
    return typeof projectId === 'string' ? projectId : undefined;
  }

  setSelectedProjectId(projectId?: string): void {
    if (projectId) {
      this.store.set('selectedProjectId', projectId);
      return;
    }

    this.store.delete('selectedProjectId');
  }

  getProjectLogs(projectId: string): LogEntry[] {
    const logsByProject = this.getLogsByProject();
    return logsByProject[projectId] ?? [];
  }

  setProjectLogs(projectId: string, logs: LogEntry[]): void {
    const nextLogs = logs.slice(-LOG_RETENTION_LIMIT);
    const logsByProject = this.getLogsByProject();
    logsByProject[projectId] = nextLogs;
    this.store.set('logsByProject', logsByProject);
  }

  clearProjectLogs(projectId: string): void {
    const logsByProject = this.getLogsByProject();
    logsByProject[projectId] = [];
    this.store.set('logsByProject', logsByProject);
  }

  private getLogsByProject(): Record<string, LogEntry[]> {
    return z.record(z.array(logEntrySchema)).parse(this.store.get('logsByProject'));
  }
}
