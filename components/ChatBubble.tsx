
import React from 'react';
import { BotIcon, UserIcon, LoadingSpinner } from './Icons';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  message?: string;
  isLoading?: boolean;
};

const ChatBubble = ({ role, message, isLoading = false }: ChatBubbleProps) => {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex items-start gap-3 my-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAssistant ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        {isAssistant ? <BotIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
      </div>
      <div className={`p-3 rounded-lg max-w-md ${isAssistant ? 'bg-slate-700' : 'bg-blue-600 text-white'}`}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
