import { useEffect, useState } from 'react';
import { composePreviewDocument } from './composePreviewDocument';
import type { ProjectFiles, StylePreprocessor } from '../types/project';

interface PreviewPaneProps {
  files: ProjectFiles;
  useTailwind: boolean;
  useTs: boolean;
  stylePreprocessor: StylePreprocessor;
  onLoad?: () => void;
}

export const PreviewPane = ({ files, useTailwind, useTs, stylePreprocessor, onLoad }: PreviewPaneProps) => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    let active = true;
    void composePreviewDocument(files, useTailwind, useTs, stylePreprocessor).then((document) => {
      if (!active) return;
      setSrcDoc(document);
    });
    return () => {
      active = false;
    };
  }, [files, stylePreprocessor, useTailwind, useTs]);

  return (
    <iframe
      title="preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      className="h-full w-full rounded-md border border-slate-700 bg-white"
      referrerPolicy="no-referrer"
      onLoad={onLoad}
    />
  );
};
