-- =============================================================================
-- Hospital Ward Management System — MySQL Database Schema
-- =============================================================================
-- Conventions (enforced on every table without exception):
--   1. Primary Key  : Generic `id` INT AUTO_INCREMENT — never table-specific names.
--   2. Audit Columns: createdAt, updatedAt, createdBy (FK→users.id),
--                     updatedBy (FK→users.id).
--   3. In the `users` table, createdBy/updatedBy are self-referencing & nullable.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ward_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ward_management_db;

-- -----------------------------------------------------------------------------
-- TABLE 1: users
-- Stores all staff accounts with role-based access control.
-- createdBy / updatedBy are nullable because the first admin has no prior user.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT           NOT NULL AUTO_INCREMENT,
  fullName        VARCHAR(150)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  passwordHash    VARCHAR(255)  NOT NULL,
  role            ENUM('admin', 'wardAdmin', 'staff', 'doctor') NOT NULL,
  contactNumber   VARCHAR(20)   DEFAULT NULL,
  status          ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

  -- Audit columns (self-referencing; nullable to allow first-user bootstrap)
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
-- Groups wards into hospital departments (e.g., Cardiology, Oncology).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS department (
  id              INT           NOT NULL AUTO_INCREMENT,
  departmentName  VARCHAR(150)  NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           NOT NULL,
  updatedBy       INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_department_createdBy FOREIGN KEY (createdBy) REFERENCES users (id),
  CONSTRAINT fk_department_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 3: ward
-- Physical wards within a department. minBedThreshold triggers shortage badge.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ward (
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
  createdBy         INT           NOT NULL,
  updatedBy         INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_ward_departmentId FOREIGN KEY (departmentId) REFERENCES department (id),
  CONSTRAINT fk_ward_createdBy    FOREIGN KEY (createdBy)    REFERENCES users (id),
  CONSTRAINT fk_ward_updatedBy    FOREIGN KEY (updatedBy)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 4: bed
-- Individual beds belonging to a ward. Status tracks real-time availability.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bed (
  id          INT           NOT NULL AUTO_INCREMENT,
  wardId      INT           NOT NULL,
  bedNumber   VARCHAR(20)   NOT NULL,
  bedStatus   ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',

  -- Audit columns
  createdAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy   INT           NOT NULL,
  updatedBy   INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_bed_wardId    FOREIGN KEY (wardId)    REFERENCES ward (id),
  CONSTRAINT fk_bed_createdBy FOREIGN KEY (createdBy) REFERENCES users (id),
  CONSTRAINT fk_bed_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 5: patientAdmission
-- Core admission record. Every admission = new row (no master patient table).
-- Discharge fields live here. isTransfer + status='transferredOut' = external.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patientAdmission (
  id                      INT           NOT NULL AUTO_INCREMENT,
  patientName             VARCHAR(150)  NOT NULL,
  age                     INT           NOT NULL,
  gender                  ENUM('male', 'female', 'other') NOT NULL,
  contactNumber           VARCHAR(20)   DEFAULT NULL,
  address                 TEXT          DEFAULT NULL,
  emergencyContactName    VARCHAR(150)  DEFAULT NULL,
  emergencyContactNumber  VARCHAR(20)   DEFAULT NULL,
  wardId                  INT           NOT NULL,
  bedId                   INT           DEFAULT NULL,         -- nullable: pre-admission before bed assigned
  admittedBy              INT           NOT NULL,             -- FK → users (staff who admitted)
  admissionDate           DATETIME      NOT NULL,
  status                  ENUM('admitted', 'discharged', 'transferredOut') NOT NULL DEFAULT 'admitted',
  isTransfer              BOOLEAN       NOT NULL DEFAULT FALSE, -- TRUE = sent to external hospital
  dischargeDate           DATETIME      DEFAULT NULL,          -- populated on discharge
  dischargeNotes          TEXT          DEFAULT NULL,          -- populated on discharge
  qrCodeData              TEXT          NOT NULL,              -- JSON/token generated at admission

  -- Audit columns
  createdAt               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy               INT           NOT NULL,
  updatedBy               INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_pa_wardId      FOREIGN KEY (wardId)      REFERENCES ward (id),
  CONSTRAINT fk_pa_bedId       FOREIGN KEY (bedId)       REFERENCES bed (id),
  CONSTRAINT fk_pa_admittedBy  FOREIGN KEY (admittedBy)  REFERENCES users (id),
  CONSTRAINT fk_pa_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id),
  CONSTRAINT fk_pa_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 6: wardTransfer
-- Logs internal ward-to-ward or bed-to-bed movements within the hospital.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wardTransfer (
  id              INT           NOT NULL AUTO_INCREMENT,
  admissionId     INT           NOT NULL,
  fromWardId      INT           NOT NULL,
  toWardId        INT           NOT NULL,
  fromBedId       INT           NOT NULL,
  toBedId         INT           NOT NULL,
  transferReason  TEXT          DEFAULT NULL,
  transferredBy   INT           NOT NULL,             -- FK → users (staff who performed transfer)
  transferDate    DATETIME      NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           NOT NULL,
  updatedBy       INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_wt_admissionId   FOREIGN KEY (admissionId)   REFERENCES patientAdmission (id),
  CONSTRAINT fk_wt_fromWardId    FOREIGN KEY (fromWardId)    REFERENCES ward (id),
  CONSTRAINT fk_wt_toWardId      FOREIGN KEY (toWardId)      REFERENCES ward (id),
  CONSTRAINT fk_wt_fromBedId     FOREIGN KEY (fromBedId)     REFERENCES bed (id),
  CONSTRAINT fk_wt_toBedId       FOREIGN KEY (toBedId)       REFERENCES bed (id),
  CONSTRAINT fk_wt_transferredBy FOREIGN KEY (transferredBy) REFERENCES users (id),
  CONSTRAINT fk_wt_createdBy     FOREIGN KEY (createdBy)     REFERENCES users (id),
  CONSTRAINT fk_wt_updatedBy     FOREIGN KEY (updatedBy)     REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 7: hospital
-- Reference list of external hospitals for outward transfer destinations.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital (
  id              INT           NOT NULL AUTO_INCREMENT,
  hospitalName    VARCHAR(200)  NOT NULL,
  address         TEXT          DEFAULT NULL,
  contactNumber   VARCHAR(20)   DEFAULT NULL,

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           NOT NULL,
  updatedBy       INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_hospital_createdBy FOREIGN KEY (createdBy) REFERENCES users (id),
  CONSTRAINT fk_hospital_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 8: hospitalTransfer
-- Logs external outward transfers. returnDate is set when patient comes back
-- (status on patientAdmission is flipped back to 'admitted' — no new row).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitalTransfer (
  id              INT           NOT NULL AUTO_INCREMENT,
  admissionId     INT           NOT NULL,
  hospitalId      INT           NOT NULL,
  transferOutDate DATETIME      NOT NULL,
  transferReason  TEXT          DEFAULT NULL,
  transferredBy   INT           NOT NULL,             -- FK → users
  returnDate      DATETIME      DEFAULT NULL,         -- set when patient returns

  -- Audit columns
  createdAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT           NOT NULL,
  updatedBy       INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_ht_admissionId   FOREIGN KEY (admissionId)   REFERENCES patientAdmission (id),
  CONSTRAINT fk_ht_hospitalId    FOREIGN KEY (hospitalId)    REFERENCES hospital (id),
  CONSTRAINT fk_ht_transferredBy FOREIGN KEY (transferredBy) REFERENCES users (id),
  CONSTRAINT fk_ht_createdBy     FOREIGN KEY (createdBy)     REFERENCES users (id),
  CONSTRAINT fk_ht_updatedBy     FOREIGN KEY (updatedBy)     REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 9: equipment
-- Medical equipment tracked by bulk quantity per ward per status.
-- No individual serial-number tracking. minQuantityThreshold for shortage badge.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id                    INT           NOT NULL AUTO_INCREMENT,
  equipmentName         VARCHAR(150)  NOT NULL,
  quantity              INT           NOT NULL DEFAULT 0,
  status                ENUM('available', 'inUse', 'maintenance') NOT NULL DEFAULT 'available',
  minQuantityThreshold  INT           NOT NULL DEFAULT 0,
  wardId                INT           NOT NULL,              -- equipment belongs to exactly one ward

  -- Audit columns
  createdAt             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy             INT           NOT NULL,
  updatedBy             INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_equip_wardId    FOREIGN KEY (wardId)    REFERENCES ward (id),
  CONSTRAINT fk_equip_createdBy FOREIGN KEY (createdBy) REFERENCES users (id),
  CONSTRAINT fk_equip_updatedBy FOREIGN KEY (updatedBy) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 10: equipmentMaintenanceLog
-- Tracks individual maintenance events for equipment items.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipmentMaintenanceLog (
  id                  INT           NOT NULL AUTO_INCREMENT,
  equipmentId         INT           NOT NULL,
  maintenanceDate     DATETIME      NOT NULL,
  performedBy         INT           NOT NULL,               -- FK → users
  notes               TEXT          DEFAULT NULL,
  nextScheduledDate   DATETIME      DEFAULT NULL,

  -- Audit columns
  createdAt           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy           INT           NOT NULL,
  updatedBy           INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_eml_equipmentId  FOREIGN KEY (equipmentId) REFERENCES equipment (id),
  CONSTRAINT fk_eml_performedBy  FOREIGN KEY (performedBy) REFERENCES users (id),
  CONSTRAINT fk_eml_createdBy    FOREIGN KEY (createdBy)   REFERENCES users (id),
  CONSTRAINT fk_eml_updatedBy    FOREIGN KEY (updatedBy)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 11: shortageAlertLog
-- Historical log of shortage badge triggers for beds (wardId) or equipment
-- (equipmentId). Exactly one of wardId / equipmentId will be set per row.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shortageAlertLog (
  id            INT           NOT NULL AUTO_INCREMENT,
  wardId        INT           DEFAULT NULL,                  -- set for bedShortage
  equipmentId   INT           DEFAULT NULL,                  -- set for equipmentShortage
  alertType     ENUM('bedShortage', 'equipmentShortage') NOT NULL,
  triggeredAt   DATETIME      NOT NULL,
  resolvedAt    DATETIME      DEFAULT NULL,

  -- Audit columns
  createdAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy     INT           NOT NULL,
  updatedBy     INT           NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_sal_wardId      FOREIGN KEY (wardId)      REFERENCES ward (id),
  CONSTRAINT fk_sal_equipmentId FOREIGN KEY (equipmentId) REFERENCES equipment (id),
  CONSTRAINT fk_sal_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id),
  CONSTRAINT fk_sal_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 12: patientVitals
-- Basic vitals entries linked to a specific admission. Multiple rows per
-- admission, each timestamped and attributed to the recording staff/doctor.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patientVitals (
  id              INT             NOT NULL AUTO_INCREMENT,
  admissionId     INT             NOT NULL,
  temperature     DECIMAL(4, 1)   DEFAULT NULL,              -- °C, e.g. 37.5
  bloodPressure   VARCHAR(20)     DEFAULT NULL,              -- e.g. "120/80"
  pulse           INT             DEFAULT NULL,              -- bpm
  recordedBy      INT             NOT NULL,                  -- FK → users
  recordedAt      DATETIME        NOT NULL,

  -- Audit columns
  createdAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy       INT             NOT NULL,
  updatedBy       INT             NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_pv_admissionId FOREIGN KEY (admissionId) REFERENCES patientAdmission (id),
  CONSTRAINT fk_pv_recordedBy  FOREIGN KEY (recordedBy)  REFERENCES users (id),
  CONSTRAINT fk_pv_createdBy   FOREIGN KEY (createdBy)   REFERENCES users (id),
  CONSTRAINT fk_pv_updatedBy   FOREIGN KEY (updatedBy)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
