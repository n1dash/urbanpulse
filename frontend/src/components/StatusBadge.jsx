import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  CheckSquare 
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.trim().toLowerCase() : '';

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case 'created':
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <FileText className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />,
          label: 'Created'
        };
      case 'verified':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-150',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 stroke-[2]" />,
          label: 'Verified'
        };
      case 'assigned':
        return {
          bg: 'bg-indigo-50 text-indigo-750 border-indigo-150',
          icon: <UserCheck className="h-3.5 w-3.5 text-indigo-500 stroke-[2]" />,
          label: 'Assigned'
        };
      case 'in progress':
      case 'in_progress':
      case 'inprogress':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock className="h-3.5 w-3.5 text-amber-500 stroke-[2]" />,
          label: 'In Progress'
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckSquare className="h-3.5 w-3.5 text-emerald-600 stroke-[2]" />,
          label: 'Resolved'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: <FileText className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />,
          label: status || 'Unknown'
        };
    }
  };

  const { bg, icon, label } = getStatusStyles();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} shadow-sm transition-all duration-200`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
