import type { ReactNode } from 'react';

interface CompareTableProps {
  title: string;
  columns: ReactNode[];
  rows: ReactNode[][];
}

export function CompareTable({ title, columns, rows }: CompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-8 bg-white">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <caption className="p-4 text-left font-bold text-slate-800">{title}</caption>
        <thead className="bg-slate-100 text-slate-800">
          <tr>{columns.map((column, index) => <th key={index} scope="col" className="p-4 border-b-2 border-slate-300">{column}</th>)}</tr>
        </thead>
        <tbody className="text-slate-700">
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-200">
              {row.map((cell, column) => column === 0
                ? <th key={column} scope="row" className="p-4 font-semibold">{cell}</th>
                : <td key={column} className="p-4 border-l border-slate-200">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
