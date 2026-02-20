import type { StylePreprocessor } from '../types/project';

interface CompileResult {
  css: string;
  error?: string;
}

const compileScss = async (source: string): Promise<CompileResult> => {
  try {
    const sass = await import('sass');
    const output = sass.compileString(source, { style: 'expanded' });
    return { css: output.css };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SCSS compilation failed.';
    return { css: '', error: message };
  }
};

const compileLess = async (source: string): Promise<CompileResult> => {
  try {
    const lessModule = await import('less');
    const output = await lessModule.render(source, { javascriptEnabled: true });
    return { css: output.css };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LESS compilation failed.';
    return { css: '', error: message };
  }
};

export const compileStyles = async (source: string, preprocessor: StylePreprocessor): Promise<CompileResult> => {
  if (preprocessor === 'css') return { css: source };
  if (preprocessor === 'scss') return compileScss(source);
  return compileLess(source);
};
