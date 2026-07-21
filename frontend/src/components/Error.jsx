import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const Error = ({ message = 'An error occurred while loading this page.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto my-6 text-center shadow-sm select-none">
      <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-4 border border-rose-100/50">
        <AlertTriangle className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Error Encountered</h3>
      <p className="text-xs text-slate-500 mb-6 font-semibold leading-relaxed">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-600/10 active:scale-95 transition-all focus:outline-none"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-2 stroke-[2.5]" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default Error;
