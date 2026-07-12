import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ─────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitops_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize errors ──────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (!response) {
      toast.error('Network error — please check your connection.');
      return Promise.reject(new Error('NETWORK_ERROR'));
    }

    const code = response.data?.error?.code || 'UNKNOWN_ERROR';
    const message = response.data?.error?.message || 'Something went wrong.';

    // Auto-redirect on expired/invalid token
    if (response.status === 401 && code !== 'INVALID_CREDENTIALS') {
      localStorage.removeItem('transitops_token');
      localStorage.removeItem('transitops_user');
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
      return Promise.reject({ code, message });
    }

    // Don't toast on 401 login failures — let the form handle it
    if (response.status !== 401) {
      toast.error(message);
    }

    return Promise.reject({ code, message, status: response.status });
  }
);

export default apiClient;
