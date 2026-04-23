import type { AppSnapshot, PortRecord, PortsFilter, QuickFilter } from '@shared/types';
import { ActivePortsTable } from '../components/ActivePortsTable';
import { portsFilterOptions } from '../lib/constants';
import { filterPorts } from '../lib/selectors';

interface RunningPortsPageProps {
  snapshot: AppSnapshot;
  searchQuery: string;
  quickFilter: QuickFilter;
  portsFilter: PortsFilter;
  onPortsFilterChange: (filter: PortsFilter) => void;
  onOpenPortLocalhost: (portId: string) => void;
  onStopPort: (port: PortRecord) => void;
}

export function RunningPortsPage({
  snapshot,
  searchQuery,
  quickFilter,
  portsFilter,
  onPortsFilterChange,
  onOpenPortLocalhost,
  onStopPort,
}: RunningPortsPageProps) {
  const filteredPorts = filterPorts(snapshot.ports, searchQuery, quickFilter, portsFilter);

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto pr-2">
      <div className="flex flex-wrap gap-3">
        {portsFilterOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onPortsFilterChange(option.key)}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${
              option.key === portsFilter
                ? 'border-blue-400/20 bg-blue-500/12 text-blue-200'
                : 'border-white/10 bg-white/[0.03] text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ActivePortsTable ports={filteredPorts} onOpenLocalhost={onOpenPortLocalhost} onStopPort={onStopPort} />
    </div>
  );
}

