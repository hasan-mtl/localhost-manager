interface SparklineProps {
  values: number[];
}

export function Sparkline({ values }: SparklineProps) {
  if (values.length === 0) {
    return <div className="h-28 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]" />;
  }

  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-cyan-500/6 to-transparent p-3">
      <svg viewBox="0 0 100 100" className="h-24 w-full">
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#2d73ff" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#sparkline-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

