# Frontend Specification — Hospital Ward Management System

## Tech Stack
- **Framework:** React 18 (Vite)
- **Routing:** react-router-dom v6
- **HTTP Client:** axios
- **Language:** JavaScript ONLY (`.jsx`, `.js` — NO TypeScript)
- **Styling:** Plain modular CSS (NO Tailwind, NO CSS frameworks unless explicitly approved)

---

## Directory Structure (Planned)

```
client/src/
├── constants.js               ← ROLES, routes constants (mirrors server/src/constants.js)
├── main.jsx                   ← Vite app entry point
├── App.jsx                    ← Router configuration
│
├── context/
│   └── AuthContext.jsx        ← Auth state: user, token, isAuthenticated, isLoading
│                                 Functions: login(), logout()
│
├── api/
│   └── axiosInstance.js       ← Axios instance with baseURL + auto JWT header injection
│
├── routes/
│   ├── ProtectedRoute.jsx     ← Redirect to /login if not authenticated
│   └── RoleRoute.jsx          ← Redirect to /unauthorized if role not in allowedRoles[]
│
├── layouts/
│   └── AppLayout.jsx          ← Sidebar/Navbar: logged-in user name, role badge, Logout button
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx          ← Staff Portal Login — email + password, inline validation
│   │   └── UnauthorizedPage.jsx   ← Role-denied landing page
│   ├── admin/
│   │   └── AdminDashboard.jsx     ← Admin role dashboard
│   ├── ward/
│   │   └── WardDashboard.jsx      ← Ward Admin role dashboard
│   ├── staff/
│   │   └── StaffDashboard.jsx     ← Staff role dashboard
│   └── doctor/
│       └── DoctorDashboard.jsx    ← Doctor role dashboard
│
└── components/
    └── (shared reusable UI components — tables, badges, modals, forms)
```

---

## Route Map

| Path | Component | Protection |
|------|-----------|-----------|
| `/login` | LoginPage | Public |
| `/unauthorized` | UnauthorizedPage | Public |
| `/admin/dashboard` | AdminDashboard | admin only |
| `/ward/dashboard` | WardDashboard | wardAdmin only |
| `/staff/dashboard` | StaffDashboard | staff only |
| `/doctor/dashboard` | DoctorDashboard | doctor only |

> After login, users are redirected to their role-specific dashboard automatically.

---

## Auth State (AuthContext)

```
AuthContext provides:
  user          → { id, fullName, email, role } or null
  token         → JWT string or null
  isAuthenticated → boolean
  isLoading     → boolean (for initial load check)
  login(email, password)  → POST /api/auth/login, store token in localStorage
  logout()      → Clear state + localStorage
```

Token key in localStorage: `'authToken'`
User key in localStorage: `'authUser'`

---

## Login Page Rules (STRICT)

- Label: **"Staff Portal Login"**
- Fields: Email, Password
- Quick Login Demo Buttons:
  - 👑 **Admin**: `admin@hospital.com` / `Admin@1234` → `/admin`
  - 🛌 **Ward Admin**: `wardadmin@hospital.com` / `WardAdmin@1234` → `/ward-admin`
  - 📋 **Staff Nurse**: `staff@hospital.com` / `Staff@1234` → `/staff`
  - 🩺 **Doctor**: `doctor@hospital.com` / `Doctor@1234` → `/doctor`
- Inline validation (required fields, valid email format)
- Display API error messages clearly
- ❌ NO "Forgot Password" link
- ❌ NO "Register as Patient" link
- ❌ NO "Patient Login" option


---

## Coding Standards (GEMINI.md enforcement)

1. Every component has a top-of-file comment explaining its purpose
2. Every function/handler has a plain-English comment above it
3. `async/await` with `try/catch` — no `.then().catch()` chains
4. Descriptive variable names (no `d`, `r`, `u`)
5. One job per component — no giant 300-line files
6. All role strings imported from `src/constants.js` — no magic strings
7. All API base URL from `import.meta.env.VITE_API_BASE_URL`

---

## Module Build Order (Planned)

| Priority | Module | Status |
|----------|--------|--------|
| 1 | AuthContext + Login Page + Protected Routes | ⚠️ Not started |
| 2 | AppLayout (Sidebar/Navbar) | ⚠️ Not started |
| 3 | Role Dashboard Placeholders | ⚠️ Not started |
| 4 | User Management UI (admin) | ⚠️ Not started |
| 5 | Ward & Bed Management UI | ⚠️ Not started |
| 6 | Patient Admission UI | ⚠️ Not started |
| 7 | Transfer Management UI | ⚠️ Not started |
| 8 | Discharge UI | ⚠️ Not started |
| 9 | Equipment Management UI | ⚠️ Not started |
| 10 | Shortage Dashboard Badges | ⚠️ Not started |
| 11 | QR Code View/Scan UI | ⚠️ Not started |
| 12 | AI Reporting UI | ⏳ TBD |
