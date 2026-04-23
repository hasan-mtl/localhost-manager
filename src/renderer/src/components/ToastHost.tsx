import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const toneStyles = {
  error: {
    shell: 'border-red-500/20 bg-[#291316]',
    icon: 'text-red-300',
    Icon: AlertCircle,
  },
  success: {
    shell: 'border-emerald-500/20 bg-[#102117]',
    icon: 'text-emerald-300',
    Icon: CheckCircle2,
  },
  info: {
    shell: 'border-blue-500/20 bg-[#0f1d30]',
    icon: 'text-blue-300',
    Icon: Info,
  },
} as const;

export function ToastHost() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, 3500),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismissToast, toasts]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => {
        const { Icon, icon, shell } = toneStyles[toast.tone];
        return (
          <div key={toast.id} className={`pointer-events-auto w-96 rounded-[22px] border px-4 py-3 shadow-panel ${shell}`}>
            <div className="flex gap-3">
              <div className={`pt-0.5 ${icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description && <p className="mt-1 text-sm leading-6 text-slate-300">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-xl p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

