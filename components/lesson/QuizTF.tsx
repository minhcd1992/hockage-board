'use client';
import React, { useState } from 'react';

interface QuizTFProps {
  id: string;
  question: React.ReactNode;
  context?: React.ReactNode;
  statements: {
    id: string;
    text: React.ReactNode;
    isTrue: boolean;
    explanation: React.ReactNode;
  }[];
}

export const QuizTF: React.FC<QuizTFProps> = ({ id, question, context, statements }) => {
  const [choice, setChoice] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const answered = statements.filter(s => s.id in choice).length;
  const score = statements.filter(s => choice[s.id] === s.isTrue).length;

  const pick = (sid: string, v: boolean) => {
    if (checked) return;
    setChoice(c => ({ ...c, [sid]: v }));
  };
  const reset = () => { setChoice({}); setChecked(false); };

  const btn = (sid: string, v: boolean, isTrue: boolean) => {
    const on = choice[sid] === v;
    let cls = 'min-w-9 rounded-md border px-2 py-1 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ';
    if (!checked) cls += on ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50';
    else if (on) cls += v === isTrue ? 'border-green-500 bg-green-100 text-green-800' : 'border-red-400 bg-red-100 text-red-800';
    else cls += 'border-slate-200 bg-white text-slate-400';
    return (
      <button type="button" aria-pressed={on} aria-label={`Ý ${sid}: ${v ? 'Đúng' : 'Sai'}`} disabled={checked} onClick={() => pick(sid, v)} className={cls}>
        {v ? 'Đ' : 'S'}
      </button>
    );
  };

  return (
    <div data-question-id={id} className="glass-panel p-5 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col h-full bg-white">
      <p className="font-bold text-slate-800 mb-2">{question}</p>
      {context && <div className="text-slate-700 mb-4">{context}</div>}

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="p-3 w-12 text-center">Ý</th>
              <th className="p-3">Mệnh đề</th>
              <th className="p-3 w-24 text-center">Đúng/Sai</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {statements.map((stmt) => (
              <tr key={stmt.id} className="border-b border-slate-100">
                <td className="p-3 text-center font-bold">{stmt.id})</td>
                <td className="p-3">{stmt.text}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-1.5 justify-center">
                    {btn(stmt.id, true, stmt.isTrue)}
                    {btn(stmt.id, false, stmt.isTrue)}
                  </div>
                  {checked && stmt.id in choice && (
                    <div className={`mt-1 text-[11px] font-semibold ${choice[stmt.id] === stmt.isTrue ? 'text-green-700' : 'text-red-700'}`}>
                      {choice[stmt.id] === stmt.isTrue ? 'đúng' : 'sai'}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {!checked ? (
          <button type="button" onClick={() => setChecked(true)} disabled={answered === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors">
            Kiểm tra
          </button>
        ) : (
          <>
            <p role="status" className={`text-sm font-bold ${score === statements.length ? 'text-green-700' : 'text-slate-800'}`}>
              Đúng {score}/{statements.length} ý{answered < statements.length ? ` (bỏ trống ${statements.length - answered} ý)` : ''}.
            </p>
            <button type="button" onClick={reset} className="text-sm font-medium text-indigo-700 hover:underline">Làm lại</button>
          </>
        )}
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => setShowAnswer(!showAnswer)}
          aria-expanded={showAnswer}
          className="w-full font-bold text-amber-700 p-2 cursor-pointer bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors text-sm text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 flex justify-center items-center"
        >
          <span className="mr-2">🔑</span> {showAnswer ? 'Ẩn giải thích chi tiết' : 'Xem giải thích chi tiết'}
        </button>

        {showAnswer && (
          <div className="p-4 text-sm text-slate-700 border-t border-amber-100 bg-white mt-2">
            <ul className="space-y-2">
              {statements.map((stmt) => (
                <li key={stmt.id}>
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
