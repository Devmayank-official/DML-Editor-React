import type { Language } from '../types/project';

type PrettierModule = {
  format: (source: string, options: Record<string, unknown>) => Promise<string>;
};

const languageToParser: Record<Language, string> = {
  html: 'html',
  css: 'css',
  javascript: 'babel',
  typescript: 'babel-ts',
};

export const formatWithPrettier = async (source: string, language: Language): Promise<string> => {
  const parser = languageToParser[language];

  try {
    const [prettier, babel, estree, html, postcss] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
      import('prettier/plugins/html'),
      import('prettier/plugins/postcss'),
    ]);

    return (prettier as PrettierModule).format(source, {
      parser,
      plugins: [babel, estree, html, postcss],
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
    });
  } catch {
    return source;
  }
};
