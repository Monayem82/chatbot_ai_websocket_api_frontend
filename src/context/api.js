import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/', // আপনার Django URL
});

// Request interceptor → access token যোগ করা
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // শুধু access token invalid হলে refresh চেষ্টা করবে
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Refresh token দিয়ে নতুন access token নাও
          const res = await axios.post('http://localhost:8000/auth-info/api/token/refresh/', {
            refresh: refreshToken,
          });

          if (res.status === 200) {
            localStorage.setItem('accessToken', res.data.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
            return api(originalRequest); // আগের রিকোয়েস্ট আবার পাঠানো
          }
        } catch (refreshError) {
          // Refresh token invalid হলে logout
          console.error('Refresh token invalid:', refreshError);
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        // Refresh token না থাকলে সরাসরি logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;