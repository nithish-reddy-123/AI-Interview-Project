
export type Tab = 'interviewee' | 'interviewer';

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export type Question = {
  id: string;
  text: string;
  difficulty: Difficulty;
  timeLimit: number;
};

export type Answer = {
  questionId: string;
  text: string;
  score?: number;
  feedback?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: {
    name: string;
    type: string;
    content: string; // base64
  };
};

export type InterviewStatus = 'not-started' | 'info-gathering' | 'in-progress' | 'completed';

export type InterviewSession = {
  id: string;
  candidate: Candidate;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  status: InterviewStatus;
  finalScore?: number;
  finalSummary?: string;
  startTime: number;
};
