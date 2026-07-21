# UrbanPulse - Frontend Action Portal

UrbanPulse is a modern, responsive urban issue reporting and tracking web application built for citizen engagement and municipal administration.

This project represents the complete **Frontend application**, designed to communicate with REST APIs.

---

## 🚀 Tech Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **API Client**: Axios
- **Maps**: Leaflet & React-Leaflet (utilizing OpenStreetMap)
- **Icons**: Lucide React

---

## 📁 Project Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/       # Static assets
│   ├── components/   # Reusable UI components (Map, StatusBadge, Timeline, etc.)
│   ├── context/      # Context providers (AuthContext for role-based access)
│   ├── pages/        # Dashboard & Form pages
│   ├── routes/       # Route guards (ProtectedRoute, GuestRoute)
│   ├── services/     # Axios client configuration & API service endpoints
│   ├── utils/        # Utility helpers
│   ├── App.jsx       # Root router & context wrapper
│   └── main.jsx      # Vite React entrypoint
├── index.html        # HTML shell including Inter Font and Leaflet CSS CDNs
├── tailwind.config.js# Custom color palettes ( slate & teal high-trust GovTech layout)
├── postcss.config.js # CSS parsing configuration
├── package.json      # NPM dependencies
└── README.md         # Running & installation details
```

---

## 🛠️ Installation & Setup

1. **Verify Prerequisites**:
   Ensure you have [Node.js](https://nodejs.org/) (v16+ recommended) and `npm` installed.

2. **Install Dependencies**:
   Open a terminal in the `frontend/` directory and run:
   ```bash
   npm install
   ```

3. **Configure Environment / Backend API URL**:
   The default backend target is configured at:
   `http://localhost:8000/api/` (inside [api.js](file:///src/services/api.js)). If your backend runs on a different URL, update `API_BASE_URL` in `src/services/api.js`.

4. **Run Development Server**:
   Start the local development server:
   ```bash
   npm run dev
   ```
   The app will run locally on `http://localhost:5173`.

---

## 🌟 Interactive Features (Stand-alone Demo Mode)
To ensure the frontend is **immediately reviewable and testable** without requiring a live backend database, the pages automatically switch to an **interactive Local Storage DB fallback** if the backend API returns errors or connection issues.

This allows you to:
- Select a role from the **Quick-Fill login credentials** panel.
- Submit new complaints (pinning locations on the live map and uploading files).
- View, search, and filter complaints in real time.
- Simulate status updates as a Department Officer.
- Monitor Escalations and delays as a Senior Officer.
- Alter user roles and add departments as an Admin.
- Upvote issues, which updates and persists local states.

All mock actions write back to `localStorage` immediately, creating a complete end-to-end sandbox simulator.
