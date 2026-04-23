import { app, BrowserWindow, nativeTheme } from 'electron';
import { join } from 'node:path';
import { HealthMonitor } from './healthMonitor';
import { registerIpcHandlers } from './ipc';
import { PortScanner } from './portScanner';
import { ProcessManager } from './processManager';
import { ProjectStore } from './projectStore';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1260,
    minHeight: 760,
    title: 'Localhost Manager',
    backgroundColor: '#06101e',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
}

async function bootstrap(): Promise<void> {
  nativeTheme.themeSource = 'dark';
  const store = new ProjectStore();
  const processManager = new ProcessManager(store);
  const portScanner = new PortScanner();
  const healthMonitor = new HealthMonitor();

  registerIpcHandlers({
    store,
    processManager,
    portScanner,
    healthMonitor,
  });

  createWindow();

  app.on('before-quit', () => {
    void processManager.shutdown();
  });
}

app.whenReady().then(bootstrap);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

