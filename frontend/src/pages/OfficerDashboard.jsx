import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import Loading from '../components/Loading';
import Error from '../components/Error';
import {
  Briefcase,
  Clock,
  BadgeCheck,
  AlertTriangle,
  Filter,
  Calendar,
  Search,
  X,
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
  Inbox
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.warn("API offline, falling back to simulated local database.", err);
      const localData = localStorage.getItem('urbanpulse_mock_complaints');
      if (localData) {
        setComplaints(JSON.parse(localData));
      } else {
        const dummyComplaints = [
          {
            id: 1,
            title: "Severe Road Damage on 5th Avenue",
            description: "Deep potholes have formed in the middle of the road near the metro station, causing traffic congestion and severe hazard to motorcyclists.",
            department: "Roads & Highways",
            status: "In Progress",
            priority_score: 8,
            upvotes: 42,
            location_name: "5th Avenue Metro Stn",
            lat: 12.9716,
            lng: 77.5946,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            title: "Water Leakage near Central Park",
            description: "A main municipal water pipe has burst, wasting thousands of gallons of clean drinking water and flooding the pedestrian walkway.",
            department: "Water & Sanitation",
            status: "Created",
            priority_score: 5,
            upvotes: 19,
            location_name: "Central Park West Gate",
            lat: 12.9801,
            lng: 77.6012,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            title: "Damaged Electric Substation Fencing",
            description: "The protective wire fencing around the local electricity sub-station is completely broken. Stray animals and children are entering the high-voltage hazard zone.",
            department: "Electricity & Power",
            status: "Resolved",
            priority_score: 9,
            upvotes: 112,
            location_name: "Sector 4 Utility Compound",
            lat: 12.9654,
            lng: 77.5876,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem('urbanpulse_mock_complaints', JSON.stringify(dummyComplaints));
        setComplaints(dummyComplaints);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const handleUpvoteSuccess = (id) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1, is_upvoted: true } : c))
    );
  };

  // Filter complaints list based on filters + search (frontend-only, existing logic preserved)
  const filteredComplaints = complaints.filter((c) => {
    const statusMatch = statusFilter === 'All' || c.status === statusFilter;

    let priorityMatch = true;
    if (priorityFilter !== 'All') {
      const score = Number(c.priority_score) || 0;
      if (priorityFilter === 'High') priorityMatch = score >= 7;
      else if (priorityFilter === 'Medium') priorityMatch = score >= 4 && score < 7;
      else if (priorityFilter === 'Low') priorityMatch = score < 4;
    }

    const query = searchQuery.trim().toLowerCase();
    const searchMatch =
      query === '' ||
      c.title?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.location_name?.toLowerCase().includes(query);

    return statusMatch && priorityMatch && searchMatch;
  });

  const hasActiveFilters = statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  // Calculate metrics
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'in progress'
  ).length;
  const completedCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'resolved'
  ).length;
  const highPriorityCount = complaints.filter(
    (c) => (Number(c.priority_score) || 0) >= 7
  ).length;

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentFormattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 animate-fade-in">
          {/* Welcoming Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {user?.username || 'Officer'} 👋
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Manage your assigned complaints and keep citizens informed with timely progress updates.
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-450 stroke-[2.5]" />
                {currentFormattedDate}
              </span>
            </div>
          </div>

          {/* Core Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Metrics & Filter Bar & Complaints lists */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 select-none">
                {/* Assigned */}
                <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 flex-shrink-0">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Assigned</p>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</h3>
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">In Progress</p>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{inProgressCount}</h3>
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
                    <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Completed</p>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{completedCount}</h3>
                  </div>
                </div>

                {/* High Priority */}
                <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">High Priority</p>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{highPriorityCount}</h3>
                  </div>
                </div>
              </div>

              {/* Search & Filters Bar */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Filter className="h-4 w-4 text-accent-500 stroke-[2.5]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Work Queue Filters</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, description, or location..."
                      className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {/* Status */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-650 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Created">Created</option>
                      <option value="Verified">Verified</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    {/* Priority */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-650 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer outline-none"
                    >
                      <option value="All">All Priorities</option>
                      <option value="High">High (Score &ge; 7)</option>
                      <option value="Medium">Medium (Score 4 - 6)</option>
                      <option value="Low">Low (Score &lt; 4)</option>
                    </select>

                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-slate-50 hover:bg-rose-50 rounded-xl px-3 py-2 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned List */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center">
                  <ClipboardCheck className="h-4.5 w-4.5 text-accent-500 mr-2" />
                  My Assigned Complaints
                </h3>

                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12">
                    <Loading message="Loading your assigned complaints..." />
                  </div>
                ) : error ? (
                  <Error message={error} onRetry={fetchAssignedComplaints} />
                ) : complaints.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl border border-slate-100 mb-4">
                      <Inbox className="h-8 w-8 stroke-[1.5]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-700 mb-1.5">No assigned complaints yet</h4>
                    <p className="text-xs font-semibold text-slate-400 max-w-sm leading-relaxed">
                      New assignments from your Senior Officer will appear here.
                    </p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                      <AlertTriangle className="h-8 w-8 stroke-[1.2]" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">No matching complaints</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                      No complaints in your queue match the selected search or filters.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-700 bg-accent-50 hover:bg-accent-100 border border-accent-100 rounded-xl px-4 py-2 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredComplaints.map((complaint) => (
                      <div key={complaint.id} className="transition-transform duration-200 hover:-translate-y-1">
                        <ComplaintCard
                          complaint={complaint}
                          onUpvoteSuccess={handleUpvoteSuccess}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Responsibilities & Priority Guidelines */}
            <div className="space-y-6">
              {/* Today's Responsibilities */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 select-none">
                <div className="flex items-center space-x-2 text-slate-700">
                  <ShieldCheck className="h-5 w-5 text-accent-500 stroke-[2.5]" />
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Today's Responsibilities</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  A quick checklist to guide how you work through your assigned complaints today.
                </p>

                <ul className="space-y-3 pt-1">
                  {[
                    'Review assigned complaints',
                    'Visit complaint location',
                    'Update complaint progress',
                    'Resolve issues within SLA',
                    'Keep citizens informed'
                  ].map((task) => (
                    <li key={task} className="flex items-start space-x-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0 stroke-[2]" />
                      <span className="text-xs font-semibold text-slate-650 leading-relaxed">{task}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-bold text-slate-650">
                  <span>Assigned Dept:</span>
                  <span className="bg-accent-50 border border-accent-100 text-accent-700 px-2 py-0.5 rounded-md text-[10px]">
                    Municipal Operations
                  </span>
                </div>
              </div>

              {/* Priority Guidelines */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-700">
                  <AlertTriangle className="h-4.5 w-4.5 text-accent-500" />
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Priority Guidelines</h4>
                </div>
                <div className="space-y-3.5 text-xs text-slate-500 leading-normal font-medium">
                  <div className="flex items-start space-x-2.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                    <p>
                      <span className="font-bold text-slate-700">High Priority</span> — Resolve within 24 hours.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    <p>
                      <span className="font-bold text-slate-700">Medium Priority</span> — Resolve within 48 hours.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <p>
                      <span className="font-bold text-slate-700">Low Priority</span> — Resolve within 72 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OfficerDashboard;
