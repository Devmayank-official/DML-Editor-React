interface SnippetItem {
  id: string;
  name: string;
  code: string;
}

interface SnippetLibraryProps {
  onInsert: (code: string) => void;
}

const snippets: SnippetItem[] = [
  {
    id: 'fetch-json',
    name: 'Fetch JSON',
    code: "async function getData(url){ const response = await fetch(url); return response.json(); }",
  },
  {
    id: 'debounce',
    name: 'Debounce Utility',
    code: "const debounce = (fn, delay = 200) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };",
  },
  {
    id: 'observer',
    name: 'IntersectionObserver',
    code: "const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if(entry.isIntersecting){ console.log('Visible', entry.target); } }); });",
  },
];

export const SnippetLibrary = ({ onInsert }: SnippetLibraryProps) => {
  return (
    <section className="rounded border border-slate-700 bg-slate-900/80 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Snippet Library</h3>
      <div className="mt-2 grid gap-2">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            onClick={() => onInsert(snippet.code)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-left text-xs text-slate-100 hover:bg-slate-700"
          >
            {snippet.name}
          </button>
        ))}
      </div>
    </section>
  );
};
