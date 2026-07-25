import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('urbanpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: try a silent token refresh once on 401 before giving up
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('urbanpulse_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('urbanpulse_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('urbanpulse_token');
          localStorage.removeItem('urbanpulse_refresh');
          localStorage.removeItem('urbanpulse_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Unwraps DRF's paginated {count, results} shape when present
const unwrap = (data) => (data && Array.isArray(data.results) ? data.results : data);

// Resolves a relative media path (e.g. '/media/x.jpg') into an absolute URL
const resolveMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
};

// Pulls a readable message out of a DRF error response
const extractErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return error.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors[0];
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  if (firstKey && typeof data[firstKey] === 'string') return data[firstKey];
  return fallback;
};

// Adapts a backend Complaint into the field names this frontend's
// components (ComplaintCard, ComplaintDetails, Timeline) were built against.
const adaptComplaint = (c) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  department: c.department_name,
  departmentId: c.department,
  location_name: c.address,
  lat: parseFloat(c.latitude),
  lng: parseFloat(c.longitude),
  status: c.status,
  priority_score: c.priority_score,
  upvotes: c.votes_count ?? 0,
  is_upvoted: !!c.has_voted,
  image: resolveMediaUrl(c.image),
  evidence_image: resolveMediaUrl(c.resolution_image),
  resolution_notes: c.resolution_notes,
  timeline: (c.timeline || []).map((t) => ({
    status: t.status,
    timestamp: t.timestamp,
    notes: t.description,
  })),
  assigned_officer: c.assigned_officer,
  assigned_officer_name: c.assigned_officer_name,
  created_at: c.created_at,
});

// AdminDashboard.jsx works with display labels ('Senior Officer'); the backend
// uses codes ('SENIOR_OFFICER'). Bridge the two here so neither side has to change.
const ROLE_LABEL_TO_CODE = {
  'Citizen': 'CITIZEN',
  'Officer': 'OFFICER',
  'Senior Officer': 'SENIOR_OFFICER',
  'Admin': 'ADMIN',
};
const ROLE_CODE_TO_LABEL = Object.fromEntries(
  Object.entries(ROLE_LABEL_TO_CODE).map(([label, code]) => [code, label])
);

// ---- Auth --------------------------------------------------------------

export const authService = {
  login: async ({ username, password }) => {
    // The UI's login field is labeled/wired as 'username', but the backend
    // authenticates by email (there's no separate username concept anywhere
    // in this app - registration only ever collects a name + email).
    try {
      const response = await api.post('/auth/login/', { email: username, password });
      const { access, refresh, user } = response.data;
      localStorage.setItem('urbanpulse_refresh', refresh);
      return { token: access, user };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Invalid email or password'));
    }
  },

  register: async ({ username, email, password }) => {
    // 'username' here is actually being used as the display name in this UI;
    // the backend wants 'name' and derives its own internal username.
    try {
      const response = await api.post('/auth/register/', { name: username, email, password });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Registration failed'));
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

// ---- Complaints ----------------------------------------------------------

export const complaintService = {
  getComplaints: async (params = {}) => {
    const response = await api.get('/v1/complaints/', { params });
    return unwrap(response.data).map(adaptComplaint);
  },

  createComplaint: async (complaintData) => {
    // Frontend builds FormData with 'lat'/'lng'/'location_name'; backend wants
    // 'latitude'/'longitude'/'address'.
    if (complaintData instanceof FormData) {
      const backendForm = new FormData();
      for (const [key, value] of complaintData.entries()) {
        if (key === 'lat') backendForm.append('latitude', value);
        else if (key === 'lng') backendForm.append('longitude', value);
        else if (key === 'location_name') backendForm.append('address', value);
        else backendForm.append(key, value);
      }
      try {
        const response = await api.post('/v1/complaints/', backendForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return adaptComplaint(response.data);
      } catch (error) {
        throw new Error(extractErrorMessage(error, 'Failed to submit complaint'));
      }
    }
    const response = await api.post('/v1/complaints/', complaintData);
    return adaptComplaint(response.data);
  },

  getComplaintDetails: async (id) => {
    const response = await api.get(`/v1/complaints/${id}/`);
    return adaptComplaint(response.data);
  },

  updateComplaintStatus: async (id, statusData) => {
    // The officer-only status transition (with optional evidence image) has its
    // own backend endpoint, distinct from a generic field edit.
    if (statusData instanceof FormData && statusData.get('status')) {
      const backendForm = new FormData();
      for (const [key, value] of statusData.entries()) {
        if (key === 'evidence_image') backendForm.append('resolution_image', value);
        else if (key === 'comments') backendForm.append('description', value);
        else backendForm.append(key, value);
      }
      const response = await api.put(`/v1/complaints/${id}/status/`, backendForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return adaptComplaint(response.data);
    }
    const response = await api.patch(`/v1/complaints/${id}/`, statusData);
    return adaptComplaint(response.data);
  },

  upvoteComplaint: async (id) => {
    const response = await api.post(`/v1/complaints/${id}/vote/`);
    return response.data;
  },

  assignComplaint: async (complaintId, officerId) => {
    const response = await api.post(
      `/v1/complaints/${complaintId}/assign/`,
      {
        officer_id: officerId,
      }
    );

    return adaptComplaint(response.data);
  },
};

export const officerService = {
  getOfficers: async () => {
    const response = await api.get("/v1/officers/");
    console.log("Officers API:", response.data);
    return unwrap(response.data);
  },
};

// ---- Admin ---------------------------------------------------------------

export const adminService = {
  getDepartments: async () => {
    const response = await api.get('/v1/departments/');
    return unwrap(response.data).map((d) => ({
      ...d,
      head: d.description?.startsWith('Head: ') ? d.description.replace('Head: ', '') : (d.description || 'Unassigned'),
    }));
  },

  createDepartment: async (deptData) => {
    // Backend Department has no 'head' field - fold it into description
    // instead of silently dropping it.
    const description = deptData.head ? `Head: ${deptData.head}` : (deptData.description || '');
    const response = await api.post('/v1/departments/', { name: deptData.name, description });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/auth/users/');
    return unwrap(response.data).map((u) => ({ ...u, role: ROLE_CODE_TO_LABEL[u.role] || u.role }));
  },

  updateUserRole: async (userId, data) => {
    // Promoting to OFFICER/SENIOR_OFFICER requires department+designation -
    // the backend needs a real Officer profile, not just a role label, or
    // officer-only permissions won't actually recognize the account.
    const payload = { ...data, role: ROLE_LABEL_TO_CODE[data.role] || data.role };
    const response = await api.put(`/auth/users/${userId}/role/`, payload);
    return { ...response.data, role: ROLE_CODE_TO_LABEL[response.data.role] || response.data.role };
  },

  getOfficers: async () => {
    const response = await api.get('/v1/officers/');
    return unwrap(response.data);
  },
};

// ---- Dashboard -------------------------------------------------------------

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};

export default api;
