import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Calendar, MapPin, ImageOff, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { complaintService, officerService } from '../services/api';

const SeniorComplaintCard = ({ complaint, onUpvoteSuccess }) => {
  const [upvotes, setUpvotes] = useState(complaint.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(complaint.is_upvoted || false);
  const [isVoting, setIsVoting] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState("");

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

  const handleVerify = async () => {
    try {
      await complaintService.updateComplaintStatus(
        complaint.id,
        { status: "Verified" }
      );

      console.log("Complaint verified successfully");

      window.location.reload();
    } catch (err) {
      console.error(err);
      console.error("Failed to verify complaint.");
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

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const data = await officerService.getOfficers();
        setOfficers(data);
      } catch (err) {
        console.error("Failed to load officers:", err);
      }
    };

    fetchOfficers();
  }, []);

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

        {/* Assignment Section */}
        <div className="border-t border-slate-100 mt-4 pt-4">

          <p className="text-xs font-semibold text-slate-600">
            Assigned Officer:
            <span className="ml-1 font-bold text-slate-800">
              {complaint.assigned_officer_name || "Not Assigned"}
            </span>
          </p>

          {complaint.status === "Reported" && (
            <button
              onClick={handleVerify}
              className="mt-3 w-full rounded-lg bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700 transition"
            >
              Verify Complaint
            </button>
          )}

          {complaint.status === "Verified" && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Assign Officer
            </button>
          )}
        </div>

        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4">
                Assign Complaint
              </h2>

              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full border rounded-lg p-2 mb-6"
              >
                <option>Select an officer</option>

                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.user.username} ({officer.designation})
                  </option>
                ))}
                </select>

                <button
                  onClick={async () => {
                    if (!selectedOfficer) {
                      alert("Please select an officer.");
                      return;
                    }

                    try {
                      await complaintService.assignComplaint(
                        complaint.id,
                        selectedOfficer
                      );

                      console.log("Complaint assigned successfully");
                      setShowAssignModal(false);

                      window.location.reload();
                    } catch (err) {
                      console.error(err);
                      console.error("Failed to assign complaint.");
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold"
                >
                  Assign
                </button>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default SeniorComplaintCard;
