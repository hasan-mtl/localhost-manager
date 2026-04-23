import type { PageKey, QuickFilter } from '@shared/types';
import {
  Activity,
  FolderKanban,
  Gauge,
  Home,
  Logs,
  Server,
  Settings,
  Sparkles,
} from 'lucide-react';
import { QuickFilters } from './QuickFilters';

interface SidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  counts: Record<QuickFilter, number>;
  hasErrors: boolean;
  runningPorts: number;
  refreshing: boolean;
}

const navigation = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: Home },
  { key: 'projects' as const, label: 'Projects', icon: FolderKanban },
  { key: 'ports' as const, label: 'Running Ports', icon: Server },
  { key: 'logs' as const, label: 'Logs', icon: Logs },
  { key: 'settings' as const, label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentPage,
  onNavigate,
  quickFilter,
  onQuickFilterChange,
  counts,
  hasErrors,
  runningPorts,
  refreshing,
}: SidebarProps) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/8 bg-[#071120] px-5 py-5">
      <div className="flex items-center gap-3 rounded-2xl px-2 py-3">
        <div className="flex items-center gap-2 pr-1">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2f]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 rounded-2xl px-2 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/16 text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Localhost Manager</p>
          <p className="text-xs text-slate-500">Desktop control for local dev</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {navigation.map((item) => {
          const active = currentPage === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition ${
                active
                  ? 'bg-blue-600/18 text-white shadow-[inset_0_0_0_1px_rgba(88,143,255,0.22)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 border-t border-white/8 pt-8">
        <QuickFilters counts={counts} current={quickFilter} onChange={onQuickFilterChange} />
      </div>

      <div className="mt-auto rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              hasErrors ? 'bg-red-500/12 text-red-300' : 'bg-emerald-500/12 text-emerald-300'
            }`}
          >
            {hasErrors ? <Activity className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">System Status</p>
            <p className={`text-xs ${hasErrors ? 'text-red-300' : 'text-emerald-300'}`}>
              {hasErrors ? 'Attention needed' : 'All systems operational'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {counts.running} running projects • {runningPorts} live ports {refreshing ? '• syncing' : ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
