import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegisterForm = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/auth-info/register/",
        { email, password }
      );

      if (response.status === 201 || response.status === 200) {
        // ✅ Register success হলে Login পেজে redirect করো
        navigate("/login");
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card bg-base-100 mx-auto p-6 w-full max-w-sm shadow-2xl">
        <div className="card-body">
          <h1 className="text-3xl text-center font-bold">User Register</h1>

          {error && (
            <div className="text-red-600 text-sm p-2 bg-red-100 border border-red-400 rounded mt-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleRegisterForm}>
            {/* Email Input */}
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password Input */}
            <label className="label mt-2">
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

            {/* Links */}
            <div className="flex justify-between mt-4">
              <NavLink
                to="/login"
                className="link link-hover text-xs text-blue-600"
              >
                Already have an account?
              </NavLink>
            </div>

            {/* Submit Button */}
            <button
              className={`btn btn-neutral w-full mt-6 ${loading ? "loading" : ""}`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;