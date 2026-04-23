import { startTransition, useDeferredValue, useEffect, useMemo, useRef } from 'react';
import type { PortRecord, ProjectRuntimeState, QuickFilter, SavedProject } from '@shared/types';
import { ToastHost } from './components/ToastHost';
import { pageTitles } from './lib/constants';
import { DashboardPage } from './pages/DashboardPage';
import { LogsPage } from './pages/LogsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RunningPortsPage } from './pages/RunningPortsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddProjectDialog } from './components/AddProjectDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EditProjectDialog } from './components/EditProjectDialog';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const searchRef = useRef<HTMLInputElement>(null);
  const {
    snapshot,
    loading,
    refreshing,
    currentPage,
    searchQuery,
    quickFilter,
    portsFilter,
    selectedProjectId,
    logsProjectId,
    streamFilter,
    autoScrollLogs,
    isAddDialogOpen,
    addDraft,
    isEditDialogOpen,
    editingProject,
    confirm,
    bootstrap,
    refreshSnapshot,
    scanPorts,
    setCurrentPage,
    setSearchQuery,
    setQuickFilter,
    setPortsFilter,
    setLogsProjectId,
    setStreamFilter,
    setAutoScrollLogs,
    setSelectedProjectId,
    beginAddProject,
    closeAddProject,
    saveNewProject,
    openEditProject,
    closeEditProject,
    saveProject,
    requestProjectRemoval,
    openConfirm,
    closeConfirm,
    confirmAction,
    startProject,
    stopProject,
    restartProject,
    openProjectLocalhost,
    openPortLocalhost,
    stopPort,
    openFolder,
    openInVSCode,
    clearLogs,
    saveSettings,
  } = useAppStore();

  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!snapshot) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      startTransition(() => {
        void refreshSnapshot();
      });
    }, snapshot.settings.scanIntervalMs);

    return () => window.clearInterval(timer);
  }, [refreshSnapshot, snapshot]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  const counts: Record<QuickFilter, number> = useMemo(() => {
    if (!snapshot) {
      return { all: 0, running: 0, stopped: 0, errors: 0 };
    }

    return {
      all: snapshot.projects.length,
      running: snapshot.runtimeStates.filter((runtime) => ['running', 'starting', 'external'].includes(runtime.status)).length,
      stopped: snapshot.runtimeStates.filter((runtime) => runtime.status === 'stopped').length,
      errors: snapshot.runtimeStates.filter((runtime) => runtime.status === 'error').length,
    };
  }, [snapshot]);

  const selectedProject = snapshot?.projects.find((project) => project.id === selectedProjectId);

  const stopProjectFlow = (project: SavedProject, runtime?: ProjectRuntimeState, matchedPort?: PortRecord) => {
    if (runtime?.status === 'external' && matchedPort) {
      const runStop = () => stopPort(matchedPort.id);
      if (snapshot?.settings.confirmBeforeStoppingExternal) {
        openConfirm({
          title: `Stop external process on port ${matchedPort.port}?`,
          message: 'This process was not launched by Localhost Manager. Stopping it will kill the full process tree.',
          confirmLabel: 'Stop Process',
          intent: 'danger',
          onConfirm: runStop,
        });
        return;
      }

      void runStop();
      return;
    }

    void stopProject(project.id);
  };

  const handleToggleProject = (project: SavedProject, runtime?: ProjectRuntimeState) => {
    if (runtime?.status === 'running' || runtime?.status === 'starting' || runtime?.status === 'external') {
      const matchedPort = snapshot?.ports.find((port) => port.matchedProjectId === project.id);
      stopProjectFlow(project, runtime, matchedPort);
      return;
    }

    void startProject(project.id);
  };

  const handleStopPort = (port: PortRecord) => {
    const runStop = () => stopPort(port.id);
    if (port.source === 'external' && snapshot?.settings.confirmBeforeStoppingExternal) {
      openConfirm({
        title: `Stop ${port.processName ?? 'external process'}?`,
        message: `This will stop the listener on port ${port.port} and kill its process tree.`,
        confirmLabel: 'Stop Port',
        intent: 'danger',
        onConfirm: runStop,
      });
      return;
    }

    void runStop();
  };

  if (!snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell text-slate-300">
        {loading ? 'Loading Localhost Manager...' : 'Unable to load Localhost Manager'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shell px-4 py-4 text-white antialiased">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-[1580px] overflow-hidden rounded-shell border border-white/10 bg-[#050d17] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          counts={counts}
          hasErrors={counts.errors > 0}
          runningPorts={snapshot.ports.length}
          refreshing={refreshing}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={pageTitles[currentPage]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onScanPorts={() => void scanPorts()}
            onAddProject={() => void beginAddProject()}
            searchRef={searchRef}
            refreshing={refreshing}
            generatedAt={snapshot.generatedAt}
          />

          <div className="min-h-0 flex-1 p-8">
            {currentPage === 'dashboard' && (
              <DashboardPage
                snapshot={snapshot}
                searchQuery={deferredSearch}
                quickFilter={quickFilter}
                selectedProjectId={selectedProjectId}
                onAddProject={() => void beginAddProject()}
                onScanPorts={() => void scanPorts()}
                onSelectProject={(projectId) => void setSelectedProjectId(projectId)}
                onToggleProject={handleToggleProject}
                onOpenLocalhost={(project) => void openProjectLocalhost(project.id)}
                onEditProject={openEditProject}
                onRemoveProject={requestProjectRemoval}
                onStopSelectedProject={stopProjectFlow}
                onRestartProject={(projectId) => void restartProject(projectId)}
                onOpenFolder={(targetPath) => void openFolder(targetPath)}
                onOpenVSCode={(targetPath) => void openInVSCode(targetPath)}
                onOpenPortLocalhost={(portId) => void openPortLocalhost(portId)}
                onStopPort={handleStopPort}
                counts={counts}
              />
            )}

            {currentPage === 'projects' && (
              <ProjectsPage
                snapshot={snapshot}
                searchQuery={deferredSearch}
                quickFilter={quickFilter}
                selectedProjectId={selectedProjectId}
                onSelectProject={(projectId) => void setSelectedProjectId(projectId)}
                onToggleProject={handleToggleProject}
                onOpenLocalhost={(project) => void openProjectLocalhost(project.id)}
                onEditProject={openEditProject}
                onRemoveProject={requestProjectRemoval}
                onStopSelectedProject={stopProjectFlow}
                onRestartProject={(projectId) => void restartProject(projectId)}
                onOpenFolder={(targetPath) => void openFolder(targetPath)}
                onOpenVSCode={(targetPath) => void openInVSCode(targetPath)}
              />
            )}

            {currentPage === 'ports' && (
              <RunningPortsPage
                snapshot={snapshot}
                searchQuery={deferredSearch}
                quickFilter={quickFilter}
                portsFilter={portsFilter}
                onPortsFilterChange={setPortsFilter}
                onOpenPortLocalhost={(portId) => void openPortLocalhost(portId)}
                onStopPort={handleStopPort}
              />
            )}

            {currentPage === 'logs' && (
              <LogsPage
                snapshot={snapshot}
                logsProjectId={logsProjectId ?? selectedProject?.id}
                streamFilter={streamFilter}
                autoScroll={autoScrollLogs}
                onProjectChange={setLogsProjectId}
                onStreamFilterChange={setStreamFilter}
                onAutoScrollChange={setAutoScrollLogs}
                onClearLogs={(projectId) => void clearLogs(projectId)}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage settings={snapshot.settings} onSaveSettings={saveSettings} />
            )}
          </div>
        </main>
      </div>

      <AddProjectDialog open={isAddDialogOpen} draft={addDraft} onClose={closeAddProject} onSave={saveNewProject} />
      <EditProjectDialog open={isEditDialogOpen} project={editingProject} onClose={closeEditProject} onSave={saveProject} />
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        intent={confirm.intent}
        busy={confirm.busy}
        onClose={closeConfirm}
        onConfirm={() => void confirmAction()}
      />
      <ToastHost />
    </div>
  );
}
