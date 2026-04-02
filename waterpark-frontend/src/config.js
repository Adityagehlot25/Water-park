// API Configuration - loads from environment variables or defaults
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5000`
  : `${window.location.protocol}//${window.location.host.replace(/:\d+$/, '')}:5000`;

export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || API_BASE_URL,
};

export default config;
