import { access, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { DetectedProjectDraft, PackageManagerType, StackType } from '../shared/types';
import { extractPortFromText } from './urlResolver';

interface PackageJsonShape {
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ComposerJsonShape {
  name?: string;
  require?: Record<string, string>;
}

const defaultPortsByStack: Partial<Record<StackType, number>> = {
  nextjs: 3000,
  vite: 5173,
  laravel: 8000,
};

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(targetPath: string): Promise<T | null> {
  try {
    const content = await readFile(targetPath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function detectPackageManager(
  pkg: PackageJsonShape | null,
  hasComposer: boolean,
  checks: Record<string, boolean>,
): PackageManagerType {
  if (checks['pnpm-lock.yaml']) {
    return 'pnpm';
  }

  if (checks['yarn.lock']) {
    return 'yarn';
  }

  if (checks['bun.lockb'] || checks['bun.lock']) {
    return 'bun';
  }

  if (checks['package-lock.json']) {
    return 'npm';
  }

  if (hasComposer) {
    return 'composer';
  }

  if (pkg?.packageManager?.startsWith('pnpm@')) {
    return 'pnpm';
  }

  if (pkg?.packageManager?.startsWith('yarn@')) {
    return 'yarn';
  }

  if (pkg?.packageManager?.startsWith('bun@')) {
    return 'bun';
  }

  if (pkg?.packageManager?.startsWith('npm@')) {
    return 'npm';
  }

  return 'unknown';
}

function detectStack(pkg: PackageJsonShape | null, composer: ComposerJsonShape | null, checks: Record<string, boolean>): StackType {
  const dependencies = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  const scripts = Object.values(pkg?.scripts ?? {}).join(' ').toLowerCase();

  if (composer?.require?.['laravel/framework'] || checks['artisan']) {
    return 'laravel';
  }

  if (dependencies.next) {
    return 'nextjs';
  }

  if (dependencies.vite) {
    return 'vite';
  }

  if (dependencies.react || dependencies['react-dom']) {
    return 'react';
  }

  if (scripts.includes('next dev')) {
    return 'nextjs';
  }

  if (scripts.includes('vite')) {
    return 'vite';
  }

  if (scripts.includes('react-scripts') || scripts.includes('webpack serve')) {
    return 'react';
  }

  if (pkg) {
    return 'node';
  }

  return 'unknown';
}

function commandForScript(packageManager: PackageManagerType, scriptName: string): string {
  switch (packageManager) {
    case 'pnpm':
      return `pnpm ${scriptName}`;
    case 'yarn':
      return `yarn ${scriptName}`;
    case 'bun':
      return scriptName === 'dev' ? 'bun dev' : `bun run ${scriptName}`;
    case 'npm':
      return `npm run ${scriptName}`;
    case 'unknown':
      return `npm run ${scriptName}`;
    default:
      return '';
  }
}

function detectStartCommand(
  stack: StackType,
  packageManager: PackageManagerType,
  pkg: PackageJsonShape | null,
  preferredPort?: number,
): string {
  const scripts = pkg?.scripts ?? {};

  if (stack === 'laravel') {
    const port = preferredPort ?? defaultPortsByStack.laravel ?? 8000;
    return `php artisan serve --host=127.0.0.1 --port=${port}`;
  }

  if (scripts.dev) {
    return commandForScript(packageManager, 'dev');
  }

  if (scripts.start) {
    return commandForScript(packageManager, 'start');
  }

  if (scripts.preview) {
    return commandForScript(packageManager, 'preview');
  }

  if (packageManager === 'composer') {
    return 'composer run dev';
  }

  return '';
}

async function detectPreferredPort(rootPath: string, pkg: PackageJsonShape | null, stack: StackType): Promise<number | undefined> {
  const sources: string[] = [];
  const candidateFiles = [
    '.env',
    '.env.local',
    '.env.development',
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mjs',
    'next.config.js',
    'next.config.mjs',
  ];

  for (const scriptValue of Object.values(pkg?.scripts ?? {})) {
    sources.push(scriptValue);
  }

  for (const relativePath of candidateFiles) {
    const fullPath = join(rootPath, relativePath);
    if (!(await fileExists(fullPath))) {
      continue;
    }

    try {
      sources.push(await readFile(fullPath, 'utf8'));
    } catch {
      continue;
    }
  }

  for (const source of sources) {
    const detected = extractPortFromText(source);
    if (detected) {
      return detected;
    }
  }

  return defaultPortsByStack[stack];
}

export async function detectProject(rootPath: string): Promise<DetectedProjectDraft> {
  const checksList = [
    'package.json',
    'composer.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
    'artisan',
  ];

  const checks = Object.fromEntries(
    await Promise.all(
      checksList.map(async (relativePath) => [relativePath, await fileExists(join(rootPath, relativePath))] as const),
    ),
  );

  const packageJson = checks['package.json']
    ? await readJsonFile<PackageJsonShape>(join(rootPath, 'package.json'))
    : null;
  const composerJson = checks['composer.json']
    ? await readJsonFile<ComposerJsonShape>(join(rootPath, 'composer.json'))
    : null;

  const stack = detectStack(packageJson, composerJson, checks);
  const packageManager = detectPackageManager(packageJson, checks['composer.json'], checks);
  const preferredPort = await detectPreferredPort(rootPath, packageJson, stack);
  const startCommand = detectStartCommand(stack, packageManager, packageJson, preferredPort);
  const warnings: string[] = [];

  if (!startCommand) {
    warnings.push('No obvious development command was found. Review the command before saving.');
  }

  if (stack === 'unknown') {
    warnings.push('Framework detection was inconclusive. The project was saved as a custom setup.');
  }

  if (packageJson && packageManager === 'unknown') {
    warnings.push('No lockfile was found, so the start command defaults to npm conventions.');
  }

  return {
    name: packageJson?.name ?? composerJson?.name ?? basename(rootPath),
    rootPath,
    workingDirectory: rootPath,
    stack,
    packageManager,
    startCommand,
    preferredPort,
    preferredUrl: preferredPort ? `http://127.0.0.1:${preferredPort}` : undefined,
    autoDetectPort: true,
    enabled: true,
    notes: '',
    warnings,
  };
}
