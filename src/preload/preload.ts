import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppSettings,
  LocalhostManagerApi,
  SavedProject,
} from '../shared/types';

const api: LocalhostManagerApi = {
  getAppSnapshot: (forceRefresh) => ipcRenderer.invoke('app:get-snapshot', forceRefresh),
  pickProjectFolder: () => ipcRenderer.invoke('project:pick-folder'),
  detectProject: (folderPath) => ipcRenderer.invoke('project:detect', folderPath),
  createProject: (draft) => ipcRenderer.invoke('project:create', draft),
  updateProject: (project) => ipcRenderer.invoke('project:update', project),
  removeProject: (projectId) => ipcRenderer.invoke('project:remove', projectId),
  startProject: (projectId) => ipcRenderer.invoke('project:start', projectId),
  stopProject: (projectId) => ipcRenderer.invoke('project:stop', projectId),
  restartProject: (projectId) => ipcRenderer.invoke('project:restart', projectId),
  openProjectLocalhost: (projectId) => ipcRenderer.invoke('project:open-localhost', projectId),
  openPortLocalhost: (portId) => ipcRenderer.invoke('ports:open-localhost', portId),
  scanPorts: () => ipcRenderer.invoke('ports:scan'),
  openFolder: (targetPath) => ipcRenderer.invoke('system:open-folder', targetPath),
  openInVSCode: (targetPath) => ipcRenderer.invoke('system:open-vscode', targetPath),
  stopExternalPort: (portId) => ipcRenderer.invoke('ports:stop-external', portId),
  clearLogs: (projectId) => ipcRenderer.invoke('logs:clear', projectId),
  updateSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:update', settings),
  setSelectedProject: (projectId?: string) => ipcRenderer.invoke('project:set-selected', projectId),
};

contextBridge.exposeInMainWorld('localhostManager', api);

