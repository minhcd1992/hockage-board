'use client';
import React, { useState } from 'react';

interface QuizTFProps {
  question: string;
  context?: React.ReactNode;
  statements: {
    id: string;
    text: string;
    isTrue: boolean;
    explanation: React.ReactNode;
  }[];
}

export const QuizTF: React.FC<QuizTFProps> = ({ question, context, statements }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="glass-panel p-5 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col h-full bg-white">
      <p className="font-bold text-slate-800 mb-2">{question}</p>
      {context && <div className="text-slate-700 mb-4">{context}</div>}
      
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 w-12 text-center">Ý</th>
              <th className="p-3">Mệnh đề</th>
              <th className="p-3 w-20 text-center">Đúng/Sai</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {statements.map((stmt, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="p-3 text-center font-bold">{stmt.id})</td>
                <td className="p-3">{stmt.text}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <input type="radio" name={`tf-${question}-${idx}`} className="w-4 h-4 text-amber-500 bg-gray-100 border-gray-300" />
                    <input type="radio" name={`tf-${question}-${idx}`} className="w-4 h-4 text-amber-500 bg-gray-100 border-gray-300" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="w-full font-bold text-amber-700 p-2 cursor-pointer bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors text-sm text-center focus:outline-none flex justify-center items-center"
        >
          <span className="mr-2">🔑</span> {showAnswer ? 'Ẩn giải thích chi tiết' : 'Xem giải thích chi tiết'}
        </button>
        
        {showAnswer && (
          <div className="p-4 text-sm text-slate-700 border-t border-amber-100 bg-white mt-2">
            <ul className="space-y-2">
              {statements.map((stmt, idx) => (
                <li key={idx}>
                  <strong className={stmt.isTrue ? "text-green-600" : "text-red-600"}>
                    {stmt.id}) {stmt.isTrue ? "ĐÚNG" : "SAI"}:
                  </strong>{" "}
                  {stmt.explanation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
