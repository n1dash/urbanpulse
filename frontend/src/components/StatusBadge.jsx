import React from 'react';
import { getStatusColor } from '../utils/helpers';

export const StatusBadge = ({ status }) => {
  const badgeStyles = getStatusColor(status);
  
  // Custom dot colors for visual indicator
  const dotColors = {
    'Created': 'bg-blue-500',
    'Verified': 'bg-indigo-500',
    'Assigned': 'bg-amber-500',
    'In Progress': 'bg-purple-500',
    'Resolved': 'bg-emerald-500'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyles} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};
export default StatusBadge;
