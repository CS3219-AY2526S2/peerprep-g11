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
