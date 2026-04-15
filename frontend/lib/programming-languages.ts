export const PROGRAMMING_LANGUAGES = [
  'python',
  'java',
  'javascript',
] as const;

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number];

export const PROGRAMMING_LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  python: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
};

export function normalizeProgrammingLanguage(
  language: string | null | undefined
): ProgrammingLanguage | null {
  if (typeof language !== 'string') {
    return null;
  }

  const compactLanguage = language.trim().toLowerCase().replace(/[\s_-]+/g, '');

  switch (compactLanguage) {
    case 'python':
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'javascript':
    case 'js':
      return 'javascript';
    default:
      return null;
  }
}

export function coerceProgrammingLanguage(
  language: string | null | undefined,
  fallback: ProgrammingLanguage = 'python'
): ProgrammingLanguage {
  return normalizeProgrammingLanguage(language) ?? fallback;
}
