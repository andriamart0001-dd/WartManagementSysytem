// =============================================================================
// constants.js — Project-Wide Shared Constants
// =============================================================================
// This file stores all "magic strings" used across the project.
// Instead of typing 'admin' or 'wardAdmin' directly in every file (which is
// easy to mis-type), we import from here.
//
// Rule from GEMINI.md: "No Magic Numbers or Strings" — use constants instead.
// =============================================================================

// The four staff roles that exist in the system.
// These match the ENUM values in the `users` table in the database.
const ROLES = {
  ADMIN: 'admin',         // Full system access — manages users, wards, departments
  WARD_ADMIN: 'wardAdmin',// Manages a specific ward — beds, equipment, admissions
  STAFF: 'staff',         // Can admit patients, log vitals, perform transfers
  DOCTOR: 'doctor'        // Can view and discharge patients, log vitals
};

// User account status values from the `status` column in the `users` table
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Ward constants
const WARD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

const WARD_TYPES = ['General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Emergency'];

// Bed status constants
const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance'
};

// Patient admission status constants
const ADMISSION_STATUS = {
  ADMITTED: 'admitted',
  DISCHARGED: 'discharged',
  TRANSFERRED_OUT: 'transferredOut'
};

const GENDER = ['male', 'female', 'other'];

// Equipment status constants
const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'inUse',
  MAINTENANCE: 'maintenance'
};

// Alert type constants for shortage logs
const ALERT_TYPES = {
  BED_SHORTAGE: 'bedShortage',
  EQUIPMENT_SHORTAGE: 'equipmentShortage'
};

// Export so other files can import these constants
module.exports = {
  ROLES,
  USER_STATUS,
  WARD_STATUS,
  WARD_TYPES,
  BED_STATUS,
  ADMISSION_STATUS,
  GENDER,
  EQUIPMENT_STATUS,
  ALERT_TYPES
};
