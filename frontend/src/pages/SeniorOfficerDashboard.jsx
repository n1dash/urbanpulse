import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ComplaintCard from '../components/ComplaintCard';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { 
  BarChart3, 
  AlertOctagon, 
  History, 
  Hourglass, 
  ClipboardList, 
  TrendingUp,
  Calendar,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

const SeniorOfficerDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState('Overview');

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

  // Derive specialized complaint groupings
  const escalatedComplaints = complaints.filter(
    (c) => (Number(c.priority_score) >= 8 || c.upvotes >= 50) && c.status.toLowerCase() !== 'resolved'
  );

  const delayedComplaints = complaints.filter((c) => {
    if (c.status.toLowerCase() === 'resolved') return false;
    const createdAt = new Date(c.created_at);
    const diffTime = Math.abs(Date.now() - createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 7; 
  });

  // Calculate metrics
  const totalDepartmentCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status.toLowerCase() === 'resolved').length;
  const resolutionRate = totalDepartmentCount > 0 ? Math.round((resolvedCount / totalDepartmentCount) * 100) : 0;

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
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
          {/* Header Greeting Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {user?.username || 'Senior Officer'} 👋
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
            </div>
          </div>

          {/* Statistics Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
            {/* Total */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                <ClipboardList className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filings</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalDepartmentCount}</h3>
              </div>
            </div>

            {/* Escalated */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <AlertOctagon className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Escalated Queue</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{escalatedComplaints.length}</h3>
              </div>
            </div>

            {/* Delayed */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Hourglass className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delayed &gt; 7 Days</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{delayedComplaints.length}</h3>
              </div>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <TrendingUp className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution Rate</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{resolutionRate}%</h3>
              </div>
            </div>
          </div>

          {/* Navigation tabs selector */}
          <div className="flex border-b border-slate-200 select-none">
            {['Overview', 'Escalated', 'Delayed', 'All Department'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-accent-600 text-accent-700 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-655'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List display based on selected tab */}
          <div>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12">
                <Loading message="Compiling analytics dashboard..." />
              </div>
            ) : error ? (
              <Error message={error} onRetry={fetchDepartmentComplaints} />
            ) : (
              <div className="space-y-6">
                {/* Overview tab */}
                {activeTab === 'Overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Escalated block */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center">
                            <AlertOctagon className="h-4.5 w-4.5 text-rose-500 mr-2" />
                            High Priority Escalations
                          </h4>
                          <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {escalatedComplaints.length} Alert{escalatedComplaints.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {escalatedComplaints.length === 0 ? (
                          <p className="text-xs text-slate-400 font-semibold p-4 text-center">No active escalations present in the system.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {escalatedComplaints.slice(0, 4).map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl hover:border-slate-300 transition-colors">
                                <div className="truncate pr-4">
                                  <h5 className="text-xs font-bold text-slate-800 truncate">{item.title}</h5>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Priority Score: {item.priority_score} | Upvotes: {item.upvotes}</p>
                                </div>
                                <a 
                                  href={`/complaints/${item.id}`}
                                  className="inline-flex items-center text-[10px] font-bold text-accent-600 hover:text-accent-700 hover:underline flex-shrink-0"
                                >
                                  Audit <ChevronRight className="h-3 w-3 ml-0.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {escalatedComplaints.length > 4 && (
                        <button 
                          onClick={() => setActiveTab('Escalated')}
                          className="w-full text-center text-xs font-bold text-slate-450 hover:text-slate-700 pt-4 border-t border-slate-100 mt-2.5"
                        >
                          View all escalated items &rarr;
                        </button>
                      )}
                    </div>

                    {/* Delayed block */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center">
                            <Hourglass className="h-4.5 w-4.5 text-amber-500 mr-2" />
                            Delayed Performance Warnings
                          </h4>
                          <span className="bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {delayedComplaints.length} Delayed
                          </span>
                        </div>
                        
                        {delayedComplaints.length === 0 ? (
                          <p className="text-xs text-slate-400 font-semibold p-4 text-center">All department filings are resolving within SLA limits.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {delayedComplaints.slice(0, 4).map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl hover:border-slate-300 transition-colors">
                                <div className="truncate pr-4">
                                  <h5 className="text-xs font-bold text-slate-800 truncate">{item.title}</h5>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Filed: {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                                <a 
                                  href={`/complaints/${item.id}`}
                                  className="inline-flex items-center text-[10px] font-bold text-accent-600 hover:text-accent-700 hover:underline flex-shrink-0"
                                >
                                  Audit <ChevronRight className="h-3 w-3 ml-0.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {delayedComplaints.length > 4 && (
                        <button 
                          onClick={() => setActiveTab('Delayed')}
                          className="w-full text-center text-xs font-bold text-slate-450 hover:text-slate-700 pt-4 border-t border-slate-100 mt-2.5"
                        >
                          View all delayed reports &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Escalated List view */}
                {activeTab === 'Escalated' && (
                  escalatedComplaints.length === 0 ? (
                    <div className="bg-white p-12 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold">
                      No active escalated issues.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {escalatedComplaints.map((complaint) => (
                        <ComplaintCard key={complaint.id} complaint={complaint} onUpvoteSuccess={handleUpvoteSuccess} />
                      ))}
                    </div>
                  )
                )}

                {/* Delayed List view */}
                {activeTab === 'Delayed' && (
                  delayedComplaints.length === 0 ? (
                    <div className="bg-white p-12 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold">
                      No unresolved delayed complaints.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {delayedComplaints.map((complaint) => (
                        <ComplaintCard key={complaint.id} complaint={complaint} onUpvoteSuccess={handleUpvoteSuccess} />
                      ))}
                    </div>
                  )
                )}

                {/* All Department List view */}
                {activeTab === 'All Department' && (
                  complaints.length === 0 ? (
                    <div className="bg-white p-12 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold">
                      No complaints registered in the department registry.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {complaints.map((complaint) => (
                        <ComplaintCard key={complaint.id} complaint={complaint} onUpvoteSuccess={handleUpvoteSuccess} />
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeniorOfficerDashboard;
