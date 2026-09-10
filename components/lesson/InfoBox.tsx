import React from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';

interface InfoBoxProps {
  type?: 'warning' | 'info';
  title: string;
  children: React.ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ type = 'info', title, children }) => {
  const isWarning = type === 'warning';
  
  return (
    <div className={`p-6 mb-8 rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-200 border-l-4 ${isWarning ? 'bg-orange-50/80 border-l-orange-400' : 'bg-blue-50/80 border-l-blue-400'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-1">
          {isWarning ? <AlertTriangle className="text-orange-500 w-5 h-5" /> : <Lightbulb className="text-blue-500 w-5 h-5" />}
        </div>
        <div>
          <h4 className={`font-bold text-lg mb-2 ${isWarning ? 'text-orange-900' : 'text-blue-900'}`}>{title}</h4>
          <div className={isWarning ? 'text-orange-900' : 'text-blue-900'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
