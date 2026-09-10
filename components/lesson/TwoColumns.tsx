import React from 'react';

export const TwoColumns: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6 items-stretch">
      {children}
    </div>
  );
};

export const Col: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
