import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Building2 } from "lucide-react";
import api from "../api/api"; // axios instance with baseURL & interceptors

export default function Login() {
  console.log("Login page rendered 2");
  console.log("API baseURL:", api.defaults.baseURL);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { status, error, token, user } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  // verify token on load if user exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          
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
  }, [token, nav, dispatch, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    if (!email || !password) return alert("email/password required");
    dispatch(login({ email, password }));
  };
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F3CB38' fill-opacity='0.2'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20c0-11.046-8.954-20-20-20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-200 font-">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo Placeholder - Replace with actual Algérie Poste logo */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="Algérie Poste Logo" />
            </div>

            <h1
              style={{ fontFamily: "Eurostile-Extended", fontWeight: 900 }}
              className="text-2xl text-gray-800 mb-2 "
            >
              Algérie Poste
            </h1>
            <p
              style={{ fontFamily: "Eurostile", fontWeight: 500 }}
              className="text-gray-600 font-medium text-sm "
            >
              Système de Gestion des Absences
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                style={{ fontFamily: "Eurostile", fontWeight: 500 }}
                className="text-sm text-gray-700 block "
              >
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="votre.email@poste.dz"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                style={{ fontFamily: "Eurostile", fontWeight: 500 }}
                className="text-sm font-medium text-gray-700 block"
              >
                Mot de Passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center  "
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {status === "failed" && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  {error}
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                fontFamily: "Eurostile",
                fontWeight: 700,
                background:
                  "linear-gradient(90deg, rgb(0, 61, 114) 0%, rgb(0, 91, 172) 50%, rgb(0, 62, 116) 100%)",
              }}
              className="w-full disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Connexion en cours...
                </div>
              ) : (
                "Se Connecter"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{ fontFamily: "Eurostile", fontWeight: 300 }}
          className="text-center mt-6 text-sm text-gray-600"
        >
          <p>© 2025 Algérie Poste. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
