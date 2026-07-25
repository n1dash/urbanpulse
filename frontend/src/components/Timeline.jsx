import React from 'react';
import { Check, Circle } from 'lucide-react';

const STAGES = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

const Timeline = ({ currentStatus, timelineData = [] }) => {
  // Normalize the status string to match our STAGES array
  const normalize = (status) => {
    if (!status) return '';
    const s = status.trim().toLowerCase();
    if (s === 'in_progress' || s === 'inprogress') return 'in progress';
    return s;
  };

  const currentNormalized = normalize(currentStatus);
  const currentStageIndex = STAGES.findIndex(
    (stage) => stage.toLowerCase() === currentNormalized
  );

  // Find date for a specific stage from the backend timeline records
  const getStageDate = (stageName) => {
    const record = timelineData.find(
      (t) => normalize(t.status) === stageName.toLowerCase()
    );
    if (!record || !record.timestamp) return null;
    return new Date(record.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full py-6 select-none">
      {/* Desktop view: Horizontal timeline */}
      <div className="hidden md:flex items-center justify-between relative w-full px-4">
        {/* Connecting bar background */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        
        {/* Active connection progress bar */}
        <div 
          className="absolute top-1/2 left-0 h-[3px] bg-accent-500 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full"
          style={{ 
            width: `${currentStageIndex >= 0 ? (currentStageIndex / (STAGES.length - 1)) * 100 : 0}%` 
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isActive = idx === currentStageIndex;
          const stageDate = getStageDate(stage);

          return (
            <div key={stage} className="flex flex-col items-center flex-1 z-10 relative">
              <div 
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-accent-500 border-accent-500 text-white shadow-sm shadow-accent-500/20' 
                    : isActive 
                    ? 'bg-white border-accent-500 text-accent-600 ring-4 ring-accent-100 scale-105 shadow-md' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              
              <span 
                className={`mt-3 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? 'text-accent-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {stage}
              </span>
              
              {stageDate && (
                <span className="text-[9px] text-slate-500 mt-1 font-bold bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50 shadow-sm">
                  {stageDate}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view: Vertical timeline */}
      <div className="flex md:hidden flex-col space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[3px] before:bg-slate-100 before:rounded-full">
        {/* Mobile progress line */}
        <div 
          className="absolute left-2.5 top-2 bg-accent-500 w-[3px] transition-all duration-700 ease-in-out rounded-full"
          style={{ 
            height: `${currentStageIndex >= 0 ? (currentStageIndex / (STAGES.length - 1)) * 90 : 0}%` 
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isActive = idx === currentStageIndex;
          const stageDate = getStageDate(stage);

          return (
            <div key={stage} className="flex items-start space-x-4 relative">
              <div 
                className={`flex items-center justify-center w-6 h-6 rounded-full border-2 z-10 transition-all duration-300 -ml-[26px] ${
                  isCompleted 
                    ? 'bg-accent-500 border-accent-500 text-white shadow-sm shadow-accent-500/20' 
                    : isActive 
                    ? 'bg-white border-accent-500 text-accent-600 ring-2 ring-accent-100 scale-105 shadow-md' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 stroke-[2.5]" />
                ) : (
                  <Circle className="h-1.5 w-1.5 fill-current" />
                )}
              </div>
              
              <div className="flex flex-col pt-0.5">
                <span 
                  className={`text-xs font-bold uppercase tracking-wider leading-none ${
                    isActive ? 'text-accent-650' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stage}
                </span>
                {stageDate && (
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                    {stageDate}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
