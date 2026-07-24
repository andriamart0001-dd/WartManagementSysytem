# Backend Specification — Hospital Ward Management System

## Base URL
All endpoints are prefixed with `/api`

## Authentication
- JWT Bearer token required on all protected routes
- Header format: `Authorization: Bearer <token>`

---

## Module 1: Auth

### POST /api/auth/login
- **Access:** Public (no token needed)
- **Body:** `{ email, password }`
- **Returns:** `{ message, token, user: { id, fullName, email, role } }`
- **Errors:** 400 (missing fields), 401 (wrong credentials), 403 (inactive account), 500

---

## Module 2: User Management

> All routes require `authenticateJWT` + `authorizeRoles('admin')`

### GET /api/users
- Returns all staff users (passwordHash excluded)

### GET /api/users/:id
- Returns a single user by ID

### POST /api/users
- **Body:** `{ fullName, email, password, role, contactNumber? }`
- Creates a new staff account (hashed password, status='active')

### PUT /api/users/:id
- **Body:** Any subset of `{ fullName, email, password, role, contactNumber, status }`
- Partially updates a user (only provided fields are changed)

### PATCH /api/users/:id/deactivate
- Soft-deletes a user by setting `status = 'inactive'`
- Cannot deactivate own account

---

## Module 3: Patient Admission — ⚠️ NOT YET BUILT

> Planned controller: `server/src/modules/patientAdmission/`
> Key rules: every admission = new row in `patientAdmission`, QR code generated at admission time

---

## Module 4: Bed & Ward Management — ⚠️ NOT YET BUILT

> Planned controller: `server/src/modules/ward/` and `server/src/modules/bed/`

---

## Module 5: Transfer Management — ⚠️ NOT YET BUILT

> Internal: `wardTransfer` table. External: `hospitalTransfer` table + flips `patientAdmission.isTransfer`

---

## Module 6: Discharge — ⚠️ NOT YET BUILT

> No separate table — updates `patientAdmission.dischargeDate` and `patientAdmission.dischargeNotes`

---

## Module 7: QR Code — ⚠️ NOT YET BUILT

> Use `qrcode` npm package. Generated at admission. Payload TBD.

---

## Module 8: Equipment Management — ⚠️ NOT YET BUILT

> Tracks bulk quantities per ward per status (`available`, `inUse`, `maintenance`)

---

## Module 9: Shortage Detection — ⚠️ NOT YET BUILT

> Reads `ward.minBedThreshold` and `equipment.minQuantityThreshold`. Returns flag data only — no automated notifications.

---

## Module 10: AI Reporting — ⏳ SCOPE TBD

> Will be confirmed before implementation begins.

---

## Global Response Conventions

- Success: `{ message: "...", data/user/etc: ... }`
- Error: `{ message: "Human-readable error in plain English" }`
- All errors return appropriate HTTP status codes (400, 401, 403, 404, 500)
