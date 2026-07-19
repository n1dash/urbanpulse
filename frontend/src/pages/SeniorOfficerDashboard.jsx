import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/api';
import { 
  Building2, ShieldAlert, Award, Clock, AlertTriangle, 
  ChevronRight, TrendingUp, BarChart4, PieChart 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Loading } from '../components/Loading';
import { formatDate, getPriorityDetails } from '../utils/helpers';
// Recharts imports for premium graphics
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, 
  Pie, Cell 
} from 'recharts';

export const SeniorOfficerDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartmentComplaints = async () => {
    setLoading(true);
    try {
      // In a real application, you would load by department
      // We will load all complaints and filter by department in local mock DB
      const data = await complaintService.getComplaints();
      const filtered = data.filter(c => c.department === user?.department);
      setComplaints(filtered);
    } catch (error) {
      console.error('Failed to load department complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.department) {
      fetchDepartmentComplaints();
    }
  }, [user]);

  // Aggregate Metrics
  const totalCount = complaints.length;
  const unassignedCount = complaints.filter(c => !c.officer).length;
  // A mock escalation logic: priorityScore > 75 and status !== Resolved
  const escalatedCount = complaints.filter(c => c.priorityScore > 75 && c.status !== 'Resolved').length;
  const avgPriority = totalCount 
    ? Math.round(complaints.reduce((sum, c) => sum + c.priorityScore, 0) / totalCount) 
    : 0;

  // Chart 1: Status Volumes data
  const statusCounts = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const barChartData = Object.keys(statusCounts).map(status => ({
    name: status,
    tickets: statusCounts[status]
  }));

  // Chart 2: Priority levels data
  const priorityCounts = complaints.reduce((acc, c) => {
    const priority = getPriorityDetails(c.priorityScore).label;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const pieChartColors = ['#f43f5e', '#f97316', '#eab308', '#10b981']; // Rose (Critical), Orange (High), Amber (Medium), Emerald (Low)
  const pieChartLabels = ['Critical', 'High', 'Medium', 'Low'];
  const pieChartData = pieChartLabels.map(label => ({
    name: label,
    value: priorityCounts[label] || 0
  })).filter(item => item.value > 0);

  // Critical/Delayed List (Priority > 60 and not resolved)
  const escalatedIssues = complaints
    .filter(c => c.priorityScore >= 60 && c.status !== 'Resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Department Administration</h1>
        <p className="text-xs text-slate-500 font-medium">
          Senior Oversight Board for the **{user?.department || 'Municipal'}** division. Monitor active workloads and delayed tickets.
        </p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Tickets"
            value={totalCount}
            icon={Building2}
            colorClass="text-indigo-600 bg-indigo-50"
            changeText={`Active in ${user?.department}`}
          />
          <StatCard
            title="Escalated Tickets"
            value={escalatedCount}
            icon={AlertTriangle}
            colorClass="text-rose-600 bg-rose-50"
            changeText="Score above 75, unresolved"
            changeType="negative"
          />
          <StatCard
            title="Unassigned Cases"
            value={unassignedCount}
            icon={Clock}
            colorClass="text-amber-600 bg-amber-50"
            changeText="Require officer assignment"
            changeType="warning"
          />
          <StatCard
            title="Average Priority"
            value={`${avgPriority}%`}
            icon={Award}
            colorClass="text-brand-600 bg-brand-50"
            changeText="Overall department severity"
          />
        </div>
      )}

      {/* Analytics Charts Grid */}
      {!loading && complaints.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Bar Chart (Status Distribution) */}
          <div className="lg:col-span-2 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 shrink-0">
              <BarChart4 className="w-4 text-slate-400" />
              <h3 className="font-bold text-slate-700 text-sm">Lifecycle Status Volumes</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '11px', border: 'none' }} 
                  />
                  <Bar dataKey="tickets" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Pie Chart (Priority Levels) */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 shrink-0">
              <PieChart className="w-4 text-slate-400" />
              <h3 className="font-bold text-slate-700 text-sm">Severity Ratio</h3>
            </div>
            <div className="h-64 flex flex-col items-center justify-center">
              {pieChartData.length > 0 ? (
                <div className="w-full h-4/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => {
                          const labelIdx = pieChartLabels.indexOf(entry.name);
                          return <Cell key={`cell-${index}`} fill={pieChartColors[labelIdx]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '11px', border: 'none' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No priority data</p>
              )}
              {/* Pie Legends */}
              <div className="flex flex-wrap justify-center gap-3 text-[10px] font-bold text-slate-500 mt-2">
                {pieChartData.map((item, index) => {
                  const labelIdx = pieChartLabels.indexOf(item.name);
                  return (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieChartColors[labelIdx] }} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Escalated Issues Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Escalated & Actionable Issues</h2>
          <span className="text-xs text-slate-400 font-medium">Tickets requiring immediate assignment/review</span>
        </div>

        {loading ? (
          <Loading text="Loading escalations..." />
        ) : escalatedIssues.length === 0 ? (
          <div className="p-12 bg-white border border-slate-100 rounded-3xl text-center text-slate-400 text-sm shadow-sm">
            Excellent! No escalated or delayed tickets currently in division queue.
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Incident Title</th>
                    <th className="p-4">Priority Score</th>
                    <th className="p-4">Assigned Officer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date Filed</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {escalatedIssues.map((c) => {
                    const priority = getPriorityDetails(c.priorityScore);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 pl-6 font-mono font-bold text-slate-400">{c.id}</td>
                        <td className="p-4 font-bold text-slate-800">{c.title}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 border rounded-full font-semibold ${priority.color}`}>
                            {c.priorityScore} ({priority.label})
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {c.officer ? (
                            <span>{c.officer.name}</span>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">Unassigned</span>
                          )}
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
                            Assign/Edit
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
export default SeniorOfficerDashboard;
