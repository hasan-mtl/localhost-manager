interface ToggleActionProps {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ToggleAction({ enabled, onClick, disabled }: ToggleActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled
          ? 'border-blue-400/30 bg-gradient-to-r from-blue-600 to-blue-500'
          : 'border-white/10 bg-white/8'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-lg transition ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

