import { BrowserWindow, Notification } from 'electron';

function canNotify(window: BrowserWindow | null): boolean {
  return Notification.isSupported() && (!window || !window.isFocused());
}

export class Notifications {
  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  private show(title: string, body: string): void {
    const window = this.getWindow();
    if (!canNotify(window)) {
      return;
    }

    new Notification({
      title,
      body,
      silent: true,
    }).show();
  }

  projectReady(projectName: string, url?: string): void {
    this.show(`"${projectName}" is ready`, url ?? 'The localhost service is responding.');
  }

  projectError(projectName: string, message: string): void {
    this.show(`"${projectName}" needs attention`, message);
  }

  projectStopped(projectName: string): void {
    this.show(`"${projectName}" stopped`, 'The managed local process tree was stopped.');
  }
}

