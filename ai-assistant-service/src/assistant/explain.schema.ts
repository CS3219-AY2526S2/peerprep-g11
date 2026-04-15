import { z } from 'zod';
import { assistantConfig } from './config';
import { questionExampleSchema, SUPPORTED_LANGUAGES } from './request-schema';

export const explainRequestSchema = z
  .object({
    sessionId: z.string().trim().min(1).max(128),
    questionDescription: z.string().trim().max(assistantConfig.maxInputChars),
    questionExamples: z.array(questionExampleSchema).max(8),
    questionConstraints: z.array(z.string().trim().min(1).max(500)).max(20),
    language: z.enum(SUPPORTED_LANGUAGES),
    fullCode: z.string().trim().min(1).max(assistantConfig.maxInputChars),
    selectedCode: z.string().trim().min(1).max(assistantConfig.maxSelectedChars),
  })
  .superRefine((value, ctx) => {
    if (!value.fullCode.includes(value.selectedCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedCode'],
        message: 'selectedCode must be present within fullCode',
      });
    }

    const combinedLength =
      value.questionDescription.length +
      value.fullCode.length +
      value.questionExamples.reduce(
        (total, example) =>
          total +
          example.input.length +
          example.output.length +
          (example.explanation?.length ?? 0),
        0
      ) +
      value.questionConstraints.reduce(
        (total, constraint) => total + constraint.length,
        0
      );

    if (combinedLength > assistantConfig.maxInputChars * 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullCode'],
        message: 'Combined explain payload is too large',
      });
    }
  });

export type ExplainRequest = z.infer<typeof explainRequestSchema>;
