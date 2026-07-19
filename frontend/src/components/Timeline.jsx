import React from 'react';
import { CheckCircle2, Clock, Hourglass, HelpCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const STAGES = ['Created', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

export const Timeline = ({ history = [], currentStatus }) => {
  // Map history logs by their status for easy access
  const historyMap = history.reduce((acc, log) => {
    acc[log.status] = log;
    return acc;
  }, {});

  const currentIdx = STAGES.indexOf(currentStatus);

  return (
    <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
      {STAGES.map((stage, idx) => {
        const isCompleted = historyMap[stage] !== undefined;
        const isActive = stage === currentStatus;
        const log = historyMap[stage];

        let icon = <Clock className="w-5 h-5 text-slate-300" />;
        let iconBg = 'bg-slate-50 border-slate-200';
        let titleColor = 'text-slate-400 font-normal';

        if (isActive) {
          icon = <Hourglass className="w-5 h-5 text-brand-600 animate-spin-slow" />;
          iconBg = 'bg-brand-50 border-brand-200 ring-4 ring-brand-100';
          titleColor = 'text-brand-800 font-bold';
        } else if (isCompleted) {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
          iconBg = 'bg-emerald-50 border-emerald-200';
          titleColor = 'text-slate-800 font-semibold';
        }

        return (
          <div key={stage} className="relative group">
            {/* Timeline node icon */}
            <div className={`absolute -left-[35px] top-0 p-1 rounded-full border-2 ${iconBg} transition-all`}>
              {icon}
            </div>

            {/* Stage content */}
            <div className={`p-4 border rounded-xl bg-white shadow-sm transition-all duration-300 ${
              isActive ? 'border-brand-200 shadow-md translate-x-1' : 'border-slate-100 hover:border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className={`text-sm ${titleColor}`}>{stage}</span>
                {log && (
                  <span className="text-xs text-slate-400 mt-1 sm:mt-0 font-medium">
                    {formatDate(log.timestamp)}
                  </span>
                )}
              </div>
              
              {log && log.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg italic border-l-2 border-slate-300">
                  {log.notes}
                </p>
              )}

              {!log && idx > currentIdx && (
                <p className="text-xs text-slate-300 mt-1">Pending subsequent action</p>
              )}
              
              {!log && idx <= currentIdx && (
                <p className="text-xs text-slate-400 mt-1 italic">Skipped or automated verification</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default Timeline;
