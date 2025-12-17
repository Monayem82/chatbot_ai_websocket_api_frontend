import React, { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';

const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getUserData = async () => {
        try {
            const res = await api.get("user-info/");
            // ধরে নিচ্ছি রেসপন্স ফরম্যাট: { id: 1, name: '...', profile: { bio: '...', image: '...' } }
            setUser(res.data);
            console.log(user)
        } catch (err) {
            setUser(null);
            console.log('getUserData Error', err)
        } finally {
            setLoading(false);
        }
    };

    // অ্যাপ লোড হওয়ার সময় বা রিফ্রেশ করলে চেক করা
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            getUserData();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        try {
            const res = await api.post("login/", credentials);
            const { access, refresh } = res.data;

            localStorage.setItem("accessToken", access);
            localStorage.setItem("refreshToken", refresh);

            // লগইন সাকসেস হলে সাথে সাথে ইউজার ডাটা ফেচ করা
            await getUserData();
            return { success: true };
        } catch (error) {
            console.log('Login Not Success error', error)
            return { success: false, message: "Invalid credentials", error: error };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");

            // ১. ব্যাকএন্ডে কল দিয়ে টোকেন ব্ল্যাকলিস্ট করা
            if (refreshToken) {
                await api.post("logout/", { refresh: refreshToken });
            }
        } catch (error) {
            console.error("Logout failed on server:", error);
        } finally {
            // ২. লোকাল স্টোরেজ ক্লিন করা (সার্ভারে এরর আসুক বা না আসুক)
            localStorage.clear();
            setUser(null);
            // ইউজারকে লগইন পেজে পাঠিয়ে দেওয়া (অপশনাল, রাউটারেও করা যায়)
            console.log("Log out")
            window.location.href = '/login';
        }
    };


    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
