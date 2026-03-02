/**
 * Type definitions for the Questions feature.
 */

import type { Difficulty } from '@/lib/types';

export type QuestionStatus = 'Completed' | 'In Review' | 'Pending';

export interface QuestionExample {
    input: string;
    output: string;
    explanation?: string;
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

export interface QuestionsQueryParams {
    search?: string;
    topic?: string;
    difficulty?: Difficulty;
    page?: number;
    pageSize?: number;
}
