'use client';
import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: React.ReactNode;
}

export const Quiz: React.FC<QuizProps> = ({ question, options, correctIndex, explanation }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheck = () => {
    if (selected !== null) {
      setIsChecked(true);
    }
  };

  const isCorrect = selected === correctIndex;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-start mb-4">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mr-3 mt-0.5 whitespace-nowrap">
          Câu hỏi
        </span>
        <h3 className="text-lg font-bold text-slate-800">{question}</h3>
      </div>
      
      <div className="space-y-3 mb-5">
        {options.map((opt, idx) => {
          let optionClass = "block w-full text-left p-3 rounded-lg border transition-all cursor-pointer ";
          if (!isChecked) {
            optionClass += selected === idx ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100";
          } else {
            if (idx === correctIndex) {
              optionClass += "bg-green-100 border-green-400 ring-2 ring-green-400";
            } else if (selected === idx) {
              optionClass += "bg-red-100 border-red-400";
            } else {
              optionClass += "bg-slate-50 border-slate-200 opacity-60 cursor-default";
            }
          }

          return (
            <label key={idx} className={optionClass}>
              <input 
                type="radio" 
                name={`quiz-${question}`} 
                className="hidden" 
                checked={selected === idx}
                onChange={() => !isChecked && setSelected(idx)}
                disabled={isChecked}
              />
              <span className="font-medium text-slate-700">{String.fromCharCode(65 + idx)}. {opt}</span>
            </label>
          );
        })}
      </div>

      {!isChecked ? (
        <button 
          onClick={handleCheck}
          disabled={selected === null}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Kiểm tra
        </button>
      ) : (
        <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-medium flex items-center ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            {isCorrect ? 'Chính xác!' : 'Chưa chính xác.'}
          </p>
          <p className="text-sm mt-2 text-slate-600"><strong>Giải thích:</strong> {explanation}</p>
        </div>
      )}
    </div>
  );
};
