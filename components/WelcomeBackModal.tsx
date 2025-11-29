
import React from 'react';

type WelcomeBackModalProps = {
  onResume: () => void;
  onStartNew: () => void;
};

const WelcomeBackModal = ({ onResume, onStartNew }: WelcomeBackModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl p-8 max-w-sm w-full border border-slate-700">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome Back!</h2>
        <p className="text-slate-400 mb-6">You have an interview in progress. Would you like to resume or start a new one?</p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onResume}
            className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-lg hover:bg-cyan-600 transition-colors duration-200"
          >
            Resume Interview
          </button>
          <button
            onClick={onStartNew}
            className="w-full bg-slate-600 text-slate-200 font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200"
          >
            Start New (Discards Progress)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;
