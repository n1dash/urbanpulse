import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import ComplaintCard from '../components/ComplaintCard';
import Map from '../components/Map';
import { Loading } from '../components/Loading';

export const PublicComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(12);
  const [focusedLocation, setFocusedLocation] = useState(null);

  // Departments list
  const departments = ['Roads & Traffic', 'Water & Sewage', 'Electricity & Lighting', 'Waste Management', 'Transport & Transit'];
  const statuses = ['Created', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Failed to load public complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpvote = async (id) => {
    try {
      const response = await complaintService.upvoteComplaint(id, user?.email);
      // Update local state
      setComplaints(complaints.map(c => {
        if (c.id === id) {
          const email = user?.email || 'citizen@urbanpulse.gov';
          const alreadyUpvoted = c.upvotedBy.includes(email);
          return {
            ...c,
            upvotes: alreadyUpvoted ? Math.max(0, c.upvotes - 1) : c.upvotes + 1,
            upvotedBy: alreadyUpvoted ? c.upvotedBy.filter(e => e !== email) : [...c.upvotedBy, email]
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Failed to upvote complaint:', error);
    }
  };

  const handleCardFocus = (complaint) => {
    if (complaint.location && complaint.location.lat && complaint.location.lng) {
      setFocusedLocation({ lat: complaint.location.lat, lng: complaint.location.lng });
      setMapZoom(15);
    }
  };

  // Filter complaints based on UI selectors
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === '' || c.department === selectedDept;
    const matchesStatus = selectedStatus === '' || c.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      
      {/* Left Pane: Interactive Map (Hidden on mobile by default, toggled via map view mode later) */}
      <div className="w-full lg:w-1/2 h-80 lg:h-full order-1 lg:order-2">
        <Map
          mode="view"
          center={mapCenter}
          zoom={mapZoom}
          complaints={filteredComplaints}
          selectedLocation={focusedLocation}
          onMarkerClick={(complaint) => handleCardFocus(complaint)}
        />
      </div>

      {/* Right Pane: Search, Filters, and List Feed */}
      <div className="w-full lg:w-1/2 h-[calc(100vh-24rem)] lg:h-full overflow-y-auto p-6 space-y-6 order-2 lg:order-1 flex flex-col">
        
        {/* Header */}
        <div className="space-y-1.5 shrink-0">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Public Civic Board</h1>
          <p className="text-xs text-slate-500 font-medium">Explore active civic complaints across the city and upvote critical issues.</p>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by issue ID, title, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 transition"
            />
          </div>

          {/* Selector dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Department selector */}
            <div className="flex-1">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            {/* Status selector */}
            <div className="flex-1">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* List Feed */}
        <div className="flex-1 space-y-4">
          {loading ? (
            <Loading text="Loading city issues..." />
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
              No matching complaints found. Try clearing filters or search queries.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
              {filteredComplaints.map((complaint) => (
                <div 
                  key={complaint.id} 
                  onClick={() => handleCardFocus(complaint)}
                  className="cursor-pointer"
                >
                  <ComplaintCard
                    complaint={complaint}
                    onUpvote={handleUpvote}
                    currentCitizenEmail={user?.email}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PublicComplaints;
