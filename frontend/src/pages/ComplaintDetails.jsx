import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, MapPin, Calendar, Award, ArrowUp, 
  Wrench, ShieldAlert, Sparkles, User, FileImage, 
  MessageSquarePlus, Check 
} from 'lucide-react';
import Timeline from '../components/Timeline';
import StatusBadge from '../components/StatusBadge';
import Map from '../components/Map';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';
import { formatDate, getPriorityDetails } from '../utils/helpers';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states for status/priority updates
  const [statusVal, setStatusVal] = useState('');
  const [notesVal, setNotesVal] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [priorityVal, setPriorityVal] = useState(50);
  const [assignedOfficerVal, setAssignedOfficerVal] = useState('');
  const [officersList, setOfficersList] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaintDetails(id);
      setComplaint(data);
      setStatusVal(data.status);
      setPriorityVal(data.priorityScore || 50);
      setAssignedOfficerVal(data.officer?.email || '');
      
      // If Senior Officer or Admin, fetch officers list for assignment dropdown
      if (user && (user.role === 'Senior Officer' || user.role === 'Admin')) {
        const officers = await adminService.getOfficers();
        setOfficersList(officers.filter(o => o.department === data.department || o.role === 'Officer'));
      }
    } catch (err) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, user]);

  const handleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await complaintService.upvoteComplaint(id, user.email);
      setComplaint({
        ...complaint,
        upvotes: response.upvotes,
        upvotedBy: response.upvotedBy
      });
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleEvidenceImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');
    try {
      const updateData = {
        status: statusVal,
        notes: notesVal || `Status updated to ${statusVal} by ${user.name}.`,
      };

      if (evidenceFile) {
        updateData.evidenceImage = evidenceFile;
      }
      if (notesVal) {
        updateData.evidenceNotes = notesVal;
      }

      const updated = await complaintService.updateComplaintStatus(id, updateData);
      setComplaint(updated);
      setSuccessMsg('Status updated successfully!');
      setNotesVal('');
      setEvidenceFile(null);
      setEvidencePreview(null);
    } catch (err) {
      setError('Failed to update complaint status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityAndOfficerSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');
    try {
      const updateData = {
        priorityScore: priorityVal,
        officerEmail: assignedOfficerVal
      };

      // Auto-assign history log
      if (assignedOfficerVal !== (complaint.officer?.email || '')) {
        updateData.status = 'Assigned';
        const officerObj = officersList.find(o => o.email === assignedOfficerVal);
        updateData.notes = `Assigned to officer ${officerObj ? officerObj.name : assignedOfficerVal} by Senior Officer.`;
      }

      const updated = await complaintService.updateComplaintStatus(id, updateData);
      setComplaint(updated);
      setSuccessMsg('Assignment & priority saved!');
    } catch (err) {
      setError('Failed to update details');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12"><Loading text="Fetching complaint details..." /></div>;
  if (error && !complaint) return <div className="p-12"><Error message={error} onRetry={fetchDetails} /></div>;
  if (!complaint) return null;

  const priorityDetails = getPriorityDetails(complaint.priorityScore);
  const isUpvoted = complaint.upvotedBy?.includes(user?.email);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Back button and actions */}
      <div className="flex justify-between items-center shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </button>
        <span className="font-mono font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-xl bg-white text-xs">
          ID: {complaint.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Core Info, Images, Location Map */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Title & Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 border border-cyan-200 text-cyan-700 bg-cyan-50 text-xs font-semibold rounded-md">
                  {complaint.department}
                </span>
                <StatusBadge status={complaint.status} />
                <span className={`px-2.5 py-0.5 border rounded-full text-xs font-semibold ${priorityDetails.color}`}>
                  Priority Score: {complaint.priorityScore} ({priorityDetails.label})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                {complaint.title}
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            {/* Upvote & Submitter Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Reported: {formatDate(complaint.createdAt)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Citizen: {complaint.citizen?.name || 'Anonymous'}</span>
              </div>
              
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isUpvoted
                    ? 'bg-brand-50 border-brand-200 text-brand-600 font-extrabold scale-[1.03]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUp className={`w-4 h-4 ${isUpvoted ? 'stroke-[3px]' : ''}`} />
                <span>Upvote Complaint ({complaint.upvotes})</span>
              </button>
            </div>
          </div>

          {/* Incident Images */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Photo Evidence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">Citizen Submission:</span>
                <div className="h-60 rounded-2xl bg-slate-50 border overflow-hidden">
                  <img src={complaint.image} alt="Reported problem" className="w-full h-full object-cover" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">Officer Resolving Evidence:</span>
                <div className="h-60 rounded-2xl bg-slate-50 border border-dashed flex items-center justify-center overflow-hidden">
                  {complaint.evidenceImage ? (
                    <img src={complaint.evidenceImage} alt="Resolved evidence" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-1">
                      <FileImage className="w-8 h-8 mx-auto stroke-[1.5]" />
                      <p className="text-xs">No resolving photo uploaded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {complaint.evidenceNotes && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
                <span className="font-bold">Officer Resolution Notes: </span>
                {complaint.evidenceNotes}
              </div>
            )}
          </div>

          {/* Location Map View */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Location</h3>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{complaint.location?.address}</span>
              </div>
            </div>
            <div className="h-72 rounded-2xl overflow-hidden relative">
              <Map
                mode="view"
                center={[complaint.location.lat, complaint.location.lng]}
                zoom={14}
                complaints={[complaint]}
                selectedLocation={{ lat: complaint.location.lat, lng: complaint.location.lng }}
              />
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Status Timeline & Role Actions Panel */}
        <div className="space-y-6">
          
          {/* Status Timeline */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Complaint Lifecycle</h3>
            <Timeline history={complaint.history} currentStatus={complaint.status} />
          </div>

          {/* SUCCESS AND ERROR FEEDBACK */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 shadow-sm animate-fade">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ROLE ACTION PANEL: Dynamic forms */}
          {user && (user.role === 'Officer' || user.role === 'Senior Officer' || user.role === 'Admin') && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-5 ring-2 ring-brand-50">
              
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 shrink-0">
                <Wrench className="w-5 h-5 text-brand-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">Administrative Action</h3>
              </div>

              {/* OFFICER CONTROLS (Status Progression & Uploading Evidence) */}
              {user.role === 'Officer' && (
                <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Lifecycle Status</label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-700 font-semibold"
                    >
                      <option value="Created">Created</option>
                      <option value="Verified">Verified</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action / Resolution Notes</label>
                    <textarea
                      value={notesVal}
                      onChange={(e) => setNotesVal(e.target.value)}
                      placeholder="Add notes about actions taken, repairs made, etc."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attach Evidence Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer text-slate-600 transition shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Evidence</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEvidenceImage}
                          className="hidden"
                        />
                      </label>
                      {evidenceFile && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{evidenceFile.name}</span>}
                    </div>
                    {evidencePreview && (
                      <div className="relative w-16 h-16 border rounded-lg overflow-hidden mt-1 shadow-inner">
                        <img src={evidencePreview} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    {updating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Save Lifecycle Update</span>
                    )}
                  </button>
                </form>
              )}

              {/* SENIOR OFFICER CONTROLS (Assign Officer & Edit Priority Score) */}
              {(user.role === 'Senior Officer' || user.role === 'Admin') && (
                <form onSubmit={handlePriorityAndOfficerSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adjust Priority Score ({priorityVal})</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={priorityVal}
                        onChange={(e) => setPriorityVal(e.target.value)}
                        className="flex-1 accent-brand-500 cursor-ew-resize"
                      />
                      <span className={`px-2 py-0.5 border text-xs font-mono font-bold rounded-lg ${priorityDetails.color}`}>
                        {priorityVal}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Department Officer</label>
                    <select
                      value={assignedOfficerVal}
                      onChange={(e) => setAssignedOfficerVal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-700 font-semibold"
                    >
                      <option value="">Unassigned</option>
                      {officersList.map(o => (
                        <option key={o.email} value={o.email}>{o.name} ({o.email})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    {updating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Save Assignment & Priority</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default ComplaintDetails;
