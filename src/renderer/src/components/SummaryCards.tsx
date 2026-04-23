import type { AppSnapshot, QuickFilter } from '@shared/types';
import { Activity, FolderKanban, RadioTower, Timer } from 'lucide-react';

interface SummaryCardsProps {
  snapshot: AppSnapshot;
  counts: Record<QuickFilter, number>;
}

const cards = [
  {
    key: 'active',
    label: 'Active Projects',
    icon: FolderKanban,
    accent: 'from-blue-500/20 to-blue-500/5 text-blue-300',
  },
  {
    key: 'ports',
    label: 'Running Ports',
    icon: RadioTower,
    accent: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300',
  },
  {
    key: 'stopped',
    label: 'Stopped Projects',
    icon: Activity,
    accent: 'from-violet-500/20 to-violet-500/5 text-violet-300',
  },
  {
    key: 'system',
    label: 'System Load',
    icon: Timer,
    accent: 'from-sky-500/20 to-sky-500/5 text-sky-300',
  },
] as const;

export function SummaryCards({ snapshot, counts }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const primaryValue =
          card.key === 'active'
            ? counts.running
            : card.key === 'ports'
              ? snapshot.ports.length
              : card.key === 'stopped'
                ? counts.stopped
                : `${snapshot.system.cpuLoadPercent}%`;

        const secondaryValue =
          card.key === 'system'
            ? `CPU ${snapshot.system.cpuLoadPercent}% • RAM ${snapshot.system.memoryPercent}%`
            : card.key === 'active'
              ? `${snapshot.projects.length} saved projects`
              : card.key === 'ports'
                ? `${snapshot.ports.filter((port) => port.source === 'managed').length} managed`
                : `${counts.errors} with issues`;

        return (
          <div
            key={card.key}
            className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-400">{card.label}</p>
            <p className="mt-1 text-4xl font-semibold tracking-[-0.04em] text-white">{primaryValue}</p>
            <p className="mt-4 text-sm text-slate-500">{secondaryValue}</p>
          </div>
        );
      })}
    </div>
  );
}

