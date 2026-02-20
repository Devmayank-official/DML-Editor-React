import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface MonacoEditorPaneProps {
  value: string;
  language: 'html' | 'css' | 'javascript' | 'typescript';
  onChange: (value: string) => void;
  wordWrap: boolean;
  minimap: boolean;
  fontSize: number;
  fontFamily: string;
}

export interface MonacoEditorHandle {
  toggleComment: () => void;
  formatDocument: () => void;
  insertText: (text: string) => void;
}

const setRuntimeMarkers = (
  model: monaco.editor.ITextModel,
  language: MonacoEditorPaneProps['language'],
  source: string,
): void => {
  if (language !== 'javascript' && language !== 'typescript') {
    monaco.editor.setModelMarkers(model, 'runtime-lint', []);
    return;
  }

  try {
    if (language === 'typescript') {
      new Function(`"use strict"; (async () => { ${source}\n})();`)();
    } else {
      new Function(`"use strict"; ${source}`)();
    }
    monaco.editor.setModelMarkers(model, 'runtime-lint', []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Syntax error';
    const lineMatch = /<anonymous>:(\d+):(\d+)/.exec(String(error));
    const line = lineMatch ? Math.max(1, Number(lineMatch[1]) - 1) : 1;
    const col = lineMatch ? Math.max(1, Number(lineMatch[2])) : 1;
    monaco.editor.setModelMarkers(model, 'runtime-lint', [
      {
        message,
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: col + 1,
      },
    ]);
  }
};

export const MonacoEditorPane = forwardRef<MonacoEditorHandle, MonacoEditorPaneProps>(
  ({ value, language, onChange, wordWrap, minimap, fontSize, fontFamily }, ref) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      toggleComment: () => {
        editorRef.current?.trigger('dml', 'editor.action.commentLine', undefined);
      },
      formatDocument: () => {
        editorRef.current?.trigger('dml', 'editor.action.formatDocument', undefined);
      },
      insertText: (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        const selection = editor.getSelection();
        if (!selection) return;
        editor.executeEdits('dml', [{ range: selection, text, forceMoveMarkers: true }]);
        editor.focus();
      },
    }));

    useEffect(() => {
      if (!hostRef.current) return;
      editorRef.current = monaco.editor.create(hostRef.current, {
        value,
        language,
        theme: 'vs-dark',
        minimap: { enabled: minimap },
        wordWrap: wordWrap ? 'on' : 'off',
        automaticLayout: true,
        fontSize,
        fontFamily,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
      });
      const dispose = editorRef.current.onDidChangeModelContent(() => {
        const next = editorRef.current?.getValue() ?? '';
        if (next !== value) onChange(next);
      });
      return () => {
        dispose.dispose();
        editorRef.current?.dispose();
      };
    }, []);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;
      monaco.editor.setModelLanguage(model, language);
      setRuntimeMarkers(model, language, model.getValue());
    }, [language]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      if (editor.getValue() !== value) {
        editor.setValue(value);
      }
      const model = editor.getModel();
      if (!model) return;
      setRuntimeMarkers(model, language, editor.getValue());
    }, [value, language]);

    useEffect(() => {
      editorRef.current?.updateOptions({
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: minimap },
        fontSize,
        fontFamily,
      });
    }, [wordWrap, minimap, fontSize, fontFamily]);

    return <div ref={hostRef} className="h-full w-full" />;
  },
);

MonacoEditorPane.displayName = 'MonacoEditorPane';
