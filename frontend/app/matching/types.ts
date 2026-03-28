import type { Difficulty } from '@/lib/types';
import type { ProgrammingLanguage } from '@/lib/programming-languages';

export type MatchRequestStatus = 'pending' | 'matched' | 'timed_out' | 'cancelled';

export interface MatchingPreferences {
    topic: string;
    difficulty: Difficulty;
    language: ProgrammingLanguage;
}

export interface MatchRequest {
    requestId: string;
    status: MatchRequestStatus;
    preferences: MatchingPreferences;
    // These fields are only available after a match is found.
    matchId?: string;
    partnerName?: string;
    partnerId?: string;
    questionSlug?: string;
}

// Backend timeout window, in seconds.
export const MATCH_TIMEOUT_SECONDS = 120;
