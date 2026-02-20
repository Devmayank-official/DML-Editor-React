import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as monaco from 'monaco-editor';
import ts from 'typescript';
import { expandEmmetAbbreviation } from '../utils/emmet';

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
  expandEmmet: () => boolean;
}

const getBraceBalanceMarker = (source: string) => {
  let depth = 0;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) return { index: i, message: 'Unexpected closing brace.' };
  }
  if (depth > 0) return { index: source.lastIndexOf('{'), message: 'Unclosed opening brace.' };
  return null;
};

const getLineAndColumn = (source: string, index: number) => {
  const safe = Math.max(0, Math.min(source.length, index));
  const lines = source.slice(0, safe).split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
};

const setRuntimeMarkers = (
  model: monaco.editor.ITextModel,
  language: MonacoEditorPaneProps['language'],
  source: string,
): void => {
  const markers: monaco.editor.IMarkerData[] = [];

  if (language === 'css') {
    const cssBalance = getBraceBalanceMarker(source);
    if (cssBalance) {
      const { line, column } = getLineAndColumn(source, cssBalance.index);
      markers.push({
        message: cssBalance.message,
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 1,
      });
    }
    monaco.editor.setModelMarkers(model, 'runtime-lint', markers);
    return;
  }

  if (language === 'html') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, 'text/html');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      markers.push({
        message: parseError.textContent?.split('\n')[0] ?? 'Invalid HTML syntax.',
        severity: monaco.MarkerSeverity.Warning,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
      });
    }
    monaco.editor.setModelMarkers(model, 'runtime-lint', markers);
    return;
  }

  try {
    if (language === 'typescript') {
      const transpileResult = ts.transpileModule(source, {
        reportDiagnostics: true,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
      });
      const diagnostics = transpileResult.diagnostics ?? [];
      diagnostics.forEach((diag) => {
        const start = diag.start ?? 0;
        const length = Math.max(1, diag.length ?? 1);
        const startPos = model.getPositionAt(start);
        const endPos = model.getPositionAt(start + length);
        markers.push({
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        });
      });
      if (markers.length === 0) {
        new Function(`"use strict"; ${transpileResult.outputText}`)();
      }
    } else {
      new Function(`"use strict"; ${source}`)();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Syntax error';
    const lineMatch = /<anonymous>:(\d+):(\d+)/.exec(String(error));
    const line = lineMatch ? Math.max(1, Number(lineMatch[1]) - 1) : 1;
    const col = lineMatch ? Math.max(1, Number(lineMatch[2])) : 1;
    markers.push({
      message,
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: line,
      startColumn: col,
      endLineNumber: line,
      endColumn: col + 1,
    });
  }

  monaco.editor.setModelMarkers(model, 'runtime-lint', markers);
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
      expandEmmet: () => {
        const editor = editorRef.current;
        if (!editor || language !== 'html') return false;
        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection) return false;

        const range = selection.isEmpty()
          ? (() => {
              const word = model.getWordAtPosition(selection.getPosition());
              if (!word) return null;
              return new monaco.Range(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn);
            })()
          : selection;

        if (!range) return false;
        const source = model.getValueInRange(range);
        const expanded = expandEmmetAbbreviation(source);
        if (!expanded) return false;

        editor.executeEdits('dml', [{ range, text: expanded, forceMoveMarkers: true }]);
        editor.focus();
        return true;
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
