import React from 'react';

const Loading = ({ size = 'md', message = 'Loading content...' }) => {
  const spinnerSizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-2.5',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div 
        className={`${spinnerSizes[size]} animate-spin rounded-full border-t-accent-600 border-slate-200`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;
