'use client';
import React, { useState } from 'react';

interface QuizShortProps {
  question: string;
  context?: React.ReactNode;
  answer: string;
  explanation: React.ReactNode;
}

export const QuizShort: React.FC<QuizShortProps> = ({ question, context, answer, explanation }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="glass-panel p-5 rounded-lg border border-slate-200 shadow-sm mb-4 bg-white">
      <p className="font-bold text-slate-800 mb-2">{question}</p>
      {context && <div className="text-slate-700 mb-4">{context}</div>}
      
      <div className="flex items-center gap-3 mb-4">
        <span className="font-bold text-slate-700">Đáp số:</span>
        <input type="text" placeholder="Nhập số..." className="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 bg-slate-50 w-32" />
      </div>

      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="font-bold text-green-700 p-2 cursor-pointer bg-green-50 hover:bg-green-100 rounded border border-green-100 transition-colors text-sm focus:outline-none flex items-center"
      >
        <span className="mr-2">✨</span> {showAnswer ? 'Ẩn lời giải' : 'Xem lời giải'}
      </button>

      {showAnswer && (
        <div className="p-3 text-sm text-slate-700 border-t border-green-100 bg-white leading-relaxed mt-2">
          <p className="text-lg font-bold text-green-700 mb-2">Đáp án: {answer}</p>
          <p className="font-semibold text-slate-800">Giải chi tiết:</p>
          <div className="mt-1">{explanation}</div>
        </div>
      )}
    </div>
  );
};
