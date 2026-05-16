import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "./api";   

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = { email, password };
      const res = await api.post("/api/auth/admin-login/", payload);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("is_admin", "true");
      localStorage.setItem("role","admin");
      navigate("/admin/dashboard");

    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid admin credentials";

      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Admin Login</h2>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label>Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <div className="relative mt-1">
              <input
                className="w-full rounded-xl border px-3 py-2 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="w-full bg-black text-white py-2 rounded-xl">
            Login as Admin
          </button>
        </form>

        <p className="mt-4 text-sm">
          Not admin?{" "}
          <Link to="/login" className="font-medium">
            User Login
          </Link>
        </p>
      </div>
    </div>
  );
}