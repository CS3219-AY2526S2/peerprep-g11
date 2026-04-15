import type { Question } from '@/app/questions/types';
import type { PaginatedResponse } from '@/lib/types';

export interface HistoryListItem {
  _id: string;
  partner_id: string;
  partner_username?: string;
  question: Question;
  timestamp: string;
}

export interface HistoryDetail {
  _id: string;
  session_id: string;
  partner_id: string;
  partner_username?: string;
  question: Question;
  language: string;
  code: string;
  timestamp: string;
}

export type HistoryListResponse = PaginatedResponse<HistoryListItem>;
