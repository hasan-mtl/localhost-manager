import type { LocalhostManagerApi } from '@shared/types';

export * from '@shared/types';

declare global {
  interface Window {
    localhostManager: LocalhostManagerApi;
  }
}

