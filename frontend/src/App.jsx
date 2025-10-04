import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HRDashboard from "./pages/HRDashboard"; // page for RH role
import UserAbsencesLayout from "./components/PageWithNavbarForUserAbsences";
import FormHeuresSup from "./components/FormHeuresSup";
import PrintPage from "./components/PrintableForm";
// Wrapper for protected routes
function ProtectedRoute({ children, role }) {
  const user = useSelector((state) => state.auth.user); // adjust to your slice
  if (!user) return <Navigate to="/login" replace />;

  // if role is required, check it
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />; // fallback for wrong role
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/absences/user/:userId/:view?"
          element={
            <ProtectedRoute>
              <UserAbsencesLayout />
            </ProtectedRoute>
          }
        />
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        <Route path='/form' element={<PrintPage />}/>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* RH dashboard */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute role="RH">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/form" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
