import { z } from 'zod';
import { assistantConfig } from './config';
import { questionExampleSchema, SUPPORTED_LANGUAGES } from './request-schema';

export const translateRequestSchema = z
  .object({
    sessionId: z.string().trim().min(1).max(128),
    questionDescription: z.string().trim().max(assistantConfig.maxInputChars),
    questionExamples: z.array(questionExampleSchema).max(8),
    questionConstraints: z.array(z.string().trim().min(1).max(500)).max(20),
    language: z.enum(SUPPORTED_LANGUAGES),
    targetLanguage: z.enum(SUPPORTED_LANGUAGES),
    fullCode: z.string().trim().min(1).max(assistantConfig.maxInputChars),
  })
  .superRefine((value, ctx) => {
    if (value.language === value.targetLanguage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetLanguage'],
        message: 'Target language must be different from the source language',
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
        message: 'Combined translate payload is too large',
      });
    }
  });

export type TranslateRequest = z.infer<typeof translateRequestSchema>;
