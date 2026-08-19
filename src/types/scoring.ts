export interface Criteria {
  id: string;
  name: string;
  maxScore: number;
}

export interface Participant {
  id: string;
  code: string;
  name: string;
  rt?: string;
  isAttending?: boolean;
}

export interface Judge {
  id: string;
  code: string;
  name: string;
  pin: string;
}

export interface EventInfo {
  eventName: string;
  location: string;
  competitionTitle: string;
  subtitle: string;
  organizer: string;
  approver: string;
  adminPin: string;
  isSystemLocked?: boolean;
}

export type UserRole = 'guest' | 'juri' | 'admin';

export interface AuthState {
  role: UserRole;
  judgeId?: string;
  judgeName?: string;
}

// Scores structure: judgeScores[judgeId][participantId][criteriaId] = number
export interface JudgeScores {
  [participantId: string]: {
    scores: { [criteriaId: string]: number };
    notes?: string;
  };
}

export interface AllScores {
  [judgeId: string]: JudgeScores;
}

export interface JudgeGeneralNotes {
  [judgeId: string]: string;
}

export interface ParticipantRecap {
  participantId: string;
  participantCode: string;
  participantName: string;
  participantRt?: string;
  isAttending?: boolean;
  scoresByJudge: { [judgeId: string]: number | 'N/A' };
  totalScore: number;
  validJudgeCount: number;
  averageScore: number;
  rank: number;
}
