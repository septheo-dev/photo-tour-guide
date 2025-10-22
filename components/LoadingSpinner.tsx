
import React from 'react';

interface LoadingSpinnerProps {
  text: string;
  icon?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
       <div className="flex items-center text-2xl font-semibold text-slate-300">
         {icon}
         <span>{text}</span>
       </div>
       <div className="relative w-64 h-2 bg-slate-700 rounded-full overflow-hidden mt-6">
            <div className="absolute inset-0 h-full bg-gradient-to-r from-sky-500 to-indigo-500 animate-pulse-fast"></div>
       </div>
    </div>
  );
};

export default LoadingSpinner;
