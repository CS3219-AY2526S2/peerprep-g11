import type { Difficulty } from '@/lib/types';

export type QuestionStatus = 'Completed' | 'In Review' | 'Pending';

export interface QuestionExample {
    input: string;
    output: string;
    explanation?: string;
}

export interface QuestionUpsertPayload {
    title: string;
    description: string;
    topics: string[];
    difficulty: Difficulty;
    examples: QuestionExample[];
    constraints: string[];
}

export interface QuestionUpdatePayload extends QuestionUpsertPayload {
    originalSlug: string;
}

export interface QuestionUpsertResponse {
    message: string;
    title: string;
    slug: string;
    created_at?: string;
    updated_at?: string;
}

export interface QuestionDuplicateCheckResponse {
    exists: boolean;
    matchedQuestion?: {
        title: string;
        slug: string;
    };
}

export interface AdminQuestionFormValues {
    title: string;
    difficulty: Difficulty;
    topics: string[];
    description: string;
    constraints: string[];
    examples: QuestionExample[];
}

export interface Question {
    id: string;
    title: string;
    description: string;
    topics: string[];
    difficulty: Difficulty;
    status: QuestionStatus;
    examples: QuestionExample[];
    constraints: string[];
}

export interface QuestionListElement {
    id: string;
    title: string;
    slug: string;
    topics: string[];
    difficulty: Difficulty;
    status: QuestionStatus;
}

export interface QuestionsQueryParams {
    search?: string;
    topic?: string;
    difficulty?: Difficulty;
    page?: number;
    pageSize?: number;
}

export interface DeletedQuestionSummary {
    slug: string;
    title: string;
}

export interface BulkDeleteQuestionsRequest {
    slugs: string[];
}

export interface BulkDeleteQuestionsResponse {
    deletedCount: number;
    deleted: DeletedQuestionSummary[];
    missingSlugs?: string[];
    error?: string;
}
