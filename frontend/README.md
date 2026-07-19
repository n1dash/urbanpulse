# UrbanPulse - Modern Civic Incident Tracking Portal

UrbanPulse is a premium, responsive citizen-engagement web application that connects citizens with municipal departments to report, track, and resolve civic complaints.

## 🛠️ Technology Stack

- **Framework**: React + Vite (JavaScript)
- **Styling**: Tailwind CSS & Lucide Icons
- **Interactive Maps**: Leaflet & OpenStreetMap (dynamic markers)
- **State Management**: React Context API
- **Charts**: Recharts Analytics
- **API Client**: Axios

---

## 📂 Project Structure

```text
frontend/
├── public/                # Static assets (Favicons, assets)
├── src/
│   ├── assets/            # Graphics and default placeholders
│   ├── components/        # Reusable global UI elements
│   │   ├── Navbar.jsx     # Header navigation with profile & notifications
│   │   ├── Sidebar.jsx    # Collapsible sidebar with role-aware layouts
│   │   ├── Map.jsx        # Leaflet + OpenStreetMap engine wrapper
│   │   ├── Timeline.jsx   # Lifecycle status tracker (Created -> Resolved)
│   │   ├── ComplaintCard.jsx # Grid view list card with upvote toggler
│   │   ├── StatusBadge.jsx # Colorized pill badge reflecting issue state
│   │   ├── StatCard.jsx   # Premium analytics metric displayer
│   │   ├── Loading.jsx    # Animated spinners and page-skeletons
│   │   └── Error.jsx      # Fallback error feedback card
│   ├── context/
│   │   └── AuthContext.jsx # Global session, login, and registration controller
│   ├── pages/             # Layout pages
│   │   ├── Login.jsx      # Universal sign-in page with quick-fill testing
│   │   ├── Register.jsx   # Citizen sign-up
│   │   ├── PublicComplaints.jsx # Live city map feed (accessible to all)
│   │   ├── CitizenDashboard.jsx # Dashboard for citizens
│   │   ├── RaiseComplaint.jsx   # Form with map location pinning
│   │   ├── ComplaintDetails.jsx # Detailed incident review with admin tools
│   │   ├── OfficerDashboard.jsx # caseload panel for Field Officers
│   │   ├── SeniorOfficerDashboard.jsx # Oversight analytics panel
│   │   └── AdminDashboard.jsx   # Departments, officers, & users auditing
│   ├── routes/
│   │   └── index.jsx      # Secure routing controls & redirection mappings
│   ├── services/
│   │   └── api.js         # Axios HTTP Client with transparent localStorage fallback
│   ├── utils/
│   │   └── helpers.js     # Date-time & style formatting tools
│   ├── App.jsx            # Core layout controller
│   ├── main.jsx           # Mounting React DOM
│   └── index.css          # Tailwind, Scrollbars, and Leaflet overrides
├── tailwind.config.js     # Tailwind design tokens (brand-teal & slate)
├── postcss.config.js      # CSS post-processors
├── vite.config.js          # Vite config
└── package.json           # Node modules manifests
```

---

## 🔑 Tester Accounts (Pre-filled on Login Page)

The application includes a built-in pre-fill developer card on the `/login` screen to swap between roles:

| Role | Test Email | Test Password | Access privileges |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@urbanpulse.gov` | `password123` | Raise complaints, view progress, upvote issues |
| **Field Officer** | `officer@urbanpulse.gov` | `password123` | Manage assigned queue, advance statuses, upload evidence |
| **Senior Officer** | `senior@urbanpulse.gov` | `password123` | Department stats charts, assign officers, adjust severity |
| **Admin** | `admin@urbanpulse.gov` | `password123` | Full control: Register officers, manage departments |

*Note: You can register custom Citizen accounts on the `/register` view.*

---

## 🚀 Getting Started

### Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your machine.

### Installation
From the `frontend/` directory, install all required packages:
```bash
npm install
```

### Run Locally (Dev Server)
Launch the local developer server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to explore the portal.

### Build for Production
Bundle and optimize all static files:
```bash
npm run build
```
The build artifacts will be output to the `dist/` directory.

---

## 📡 API Integration Notes

The Axios network client is centralized inside `src/services/api.js` pointing to the default backend URL:
`http://localhost:8000/api/`

If the backend server is not running or returns network exceptions, the frontend **gracefully falls back to a mock database saved in `localStorage`**. This allows you to create issues, update statuses, drop map pins, and upvote complaints with full functionality and data persistence even without a running backend server.
