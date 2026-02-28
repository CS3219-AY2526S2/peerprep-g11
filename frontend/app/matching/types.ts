/**
 * Type definitions for the Matching feature.
 */

import type { Difficulty } from '@/lib/types';

export type MatchRequestStatus = 'pending' | 'matched' | 'timed_out' | 'cancelled';

export interface MatchingPreferences {
    topic: string;
    difficulty: Difficulty;
    language: string;
}

export interface MatchRequest {
    requestId: string;
    status: MatchRequestStatus;
    preferences: MatchingPreferences;
    matchId?: string; // present when status === 'matched'
    partnerName?: string; // present when status === 'matched'
}

/** Maximum time (seconds) before a match request times out */
export const MATCH_TIMEOUT_SECONDS = 120;
