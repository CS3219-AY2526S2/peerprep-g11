import type { ExplainRequest } from './explain.schema';
import type { HintsRequest } from './hints.schema';

type QuestionContextRequest = Pick<
  ExplainRequest | HintsRequest,
  'questionExamples' | 'questionConstraints'
>;

export function formatExamples(request: QuestionContextRequest): string {
  if (request.questionExamples.length === 0) {
    return 'None provided.';
  }

  return request.questionExamples
    .map((example, index) => {
      const explanation = example.explanation
        ? `Explanation: ${example.explanation}`
        : 'Explanation: Not provided.';

      return [
        `Example ${index + 1}:`,
        `Input: ${example.input}`,
        `Output: ${example.output}`,
        explanation,
      ].join('\n');
    })
    .join('\n\n');
}

export function formatConstraints(request: QuestionContextRequest): string {
  if (request.questionConstraints.length === 0) {
    return 'None provided.';
  }

  return request.questionConstraints.map((constraint) => `- ${constraint}`).join('\n');
}
