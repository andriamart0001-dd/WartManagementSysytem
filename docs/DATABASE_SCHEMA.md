# Database Schema & Structure (MySQL)

## Global Table Conventions
1. **Primary Key:** Generic `id` (INT, AUTO_INCREMENT) on all tables.
2. **Audit Columns:** Every table includes:
   * `createdAt` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
   * `updatedAt` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
   * `createdBy` (INT, FK → users.id)
   * `updatedBy` (INT, FK → users.id)
   *(Self-referencing and nullable on the `users` table).*

---

## Table Definitions

### 1. users
* `id` (INT, PK, AUTO_INCREMENT)
* `fullName` (VARCHAR)
* `email` (VARCHAR, UNIQUE)
* `passwordHash` (VARCHAR)
* `role` (ENUM('admin', 'wardAdmin', 'staff', 'doctor'))
* `contactNumber` (VARCHAR)
* `status` (ENUM('active', 'inactive'))
* `createdAt`, `updatedAt`, `createdBy` (nullable FK → users.id), `updatedBy` (nullable FK → users.id)

### 2. department
* `id` (INT, PK, AUTO_INCREMENT)
* `departmentName` (VARCHAR)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 3. ward
* `id` (INT, PK, AUTO_INCREMENT)
* `wardName` (VARCHAR)
* `wardType` (ENUM('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Emergency'))
* `departmentId` (INT, FK → department.id)
* `totalBeds` (INT)
* `minBedThreshold` (INT)
* `floorLocation` (VARCHAR)
* `status` (ENUM('active', 'inactive'))
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 4. bed
* `id` (INT, PK, AUTO_INCREMENT)
* `wardId` (INT, FK → ward.id)
* `bedNumber` (VARCHAR)
* `bedStatus` (ENUM('available', 'occupied', 'maintenance'))
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 5. patientAdmission
* `id` (INT, PK, AUTO_INCREMENT)
* `patientName` (VARCHAR)
* `age` (INT)
* `gender` (ENUM('male', 'female', 'other'))
* `contactNumber` (VARCHAR)
* `address` (TEXT)
* `emergencyContactName` (VARCHAR)
* `emergencyContactNumber` (VARCHAR)
* `wardId` (INT, FK → ward.id)
* `bedId` (INT, FK → bed.id, nullable)
* `admittedBy` (INT, FK → users.id)
* `admissionDate` (DATETIME)
* `status` (ENUM('admitted', 'discharged', 'transferredOut') DEFAULT 'admitted')
* `isTransfer` (BOOLEAN DEFAULT FALSE)
* `dischargeDate` (DATETIME, nullable)
* `dischargeNotes` (TEXT, nullable)
* `qrCodeData` (TEXT)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 6. wardTransfer
* `id` (INT, PK, AUTO_INCREMENT)
* `admissionId` (INT, FK → patientAdmission.id)
* `fromWardId` (INT, FK → ward.id)
* `toWardId` (INT, FK → ward.id)
* `fromBedId` (INT, FK → bed.id)
* `toBedId` (INT, FK → bed.id)
* `transferReason` (TEXT)
* `transferredBy` (INT, FK → users.id)
* `transferDate` (DATETIME)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 7. hospital
* `id` (INT, PK, AUTO_INCREMENT)
* `hospitalName` (VARCHAR)
* `address` (TEXT)
* `contactNumber` (VARCHAR)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 8. hospitalTransfer
* `id` (INT, PK, AUTO_INCREMENT)
* `admissionId` (INT, FK → patientAdmission.id)
* `hospitalId` (INT, FK → hospital.id)
* `transferOutDate` (DATETIME)
* `transferReason` (TEXT, nullable)
* `transferredBy` (INT, FK → users.id)
* `returnDate` (DATETIME, nullable)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 9. equipment
* `id` (INT, PK, AUTO_INCREMENT)
* `equipmentName` (VARCHAR)
* `quantity` (INT)
* `status` (ENUM('available', 'inUse', 'maintenance'))
* `minQuantityThreshold` (INT)
* `wardId` (INT, FK → ward.id, required)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 10. equipmentMaintenanceLog
* `id` (INT, PK, AUTO_INCREMENT)
* `equipmentId` (INT, FK → equipment.id)
* `maintenanceDate` (DATETIME)
* `performedBy` (INT, FK → users.id)
* `notes` (TEXT)
* `nextScheduledDate` (DATETIME, nullable)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 11. shortageAlertLog
* `id` (INT, PK, AUTO_INCREMENT)
* `wardId` (INT, FK → ward.id, nullable)
* `equipmentId` (INT, FK → equipment.id, nullable)
* `alertType` (ENUM('bedShortage', 'equipmentShortage'))
* `triggeredAt` (DATETIME)
* `resolvedAt` (DATETIME, nullable)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)

### 12. patientVitals
* `id` (INT, PK, AUTO_INCREMENT)
* `admissionId` (INT, FK → patientAdmission.id)
* `temperature` (DECIMAL(4,1))
* `bloodPressure` (VARCHAR)
* `pulse` (INT)
* `recordedBy` (INT, FK → users.id)
* `recordedAt` (DATETIME)
* `createdAt`, `updatedAt`, `createdBy` (FK → users.id), `updatedBy` (FK → users.id)