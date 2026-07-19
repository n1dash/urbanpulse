import React from 'react';
import { ArrowUp, Clock, MapPin, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatDate, getPriorityDetails, getDepartmentColor } from '../utils/helpers';

export const ComplaintCard = ({ complaint, onUpvote, currentCitizenEmail }) => {
  const {
    id,
    title,
    description,
    department,
    location,
    status,
    priorityScore,
    upvotes,
    upvotedBy = [],
    image,
    createdAt
  } = complaint;

  const priority = getPriorityDetails(priorityScore);
  const deptStyle = getDepartmentColor(department);
  const isUpvoted = upvotedBy.includes(currentCitizenEmail);

  return (
    <div className="border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Visual Image Header */}
      {image && (
        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {priorityScore && (
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${priority.color}`}>
                {priority.label} ({priorityScore})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col space-y-3">
        {/* Department and ID */}
        <div className="flex justify-between items-center text-xs">
          <span className={`px-2 py-0.5 border rounded-md font-medium ${deptStyle}`}>
            {department}
          </span>
          <span className="font-mono font-bold text-slate-400">{id}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm line-clamp-2 flex-1">
          {description}
        </p>

        {/* Location & Time */}
        <div className="space-y-1.5 pt-1 border-t border-slate-50 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{location?.address || 'Selected location'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          {/* Status Badge */}
          <StatusBadge status={status} />

          {/* Upvote & Details Actions */}
          <div className="flex items-center gap-2">
            {onUpvote && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onUpvote(id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isUpvoted
                    ? 'bg-brand-50 border-brand-200 text-brand-600 shadow-sm scale-[1.03]'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ArrowUp className={`w-3.5 h-3.5 ${isUpvoted ? 'stroke-[3px]' : ''}`} />
                <span>{upvotes}</span>
              </button>
            )}
            
            <Link
              to={`/complaints/${id}`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ComplaintCard;
