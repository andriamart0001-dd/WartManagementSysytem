-- =============================================================================
-- Hospital Ward Management System — Complete MySQL Database Schema
-- =============================================================================
-- Global Conventions (Strictly Enforced):
--   1. Primary Key: Always a generic `id` INT AUTO_INCREMENT.
--   2. Audit Columns on every table:
--        createdAt (TIMESTAMP), updatedAt (TIMESTAMP),
--        createdBy (INT NULL FK -> users.id),
--        updatedBy (INT NULL FK -> users.id).
--   3. Patient Identity Architecture:
--        Master patient table (`patient`) tracks demographics, NIC, blood group,
--        and minor/guardian info.
--        Admissions (`patientAdmission`) link to `patient.id`.
-- =============================================================================

DROP DATABASE IF EXISTS ward_management_db;

CREATE DATABASE ward_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ward_management_db;

-- -----------------------------------------------------------------------------
-- TABLE 1: users
-- Stores all hospital staff accounts with role-based access control.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id              INT           NOT NULL AUTO_INCREMENT,
  fullName        VARCHAR(150)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  passwordHash    VARCHAR(255)  NOT NULL,
  role            ENUM('admin', 'wardAdmin', 'admissionDoctor', 'nurse', 'doctor', 'staff') NOT NULL,
  contactNumber   VARCHAR(20)   DEFAULT NULL,
  status          ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_users_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_users_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 2: department
-- Groups wards into hospital departments (e.g., Cardiology, Oncology, Pediatrics).
-- -----------------------------------------------------------------------------
CREATE TABLE department (
  id              INT           NOT NULL AUTO_INCREMENT,
  departmentName  VARCHAR(150)  NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_dept_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_dept_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 3: ward
-- Physical wards within a department.
-- -----------------------------------------------------------------------------
CREATE TABLE ward (
  id                INT           NOT NULL AUTO_INCREMENT,
  wardName          VARCHAR(150)  NOT NULL,
  wardType          ENUM('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Emergency') NOT NULL,
  departmentId      INT           NOT NULL,
  totalBeds         INT           NOT NULL DEFAULT 0,
  minBedThreshold   INT           NOT NULL DEFAULT 0,
  floorLocation     VARCHAR(100)  DEFAULT NULL,
  status            ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

  -- Audit columns
  createdAt         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy         INT           DEFAULT NULL,
  updatedBy         INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_ward_departmentId FOREIGN KEY (departmentId) REFERENCES department (id) ON DELETE CASCADE,
  CONSTRAINT fk_ward_createdBy    FOREIGN KEY (createdBy)    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_ward_updatedBy    FOREIGN KEY (updatedBy)    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 4: section
-- Sections inside a ward (e.g. ICU Bay A, Pre-Op, Post-Op, Section 1).
-- -----------------------------------------------------------------------------
CREATE TABLE section (
  id           INT           NOT NULL AUTO_INCREMENT,
  sectionName  VARCHAR(100)  NOT NULL,
  wardId       INT           NOT NULL,

  -- Audit columns
  createdAt    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy    INT           DEFAULT NULL,
  updatedBy    INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_section_wardId    FOREIGN KEY (wardId)    REFERENCES ward (id) ON DELETE CASCADE,
  CONSTRAINT fk_section_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_section_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 5: bed
-- Individual beds belonging to a ward and optionally assigned to a section.
-- -----------------------------------------------------------------------------
CREATE TABLE bed (
  id          INT           NOT NULL AUTO_INCREMENT,
  wardId      INT           NOT NULL,
  sectionId   INT           DEFAULT NULL,
  bedNumber   VARCHAR(20)   NOT NULL,
  bedStatus   ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',

  -- Audit columns
  createdAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy   INT           DEFAULT NULL,
  updatedBy   INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_bed_wardId    FOREIGN KEY (wardId)    REFERENCES ward (id) ON DELETE CASCADE,
  CONSTRAINT fk_bed_sectionId FOREIGN KEY (sectionId) REFERENCES section (id) ON DELETE SET NULL,
  CONSTRAINT fk_bed_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_bed_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 6: patient
-- Master patient directory. One permanent record per individual patient.
-- Minor policy: Age < 16 is considered minor. For minors, patientNIC is optional
-- but guardianName and guardianNIC are required.
-- -----------------------------------------------------------------------------
CREATE TABLE patient (
  id              INT           NOT NULL AUTO_INCREMENT,
  fullName        VARCHAR(150)  NOT NULL,
  dateOfBirth     DATE          NOT NULL,
  gender          ENUM('male', 'female', 'other') NOT NULL,
  patientNIC      VARCHAR(20)   DEFAULT NULL UNIQUE,
  isMinor         TINYINT(1)    NOT NULL DEFAULT 0,
  guardianName    VARCHAR(150)  DEFAULT NULL,
  guardianNIC     VARCHAR(20)   DEFAULT NULL,
  contactNumber   VARCHAR(20)   DEFAULT NULL,
  address         TEXT          DEFAULT NULL,
  bloodGroup      ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown') NOT NULL DEFAULT 'Unknown',

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_patient_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_patient_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 7: patientAdmission
-- Core admission record linking a patient to a ward and bed.
-- Every hospital stay creates a row here, pointing back to the master patient.
-- -----------------------------------------------------------------------------
CREATE TABLE patientAdmission (
  id                      INT           NOT NULL AUTO_INCREMENT,
  patientId               INT           NOT NULL,
  wardId                  INT           NOT NULL,
  bedId                   INT           DEFAULT NULL,
  admittedBy              INT           NOT NULL,
  admissionDate           DATETIME      NOT NULL,
  status                  ENUM('admitted', 'discharged', 'transferredOut') NOT NULL DEFAULT 'admitted',
  isTransfer              BOOLEAN       NOT NULL DEFAULT FALSE,
  dischargeDate           DATETIME      DEFAULT NULL,
  dischargeNotes          TEXT          DEFAULT NULL,
  admissionNotes          TEXT          DEFAULT NULL,
  emergencyContactName    VARCHAR(150)  DEFAULT NULL,
  emergencyContactNumber  VARCHAR(20)   DEFAULT NULL,
  qrCodeData              TEXT          DEFAULT NULL,

  -- Audit columns
  createdAt               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_pa_patientId   FOREIGN KEY (patientId)   REFERENCES patient (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_wardId      FOREIGN KEY (wardId)      REFERENCES ward (id),
  CONSTRAINT fk_pa_bedId       FOREIGN KEY (bedId)       REFERENCES bed (id) ON DELETE SET NULL,
  CONSTRAINT fk_pa_admittedBy  FOREIGN KEY (admittedBy)  REFERENCES users (id),
  CONSTRAINT fk_pa_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_pa_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 8: wardTransfer
-- Logs internal ward-to-ward or bed-to-bed movements within the hospital.
-- -----------------------------------------------------------------------------
CREATE TABLE wardTransfer (
  id              INT           NOT NULL AUTO_INCREMENT,
  admissionId     INT           NOT NULL,
  fromWardId      INT           NOT NULL,
  toWardId        INT           NOT NULL,
  fromBedId       INT           NOT NULL,
  toBedId         INT           NOT NULL,
  transferReason  TEXT          DEFAULT NULL,
  transferredBy   INT           NOT NULL,
  transferDate    DATETIME      NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_wt_admissionId   FOREIGN KEY (admissionId)   REFERENCES patientAdmission (id) ON DELETE CASCADE,
  CONSTRAINT fk_wt_fromWardId    FOREIGN KEY (fromWardId)    REFERENCES ward (id),
  CONSTRAINT fk_wt_toWardId      FOREIGN KEY (toWardId)      REFERENCES ward (id),
  CONSTRAINT fk_wt_fromBedId     FOREIGN KEY (fromBedId)     REFERENCES bed (id),
  CONSTRAINT fk_wt_toBedId       FOREIGN KEY (toBedId)       REFERENCES bed (id),
  CONSTRAINT fk_wt_transferredBy FOREIGN KEY (transferredBy) REFERENCES users (id),
  CONSTRAINT fk_wt_createdBy     FOREIGN KEY (createdBy)     REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_wt_updatedBy     FOREIGN KEY (updatedBy)     REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 9: hospital
-- Reference list of external hospitals for transfers.
-- -----------------------------------------------------------------------------
CREATE TABLE hospital (
  id              INT           NOT NULL AUTO_INCREMENT,
  hospitalName    VARCHAR(200)  NOT NULL,
  address         TEXT          DEFAULT NULL,
  contactNumber   VARCHAR(20)   DEFAULT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_hospital_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_hospital_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 10: hospitalTransfer
-- Logs external outward transfers to another hospital and return tracking.
-- -----------------------------------------------------------------------------
CREATE TABLE hospitalTransfer (
  id              INT           NOT NULL AUTO_INCREMENT,
  admissionId     INT           NOT NULL,
  hospitalId      INT           NOT NULL,
  transferOutDate DATETIME      NOT NULL,
  transferReason  TEXT          DEFAULT NULL,
  transferredBy   INT           NOT NULL,
  returnDate      DATETIME      DEFAULT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           DEFAULT NULL,
  updatedBy       INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_ht_admissionId   FOREIGN KEY (admissionId)   REFERENCES patientAdmission (id) ON DELETE CASCADE,
  CONSTRAINT fk_ht_hospitalId    FOREIGN KEY (hospitalId)    REFERENCES hospital (id),
  CONSTRAINT fk_ht_transferredBy FOREIGN KEY (transferredBy) REFERENCES users (id),
  CONSTRAINT fk_ht_createdBy     FOREIGN KEY (createdBy)     REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_ht_updatedBy     FOREIGN KEY (updatedBy)     REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 11: equipment
-- Medical equipment tracked by quantity per ward and status.
-- -----------------------------------------------------------------------------
CREATE TABLE equipment (
  id                    INT           NOT NULL AUTO_INCREMENT,
  equipmentName         VARCHAR(150)  NOT NULL,
  quantity              INT           NOT NULL DEFAULT 0,
  status                ENUM('available', 'inUse', 'maintenance') NOT NULL DEFAULT 'available',
  minQuantityThreshold  INT           NOT NULL DEFAULT 0,
  wardId                INT           NOT NULL,

  -- Audit columns
  createdAt             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy             INT           DEFAULT NULL,
  updatedBy             INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_equip_wardId    FOREIGN KEY (wardId)    REFERENCES ward (id) ON DELETE CASCADE,
  CONSTRAINT fk_equip_createdBy FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_equip_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 12: equipmentMaintenanceLog
-- Maintenance events for equipment.
-- -----------------------------------------------------------------------------
CREATE TABLE equipmentMaintenanceLog (
  id                  INT           NOT NULL AUTO_INCREMENT,
  equipmentId         INT           NOT NULL,
  maintenanceDate     DATETIME      NOT NULL,
  performedBy         INT           NOT NULL,
  notes               TEXT          DEFAULT NULL,
  nextScheduledDate   DATETIME      DEFAULT NULL,

  -- Audit columns
  createdAt           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy           INT           DEFAULT NULL,
  updatedBy           INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_eml_equipmentId  FOREIGN KEY (equipmentId) REFERENCES equipment (id) ON DELETE CASCADE,
  CONSTRAINT fk_eml_performedBy  FOREIGN KEY (performedBy) REFERENCES users (id),
  CONSTRAINT fk_eml_createdBy    FOREIGN KEY (createdBy)   REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_eml_updatedBy    FOREIGN KEY (updatedBy)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 13: shortageAlertLog
-- Historical logs of triggered shortage alerts.
-- -----------------------------------------------------------------------------
CREATE TABLE shortageAlertLog (
  id            INT           NOT NULL AUTO_INCREMENT,
  wardId        INT           DEFAULT NULL,
  equipmentId   INT           DEFAULT NULL,
  alertType     ENUM('bedShortage', 'equipmentShortage') NOT NULL,
  triggeredAt   DATETIME      NOT NULL,
  resolvedAt    DATETIME      DEFAULT NULL,

  -- Audit columns
  createdAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy     INT           DEFAULT NULL,
  updatedBy     INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_sal_wardId      FOREIGN KEY (wardId)      REFERENCES ward (id) ON DELETE CASCADE,
  CONSTRAINT fk_sal_equipmentId FOREIGN KEY (equipmentId) REFERENCES equipment (id) ON DELETE CASCADE,
  CONSTRAINT fk_sal_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_sal_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 14: patientVitals
-- Patient vitals recordings linked to an admission.
-- -----------------------------------------------------------------------------
CREATE TABLE patientVitals (
  id              INT             NOT NULL AUTO_INCREMENT,
  admissionId     INT             NOT NULL,
  temperature     DECIMAL(4, 1)   DEFAULT NULL,
  bloodPressure   VARCHAR(20)     DEFAULT NULL,
  pulse           INT             DEFAULT NULL,
  recordedBy      INT             NOT NULL,
  recordedAt      DATETIME        NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT             DEFAULT NULL,
  updatedBy       INT             DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_pv_admissionId FOREIGN KEY (admissionId) REFERENCES patientAdmission (id) ON DELETE CASCADE,
  CONSTRAINT fk_pv_recordedBy  FOREIGN KEY (recordedBy)  REFERENCES users (id),
  CONSTRAINT fk_pv_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_pv_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 15: clinicalRequest
-- Two-step workflow requests (e.g. Doctor requests discharge -> Nurse/Admin approves).
-- -----------------------------------------------------------------------------
CREATE TABLE clinicalRequest (
  id            INT           NOT NULL AUTO_INCREMENT,
  admissionId   INT           NOT NULL,
  requestType   ENUM('discharge') NOT NULL,
  requestStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requestedBy   INT           NOT NULL,
  requestNotes  TEXT          DEFAULT NULL,
  reviewedBy    INT           DEFAULT NULL,
  reviewedAt    TIMESTAMP     NULL DEFAULT NULL,
  reviewNotes   TEXT          DEFAULT NULL,

  -- Audit columns
  createdAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy     INT           DEFAULT NULL,
  updatedBy     INT           DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_cr_admissionId FOREIGN KEY (admissionId) REFERENCES patientAdmission (id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_requestedBy FOREIGN KEY (requestedBy) REFERENCES users (id),
  CONSTRAINT fk_cr_reviewedBy  FOREIGN KEY (reviewedBy)  REFERENCES users (id),
  CONSTRAINT fk_cr_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_cr_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- END OF COMPLETE SCHEMA
-- =============================================================================
