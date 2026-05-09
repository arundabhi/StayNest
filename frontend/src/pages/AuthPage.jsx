import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.config";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [params] = useSearchParams();

  const redirect = params.get("redirect")
    ? decodeURIComponent(params.get("redirect"))
    : "/";

  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    otp: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setForm({
      name: "",
      email: "",
      password: "",
      mobileNumber: "",
      otp: "",
    });
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      return setError("Email and password are required");
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post(
        "/auth/login",
        {
          email: form.email,
          password: form.password,
        }
      );
      await login(res.data.accessToken);

      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.mobileNumber) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post(
        "/auth/register",
        {
          name: form.name,
          email: form.email,
          password: form.password,
          mobileNumber: form.mobileNumber,
        }
      );


      if (res.data.accessToken) {
        await login(res.data.accessToken);
      }

      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      return setError("Email is required");
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/forgot-password", {
        email: form.email,
      });


      switchMode("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async () => {
    if (!form.email || !form.otp || !form.password) {
      return setError("All fields are required");
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/reset-password", {
        otp: form.otp.trim(),
        email: form.email,
        newPassword: form.password,
      });


      switchMode("login");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {mode === "login" && "Login"}
          {mode === "register" && "Create Account"}
          {mode === "forgot" && "Forgot Password"}
          {mode === "reset" && "Reset Password"}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}


        {mode === "register" && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              className="input"
            />
            <input
              type="tel"
              name="mobileNumber"
              placeholder="Mobile Number"
              onChange={handleChange}
              className="input"
            />
          </>
        )}


        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="input"
        />


        {(mode === "login" || mode === "register" || mode === "reset") && (
          <input
            type="password"
            name="password"
            placeholder={mode === "reset" ? "New Password" : "Password"}
            onChange={handleChange}
            className="input"
          />
        )}


        {mode === "reset" && (
          <input
            type="text"
            name="otp"
            placeholder="OTP"
            onChange={handleChange}
            className="input"
          />
        )}


        <button
          type="button"
          disabled={loading}
          onClick={
            mode === "login"
              ? handleLogin
              : mode === "register"
                ? handleRegister
                : mode === "forgot"
                  ? handleForgotPassword
                  : handleResetPassword
          }
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mt-4 disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Continue"}
        </button>


        <div className="text-center text-sm mt-6 space-y-2">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-blue-600 hover:underline block"
              >
                Forgot password?
              </button>

              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-gray-600 hover:underline"
              >
                Don’t have an account? Register
              </button>
            </>
          )}

          {mode !== "login" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-gray-600 hover:underline"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
