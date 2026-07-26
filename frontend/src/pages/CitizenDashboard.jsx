import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Map from '../components/Map';
import { PlusCircle, ListTodo, CheckSquare, Clock, ShieldCheck, MapPin, Calendar, HelpCircle } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState("my");

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.warn("API unavailable, falling back to simulated local database.", err);
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
    fetchComplaints();
  }, []);

  const handleUpvoteSuccess = (id) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1, is_upvoted: true } : c))
    );
    const localData = localStorage.getItem('urbanpulse_mock_complaints');
    if (localData) {
      const parsed = JSON.parse(localData);
      const updated = parsed.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1, is_upvoted: true } : c));
      localStorage.setItem('urbanpulse_mock_complaints', JSON.stringify(updated));
    }
  };

  // Compute metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status && c.status.toLowerCase() !== 'resolved'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status && c.status.toLowerCase() === 'resolved'
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

      <main className="flex-1 md:pl-64 pt-16 min-h-screen flex flex-col">
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
          {/* Welcome Header block */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {user?.username || 'Citizen'} 👋
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Here's what's happening across your city today.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <span className="inline-flex items-center text-[10px] font-bold text-slate-450 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-450 stroke-[2.5]" />
                {currentFormattedDate}
              </span>

              <Link
                to="/citizen/raise"
                className="inline-flex items-center px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-600/10 active:scale-95 transition-all"
              >
                <PlusCircle className="h-4 w-4 mr-2 stroke-[2.5]" />
                Report New Issue
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 select-none">
            {/* Total */}
            <div className="bg-white border border-slate-250/60 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <ListTodo className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filings</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</h3>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white border border-slate-250/60 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Clock className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Resolution</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{pendingCount}</h3>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white border border-slate-250/60 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <CheckSquare className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved Issues</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{resolvedCount}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Preview & Recent reports lists */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Preview Container */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-accent-500 stroke-[2.5]" />
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Your Reported Area Map</h4>
                </div>
                {!loading && complaints.length > 0 ? (
                  <Map 
                    center={[18.449299, 73.825601]}
                    zoom={13}
                    markers={complaints}
                    height="280px"
                  />
                ) : (
                  <div className="h-[280px] bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                    No active complaint coordinates available to display.
                  </div>
                )}
              </div>

              {/* Complaints Registry */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent-500 mr-2 stroke-[2.5]" />
                  Your Filed Complaints Registry
                </h3>

                <div className="flex gap-2 mt-4 mb-6">
                  <button
                    onClick={() => setViewMode("my")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      viewMode === "my"
                        ? "bg-accent-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    My Complaints
                  </button>

                  <button
                    onClick={() => setViewMode("community")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      viewMode === "community"
                        ? "bg-accent-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Community Complaints
                  </button>
                </div>

                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12">
                    <Loading message="Syncing complaints registry..." />
                  </div>
                ) : error ? (
                  <Error message={error} onRetry={fetchComplaints} />
                ) : complaints.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                      <ListTodo className="h-8 w-8 stroke-[1.2]" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">No civic filings reported yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                      All your reported urban issues (potholes, streetlights, leakages) will display here for monitoring.
                    </p>
                    <Link
                      to="/citizen/raise"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors active:scale-95 shadow-sm"
                    >
                      File Your First Report
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(viewMode === "my"
                      ? complaints.filter(
                          (complaint) =>
                            complaint.user?.id === user?.id || complaint.user === user?.id
                        )
                      : complaints.filter(
                          (complaint) =>
                            complaint.user?.id !== user?.id && complaint.user !== user?.id
                        )
                    ).map((complaint) => (
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

            {/* Right Column: Quick actions, helpline directory */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Quick Portal Actions</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <Link 
                    to="/citizen/raise"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <PlusCircle className="h-4.5 w-4.5 text-accent-500" />
                      <span className="text-xs font-bold text-slate-700">File Civic Complaint</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-sans">&rarr;</span>
                  </Link>

                  <Link 
                    to="/public-complaints"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="h-4.5 w-4.5 text-accent-500" />
                      <span className="text-xs font-bold text-slate-700">Browse Public Map Feed</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-sans">&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Informational Helpline */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-650">
                  <HelpCircle className="h-4.5 w-4.5 text-accent-500" />
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Helpline Directory</h4>
                </div>
                <p className="text-[11px] text-slate-550 leading-relaxed">
                  For active electrical shock hazards, gas leaks, or police emergencies, call the respective authorities immediately.
                </p>
                <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Emergency Response:</span>
                    <span>112</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Water Board:</span>
                    <span>1916</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Electricity Helpline:</span>
                    <span>1912</span>
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

export default CitizenDashboard;
