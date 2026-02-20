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
}

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
      monaco.editor.setModelLanguage(editor.getModel()!, language);
    }, [language]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      if (editor.getValue() !== value) {
        editor.setValue(value);
      }
    }, [value]);

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
