# Localhost Manager

Localhost Manager is a macOS-first Electron desktop app for developers who want one place to see active localhost ports, save local projects, start and stop dev servers, inspect runtime health, and open any project’s local URL with one click.

## What It Does

- Scans active listening TCP ports on macOS with `lsof`
- Detects saved projects and matches them against active localhost processes
- Auto-detects project stack, package manager, start command, and likely port
- Starts, stops, and restarts managed local projects from the desktop app
- Streams stdout, stderr, and system logs into an in-app log viewer
- Opens localhost URLs, Finder folders, and VS Code from the app
- Persists projects, settings, selection state, and capped log history with `electron-store`

## Tech Stack

- Electron
- React
- TypeScript
- electron-vite
- Tailwind CSS
- Zustand
- electron-store
- zod
- execa
- tree-kill
- open
- Lucide icons
- dayjs

## Prerequisites

- macOS
- Node.js 20+
- npm 10+
- Common local dev tooling installed for the projects you want to run
  - Examples: `node`, `npm`, `pnpm`, `yarn`, `bun`, `php`, `composer`
- Optional: VS Code and the `code` CLI for the strongest "Open in VS Code" behavior

## Install

```bash
npm install
```

## Run In Development

```bash
npm run dev
```

This starts the Electron main process and the Vite renderer together.

## Typecheck

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

The production bundles are written to `out/`.

## Package

```bash
npm run dist
```

Packaged artifacts are written to `release/`.

## Project Structure

```text
package.json
electron-builder.yml
electron.vite.config.ts
src/
  main/
    main.ts
    ipc.ts
    projectStore.ts
    projectDetector.ts
    processManager.ts
    portScanner.ts
    healthMonitor.ts
    urlResolver.ts
    os/
      macos.ts
      linux.ts
      windows.ts
  preload/
    preload.ts
  renderer/
    index.html
    src/
      App.tsx
      components/
      lib/
      pages/
      store/
  shared/
    types.ts
```

## macOS Notes

- Port inspection is implemented with `lsof -nP -iTCP -sTCP:LISTEN`
- Extra PID metadata is enriched with `ps` and `lsof -d cwd`
- The app prioritizes localhost bindings and developer-oriented processes by default
- If "Show all listening ports" is enabled in Settings, broader listeners are displayed too

## Known Limitations

- Linux and Windows adapter files are scaffolded cleanly, but the active port inspection logic is implemented only for macOS in this v1
- Managed processes are stopped when the desktop app quits
- Laravel auto-detection is focused on `php artisan serve`
- Start command detection is heuristic-based and may need manual edits for unusual custom setups
- External process stopping is intentionally cautious and can prompt before killing non-managed listeners

