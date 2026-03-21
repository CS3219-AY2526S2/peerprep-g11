import { z } from 'zod';

export const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java'] as const;

export const questionExampleSchema = z.object({
  input: z.string().trim().min(1).max(2000),
  output: z.string().trim().min(1).max(2000),
  explanation: z.string().trim().min(1).max(4000).optional(),
});
