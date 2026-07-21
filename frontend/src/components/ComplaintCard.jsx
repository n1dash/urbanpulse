import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Calendar, MapPin, ImageOff, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { complaintService } from '../services/api';

const ComplaintCard = ({ complaint, onUpvoteSuccess }) => {
  const [upvotes, setUpvotes] = useState(complaint.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(complaint.is_upvoted || false);
  const [isVoting, setIsVoting] = useState(false);

  const handleUpvote = async (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isVoting) return;
    setIsVoting(true);

    try {
      await complaintService.upvoteComplaint(complaint.id);
      setIsUpvoted(true);
      setUpvotes((prev) => prev + 1);
      if (onUpvoteSuccess) onUpvoteSuccess(complaint.id);
    } catch (err) {
      console.error('Error upvoting complaint:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Truncate text utility
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Style for priority score
  const getPriorityBadgeStyles = (score) => {
    const s = Number(score) || 0;
    if (s >= 7) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s >= 4) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="premium-card group overflow-hidden flex flex-col h-full bg-white select-none">
      {/* Image header */}
      <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center text-slate-300 border-b border-slate-100">
        {complaint.image ? (
          <img 
            src={complaint.image.startsWith('http') || complaint.image.startsWith('data') ? complaint.image : `http://localhost:8000${complaint.image}`} 
            alt={complaint.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none'; 
            }}
          />
        ) : (
          <div className="flex flex-col items-center select-none text-slate-400">
            <ImageOff className="h-7 w-7 stroke-[1.2] text-slate-300 mb-1.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">No Photo Attached</span>
          </div>
        )}
        <div className="absolute top-3.5 right-3.5 z-20">
          <StatusBadge status={complaint.status} />
        </div>
        <div className="absolute top-3.5 left-3.5 bg-slate-900/90 text-white px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm z-20">
          {complaint.department || 'General'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 leading-snug mb-2 group-hover:text-accent-600 transition-colors">
            <Link to={`/complaints/${complaint.id}`} className="hover:underline">{complaint.title}</Link>
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
            {truncateText(complaint.description, 110)}
          </p>
        </div>

        <div>
          {/* Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-450 font-bold mb-4 border-t border-slate-100 pt-3.5">
            <span className="flex items-center text-slate-500">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400 stroke-[2]" />
              {formatDate(complaint.created_at)}
            </span>
            {complaint.location_name && (
              <span className="flex items-center max-w-[155px] text-slate-500 truncate" title={complaint.location_name}>
                <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400 stroke-[2] flex-shrink-0" />
                <span className="truncate">{complaint.location_name}</span>
              </span>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            {/* Priority Score */}
            <div className={`flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeStyles(complaint.priority_score)}`}>
              Priority: {complaint.priority_score || 'N/A'}
            </div>

            {/* Upvote & Details Link */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUpvote}
                disabled={isUpvoted || isVoting}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isUpvoted
                    ? 'bg-accent-50 text-accent-700 border-accent-150 cursor-default shadow-sm'
                    : 'bg-slate-50 hover:bg-accent-50/50 border-slate-200 text-slate-650 hover:text-accent-700 active:scale-95 shadow-sm'
                }`}
                title={isUpvoted ? 'You upvoted this' : 'Upvote this complaint'}
              >
                <ThumbsUp className={`h-3 w-3 mr-1.5 ${isUpvoted ? 'fill-current text-accent-600' : 'text-slate-400'}`} />
                <span>{upvotes}</span>
              </button>

              <Link
                to={`/complaints/${complaint.id}`}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-accent-600 hover:text-accent-700 hover:bg-accent-50/40 border border-transparent hover:border-accent-100 transition-all"
              >
                <span>Details</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
