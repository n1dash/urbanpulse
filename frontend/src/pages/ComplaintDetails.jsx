import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import Map from '../components/Map';
import Loading from '../components/Loading';
import Error from '../components/Error';
import StatusBadge from '../components/StatusBadge';
import { ThumbsUp, MapPin, Calendar, Building2, Upload, AlertCircle, ShieldAlert, Award, FileCheck } from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer inputs
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [newStatus, setNewStatus] = useState('Reported');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState('');
  const [comments, setComments] = useState('');

  // Voting states
  const [upvotes, setUpvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaintDetails(id);
      setComplaint(data);
      setNewStatus(data.status);
      setUpvotes(data.upvotes || 0);
      setIsUpvoted(data.is_upvoted || false);
    } catch (err) {
      setError(err.message || 'Complaint report not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleUpvote = async () => {
    if (isUpvoted) return;
    try {
      await complaintService.upvoteComplaint(id);
      setUpvotes((prev) => prev + 1);
      setIsUpvoted(true);
    } catch (err) {
      console.error('Error upvoting complaint:', err);
    }
  };

  const handleEvidenceChange = (e) => {
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

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError('');

    const updateData = new FormData();
    updateData.append('status', newStatus);
    if (comments) updateData.append('comments', comments);
    if (evidenceFile) updateData.append('evidence_image', evidenceFile);

    try {
      const updated = await complaintService.updateComplaintStatus(id, updateData);
      setComplaint(updated);
      setEvidencePreview('');
      setEvidenceFile(null);
      setComments('');
      alert('Status updated successfully!');
    } catch (err) {
      setUpdateError(err.message || 'Failed to save status update. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />
        <main className="flex-1 md:pl-64 pt-16 flex items-center justify-center">
          <Loading size="lg" message="Loading filing details..." />
        </main>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />
        <main className="flex-1 md:pl-64 pt-16">
          <div className="p-6">
            <Error message={error} onRetry={fetchComplaintDetails} />
          </div>
        </main>
      </div>
    );
  }

  const userCanUpdate = ['Officer', 'Senior Officer', 'Admin'].includes(user?.role);
  const priorityColor = Number(complaint.priority_score) >= 7 
    ? 'bg-rose-50 border-rose-200 text-rose-700' 
    : (Number(complaint.priority_score) >= 4 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Back Action */}
          <button 
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center select-none"
          >
            &larr; Return to Dashboard
          </button>

          {/* Heading block */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{complaint.title}</h2>
                <StatusBadge status={complaint.status} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-450 uppercase tracking-wider">
                <span className="flex items-center text-slate-400">
                  <Calendar className="h-4 w-4 mr-1.5 text-slate-300 stroke-[2.5]" />
                  Filed: {new Date(complaint.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center text-slate-400">
                  <Building2 className="h-4 w-4 mr-1.5 text-slate-300 stroke-[2.5]" />
                  Division: {complaint.department || 'General'}
                </span>
              </div>
            </div>

            {/* Upvote & Action Panel */}
            <div className="flex items-center space-x-3.5 select-none">
              <button
                onClick={handleUpvote}
                disabled={isUpvoted}
                className={`inline-flex items-center px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                  isUpvoted 
                    ? 'bg-accent-50 text-accent-700 border-accent-150 cursor-default' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650 hover:text-accent-600 active:scale-95'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 mr-2 ${isUpvoted ? 'fill-current text-accent-600' : 'text-slate-450'}`} />
                <span>{upvotes} Upvotes</span>
              </button>

              <div className={`px-4.5 py-2 border rounded-xl text-xs font-bold ${priorityColor}`}>
                Priority: {complaint.priority_score || 'N/A'}
              </div>
            </div>
          </div>

          {/* Timeline Tracker */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Resolution Milestones</h4>
            <Timeline 
              currentStatus={complaint.status} 
              timelineData={complaint.timeline || [
                { status: 'Reported', timestamp: complaint.created_at }
              ]} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Description & Images Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2">Issue Description</h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              {/* Images Evidence Grid */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Verification Proofs</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
                  {/* Citizen Filed Image */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Initial Citizen Upload</p>
                    <div className="aspect-video bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                      {complaint.image ? (
                        <img 
                          src={complaint.image.startsWith('http') || complaint.image.startsWith('data') ? complaint.image : `http://localhost:8000${complaint.image}`} 
                          alt="Citizen evidence" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Photo Provided</span>
                      )}
                    </div>
                  </div>

                  {/* Officer Resolving Image */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Resolution Evidence</p>
                    <div className="aspect-video bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                      {complaint.evidence_image ? (
                        <img 
                          src={complaint.evidence_image.startsWith('http') || complaint.evidence_image.startsWith('data') ? complaint.evidence_image : `http://localhost:8000${complaint.evidence_image}`} 
                          alt="Resolution proof" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No proofs filed yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Resolution Notes
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-sm text-slate-700">
                    {complaint.resolution_notes || "No resolution notes available."}
                  </p>
                </div>
              </div>

              {/* Timeline Comments Logs */}
              {complaint.timeline && complaint.timeline.length > 0 && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 font-bold">Chronological Action Logs</h4>
                  <div className="space-y-4">
                    {complaint.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs leading-normal border-l-2 border-slate-200 pl-4 ml-2.5">
                        <div className="flex-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>Status update: {item.status}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-sans">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          {item.by && <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Updated by: {item.by}</p>}
                          {item.comments && <p className="text-slate-600 mt-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed">{item.comments}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Map & Officer Update Forms */}
            <div className="space-y-6">
              {/* Location details */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-accent-500 stroke-[2.5]" />
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Incident Location</h4>
                </div>
                <p className="text-xs text-slate-700 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-normal">
                  {complaint.location_name || 'Coordinates Pinned Below'}
                </p>

                {/* Map Display */}
                {complaint.lat && complaint.lng && (
                  <Map 
                    selectable={false}
                    markers={[{
                      id: complaint.id,
                      lat: complaint.lat,
                      lng: complaint.lng,
                      title: complaint.title,
                      description: complaint.description,
                      status: complaint.status
                    }]}
                    height="200px"
                  />
                )}
                
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-sans">
                  <div>
                    <p className="text-slate-400 uppercase tracking-wide">Lat</p>
                    <p className="mt-0.5 text-slate-800">{complaint.lat}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase tracking-wide">Lng</p>
                    <p className="mt-0.5 text-slate-800">{complaint.lng}</p>
                  </div>
                </div>
              </div>

              {/* Officer Status Action Form */}
              {userCanUpdate && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center space-x-2 text-purple-700">
                    <ShieldAlert className="h-5 w-5 stroke-[2]" />
                    <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">Officer Audit Panel</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Update status, write log remarks, and upload resolution proof photo.
                  </p>

                  <form onSubmit={handleStatusUpdate} className="space-y-4">
                    {updateError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                        {updateError}
                      </div>
                    )}

                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Action Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="block w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer outline-none transition-all"
                      >
                        <option value="Reported">Reported</option>
                        <option value="Verified">Verified</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Action log comments */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Action Remarks</label>
                      <textarea
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Detail actions taken, contractor details..."
                        className="premium-input resize-none leading-normal text-xs"
                      />
                    </div>

                    {/* Upload evidence resolving photo */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Upload Resolution Evidence</label>
                      <div className="mt-1 flex items-center justify-center p-3 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer select-none">
                        <label className="text-center w-full cursor-pointer flex flex-col items-center">
                          <Upload className="h-5 w-5 text-slate-400 stroke-[1.5] mb-1.5" />
                          <span className="text-[10px] font-bold text-accent-600 hover:underline">Select proof photo</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleEvidenceChange}
                            className="sr-only" 
                          />
                        </label>
                      </div>
                      {evidencePreview && (
                        <div className="mt-2.5 aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={evidencePreview} alt="Evidence Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full flex justify-center items-center py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 outline-none"
                    >
                      {isUpdating ? 'Saving...' : 'Apply Status Update'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComplaintDetails;
