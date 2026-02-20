import type { Language } from '../types/project';

interface EditorTabsProps {
  active: Language;
  onSelect: (language: Language) => void;
  tsEnabled: boolean;
}

export const EditorTabs = ({ active, onSelect, tsEnabled }: EditorTabsProps) => {
  const tabs: Language[] = ['html', 'css', tsEnabled ? 'typescript' : 'javascript'];
  return (
    <div className="flex gap-2 border-b border-slate-700 bg-panel p-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`rounded px-3 py-1 text-sm ${active === tab ? 'bg-slate-700 text-accent' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
