import React, { useState } from "react";
import { useSelector } from "react-redux";
import CalendarView from "./Calendar.jsx";
import ChartLineInteractive from "./ChartLineInteractive.jsx";
import AbsenceRequest from "./AbsenceRequest.jsx";
import AcceptedAbsencesDurationChart from "./rhChart.jsx";
import PendingRequests from "./PendingRequests.jsx";
import RejectedAbsences from "./RejectedAbsences.jsx";
export default function Sidebare() {
  const [view, setView] = useState("calendar");
  const { user } = useSelector((state) => state.auth);

  const navItem = (key, label) => (
    <button
      onClick={() => setView(key)}
      style={{
        padding: "10px 12px",
        textAlign: "left",
        width: "100%",
        border: "none",
        background: view === key ? "#e6ffea" : "transparent",
        cursor: "pointer",
        borderRadius: 8,
        fontWeight: 600,
        color: "#0b6a3a",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        padding: 18,
        fontFamily: "Inter, system-ui",
      }}
    >
      <aside style={{ width: 220, height: "100vh" }}>
        <div
          style={{
            height: "100%",
            background: "white",
            padding: 12,
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h3 className="text-black" style={{ marginTop: 0 }}>
            Menu
          </h3>
          <div
            className="text-red-900"
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {user.role === "user" && (
              <>
                {navItem("calendar", "Calendrier")}
                {navItem("chart", "Graphique")}
                {navItem("request", "Demande d'absence")}
                {navItem("rejected", "Absences refusées")}
              </>
            )}
            {user.role === "RH" && (
              <>
                {navItem("rhChart", "Graphique RH")}
                {navItem("Pending", "Demandes en attente")}
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1">
        {user.role === "user" && (
          <>
            {view === "calendar" && <CalendarView />}
            {view === "chart" && <ChartLineInteractive />}
            {view === "request" && <AbsenceRequest />}
            {view === "rejected" && <RejectedAbsences />}
          </>
        )}

        {user.role === "RH" && (
          <>
            {view === "rhChart" && <AcceptedAbsencesDurationChart />}
            {view === "Pending" && <PendingRequests />}
          </>
        )}
      </main>
    </div>
  );
}
