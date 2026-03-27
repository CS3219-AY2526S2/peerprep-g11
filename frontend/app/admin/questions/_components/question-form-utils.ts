import { z } from 'zod';
import type {
  AdminQuestionFormValues,
  Question,
  QuestionExample,
  QuestionUpsertPayload,
} from '@/app/questions/types';

export const adminQuestionExampleSchema = z.object({
  input: z.string().trim().min(1, 'Input is required'),
  output: z.string().trim().min(1, 'Output is required'),
  explanation: z.string().optional(),
});

export const adminQuestionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
    error: 'Select a difficulty',
  }),
  topics: z.array(z.string().trim().min(1, 'Topic is required')).min(1, 'Add at least one topic'),
  description: z.string().trim().min(1, 'Description is required'),
  constraints: z
    .array(z.string().trim().min(1, 'Constraint is required'))
    .min(1, 'Add at least one constraint'),
  examples: z.array(adminQuestionExampleSchema).min(1, 'Add at least one example'),
});

export const DEFAULT_ADMIN_QUESTION_FORM_VALUES: AdminQuestionFormValues = {
  title: '',
  difficulty: 'Easy',
  topics: [],
  description: '',
  constraints: [''],
  examples: [{ input: '', output: '', explanation: '' }],
};

export function normalizeAdminQuestionPayload(
  values: AdminQuestionFormValues
): QuestionUpsertPayload {
  return {
    title: values.title.trim(),
    difficulty: values.difficulty,
    description: values.description.trim(),
    topics: values.topics.map((topic) => topic.trim()).filter(Boolean),
    constraints: values.constraints.map((constraint) => constraint.trim()).filter(Boolean),
    examples: values.examples
      .map((example) => ({
        input: example.input.trim(),
        output: example.output.trim(),
        explanation: example.explanation?.trim() || undefined,
      }))
      .filter((example) => example.input || example.output || example.explanation),
  };
}

export function canRenderQuestionPreview(values: AdminQuestionFormValues) {
  return Boolean(
    values.title.trim() ||
      values.description.trim() ||
      values.topics.some((topic) => topic.trim()) ||
      values.constraints.some((constraint) => constraint.trim()) ||
      values.examples.some(
        (example) =>
          example.input.trim() || example.output.trim() || (example.explanation?.trim() ?? '')
      )
  );
}

export function buildPreviewQuestion(values: AdminQuestionFormValues): Question {
  const examples = values.examples
    .map<QuestionExample>((example) => ({
      input: example.input.trim(),
      output: example.output.trim(),
      explanation: example.explanation?.trim() || undefined,
    }))
    .filter((example) => example.input || example.output || example.explanation);

  return {
    id: 'preview',
    title: values.title.trim() || 'Untitled Question',
    description: values.description.trim(),
    topics: values.topics.map((topic) => topic.trim()).filter(Boolean),
    difficulty: values.difficulty,
    status: 'Pending',
    constraints: values.constraints.map((constraint) => constraint.trim()).filter(Boolean),
    examples,
  };
}

export function buildAdminQuestionFormValues(question: Question): AdminQuestionFormValues {
  return {
    title: question.title,
    difficulty: question.difficulty,
    topics: question.topics.length > 0 ? question.topics : [],
    description: question.description,
    constraints: question.constraints.length > 0 ? question.constraints : [''],
    examples:
      question.examples.length > 0
        ? question.examples.map((example) => ({
            input: example.input,
            output: example.output,
            explanation: example.explanation ?? '',
          }))
        : [{ input: '', output: '', explanation: '' }],
  };
}

export function normalizeTopicValue(topic: string) {
  return topic.trim().toLowerCase();
}
