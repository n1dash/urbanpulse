import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService, adminService } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import { Upload, Send, MapPin, AlertCircle, Loader2, Image } from 'lucide-react';

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]); // fetched from backend: [{id, name}, ...]

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '', // holds a department ID - the backend's Department is a real FK, not free text
    location_name: '',
    lat: 18.449299,
    lng: 73.825601,
  });

  useEffect(() => {
    adminService.getDepartments()
      .then((depts) => {
        setDepartments(depts);
        if (depts.length > 0) {
          setFormData((prev) => ({ ...prev, department: String(depts[0].id) }));
        }
      })
      .catch(() => setError('Could not load departments from the server. Please refresh and try again.'));
  }, []);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationSelect = ({ lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location_name) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('department', formData.department);
    data.append('location_name', formData.location_name);
    data.append('lat', formData.lat);
    data.append('lng', formData.lng);

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      await complaintService.createComplaint(data);
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit your complaint. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onCloseSideBar={() => setSidebarOpen(false)} />

      <main className="flex-1 md:pl-64 pt-16 min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report Civic Issue</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Provide specific details, tag the municipal department, pin the location on the map, and submit evidence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 text-xs font-semibold text-rose-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0 stroke-[2.5]" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Side */}
              <div className="md:col-span-2 space-y-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                    Complaint Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Severe drainage overflow near community library entrance"
                    className="premium-input"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Please explain the details of the problem, when it was noticed, and how it is affecting locals..."
                    className="premium-input resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Target Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="block w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 focus:bg-white transition-all font-semibold outline-none cursor-pointer"
                    >
                      {departments.length === 0 && <option value="">Loading departments...</option>}
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Landmark */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                      Area Landmark / Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location_name"
                      required
                      value={formData.location_name}
                      onChange={handleChange}
                      placeholder="e.g. Community library West Lane gate"
                      className="premium-input"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                    Evidence Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5.5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl hover:border-accent-500 transition-colors bg-slate-50/50 cursor-pointer">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-slate-400 stroke-[1.5] mb-2" />
                      <div className="flex text-xs text-slate-500 font-bold select-none justify-center">
                        <label className="relative cursor-pointer bg-transparent text-accent-600 hover:text-accent-700 focus-within:outline-none">
                          <span>Upload photo evidence</span>
                          <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Meta Info */}
              <div className="space-y-6">
                {/* Location Picker */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-accent-500 stroke-[2.5]" />
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Pinpoint Coordinates</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                    Click anywhere on the map to place a precise location pin.
                  </p>

                  <Map
                    selectable={true}
                    selectedLocation={{ lat: formData.lat, lng: formData.lng }}
                    onLocationSelect={handleLocationSelect}
                    height="240px"
                  />

                  {/* Lat Lng display */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 select-none">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide">Latitude</p>
                      <p className="mt-0.5 font-sans">{formData.lat}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide">Longitude</p>
                      <p className="mt-0.5 font-sans">{formData.lng}</p>
                    </div>
                  </div>
                </div>

                {/* Upload Image Preview */}
                {imagePreview && (
                  <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm text-center animate-fade-in select-none">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Evidence Preview</p>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end space-x-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => navigate('/citizen/dashboard')}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2.5 bg-accent-600 hover:bg-accent-700 disabled:bg-accent-500/50 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-600/10 active:scale-95 transition-all outline-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Filing report...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 stroke-[2.5]" />
                    File Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RaiseComplaint;
