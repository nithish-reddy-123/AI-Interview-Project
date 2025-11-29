
import React, { useState, useEffect } from 'react';
import { useInterviewState } from './hooks/useInterviewState';
import IntervieweeView from './components/IntervieweeView';
import InterviewerDashboard from './components/InterviewerDashboard';
import WelcomeBackModal from './components/WelcomeBackModal';
import type { Tab } from './types';
import { BotIcon, UserIcon } from './components/Icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('interviewee');
  const interviewState = useInterviewState();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (interviewState.pendingSessionId) {
      setShowWelcomeModal(true);
    }
  }, [interviewState.pendingSessionId]);

  const handleResume = () => {
    if (interviewState.pendingSessionId) {
      interviewState.setCurrentInterviewId(interviewState.pendingSessionId);
      setShowWelcomeModal(false);
    }
  };

  const handleStartNew = () => {
    interviewState.resetPendingSession();
    setShowWelcomeModal(false);
  };

  const currentInterview = interviewState.currentInterviewId ? interviewState.interviews[interviewState.currentInterviewId] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-20">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BotIcon className="h-8 w-8 text-cyan-400" />
              <h1 className="ml-3 text-2xl font-bold tracking-tight text-slate-200">Crisp AI Interviewer</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('interviewee')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'interviewee' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Candidate
              </button>
              <button
                onClick={() => setActiveTab('interviewer')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'interviewer' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Interviewer
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'interviewee' && (
          <IntervieweeView 
            interviewState={interviewState} 
            currentInterview={currentInterview}
            startNewInterview={interviewState.startNewInterview}
            updateCandidateInfo={interviewState.updateCandidateInfo}
            setInterviewStatus={interviewState.setInterviewStatus}
            addQuestion={interviewState.addQuestion}
            addAnswer={interviewState.addAnswer}
            updateAnswerWithScore={interviewState.updateAnswerWithScore}
            incrementQuestionIndex={interviewState.incrementQuestionIndex}
            completeInterview={interviewState.completeInterview}
          />
        )}
        {activeTab === 'interviewer' && <InterviewerDashboard interviews={interviewState.interviews} />}
      </main>

      {showWelcomeModal && (
        <WelcomeBackModal
          onResume={handleResume}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
}
