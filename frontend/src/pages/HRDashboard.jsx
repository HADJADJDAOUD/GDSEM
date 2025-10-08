import React, { useState } from "react";
import { useSelector } from "react-redux";
import NavbarWithMenu from "../components/Navbar.jsx";

import CalendarView from "../components/Calendar.jsx";
import ChartLineInteractive from "../components/ChartLineInteractive.jsx";
import AbsenceRequest from "../components/AbsenceRequest.jsx";
import AcceptedAbsencesDurationChart from "../components/rhChart.jsx";
import PendingRequests from "../components/PendingRequests.jsx";
import RejectedAbsences from "../components/RejectedAbsences.jsx";
import AdminFormsPage from "../components/AdminFormsPage.jsx";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const defaultView = user?.role === "RH" ? "rhChart" : "calendar";
  const [view, setView] = useState(defaultView);

  return (
    <div style={styles.layout}>
      <NavbarWithMenu view={view} setView={setView} />

      <main style={styles.main}>
        <div style={styles.contentBox}>
          {/* USER DASHBOARD */}
          {user?.role === "user" && (
            <>
              {view === "calendar" && <CalendarView />}
              {view === "chart" && <ChartLineInteractive />}
              {view === "request" && <AbsenceRequest />}
              {view === "rejected" && <RejectedAbsences />}
            </>
          )}

          {/* HR DASHBOARD */}
          {user?.role === "RH" && (
            <>
              {view === "rhChart" && <AcceptedAbsencesDurationChart />}
              {view === "Pending" && <PendingRequests />}
              {view === "AdminFormsPage" && <AdminFormsPage />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f8fb",
  },
  main: {
    flex: 1,
    padding: "18px",
    overflowY: "auto",
  },
  contentBox: {
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 24px rgba(8,15,30,0.04)",
    minHeight: "70vh",
  },
};
