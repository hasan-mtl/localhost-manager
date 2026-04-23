import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  intent: 'primary' | 'danger';
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  intent,
  busy,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b1626] p-6 shadow-panel">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              intent === 'danger' ? 'bg-red-500/12 text-red-300' : 'bg-blue-500/12 text-blue-300'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm leading-6 text-slate-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
              intent === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
            } ${busy ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

