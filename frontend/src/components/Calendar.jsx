"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Navigate,
  Views,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import addDays from "date-fns/addDays";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/api";

// 🎨 AlgeriePost Brand Colors — DO NOT MODIFY
const TYPE_COLOR = {
  conge: "#FFD84D",
  maladie: "#3B82F6",
  absence: "#F97316",
};

const TYPE_LABELS = {
  conge: "Congé",
  maladie: "Maladie",
  absence: "Absence",
};

function safeDate(d) {
  try {
    return d ? new Date(d) : null;
  } catch {
    return null;
  }
}

export default function CalendarView() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // UI controls
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAbsences();
  }, []);
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    "en-US": enUS,
  },
});
  const fetchAbsences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/absences/me");
      const data = res.data.data?.absences || res.data.data || [];
      const parsed = (Array.isArray(data) ? data : []).map((a) => ({
        ...a,
        startDate: safeDate(a.startDate),
        endDate: safeDate(a.endDate),
      }));
      setAbsences(parsed);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load absences"
      );
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    return absences
      .filter((a) => !a.removed)
      .map((a) => {
        const start = safeDate(a.startDate);
        const end = safeDate(a.endDate);
        const displayEnd = end ? new Date(end) : start;
        if (displayEnd) displayEnd.setDate(displayEnd.getDate() + 1);

        return {
          id: a._id || `${start}-${displayEnd}`,
          title: TYPE_LABELS[a.type] || a.type || "Absence",
          start: start || new Date(),
          end: displayEnd || new Date(),
          allDay: true,
          type: a.type,
          status: a.status,
          raw: a,
        };
      });
  }, [absences]);

  const filteredEvents = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return events.filter((ev) => {
      if (filterType !== "all" && ev.type !== filterType) return false;
      if (
        filterStatus !== "all" &&
        (ev.status || "").toLowerCase() !== filterStatus
      )
        return false;
      if (q) {
        const hay = `${ev.title} ${ev.raw?.reason || ""} ${
          ev.raw?.user?.username || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filterType, filterStatus, query]);

  const stats = useMemo(() => {
    const total = events.length;
    const today = new Date();
    const upcomingWindowEnd = addDays(today, 7);
    const upcoming = events.filter(
      (ev) => ev.start >= today && ev.start <= upcomingWindowEnd
    ).length;
    const pending = events.filter(
      (ev) => (ev.status || "").toLowerCase() === "pending"
    ).length;
    let longest = { days: 0, title: null, start: null, end: null };
    for (const ev of events) {
      const s = safeDate(ev.raw?.startDate);
      const e = safeDate(ev.raw?.endDate);
      if (!s || !e) continue;
      const days = differenceInCalendarDays(e, s) + 1;
      if (days > longest.days) {
        longest = { days, title: ev.title, start: s, end: e };
      }
    }
    const byType = events.reduce((acc, ev) => {
      acc[ev.type] = (acc[ev.type] || 0) + 1;
      return acc;
    }, {});
    return { total, upcoming, pending, longest, byType };
  }, [events]);

  const handleNavigate = useCallback((newDate) => setDate(newDate), []);
  const handleViewChange = useCallback((newView) => setView(newView), []);
  const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);
  const handleCloseModal = useCallback(() => setSelectedEvent(null), []);

  const eventStyleGetter = useCallback((event) => {
    const bg = TYPE_COLOR[event.type] || "#9CA3AF";
    const hex = bg.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const color = luminance > 0.6 ? "#111827" : "#ffffff";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "12px",
        color,
        border: "none",
        padding: "6px 12px",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        transform: "translateY(0)",
      },
    };
  }, []);

  const exportCSV = useCallback(() => {
    const header = ["Title,Type,Status,Start,End,Reason"].join(",");
    const rows = filteredEvents.map((ev) => {
      const r = ev.raw || {};
      const start = ev.start ? format(ev.start, "yyyy-MM-dd") : "";
      const end = r.endDate ? format(new Date(r.endDate), "yyyy-MM-dd") : "";
      const reason = (r.reason || "").replace(/"/g, '""');
      return `"${ev.title}","${ev.type || ""}","${
        ev.status || ""
      }","${start}","${end}","${reason}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absences_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents]);

  const upcomingList = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => ev.end >= now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);
  }, [events]);
console.log({ events, filteredEvents });
  return (
    <>
      <style>{`
        /* Modern UI Reset & Globals */
        .calendar-shell {
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Glass Cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 1px solid rgba(230, 233, 239, 0.6);
          box-shadow: 0 8px 32px rgba(8, 15, 30, 0.06);
          padding: 20px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          box-shadow: 0 12px 40px rgba(8, 15, 30, 0.1);
          transform: translateY(-2px);
        }

        /* Header */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          padding: 20px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #bbf7d0;
          box-shadow: 0 4px 12px rgba(11, 106, 58, 0.05);
        }
        .stat-card small {
          font-size: 13px;
          color: #4ade80;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-card strong {
          font-size: 28px;
          color: #0b6a3a;
          font-weight: 700;
          margin-top: 8px;
          display: block;
        }
        .stat-card .subtext {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        /* Filters */
        .filter-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          padding: 16px;
          background: rgba(240, 253, 244, 0.5);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .filter-input {
          flex: 1;
          min-width: 200px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .filter-input:focus {
          outline: none;
          border-color: #0b6a3a;
          box-shadow: 0 0 0 3px rgba(11, 106, 58, 0.1);
        }
        .filter-chip {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e5e7eb;
        }
        .filter-chip.active {
          background: #0b6a3a;
          color: white;
          border-color: #0b6a3a;
        }
        .filter-chip:hover:not(.active) {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        /* Layout */
        .main-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
          .sidebar {
            order: 2;
          }
        }

        /* Upcoming & Legend */
        .sidebar-section {
          margin-bottom: 24px;
        }
        .sidebar-section h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
        }
        .event-item {
          padding: 16px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        .event-item:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .event-type-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status.accepted {
          background: #dcfce7;
          color: #166534;
        }
        .status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Calendar Overrides */
        .rbc-calendar {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(8, 15, 30, 0.06);
        }
        .rbc-toolbar {
          background: rgba(240, 253, 244, 0.5);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid rgba(230, 233, 239, 0.6);
        }
        .rbc-toolbar button {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover,
        .rbc-toolbar button.rbc-active {
          background: #0b6a3a;
          color: white;
          border-color: #0b6a3a;
        }
        .rbc-toolbar-label {
          font-weight: 700;
          font-size: 18px;
          color: #111827;
        }
        .rbc-month-view,
        .rbc-time-view {
          border: none;
        }
        .rbc-day-bg {
          border-right: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }
        .rbc-today {
          background-color: rgba(11, 106, 58, 0.05) !important;
        }
        .rbc-off-range-bg {
          background: #f9fafb;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 32px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
          max-height: 90vh;
          overflow-y: auto;
          animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Buttons */
        .btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary {
          background: #0b6a3a;
          color: white;
        }
        .btn-primary:hover {
          background: #085530;
        }
        .btn-secondary {
          background: white;
          color: #0b6a3a;
          border: 1px solid #e5e7eb;
        }
        .btn-secondary:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        /* Empty States */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
        .empty-state svg {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        /* Loading Skeleton (optional) */
        .skeleton {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      <div className="calendar-shell">
        {/* Header */}
        <div className="header-section">
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0b6a3a",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              Calendrier des Absences
            </h1>
            <p
              style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "16px" }}
            >
              Gérez et visualisez toutes vos absences en un coup d'œil.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={fetchAbsences} className="btn btn-secondary">
              🔄 Actualiser
            </button>
            <button onClick={exportCSV} className="btn btn-primary">
              ⤓ Exporter CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <small>Total Absences</small>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <small>À Venir (7j)</small>
            <strong>{stats.upcoming}</strong>
          </div>
          <div className="stat-card">
            <small>En Attente</small>
            <strong>{stats.pending}</strong>
          </div>
          <div className="stat-card">
            <small>Plus Longue</small>
            <strong>
              {stats.longest.days > 0 ? `${stats.longest.days} jour(s)` : "—"}
            </strong>
            {stats.longest.title && (
              <div className="subtext">
                {stats.longest.title} •{" "}
                {stats.longest.start
                  ? format(stats.longest.start, "dd MMM yyyy")
                  : "—"}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Rechercher par motif, type..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="filter-input"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div
              className={`filter-chip ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              Tous les types
            </div>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <div
                key={key}
                className={`filter-chip ${filterType === key ? "active" : ""}`}
                onClick={() => setFilterType(key)}
                style={{
                  backgroundColor:
                    filterType === key ? TYPE_COLOR[key] : "transparent",
                  color: filterType === key ? "#fff" : "#4b5563",
                  border: `1px solid ${TYPE_COLOR[key]}`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div
              className={`filter-chip ${
                filterStatus === "all" ? "active" : ""
              }`}
              onClick={() => setFilterStatus("all")}
            >
              Tous statuts
            </div>
            {["pending", "accepted", "rejected"].map((status) => (
              <div
                key={status}
                className={`filter-chip ${
                  filterStatus === status ? "active" : ""
                }`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Main Layout */}
        <div className="main-layout">
          {/* Calendar */}
          <div className="glass-card">
            <div style={{ marginBottom: 16, color: "#6b7280", fontSize: 14 }}>
              Affichage de {filteredEvents.length} événement(s)
            </div>
            <div className="rbc-calendar">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 700 }}
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                components={{
                  toolbar: ({
                    date: toolbarDate,
                    view: toolbarView,
                    onNavigate,
                    onView,
                  }) => {
                    const label = () => {
                      const d = toolbarDate;
                      if (toolbarView === Views.DAY)
                        return format(d, "EEEE, MMMM dd, yyyy");
                      if (toolbarView === Views.WEEK) {
                        const start = startOfWeek(d, { weekStartsOn: 0 });
                        const end = addDays(start, 6);
                        return `${format(start, "MMM d")} - ${format(
                          end,
                          "MMM d, yyyy"
                        )}`;
                      }
                      return format(d, "MMMM yyyy");
                    };
                    return (
                      <div className="rbc-toolbar">
                        <div>
                          <button
                            onClick={() => onView(Views.MONTH)}
                            className={
                              toolbarView === Views.MONTH ? "rbc-active" : ""
                            }
                          >
                            Mois
                          </button>
                          <button
                            onClick={() => onView(Views.WEEK)}
                            className={
                              toolbarView === Views.WEEK ? "rbc-active" : ""
                            }
                          >
                            Semaine
                          </button>
                          <button
                            onClick={() => onView(Views.DAY)}
                            className={
                              toolbarView === Views.DAY ? "rbc-active" : ""
                            }
                          >
                            Jour
                          </button>
                        </div>
                        <span className="rbc-toolbar-label">{label()}</span>
                        <div>
                          <button onClick={() => onNavigate(Navigate.TODAY)}>
                            Aujourd'hui
                          </button>
                          <button onClick={() => onNavigate(Navigate.PREVIOUS)}>
                            ‹
                          </button>
                          <button onClick={() => onNavigate(Navigate.NEXT)}>
                            ›
                          </button>
                        </div>
                      </div>
                    );
                  },
                }}
                messages={{
                  today: "Aujourd'hui",
                  previous: "Précédent",
                  next: "Suivant",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Heure",
                  event: "Événement",
                  noEventsInRange: "Aucun événement dans cette période",
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Upcoming */}
            <div className="glass-card sidebar-section">
              <h4>Prochaines Absences</h4>
              <small style={{ color: "#6b7280" }}>
                Les 5 prochaines absences
              </small>
              {upcomingList.length === 0 ? (
                <div className="empty-state">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>Aucune absence à venir</p>
                </div>
              ) : (
                <div>
                  {upcomingList.map((ev) => {
                    const s = ev.start ? format(ev.start, "dd MMM") : "—";
                    const e = ev.raw?.endDate
                      ? format(new Date(ev.raw.endDate), "dd MMM")
                      : "—";
                    return (
                      <div key={ev.id} className="event-item">
                        <div className="event-header">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              className="event-type-dot"
                              style={{ backgroundColor: TYPE_COLOR[ev.type] }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>
                                {ev.title}
                              </div>
                              <div style={{ color: "#6b7280", fontSize: 13 }}>
                                {s} → {e}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              className={`status-badge status ${
                                ev.status || "pending"
                              }`}
                            >
                              {(ev.status || "pending").toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12, textAlign: "right" }}>
                          <button
                            onClick={() => setSelectedEvent(ev)}
                            className="btn btn-secondary"
                            style={{ padding: "6px 12px", fontSize: 13 }}
                          >
                            Voir Détails
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="glass-card sidebar-section">
              <h4>Légende</h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {Object.entries(TYPE_COLOR).map(([key, color]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: "rgba(249, 250, 251, 0.7)",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        background: color,
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>
                      {TYPE_LABELS[key] || key}
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {events.filter((e) => e.type === key).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="glass-card sidebar-section">
              <h4>Astuces</h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  color: "#374151",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <li>Cliquez sur un événement pour voir les détails.</li>
                <li>Filtrez par type ou statut pour une vue ciblée.</li>
                <li>Exportez en CSV pour un audit hors ligne.</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Event Modal */}
        {selectedEvent && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 24,
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#0b6a3a", fontSize: 24 }}>
                    {selectedEvent.title}
                  </h2>
                  <div style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>
                    {format(selectedEvent.start, "dd MMMM yyyy")} →{" "}
                    {selectedEvent.raw?.endDate
                      ? format(
                          new Date(selectedEvent.raw.endDate),
                          "dd MMMM yyyy"
                        )
                      : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className={`status-badge status ${
                      selectedEvent.status || "pending"
                    }`}
                    style={{ marginBottom: 12 }}
                  >
                    {(selectedEvent.status || "pending").toUpperCase()}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {selectedEvent.raw?.reason && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <h3
                      style={{
                        color: "#1f2937",
                        fontSize: 18,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Motif
                    </h3>
                    <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
                      {selectedEvent.raw.reason}
                    </p>
                  </div>
                </>
              )}

              {selectedEvent.raw?.proofUrl && (
                <div style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      color: "#1f2937",
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Justificatif
                  </h3>
                  {/\.(jpg|jpeg|png|gif)$/i.test(selectedEvent.raw.proofUrl) ? (
                    <a
                      href={selectedEvent.raw.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "block" }}
                    >
                      <img
                        src={selectedEvent.raw.proofUrl}
                        alt="Justificatif"
                        style={{
                          maxWidth: "100%",
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={selectedEvent.raw.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      📄 Télécharger le fichier
                    </a>
                  )}
                </div>
              )}

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading & Error States */}
        {loading && (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
          >
            <div
              className="skeleton"
              style={{ height: "20px", width: "200px", margin: "0 auto 16px" }}
            ></div>
            <div
              className="skeleton"
              style={{ height: "400px", width: "100%", borderRadius: "16px" }}
            ></div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "20px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "12px",
              border: "1px solid #fecaca",
            }}
          >
            <strong>Erreur :</strong> {error}
          </div>
        )}
      </div>
    </>
  );
}

