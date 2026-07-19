import React from 'react';

export const StatCard = ({ title, value, icon: Icon, colorClass = 'text-brand-600 bg-brand-50', changeText, changeType = 'positive' }) => {
  return (
    <div className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {changeText && (
          <p className={`text-xs font-medium ${
            changeType === 'positive' ? 'text-emerald-600' : changeType === 'negative' ? 'text-rose-500' : 'text-slate-500'
          }`}>
            {changeText}
          </p>
        )}
      </div>
      <div className={`p-3.5 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
export default StatCard;
