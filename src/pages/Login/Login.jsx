import React, { useState } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom'; // NavLink must be imported from 'react-router-dom'

// Note: Replace 'http://127.0.0.1:8000/auth-info/login/' with your actual deployed URL in production
const LOGIN_API_URL = 'http://127.0.0.1:8000/auth-info/login/';

const Login = () => {

    const navigate = useNavigate();
    // 1. Use State Hooks for managing form inputs and UI state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null); // To display error messages
    const [loading, setLoading] = useState(false); // To disable button during request

    const handleLoginForm = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setLoading(true); // Start loading

        const userLoginInfo = {
            username_or_email: email, // Assuming your Django API accepts this key
            password: password,
        };

        try {
            // 2. Axios POST request
            const response = await axios.post(LOGIN_API_URL, userLoginInfo);

            // Assuming the API returns a structure like: { token: '...' } or { access: '...', refresh: '...' }
            const { token, access } = response.data;
            
            // 3. Successful Login Handling
            console.log('Login Successful:', response.data);

            if (token || access) {
                // Store the token (e.g., in localStorage)
                localStorage.setItem('authToken', token || access);
                
                // TODO: User ke dashboard e redirect korun (e.g., using useNavigate hook)
                alert("Login successful! Redirecting to dashboard...");
                navigate('/dashboard'); 
            } else {
                // If token is not present in response, handle accordingly
                console.warn("Token not found in response data.");
            }

        } catch (err) {
            // 4. Detailed Error Handling
            if (err.response) {
                // Server responded with a status code outside the 2xx range
                console.error('Login Failed (Server Error):', err.response.data);
                
                // Try to display a user-friendly error from the server response
                const serverError = err.response.data.detail || err.response.data.non_field_errors?.[0] || 'Invalid credentials or API error.';
                setError(serverError);

            } else if (err.request) {
                // Request was made but no response received (e.g., API is down)
                console.error('Login Failed (No Response):', err.request);
                setError('Could not connect to the server. Please check the API status.');
                
            } else {
                // Something else happened in setting up the request that triggered an Error
                console.error('Error:', err.message);
                setError('An unexpected error occurred during login.');
            }
        } finally {
            setLoading(false); // Stop loading regardless of success or failure
        }
    };

    return (
        <div className="card bg-base-100 mx-auto p-2 m-4 w-full max-w-sm shrink-0 shadow-2xl">
            <div className="card-body">
                <h1 className="text-3xl text-center">User Login</h1>
                
                {/* 5. Display Error Message */}
                {error && (
                    <div className="text-red-600 text-sm p-2 bg-red-100 border border-red-400 rounded">
                        ⚠️ {error}
                    </div>
                )}
                
                <form onSubmit={handleLoginForm}>
                    {/* Email Input */}
                    <label className="label">
                        <span className="label-text">Email or Username</span>
                    </label>
                    <input 
                        type="text" // Changed from email to text to accommodate username_or_email
                        name="email" 
                        className="input input-bordered w-full" 
                        placeholder="Email or Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} // State update
                        required
                    />

                    {/* Password Input */}
                    <label className="label">
                        <span className="label-text">Password</span>
                    </label>
                    <input 
                        type="password" 
                        name="password" 
                        className="input input-bordered w-full" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} // State update
                        required
                    />
                    
                    {/* Links */}
                    <div className="flex justify-between mt-4">
                        <NavLink to="/forgot-password" className="link link-hover text-sm">Forgot Password?</NavLink>
                        <NavLink to="/register" className="link link-hover text-sm">Don't have an account?</NavLink>
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                        className="btn btn-neutral w-full mt-6" 
                        type="submit" 
                        disabled={loading} // Disable button when loading
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;