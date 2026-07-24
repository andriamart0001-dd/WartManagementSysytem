# Hospital Ward Management System — AI Project Memory

## ⚠️ OPERATIONAL GROUND RULES
1. **No Unprompted Implementation:** Do not write code, scaffold files, or create folders until explicitly commanded with "start implementation" or "begin building."
2. **Stop and Ask on Ambiguity:** Do not guess or assume defaults for pending decisions (e.g., framework, QR payload, AI reporting scope). Ask the user for clarification.
3. **Academic Evaluation Priority:** Prioritize clean, readable, well-commented code over premature optimization. Organize code cleanly by module.
4. **Parameterized Queries Only:** Use `mysql2` parameterized queries exclusively (e.g., `db.query('SELECT * FROM users WHERE id = ?', [id])`). Never concatenate user input directly into SQL strings.
5. **Confirm File Scaffolding:** Always confirm folder and file structures with the user before generating large batches of files.
6. **🎓 BEGINNER-FRIENDLY CODE STANDARD (HIGHEST PRIORITY):** Every single line of code written in this project — frontend and backend — MUST be written at a beginner student level. See dedicated section below for full rules.

---

## 🏛️ ARCHITECTURAL & BUSINESS LOGIC RULES
* **No Master Patient Table:** Every admission creates a brand-new row in `patientAdmission`. Duplicate patient names/records across different admissions are by design, not a bug.
* **Internal Transfers:** Ward-to-ward or bed-to-bed moves within the same hospital are logged in `wardTransfer`.
* **External Transfers:** Sending a patient to another hospital sets `isTransfer = TRUE` and `status = 'transferredOut'` on the `patientAdmission` record, with details logged in `hospitalTransfer`. When a patient returns, flip the *same* `patientAdmission` record status back to `admitted` (do not create a new admission record).
* **Discharge Management:** Discharge data (`dischargeDate`, `dischargeNotes`) lives directly on `patientAdmission`. There is no separate discharge table.
* **Resource Management:** Track medical equipment by quantity per ward per status (`available`, `inUse`, `maintenance`). Do not track individual serial-numbered units.
* **Shortage Detection:** Monitor `minBedThreshold` (wards) and `minQuantityThreshold` (equipment). On shortage, display a visual dashboard badge/flag only—no automated notifications or complex workflows.

---

## 💾 DATABASE CONVENTIONS (MySQL — 12 Tables)
Every table in the database MUST adhere to these global rules without exception:
1. **Primary Key:** Always a generic `id` (INT, AUTO_INCREMENT). Never use table-specific names like `userId` or `wardId` for the primary key.
2. **Audit Columns:** Every table must include:
   * `createdAt` (TIMESTAMP)
   * `updatedAt` (TIMESTAMP)
   * `createdBy` (FK → users.id)
   * `updatedBy` (FK → users.id)
   *(Note: In the `users` table, createdBy/updatedBy are self-referencing and nullable).*

### Confirmed Table List:
1. `users` — Staff RBAC: ENUM('admin','wardAdmin','staff','doctor')
2. `department` — Hospital departments
3. `ward` — Wards with types ENUM('General','ICU','Maternity','Pediatric','Surgical','Emergency') and `minBedThreshold`
4. `bed` — Beds linked to wards, status ENUM('available','occupied','maintenance')
5. `patientAdmission` — Core admission tracking, QR code data, discharge details
6. `wardTransfer` — Internal hospital transfer logs
7. `hospital` — External hospital reference list
8. `hospitalTransfer` — External transfer logs and return tracking
9. `equipment` — Quantities and thresholds per ward
10. `equipmentMaintenanceLog` — Maintenance tracking for equipment
11. `shortageAlertLog` — Historical log of triggered bed/equipment shortage badges
12. `patientVitals` — Basic vitals logging linked to admission

---

## 🛠️ TECH STACK (CONFIRMED — DO NOT CHANGE)
* **Frontend:** React (Vite)
* **Backend:** Node.js + Express.js
* **Language:** JavaScript ONLY — NO TypeScript anywhere in this project (no `.ts`, no `.tsx`, no `tsconfig.json`)
* **Database:** MySQL
* **Database Access:** Raw `mysql2` parameterized queries — NO ORM (no Prisma, no Sequelize)
* **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
* **QR Codes:** `qrcode` npm package

---

## 🎓 BEGINNER-FRIENDLY CODING STANDARD

> **This rule applies to every file in the entire project, without exception.**
> Code must be easy enough for a first-year or second-year CS student to read, understand, and explain.

### Mandatory Rules for Every Code File:

1. **Comment Every Logical Block**
   - Every function, route handler, middleware, and component MUST have a plain-English comment above it explaining what it does and why.
   - Example:
     ```js
     // This function checks if the user is logged in before allowing access
     // It reads the JWT token from the request header and verifies it
     function protect(req, res, next) { ... }
     ```

2. **No Clever One-Liners**
   - Avoid chained `.then().catch()` pyramids, complex ternaries, and advanced ES6+ tricks that obscure intent.
   - Prefer `async/await` with `try/catch` blocks — write each step on its own line.
   - ❌ Bad: `const user = await db.query(...).then(([r])=>r[0]).catch(e=>null)`
   - ✅ Good: Multi-line `try { ... } catch (error) { ... }` with a comment on each step.

3. **Name Variables Descriptively**
   - No single-letter variables (except loop counters `i`, `j`).
   - Names must clearly state what the value represents.
   - ❌ Bad: `const d = await db.query(...)`
   - ✅ Good: `const admissionRecord = await db.query(...)`

4. **Separate Concerns Clearly**
   - Routes only call controllers. Controllers only contain logic. Config files only set up connections.
   - Never mix database queries directly inside route definitions.

5. **Inline Explanations for SQL Queries**
   - Every SQL query string must have a comment above it describing what it fetches or mutates.
   - Example:
     ```js
     // Get all active wards that belong to the specified department
     const sql = 'SELECT * FROM ward WHERE departmentId = ? AND status = ?';
     ```

6. **Error Messages Must Be Human-Readable**
   - Always return JSON error responses with a `message` field in plain English.
   - Example: `res.status(404).json({ message: 'Ward not found' })`

7. **React Components: One Job Per Component**
   - Each React component must do exactly one thing. No giant 300-line components.
   - Add a comment at the top of every component explaining its purpose.

8. **No Magic Numbers or Strings**
   - Define constants for repeated values. Place them in a `constants.js` file.
   - ❌ Bad: `if (role === 'wardAdmin')`  scattered everywhere
   - ✅ Good: `import { ROLES } from '../constants'; if (role === ROLES.WARD_ADMIN)`