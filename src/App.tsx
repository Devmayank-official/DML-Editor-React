import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type TouchEvent } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { appBus } from './core/eventBus';
import { usePersistentState } from './core/usePersistentState';
import { EditorTabs } from './editor/EditorTabs';
import { MonacoEditorPane, type MonacoEditorHandle } from './editor/MonacoEditorPane';
import { useVersionHistory } from './history/useVersionHistory';
import { PreviewPane } from './preview/PreviewPane';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { deleteProject, listProjects, saveProject } from './storage/projectStore';
import { defaultTemplate } from './templates/defaultTemplate';
import { templateLibrary } from './templates/library';
import type { ConsoleEntry, Language, LayoutMode, Project, StylePreprocessor } from './types/project';
import { CommandPalette, type CommandItem } from './ui/CommandPalette';
import { ConsolePanel } from './ui/ConsolePanel';
import { FloatingActions } from './ui/FloatingActions';
import { JsReplPanel } from './ui/JsReplPanel';
import { MobileKeyboardToolbar } from './ui/MobileKeyboardToolbar';
import { OnboardingTour } from './ui/OnboardingTour';
import { SnippetLibrary } from './ui/SnippetLibrary';
import { ThemeBuilder, type ThemeSettings } from './ui/ThemeBuilder';
import { ToastCenter, type Toast } from './ui/ToastCenter';
import { exportCss, exportScript, exportSingleHtml, exportZip, importHtml, importZip } from './utils/importExport';
import { formatWithPrettier } from './utils/formatter';
import {
  exportPreviewPdf,
  exportPreviewScreenshotSvg,
  exportToCodePen,
  exportToJSFiddle,
  prepareGitProviderExport,
} from './utils/externalIntegrations';

const fontOptions = [
  'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
  'Fira Code, ui-monospace, SFMono-Regular, Menlo, monospace',
  'monospace',
] as const;

const defaultThemeSettings: ThemeSettings = {
  bg: '#0a0f1a',
  panel: '#131a2b',
  accent: '#5eead4',
  text: '#e2e8f0',
};

const toRgbTriplet = (hex: string): string => {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000';
  return `${Number.parseInt(normalized.slice(1, 3), 16)} ${Number.parseInt(normalized.slice(3, 5), 16)} ${Number.parseInt(normalized.slice(5, 7), 16)}`;
};

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
  const [layout, setLayout] = usePersistentState<LayoutMode>('dml:layout', 'side-by-side');
  const [useTailwind, setUseTailwind] = usePersistentState('dml:tailwind', true);
  const [useTs, setUseTs] = usePersistentState('dml:typescript', false);
  const [stylePreprocessor, setStylePreprocessor] = usePersistentState<StylePreprocessor>('dml:stylePreprocessor', 'css');
  const [wordWrap, setWordWrap] = usePersistentState('dml:wordWrap', true);
  const [minimap, setMinimap] = usePersistentState('dml:minimap', false);
  const [fontFamily, setFontFamily] = usePersistentState<(typeof fontOptions)[number]>('dml:fontFamily', fontOptions[0]);
  const [fontSize, setFontSize] = usePersistentState('dml:fontSize', 14);
  const [isZenMode, setIsZenMode] = usePersistentState('dml:zenMode', false);
  const [hasSeenTour, setHasSeenTour] = usePersistentState('dml:tourSeen', false);
  const [themeSettings, setThemeSettings] = usePersistentState<ThemeSettings>('dml:theme', defaultThemeSettings);

  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [split, setSplit] = useState(50);
  const [selectedTemplate, setSelectedTemplate] = useState(templateLibrary[0].id);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [restoreHistoryId, setRestoreHistoryId] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [lastPreviewRenderMs, setLastPreviewRenderMs] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [editorPreviewSplit, setEditorPreviewSplit] = usePersistentState('dml:editorPreviewSplit', 50);
  const [topBottomSplit, setTopBottomSplit] = usePersistentState('dml:topBottomSplit', 50);
  const [collapsedEditor, setCollapsedEditor] = useState(false);
  const [collapsedPreview, setCollapsedPreview] = useState(false);
  const [fullscreenPanel, setFullscreenPanel] = useState<'editor' | 'preview' | null>(null);
  const [isThemeBuilderOpen, setIsThemeBuilderOpen] = useState(false);
  const [gitProvider, setGitProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MonacoEditorHandle | null>(null);
  const previewRunStartedAt = useRef<number | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const { canInstall, install } = useInstallPrompt();
  const { entries, saveSnapshot } = useVersionHistory(activeProject?.id ?? 'unknown', activeProject?.files ?? defaultTemplate);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 2500);
  }, []);

  const upsertProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const exists = prev.some((entry) => entry.id === project.id);
      if (!exists) return [...prev, project];
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
      } else {
        setProjects(stored);
        setActiveProjectId(stored[0].id);
      }

      const share = new URLSearchParams(window.location.search).get('share');
      if (!share) return;
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(share)));
        const sharedProject = createProject('Shared Project', decoded);
        await saveProject(sharedProject);
        setProjects((prev) => [...prev, sharedProject]);
        setActiveProjectId(sharedProject.id);
        pushToast('Loaded project from shared URL');
      } catch {
        pushToast('Invalid share URL payload', 'error');
      }
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
    gsap.fromTo(panel, { opacity: 0.55 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  }, [layout, isZenMode, editorPreviewSplit]);

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
      if (!activeProject) return;
      const source = activeProject.files[activeLanguage];
      void formatWithPrettier(source, activeLanguage).then((formatted) => {
        if (formatted === source) {
          pushToast('Formatting unchanged');
          return;
        }
        const next = {
          ...activeProject,
          files: { ...activeProject.files, [activeLanguage]: formatted },
          updatedAt: Date.now(),
        };
        upsertProject(next);
        void saveProject(next);
        pushToast('Formatted with Prettier');
      });
    });
    const unsubscribeRun = appBus.on('run', () => {
      previewRunStartedAt.current = performance.now();
      setPreviewNonce((prev) => prev + 1);
      pushToast('Preview refreshed');
    });
    return () => {
      unsubscribeSave();
      unsubscribeFormat();
      unsubscribeRun();
    };
  }, [activeProject, activeLanguage, pushToast, upsertProject]);

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
      if (event.ctrlKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        const expanded = editorRef.current?.expandEmmet();
        if (!expanded) pushToast('No Emmet abbreviation found', 'error');
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pushToast]);

  const setFile = useCallback(
    (lang: Language, value: string) => {
      if (!activeProject) return;
      upsertProject({ ...activeProject, files: { ...activeProject.files, [lang]: value } });
    },
    [activeProject, upsertProject],
  );

  const activeCode = useMemo(() => (activeProject ? activeProject.files[activeLanguage] : ''), [activeLanguage, activeProject]);

  const onFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;
    const files = file.name.endsWith('.zip') ? await importZip(file, activeProject.files) : await importHtml(file, activeProject.files);
    upsertProject({ ...activeProject, files, updatedAt: Date.now() });
    pushToast('Project imported');
  };

  const shareUrl = useMemo(() => {
    if (!activeProject) return '';
    return btoa(encodeURIComponent(JSON.stringify(activeProject.files)));
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

  const swipeLanguages: Language[] = useTs ? ['html', 'css', 'typescript'] : ['html', 'css', 'javascript'];

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = end - touchStartX;
    if (Math.abs(delta) < 45) return;
    const index = swipeLanguages.indexOf(activeLanguage);
    if (delta < 0 && index < swipeLanguages.length - 1) {
      setActiveLanguage(swipeLanguages[index + 1]);
    }
    if (delta > 0 && index > 0) {
      setActiveLanguage(swipeLanguages[index - 1]);
    }
    setTouchStartX(null);
  };

  const commands: CommandItem[] = [
    { id: 'save', label: 'Save Project', onExecute: () => appBus.emit('save', undefined) },
    { id: 'run', label: 'Run Preview', onExecute: () => appBus.emit('run', undefined) },
    { id: 'format', label: 'Format Active File (Prettier)', onExecute: () => appBus.emit('format', undefined) },
    { id: 'toggle-zen', label: isZenMode ? 'Disable Zen Mode' : 'Enable Zen Mode', onExecute: () => setIsZenMode((value) => !value) },
    { id: 'layout-side', label: 'Layout: Side by Side', onExecute: () => setLayout('side-by-side') },
    { id: 'layout-preview', label: 'Layout: Preview Only', onExecute: () => setLayout('preview-only') },
    { id: 'new-template', label: 'Create Project from Selected Template', onExecute: createFromTemplate },
    { id: 'open-tour', label: 'Open Onboarding Tour', onExecute: () => setHasSeenTour(false) },
    { id: 'open-theme-builder', label: 'Open Theme Builder', onExecute: () => setIsThemeBuilderOpen(true) },
    {
      id: 'expand-emmet',
      label: 'Expand Emmet Abbreviation',
      onExecute: () => {
        const expanded = editorRef.current?.expandEmmet();
        if (!expanded) pushToast('No Emmet abbreviation found', 'error');
      },
    },
    {
      id: 'export-codepen',
      label: 'Export to CodePen',
      onExecute: () => {
        if (!activeProject) return;
        exportToCodePen(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind);
      },
    },
    {
      id: 'export-jsfiddle',
      label: 'Export to JSFiddle',
      onExecute: () => {
        if (!activeProject) return;
        exportToJSFiddle(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind);
      },
    },
    {
      id: 'export-preview-svg',
      label: 'Export Preview Screenshot (SVG)',
      onExecute: () => {
        if (!activeProject) return;
        exportPreviewScreenshotSvg(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind);
      },
    },
    {
      id: 'export-preview-pdf',
      label: 'Export Preview PDF',
      onExecute: () => {
        if (!activeProject) return;
        exportPreviewPdf(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind);
      },
    },
    {
      id: 'export-git-provider',
      label: `Open ${gitProvider} repo setup`,
      onExecute: () => {
        void prepareGitProviderExport(gitProvider, activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript');
      },
    },
    { id: 'insert-debounce', label: 'Insert Debounce Snippet', onExecute: () => editorRef.current?.insertText('const debounce = (fn, delay = 200) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };') },
  ];

  if (!activeProject) return null;

  const showEditor = layout !== 'preview-only' && !collapsedEditor && fullscreenPanel !== 'preview';
  const showPreview = layout !== 'editor-only' && !collapsedPreview && fullscreenPanel !== 'editor';
  const sideBySideResize = layout === 'side-by-side' && showEditor && showPreview;
  const topBottomResize = layout === 'top-bottom' && showEditor && showPreview;
  const themeStyle = {
    '--dml-bg': toRgbTriplet(themeSettings.bg),
    '--dml-panel': toRgbTriplet(themeSettings.panel),
    '--dml-accent': toRgbTriplet(themeSettings.accent),
    '--dml-text': toRgbTriplet(themeSettings.text),
  } as CSSProperties;

  return (
    <div className="flex h-full flex-col bg-bg text-slate-100" style={themeStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {!isZenMode ? (
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-panel px-3 py-2 text-sm">
          <h1 className="mr-3 font-semibold tracking-wide text-accent">DML Editor</h1>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setUseTailwind((v) => !v)}>Tailwind</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setUseTs((v) => !v)}>TypeScript</button>
          <select className="rounded bg-slate-800 px-2 py-1" value={stylePreprocessor} onChange={(event) => setStylePreprocessor(event.target.value as StylePreprocessor)}>
            <option value="css">CSS</option>
            <option value="scss">SCSS</option>
            <option value="less">LESS</option>
          </select>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setWordWrap((v) => !v)}>Word Wrap</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setMinimap((v) => !v)}>Minimap</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setIsZenMode((value) => !value)}>Zen</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setIsThemeBuilderOpen(true)}>Theme</button>
          <select className="rounded bg-slate-800 px-2 py-1" value={fontFamily} onChange={(event) => setFontFamily(event.target.value as (typeof fontOptions)[number])}>
            {fontOptions.map((font) => (
              <option key={font} value={font}>{font.split(',')[0]}</option>
            ))}
          </select>
          <input className="w-20 rounded bg-slate-800 px-2 py-1" type="number" min={12} max={24} value={fontSize} onChange={(event) => setFontSize(Math.max(12, Math.min(24, Number(event.target.value) || 14)))} />
          <select className="rounded bg-slate-800 px-2 py-1" value={layout} onChange={(e) => setLayout(e.target.value as LayoutMode)}>
            <option value="side-by-side">Side</option>
            <option value="top-bottom">Top Bottom</option>
            <option value="editor-only">Editor</option>
            <option value="preview-only">Preview</option>
          </select>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportSingleHtml(activeProject.files, useTs ? 'typescript' : 'javascript')}>Export HTML</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportCss(activeProject.files)}>Export CSS</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportScript(activeProject.files, useTs ? 'typescript' : 'javascript')}>Export Script</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => void exportZip(activeProject.files)}>Export ZIP</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportToCodePen(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind)}>CodePen</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportToJSFiddle(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind)}>JSFiddle</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportPreviewScreenshotSvg(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind)}>Screenshot</button>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => exportPreviewPdf(activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript', useTailwind)}>PDF</button>
          <select className="rounded bg-slate-800 px-2 py-1" value={gitProvider} onChange={(event) => setGitProvider(event.target.value as 'github' | 'gitlab' | 'bitbucket')}>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="bitbucket">Bitbucket</option>
          </select>
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => void prepareGitProviderExport(gitProvider, activeProject.name, activeProject.files, useTs ? 'typescript' : 'javascript')}>
            Open Git
          </button>
          <label className="rounded bg-slate-800 px-2 py-1">Import<input type="file" className="hidden" onChange={onFileImport} accept=".html,.zip" /></label>
          <select className="rounded bg-slate-800 px-2 py-1" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
            {templateLibrary.map((template) => (<option key={template.id} value={template.id}>{template.name}</option>))}
          </select>
          <button className="rounded bg-cyan-700 px-2 py-1" onClick={createFromTemplate}>New from Template</button>
          {canInstall ? <button className="rounded bg-cyan-700 px-2 py-1" onClick={() => void install()}>Install</button> : null}
          <button className="rounded bg-slate-800 px-2 py-1" onClick={() => navigator.clipboard.writeText(`${location.origin}?share=${shareUrl}`)}>Copy Share URL</button>
        </header>
      ) : null}

      {!isZenMode ? (
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2">
          {projects.map((project) => (
            <button key={project.id} className={`rounded px-3 py-1 text-xs ${project.id === activeProject.id ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={() => setActiveProjectId(project.id)}>{project.name}</button>
          ))}
          <button className="ml-auto rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setCollapsedEditor((v) => !v)}>{collapsedEditor ? 'Show Editor' : 'Hide Editor'}</button>
          <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setCollapsedPreview((v) => !v)}>{collapsedPreview ? 'Show Preview' : 'Hide Preview'}</button>
          <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setFullscreenPanel((v) => (v === 'editor' ? null : 'editor'))}>Editor Full</button>
          <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setFullscreenPanel((v) => (v === 'preview' ? null : 'preview'))}>Preview Full</button>
          <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => void removeActiveProject()}>Close Active</button>
        </div>
      ) : null}

      <motion.main
        className={`grid flex-1 gap-2 p-2 ${layoutClass[layout]}`}
        ref={containerRef}
        style={
          sideBySideResize
            ? { gridTemplateColumns: `${editorPreviewSplit}% 6px ${100 - editorPreviewSplit}%` }
            : topBottomResize
              ? { gridTemplateRows: `${topBottomSplit}% 6px ${100 - topBottomSplit}%` }
              : undefined
        }
      >
        {showEditor ? (
          <section className="flex min-h-0 flex-col rounded border border-slate-700">
            {!isZenMode ? <EditorTabs active={activeLanguage} onSelect={setActiveLanguage} tsEnabled={useTs} /> : null}
            <div className="min-h-0 flex-1">
              <MonacoEditorPane ref={editorRef} value={activeCode} language={activeLanguage} onChange={(value) => setFile(activeLanguage, value)} wordWrap={wordWrap} minimap={minimap} fontSize={fontSize} fontFamily={fontFamily} />
            </div>
          </section>
        ) : null}

        {sideBySideResize ? (
          <div
            className="hidden cursor-col-resize bg-slate-700 md:block"
            onMouseDown={(event) => {
              const startX = event.clientX;
              const start = editorPreviewSplit;
              const onMove = (move: MouseEvent) => {
                const delta = ((move.clientX - startX) / window.innerWidth) * 100;
                setEditorPreviewSplit(Math.max(20, Math.min(80, start + delta)));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        ) : null}

        {topBottomResize ? (
          <div
            className="cursor-row-resize bg-slate-700"
            onMouseDown={(event) => {
              const startY = event.clientY;
              const start = topBottomSplit;
              const onMove = (move: MouseEvent) => {
                const delta = ((move.clientY - startY) / window.innerHeight) * 100;
                setTopBottomSplit(Math.max(20, Math.min(80, start + delta)));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        ) : null}

        {showPreview ? (
          <section className="min-h-0 rounded border border-slate-700 bg-panel p-2">
            <PreviewPane
              key={previewNonce}
              files={activeProject.files}
              useTailwind={useTailwind}
              useTs={useTs}
              stylePreprocessor={stylePreprocessor}
              onLoad={() => {
                if (previewRunStartedAt.current !== null) {
                  setLastPreviewRenderMs(Math.round(performance.now() - previewRunStartedAt.current));
                  previewRunStartedAt.current = null;
                }
              }}
            />
          </section>
        ) : null}
      </motion.main>

      {!isZenMode ? (
        <>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 bg-panel px-3 py-1 text-xs text-slate-300">
            <span>Versions: {entries.length}</span>
            <span>Split: {split}%</span>
            <span>Editor/Preview: {editorPreviewSplit}%</span>
            {layout === 'top-bottom' ? <span>Top/Bottom: {topBottomSplit}%</span> : null}
            <span>Preview: {lastPreviewRenderMs !== null ? `${lastPreviewRenderMs}ms` : 'n/a'}</span>
            <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setIsPaletteOpen(true)}>Command Palette</button>
            <button className="rounded bg-slate-800 px-2 py-1" onClick={() => setHasSeenTour(false)}>Tour</button>
            <select className="rounded bg-slate-800 px-2 py-1" value={restoreHistoryId} onChange={(event) => setRestoreHistoryId(event.target.value)}>
              <option value="">Select snapshot</option>
              {entries.map((entry) => (<option key={entry.id} value={entry.id}>{new Date(entry.createdAt).toLocaleString()}</option>))}
            </select>
            <button className="rounded bg-slate-800 px-2 py-1" onClick={() => void restoreHistory()}>Restore</button>
          </div>
          <div className="h-1 cursor-row-resize bg-slate-700" onMouseDown={(event) => {
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
          }} />
          <div style={{ height: `${100 - split}%` }}>
            <ConsolePanel logs={consoleLogs} onClear={() => setConsoleLogs([])} />
          </div>
        </>
      ) : null}

      {!isZenMode ? (
        <div className="grid gap-2 border-t border-slate-700 bg-panel px-3 py-2 md:grid-cols-2">
          <SnippetLibrary onInsert={(code) => editorRef.current?.insertText(code)} />
          <JsReplPanel
            onLog={(message) => {
              setConsoleLogs((prev) => [
                ...prev,
                { id: crypto.randomUUID(), level: 'log', message, timestamp: Date.now() },
              ]);
            }}
          />
        </div>
      ) : null}
      <FloatingActions onRun={() => appBus.emit('run', undefined)} onSave={() => appBus.emit('save', undefined)} onSettings={() => setIsPaletteOpen(true)} />
      <MobileKeyboardToolbar
        onInsert={(text) => editorRef.current?.insertText(text)}
        onComment={() => editorRef.current?.toggleComment()}
        onEmmet={() => {
          const expanded = editorRef.current?.expandEmmet();
          if (!expanded) pushToast('No Emmet abbreviation found', 'error');
        }}
        onFormat={() => appBus.emit('format', undefined)}
        onRun={() => appBus.emit('run', undefined)}
      />
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} commands={commands} />
      <OnboardingTour isOpen={!hasSeenTour} onClose={() => { setHasSeenTour(true); }} />
      <ThemeBuilder
        isOpen={isThemeBuilderOpen}
        settings={themeSettings}
        onChange={setThemeSettings}
        onClose={() => setIsThemeBuilderOpen(false)}
        onReset={() => setThemeSettings(defaultThemeSettings)}
      />
      <ToastCenter toasts={toasts} />
    </div>
  );
}

export default App;
