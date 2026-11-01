// =============================================================================
// sectionController.js — HTTP Handlers for Ward Sections
// =============================================================================
// This file handles HTTP requests for section-related routes.
// It extracts request data, delegates processing to sectionService.js,
// and sends back structured, beginner-friendly JSON responses.
// =============================================================================

const sectionService = require('./sectionService');

// This handler gets all sections, optionally filtered by wardId (?wardId=1)
const getSections = async (req, res) => {
  try {
    const wardId = req.query.wardId;
    const sections = await sectionService.getSections(wardId);

    return res.status(200).json({
      message: 'Sections retrieved successfully',
      count: sections.length,
      sections: sections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return res.status(500).json({
      message: 'Error retrieving sections'
    });
  }
};

// This handler gets a single section by its ID (/api/sections/:id)
const getSectionById = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const section = await sectionService.getSectionById(sectionId);

    return res.status(200).json({
      message: 'Section retrieved successfully',
      section: section
    });
  } catch (error) {
    if (error.message === 'Section not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error fetching section by ID:', error);
    return res.status(500).json({
      message: 'Error retrieving section'
    });
  }
};

// This handler creates a new section (POST /api/sections)
const createSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const newSection = await sectionService.createSection(req.body, userId);

    return res.status(201).json({
      message: 'Section created successfully',
      section: newSection
    });
  } catch (error) {
    if (error.message === 'Ward not found') {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes('required') || 
      error.message.includes('already exists')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating section:', error);
    return res.status(500).json({
      message: 'Error creating section'
    });
  }
};

// This handler updates a section's name (PUT /api/sections/:id)
const updateSection = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const userId = req.user.id;
    const updatedSection = await sectionService.updateSection(sectionId, req.body, userId);

    return res.status(200).json({
      message: 'Section updated successfully',
      section: updatedSection
    });
  } catch (error) {
    if (error.message === 'Section not found') {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes('required') || 
      error.message.includes('already exists')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error updating section:', error);
    return res.status(500).json({
      message: 'Error updating section'
    });
  }
};

// This handler deletes a section (DELETE /api/sections/:id)
const deleteSection = async (req, res) => {
  try {
    const sectionId = req.params.id;
    await sectionService.deleteSection(sectionId);

    return res.status(200).json({
      message: 'Section deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Section not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('assigned to it')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error deleting section:', error);
    return res.status(500).json({
      message: 'Error deleting section'
    });
  }
};

module.exports = {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
};
