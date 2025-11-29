
import { Difficulty } from './types';

export const LOCAL_STORAGE_KEY = 'crisp-ai-interviews';

export const INTERVIEW_FLOW = [
  { difficulty: Difficulty.Easy, count: 2, time: 20 },
  { difficulty: Difficulty.Medium, count: 2, time: 60 },
  { difficulty: Difficulty.Hard, count: 2, time: 120 },
];

export const TOTAL_QUESTIONS = INTERVIEW_FLOW.reduce((sum, stage) => sum + stage.count, 0);
