import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import Map from '../components/Map';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { Globe, MapPin, ListTodo, Filter, CheckSquare, Search } from 'lucide-react';

const DEPARTMENTS = [
  { label: 'All Departments', value: 'All' },
  { label: 'Roads & Highways', value: 'Road department' },
  { label: 'Water & Sanitation', value: 'Water department' },
  { label: 'Electricity & Power', value: 'Electricity department' },
  { label: 'Waste Management', value: 'Waste department' },
  { label: 'Transport & Traffic', value: 'Transport department' },
  { label: 'Public Safety', value: 'Public safety department' },
  { label: 'Others', value: 'Other department' },
];

const PublicComplaints = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and Searching states
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPublicComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.warn("API offline, rendering simulated public registry.", err);
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
    fetchPublicComplaints();
  }, []);

  const handleUpvoteSuccess = (id) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1, is_upvoted: true } : c))
    );
  };

  console.log(complaints);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.location_name && c.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
                          
    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate statistics
  const totalCount = complaints.length;
  const activeCount = complaints.filter((c) => c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen flex flex-col">
        {/* Map Header Section */}
        <div className="w-full bg-white border-b border-slate-200 shadow-sm animate-fade-in select-none">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center">
                  <Globe className="h-5 w-5 text-accent-500 mr-2 stroke-[2.5]" />
                  Public Civic Issue Registry
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Browse and audit filed reports across your city today.
                </p>
              </div>

              {/* Stats overview banner */}
              <div className="flex items-center space-x-3.5 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl self-start md:self-auto text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Total Filings</span>
                  <span className="text-slate-800 font-extrabold text-sm">{totalCount}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Active Files</span>
                  <span className="text-amber-600 font-extrabold text-sm">{activeCount}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Resolved</span>
                  <span className="text-emerald-600 font-extrabold text-sm">{resolvedCount}</span>
                </div>
              </div>
            </div>

            {/* Map component display */}
            {!loading && complaints.length > 0 ? (
              <Map 
                center={[18.449299, 73.825601]}
                zoom={12}
                markers={filteredComplaints}
                height="320px"
              />
            ) : (
              <div className="h-[320px] bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                Loading smart city coordinates...
              </div>
            )}
          </div>
        </div>

        {/* Complaints Filter & List Section */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          {/* Search & Filter Controls */}
          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search issues, street names, description landmarks..."
                  className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 focus:bg-white transition-all font-semibold text-slate-800"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Department Horizontal Scrolling Chips */}
            <div className="border-t border-slate-100 pt-3 select-none">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Category Filter</span>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.value}
                    type="button"
                    onClick={() => setDeptFilter(dept.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      deptFilter === dept.value
                        ? 'bg-accent-600 border-accent-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50 hover:text-slate-800'
                    }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center">
              <ListTodo className="h-4.5 w-4.5 text-accent-500 mr-2" />
              Recent Filings
            </h3>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12">
                <Loading message="Syncing municipal registers..." />
              </div>
            ) : error ? (
              <Error message={error} onRetry={fetchPublicComplaints} />
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                  <ListTodo className="h-8 w-8 stroke-[1.2]" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">No reports found</h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Adjust your search keyword or reset the filters to show civic records.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onUpvoteSuccess={handleUpvoteSuccess}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicComplaints;
