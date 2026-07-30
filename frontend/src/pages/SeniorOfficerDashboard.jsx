import React, { useState, useEffect, useMemo } from 'react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SeniorComplaintCard from '../components/SeniorComplaintCard';
import Loading from '../components/Loading';
import Error from '../components/Error';
import {
  ClipboardList,
  Hourglass,
  Activity,
  CheckCircle2,
  Calendar,
  Search,
  SlidersHorizontal,
  X,
  Inbox,
  FileSearch
} from 'lucide-react';

const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

const getPriorityLevel = (score) => {
  const n = Number(score);
  if (n >= 8) return 'High';
  if (n >= 5) return 'Medium';
  return 'Low';
};

const SeniorOfficerDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Frontend-only search & filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchDepartmentComplaints = async () => {
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
            lat: 18.449299,
            lng: 73.825601,
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
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
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
          },
          {
            id: 4,
            title: "Open drainage cover in Sector-C Market",
            description: "A large concrete drainage cover is broken and missing, leaving a 4-foot deep open pit directly on the footpath of a busy market lane.",
            department: "Water & Sanitation",
            status: "Assigned",
            priority_score: 9,
            upvotes: 68,
            location_name: "Sector C Main Bazaar",
            lat: 12.9789,
            lng: 77.5901,
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
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
    fetchDepartmentComplaints();
  }, []);

  const handleUpvoteSuccess = (id) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1, is_upvoted: true } : c))
    );
  };

  // Core KPI metrics
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length;
  const inProgressCount = complaints.filter((c) => (c.status || '').toLowerCase() === 'in progress').length;
  const pendingCount = totalCount - resolvedCount - inProgressCount;

  // Distinct statuses present in the data, used to build the status filter options
  const statusOptions = useMemo(() => {
    const distinct = Array.from(new Set(complaints.map((c) => c.status).filter(Boolean)));
    return ['All', ...distinct];
  }, [complaints]);

  // Apply frontend-only search + filters
  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return complaints.filter((c) => {
      const matchesSearch =
        query === '' ||
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.location_name?.toLowerCase().includes(query);

      const matchesPriority = priorityFilter === 'All' || getPriorityLevel(c.priority_score) === priorityFilter;
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [complaints, searchQuery, priorityFilter, statusFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || priorityFilter !== 'All' || statusFilter !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setStatusFilter('All');
  };

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

  const statCards = [
    {
      key: 'total',
      label: 'Total Complaints',
      value: totalCount,
      icon: ClipboardList,
      iconBg: 'bg-[#EFF4FC]',
      iconColor: 'text-[#3B82F6]',
      iconBorder: 'border-[#DBEAFE]'
    },
    {
      key: 'pending',
      label: 'Pending',
      value: pendingCount,
      icon: Hourglass,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      iconBorder: 'border-amber-100'
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      value: inProgressCount,
      icon: Activity,
      iconBg: 'bg-[#EFF4FC]',
      iconColor: 'text-[#2563EB]',
      iconBorder: 'border-[#DBEAFE]'
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      iconBorder: 'border-emerald-100'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 animate-fade-in">
          {/* Header Greeting Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#F7FAFF] via-[#EEF4FF] to-[#DBEAFE]/50 border border-[#3B82F6]/15 px-5 py-6 shadow-[0_2px_16px_-4px_rgba(59,130,246,0.18)]">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2A4A] tracking-tight">
                {getGreeting()}, {user?.username || 'Senior Officer'} 👋
              </h2>
              <p className="text-xs font-bold text-[#6B84A3] uppercase tracking-wider">
                Here's what's happening across your city today.
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <span className="inline-flex items-center text-[10px] font-bold text-[#6B84A3] bg-white border border-[#3B82F6]/20 px-3 py-1.5 rounded-xl shadow-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-[#3B82F6] stroke-[2.5]" />
                {currentFormattedDate}
              </span>
            </div>
          </div>

          {/* KPI Statistic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 select-none">
            {statCards.map(({ key, label, value, icon: Icon, iconBg, iconColor, iconBorder }) => (
              <div
                key={key}
                className="bg-white border border-[#3B82F6]/15 p-4 sm:p-5 rounded-2xl flex items-center space-x-4 shadow-[0_2px_14px_-4px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`p-3 ${iconBg} ${iconColor} rounded-xl border ${iconBorder} flex-shrink-0`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B84A3] truncate">{label}</p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F2A4A] mt-0.5">{value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white border border-[#3B82F6]/15 rounded-2xl p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(59,130,246,0.15)]">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8FA3C0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, description, or location..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm font-medium text-[#0F2A4A] bg-[#F7FAFF] border border-[#3B82F6]/20 rounded-xl placeholder:text-[#8FA3C0] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 focus:border-[#3B82F6] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA3C0] hover:text-[#3B82F6]"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Priority filter */}
              <div className="flex items-center gap-2 sm:w-auto">
                <SlidersHorizontal className="hidden sm:block h-4 w-4 text-[#8FA3C0] flex-shrink-0" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="flex-1 lg:flex-none text-xs sm:text-sm font-semibold text-[#0F2A4A] bg-[#F7FAFF] border border-[#3B82F6]/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 focus:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'All' ? 'All Priorities' : `${option} Priority`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2 sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 lg:flex-none text-xs sm:text-sm font-semibold text-[#0F2A4A] bg-[#F7FAFF] border border-[#3B82F6]/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/25 focus:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'All' ? 'All Statuses' : option}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#6B84A3] hover:text-rose-600 border border-[#3B82F6]/20 hover:border-rose-200 bg-[#F7FAFF] hover:bg-rose-50 rounded-xl px-3.5 py-2.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Complaint List */}
          <div>
            {loading ? (
              <div className="bg-white rounded-2xl border border-[#3B82F6]/15 p-12">
                <Loading message="Compiling department complaint records..." />
              </div>
            ) : error ? (
              <Error message={error} onRetry={fetchDepartmentComplaints} />
            ) : complaints.length === 0 ? (
              <div className="bg-white border border-[#3B82F6]/15 rounded-2xl p-12 sm:p-16 flex flex-col items-center text-center shadow-[0_2px_14px_-4px_rgba(59,130,246,0.15)]">
                <div className="p-4 bg-[#EFF4FC] text-[#8FA3C0] rounded-2xl border border-[#DBEAFE] mb-4">
                  <Inbox className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-extrabold text-[#0F2A4A]">No complaints registered yet</h4>
                <p className="text-xs font-semibold text-[#6B84A3] mt-1.5 max-w-sm">
                  New complaints filed for your department will show up here as soon as they arrive.
                </p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-white border border-[#3B82F6]/15 rounded-2xl p-12 sm:p-16 flex flex-col items-center text-center shadow-[0_2px_14px_-4px_rgba(59,130,246,0.15)]">
                <div className="p-4 bg-[#EFF4FC] text-[#8FA3C0] rounded-2xl border border-[#DBEAFE] mb-4">
                  <FileSearch className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-extrabold text-[#0F2A4A]">No complaints match your filters</h4>
                <p className="text-xs font-semibold text-[#6B84A3] mt-1.5 max-w-sm">
                  Try adjusting your search term or resetting the priority and status filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] bg-[#EFF4FC] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl px-4 py-2 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-[#6B84A3] uppercase tracking-wider px-1">
                  Showing {filteredComplaints.length} of {totalCount} complaint{totalCount !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="transition-transform duration-200 hover:-translate-y-1"
                    >
                      <SeniorComplaintCard complaint={complaint} onUpvoteSuccess={handleUpvoteSuccess} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeniorOfficerDashboard;
