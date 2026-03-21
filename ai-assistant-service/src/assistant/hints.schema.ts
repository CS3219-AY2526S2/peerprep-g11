import { z } from 'zod';
import { assistantConfig } from './config';
import { questionExampleSchema, SUPPORTED_LANGUAGES } from './request-schema';

const hintMessageSchema = z.object({
  id: z.string().trim().min(1).max(128),
  role: z.enum(['USER', 'AI']),
  content: z.string().trim().min(1).max(assistantConfig.maxHintMessageChars),
  createdAt: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'createdAt must be a valid ISO timestamp',
  }),
});

export const hintsRequestSchema = z
  .object({
    sessionId: z.string().trim().min(1).max(128),
    questionDescription: z.string().trim().max(assistantConfig.maxInputChars),
    questionExamples: z.array(questionExampleSchema).max(8),
    questionConstraints: z.array(z.string().trim().min(1).max(500)).max(20),
    language: z.enum(SUPPORTED_LANGUAGES),
    fullCode: z.string().trim().min(1).max(assistantConfig.maxInputChars),
    messages: z.array(hintMessageSchema).min(1).max(assistantConfig.maxHintMessages),
  })
  .superRefine((value, ctx) => {
    const transcriptLength = value.messages.reduce(
      (total, message) => total + message.content.length,
      0
    );

    if (transcriptLength > assistantConfig.maxHintTranscriptChars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['messages'],
        message: 'Hint transcript is too large',
      });
    }

    const combinedLength =
      value.questionDescription.length +
      value.fullCode.length +
      transcriptLength +
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
        path: ['messages'],
        message: 'Combined hints payload is too large',
      });
    }

    if (value.messages[value.messages.length - 1]?.role !== 'USER') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['messages'],
        message: 'The last hint message must come from the user',
      });
    }
  });

export type HintsRequest = z.infer<typeof hintsRequestSchema>;
