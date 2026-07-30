import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { adminService, complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import Error from '../components/Error';
import { Building2, Users, UserCog, Plus, ShieldAlert, Calendar, CheckSquare, ListTodo, Check } from 'lucide-react';

const AdminDashboard = () => {
  console.log("ADMIN DASHBOARD LOADED");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredComplaints = complaints.filter((c) => {
    const departmentMatch =
      departmentFilter === "All" ||
      c.department === departmentFilter;

    const statusMatch =
      statusFilter === "All" ||
      c.status === statusFilter;

    const priorityMatch =
      priorityFilter === "All" ||
      (c.priority_score >= 70 && priorityFilter === "High") ||
      (c.priority_score >= 40 &&
        c.priority_score < 70 &&
        priorityFilter === "Medium") ||
      (c.priority_score < 40 && priorityFilter === "Low");

    return departmentMatch && statusMatch && priorityMatch;
  });

  const totalComplaints = complaints.length;

  const resolvedComplaints = complaints.filter(
    (c) => c.status === "Resolved"
  ).length;

  const inProgressComplaints = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;

  const highPriorityComplaints = complaints.filter(
    (c) => c.priority_score >= 70
  ).length;
  const [activeTab, setActiveTab] = useState('Departments');

  // New Department Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [submittingDept, setSubmittingDept] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [deptsData, usersData, complaintsData] = await Promise.all([
        adminService.getDepartments(),
        adminService.getUsers(),
        complaintService.getComplaints()
      ]);

      setDepartments(deptsData);
      setUsers(usersData);
      setComplaints(complaintsData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName || !newDeptHead) return;
    setSubmittingDept(true);

    try {
      const added = await adminService.createDepartment({ name: newDeptName, head: newDeptHead });
      setDepartments((prev) => [...prev, { ...added, head: newDeptHead }]);
      setNewDeptName('');
      setNewDeptHead('');
      alert('Department created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create department. Please try again.');
    } finally {
      setSubmittingDept(false);
    }
  };

  const handleRoleChange = async (userId, targetRole) => {
    let payload = { role: targetRole };

    if (targetRole === 'Officer' || targetRole === 'Senior Officer') {
      if (departments.length === 0) {
        alert('No departments exist yet. Create a department first before assigning officers.');
        return;
      }
      const deptOptions = departments.map((d) => `${d.id}: ${d.name}`).join('\n');
      const deptInput = window.prompt(`Assign to which department? Enter the department ID:\n${deptOptions}`);
      const deptId = parseInt(deptInput, 10);
      if (!deptInput || !departments.some((d) => d.id === deptId)) {
        alert('Officer assignment cancelled - a valid department ID is required.');
        return;
      }
      const designation = window.prompt('Enter a designation/title for this officer (e.g. "Field Inspector"):');
      if (!designation) {
        alert('Officer assignment cancelled - a designation is required.');
        return;
      }
      payload = { role: targetRole, department: deptId, designation };
    }

    try {
      await adminService.updateUserRole(userId, payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update role. Please try again.');
    }
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

  return (
    <div className="min-h-screen bg-[#FAF8FF] flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
          {/* Welcoming Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#FAF8FF] via-[#F3EEFF] to-[#EDE9FE]/50 border border-[#8B5CF6]/15 px-5 py-6 shadow-[0_2px_16px_-4px_rgba(139,92,246,0.18)]">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-[#2E1C4D] tracking-tight">
                {getGreeting()}, {user?.username || 'Administrator'} 👋
              </h2>
              <p className="text-xs font-bold text-[#8577A3] uppercase tracking-wider">
                Here's what's happening across your city today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#8B5CF6]/15 p-5 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)]">
                <p className="text-xs text-[#8577A3] font-semibold">Total Complaints</p>
                <h2 className="text-3xl font-bold mt-2 text-[#2E1C4D]">{totalComplaints}</h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#8B5CF6]/15 p-5 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)]">
                <p className="text-xs text-[#8577A3] font-semibold">Resolved</p>
                <h2 className="text-3xl font-bold mt-2 text-[#2E1C4D]">{resolvedComplaints}</h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#8B5CF6]/15 p-5 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)]">
                <p className="text-xs text-[#8577A3] font-semibold">In Progress</p>
                <h2 className="text-3xl font-bold mt-2 text-[#2E1C4D]">{inProgressComplaints}</h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#8B5CF6]/15 p-5 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)]">
                <p className="text-xs text-[#8577A3] font-semibold">High Priority</p>
                <h2 className="text-3xl font-bold mt-2 text-[#2E1C4D]">{highPriorityComplaints}</h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <span className="inline-flex items-center text-[10px] font-bold text-[#8577A3] bg-white border border-[#8B5CF6]/20 px-3 py-1.5 rounded-xl shadow-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-[#8B5CF6] stroke-[2.5]" />
                {currentFormattedDate}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
            <div className="bg-white border border-[#8B5CF6]/15 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] hover:shadow-[0_4px_20px_-4px_rgba(139,92,246,0.25)] transition-shadow">
              <div className="p-3 bg-[#F3EEFF] text-[#8B5CF6] rounded-xl border border-[#EDE9FE]">
                <Building2 className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8577A3]">Total Divisions</p>
                <h3 className="text-xl font-extrabold text-[#2E1C4D] mt-0.5">{departments.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-[#8B5CF6]/15 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] hover:shadow-[0_4px_20px_-4px_rgba(139,92,246,0.25)] transition-shadow">
              <div className="p-3 bg-[#EDE9FE] text-[#7C3AED] rounded-xl border border-[#DDD6FE]">
                <Users className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8577A3]">Active Accounts</p>
                <h3 className="text-xl font-extrabold text-[#2E1C4D] mt-0.5">{users.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-[#8B5CF6]/15 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] hover:shadow-[0_4px_20px_-4px_rgba(139,92,246,0.25)] transition-shadow">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <CheckSquare className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8577A3]">Total Complaints</p>
                <h3 className="text-xl font-extrabold text-[#2E1C4D] mt-0.5">{totalComplaints}</h3>
                <div className="bg-white border border-[#8B5CF6]/15 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)]">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Check className="h-6 w-6 stroke-[1.5]" />
                  </div>

                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[#8577A3]">
                       Resolved Complaints
                     </p>

                     <h3 className="text-xl font-extrabold text-[#2E1C4D] mt-0.5">
                       {resolvedComplaints}
                     </h3>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#8B5CF6]/15 select-none">
            {['Departments', 'User Accounts', 'Complaints'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-[#8B5CF6] text-[#7C3AED] font-extrabold'
                    : 'border-transparent text-[#8577A3] hover:text-[#5B4A7A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Loading */}
          {loading ? (
            <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl p-12">
              <Loading message="Syncing with central system directory..." />
            </div>
          ) : error ? (
            <Error message={error} onRetry={fetchAdminData} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Tables & registries */}
              <div className="lg:col-span-2 space-y-6 animate-fade-in">
                {activeTab === 'Departments' ? (
                  <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#8B5CF6]/10">
                      <h3 className="text-xs font-extrabold text-[#8577A3] uppercase tracking-wider">Department Directory</h3>
                      <span className="text-[10px] bg-[#F3EEFF] border border-[#EDE9FE] px-2.5 py-0.5 rounded-full text-[#7C3AED] font-bold">{departments.length} division{departments.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="divide-y divide-[#8B5CF6]/10">
                      {departments.map((dept) => (
                        <div key={dept.id} className="py-3.5 flex items-center justify-between hover:bg-[#FAF8FF] rounded-xl px-2 -mx-2 transition-colors">
                          <div className="flex items-start space-x-3.5">
                            <div className="p-2.5 bg-[#F3EEFF] text-[#8B5CF6] rounded-xl border border-[#EDE9FE] flex-shrink-0">
                              <Building2 className="h-5 w-5 stroke-[1.5]" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-[#2E1C4D]">{dept.name}</h4>
                              <p className="text-[10px] text-[#8577A3] font-semibold mt-1">Lead Officer: {dept.head}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F3EEFF] px-2.5 py-1 rounded-md border border-[#EDE9FE]">
                              {dept.count || 0} active files
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTab === 'User Accounts' ? (
                  <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#8B5CF6]/10">
                      <h3 className="text-xs font-extrabold text-[#8577A3] uppercase tracking-wider">User Registry</h3>
                      <span className="text-[10px] bg-[#F3EEFF] border border-[#EDE9FE] px-2.5 py-0.5 rounded-full text-[#7C3AED] font-bold">{users.length} member{users.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="divide-y divide-[#8B5CF6]/10">
                      {users.map((item) => (
                        <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAF8FF] rounded-xl px-2 -mx-2 transition-colors">
                          <div className="flex items-center space-x-3.5">
                            <div className="h-9 w-9 rounded-lg bg-[#F3EEFF] border border-[#EDE9FE] text-[#7C3AED] font-extrabold text-xs flex items-center justify-center uppercase">
                              {item.username.substring(0, 1)}
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-[#2E1C4D]">{item.username}</h4>
                              <p className="text-[10px] text-[#8577A3] font-semibold mt-0.5">{item.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-end sm:self-auto">
                            <span className="text-[9px] font-bold text-[#8577A3] uppercase tracking-wider">Authorization Role</span>
                            <select
                              value={item.role}
                              onChange={(e) => handleRoleChange(item.id, e.target.value)}
                              className="bg-[#FAF8FF] border border-[#8B5CF6]/20 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2E1C4D] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] cursor-pointer outline-none"
                            >
                              <option value="Citizen">Citizen</option>
                              <option value="Officer">Officer</option>
                              <option value="Senior Officer">Senior Officer</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#8B5CF6]/10">
                      <h3 className="text-xs font-extrabold text-[#8577A3] uppercase tracking-wider">
                        Complaint Registry
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="border border-[#8B5CF6]/20 rounded-lg px-3 py-2 text-sm bg-white text-[#2E1C4D] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]"
                        >
                          <option value="All">All Departments</option>
                          <option value="Electricity Department">Electricity Department</option>
                          <option value="Road department">Road department</option>
                          <option value="Transport Department">Transport Department</option>
                          <option value="Waste Management Department">Waste Management Department</option>
                          <option value="Water Department">Water Department</option>
                        </select>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="border border-[#8B5CF6]/20 rounded-lg px-3 py-2 text-sm ml-3 bg-white text-[#2E1C4D] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Reported">Reported</option>
                          <option value="Verified">Verified</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>

                        <select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="border border-[#8B5CF6]/20 rounded-lg px-3 py-2 text-sm ml-3 bg-white text-[#2E1C4D] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]"
                        >
                          <option value="All">All Priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <span className="text-[10px] bg-[#F3EEFF] border border-[#EDE9FE] px-2.5 py-0.5 rounded-full text-[#7C3AED] font-bold">
                        {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="divide-y divide-[#8B5CF6]/10">
                      {filteredComplaints.map((c) => (
                        <div
                          key={c.id}
                          className="py-3 flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-[#2E1C4D]">
                              {c.title}
                            </h4>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#8577A3]">
                                {c.department}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.status === "Resolved"
                                    ? "bg-green-100 text-green-700"
                                    : c.status === "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : c.status === "Assigned"
                                    ? "bg-purple-100 text-purple-700"
                                    : c.status === "Verified"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <p className="text-xs font-bold text-[#2E1C4D]">
                              #{c.id}
                            </p>

                            <span
                              className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${
                                c.priority === "High"
                                  ? "bg-red-100 text-red-700"
                                  : c.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {c.priority}
                            </span>

                            <button
                              onClick={() => navigate(`/complaints/${c.id}`)}
                              className="block w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Actions side panel */}
              <div className="space-y-6 animate-fade-in">
                {activeTab === 'Departments' ? (
                  <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] p-5 space-y-4">
                    <div className="flex items-center space-x-2 text-[#7C3AED]">
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                      <h4 className="font-extrabold text-[#2E1C4D] text-xs uppercase tracking-wider">Add New Department</h4>
                    </div>
                    <p className="text-[11px] text-[#8577A3] font-semibold leading-normal">
                      Establish a new municipal administrative division.
                    </p>

                    <form onSubmit={handleCreateDept} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#8577A3] uppercase mb-1.5">Division Name</label>
                        <input
                          type="text"
                          required
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="e.g. Public Parks & Forestry"
                          className="premium-input"
                        />
                      </div>

                      {/* Head */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#8577A3] uppercase mb-1.5">Division Head Officer</label>
                        <input
                          type="text"
                          required
                          value={newDeptHead}
                          onChange={(e) => setNewDeptHead(e.target.value)}
                          placeholder="e.g. Director Sarah Jenkins"
                          className="premium-input"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingDept}
                        className="w-full flex justify-center items-center py-2 px-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow active:scale-95 transition-all outline-none"
                      >
                        Create Department
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white border border-[#8B5CF6]/15 rounded-2xl shadow-[0_2px_14px_-4px_rgba(139,92,246,0.15)] p-5 space-y-4 select-none">
                    <div className="flex items-center space-x-2 text-rose-500">
                      <ShieldAlert className="h-5 w-5 stroke-[2]" />
                      <h4 className="font-extrabold text-[#2E1C4D] text-xs uppercase tracking-wider">Security Profile Guidelines</h4>
                    </div>
                    <p className="text-[11px] text-[#8577A3] font-medium leading-normal">
                      Upgrading profiles gives users broad administrative accesses over the smart city pipeline.
                    </p>
                    <div className="space-y-2 text-[10px] font-bold text-[#5B4A7A]">
                      <div className="flex items-center space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />
                        <span>Officers manage specific department logs</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />
                        <span>Seniors audit escalations & delay queues</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />
                        <span>Admins configure departments & memberships</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
