import React from 'react';

// =============================================================================
// DataTable.jsx
// =============================================================================
// Purpose:
//   A reusable, styled data table with sticky headers.
// Props:
//   - columns (array): Array of column header strings.
//   - children (node): The <tbody> containing <tr> table rows.
//   - emptyMessage (string): Message to display if there are no rows.
//   - isEmpty (boolean): Whether to show the empty message instead of rows.
// =============================================================================

const DataTable = ({ columns, children, emptyMessage = 'No data available', isEmpty = false }) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
                <p>{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
