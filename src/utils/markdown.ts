const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const inline = (source: string): string =>
  source
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

export const renderMarkdownToHtml = (markdown: string): string => {
  const lines = markdown.split('\n');
  const output: string[] = [];
  let listOpen = false;

  lines.forEach((line) => {
    const safe = escapeHtml(line.trim());
    if (!safe) {
      if (listOpen) {
        output.push('</ul>');
        listOpen = false;
      }
      return;
    }

    if (safe.startsWith('### ')) {
      if (listOpen) {
        output.push('</ul>');
        listOpen = false;
      }
      output.push(`<h3>${inline(safe.slice(4))}</h3>`);
      return;
    }

    if (safe.startsWith('## ')) {
      if (listOpen) {
        output.push('</ul>');
        listOpen = false;
      }
      output.push(`<h2>${inline(safe.slice(3))}</h2>`);
      return;
    }

    if (safe.startsWith('# ')) {
      if (listOpen) {
        output.push('</ul>');
        listOpen = false;
      }
      output.push(`<h1>${inline(safe.slice(2))}</h1>`);
      return;
    }

    if (safe.startsWith('- ')) {
      if (!listOpen) {
        output.push('<ul>');
        listOpen = true;
      }
      output.push(`<li>${inline(safe.slice(2))}</li>`);
      return;
    }

    if (listOpen) {
      output.push('</ul>');
      listOpen = false;
    }

    output.push(`<p>${inline(safe)}</p>`);
  });

  if (listOpen) {
    output.push('</ul>');
  }

  return output.join('');
};
