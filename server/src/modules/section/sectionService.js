// =============================================================================
// sectionService.js — Business Logic for Ward Sections
// =============================================================================
// This file coordinates between the section controller and the section model.
// It enforces all business validation rules, such as:
//   - Checking required fields
//   - Making sure the target ward exists before adding a section
//   - Preventing duplicate section names within the same ward
//   - Preventing deletion of a section if beds are still assigned to it
// =============================================================================

const sectionModel = require('./sectionModel');

// This function retrieves all sections, optionally filtered by wardId
const getSections = async (wardId) => {
  const sections = await sectionModel.findAllSections(wardId);
  return sections;
};

// This function retrieves a single section by ID, or throws an error if missing
const getSectionById = async (id) => {
  const section = await sectionModel.findSectionById(id);
  if (!section) {
    throw new Error('Section not found');
  }
  return section;
};

// This function creates a new section after running all validation checks
const createSection = async (sectionData, userId) => {
  const { sectionName, wardId } = sectionData;

  // Step 1: Validate required fields
  if (!sectionName || !sectionName.trim()) {
    throw new Error('sectionName is required');
  }
  if (!wardId) {
    throw new Error('wardId is required');
  }

  const cleanSectionName = sectionName.trim();

  // Step 2: Ensure the specified ward actually exists
  const wardExists = await sectionModel.checkWardExists(wardId);
  if (!wardExists) {
    throw new Error('Ward not found');
  }

  // Step 3: Check if a section with this name already exists in this ward
  const existingSection = await sectionModel.findSectionByNameInWard(cleanSectionName, wardId);
  if (existingSection) {
    throw new Error('A section with this name already exists in this ward');
  }

  // Step 4: Insert the section into the database
  const newSectionId = await sectionModel.createSection(cleanSectionName, wardId, userId);

  // Step 5: Fetch and return the newly created section record
  const createdSection = await sectionModel.findSectionById(newSectionId);
  return createdSection;
};

// This function updates an existing section's name
const updateSection = async (id, sectionData, userId) => {
  const { sectionName } = sectionData;

  // Step 1: Validate required fields
  if (!sectionName || !sectionName.trim()) {
    throw new Error('sectionName is required');
  }

  const cleanSectionName = sectionName.trim();

  // Step 2: Ensure the section exists before trying to update it
  const existingSection = await sectionModel.findSectionById(id);
  if (!existingSection) {
    throw new Error('Section not found');
  }

  // Step 3: Ensure no other section in this ward already has the new name
  const duplicateSection = await sectionModel.findSectionByNameInWard(
    cleanSectionName, 
    existingSection.wardId, 
    id
  );
  if (duplicateSection) {
    throw new Error('A section with this name already exists in this ward');
  }

  // Step 4: Perform the update
  await sectionModel.updateSectionName(id, cleanSectionName, userId);

  // Step 5: Fetch and return the updated section
  const updatedSection = await sectionModel.findSectionById(id);
  return updatedSection;
};

// This function deletes a section safely (only if no beds are attached to it)
const deleteSection = async (id) => {
  // Step 1: Check if the section exists
  const existingSection = await sectionModel.findSectionById(id);
  if (!existingSection) {
    throw new Error('Section not found');
  }

  // Step 2: Check if any beds belong to this section
  const bedCount = await sectionModel.countBedsBySectionId(id);
  if (bedCount > 0) {
    throw new Error('Cannot delete section because beds are currently assigned to it. Please reassign or delete the beds first.');
  }

  // Step 3: Perform the deletion
  await sectionModel.deleteSectionById(id);
  return true;
};

module.exports = {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
};
