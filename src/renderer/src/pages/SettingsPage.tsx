import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/types';
import { Plus, Trash2 } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
}

export function SettingsPage({ settings, onSaveSettings }: SettingsPageProps) {
  const [draft, setDraft] = useState(settings);
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <div className="grid gap-5 overflow-auto pr-2 xl:grid-cols-[minmax(0,1.1fr)_420px]">
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-2 text-sm text-slate-500">
          Control how often Localhost Manager scans the machine, how cautious it is with external processes,
          and how the app behaves when you launch projects from the desktop.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Port Scan Interval (ms)</label>
            <input
              type="number"
              value={draft.scanIntervalMs}
              onChange={(event) => setDraft((current) => ({ ...current, scanIntervalMs: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4">
            {[
              {
                key: 'showAllPorts' as const,
                label: 'Show all listening ports',
                description: 'Include non-dev listeners in the Running Ports view.',
              },
              {
                key: 'openBrowserOnStart' as const,
                label: 'Open browser automatically after start',
                description: 'When using the Start action, open localhost once the service responds.',
              },
              {
                key: 'confirmBeforeStoppingExternal' as const,
                label: 'Confirm before stopping external processes',
                description: 'Add a safety prompt before killing ports the app did not start.',
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    [item.key]: !current[item.key],
                  }))
                }
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
                <div className={`relative inline-flex h-7 w-12 items-center rounded-full ${draft[item.key] ? 'bg-blue-600' : 'bg-white/10'}`}>
                  <span className={`h-5 w-5 rounded-full bg-white transition ${draft[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white">Default Scan Paths</h3>
          <p className="mt-2 text-sm text-slate-500">Keep common development roots handy for future discovery flows.</p>

          <div className="mt-5 space-y-3">
            {draft.defaultScanPaths.map((path) => (
              <div key={path} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="truncate pr-3 text-sm text-slate-200">{path}</span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      defaultScanPaths: current.defaultScanPaths.filter((entry) => entry !== path),
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:bg-red-500/14 hover:text-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <input
              value={newPath}
              onChange={(event) => setNewPath(event.target.value)}
              placeholder="/Users/you/Development"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!newPath.trim()) {
                  return;
                }
                setDraft((current) => ({
                  ...current,
                  defaultScanPaths: [...new Set([...current.defaultScanPaths, newPath.trim()])],
                }));
                setNewPath('');
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSaveSettings(draft)}
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Save Preferences
        </button>
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white">Distribution Notes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This build is configured for direct macOS distribution with hardened runtime packaging and optional notarization when Apple credentials are present in the environment.
          </p>
        </div>
      </div>
    </div>
  );
}
