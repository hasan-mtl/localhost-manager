import { useEffect, useState } from 'react';
import type { DetectedProjectDraft } from '@shared/types';
import { X } from 'lucide-react';
import { ProjectFormFields, type ProjectFormValue } from './ProjectFormFields';

interface AddProjectDialogProps {
  open: boolean;
  draft?: DetectedProjectDraft;
  onClose: () => void;
  onSave: (value: ProjectFormValue) => Promise<void>;
}

export function AddProjectDialog({ open, draft, onClose, onSave }: AddProjectDialogProps) {
  const [form, setForm] = useState<ProjectFormValue | undefined>();

  useEffect(() => {
    if (draft) {
      setForm(draft);
    }
  }, [draft]);

  if (!open || !draft || !form) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-[32px] border border-white/10 bg-[#091524] p-6 shadow-panel">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Add Project</h3>
            <p className="mt-2 text-sm text-slate-400">
              Localhost Manager detected this folder. Review the command, stack, and port before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ProjectFormFields value={form} warnings={draft.warnings} onChange={setForm} />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave(form)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Save Project
          </button>
        </div>
      </div>
    </div>
  );
}

