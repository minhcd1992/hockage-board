'use client';
import React from 'react';
import { MapPin, AlertTriangle, Lightbulb, BookOpen, Rocket, Edit, CheckCircle, Target } from 'lucide-react';

interface SectionProps {
  title: string;
  icon?: 'map' | 'alert' | 'idea' | 'book' | 'rocket' | 'edit' | 'check' | 'target';
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  const renderIcon = () => {
    switch (icon) {
      case 'map': return <MapPin className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      case 'idea': return <Lightbulb className="w-5 h-5" />;
      case 'book': return <BookOpen className="w-5 h-5" />;
      case 'rocket': return <Rocket className="w-5 h-5" />;
      case 'edit': return <Edit className="w-5 h-5" />;
      case 'check': return <CheckCircle className="w-5 h-5" />;
      case 'target': return <Target className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <section className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] rounded-2xl p-6 md:p-8 mb-8 border-l-4 border-l-blue-500">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 border-b-2 border-blue-200 pb-2 flex items-center">
        {icon && (
          <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 font-bold">
            {renderIcon()}
          </span>
        )}
        {title}
      </h2>
      <div className="space-y-4 text-slate-700 leading-relaxed text-[1.05rem]">
        {children}
      </div>
    </section>
  );
};
