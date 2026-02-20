import { useMemo } from 'react';
import { composePreviewDocument } from './composePreviewDocument';
import type { ProjectFiles } from '../types/project';

interface PreviewPaneProps {
  files: ProjectFiles;
  useTailwind: boolean;
  useTs: boolean;
}

export const PreviewPane = ({ files, useTailwind, useTs }: PreviewPaneProps) => {
  const srcDoc = useMemo(() => composePreviewDocument(files, useTailwind, useTs), [files, useTailwind, useTs]);

  return (
    <iframe
      title="preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      className="h-full w-full rounded-md border border-slate-700 bg-white"
      referrerPolicy="no-referrer"
    />
  );
};
