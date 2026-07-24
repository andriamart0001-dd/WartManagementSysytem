// =============================================================================
// axiosInstance.js — Configured Axios HTTP Client
// =============================================================================
// This module exports a custom Axios instance configured with our backend
// base URL. It also attaches a request interceptor to automatically add the
// JWT Bearer token from localStorage to every outgoing HTTP request.
// =============================================================================

import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

// Read the backend base URL from environment variables, or default to http://localhost:5000/api
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create the configured Axios instance
const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if present in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    // Read stored token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    // If token exists, attach to Authorization header using Bearer scheme
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Pass request errors along
    return Promise.reject(error);
  }
);

export default axiosInstance;
