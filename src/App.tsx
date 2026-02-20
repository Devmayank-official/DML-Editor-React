import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { appBus } from './core/eventBus';
import { EditorTabs } from './editor/EditorTabs';
import { MonacoEditorPane, type MonacoEditorHandle } from './editor/MonacoEditorPane';
import { useVersionHistory } from './history/useVersionHistory';
import { PreviewPane } from './preview/PreviewPane';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { defaultTemplate } from './templates/defaultTemplate';
import { templateLibrary } from './templates/library';
import type { ConsoleEntry, Language, LayoutMode, Project } from './types/project';
import { ConsolePanel } from './ui/ConsolePanel';
import { ToastCenter, type Toast } from './ui/ToastCenter';
import { exportSingleHtml, exportZip, importHtml, importZip } from './utils/importExport';
import { deleteProject, listProjects, saveProject } from './storage/projectStore';

const createProject = (name = 'DML Project', files = defaultTemplate): Project => ({
  id: crypto.randomUUID(),
  name,
  files,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const layoutClass: Record<LayoutMode, string> = {
  'side-by-side': 'md:grid-cols-2',
  'top-bottom': 'grid-rows-2',
  'editor-only': 'grid-cols-1',
  'preview-only': 'grid-cols-1',
};

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeLanguage, setActiveLanguage] = useState<Language>('html');
  const [layout, setLayout] = useState<LayoutMode>('side-by-side');
  const [useTailwind, setUseTailwind] = useState(true);
  const [useTs, setUseTs] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [split, setSplit] = useState(50);
  const [selectedTemplate, setSelectedTemplate] = useState(templateLibrary[0].id);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [restoreHistoryId, setRestoreHistoryId] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MonacoEditorHandle | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const { canInstall, install } = useInstallPrompt();
  const { entries, saveSnapshot } = useVersionHistory(activeProject?.id ?? 'unknown', activeProject?.files ?? defaultTemplate);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }, []);

  const upsertProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const existing = prev.find((entry) => entry.id === project.id);
      if (!existing) return [...prev, project];
      return prev.map((entry) => (entry.id === project.id ? project : entry));
    });
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await listProjects();
      if (stored.length === 0) {
        const initial = createProject();
        await saveProject(initial);
        setProjects([initial]);
        setActiveProjectId(initial.id);
        return;
      }
      setProjects(stored);
      const params = new URLSearchParams(window.location.search);
      const share = params.get('share');
      if (share) {
        try {
          const parsed = JSON.parse(decodeURIComponent(escape(atob(share))));
          const fromShare = createProject('Shared Project', parsed);
          await saveProject(fromShare);
          setProjects((prev) => [...stored, fromShare]);
          setActiveProjectId(fromShare.id);
          pushToast('Loaded project from shared URL');
          return;
        } catch {
          pushToast('Invalid share URL payload', 'error');
        }
      }
      setActiveProjectId(stored[0].id);
    };
    void hydrate();
  }, [pushToast]);

  useEffect(() => {
    if (!activeProject) return;
    const interval = setInterval(async () => {
      const next = { ...activeProject, updatedAt: Date.now() };
      await saveProject(next);
      await saveSnapshot();
      upsertProject(next);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeProject, saveSnapshot, upsertProject]);

  useEffect(() => {
    const panel = containerRef.current;
    if (!panel) return;
    gsap.fromTo(panel, { opacity: 0.6 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
  }, [layout]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'dml-preview') return;
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          level: event.data.level,
          message: event.data.message,
          stack: event.data.stack,
          timestamp: Date.now(),
        },
      ]);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const unsubscribeSave = appBus.on('save', () => {
      if (!activeProject) return;
      const next = { ...activeProject, updatedAt: Date.now() };
      void saveProject(next);
      upsertProject(next);
      pushToast('Project saved');
    });
    const unsubscribeFormat = appBus.on('format', () => {
      editorRef.current?.formatDocument();
      pushToast('Format command dispatched');
    });
    return () => {
      unsubscribeSave();
      unsubscribeFormat();
    };
  }, [activeProject, pushToast, upsertProject]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        appBus.emit('save', undefined);
      }
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        appBus.emit('run', undefined);
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        appBus.emit('format', undefined);
      }
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        editorRef.current?.toggleComment();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setFile = useCallback(
    (lang: Language, value: string) => {
      if (!activeProject) return;
      const next: Project = {
        ...activeProject,
        files: { ...activeProject.files, [lang]: value },
      };
      upsertProject(next);
    },
    [activeProject, upsertProject],
  );

  const activeCode = useMemo(() => {
    if (!activeProject) return '';
    return activeProject.files[activeLanguage];
  }, [activeLanguage, activeProject]);

  const onFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const files = file.name.endsWith('.zip')
      ? await importZip(file, activeProject.files)
      : await importHtml(file, activeProject.files);
    upsertProject({ ...activeProject, files, updatedAt: Date.now() });
    pushToast('Project imported');
  };

  const shareUrl = useMemo(() => {
    if (!activeProject) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify(activeProject.files))));
  }, [activeProject]);

  const createFromTemplate = () => {
    const selected = templateLibrary.find((template) => template.id === selectedTemplate);
    if (!selected) return;
    const next = createProject(selected.name, selected.files);
    void saveProject(next);
    setProjects((prev) => [...prev, next]);
    setActiveProjectId(next.id);
    pushToast(`Created ${selected.name} project`);
  };

  const removeActiveProject = async () => {
    if (!activeProject || projects.length <= 1) return;
    await deleteProject(activeProject.id);
    const remaining = projects.filter((project) => project.id !== activeProject.id);
    setProjects(remaining);
    setActiveProjectId(remaining[0].id);
    pushToast('Project closed');
  };

  const restoreHistory = async () => {
    if (!activeProject || !restoreHistoryId) return;
    const target = entries.find((entry) => entry.id === restoreHistoryId);
    if (!target) return;
    const next = { ...activeProject, files: target.files, updatedAt: Date.now() };
    upsertProject(next);
    await saveProject(next);
    pushToast('Restored snapshot');
  };

  if (!activeProject) return null;

  return (
    <div className="flex h-full flex-col bg-bg text-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-panel px-3 py-2 text-sm">
        <h1 className="mr-3 font-semibold tracking-wide text-accent">DML Editor</h1>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setUseTailwind((v) => !v)}>Tailwind</button>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setUseTs((v) => !v)}>TypeScript</button>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setWordWrap((v) => !v)}>Word Wrap</button>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setMinimap((v) => !v)}>Minimap</button>
        <select className="rounded bg-slate-800 px-2 py-1" value={layout} onChange={(e) => setLayout(e.target.value as LayoutMode)}>
          <option value="side-by-side">Side</option>
          <option value="top-bottom">Top Bottom</option>
          <option value="editor-only">Editor</option>
          <option value="preview-only">Preview</option>
        </select>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportSingleHtml(activeProject.files)}>Export HTML</button>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => void exportZip(activeProject.files)}>Export ZIP</button>
        <label className="rounded bg-slate-800 px-2 py-1">
          Import
          <input type="file" className="hidden" onChange={onFileImport} accept=".html,.zip" />
        </label>
        <select className="rounded bg-slate-800 px-2 py-1" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
          {templateLibrary.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
        <button className="rounded bg-cyan-700 px-2 py-1" onClick={createFromTemplate}>New from Template</button>
        {canInstall ? <button className="rounded bg-cyan-700 px-2 py-1" onClick={() => void install()}>Install</button> : null}
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => navigator.clipboard.writeText(`${location.origin}?share=${shareUrl}`)}>Copy Share URL</button>
      </header>

      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`rounded px-3 py-1 text-xs ${project.id === activeProject.id ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300'}`}
            onClick={() => setActiveProjectId(project.id)}
          >
            {project.name}
          </button>
        ))}
        <button className="ml-auto rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => void removeActiveProject()}>Close Active</button>
      </div>

      <motion.main className={`grid flex-1 gap-2 p-2 ${layoutClass[layout]}`} ref={containerRef}>
        {layout !== 'preview-only' ? (
          <section className="flex min-h-0 flex-col rounded border border-slate-700">
            <EditorTabs active={activeLanguage} onSelect={setActiveLanguage} tsEnabled={useTs} />
            <div className="min-h-0 flex-1">
              <MonacoEditorPane
                ref={editorRef}
                value={activeCode}
                language={activeLanguage}
                onChange={(value) => setFile(activeLanguage, value)}
                wordWrap={wordWrap}
                minimap={minimap}
              />
            </div>
          </section>
        ) : null}

        {layout !== 'editor-only' ? (
          <section className="min-h-0 rounded border border-slate-700 bg-panel p-2">
            <PreviewPane files={activeProject.files} useTailwind={useTailwind} useTs={useTs} />
          </section>
        ) : null}
      </motion.main>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 bg-panel px-3 py-1 text-xs text-slate-300">
        <span>Versions: {entries.length}</span>
        <span>Split: {split}%</span>
        <select className="rounded bg-slate-800 px-2 py-1" value={restoreHistoryId} onChange={(event) => setRestoreHistoryId(event.target.value)}>
          <option value="">Select snapshot</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.id}>{new Date(entry.createdAt).toLocaleString()}</option>
          ))}
        </select>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => void restoreHistory()}>Restore</button>
      </div>
      <div
        className="h-1 cursor-row-resize bg-slate-700"
        onMouseDown={(event) => {
          const startY = event.clientY;
          const start = split;
          const onMove = (move: MouseEvent) => {
            const delta = ((move.clientY - startY) / window.innerHeight) * 100;
            setSplit(Math.max(20, Math.min(80, start + delta)));
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      />
      <div style={{ height: `${100 - split}%` }}>
        <ConsolePanel logs={consoleLogs} onClear={() => setConsoleLogs([])} />
      </div>
      <ToastCenter toasts={toasts} />
    </div>
  );
}

export default App;
