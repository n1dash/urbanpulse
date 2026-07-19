import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { 
  Building2, Users, UserSquare2, Plus, 
  Settings, FolderKanban, ShieldCheck, Mail, Check, AlertCircle 
} from 'lucide-react';
import { Loading } from '../components/Loading';

export const AdminDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('depts'); // depts, officers, users
  
  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerEmail, setNewOfficerEmail] = useState('');
  const [newOfficerDept, setNewOfficerDept] = useState('');
  const [newOfficerRole, setNewOfficerRole] = useState('Officer'); // Officer, Senior Officer
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const depts = await adminService.getDepartments();
      const offs = await adminService.getOfficers();
      const usrs = await adminService.getUsers();
      
      setDepartments(depts);
      setOfficers(offs);
      setUsers(usrs);
      if (depts.length > 0 && !newOfficerDept) {
        setNewOfficerDept(depts[0]);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const updatedDepts = await adminService.addDepartment(newDeptName.trim());
      setDepartments(updatedDepts);
      setNewDeptName('');
      setFormSuccess('Department added successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to add department');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    if (!newOfficerName || !newOfficerEmail || !newOfficerDept) {
      setFormError('Please fill in all fields');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const newOff = await adminService.addOfficer({
        name: newOfficerName,
        email: newOfficerEmail,
        department: newOfficerDept,
        role: newOfficerRole
      });
      setOfficers([...officers, newOff]);
      setUsers([...users, { ...newOff, password: 'password123' }]);
      setNewOfficerName('');
      setNewOfficerEmail('');
      setFormSuccess('Officer registered successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to add officer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const tabs = [
    { id: 'depts', label: 'Manage Departments', icon: Building2 },
    { id: 'officers', label: 'Department Officers', icon: UserSquare2 },
    { id: 'users', label: 'User Directory', icon: Users }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Administration</h1>
        <p className="text-xs text-slate-500 font-medium">Manage departmental structures, assign field officers, and audit system users.</p>
      </div>

      {/* Tabs Selectors */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFormError('');
                setFormSuccess('');
              }}
              className={`flex items-center gap-2 py-3 px-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-brand-500 text-brand-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Alert Banner */}
      {(formSuccess || formError) && (
        <div className={`p-4 rounded-2xl flex items-start space-x-2 text-xs font-semibold max-w-xl ${
          formSuccess ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-rose-50 border border-rose-100 text-rose-800'
        }`}>
          {formSuccess ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{formSuccess || formError}</span>
        </div>
      )}

      {loading ? (
        <Loading text="Loading administrative catalog..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/MAIN PANE: Table Lists (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* TAB 1: DEPARTMENTS LIST */}
            {activeTab === 'depts' && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Departments</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{departments.length} Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {departments.map((dept, idx) => (
                    <div key={dept} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono font-semibold">#{(idx + 1).toString().padStart(2, '0')}</span>
                        <span className="font-bold text-slate-700">{dept}</span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 border rounded-md">Municipal Division</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: OFFICERS DIRECTORY */}
            {activeTab === 'officers' && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Officers</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{officers.length} Total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4 pl-6">Officer Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Department Division</th>
                        <th className="p-4 pr-6 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {officers.map((o) => (
                        <tr key={o.email} className="hover:bg-slate-50/30 transition">
                          <td className="p-4 pl-6 font-bold text-slate-700">{o.name}</td>
                          <td className="p-4 text-slate-500 font-medium">{o.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 border border-cyan-200 text-cyan-700 bg-cyan-50 rounded-md font-semibold">
                              {o.department}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <span className={`px-2 py-0.5 border rounded-full font-semibold ${
                              o.role === 'Senior Officer' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}>
                              {o.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: USER LIST */}
            {activeTab === 'users' && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Directory</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">{users.length} Total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4 pl-6">User Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4 pr-6 text-right">Security Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-50/30 transition">
                          <td className="p-4 pl-6 font-bold text-slate-700">{u.name}</td>
                          <td className="p-4 text-slate-500 font-medium">{u.email}</td>
                          <td className="p-4 pr-6 text-right">
                            <span className={`px-2 py-0.5 border rounded-full font-semibold ${
                              u.role === 'Admin' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                              u.role === 'Senior Officer' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                              u.role === 'Officer' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                              'text-teal-700 bg-teal-50 border-teal-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANE: Action Forms (1 Col) */}
          <div className="space-y-4">
            
            {/* FORM 1: ADD DEPARTMENT */}
            {activeTab === 'depts' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 shrink-0">
                  <FolderKanban className="w-4 h-4 text-brand-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Add New Department</h3>
                </div>
                <form onSubmit={handleAddDept} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Division Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Parks & Recreation"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Department</span>
                  </button>
                </form>
              </div>
            )}

            {/* FORM 2: ADD OFFICER */}
            {activeTab === 'officers' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Register Department Officer</h3>
                </div>
                <form onSubmit={handleAddOfficer} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Officer Name</label>
                    <input
                      type="text"
                      placeholder="Officer Meera Sen"
                      value={newOfficerName}
                      onChange={(e) => setNewOfficerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="meera.water@urbanpulse.gov"
                      value={newOfficerEmail}
                      onChange={(e) => setNewOfficerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Division</label>
                    <select
                      value={newOfficerDept}
                      onChange={(e) => setNewOfficerDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority Role</label>
                    <select
                      value={newOfficerRole}
                      onChange={(e) => setNewOfficerRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white text-slate-600 font-semibold"
                    >
                      <option value="Officer">Field Officer</option>
                      <option value="Senior Officer">Senior Oversight Officer</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Officer</span>
                  </button>
                </form>
              </div>
            )}

            {/* INFO PANEL: USER TAB INFO */}
            {activeTab === 'users' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 text-xs text-slate-500">
                <div className="font-extrabold text-slate-700 uppercase tracking-wider pb-2 border-b">Directory Audit Info</div>
                <p>Citizens sign up via the public portal registration form.</p>
                <p>Officers and Senior Officers can only be registered by an administrator.</p>
                <p className="font-medium text-brand-600">Default passwords for all newly created officer accounts is: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded font-bold">password123</span></p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
export default AdminDashboard;
