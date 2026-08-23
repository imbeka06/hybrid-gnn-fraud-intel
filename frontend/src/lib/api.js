// Single source of truth for the backend base URL.
// In development: set VITE_API_BASE_URL in frontend/.env
// In production:  set the environment variable on Netlify / Vercel / Render
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default API_BASE;
