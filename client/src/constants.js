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
  STAFF: 'staff',
  DOCTOR: 'doctor'
};

// Default dashboard routes for each role
export const ROLE_DASHBOARDS = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.WARD_ADMIN]: '/ward-admin',
  [ROLES.STAFF]: '/staff',
  [ROLES.DOCTOR]: '/doctor'
};

// Local storage keys for session persistence
export const STORAGE_KEYS = {
  TOKEN: 'ward_system_token',
  USER: 'ward_system_user'
};
