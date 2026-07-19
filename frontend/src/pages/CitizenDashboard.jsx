import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/api';
import { Plus, ListTodo, CircleAlert, CheckCircle, Search, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ComplaintCard from '../components/ComplaintCard';
import { Loading } from '../components/Loading';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchCitizenComplaints = async () => {
    setLoading(true);
    try {
      // In mock DB, we filter by logged-in citizen's email
      const data = await complaintService.getComplaints({ citizenEmail: user?.email });
      setComplaints(data);
    } catch (error) {
      console.error('Failed to fetch citizen complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchCitizenComplaints();
    }
  }, [user]);

  const handleUpvote = async (id) => {
    try {
      await complaintService.upvoteComplaint(id, user?.email);
      // Re-fetch or locally modify
      setComplaints(complaints.map(c => {
        if (c.id === id) {
          const email = user?.email;
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
      console.error('Upvote failed:', error);
    }
  };

  // Metrics calculations
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const filteredComplaints = filterStatus 
    ? complaints.filter(c => c.status === filterStatus) 
    : complaints;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Welcome */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Citizen Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Welcome back, {user?.name}. Check the resolution progress of your civic reports.</p>
        </div>
        <Link
          to="/raise-complaint"
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition text-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Reported"
            value={totalCount}
            icon={ListTodo}
            colorClass="text-brand-600 bg-brand-50"
            changeText="Issues submitted by you"
          />
          <StatCard
            title="Pending Actions"
            value={pendingCount}
            icon={CircleAlert}
            colorClass="text-amber-600 bg-amber-50"
            changeText="Under review or in progress"
            changeType="warning"
          />
          <StatCard
            title="Resolved Issues"
            value={resolvedCount}
            icon={CheckCircle}
            colorClass="text-emerald-600 bg-emerald-50"
            changeText="Successfully resolved"
            changeType="positive"
          />
        </div>
      )}

      {/* Grid List & Filters */}
      <div className="space-y-4">
        {/* Filters bar */}
        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Filings</span>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Created">Created</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Cards Grid */}
        {loading ? (
          <Loading text="Loading your reported complaints..." />
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4 max-w-md mx-auto">
            <p className="text-slate-400 text-sm">You haven't reported any civic complaints under this filter.</p>
            <Link
              to="/raise-complaint"
              className="inline-block bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold py-2 px-4 rounded-xl text-xs transition"
            >
              Raise your first complaint
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onUpvote={handleUpvote}
                currentCitizenEmail={user?.email}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CitizenDashboard;
