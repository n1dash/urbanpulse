import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject token from localStorage into requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('urbanpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INITIAL MOCK DATA (stored in localStorage if API fails or is not running)
const DEFAULT_COMPLAINTS = [
  {
    id: 'UP-1001',
    title: 'Severe Pothole on Main Street',
    description: 'A large pothole has formed near the metro station entrance. It is causing severe traffic congestion and poses a safety hazard for two-wheelers.',
    department: 'Roads & Traffic',
    location: {
      address: 'Main Street Metro Gate 2, Central City',
      lat: 12.9716,
      lng: 77.5946
    },
    status: 'In Progress', // Created, Verified, Assigned, In Progress, Resolved
    priorityScore: 85,
    upvotes: 42,
    upvotedBy: ['citizen1@urbanpulse.gov'],
    citizen: { name: 'Rahul Sharma', email: 'rahul@gmail.com' },
    officer: { name: 'Officer Rajesh Kumar', email: 'rajesh.roads@urbanpulse.gov' },
    image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800',
    evidenceImage: null,
    evidenceNotes: '',
    history: [
      { status: 'Created', timestamp: '2026-07-14T09:00:00Z', notes: 'Complaint registered by citizen.' },
      { status: 'Verified', timestamp: '2026-07-14T14:30:00Z', notes: 'Verified by field inspector. Severity marked high.' },
      { status: 'Assigned', timestamp: '2026-07-15T10:00:00Z', notes: 'Assigned to Roads & Traffic Department.' },
      { status: 'In Progress', timestamp: '2026-07-15T11:30:00Z', notes: 'Work crew dispatched to fill pothole.' }
    ],
    createdAt: '2026-07-14T09:00:00Z'
  },
  {
    id: 'UP-1002',
    title: 'Water Pipeline Leakage',
    description: 'Main potable water supply pipe has burst, causing flooding on the sidewalk and wasting thousands of liters of clean water.',
    department: 'Water & Sewage',
    location: {
      address: '4th Avenue, Sector 5, HSR Layout',
      lat: 12.9105,
      lng: 77.6450
    },
    status: 'Assigned',
    priorityScore: 70,
    upvotes: 18,
    upvotedBy: [],
    citizen: { name: 'Ananya Rao', email: 'ananya@gmail.com' },
    officer: { name: 'Officer Meera Sen', email: 'meera.water@urbanpulse.gov' },
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    evidenceImage: null,
    evidenceNotes: '',
    history: [
      { status: 'Created', timestamp: '2026-07-15T07:15:00Z', notes: 'Complaint registered.' },
      { status: 'Verified', timestamp: '2026-07-15T11:00:00Z', notes: 'Verified. Moderate leakage reported.' },
      { status: 'Assigned', timestamp: '2026-07-15T12:00:00Z', notes: 'Assigned to Ward 5 Water Division.' }
    ],
    createdAt: '2026-07-15T07:15:00Z'
  },
  {
    id: 'UP-1003',
    title: 'Streetlight Inoperative',
    description: 'Entire block is in complete darkness at night due to three non-functional streetlights, making it unsafe for walkers.',
    department: 'Electricity & Lighting',
    location: {
      address: '32nd Cross, Jayanagar 4th Block',
      lat: 12.9250,
      lng: 77.5897
    },
    status: 'Resolved',
    priorityScore: 45,
    upvotes: 9,
    upvotedBy: [],
    citizen: { name: 'Vikram Singh', email: 'vikram@gmail.com' },
    officer: { name: 'Officer Amit Patel', email: 'amit.power@urbanpulse.gov' },
    image: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=800',
    evidenceImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800',
    evidenceNotes: 'Replaced LED bulbs on post #14, #15, and #16. Verified functioning.',
    history: [
      { status: 'Created', timestamp: '2026-07-12T20:30:00Z', notes: 'Complaint registered.' },
      { status: 'Verified', timestamp: '2026-07-13T09:00:00Z', notes: 'Streetlights verified inoperative.' },
      { status: 'Assigned', timestamp: '2026-07-13T10:00:00Z', notes: 'Assigned to BESCOM Ward 4.' },
      { status: 'In Progress', timestamp: '2026-07-13T14:00:00Z', notes: 'Maintenance truck dispatched.' },
      { status: 'Resolved', timestamp: '2026-07-13T16:45:00Z', notes: 'Bulbs replaced. Streetlights are fully operational now.' }
    ],
    createdAt: '2026-07-12T20:30:00Z'
  },
  {
    id: 'UP-1004',
    title: 'Garbage Dump Overflow',
    description: 'Public dustbin is overflowing. Stray dogs and cows are scattering waste across the road, creating an unhygienic environment.',
    department: 'Waste Management',
    location: {
      address: 'Opposite Corner House Ice Cream, Indiranagar',
      lat: 12.9784,
      lng: 77.6408
    },
    status: 'Created',
    priorityScore: 55,
    upvotes: 31,
    upvotedBy: [],
    citizen: { name: 'Karan Mehta', email: 'karan@gmail.com' },
    officer: null,
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
    evidenceImage: null,
    evidenceNotes: '',
    history: [
      { status: 'Created', timestamp: '2026-07-16T08:00:00Z', notes: 'Complaint registered by citizen.' }
    ],
    createdAt: '2026-07-16T08:00:00Z'
  }
];

// Initialize mock DB in localStorage if not already present
const initMockDB = () => {
  if (!localStorage.getItem('urbanpulse_complaints')) {
    localStorage.setItem('urbanpulse_complaints', JSON.stringify(DEFAULT_COMPLAINTS));
  }
  if (!localStorage.getItem('urbanpulse_users')) {
    const defaultUsers = [
      { email: 'citizen@urbanpulse.gov', name: 'John Doe', role: 'Citizen', password: 'password123' },
      { email: 'officer@urbanpulse.gov', name: 'Rajesh Kumar', role: 'Officer', department: 'Roads & Traffic', password: 'password123' },
      { email: 'senior@urbanpulse.gov', name: 'Dr. Sunita Sharma', role: 'Senior Officer', department: 'Roads & Traffic', password: 'password123' },
      { email: 'admin@urbanpulse.gov', name: 'Super Admin', role: 'Admin', password: 'password123' }
    ];
    localStorage.setItem('urbanpulse_users', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('urbanpulse_departments')) {
    const departments = ['Roads & Traffic', 'Water & Sewage', 'Electricity & Lighting', 'Waste Management', 'Transport & Transit'];
    localStorage.setItem('urbanpulse_departments', JSON.stringify(departments));
  }
};

initMockDB();

// Mock database helper functions
const getMockComplaints = () => JSON.parse(localStorage.getItem('urbanpulse_complaints'));
const saveMockComplaints = (data) => localStorage.setItem('urbanpulse_complaints', JSON.stringify(data));
const getMockUsers = () => JSON.parse(localStorage.getItem('urbanpulse_users'));
const saveMockUsers = (data) => localStorage.setItem('urbanpulse_users', JSON.stringify(data));
const getMockDepartments = () => JSON.parse(localStorage.getItem('urbanpulse_departments'));
const saveMockDepartments = (data) => localStorage.setItem('urbanpulse_departments', JSON.stringify(data));

// Standard APIs with failover to Mock DB
export const authService = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post('auth/login/', credentials);
      return response.data;
    } catch (error) {
      console.warn('API error, falling back to mock login:', error.message);
      // Mock Fallback logic
      const users = getMockUsers();
      const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
      if (user) {
        const token = `mock-jwt-token-for-${user.role.toLowerCase()}-${Date.now()}`;
        localStorage.setItem('urbanpulse_token', token);
        return {
          token,
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department || null
          }
        };
      }
      throw new Error('Invalid email or password');
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post('auth/register/', userData);
      return response.data;
    } catch (error) {
      console.warn('API error, falling back to mock register:', error.message);
      const users = getMockUsers();
      if (users.find(u => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      const newUser = {
        email: userData.email,
        name: userData.name,
        role: 'Citizen',
        password: userData.password
      };
      users.push(newUser);
      saveMockUsers(users);
      return { success: true, message: 'Citizen registered successfully' };
    }
  }
};

export const complaintService = {
  getComplaints: async (filters = {}) => {
    try {
      const response = await apiClient.get('complaints/', { params: filters });
      return response.data;
    } catch (error) {
      console.warn('API error, falling back to mock complaints list:', error.message);
      let complaints = getMockComplaints();
      
      // Apply filters
      if (filters.status) {
        complaints = complaints.filter(c => c.status === filters.status);
      }
      if (filters.department) {
        complaints = complaints.filter(c => c.department === filters.department);
      }
      if (filters.citizenEmail) {
        complaints = complaints.filter(c => c.citizen?.email === filters.citizenEmail);
      }
      if (filters.officerEmail) {
        complaints = complaints.filter(c => c.officer?.email === filters.officerEmail);
      }
      
      return complaints;
    }
  },

  getComplaintDetails: async (id) => {
    try {
      const response = await apiClient.get(`complaints/${id}/`);
      return response.data;
    } catch (error) {
      console.warn(`API error, falling back to mock complaint details for ${id}:`, error.message);
      const complaints = getMockComplaints();
      const complaint = complaints.find(c => c.id === id);
      if (!complaint) throw new Error('Complaint not found');
      return complaint;
    }
  },

  createComplaint: async (formData) => {
    try {
      const response = await apiClient.post('complaints/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.warn('API error, falling back to mock complaint creation:', error.message);
      const complaints = getMockComplaints();
      
      // Since it's a FormData object in the real API, extract fields locally
      let title = '', description = '', department = '', lat = 12.9716, lng = 77.5946, address = 'Selected Location';
      let imageUrl = 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=800'; // Default placeholder image
      
      if (formData instanceof FormData) {
        title = formData.get('title');
        description = formData.get('description');
        department = formData.get('department');
        address = formData.get('address') || 'Selected Location';
        lat = parseFloat(formData.get('lat') || '12.9716');
        lng = parseFloat(formData.get('lng') || '77.5946');
        const imgFile = formData.get('image');
        if (imgFile && imgFile instanceof File) {
          imageUrl = URL.createObjectURL(imgFile);
        }
      } else {
        // Fallback if plain object is passed
        title = formData.title;
        description = formData.description;
        department = formData.department;
        address = formData.address || 'Selected Location';
        lat = formData.lat || 12.9716;
        lng = formData.lng || 77.5946;
        imageUrl = formData.imageUrl || imageUrl;
      }

      // Calculate a mock AI priority score based on title/description length & key terms
      let priorityScore = 30;
      const keywords = { pothole: 15, flood: 25, sewage: 20, accident: 30, darkness: 10, leak: 15, garbage: 10 };
      const fullText = (title + ' ' + description).toLowerCase();
      Object.keys(keywords).forEach(kw => {
        if (fullText.includes(kw)) priorityScore += keywords[kw];
      });
      priorityScore = Math.min(100, priorityScore);

      const newId = `UP-${1000 + complaints.length + 1}`;
      const newComplaint = {
        id: newId,
        title,
        description,
        department,
        location: { address, lat, lng },
        status: 'Created',
        priorityScore,
        upvotes: 0,
        upvotedBy: [],
        citizen: { name: 'Current Citizen', email: 'citizen@urbanpulse.gov' },
        officer: null,
        image: imageUrl,
        evidenceImage: null,
        evidenceNotes: '',
        history: [
          { status: 'Created', timestamp: new Date().toISOString(), notes: 'Complaint registered by citizen.' }
        ],
        createdAt: new Date().toISOString()
      };

      complaints.unshift(newComplaint); // Add to the top
      saveMockComplaints(complaints);
      return newComplaint;
    }
  },

  updateComplaintStatus: async (id, updateData) => {
    try {
      const response = await apiClient.patch(`complaints/${id}/`, updateData);
      return response.data;
    } catch (error) {
      console.warn(`API error, falling back to mock status update for ${id}:`, error.message);
      const complaints = getMockComplaints();
      const index = complaints.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Complaint not found');

      const complaint = complaints[index];
      
      // Update status, history, priority, etc.
      if (updateData.status && updateData.status !== complaint.status) {
        complaint.status = updateData.status;
        complaint.history.push({
          status: updateData.status,
          timestamp: new Date().toISOString(),
          notes: updateData.notes || `Complaint status updated to ${updateData.status}.`
        });
      }
      
      if (updateData.priorityScore !== undefined) {
        complaint.priorityScore = parseInt(updateData.priorityScore);
      }
      
      if (updateData.officerEmail) {
        const users = getMockUsers();
        const officerObj = users.find(u => u.email === updateData.officerEmail);
        complaint.officer = officerObj ? { name: officerObj.name, email: officerObj.email } : null;
      }
      
      if (updateData.evidenceNotes) {
        complaint.evidenceNotes = updateData.evidenceNotes;
      }

      if (updateData.evidenceImage) {
        if (updateData.evidenceImage instanceof File) {
          complaint.evidenceImage = URL.createObjectURL(updateData.evidenceImage);
        } else {
          complaint.evidenceImage = updateData.evidenceImage;
        }
      }

      complaints[index] = complaint;
      saveMockComplaints(complaints);
      return complaint;
    }
  },

  upvoteComplaint: async (id, citizenEmail) => {
    try {
      const response = await apiClient.post(`complaints/${id}/upvote/`);
      return response.data;
    } catch (error) {
      console.warn(`API error, falling back to mock upvote for ${id}:`, error.message);
      const complaints = getMockComplaints();
      const index = complaints.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Complaint not found');

      const complaint = complaints[index];
      const email = citizenEmail || 'citizen@urbanpulse.gov';
      
      if (complaint.upvotedBy.includes(email)) {
        // Remove upvote
        complaint.upvotedBy = complaint.upvotedBy.filter(e => e !== email);
        complaint.upvotes = Math.max(0, complaint.upvotes - 1);
      } else {
        // Add upvote
        complaint.upvotedBy.push(email);
        complaint.upvotes += 1;
      }

      complaints[index] = complaint;
      saveMockComplaints(complaints);
      return { upvotes: complaint.upvotes, upvotedBy: complaint.upvotedBy };
    }
  }
};

// Admin Services
export const adminService = {
  getDepartments: async () => {
    try {
      const response = await apiClient.get('admin/departments/');
      return response.data;
    } catch (error) {
      return getMockDepartments();
    }
  },

  addDepartment: async (name) => {
    try {
      const response = await apiClient.post('admin/departments/', { name });
      return response.data;
    } catch (error) {
      const depts = getMockDepartments();
      if (depts.includes(name)) throw new Error('Department already exists');
      depts.push(name);
      saveMockDepartments(depts);
      return depts;
    }
  },

  getOfficers: async () => {
    try {
      const response = await apiClient.get('admin/officers/');
      return response.data;
    } catch (error) {
      const users = getMockUsers();
      return users.filter(u => u.role === 'Officer' || u.role === 'Senior Officer');
    }
  },

  addOfficer: async (officerData) => {
    try {
      const response = await apiClient.post('admin/officers/', officerData);
      return response.data;
    } catch (error) {
      const users = getMockUsers();
      if (users.find(u => u.email === officerData.email)) throw new Error('User already exists');
      const newOfficer = {
        email: officerData.email,
        name: officerData.name,
        role: officerData.role || 'Officer',
        department: officerData.department,
        password: 'password123'
      };
      users.push(newOfficer);
      saveMockUsers(users);
      return newOfficer;
    }
  },

  getUsers: async () => {
    try {
      const response = await apiClient.get('admin/users/');
      return response.data;
    } catch (error) {
      return getMockUsers();
    }
  }
};
