import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/api';
import { ListTodo, ShieldAlert, CheckCircle, Search, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Loading } from '../components/Loading';
import { formatDate, getPriorityDetails } from '../utils/helpers';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      // Fetch complaints assigned to this specific officer's email
      const data = await complaintService.getComplaints({ officerEmail: user?.email });
      setComplaints(data);
    } catch (error) {
      console.error('Failed to load officer complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchAssignedComplaints();
    }
  }, [user]);

  // Metrics
  const totalAssigned = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Field Officer Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium">
          Welcome back, {user?.name}. Manage and progress civic repair tickets for the **{user?.department || 'General'}** division.
        </p>
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
            title="Total Assigned"
            value={totalAssigned}
            icon={ListTodo}
            colorClass="text-brand-600 bg-brand-50"
            changeText="Total tickets in your queue"
          />
          <StatCard
            title="Active Cases"
            value={inProgressCount}
            icon={ShieldAlert}
            colorClass="text-amber-600 bg-amber-50"
            changeText="Pending action or in progress"
            changeType="warning"
          />
          <StatCard
            title="Resolved Tickets"
            value={resolvedCount}
            icon={CheckCircle}
            colorClass="text-emerald-600 bg-emerald-50"
            changeText="Completed and closed"
            changeType="positive"
          />
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 transition"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Verified">Verified</option>
            </select>
          </div>
        </div>

        {/* Tickets table */}
        {loading ? (
          <Loading text="Loading assigned issues..." />
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 border border-slate-200 border-dashed rounded-2xl text-center text-slate-400 text-sm">
            No complaints found in your queue under this filter.
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Complaint Title</th>
                    <th className="p-4">Priority Score</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date Filed</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredComplaints.map((c) => {
                    const priority = getPriorityDetails(c.priorityScore);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 pl-6 font-mono font-bold text-slate-400">{c.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 line-clamp-1">{c.title}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border rounded-full font-semibold ${priority.color}`}>
                            {c.priorityScore} ({priority.label})
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{c.location?.address}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="p-4 text-slate-400">{formatDate(c.createdAt)}</td>
                        <td className="p-4 pr-6 text-right">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-3 py-1.5 rounded-xl transition inline-block text-[11px]"
                          >
                            Update
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OfficerDashboard;
