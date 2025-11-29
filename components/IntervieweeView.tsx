
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { InterviewSession, Candidate, Question, Answer, InterviewStatus } from '../types';
import { extractInfoFromResume, generateQuestion, evaluateAnswer, generateFinalSummary } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { v4 as uuidv4 } from 'uuid';
import { INTERVIEW_FLOW, TOTAL_QUESTIONS } from '../constants';
import { BotIcon, CheckCircleIcon, LoadingSpinner, SendIcon, UploadIcon, UserIcon } from './Icons';
import ChatBubble from './ChatBubble';
import Timer from './Timer';

type IntervieweeViewProps = {
  interviewState: any;
  currentInterview: InterviewSession | null;
  startNewInterview: (candidate: Partial<Candidate> & { resumeFile: NonNullable<Candidate['resumeFile']> }) => string;
  updateCandidateInfo: (id: string, info: Partial<Candidate>) => void;
  setInterviewStatus: (id: string, status: InterviewStatus) => void;
  addQuestion: (id: string, question: Question) => void;
  addAnswer: (id: string, answer: Answer) => void;
  updateAnswerWithScore: (id: string, questionId: string, score: number, feedback: string) => void;
  incrementQuestionIndex: (id: string) => void;
  completeInterview: (id: string, finalScore: number, finalSummary: string) => void;
};

const ResumeUpload = ({ onUpload }: { onUpload: (file: File) => void }) => {
  const [dragging, setDragging] = useState(false);
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <label
        htmlFor="resume-upload"
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${dragging ? 'border-cyan-400 bg-slate-800' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
          <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-slate-500">PDF or DOCX</p>
        </div>
        <input id="resume-upload" type="file" className="hidden" onChange={handleChange} accept=".pdf,.docx" />
      </label>
    </div>
  );
};

export default function IntervieweeView({
  currentInterview, startNewInterview, updateCandidateInfo, setInterviewStatus,
  addQuestion, addAnswer, updateAnswerWithScore, incrementQuestionIndex, completeInterview
}: IntervieweeViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingInfo, setMissingInfo] = useState<('name' | 'email' | 'phone')[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentInterview?.questions, currentInterview?.answers, isLoading]);

  const handleResumeUpload = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      setError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fileContent = await fileToBase64(file);
      const resumeFile = { name: file.name, type: file.type, content: fileContent };
      
      const extractedInfo = await extractInfoFromResume(fileContent, file.type);
      const newInterviewId = startNewInterview({ ...extractedInfo, resumeFile });

      const missing = (['name', 'email', 'phone'] as const).filter(field => !extractedInfo[field]);
      if (missing.length > 0) {
        setMissingInfo(missing);
        updateCandidateInfo(newInterviewId, extractedInfo);
        setInterviewStatus(newInterviewId, 'info-gathering');
      } else {
        updateCandidateInfo(newInterviewId, extractedInfo);
        setInterviewStatus(newInterviewId, 'in-progress');
        // Start interview
        generateNextQuestion(newInterviewId, []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to process resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissingInfoSubmit = (info: string) => {
    if (!currentInterview || missingInfo.length === 0) return;
    const fieldToUpdate = missingInfo[0];
    updateCandidateInfo(currentInterview.id, { [fieldToUpdate]: info });
    
    const remainingMissing = missingInfo.slice(1);
    setMissingInfo(remainingMissing);

    if (remainingMissing.length === 0) {
        setIsLoading(true);
        setInterviewStatus(currentInterview.id, 'in-progress');
        generateNextQuestion(currentInterview.id, []);
    }
    setCurrentAnswer('');
  };

  const generateNextQuestion = useCallback(async (interviewId: string, existingQs: Question[]) => {
    setIsLoading(true);
    let difficultyIndex = 0;
    let countInStage = existingQs.length;
    
    for(const stage of INTERVIEW_FLOW) {
      if (countInStage < stage.count) break;
      countInStage -= stage.count;
      difficultyIndex++;
    }

    const { difficulty, time } = INTERVIEW_FLOW[difficultyIndex];
    const questionText = await generateQuestion(difficulty, existingQs.map(q => q.text));

    const newQuestion: Question = {
      id: uuidv4(),
      text: questionText,
      difficulty: difficulty,
      timeLimit: time
    };
    addQuestion(interviewId, newQuestion);
    setIsLoading(false);
  }, [addQuestion]);

  const handleAnswerSubmit = useCallback(async (answerText: string) => {
    if (!currentInterview || isLoading) return;

    const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex];
    if(!currentQuestion) return;

    setIsLoading(true);
    setCurrentAnswer('');

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      text: answerText || 'No answer submitted.'
    };
    addAnswer(currentInterview.id, newAnswer);

    const { score, feedback } = await evaluateAnswer(currentQuestion.text, newAnswer.text);
    updateAnswerWithScore(currentInterview.id, currentQuestion.id, score, feedback);
    
    incrementQuestionIndex(currentInterview.id);
    
    const nextIndex = currentInterview.currentQuestionIndex + 1;
    if (nextIndex < TOTAL_QUESTIONS) {
        generateNextQuestion(currentInterview.id, currentInterview.questions);
    } else {
        const { finalScore, summary } = await generateFinalSummary({
            ...currentInterview,
            answers: [...currentInterview.answers, {...newAnswer, score, feedback}]
        });
        completeInterview(currentInterview.id, finalScore, summary);
        setIsLoading(false);
    }
  }, [currentInterview, isLoading, addAnswer, evaluateAnswer, updateAnswerWithScore, incrementQuestionIndex, generateNextQuestion, completeInterview]);

  if (isLoading && !currentInterview) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoadingSpinner className="w-12 h-12 text-cyan-400 animate-spin" />
        <p className="mt-4 text-slate-400">Analyzing your resume...</p>
      </div>
    );
  }

  if (!currentInterview) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-center mb-4">Start Your AI Interview</h2>
        <p className="text-center text-slate-400 mb-8">Upload your resume to begin. We'll extract your details and get started.</p>
        <ResumeUpload onUpload={handleResumeUpload} />
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    );
  }

  const { status, candidate, questions, answers, currentQuestionIndex } = currentInterview;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto bg-slate-800 rounded-lg shadow-2xl">
        <div className="flex-grow p-6 overflow-y-auto">
            <ChatBubble role="assistant" message={`Hello ${candidate.name || 'there'}! Welcome to the interview.`} />
            {status === 'info-gathering' && missingInfo.length > 0 && 
                <ChatBubble role="assistant" message={`It seems I'm missing your ${missingInfo[0]}. Could you please provide it?`} />
            }

            {questions.map((q, index) => (
                <div key={q.id}>
                    <ChatBubble role="assistant" message={q.text} />
                    {answers[index] && <ChatBubble role="user" message={answers[index].text} />}
                    {answers[index]?.score !== undefined && (
                        <ChatBubble role="assistant" message={`Score: ${answers[index].score}/10. Feedback: ${answers[index].feedback}`} />
                    )}
                </div>
            ))}
            {isLoading && status !== 'completed' && <ChatBubble role="assistant" isLoading={true} />}

            {status === 'completed' && (
              <>
                <ChatBubble role="assistant" message={`Thank you for completing the interview! Here is your summary.`} />
                <div className="my-4 p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-lg text-cyan-400">Final Score: {currentInterview.finalScore}/100</h3>
                    <p className="text-slate-300 mt-2">{currentInterview.finalSummary}</p>
                </div>
              </>
            )}
            <div ref={chatEndRef} />
        </div>
        
        { (status === 'in-progress' || status === 'info-gathering') && (
            <div className="border-t border-slate-700 p-4 bg-slate-900/50 rounded-b-lg">
                {status === 'in-progress' && currentQuestion && (
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">
                            Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS} ({currentQuestion.difficulty})
                        </div>
                        <Timer
                          key={currentQuestion.id}
                          duration={currentQuestion.timeLimit}
                          onTimeout={() => handleAnswerSubmit(currentAnswer)}
                        />
                    </div>
                )}
                 <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !isLoading) {
                            status === 'info-gathering' ? handleMissingInfoSubmit(currentAnswer) : handleAnswerSubmit(currentAnswer);
                          }
                        }}
                        placeholder={
                            status === 'info-gathering'
                            ? `Enter your ${missingInfo[0]}...`
                            : "Type your answer..."
                        }
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => status === 'info-gathering' ? handleMissingInfoSubmit(currentAnswer) : handleAnswerSubmit(currentAnswer)}
                        disabled={isLoading || !currentAnswer.trim()}
                        className="bg-cyan-500 text-white p-2 rounded-md hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}
    </div>
  )
}
