import React, { useState } from "react";
import { useSelector } from "react-redux";
import NavbarWithMenu from "../components/Navbar.jsx";

import CalendarView from "../components/Calendar.jsx";
import ChartLineInteractive from "../components/ChartLineInteractive.jsx";
import AbsenceRequest from "../components/AbsenceRequest.jsx";
import AcceptedAbsencesDurationChart from "../components/rhChart.jsx";
import PendingRequests from "../components/PendingRequests.jsx";
import RejectedAbsences from "../components/RejectedAbsences.jsx";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const defaultView = user?.role === "RH" ? "rhChart" : "calendar";
  const [view, setView] = useState(defaultView);

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fb" }}>
      <NavbarWithMenu view={view} setView={setView} />

      <main style={{ padding: 18 }}>
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 8px 24px rgba(8,15,30,0.04)",
            minHeight: "70vh",
          }}
        >
          {user?.role === "user" && (
            <>
              {view === "calendar" && <CalendarView />}
              {view === "chart" && <ChartLineInteractive />}
              {view === "request" && <AbsenceRequest />}
              {view === "rejected" && <RejectedAbsences />}
            </>
          )}

          {user?.role === "RH" && (
            <>
              {view === "rhChart" && <AcceptedAbsencesDurationChart />}
              {view === "Pending" && <PendingRequests />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
