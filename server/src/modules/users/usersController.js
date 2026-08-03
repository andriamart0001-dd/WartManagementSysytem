// =============================================================================
// usersController.js — User Management CRUD Operations
// =============================================================================
// This controller handles all admin-level operations on the `users` table.
// Every function here is protected by the admin role guard in the route file.
//
// Endpoints provided:
//   GET    /api/users        — getAllUsers    : List all staff users
//   GET    /api/users/:id    — getUserById   : Get one user by their ID
//   POST   /api/users        — createUser    : Create a new staff user
//   PUT    /api/users/:id    — updateUser    : Update an existing user's details
//   PATCH  /api/users/:id/deactivate — deactivateUser : Soft-delete (set inactive)
//
// Key rules followed (from GEMINI.md):
//   - Parameterized queries only — no string concatenation
//   - createdBy and updatedBy are always set from req.user.id
//   - Password is always hashed with bcrypt before storing
//   - Descriptive variable names — no single-letter vars
// =============================================================================

// Import the database pool
const db = require('../../config/db');

// Import bcryptjs for hashing new user passwords
const bcrypt = require('bcryptjs');

// Import constants so we avoid magic strings
const { USER_STATUS, ROLES } = require('../../constants');

// =============================================================================
// HELPER: sanitizeUser
// =============================================================================
// This function removes the password hash from a user object before returning
// it in an API response. Never send password data to the client!
// =============================================================================
const sanitizeUser = (userRecord) => {
  // Destructure to separate passwordHash from the rest of the fields
  const { passwordHash, ...safeUserData } = userRecord;

  // Return only the safe data (passwordHash is discarded)
  return safeUserData;
};

// =============================================================================
// FUNCTION 1: getAllUsers
// =============================================================================
// Fetches every user from the database (all roles, all statuses).
// Admins need to see all users to manage the system.
// =============================================================================
const getAllUsers = async (req, res) => {
  try {
    // Get all users from the database, ordered from newest to oldest
    // Note: We never SELECT * in production — but for academic clarity we do here
    const getAllUsersSql = 'SELECT * FROM users ORDER BY createdAt DESC';
    const [userRows] = await db.query(getAllUsersSql);

    // Remove the passwordHash from every user object in the list
    const safeUserList = userRows.map(sanitizeUser);

    return res.status(200).json({
      message: 'Users retrieved successfully',
      count: safeUserList.length,
      users: safeUserList
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while retrieving users.'
    });
  }
};

// =============================================================================
// FUNCTION 2: getUserById
// =============================================================================
// Fetches a single user by their numeric ID from the URL parameter.
// Example: GET /api/users/5 → fetches the user whose id = 5
// =============================================================================
const getUserById = async (req, res) => {
  // Read the user ID from the URL — Express puts it in req.params
  const targetUserId = req.params.id;

  try {
    // Find the user with this exact ID — parameterized query prevents SQL injection
    const findUserSql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [userRows] = await db.query(findUserSql, [targetUserId]);

    // If no user was found with that ID, return a 404 error
    if (userRows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Return the user without the password hash
    const safeUserData = sanitizeUser(userRows[0]);

    return res.status(200).json({
      message: 'User retrieved successfully',
      user: safeUserData
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while retrieving the user.'
    });
  }
};

// =============================================================================
// FUNCTION 3: createUser
// =============================================================================
// Creates a brand new staff user in the database.
// The logged-in admin's ID is automatically stored in `createdBy` and `updatedBy`.
// The new user's password is hashed with bcrypt before being stored.
// =============================================================================
const createUser = async (req, res) => {
  // Read the fields sent in the request body
  const { fullName, email, password, role, contactNumber } = req.body;

  // The admin who is making this request — their ID comes from the JWT via req.user
  const adminUserId = req.user.id;

  // --- Input Validation ---
  // All of these fields are required to create a user
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({
      message: 'Please provide fullName, email, password, and role'
    });
  }

  // Ensure role is a valid role defined in ROLES constant
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      message: `Invalid role specified. Allowed roles are: ${Object.values(ROLES).join(', ')}`
    });
  }

  try {
    // --- Step 1: Check if a user with this email already exists ---
    // Emails must be unique in the database — the schema enforces this too,
    // but we check here to give a friendlier error message
    const checkEmailSql = 'SELECT id FROM users WHERE email = ? LIMIT 1';
    const [existingUsers] = await db.query(checkEmailSql, [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'A user with this email address already exists'
      });
    }

    // --- Step 2: Hash the new user's password ---
    // The number 10 is the "salt rounds" — a higher number is more secure but slower.
    // 10 is the standard industry recommendation.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Step 3: Insert the new user into the database ---
    const insertUserSql = `
      INSERT INTO users (fullName, email, passwordHash, role, contactNumber, status, createdBy, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // The values array matches the ? placeholders above in the same order
    const insertValues = [
      fullName,
      email,
      hashedPassword,
      role,
      contactNumber || null,   // Optional field — use null if not provided
      USER_STATUS.ACTIVE,      // New users are active by default
      adminUserId,             // Who created this user
      adminUserId              // updatedBy also set to creator at time of creation
    ];

    const [insertResult] = await db.query(insertUserSql, insertValues);

    // The insertId is the auto-generated primary key (id) of the new row
    const newUserId = insertResult.insertId;

    // --- Step 4: Fetch the newly created user to return in the response ---
    const [newUserRows] = await db.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [newUserId]
    );

    const safeNewUserData = sanitizeUser(newUserRows[0]);

    return res.status(201).json({
      message: 'User created successfully',
      user: safeNewUserData
    });

  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while creating the user.'
    });
  }
};

// =============================================================================
// FUNCTION 4: updateUser
// =============================================================================
// Updates an existing user's information. The admin sends only the fields
// they want to change. We build the SQL dynamically but safely.
// The password can optionally be changed — it will be re-hashed if provided.
// =============================================================================
const updateUser = async (req, res) => {
  // Get the target user's ID from the URL
  const targetUserId = req.params.id;

  // The admin making the request
  const adminUserId = req.user.id;

  // Read all possible updatable fields from the request body
  const { fullName, email, password, role, contactNumber, status } = req.body;

  try {
    // --- Step 1: Confirm the user we are updating actually exists ---
    const findUserSql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [existingUserRows] = await db.query(findUserSql, [targetUserId]);

    if (existingUserRows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // --- Step 2: Build the list of fields to update ---
    // We only update the fields that were actually sent in the request.
    // This prevents accidentally erasing data that was not included.
    const fieldsToUpdate = [];  // Will hold SQL fragments like "fullName = ?"
    const updateValues = [];    // Will hold the actual values for the ? placeholders

    if (fullName !== undefined) {
      fieldsToUpdate.push('fullName = ?');
      updateValues.push(fullName);
    }

    if (email !== undefined) {
      fieldsToUpdate.push('email = ?');
      updateValues.push(email);
    }

    if (role !== undefined) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          message: `Invalid role specified. Allowed roles are: ${Object.values(ROLES).join(', ')}`
        });
      }
      fieldsToUpdate.push('role = ?');
      updateValues.push(role);
    }

    if (contactNumber !== undefined) {
      fieldsToUpdate.push('contactNumber = ?');
      updateValues.push(contactNumber);
    }

    if (status !== undefined) {
      fieldsToUpdate.push('status = ?');
      updateValues.push(status);
    }

    // If a new password was provided, hash it before adding to the update list
    if (password !== undefined) {
      const saltRounds = 10;
      const newHashedPassword = await bcrypt.hash(password, saltRounds);
      fieldsToUpdate.push('passwordHash = ?');
      updateValues.push(newHashedPassword);
    }

    // Always update the updatedBy field to record who made this change
    fieldsToUpdate.push('updatedBy = ?');
    updateValues.push(adminUserId);

    // If nothing was provided to update, return an error
    if (fieldsToUpdate.length === 1) { // Only updatedBy was added
      return res.status(400).json({
        message: 'No update fields were provided in the request body'
      });
    }

    // --- Step 3: Build and execute the final UPDATE query ---
    // We join the fieldsToUpdate array with commas to create: "fullName = ?, email = ?, ..."
    const updateSql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    // Add the targetUserId at the end for the WHERE clause's ? placeholder
    updateValues.push(targetUserId);

    await db.query(updateSql, updateValues);

    // --- Step 4: Fetch the updated user to return in the response ---
    const [updatedUserRows] = await db.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [targetUserId]
    );

    const safeUpdatedUserData = sanitizeUser(updatedUserRows[0]);

    return res.status(200).json({
      message: 'User updated successfully',
      user: safeUpdatedUserData
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while updating the user.'
    });
  }
};

// =============================================================================
// FUNCTION 5: deactivateUser
// =============================================================================
// This is a "soft delete" — instead of permanently removing the user from the
// database, we set their status to 'inactive'.
// This preserves data integrity (other tables reference users.id) and keeps
// a historical record. The user just can no longer log in.
// =============================================================================
const deactivateUser = async (req, res) => {
  // Get the target user's ID from the URL
  const targetUserId = req.params.id;

  // The admin making the request
  const adminUserId = req.user.id;

  // Safety rule: Admins should not be able to deactivate their own account
  // (This would lock them out of the system immediately)
  if (parseInt(targetUserId) === parseInt(adminUserId)) {
    return res.status(400).json({
      message: 'You cannot deactivate your own account'
    });
  }

  try {
    // --- Step 1: Confirm the user exists ---
    const findUserSql = 'SELECT id, status FROM users WHERE id = ? LIMIT 1';
    const [existingUserRows] = await db.query(findUserSql, [targetUserId]);

    if (existingUserRows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // --- Step 2: Check if the user is already inactive ---
    if (existingUserRows[0].status === USER_STATUS.INACTIVE) {
      return res.status(400).json({
        message: 'This user is already inactive'
      });
    }

    // --- Step 3: Set the user's status to inactive ---
    // This is parameterized to prevent SQL injection
    const deactivateSql = `
      UPDATE users
      SET status = ?, updatedBy = ?
      WHERE id = ?
    `;

    await db.query(deactivateSql, [USER_STATUS.INACTIVE, adminUserId, targetUserId]);

    return res.status(200).json({
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({
      message: 'An internal server error occurred while deactivating the user.'
    });
  }
};

// Export all controller functions for the route file to use
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser
};
