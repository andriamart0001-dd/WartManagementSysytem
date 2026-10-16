// =============================================================================
// constants.js — Application Constants
// =============================================================================
// Central location for shared constants used throughout the frontend.
// Rule from GEMINI.md: "No Magic Numbers or Strings" — use constants instead.
// =============================================================================

// System user roles (must match the ENUM values in backend MySQL database)
export const ROLES = {
  ADMIN: 'admin',
  WARD_ADMIN: 'wardAdmin',
  ADMISSION_DOCTOR: 'admissionDoctor',
  NURSE: 'nurse',
  DOCTOR: 'doctor'
};

// Default dashboard routes for each role
export const ROLE_DASHBOARDS = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.WARD_ADMIN]: '/ward-admin',
  [ROLES.ADMISSION_DOCTOR]: '/staff', // Maps to the same dashboard for now until further split
  [ROLES.NURSE]: '/staff', // Maps to the same dashboard for now until further split
  [ROLES.DOCTOR]: '/doctor'
};

// Bed status constants
export const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance'
};

// User account status values
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Ward status constants
export const WARD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Ward type constants
export const WARD_TYPES = [
  'General',
  'ICU',
  'Maternity',
  'Pediatric',
  'Surgical',
  'Emergency'
];

// Patient admission status constants
export const ADMISSION_STATUS = {
  ADMITTED: 'admitted',
  DISCHARGED: 'discharged',
  TRANSFERRED_OUT: 'transferredOut'
};

// Patient gender constants
export const GENDER = ['male', 'female', 'other'];

// Equipment status constants
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'inUse',
  MAINTENANCE: 'maintenance'
};

// Alert type constants for shortage logs
export const ALERT_TYPES = {
  BED_SHORTAGE: 'bedShortage',
  EQUIPMENT_SHORTAGE: 'equipmentShortage'
};

// Local storage keys for session persistence
export const STORAGE_KEYS = {
  TOKEN: 'ward_system_token',
  USER: 'ward_system_user'
};
