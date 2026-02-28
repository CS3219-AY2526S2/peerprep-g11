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
