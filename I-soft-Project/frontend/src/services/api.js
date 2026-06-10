import axios from 'axios';

// Use relative paths to rely on Vite's local dev proxy
axios.defaults.baseURL = '';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default axios;
