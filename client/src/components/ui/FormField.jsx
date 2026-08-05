import React from 'react';

// =============================================================================
// FormField.jsx
// =============================================================================
// Purpose:
//   A reusable wrapper for form inputs, textareas, and selects.
//   Standardizes label display, input styling, and error message rendering.
// Props:
//   - label (string): The input label text.
//   - type (string): Input type (text, email, password, select, textarea). Default: text
//   - id (string): HTML id for the input (for accessibility binding).
//   - value (any): The controlled value of the input.
//   - onChange (function): Change handler.
//   - error (string): Optional validation error message.
//   - required (boolean): Whether to mark the label with an asterisk.
//   - options (array): Array of { value, label } objects for 'select' type.
//   - disabled (boolean): Disables the input.
//   - placeholder (string): Placeholder text.
// =============================================================================

const FormField = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  error,
  required = false,
  options = [],
  disabled = false,
  placeholder = ''
}) => {
  // Common classes for all input types
  const inputClass = `form-input ${error ? 'input-error' : ''}`;

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span style={{ color: 'var(--status-occupied)' }}>*</span>}
      </label>

      {/* Render Select Dropdown */}
      {type === 'select' ? (
        <select
          id={id}
          className={inputClass}
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="" disabled>Select an option...</option>
          {(Array.isArray(options) ? options : []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        /* Render Textarea */
        <textarea
          id={id}
          className={inputClass}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        /* Render Standard Input (text, number, email, password, date) */
        <input
          id={id}
          type={type}
          className={inputClass}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
        />
      )}

      {/* Render Error Message */}
      {error && (
        <span className="field-error-text">{error}</span>
      )}
    </div>
  );
};

export default FormField;
