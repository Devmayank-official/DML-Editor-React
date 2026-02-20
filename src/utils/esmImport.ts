const normalizeIdentifier = (input: string): string => input.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[^a-zA-Z_$]/, '_$&');

export const buildEsmImportUrl = (packageName: string): string => {
  const trimmed = packageName.trim();
  if (!trimmed) return '';
  const normalized = trimmed.replace(/^https?:\/\/esm\.sh\//, '');
  return `https://esm.sh/${normalized}`;
};

export const buildEsmImportSnippet = (packageName: string, exportedName = ''): string => {
  const url = buildEsmImportUrl(packageName);
  if (!url) return '';

  if (!exportedName.trim()) {
    const fallback = packageName.split('/').pop() ?? 'module';
    const binding = normalizeIdentifier(fallback);
    return `import ${binding} from '${url}';\n`;
  }

  const binding = normalizeIdentifier(exportedName.trim());
  return `import { ${binding} } from '${url}';\n`;
};
