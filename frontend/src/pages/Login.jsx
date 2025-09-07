import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { status, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      nav("/dashboard");
    }
  }, [user, nav]);

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

        <label>email</label>
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
      <div className="text-red-400 bg-red-300"> daoud</div>
    </div>
  );
}
