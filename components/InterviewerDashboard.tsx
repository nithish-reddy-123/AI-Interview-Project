
import React, { useState, useMemo } from 'react';
import type { InterviewSession } from '../types';

const CandidateDetail = ({ session, onBack }: { session: InterviewSession; onBack: () => void }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in">
      <button onClick={onBack} className="mb-6 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors">&larr; Back to List</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900/50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-cyan-400">{session.candidate.name}</h2>
          <p className="text-slate-400">{session.candidate.email}</p>
          <p className="text-slate-400">{session.candidate.phone}</p>
          <p className="text-slate-500 text-sm mt-2">Interviewed on: {new Date(session.startTime).toLocaleDateString()}</p>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-slate-200">Final Score</h3>
            <p className="text-4xl font-bold text-cyan-400">{session.finalScore}/100</p>
          </div>
        </div>
        <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">AI Summary</h3>
          <p className="text-slate-300 italic">{session.finalSummary}</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Interview Q&A</h3>
        <div className="space-y-4">
          {session.questions.map((q, i) => {
            const answer = session.answers.find(a => a.questionId === q.id);
            return (
              <div key={q.id} className="bg-slate-900/50 p-4 rounded-lg">
                <p className="font-semibold text-slate-300">Q{i + 1} ({q.difficulty}): {q.text}</p>
                <p className="text-slate-400 mt-2 pl-4 border-l-2 border-cyan-500">{answer?.text || 'No answer.'}</p>
                <div className="text-right text-sm font-medium mt-2 text-cyan-400">Score: {answer?.score}/10</div>
                <p className="text-right text-xs text-slate-500 mt-1">AI Feedback: {answer?.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function InterviewerDashboard({ interviews }: { interviews: Record<string, InterviewSession> }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'score' | 'date'; direction: 'asc' | 'desc' }>({ key: 'score', direction: 'desc' });

  const completedInterviews = useMemo(() => {
    return Object.values(interviews).filter(session => session.status === 'completed');
  }, [interviews]);

  const sortedAndFilteredInterviews = useMemo(() => {
    let sortableItems = [...completedInterviews];
    if (searchTerm) {
      sortableItems = sortableItems.filter(session =>
        session.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    sortableItems.sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === 'name') {
        aValue = a.candidate.name;
        bValue = b.candidate.name;
      } else if (sortConfig.key === 'score') {
        aValue = a.finalScore || 0;
        bValue = b.finalScore || 0;
      } else { // date
        aValue = a.startTime;
        bValue = b.startTime;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [completedInterviews, searchTerm, sortConfig]);

  const requestSort = (key: 'name' | 'score' | 'date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: 'name' | 'score' | 'date') => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  if (selectedCandidateId) {
    const session = interviews[selectedCandidateId];
    return <CandidateDetail session={session} onBack={() => setSelectedCandidateId(null)} />;
  }

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-slate-100">Interviewer Dashboard</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIndicator('name')}</th>
              <th className="p-3 cursor-pointer" onClick={() => requestSort('score')}>Score {getSortIndicator('score')}</th>
              <th className="p-3 hidden sm:table-cell">Summary</th>
              <th className="p-3 cursor-pointer hidden md:table-cell" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredInterviews.map(session => (
              <tr
                key={session.id}
                onClick={() => setSelectedCandidateId(session.id)}
                className="border-b border-slate-700 hover:bg-slate-700/70 cursor-pointer transition-colors"
              >
                <td className="p-3 font-medium text-cyan-400">{session.candidate.name}</td>
                <td className="p-3 font-bold text-center">{session.finalScore}</td>
                <td className="p-3 text-slate-400 text-sm hidden sm:table-cell max-w-sm truncate">{session.finalSummary}</td>
                <td className="p-3 text-slate-500 hidden md:table-cell">{new Date(session.startTime).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedAndFilteredInterviews.length === 0 && (
            <div className="text-center py-8 text-slate-500">
                No completed interviews found.
            </div>
        )}
      </div>
    </div>
  );
}
