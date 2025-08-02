import React from 'react';
import { Volume2 } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  onSpeak?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content, onSpeak }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-2" />
      )}
      <div
        className={`relative rounded-xl p-3 text-sm max-w-[75%] shadow-sm ${
          isUser
            ? 'bg-black text-white rounded-br-none'
            : 'bg-gray-100 text-black rounded-bl-none'
        }`}
      >
        {content}
        {onSpeak && (
          <button
            onClick={onSpeak}
            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
          >
            <Volume2 size={14} />
          </button>
        )}
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-black ml-2" />
      )}
    </div>
  );
};

export default ChatBubble;
