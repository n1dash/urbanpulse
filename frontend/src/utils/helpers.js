/**
 * Helper utility functions for UrbanPulse frontend
 */

// Format Date string to a readable format
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Map status to Tailwind badge styles
export const getStatusColor = (status) => {
  const mapping = {
    'Created': 'bg-blue-50 text-blue-700 border-blue-200',
    'Verified': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Assigned': 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
    'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return mapping[status] || 'bg-slate-50 text-slate-700 border-slate-200';
};

// Map severity score to color and status description
export const getPriorityDetails = (score) => {
  if (score >= 80) {
    return {
      label: 'Critical',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      barColor: 'bg-rose-500'
    };
  } else if (score >= 60) {
    return {
      label: 'High',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      barColor: 'bg-orange-500'
    };
  } else if (score >= 40) {
    return {
      label: 'Medium',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      barColor: 'bg-amber-500'
    };
  } else {
    return {
      label: 'Low',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barColor: 'bg-emerald-500'
    };
  }
};

// Get department icons
export const getDepartmentColor = (dept) => {
  const mapping = {
    'Roads & Traffic': 'text-cyan-600 bg-cyan-50 border-cyan-200',
    'Water & Sewage': 'text-blue-600 bg-blue-50 border-blue-200',
    'Electricity & Lighting': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'Waste Management': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Transport & Transit': 'text-purple-600 bg-purple-50 border-purple-200',
  };
  return mapping[dept] || 'text-slate-600 bg-slate-50 border-slate-200';
};
