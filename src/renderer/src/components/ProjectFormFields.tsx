import type React from 'react';
import type { PackageManagerType, SavedProject, StackType } from '@shared/types';
import { packageManagerValues, stackValues } from '@shared/types';
import { stackLabel } from '../lib/format';

export type ProjectFormValue = Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>;

interface ProjectFormFieldsProps {
  value: ProjectFormValue;
  warnings?: string[];
  onChange: (nextValue: ProjectFormValue) => void;
}

function updateValue(
  value: ProjectFormValue,
  onChange: (nextValue: ProjectFormValue) => void,
  patch: Partial<ProjectFormValue>,
) {
  onChange({
    ...value,
    ...patch,
  });
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/30 focus:outline-none ${
        props.className ?? ''
      }`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[88px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/30 focus:outline-none ${
        props.className ?? ''
      }`}
    />
  );
}

export function ProjectFormFields({ value, warnings = [], onChange }: ProjectFormFieldsProps) {
  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-200">
          <p className="font-medium">Review before saving</p>
          <ul className="mt-2 space-y-1 text-amber-100/80">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput value={value.name} onChange={(event) => updateValue(value, onChange, { name: event.target.value })} />
        </div>
        <div>
          <FieldLabel>Working Directory</FieldLabel>
          <TextInput
            value={value.workingDirectory}
            onChange={(event) => updateValue(value, onChange, { workingDirectory: event.target.value })}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Root Path</FieldLabel>
        <TextInput value={value.rootPath} onChange={(event) => updateValue(value, onChange, { rootPath: event.target.value })} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Stack</FieldLabel>
          <select
            value={value.stack}
            onChange={(event) => updateValue(value, onChange, { stack: event.target.value as StackType })}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-blue-400/30 focus:outline-none"
          >
            {stackValues.map((stack) => (
              <option key={stack} value={stack}>
                {stackLabel(stack)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Package Manager</FieldLabel>
          <select
            value={value.packageManager}
            onChange={(event) =>
              updateValue(value, onChange, { packageManager: event.target.value as PackageManagerType })
            }
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-blue-400/30 focus:outline-none"
          >
            {packageManagerValues.map((packageManager) => (
              <option key={packageManager} value={packageManager}>
                {packageManager}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel>Start Command</FieldLabel>
        <TextInput
          value={value.startCommand}
          placeholder="npm run dev"
          onChange={(event) => updateValue(value, onChange, { startCommand: event.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Preferred Port</FieldLabel>
          <TextInput
            type="number"
            value={value.preferredPort ?? ''}
            placeholder="3000"
            onChange={(event) =>
              updateValue(value, onChange, {
                preferredPort: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </div>
        <div>
          <FieldLabel>Preferred URL</FieldLabel>
          <TextInput
            value={value.preferredUrl ?? ''}
            placeholder="http://127.0.0.1:3000"
            onChange={(event) =>
              updateValue(value, onChange, {
                preferredUrl: event.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      <div>
        <FieldLabel>Notes</FieldLabel>
        <TextArea
          value={value.notes ?? ''}
          placeholder="Optional notes for this project."
          onChange={(event) => updateValue(value, onChange, { notes: event.target.value })}
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Auto-detect port</p>
          <p className="text-xs text-slate-500">Use runtime and health checks to update the detected localhost URL.</p>
        </div>
        <button
          type="button"
          onClick={() => updateValue(value, onChange, { autoDetectPort: !value.autoDetectPort })}
          className={`relative inline-flex h-7 w-12 items-center rounded-full ${
            value.autoDetectPort ? 'bg-blue-600' : 'bg-white/10'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white transition ${
              value.autoDetectPort ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
