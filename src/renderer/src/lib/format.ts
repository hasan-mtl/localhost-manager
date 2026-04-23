import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { ProjectStatus, StackType } from '@shared/types';

dayjs.extend(duration);
dayjs.extend(localizedFormat);

export function formatDateTime(value?: string): string {
  if (!value) {
    return '—';
  }

  return dayjs(value).format('MMM D, YYYY [at] h:mm A');
}

export function formatClockTime(value?: string): string {
  if (!value) {
    return '—';
  }

  return dayjs(value).format('h:mm A');
}

export function formatUptime(seconds?: number): string {
  if (!seconds) {
    return '—';
  }

  const parsed = dayjs.duration(seconds, 'seconds');
  const hours = Math.floor(parsed.asHours());
  const minutes = parsed.minutes();
  const secs = parsed.seconds();

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

export function formatPathSnippet(value: string): string {
  if (value.length <= 42) {
    return value;
  }

  return `${value.slice(0, 16)}...${value.slice(-22)}`;
}

export function stackLabel(stack: StackType): string {
  switch (stack) {
    case 'nextjs':
      return 'Next.js';
    case 'react':
      return 'React';
    case 'vite':
      return 'Vite';
    case 'node':
      return 'Node';
    case 'laravel':
      return 'Laravel';
    case 'custom':
      return 'Custom';
    default:
      return 'Unknown';
  }
}

export function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'starting':
      return 'Starting';
    case 'stopped':
      return 'Stopped';
    case 'error':
      return 'Error';
    case 'external':
      return 'External';
  }
}

