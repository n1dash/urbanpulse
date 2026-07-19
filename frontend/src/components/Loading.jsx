import React from 'react';

export const Loading = ({ size = 'md', text = 'Loading details...' }) => {
  const spinnerSizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className={`${spinnerSizes[size]} border-brand-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="p-5 border border-slate-100 bg-white rounded-xl shadow-sm animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
      <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
      <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
    </div>
    <div className="h-40 bg-slate-200 rounded-lg"></div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
      <div className="h-6 w-12 bg-slate-200 rounded"></div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse p-6 space-y-3">
          <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
          <div className="h-8 w-1/2 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="h-96 bg-slate-100 border border-slate-200 rounded-2xl animate-pulse"></div>
    </div>
  </div>
);
