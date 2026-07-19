import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const Error = ({ message = 'Something went wrong. Please try again.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
      <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 text-lg">Error Occurred</h3>
        <p className="text-sm text-slate-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4 animate-hover" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
