import axios from 'axios';

// Use VITE_API_URL in production, or fallback to relative paths in local development
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default axios;
