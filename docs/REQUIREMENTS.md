# Hospital Ward Management System — Confirmed Requirements

## 1. Login & Authentication
* **Scope:** Staff only. Roles: Admin, Ward Admin, Staff, Doctor.
* **Restriction:** No patient login, patient registration portal, or patient-facing interface exists or is needed.

## 2. User Management & Role-Based Access Control (RBAC)
* **Roles:** `admin`, `wardAdmin`, `staff`, `doctor`.
* **Access:** Each role has distinct permission levels for viewing, admitting, transferring, and managing resources.

## 3. Patient Registration & Admission Management
* **Data Structure:** A single `patientAdmission` table. There is NO master patient table.
* **Rule:** Every admission creates a brand-new row, even for returning patients. Duplicate patient names/records across different admissions are intentional by design.

## 4. Bed Allocation & Ward Management
* **Ward Types:** `General`, `ICU`, `Maternity`, `Pediatric`, `Surgical`, `Emergency`.
* **Management:** Track total beds, floor locations, active status, and beds assigned to wards.

## 5. Patient Transfer Management
* **Internal Transfers:** Ward-to-ward or bed-to-bed within the same hospital. Logged in `wardTransfer`.
* **External Transfers:** Sending a patient to another hospital. Uses `isTransfer = TRUE` and `status = 'transferredOut'` on the admission record. Logged in `hospitalTransfer`.
* **Return Flow:** Manual reactivation by staff flips the SAME `patientAdmission` record back to `status = 'admitted'`. No new record is created.

## 6. Patient Discharge Management
* **Data Structure:** Discharge date and notes live directly on `patientAdmission`. No separate discharge table exists.

## 7. QR-Based Flow Handling
* **Trigger:** QR code generated at admission time.
* **Purpose:** Quick lookup of admission records and tracking patient movement across admission, transfer, and discharge.

## 8. Resource Management
* **Scope:** Medical equipment only.
* **Tracking:** Tracked by bulk quantity per ward per status (`available`, `inUse`, `maintenance`). No individual serial number tracking. Each equipment type belongs to exactly one ward.

## 9. Rule-Based Readiness & Shortage Detection
* **Monitors:** Bed availability (`minBedThreshold` on ward) and equipment availability (`minQuantityThreshold` on equipment).
* **Behavior:** Admin-configurable thresholds. When breached, displays a visual dashboard badge/flag only. No automated alerts or notification workflows.

## 10. AI Summary & Reporting System
* **Scope:** Exact report types and AI summary capabilities are TBD (to be confirmed before implementation).