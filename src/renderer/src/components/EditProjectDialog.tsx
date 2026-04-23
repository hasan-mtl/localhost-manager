import { useEffect, useState } from 'react';
import type { SavedProject } from '@shared/types';
import { X } from 'lucide-react';
import { ProjectFormFields, type ProjectFormValue } from './ProjectFormFields';

interface EditProjectDialogProps {
  open: boolean;
  project?: SavedProject;
  onClose: () => void;
  onSave: (project: SavedProject) => Promise<void>;
}

export function EditProjectDialog({ open, project, onClose, onSave }: EditProjectDialogProps) {
  const [form, setForm] = useState<ProjectFormValue | undefined>();

  useEffect(() => {
    if (project) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = project;
      setForm(rest);
    }
  }, [project]);

  if (!open || !project || !form) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-[32px] border border-white/10 bg-[#091524] p-6 shadow-panel">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Edit Project</h3>
            <p className="mt-2 text-sm text-slate-400">
              Update the folder metadata, command, and preferred localhost target for this saved project.
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

        <ProjectFormFields value={form} onChange={setForm} />

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
            onClick={() =>
              void onSave({
                ...project,
                ...form,
              })
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

