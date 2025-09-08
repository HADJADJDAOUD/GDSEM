import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // axios instance with baseURL & interceptors

export default function Login() {
  console.log("Login page rendered 2");
  console.log("API baseURL:", api.defaults.baseURL);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { status, error, token, user } = useSelector((state) => state.auth);

  // verify token on load if user exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          console.log("Verifying token... in login page", token);
          await api.get("/verifyToken", {
            headers: { Authorization: `Bearer ${token}` },
          });
          // valid → navigate to dashboard
          console.log("Token valid, navigating to dashboard from login page");
          if (user.role === "RH") nav("/hr");
          else nav("/Dashboard");
        } catch (err) {
          // invalid/expired token → logout
          dispatch(logout());
        }
      }
    };
    verifyUser();
  }, [token, nav, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    if (!email || !password) return alert("email/password required");
    dispatch(login({ email, password }));
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="brand">Algérie Poste — Absences</h2>

        <label>Email</label>
        <input name="email" placeholder="email" autoComplete="email" />

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="password"
          autoComplete="current-password"
        />

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Login"}
        </button>

        {status === "failed" && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
