'use client';
import React, { useId, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { checkAnswer, type AnswerVerdict } from '@/lib/answerCheck';

interface QuizShortProps {
  id: string;
  question: React.ReactNode;
  context?: React.ReactNode;
  answer: string;
  explanation: React.ReactNode;
}

const messages: Record<AnswerVerdict, string> = {
  correct: 'Chính xác!',
  wrong: 'Chưa đúng. Kiểm tra lại phép tính hoặc mở lời giải.',
  incomplete: 'Đúng phần đã nhập, nhưng câu này có nhiều giá trị (ngăn cách bằng dấu ;).',
  invalid: 'Hãy nhập một số, ví dụ 12,5.',
};

export const QuizShort: React.FC<QuizShortProps> = ({ id, question, context, answer, explanation }) => {
  const inputId = useId();
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const check = () => setVerdict(value.trim() ? checkAnswer(value, answer) : 'invalid');
  const ok = verdict === 'correct';

  return (
    <div data-question-id={id} className="glass-panel p-5 rounded-lg border border-slate-200 shadow-sm mb-4 bg-white">
      <p className="font-bold text-slate-800 mb-2">{question}</p>
      {context && <div className="text-slate-700 mb-4">{context}</div>}

      <form className="flex flex-wrap items-center gap-2 mb-3" onSubmit={e => { e.preventDefault(); check(); }}>
        <label htmlFor={inputId} className="font-bold text-slate-700">Đáp số:</label>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={e => { setValue(e.target.value); setVerdict(null); }}
          placeholder="Nhập số..."
          aria-describedby={verdict ? `${inputId}-verdict` : undefined}
          className={`border rounded px-3 py-1 focus:outline-none focus:ring-2 bg-slate-50 w-36 ${verdict === null ? 'border-slate-300 focus:ring-green-400' : ok ? 'border-green-500 focus:ring-green-400' : 'border-red-400 focus:ring-red-300'}`}
        />
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors">
          Kiểm tra
        </button>
      </form>

      {verdict && (
        <p id={`${inputId}-verdict`} role="status" className={`mb-3 flex items-center text-sm font-medium ${ok ? 'text-green-700' : 'text-red-700'}`}>
          {ok ? <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> : <XCircle className="w-5 h-5 mr-2 shrink-0" />}
          {messages[verdict]}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowAnswer(!showAnswer)}
        aria-expanded={showAnswer}
        className="font-bold text-green-700 p-2 cursor-pointer bg-green-50 hover:bg-green-100 rounded border border-green-100 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 flex items-center"
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
