
import { useState, useEffect, useCallback } from 'react';
import type { InterviewSession, Candidate, InterviewStatus, Question, Answer } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export const useInterviewState = () => {
  const [interviews, setInterviews] = useState<Record<string, InterviewSession>>({});
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData: Record<string, InterviewSession> = JSON.parse(savedData);
        setInterviews(parsedData);
        const pendingSession = Object.values(parsedData).find(
          (session) => session.status !== 'completed' && session.status !== 'not-started'
        );
        if (pendingSession) {
          setPendingSessionId(pendingSession.id);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (Object.keys(interviews).length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(interviews));
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [interviews]);

  const updateInterview = useCallback((id: string, updates: Partial<InterviewSession>) => {
    setInterviews(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], ...updates },
      };
    });
  }, []);

  const startNewInterview = useCallback((candidate: Partial<Candidate> & { resumeFile: NonNullable<Candidate['resumeFile']> }) => {
    const id = uuidv4();
    const newInterview: InterviewSession = {
      id,
      candidate: {
        id: candidate.id || uuidv4(),
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        resumeFile: candidate.resumeFile,
      },
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      status: 'info-gathering',
      startTime: Date.now(),
    };
    setInterviews(prev => ({ ...prev, [id]: newInterview }));
    setCurrentInterviewId(id);
    return id;
  }, []);

  const setInterviewStatus = useCallback((id: string, status: InterviewStatus) => {
    updateInterview(id, { status });
  }, [updateInterview]);

  const updateCandidateInfo = useCallback((id: string, info: Partial<Candidate>) => {
    setInterviews(prev => {
        if (!prev[id]) return prev;
        return {
            ...prev,
            [id]: { ...prev[id], candidate: { ...prev[id].candidate, ...info } },
        };
    });
  }, []);

  const addQuestion = useCallback((id: string, question: Question) => {
    setInterviews(prev => {
        if (!prev[id]) return prev;
        return {
            ...prev,
            [id]: { ...prev[id], questions: [...prev[id].questions, question] },
        };
    });
  }, []);
  
  const addAnswer = useCallback((id: string, answer: Answer) => {
      setInterviews(prev => {
          if (!prev[id]) return prev;
          return {
              ...prev,
              [id]: { ...prev[id], answers: [...prev[id].answers, answer] },
          };
      });
  }, []);

  const updateAnswerWithScore = useCallback((id: string, questionId: string, score: number, feedback: string) => {
    setInterviews(prev => {
        if (!prev[id]) return prev;
        const updatedAnswers = prev[id].answers.map(ans => 
            ans.questionId === questionId ? { ...ans, score, feedback } : ans
        );
        return {
            ...prev,
            [id]: { ...prev[id], answers: updatedAnswers },
        };
    });
  }, []);

  const incrementQuestionIndex = useCallback((id: string) => {
    setInterviews(prev => {
        if (!prev[id]) return prev;
        return {
            ...prev,
            [id]: { ...prev[id], currentQuestionIndex: prev[id].currentQuestionIndex + 1 },
        };
    });
  }, []);

  const completeInterview = useCallback((id: string, finalScore: number, finalSummary: string) => {
    updateInterview(id, { status: 'completed', finalScore, finalSummary });
    setCurrentInterviewId(null);
  }, [updateInterview]);

  const resetPendingSession = useCallback(() => {
    if (pendingSessionId) {
        setInterviews(prev => {
            const newInterviews = { ...prev };
            delete newInterviews[pendingSessionId];
            return newInterviews;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(interviews));
    }
    setPendingSessionId(null);
    setCurrentInterviewId(null);
  }, [pendingSessionId, interviews]);

  return {
    interviews,
    currentInterviewId,
    setCurrentInterviewId,
    pendingSessionId,
    resetPendingSession,
    startNewInterview,
    setInterviewStatus,
    updateCandidateInfo,
    addQuestion,
    addAnswer,
    updateAnswerWithScore,
    incrementQuestionIndex,
    completeInterview,
  };
};
