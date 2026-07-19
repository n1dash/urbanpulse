import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/api';
import { MapPin, Upload, FileImage, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import Map from '../components/Map';

export const RaiseComplaint = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Roads & Traffic');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(12.9716); // Default centers
  const [lng, setLng] = useState(77.5946);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default coordinate centers for municipal zones
  const WARD_CENTERS = {
    'Roads & Traffic': [12.9716, 77.5946],
    'Water & Sewage': [12.9105, 77.6450],
    'Electricity & Lighting': [12.9250, 77.5897],
    'Waste Management': [12.9784, 77.6408],
    'Transport & Transit': [12.9562, 77.7020]
  };

  const departments = ['Roads & Traffic', 'Water & Sewage', 'Electricity & Lighting', 'Waste Management', 'Transport & Transit'];

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setDepartment(dept);
    // Auto-center map on mock zone centroid
    if (WARD_CENTERS[dept]) {
      setLat(WARD_CENTERS[dept][0]);
      setLng(WARD_CENTERS[dept][1]);
    }
  };

  const handleMapSelect = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(`Geocoded Coordinates: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
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
    if (!title || !description || !address || !lat || !lng) {
      setError('Please fill in all required fields and pick a map location');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('department', department);
      formData.append('address', address);
      formData.append('lat', lat.toString());
      formData.append('lng', lng.toString());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await complaintService.createComplaint(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      
      {/* Left Pane: Submission Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">File Civic Incident</h1>
            <p className="text-xs text-slate-500 font-medium">Please provide accurate description and photos. Select location using the map on the right.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complaint Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Open manhole on main road, Broken street lamp"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the issue (how long it has been present, size of impact, etc.)"
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                required
              />
            </div>

            {/* Department selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Category</label>
              <select
                value={department}
                onChange={handleDepartmentChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Landmark / Street Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Next to HDFC ATM, 5th Cross Corner"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                  required
                />
              </div>
            </div>

            {/* Lat / Lng (readonly but updated by map) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latitude (Map Pinned)</label>
                <input
                  type="number"
                  value={lat.toFixed(5)}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Longitude (Map Pinned)</label>
                <input
                  type="number"
                  value={lng.toFixed(5)}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 font-mono"
                />
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Incident Photo</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold cursor-pointer text-slate-600 transition shadow-sm">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imageFile && (
                  <span className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                    <FileImage className="w-4 h-4 text-brand-500 shrink-0" />
                    {imageFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative w-28 h-28 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 bg-slate-800/80 hover:bg-slate-900 text-white rounded-full p-1 text-[8px] leading-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Right Pane: Map Picker */}
      <div className="w-full lg:w-1/2 h-80 lg:h-full relative">
        <div className="absolute top-4 left-4 z-[400] bg-white border border-slate-100 p-3 rounded-xl shadow-md text-xs font-semibold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>Click anywhere on the map to pin incident location</span>
        </div>
        <Map
          mode="select"
          center={[lat, lng]}
          zoom={13}
          selectedLocation={{ lat, lng }}
          onLocationSelect={handleMapSelect}
        />
      </div>

    </div>
  );
};
export default RaiseComplaint;
