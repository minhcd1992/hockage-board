'use client';
import React, { useId, useMemo, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizProps {
  id: string;
  question: React.ReactNode;
  options: React.ReactNode[];
  correctIndex: number;
  explanation: React.ReactNode;
  /** Set to false when the option order matters (e.g. "Cả A và B"). */
  shuffle?: boolean;
}

/** FNV-1a: a stable hash so the server and the browser render the same order. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Display order of the options. The source files were written with the key mostly on B;
 * here the correct option is moved to a position chosen from the question id (spread
 * evenly over A–D), while the distractors keep their original relative order.
 */
function displayOrder(id: string, n: number, correctIndex: number, shuffle: boolean) {
  const order = Array.from({ length: n }, (_, i) => i);
  if (!shuffle || n < 2 || correctIndex < 0 || correctIndex >= n) return order;
  const others = order.filter(i => i !== correctIndex);
  others.splice(hash(id) % n, 0, correctIndex);
  return others;
}

export const Quiz: React.FC<QuizProps> = ({ id, question, options, correctIndex, explanation, shuffle = true }) => {
  const instanceId = useId();
  const [selected, setSelected] = useState<number | null>(null); // index into the original options
  const [isChecked, setIsChecked] = useState(false);
  const order = useMemo(() => displayOrder(id, options.length, correctIndex, shuffle), [id, options.length, correctIndex, shuffle]);

  const handleCheck = () => {
    if (selected !== null) setIsChecked(true);
  };
  const reset = () => { setSelected(null); setIsChecked(false); };

  const isCorrect = selected === correctIndex;

  return (
    <div data-question-id={id} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-start mb-4">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mr-3 mt-0.5 whitespace-nowrap">
          Câu hỏi
        </span>
        <h3 className="text-lg font-bold text-slate-800">{question}</h3>
      </div>

      <div className="space-y-3 mb-5" role="radiogroup">
        {order.map((idx, pos) => {
          let optionClass = "block w-full text-left p-3 rounded-lg border transition-all cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-400 ";
          if (!isChecked) {
            optionClass += selected === idx ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100";
          } else if (idx === correctIndex) {
            optionClass += "bg-green-100 border-green-400 ring-2 ring-green-400";
          } else if (selected === idx) {
            optionClass += "bg-red-100 border-red-400";
          } else {
            optionClass += "bg-slate-50 border-slate-200 opacity-60 cursor-default";
          }

          return (
            <label key={idx} className={optionClass}>
              <input
                type="radio"
                name={`quiz-${id}-${instanceId}`}
                className="sr-only"
                checked={selected === idx}
                onChange={() => !isChecked && setSelected(idx)}
                disabled={isChecked}
              />
              <span className="font-medium text-slate-700">{String.fromCharCode(65 + pos)}. {options[idx]}</span>
            </label>
          );
        })}
      </div>

      {!isChecked ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={selected === null}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Kiểm tra
        </button>
      ) : (
        <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className={`font-medium flex items-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
              {isCorrect ? 'Chính xác!' : 'Chưa chính xác.'}
            </p>
            <button type="button" onClick={reset} className="text-sm font-medium text-indigo-700 hover:underline">Làm lại</button>
          </div>
          <p className="text-sm mt-2 text-slate-600"><strong>Giải thích:</strong> {explanation}</p>
        </div>
      )}
    </div>
  );
};
