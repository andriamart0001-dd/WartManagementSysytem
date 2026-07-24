// =============================================================================
// main.jsx — React Application Entry Point
// =============================================================================
// Mounts the root App component into the DOM element with id="root".
// Imports global CSS styles.
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Create React root and render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
