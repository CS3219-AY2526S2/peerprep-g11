import type { ProgrammingLanguage } from '@/lib/programming-languages';

export type SessionLanguage = ProgrammingLanguage;

export type ParticipantPresence = 'connected' | 'disconnected';

export interface SessionParticipant {
  id: string;
  username: string;
  isCurrentUser: boolean;
  presence: ParticipantPresence;
}

export interface SessionDetails {
  sessionId: string;
  questionId: string;
  status: 'active';
  selectedLanguage: SessionLanguage;
  allowedLanguages: SessionLanguage[];
  starterCode: Record<SessionLanguage, string>;
  participants: SessionParticipant[];
}

export interface LeaveSessionResponse {
  sessionId: string;
  status: 'left';
  redirectTo: '/dashboard';
}

export type AiTab = 'explain' | 'hints';
export type AiFeature = AiTab;
export type AiStreamFinishReason = 'stop' | 'length' | 'refusal';

export interface ExplainEntry {
  id: string;
  selectedCode: string;
  language: string;
  response: string | null;
  createdAt: string;
}

export type HintMessageRole = 'USER' | 'AI';
export type HintMessageStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface HintMessage {
  id: string;
  role: HintMessageRole;
  content: string;
  createdAt: string;
  status: HintMessageStatus;
  requestId?: string;
  finishReason?: AiStreamFinishReason;
}

export interface AiStreamMetaEvent {
  requestId: string;
  feature: AiFeature;
}

export interface AiStreamChunkEvent {
  delta: string;
}

export interface AiStreamDoneEvent {
  finishReason: AiStreamFinishReason;
}

export interface AiStreamErrorEvent {
  message: string;
}
