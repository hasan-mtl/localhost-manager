import { create } from 'zustand';
import type {
  AppSettings,
  AppSnapshot,
  DetectedProjectDraft,
  LogStream,
  PageKey,
  PortsFilter,
  QuickFilter,
  SavedProject,
} from '@shared/types';
import { api } from '../lib/api';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  intent: 'primary' | 'danger';
  busy: boolean;
  onConfirm?: () => Promise<void>;
}

interface AppState {
  snapshot?: AppSnapshot;
  loading: boolean;
  refreshing: boolean;
  currentPage: PageKey;
  searchQuery: string;
  quickFilter: QuickFilter;
  portsFilter: PortsFilter;
  selectedProjectId?: string;
  logsProjectId?: string;
  streamFilter: LogStream | 'all';
  autoScrollLogs: boolean;
  addDraft?: DetectedProjectDraft;
  isAddDialogOpen: boolean;
  editingProject?: SavedProject;
  isEditDialogOpen: boolean;
  confirm: ConfirmState;
  toasts: ToastItem[];
  bootstrap: () => Promise<void>;
  refreshSnapshot: (force?: boolean) => Promise<void>;
  scanPorts: () => Promise<void>;
  setCurrentPage: (page: PageKey) => void;
  setSearchQuery: (value: string) => void;
  setQuickFilter: (value: QuickFilter) => void;
  setPortsFilter: (value: PortsFilter) => void;
  setLogsProjectId: (projectId?: string) => void;
  setStreamFilter: (value: LogStream | 'all') => void;
  setAutoScrollLogs: (enabled: boolean) => void;
  setSelectedProjectId: (projectId?: string) => Promise<void>;
  beginAddProject: () => Promise<void>;
  closeAddProject: () => void;
  saveNewProject: (
    draft: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  openEditProject: (project: SavedProject) => void;
  closeEditProject: () => void;
  saveProject: (project: SavedProject) => Promise<void>;
  requestProjectRemoval: (project: SavedProject) => void;
  openConfirm: (config: Omit<ConfirmState, 'open' | 'busy'>) => void;
  closeConfirm: () => void;
  confirmAction: () => Promise<void>;
  startProject: (projectId: string) => Promise<void>;
  stopProject: (projectId: string) => Promise<void>;
  restartProject: (projectId: string) => Promise<void>;
  openProjectLocalhost: (projectId: string) => Promise<void>;
  openPortLocalhost: (portId: string) => Promise<void>;
  stopPort: (portId: string) => Promise<void>;
  openFolder: (targetPath: string) => Promise<void>;
  openInVSCode: (targetPath: string) => Promise<void>;
  clearLogs: (projectId: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (toastId: string) => void;
}

async function expectOk<T>(promise: Promise<{ ok: boolean; data?: T; error?: string }>): Promise<T> {
  const response = await promise;
  if (!response.ok || response.data === undefined) {
    throw new Error(response.error ?? 'Unexpected response');
  }

  return response.data;
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  refreshing: false,
  currentPage: 'dashboard',
  searchQuery: '',
  quickFilter: 'all',
  portsFilter: 'all',
  streamFilter: 'all',
  autoScrollLogs: true,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  confirm: {
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    intent: 'primary',
    busy: false,
  },
  toasts: [],
  bootstrap: async () => {
    set({ loading: true });
    await get().refreshSnapshot(true);
    set({ loading: false });
  },
  refreshSnapshot: async (force = false) => {
    set({ refreshing: true });
    try {
      const snapshot = await expectOk(api.getAppSnapshot(force));
      set((state) => ({
        snapshot,
        refreshing: false,
        selectedProjectId: state.selectedProjectId ?? snapshot.selectedProjectId ?? snapshot.projects[0]?.id,
        logsProjectId:
          state.logsProjectId ??
          snapshot.selectedProjectId ??
          snapshot.projects[0]?.id,
      }));
    } catch (error) {
      set({ refreshing: false });
      get().pushToast({
        tone: 'error',
        title: 'Unable to refresh Localhost Manager',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  scanPorts: async () => {
    await get().refreshSnapshot(true);
    get().pushToast({
      tone: 'info',
      title: 'Port scan completed',
      description: 'Listening ports were refreshed from the machine.',
    });
  },
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setQuickFilter: (quickFilter) => set({ quickFilter }),
  setPortsFilter: (portsFilter) => set({ portsFilter }),
  setLogsProjectId: (logsProjectId) => set({ logsProjectId }),
  setStreamFilter: (streamFilter) => set({ streamFilter }),
  setAutoScrollLogs: (autoScrollLogs) => set({ autoScrollLogs }),
  setSelectedProjectId: async (selectedProjectId) => {
    set({ selectedProjectId, logsProjectId: selectedProjectId });
    await api.setSelectedProject(selectedProjectId);
  },
  beginAddProject: async () => {
    try {
      const folderPath = await expectOk(api.pickProjectFolder());
      if (!folderPath) {
        return;
      }

      const draft = await expectOk(api.detectProject(folderPath));
      set({ addDraft: draft, isAddDialogOpen: true });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to detect the selected project',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  closeAddProject: () => set({ addDraft: undefined, isAddDialogOpen: false }),
  saveNewProject: async (draft) => {
    try {
      const saved = await expectOk(api.createProject(draft));
      set({ isAddDialogOpen: false, addDraft: undefined, selectedProjectId: saved.id });
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Project added',
        description: `${saved.name} is now saved in Localhost Manager.`,
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Project could not be added',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  openEditProject: (editingProject) => set({ editingProject, isEditDialogOpen: true }),
  closeEditProject: () => set({ editingProject: undefined, isEditDialogOpen: false }),
  saveProject: async (project) => {
    try {
      const saved = await expectOk(api.updateProject(project));
      set({ editingProject: undefined, isEditDialogOpen: false, selectedProjectId: saved.id });
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Project updated',
        description: `${saved.name} has been updated.`,
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Project could not be updated',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  requestProjectRemoval: (project) =>
    get().openConfirm({
      title: `Remove ${project.name}?`,
      message: 'This removes the saved project from Localhost Manager. Any running managed process will be stopped first.',
      confirmLabel: 'Remove Project',
      intent: 'danger',
      onConfirm: async () => {
        await expectOk(api.removeProject(project.id));
        set((state) => ({
          selectedProjectId:
            state.selectedProjectId === project.id ? undefined : state.selectedProjectId,
        }));
        await get().refreshSnapshot(true);
        get().pushToast({
          tone: 'success',
          title: 'Project removed',
          description: `${project.name} was removed from the saved list.`,
        });
      },
    }),
  openConfirm: (config) =>
    set({
      confirm: {
        ...config,
        open: true,
        busy: false,
      },
    }),
  closeConfirm: () =>
    set({
      confirm: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        intent: 'primary',
        busy: false,
      },
    }),
  confirmAction: async () => {
    const { confirm } = get();
    if (!confirm.onConfirm) {
      return;
    }

    set((state) => ({
      confirm: {
        ...state.confirm,
        busy: true,
      },
    }));

    try {
      await confirm.onConfirm();
      get().closeConfirm();
    } catch (error) {
      set((state) => ({
        confirm: {
          ...state.confirm,
          busy: false,
        },
      }));
      get().pushToast({
        tone: 'error',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  startProject: async (projectId) => {
    try {
      await expectOk(api.startProject(projectId));
      await get().refreshSnapshot(true);
      const projectName = get().snapshot?.projects.find((project) => project.id === projectId)?.name ?? 'Project';
      get().pushToast({
        tone: 'success',
        title: `${projectName} is starting`,
        description: 'Logs and health checks will update as soon as the process responds.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to start project',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  stopProject: async (projectId) => {
    try {
      await expectOk(api.stopProject(projectId));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Project stopped',
        description: 'The managed localhost process tree has been stopped.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to stop project',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  restartProject: async (projectId) => {
    try {
      await expectOk(api.restartProject(projectId));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Project restarted',
        description: 'The project was restarted and Localhost Manager is checking the new runtime URL.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to restart project',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  openProjectLocalhost: async (projectId) => {
    try {
      const url = await expectOk(api.openProjectLocalhost(projectId));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Opened localhost',
        description: url,
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to open localhost',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  openPortLocalhost: async (portId) => {
    try {
      const url = await expectOk(api.openPortLocalhost(portId));
      get().pushToast({
        tone: 'success',
        title: 'Opened localhost port',
        description: url,
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to open localhost port',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  stopPort: async (portId) => {
    try {
      await expectOk(api.stopExternalPort(portId));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Process stopped',
        description: 'The selected listening process has been stopped.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to stop port',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  openFolder: async (targetPath) => {
    try {
      await expectOk(api.openFolder(targetPath));
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to open folder',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  openInVSCode: async (targetPath) => {
    try {
      await expectOk(api.openInVSCode(targetPath));
      get().pushToast({
        tone: 'success',
        title: 'Opening in VS Code',
        description: targetPath,
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to open VS Code',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  clearLogs: async (projectId) => {
    try {
      await expectOk(api.clearLogs(projectId));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Logs cleared',
        description: 'Stored project logs were cleared from Localhost Manager.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to clear logs',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  saveSettings: async (settings) => {
    try {
      await expectOk(api.updateSettings(settings));
      await get().refreshSnapshot(true);
      get().pushToast({
        tone: 'success',
        title: 'Settings updated',
        description: 'Preferences were saved to the local desktop store.',
      });
    } catch (error) {
      get().pushToast({
        tone: 'error',
        title: 'Unable to save settings',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
}));
