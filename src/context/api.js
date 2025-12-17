import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/auth-info/', // আপনার জ্যাঙ্গো ইউআরএল
});

// রিকোয়েস্ট পাঠানোর আগে টোকেন অ্যাড করা
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// রেসপন্স চেক করা (যদি ৪০১ এরর আসে তাহলে রিফ্রেশ টোকেন ব্যবহার করা)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    // নতুন এক্সেস টোকেনের জন্য রিকোয়েস্ট
                    const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                        refresh: refreshToken,
                    });

                    if (res.status === 200) {
                        localStorage.setItem('accessToken', res.data.access);
                        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                        return api(originalRequest); // আগের রিকোয়েস্টটি আবার পাঠানো
                    }
                } catch (refreshError) {
                    // রিফ্রেশ টোকেনও ইনভ্যালিড হলে লগআউট
                    refreshError
                    localStorage.clear();
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;