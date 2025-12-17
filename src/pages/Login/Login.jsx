import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    
    // AuthContext থেকে login ফাংশনটি আনা হলো
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false);

    const handleLoginForm = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const credentials = {
            username_or_email: email, 
            password: password,
        };

        // AuthContext এর login ফাংশন কল করা হচ্ছে
        const result = await login(credentials);

        if (result.success) {
            // সাকসেস হলে ড্যাশবোর্ডে রিডাইরেক্ট
            console.log('Login Successful');
            navigate('/dashboard', { replace: true });
        } else {
            // এরর হলে মেসেজ সেট করা
            setError(result.message || 'Invalid email or password');
            setLoading(false); 
        }
    };

    return (
        <div className="card bg-base-100 mx-auto p-2 m-4 w-full max-w-sm shrink-0 shadow-2xl">
            <div className="card-body">
                <h1 className="text-3xl text-center font-bold">User Login</h1>
                
                {error && (
                    <div className="text-red-600 text-sm p-2 bg-red-100 border border-red-400 rounded mt-2">
                        ⚠️ {error}
                    </div>
                )}
                
                <form onSubmit={handleLoginForm}>
                    {/* Email/Username Input */}
                    <label className="label">
                        <span className="label-text">Email or Username</span>
                    </label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full" 
                        placeholder="Enter email or username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        required
                    />

                    {/* Password Input */}
                    <label className="label">
                        <span className="label-text">Password</span>
                    </label>
                    <input 
                        type="password" 
                        className="input input-bordered w-full" 
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                    />
                    
                    <div className="flex justify-between mt-4">
                        <NavLink to="/forgot-password" size="sm" className="link link-hover text-xs text-gray-500">Forgot Password?</NavLink>
                        <NavLink to="/register" className="link link-hover text-xs text-blue-600">Don't have an account?</NavLink>
                    </div>
                    
                    <button 
                        className={`btn btn-neutral w-full mt-6 ${loading ? 'loading' : ''}`} 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;